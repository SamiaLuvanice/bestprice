"""Redefinição de senha pela operação (spec 0059).

Uso: `python -m app.auth.reset_password EMAIL`. A senha é lida sem eco, duas vezes, e nunca
aceita como argumento. Confirme a identidade de quem pede fora do sistema antes de rodar.
"""

import argparse
import getpass

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.auth.accounts import (
    AccountRuleError,
    account_rule_violations,
    normalize_email,
    utf8_encodable,
)
from app.auth.security import hash_password
from app.db import create_database_engine
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


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Redefine a senha de uma conta BestPrice e encerra as sessões dela. "
        "Confirme a identidade de quem pede antes de rodar.",
    )
    parser.add_argument("email")
    args = parser.parse_args()
    password = getpass.getpass("Nova senha (12 a 1024 caracteres): ")
    confirmation = getpass.getpass("Confirme a nova senha: ")
    if password != confirmation:
        parser.error("As senhas não conferem")
    if not utf8_encodable(args.email):
        parser.error("O e-mail contém caracteres inválidos.")
    if not utf8_encodable(password):
        parser.error("A senha contém caracteres inválidos.")
    with Session(create_database_engine()) as session:
        try:
            reset_password(session, args.email, password)
        except (AccountNotFound, AccountRuleError) as exc:
            parser.error(str(exc))
    print("Senha redefinida; sessões encerradas")


if __name__ == "__main__":
    main()
