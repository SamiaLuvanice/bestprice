import asyncio
import logging

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.db import create_database_engine
from app.research.repository import purge_expired
from app.research.service import now_utc

logger = logging.getLogger(__name__)
CLEANUP_INTERVAL_SECONDS = 3600


def purge_database() -> int:
    with Session(create_database_engine()) as session:
        count = purge_expired(session, now_utc())
        session.commit()
        return count


async def cleanup_loop(interval: float = CLEANUP_INTERVAL_SECONDS, cleaner=purge_database) -> None:
    while True:
        # Startup/health never wait on a configured or unavailable database.
        await asyncio.sleep(interval)
        try:
            await run_in_threadpool(cleaner)
        except (SQLAlchemyError, RuntimeError, OSError):
            logger.warning("Research expiration cleanup unavailable; expired records remain inaccessible.")


if __name__ == "__main__":
    print(f"Pesquisas expiradas removidas: {purge_database()}")
