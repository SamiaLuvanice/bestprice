import logging

import psycopg

from app.config import database_connection_options

logger = logging.getLogger(__name__)

CONNECT_TIMEOUT_SECONDS = 3
STATEMENT_TIMEOUT_MILLISECONDS = 3000


def database_available() -> bool:
    connection_options = database_connection_options()
    if not connection_options:
        logger.warning("Verificação do banco indisponível: configuração ausente")
        return False

    try:
        with psycopg.connect(
            **connection_options,
            connect_timeout=CONNECT_TIMEOUT_SECONDS,
            options=f"-c statement_timeout={STATEMENT_TIMEOUT_MILLISECONDS}",
        ) as connection, connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            return cursor.fetchone() == (1,)
    except (psycopg.Error, OSError) as error:
        # Exceções de conexão podem incluir host, usuário e senha na mensagem.
        logger.warning("Verificação do banco falhou (%s)", type(error).__name__)
        return False
