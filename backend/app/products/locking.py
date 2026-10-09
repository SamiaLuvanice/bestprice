import hashlib
import threading
import time
from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.errors import ApiError

_local_locks: dict[str, threading.Lock] = {}
_local_locks_guard = threading.Lock()


@contextmanager
def listing_lock(session: Session, external_id: str) -> Iterator[None]:
    engine = session.get_bind()
    if engine.dialect.name != "postgresql":
        with _local_locks_guard:
            lock = _local_locks.setdefault(external_id, threading.Lock())
        if not lock.acquire(timeout=5):
            raise ApiError(503, "product_busy", "Anúncio ocupado. Tente novamente.")
        try:
            yield
        finally:
            lock.release()
        return

    key = int.from_bytes(hashlib.sha256(external_id.encode("ascii")).digest()[:8], signed=True)
    with engine.connect() as connection:
        deadline = time.monotonic() + 5
        while not connection.scalar(text("SELECT pg_try_advisory_lock(:key)"), {"key": key}):
            if time.monotonic() >= deadline:
                raise ApiError(503, "product_busy", "Anúncio ocupado. Tente novamente.")
            time.sleep(0.05)
        try:
            yield
        finally:
            connection.execute(text("SELECT pg_advisory_unlock(:key)"), {"key": key})
