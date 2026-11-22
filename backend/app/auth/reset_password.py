"""Redefinição de senha pela operação (spec 0059).

Uso: `python -m app.auth.reset_password EMAIL`. A senha é lida sem eco, duas vezes, e nunca
aceita como argumento. Confirme a identidade de quem pede fora do sistema antes de rodar.
"""

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.auth.accounts import AccountRuleError, account_rule_violations, normalize_email
from app.auth.security import hash_password
from app.products.models import User, UserSession


class AccountNotFound(LookupError):
    def __init__(self) -> None:
        super().__init__("Nenhuma conta com este e-mail.")


def reset_password(session: Session, email: str, password: str) -> None:
    """Valida, troca o hash e encerra as sessões da conta; confirma tudo numa transação."""
    user = session.scalar(select(User).where(User.email == normalize_email(email)))
    if user is None:
        raise AccountNotFound()
    # O e-mail guardado já é válido: só a violação de senha pode aparecer.
    violations = account_rule_violations(user.email, password)
    if violations:
        raise AccountRuleError(violations)
    try:
        session.execute(delete(UserSession).where(UserSession.user_id == user.id))
        user.password_hash = hash_password(password)
        session.commit()
    except Exception:
        session.rollback()
        raise
