import os
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta

import pytest
from alembic.config import Config
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

from alembic import command
from app.auth.limiter import (
    PostgresSignupLimiter,
    SignupRateLimited,
    purge_signup_attempts,
)
from app.auth.models import SignupAttempt
from app.auth.settings import SignupSettings

NOW = datetime(2026, 11, 6, 12, 0, tzinfo=UTC)


def settings(attempts: int = 5, minutes: int = 60) -> SignupSettings:
    return SignupSettings(
        enabled=True, rate_limit_attempts=attempts, rate_limit_window=timedelta(minutes=minutes),
        trusted_proxy_secret="", source_hash_secret="h" * 32,
    )


@pytest.fixture(scope="module")
def engine(request: pytest.FixtureRequest):
    test_url = os.environ.get("TEST_DATABASE_URL")
    if not test_url:
        pytest.skip("TEST_DATABASE_URL não configurada para integração PostgreSQL")
    previous = os.environ.get("DATABASE_URL")
    os.environ["DATABASE_URL"] = test_url
    try:
        command.upgrade(Config("alembic.ini"), "head")
    finally:
        if previous is None:
            os.environ.pop("DATABASE_URL", None)
        else:
            os.environ["DATABASE_URL"] = previous
    engine = create_engine(test_url.replace("postgresql://", "postgresql+psycopg://", 1))
    yield engine
    engine.dispose()


def new_source() -> str:
    return uuid.uuid4().hex + uuid.uuid4().hex


def attempt(engine, source: str, now: datetime, config: SignupSettings) -> int | None:
    """Devolve None quando a tentativa passou ou o retry_after quando foi recusada."""
    with Session(engine) as session:
        try:
            PostgresSignupLimiter().check_and_record(session, source, now, config)
        except SignupRateLimited as limited:
            return limited.retry_after_seconds
    return None


def stored(engine, source: str) -> list[datetime]:
    with Session(engine) as session:
        return list(session.scalars(
            select(SignupAttempt.attempted_at).where(SignupAttempt.source_hash == source)
            .order_by(SignupAttempt.attempted_at),
        ))


def test_sixth_attempt_is_refused_until_the_oldest_leaves_the_window(engine) -> None:
    source = new_source()
    instants = [NOW + timedelta(minutes=minute) for minute in (0, 5, 10, 15, 20)]
    for instant in instants:
        assert attempt(engine, source, instant, settings()) is None

    refused_at = NOW + timedelta(minutes=30)
    retry = attempt(engine, source, refused_at, settings())
    # O mais antigo (NOW) sai da janela em NOW + 60 min: faltam 30 min.
    assert retry == 30 * 60
    assert stored(engine, source) == instants  # a recusa não registra

    assert attempt(engine, source, refused_at + timedelta(seconds=retry - 1), settings()) == 1
    assert attempt(engine, source, refused_at + timedelta(seconds=retry), settings()) is None
    assert len(stored(engine, source)) == 5  # o mais antigo venceu e foi apagado


def test_retry_after_is_rounded_up_to_whole_seconds(engine) -> None:
    source = new_source()
    first = NOW + timedelta(microseconds=1)
    assert attempt(engine, source, first, settings(attempts=1)) is None
    assert attempt(engine, source, NOW + timedelta(minutes=59, seconds=59), settings(attempts=1)) == 2


def test_custom_limit_of_two_in_ten_minutes(engine) -> None:
    source = new_source()
    config = settings(attempts=2, minutes=10)
    assert attempt(engine, source, NOW, config) is None
    assert attempt(engine, source, NOW + timedelta(minutes=1), config) is None
    assert attempt(engine, source, NOW + timedelta(minutes=2), config) == 8 * 60
    assert attempt(engine, source, NOW + timedelta(minutes=10), config) is None


def test_sources_have_independent_buckets(engine) -> None:
    first, second = new_source(), new_source()
    assert attempt(engine, first, NOW, settings(attempts=1)) is None
    assert attempt(engine, first, NOW, settings(attempts=1)) == 3600
    assert attempt(engine, second, NOW, settings(attempts=1)) is None


def test_purge_removes_only_expired_rows(engine) -> None:
    source = new_source()
    with Session(engine) as session:
        session.add_all([
            SignupAttempt(source_hash=source, attempted_at=NOW - timedelta(minutes=61)),
            SignupAttempt(source_hash=source, attempted_at=NOW - timedelta(minutes=60)),
            SignupAttempt(source_hash=source, attempted_at=NOW - timedelta(minutes=59)),
        ])
        session.commit()
        removed = purge_signup_attempts(session, NOW, timedelta(minutes=60))
        session.commit()
    assert removed >= 2
    assert stored(engine, source) == [NOW - timedelta(minutes=59)]


def test_simultaneous_attempts_from_the_same_source_respect_the_limit(engine) -> None:
    source = new_source()
    barrier = threading.Barrier(2)

    def concurrent_attempt(_: int) -> int | None:
        barrier.wait(timeout=5)
        return attempt(engine, source, NOW, settings(attempts=1))

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(concurrent_attempt, range(2)))
    assert sorted(results, key=lambda value: value is not None) == [None, 3600]
    with Session(engine) as session:
        count = session.scalar(
            select(func.count()).select_from(SignupAttempt).where(SignupAttempt.source_hash == source),
        )
    assert count == 1
