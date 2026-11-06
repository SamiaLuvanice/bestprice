import asyncio
import logging

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.auth.limiter import purge_signup_attempts
from app.auth.settings import signup_settings
from app.db import create_database_engine
from app.research.repository import purge_expired
from app.research.service import now_utc

logger = logging.getLogger(__name__)
CLEANUP_INTERVAL_SECONDS = 3600


def purge_database() -> int:
    with Session(create_database_engine()) as session:
        now = now_utc()
        count = purge_expired(session, now)
        # Não retém o HMAC da origem de quem não volta: com o purge na partida e a cada hora
        # enquanto a API está acordada, a retenção fica em ≈ janela + 1 h. Se a instância
        # hiberna (Render Free), a próxima partida apaga o que venceu durante o sono.
        purge_signup_attempts(session, now, signup_settings().rate_limit_window)
        session.commit()
        return count


async def _run_cleaner(cleaner) -> None:
    try:
        await run_in_threadpool(cleaner)
    except (SQLAlchemyError, RuntimeError, OSError):
        logger.warning("Research expiration cleanup unavailable; expired records remain inaccessible.")


async def cleanup_loop(interval: float = CLEANUP_INTERVAL_SECONDS, cleaner=purge_database) -> None:
    # A primeira limpeza roda em tarefa de fundo e em threadpool: a partida e o health
    # não esperam pelo banco, e uma falha só gera aviso.
    await _run_cleaner(cleaner)
    while True:
        await asyncio.sleep(interval)
        await _run_cleaner(cleaner)


if __name__ == "__main__":
    print(f"Pesquisas expiradas removidas: {purge_database()}")
