"""Print an official authorization URL for the operator's Mercado Livre account."""

import os

from cryptography.fernet import Fernet

from app.marketplace.oauth_setup import build_authorization_url


def main() -> None:
    client_id = os.environ.get("MERCADOLIVRE_CLIENT_ID", "")
    key = os.environ.get("MERCADOLIVRE_OAUTH_KEY", "").encode()
    redirect_uri = os.environ.get("MERCADOLIVRE_REDIRECT_URI", "")
    if not client_id or not key or not redirect_uri:
        raise SystemExit(
            "Configure MERCADOLIVRE_CLIENT_ID, MERCADOLIVRE_OAUTH_KEY e "
            "MERCADOLIVRE_REDIRECT_URI no ambiente antes de iniciar o OAuth"
        )
    try:
        Fernet(key)
        authorization_url = build_authorization_url(client_id, redirect_uri, key)
    except (TypeError, ValueError) as exc:
        raise SystemExit("Configuração OAuth inválida; confira as variáveis de ambiente") from exc
    print(authorization_url)


if __name__ == "__main__":
    main()
