"""Regras de conta compartilhadas por cadastro, login e linha de comando.

A regra de e-mail é idêntica à de `frontend/src/auth/accountRules.ts`. Ela não usa a classe de
espaços do regex nem `str.strip()` padrão, cujas definições de espaço diferem entre Python e JavaScript:

- normalização: tira só os espaços ASCII das pontas (EMAIL_EDGE_WHITESPACE) e passa a minúsculas;
- formato `^[^F]+@[^F.]+([.][^F.]+)+$` (estrutura do LoginForm), em que F é FORBIDDEN_EMAIL_RANGES.

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
EMAIL_EDGE_WHITESPACE = "".join(map(chr, (0x20, 0x09, 0x0A, 0x0D, 0x0C, 0x0B)))  # espaço, TAB, LF, CR, FF, VT
# `@`, controles C0 e espaço, DEL e controles C1, NBSP e os separadores/espaços Unicode, BOM.
FORBIDDEN_EMAIL_RANGES = (
    (0x40, 0x40), (0x00, 0x20), (0x7F, 0x9F), (0xA0, 0xA0), (0x1680, 0x1680), (0x2000, 0x200A),
    (0x2028, 0x2029), (0x202F, 0x202F), (0x205F, 0x205F), (0x3000, 0x3000), (0xFEFF, 0xFEFF),
)
_FORBIDDEN = "".join(
    re.escape(chr(first)) if first == last else f"{re.escape(chr(first))}-{re.escape(chr(last))}"
    for first, last in FORBIDDEN_EMAIL_RANGES
)
_LOCAL = f"[^{_FORBIDDEN}]+"
_LABEL = f"[^{_FORBIDDEN}.]+"
# Estrutura do LoginForm: ^[^F]+@[^F.]+([.][^F.]+)+$ (domínio sem ponto vazio).
EMAIL_PATTERN = re.compile(f"{_LOCAL}@{_LABEL}(?:[.]{_LABEL})+")


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
    return raw.strip(EMAIL_EDGE_WHITESPACE).lower()


def _email_violation(raw: str) -> RuleViolation | None:
    # O limite vale para o valor como digitado, antes de tirar os espaços das pontas.
    if len(raw) > EMAIL_MAX_CHARS:
        return EMAIL_TOO_LONG
    stripped = raw.strip(EMAIL_EDGE_WHITESPACE)
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


def utf8_encodable(value: str) -> bool:
    """Falso para surrogates isolados (JSON aceita o escape, mas o texto não existe em UTF-8).

    Fica fora da classe proibida compartilhada: em JavaScript não há string equivalente.
    """
    try:
        value.encode("utf-8")
    except UnicodeEncodeError:
        return False
    return True


def account_rule_violations(email: str, password: str) -> list[RuleViolation]:
    """Primeira regra violada de cada campo, e-mail antes da senha."""
    return [item for item in (_email_violation(email), _password_violation(password)) if item is not None]


class AccountRuleError(ValueError):
    def __init__(self, violations: list[RuleViolation]) -> None:
        super().__init__(" ".join(item.message for item in violations))
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
