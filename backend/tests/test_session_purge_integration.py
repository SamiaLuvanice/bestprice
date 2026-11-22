"""Spec 0060 em PostgreSQL real: renovação gravada (AC01) e limpeza das sessões terminadas (AC06, AC07)."""

import asyncio
import hashlib
import logging
import os
import secrets
import subprocess
import sys
import uuid
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta

import pytest
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, delete, select
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from alembic import command
from app.auth.accounts import add_account
from app.auth.routes import get_clock
from app.db import get_session
from app.main import app
from app.products.models import User, UserSession
from app.research.models import Conversation

NOW = datetime(2031, 3, 10, 8, 0, tzinfo=UTC)


@pytest.fixture
def engine(monkeypatch: pytest.MonkeyPatch):
    test_url = os.environ.get("TEST_DATABASE_URL")
    if not test_url:
        pytest.skip("TEST_DATABASE_URL não configurada para integração PostgreSQL")
    monkeypatch.setenv("DATABASE_URL", test_url)
    command.upgrade(Config("alembic.ini"), "head")
    engine = create_engine(test_url.replace("postgresql://", "postgresql+psycopg://", 1))
    yield engine
    engine.dispose()


def _account(engine) -> uuid.UUID:
    with Session(engine) as session:
        user = User(email=f"sessao-{uuid.uuid4().hex}@exemplo.com", password_hash="x")
        session.add(user)
        session.commit()
        return user.id


def _session(engine, user_id: uuid.UUID, expires_at: datetime, absolute_expires_at: datetime) -> str:
    token_hash = secrets.token_hex(32)
    with Session(engine) as session:
        session.add(UserSession(
            user_id=user_id, token_hash=token_hash,
            expires_at=expires_at, absolute_expires_at=absolute_expires_at,
        ))
        session.commit()
    return token_hash


def _remaining(engine, token_hashes: list[str]) -> set[str]:
    with Session(engine) as session:
        return set(session.scalars(select(UserSession.token_hash).where(UserSession.token_hash.in_(token_hashes))))


def _run_cycle(monkeypatch: pytest.MonkeyPatch) -> None:
    from app import db
    from app.research import cleanup

    monkeypatch.setenv("DATABASE_URL", os.environ["TEST_DATABASE_URL"])
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setattr(cleanup, "now_utc", lambda: NOW)
    db.create_database_engine.cache_clear()
    try:
        cleanup.purge_database()
    finally:
        db.create_database_engine().dispose()
        db.create_database_engine.cache_clear()


def test_ac06_cleanup_cycle_removes_only_finished_sessions_of_any_account(engine, monkeypatch) -> None:
    alice, bruno = _account(engine), _account(engine)
    ahead, behind = NOW + timedelta(hours=3), NOW - timedelta(minutes=1)
    finished = [
        _session(engine, alice, behind, NOW + timedelta(days=3)),  # inatividade
        _session(engine, bruno, NOW + timedelta(hours=5), NOW),  # teto (vence exatamente agora)
        _session(engine, bruno, NOW - timedelta(days=9), NOW - timedelta(days=2)),  # prazo antigo
    ]
    active = [
        _session(engine, alice, ahead, NOW + timedelta(days=6)),
        _session(engine, bruno, ahead, ahead),
    ]
    _run_cycle(monkeypatch)
    assert _remaining(engine, finished + active) == set(active)


def test_ac07_session_purge_failure_is_logged_and_does_not_escape(engine, monkeypatch, caplog) -> None:
    from app.research import cleanup

    def broken(_session: Session, _now: datetime) -> int:
        raise OperationalError("DELETE FROM user_sessions", {}, Exception("conexão perdida"))

    owner = _account(engine)
    expired = _session(engine, owner, NOW - timedelta(hours=1), NOW + timedelta(days=1))
    with Session(engine) as session:
        conversation = Conversation(
            user_id=owner, title="vencida", created_at=NOW - timedelta(days=91),
            updated_at=NOW - timedelta(days=91), expires_at=NOW - timedelta(days=1),
        )
        session.add(conversation)
        session.commit()
        conversation_id = conversation.id
    monkeypatch.setattr(cleanup, "purge_expired_sessions", broken, raising=False)
    caplog.set_level(logging.WARNING, logger="app.research.cleanup")
    monkeypatch.setattr(cleanup, "now_utc", lambda: NOW)
    monkeypatch.setenv("DATABASE_URL", os.environ["TEST_DATABASE_URL"])
    from app import db

    db.create_database_engine.cache_clear()
    try:
        asyncio.run(cleanup._run_cleaner(cleanup.purge_database))
    finally:
        db.create_database_engine().dispose()
        db.create_database_engine.cache_clear()
    assert "cleanup unavailable" in caplog.text
    # Nada confirmado pela metade: a pesquisa vencida, apagada antes no mesmo ciclo, também fica.
    assert _remaining(engine, [expired]) == {expired}
    with Session(engine) as session:
        assert session.get(Conversation, conversation_id) is not None


@pytest.fixture
def pg_client(engine) -> Iterator[tuple[TestClient, list[datetime]]]:
    clock = [NOW]

    def pg_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = pg_session
    app.dependency_overrides[get_clock] = lambda: (lambda: clock[0])
    try:
        yield TestClient(app), clock
    finally:
        app.dependency_overrides.clear()


def test_ac01_renewal_is_written_once_per_hour_in_postgresql(engine, pg_client) -> None:
    client, clock = pg_client
    email, password = f"renova-{uuid.uuid4().hex}@exemplo.com", "senha-validada-123"
    with Session(engine) as session:
        add_account(session, email, password)
        session.commit()
    assert client.post("/api/auth/login", json={"email": email, "password": password}).status_code == 200
    token = client.cookies["bestprice_session"]

    def stored() -> tuple[datetime, datetime]:
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        with Session(engine) as session:
            row = session.scalar(select(UserSession).where(UserSession.token_hash == token_hash))
            return row.expires_at, row.absolute_expires_at

    assert stored() == (NOW + timedelta(hours=24), NOW + timedelta(days=7))
    clock[0] = NOW + timedelta(hours=20)
    assert client.get("/api/auth/me").status_code == 200
    assert stored() == (NOW + timedelta(hours=44), NOW + timedelta(days=7))
    clock[0] = NOW + timedelta(hours=20, minutes=40)
    assert client.get("/api/auth/me").status_code == 200
    assert stored()[0] == NOW + timedelta(hours=44)  # mesma hora: sem nova escrita
    clock[0] = NOW + timedelta(hours=43)
    assert client.get("/api/auth/me").status_code == 200


@pytest.mark.parametrize("path", ["/api/auth/me", "/api/ai/capabilities"])
def test_session_ended_concurrently_with_the_renewal_is_unauthenticated(engine, pg_client, monkeypatch, path) -> None:
    # Logout ou purge em outra conexão entre a leitura da sessão e a renovação: 401, não 500/503.
    from app.auth import routes

    client, clock = pg_client
    email, password = f"corrida-{uuid.uuid4().hex}@exemplo.com", "senha-validada-123"
    with Session(engine) as session:
        add_account(session, email, password)
        session.commit()
    assert client.post("/api/auth/login", json={"email": email, "password": password}).status_code == 200
    token_hash = hashlib.sha256(client.cookies["bestprice_session"].encode()).hexdigest()
    original = routes.renewed_expiry

    def ended_meanwhile(row: UserSession, now: datetime) -> datetime | None:
        with engine.begin() as connection:
            connection.execute(delete(UserSession).where(UserSession.token_hash == token_hash))
        return original(row, now)

    monkeypatch.setattr(routes, "renewed_expiry", ended_meanwhile)
    clock[0] = NOW + timedelta(hours=20)
    response = TestClient(app, raise_server_exceptions=False, cookies=client.cookies).get(path)
    assert response.status_code == 401, response.text
    assert response.json()["error"]["code"] == "unauthenticated"
    assert "set-cookie" not in response.headers


def test_manual_cleanup_reports_removed_sessions(engine) -> None:
    # Limpeza manual (`python -m app.research.cleanup`) com o relógio real: sessão de 2020 sai.
    finished = _session(engine, _account(engine), datetime(2020, 1, 2, tzinfo=UTC), datetime(2020, 1, 8, tzinfo=UTC))
    result = subprocess.run(
        [sys.executable, "-m", "app.research.cleanup"], capture_output=True, text=True, timeout=60, check=False,
        env={**os.environ, "DATABASE_URL": os.environ["TEST_DATABASE_URL"], "APP_ENV": "development"},
    )
    assert result.returncode == 0, result.stderr
    assert "Pesquisas expiradas removidas:" in result.stdout
    removed = [line for line in result.stdout.splitlines() if line.startswith("Sessões terminadas removidas: ")]
    assert len(removed) == 1 and int(removed[0].rsplit(" ", 1)[1]) >= 1
    assert _remaining(engine, [finished]) == set()
