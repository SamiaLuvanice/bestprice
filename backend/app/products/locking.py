import hashlib
import threading
import time
from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.errors import ApiError

LOCK_WAIT_SECONDS = 5.0
BUSY_RETRY_AFTER_SECONDS = 5

_local_locks: dict[str, threading.Lock] = {}
_local_locks_guard = threading.Lock()


class ListingBusy(ApiError):
    """Another request or worker holds the listing lock; the caller may retry shortly."""

    def __init__(self) -> None:
        super().__init__(
            503, "integration_unavailable",
            "Este anúncio está sendo consultado agora. Tente novamente em alguns segundos.",
            retry_after_seconds=BUSY_RETRY_AFTER_SECONDS,
        )


@contextmanager
def listing_lock(session: Session, external_id: str, *, wait_seconds: float | None = None) -> Iterator[None]:
    """Serialize work on one publication across requests and worker processes.

    PostgreSQL uses a session-level advisory lock held on a dedicated AUTOCOMMIT
    connection, so waiting for the external API never leaves a transaction open there.
    """
    wait = LOCK_WAIT_SECONDS if wait_seconds is None else wait_seconds
    engine = session.get_bind()
    if engine.dialect.name != "postgresql":
        with _local_locks_guard:
            lock = _local_locks.setdefault(external_id, threading.Lock())
        if not lock.acquire(timeout=wait):
            raise ListingBusy()
        try:
            yield
        finally:
            lock.release()
        return

    key = int.from_bytes(hashlib.sha256(external_id.encode("ascii")).digest()[:8], signed=True)
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as connection:
        deadline = time.monotonic() + wait
        while not connection.scalar(text("SELECT pg_try_advisory_lock(:key)"), {"key": key}):
            if time.monotonic() >= deadline:
                raise ListingBusy()
            time.sleep(0.05)
        try:
            yield
        finally:
            connection.execute(text("SELECT pg_advisory_unlock(:key)"), {"key": key})
