import argparse
import getpass

from sqlalchemy.orm import Session

from app.auth.accounts import add_account, utf8_encodable
from app.db import create_database_engine
from app.products.models import User


def provision_user(session: Session, email: str, password: str) -> User:
    """Cria a conta com as mesmas regras do cadastro (AccountRuleError/EmailAlreadyRegistered)."""
    user = add_account(session, email, password)
    session.commit()
    return user


def main() -> None:
    parser = argparse.ArgumentParser(description="Provisiona uma conta BestPrice no banco configurado")
    parser.add_argument("email")
    args = parser.parse_args()
    password = getpass.getpass("Senha (12 a 1024 caracteres): ")
    confirmation = getpass.getpass("Confirme a senha: ")
    if password != confirmation:
        parser.error("As senhas não conferem")
    if not utf8_encodable(args.email):
        parser.error("O e-mail contém caracteres inválidos.")
    if not utf8_encodable(password):
        parser.error("A senha contém caracteres inválidos.")
    with Session(create_database_engine()) as session:
        try:
            provision_user(session, args.email, password)
        except ValueError as exc:
            parser.error(str(exc))
    print("Conta criada")


if __name__ == "__main__":
    main()
