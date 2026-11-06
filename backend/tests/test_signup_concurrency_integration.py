import os
import secrets
import threading
import uuid
from collections.abc import Iterator
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta

import pytest
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

from alembic import command
from app.auth.accounts import EmailAlreadyRegistered, add_account
from app.auth.settings import SignupSettings, signup_settings
from app.db import get_session
from app.main import app
from app.products.models import User, UserSession


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


def count_users(engine, email: str) -> int:
    with Session(engine) as session:
        return session.scalar(select(func.count()).select_from(User).where(User.email == email))


def test_add_account_turns_a_concurrent_unique_violation_into_email_already_registered(engine) -> None:
    email = f"corrida-{uuid.uuid4().hex}@exemplo.com"
    first_flushed = threading.Event()
    first_may_commit = threading.Event()

    def first() -> str:
        with Session(engine) as session:
            add_account(session, email, "senha-da-primeira-1")
            first_flushed.set()
            first_may_commit.wait(timeout=5)
            session.commit()
            return "created"

    def second() -> str:
        first_flushed.wait(timeout=5)
        with Session(engine) as session:
            # O INSERT espera no índice único até a primeira transação confirmar.
            threading.Timer(0.3, first_may_commit.set).start()
            try:
                add_account(session, email.upper(), "senha-da-segunda-2")
            except EmailAlreadyRegistered:
                return "duplicate"
            session.commit()
            return "created"

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = sorted(future.result() for future in [pool.submit(first), pool.submit(second)])
    assert results == ["created", "duplicate"]
    assert count_users(engine, email) == 1


@pytest.fixture
def http_client(engine) -> Iterator[TestClient]:
    config = SignupSettings(
        enabled=True, rate_limit_attempts=5, rate_limit_window=timedelta(minutes=60),
        trusted_proxy_secret="", source_hash_secret=secrets.token_hex(32),
    )

    def pg_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = pg_session
    app.dependency_overrides[signup_settings] = lambda: config
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def test_simultaneous_signups_with_the_same_email_create_exactly_one_account(engine, http_client) -> None:
    local = f"simultaneo-{uuid.uuid4().hex}"
    emails = [f"{local}@exemplo.com", f"{local.upper()}@EXEMPLO.com"]
    barrier = threading.Barrier(2)

    def submit(email: str):
        barrier.wait(timeout=5)
        return http_client.post("/api/auth/signup", json={"email": email, "password": "senha-simultanea-1"})

    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(submit, emails))

    statuses = sorted(response.status_code for response in responses)
    assert statuses == [201, 409]
    duplicate = next(response for response in responses if response.status_code == 409)
    assert duplicate.json()["error"]["code"] == "email_already_registered"
    assert "set-cookie" not in duplicate.headers
    normalized = emails[0]
    assert count_users(engine, normalized) == 1
    with Session(engine) as session:
        user_id = session.scalar(select(User.id).where(User.email == normalized))
        sessions = session.scalar(select(func.count()).select_from(UserSession).where(UserSession.user_id == user_id))
    assert sessions == 1
