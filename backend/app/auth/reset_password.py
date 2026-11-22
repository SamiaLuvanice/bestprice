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


def find_account(session: Session, email: str) -> User:
    """Conta pelo e-mail normalizado como no login; AccountNotFound se não houver."""
    user = session.scalar(select(User).where(User.email == normalize_email(email)))
    if user is None:
        raise AccountNotFound()
    return user


def reset_password(session: Session, email: str, password: str) -> None:
    """Valida, troca o hash e encerra as sessões da conta; confirma tudo numa transação."""
    user = find_account(session, email)
    # O e-mail guardado já é válido: só a violação de senha pode aparecer.
    violations = account_rule_violations(user.email, password)
    if violations:
        raise AccountRuleError(violations)
    try:
        # Espera logins que já leram a conta (FOR SHARE) e bloqueia os novos até o commit.
        session.scalar(select(User.id).where(User.id == user.id).with_for_update())
        session.execute(delete(UserSession).where(UserSession.user_id == user.id))
        user.password_hash = hash_password(password)
        session.commit()
    except Exception:
        session.rollback()
        raise


def _read_new_password(parser: argparse.ArgumentParser) -> str:
    password = getpass.getpass("Nova senha (12 a 1024 caracteres): ")
    confirmation = getpass.getpass("Confirme a nova senha: ")
    if password != confirmation:
        parser.error("As senhas não conferem")
    if not utf8_encodable(password):
        parser.error("A senha contém caracteres inválidos.")
    return password


def main() -> None:
    parser = argparse.ArgumentParser(
        allow_abbrev=False,
        description="Redefine a senha de uma conta BestPrice e encerra as sessões dela. "
        "Confirme a identidade de quem pede antes de rodar.",
    )
    parser.add_argument("email")
    # parse_known_args: o erro padrão do argparse repetiria o argumento extra, que pode ser a senha.
    args, extra = parser.parse_known_args()
    if extra:
        parser.error("Argumentos não reconhecidos; a senha é solicitada no terminal.")
    if not utf8_encodable(args.email):
        parser.error("O e-mail contém caracteres inválidos.")
    engine = create_database_engine()
    # Confere a conta antes dos prompts; a transação de leitura termina antes de a operação digitar.
    with Session(engine) as session:
        try:
            find_account(session, args.email)
        except AccountNotFound as exc:
            parser.error(str(exc))
    password = _read_new_password(parser)
    with Session(engine) as session:
        try:
            reset_password(session, args.email, password)
        except (AccountNotFound, AccountRuleError) as exc:
            parser.error(str(exc))
    print("Senha redefinida; sessões encerradas")


if __name__ == "__main__":
    main()
