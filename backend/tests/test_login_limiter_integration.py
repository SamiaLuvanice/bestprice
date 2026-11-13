"""B3 — limitador de login com reserva sob lock, contra PostgreSQL real e relógio fixo."""

import os
import uuid
from datetime import UTC, datetime, timedelta

import pytest
from alembic.config import Config
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from alembic import command
from app.auth.login_limiter import (
    LoginRateLimited,
    PostgresLoginLimiter,
    purge_login_failures,
)
from app.auth.models import LoginFailure
from app.auth.settings import LoginSettings

NOW = datetime(2026, 11, 13, 12, 0, tzinfo=UTC)
WINDOW = timedelta(minutes=15)


def settings(account: int = 10, source: int = 50, minutes: int = 15) -> LoginSettings:
    return LoginSettings(
        account_attempts=account, source_attempts=source, window=timedelta(minutes=minutes),
        trusted_proxy_secret="", hash_secret="h" * 32,
    )


@pytest.fixture(scope="module")
def engine():
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


def key() -> str:
    return uuid.uuid4().hex + uuid.uuid4().hex


def reserve(engine, source: str, account: str | None, now: datetime, config: LoginSettings | None = None):
    """Devolve o id da reserva, ou o retry_after quando a tentativa foi recusada (como int negativo)."""
    with Session(engine) as session:
        try:
            return PostgresLoginLimiter().reserve(session, source, account, now, config or settings())
        except LoginRateLimited as limited:
            return -limited.retry_after_seconds


def fail(engine, source: str, account: str | None, now: datetime, config: LoginSettings | None = None) -> None:
    reservation = reserve(engine, source, account, now, config)
    assert reservation > 0, f"recusada com retry_after={-reservation}"


def succeed(engine, source: str, account: str, now: datetime, config: LoginSettings | None = None) -> None:
    reservation = reserve(engine, source, account, now, config)
    assert reservation > 0, f"recusada com retry_after={-reservation}"
    with Session(engine) as session:
        PostgresLoginLimiter().record_success(session, reservation, source, account)
        session.commit()  # na rota, quem confirma é issue_session


def refused(engine, source: str, account: str | None, now: datetime, config: LoginSettings | None = None) -> int:
    reservation = reserve(engine, source, account, now, config)
    assert reservation < 0, "deveria ter sido recusada"
    return -reservation


def rows(engine, source: str) -> list[tuple[str | None, datetime]]:
    with Session(engine) as session:
        return [tuple(row) for row in session.execute(
            select(LoginFailure.account_hash, LoginFailure.failed_at)
            .where(LoginFailure.source_hash == source).order_by(LoginFailure.failed_at, LoginFailure.id),
        ).all()]


def failures_of(engine, source: str, account: str | None = None) -> int:
    return sum(1 for stored_account, _ in rows(engine, source) if account is None or stored_account == account)


def minutes(value: float) -> datetime:
    return NOW + timedelta(minutes=value)


# AC01


def test_nine_failures_then_correct_password_logs_in(engine) -> None:
    source, account = key(), key()
    for index in range(9):
        fail(engine, source, account, minutes(index))
    succeed(engine, source, account, minutes(9))
    assert failures_of(engine, source) == 9  # o sucesso não conta como falha


# AC02, AC04, AC09


def test_tenth_failure_blocks_the_combination_until_the_oldest_leaves_the_window(engine) -> None:
    source, account = key(), key()
    for index in range(10):
        fail(engine, source, account, minutes(index))
    # A mais antiga (NOW) sai da janela em NOW + 15 min.
    assert refused(engine, source, account, minutes(10)) == 5 * 60
    # Continuar enviando durante a espera não grava nada nem estende o tempo (AC09).
    assert refused(engine, source, account, minutes(12)) == 3 * 60
    assert refused(engine, source, account, minutes(15) - timedelta(seconds=1)) == 1
    assert failures_of(engine, source) == 10
    succeed(engine, source, account, minutes(15))  # AC04


def test_retry_after_is_rounded_up_to_whole_seconds(engine) -> None:
    source, account = key(), key()
    fail(engine, source, account, NOW + timedelta(microseconds=1), settings(account=1, source=1))
    assert refused(engine, source, account, minutes(15) - timedelta(seconds=1), settings(account=1, source=1)) == 2


def test_combination_limit_does_not_block_other_emails_of_the_same_source(engine) -> None:
    source, blocked, other = key(), key(), key()
    for index in range(10):
        fail(engine, source, blocked, minutes(index))
    refused(engine, source, blocked, minutes(10))
    succeed(engine, source, other, minutes(10))


# AC03, AC04, AC09


def test_fifty_failures_across_emails_block_the_source_for_any_email_and_malformed_body(engine) -> None:
    source = key()
    for index in range(50):
        fail(engine, source, key(), NOW + timedelta(seconds=index))
    fresh = key()
    assert refused(engine, source, fresh, minutes(5)) == 10 * 60
    assert refused(engine, source, None, minutes(5)) == 10 * 60
    assert refused(engine, source, fresh, minutes(10)) == 5 * 60  # não aumenta (AC09)
    assert failures_of(engine, source) == 50
    succeed(engine, source, fresh, minutes(15) + timedelta(seconds=1))  # a mais antiga saiu (AC04)


def test_malformed_bodies_count_only_for_the_source(engine) -> None:
    source, account = key(), key()
    config = settings(account=2, source=5)
    for _ in range(4):
        fail(engine, source, None, NOW, config)
    assert [stored for stored, _ in rows(engine, source)] == [None] * 4
    fail(engine, source, account, NOW, config)  # a combinação não tem falhas próprias
    assert refused(engine, source, account, NOW, config) == 15 * 60  # mas a origem chegou a 5


# AC05


def test_success_clears_only_the_combination_and_keeps_the_source_count(engine) -> None:
    source, account = key(), key()
    for index in range(9):
        fail(engine, source, account, NOW + timedelta(seconds=index))
    succeed(engine, source, account, minutes(1))
    for index in range(9):
        fail(engine, source, account, minutes(2) + timedelta(seconds=index))
    succeed(engine, source, account, minutes(3))
    assert failures_of(engine, source) == 18
    assert failures_of(engine, source, account) == 0
    assert all(stored is None for stored, _ in rows(engine, source))


def test_success_does_not_clear_the_same_email_from_another_source(engine) -> None:
    attacker, owner, account = key(), key(), key()
    for index in range(10):
        fail(engine, attacker, account, minutes(index))
    succeed(engine, owner, account, minutes(10))  # AC06 no nível do limitador
    refused(engine, attacker, account, minutes(10))


# AC10


def test_largest_wait_wins_when_the_combination_wait_is_longer(engine) -> None:
    source, account = key(), key()
    config = settings(account=2, source=4)
    for instant in (minutes(1), minutes(2)):
        fail(engine, source, key(), instant, config)
    for instant in (minutes(3), minutes(4)):
        fail(engine, source, account, instant, config)
    # Origem libera no minuto 16 (11 min); combinação no minuto 18 (13 min).
    assert refused(engine, source, account, minutes(5), config) == 13 * 60


def test_largest_wait_wins_when_the_source_wait_is_longer(engine) -> None:
    # Mais falhas que o limite da origem (por exemplo, depois de o limite ser reduzido).
    source, account = key(), key()
    with Session(engine) as session:
        session.add_all([
            LoginFailure(source_hash=source, account_hash=account, failed_at=minutes(1)),
            LoginFailure(source_hash=source, account_hash=account, failed_at=minutes(2)),
            *[LoginFailure(source_hash=source, account_hash=key(), failed_at=minutes(m)) for m in (3, 4, 5)],
        ])
        session.commit()
    # Combinação (limite 2) libera no minuto 16 (10 min); origem (limite 4, 5 falhas) no minuto 17 (11 min).
    assert refused(engine, source, account, minutes(6), settings(account=2, source=4)) == 11 * 60


# Retenção


def test_reservation_purges_only_its_own_expired_rows(engine) -> None:
    own, other, account = key(), key(), key()
    with Session(engine) as session:
        session.add_all([
            LoginFailure(source_hash=own, account_hash=account, failed_at=NOW - timedelta(hours=3)),
            LoginFailure(source_hash=own, account_hash=account, failed_at=NOW - WINDOW),
            LoginFailure(source_hash=own, account_hash=account, failed_at=NOW - WINDOW + timedelta(minutes=1)),
            LoginFailure(source_hash=other, account_hash=None, failed_at=NOW - timedelta(hours=3)),
        ])
        session.commit()
    fail(engine, own, account, NOW)
    assert [instant for _, instant in rows(engine, own)] == [NOW - WINDOW + timedelta(minutes=1), NOW]
    assert [instant for _, instant in rows(engine, other)] == [NOW - timedelta(hours=3)]


def test_purge_removes_only_expired_rows(engine) -> None:
    source = key()
    with Session(engine) as session:
        session.add_all([
            LoginFailure(source_hash=source, account_hash=None, failed_at=NOW - timedelta(minutes=16)),
            LoginFailure(source_hash=source, account_hash=key(), failed_at=NOW - WINDOW),
            LoginFailure(source_hash=source, account_hash=None, failed_at=NOW - timedelta(minutes=14)),
        ])
        session.commit()
        removed = purge_login_failures(session, NOW, WINDOW)
        session.commit()
    assert removed >= 2
    assert [instant for _, instant in rows(engine, source)] == [NOW - timedelta(minutes=14)]
