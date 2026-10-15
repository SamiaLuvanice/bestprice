import os
import time

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.exc import TimeoutError as PoolTimeoutError

from app import db


@pytest.fixture
def postgres_url() -> str:
    url = os.environ.get("TEST_DATABASE_URL")
    if not url:
        pytest.skip("TEST_DATABASE_URL não configurada para integração PostgreSQL")
    return url


@pytest.fixture
def build_application_engine(monkeypatch: pytest.MonkeyPatch, postgres_url: str):
    created = []

    def build():
        monkeypatch.setenv("DATABASE_URL", postgres_url)
        db.create_database_engine.cache_clear()
        engine = db.create_database_engine()
        created.append(engine)
        return engine

    yield build
    for engine in created:
        engine.dispose()
    db.create_database_engine.cache_clear()


def _backend_pid(engine) -> int:
    with engine.connect() as connection:
        return int(connection.scalar(text("SELECT pg_backend_pid()")))


def test_connection_past_its_age_is_replaced(
    monkeypatch: pytest.MonkeyPatch, build_application_engine
) -> None:
    monkeypatch.setattr(db, "POOL_RECYCLE_SECONDS", 1)
    engine = build_application_engine()

    first_pid = _backend_pid(engine)
    time.sleep(1.5)
    second_pid = _backend_pid(engine)

    assert second_pid != first_pid


def test_healthy_connections_are_reused_within_the_pool(build_application_engine) -> None:
    engine = build_application_engine()

    pids = {_backend_pid(engine) for _ in range(5)}

    assert len(pids) == 1
    assert engine.pool.checkedout() == 0


def test_waiting_for_a_pooled_connection_is_bounded_and_safe(
    monkeypatch: pytest.MonkeyPatch, postgres_url: str
) -> None:
    monkeypatch.setattr(db, "POOL_TIMEOUT_SECONDS", 1)
    engine = create_engine(postgres_url, **db.engine_kwargs(), pool_size=1, max_overflow=0)

    try:
        with engine.connect() as held:
            assert held.scalar(text("SELECT 1")) == 1
            started = time.monotonic()
            with pytest.raises(PoolTimeoutError) as failure, engine.connect():
                pass
            elapsed = time.monotonic() - started
    finally:
        engine.dispose()

    assert elapsed < 5
    assert postgres_url not in str(failure.value)


def test_opening_a_connection_is_bounded(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(db, "CONNECT_TIMEOUT_SECONDS", 1)
    engine = create_engine(
        "postgresql+psycopg://user:secret@192.0.2.1:5432/bestprice", **db.engine_kwargs()
    )

    try:
        started = time.monotonic()
        with pytest.raises(OperationalError) as failure, engine.connect():
            pass
        elapsed = time.monotonic() - started
    finally:
        engine.dispose()

    assert elapsed < 10
    assert "secret" not in str(failure.value)
