"""Regras de conta compartilhadas por cadastro, login e linha de comando.

A expressão de e-mail é a tradução literal da usada pelo frontend
(`/^[^\\s@]+@[^\\s@.]+(\\.[^\\s@.]+)+$/`), para que as duas pontas concordem.
Os comprimentos são contados em code points (`len` de `str`).
"""

import re
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.security import hash_password
from app.products.models import User

EMAIL_MAX_CHARS = 320
PASSWORD_MIN_CHARS = 12
PASSWORD_MAX_CHARS = 1024
EMAIL_PATTERN = re.compile(r"[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+")


@dataclass(frozen=True)
class RuleViolation:
    field: str
    code: str
    message: str


EMAIL_TOO_LONG = RuleViolation("email", "email_too_long", "O e-mail pode ter no máximo 320 caracteres.")
EMAIL_REQUIRED = RuleViolation("email", "email_required", "Informe seu e-mail.")
EMAIL_INVALID = RuleViolation("email", "email_invalid", "Informe um e-mail válido, como nome@exemplo.com.")
PASSWORD_TOO_SHORT = RuleViolation(
    "password", "password_too_short", "A senha precisa ter pelo menos 12 caracteres.",
)
PASSWORD_TOO_LONG = RuleViolation(
    "password", "password_too_long", "A senha pode ter no máximo 1024 caracteres.",
)


def normalize_email(raw: str) -> str:
    return raw.strip().lower()


def _email_violation(raw: str) -> RuleViolation | None:
    # O limite vale para o valor como digitado, antes de tirar os espaços das pontas.
    if len(raw) > EMAIL_MAX_CHARS:
        return EMAIL_TOO_LONG
    stripped = raw.strip()
    if not stripped:
        return EMAIL_REQUIRED
    if EMAIL_PATTERN.fullmatch(stripped) is None:
        return EMAIL_INVALID
    return None


def _password_violation(password: str) -> RuleViolation | None:
    if len(password) < PASSWORD_MIN_CHARS:
        return PASSWORD_TOO_SHORT
    if len(password) > PASSWORD_MAX_CHARS:
        return PASSWORD_TOO_LONG
    return None


def account_rule_violations(email: str, password: str) -> list[RuleViolation]:
    """Primeira regra violada de cada campo, e-mail antes da senha."""
    return [item for item in (_email_violation(email), _password_violation(password)) if item is not None]


class AccountRuleError(ValueError):
    def __init__(self, violations: list[RuleViolation]) -> None:
        super().__init__("Dados de conta inválidos")
        self.violations = violations


class EmailAlreadyRegistered(ValueError):
    def __init__(self) -> None:
        super().__init__("Já existe uma conta com este e-mail.")


def add_account(session: Session, email: str, password: str) -> User:
    """Valida, gera o hash e insere a conta sem confirmar a transação.

    Não há pré-consulta de duplicidade: a restrição única de `users.email` é a fonte de
    verdade, o que também cobre dois cadastros simultâneos do mesmo e-mail.
    """
    violations = account_rule_violations(email, password)
    if violations:
        raise AccountRuleError(violations)
    normalized = normalize_email(email)
    user = User(email=normalized, password_hash=hash_password(password))
    session.add(user)
    try:
        session.flush()
    except IntegrityError:
        session.rollback()
        if session.scalar(select(User.id).where(User.email == normalized)) is None:
            raise
        raise EmailAlreadyRegistered() from None
    return user
