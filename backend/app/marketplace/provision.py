"""Provision initial operator OAuth tokens from a trusted terminal."""

import getpass
import os
from datetime import UTC, datetime, timedelta

from cryptography.fernet import Fernet
from sqlalchemy.orm import Session

from app.db import create_database_engine
from app.marketplace.oauth import provision_operator_tokens


def main() -> None:
    key = os.environ.get("MERCADOLIVRE_OAUTH_KEY")
    if not key:
        raise SystemExit("Configure MERCADOLIVRE_OAUTH_KEY antes do provisionamento")
    try:
        Fernet(key.encode())
    except (TypeError, ValueError) as exc:
        raise SystemExit("MERCADOLIVRE_OAUTH_KEY inválida") from exc
    access_token = getpass.getpass("Access token da conta operadora: ")
    refresh_token = getpass.getpass("Refresh token da conta operadora: ")
    try:
        lifetime = int(input("Validade restante do access token em segundos: "))
    except ValueError as exc:
        raise SystemExit("Validade inválida") from exc
    if lifetime <= 300:
        raise SystemExit("A validade deve superar cinco minutos")
    with Session(create_database_engine()) as session:
        provision_operator_tokens(
            session, key.encode(), access_token, refresh_token,
            datetime.now(UTC) + timedelta(seconds=lifetime),
        )
    print("Credenciais operadoras armazenadas")


if __name__ == "__main__":
    main()
