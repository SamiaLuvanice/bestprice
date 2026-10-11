import argparse
import getpass

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.security import hash_password
from app.db import create_database_engine
from app.products.models import User


def provision_user(session: Session, email: str, password: str) -> User:
    normalized = email.strip().lower()
    if not normalized or "@" not in normalized or len(normalized) > 320:
        raise ValueError("E-mail inválido")
    if session.scalar(select(User).where(User.email == normalized)) is not None:
        raise ValueError("Usuário já existe")
    user = User(email=normalized, password_hash=hash_password(password))
    session.add(user)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise ValueError("Usuário já existe") from exc
    return user


def main() -> None:
    parser = argparse.ArgumentParser(description="Provisiona uma conta BestPrice no banco configurado")
    parser.add_argument("email")
    args = parser.parse_args()
    password = getpass.getpass("Senha (mínimo 12 caracteres): ")
    confirmation = getpass.getpass("Confirme a senha: ")
    if password != confirmation:
        parser.error("As senhas não conferem")
    with Session(create_database_engine()) as session:
        try:
            provision_user(session, args.email, password)
        except ValueError as exc:
            parser.error(str(exc))
    print("Conta criada")


if __name__ == "__main__":
    main()
