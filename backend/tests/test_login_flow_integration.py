"""B4 — login ponta a ponta na API com PostgreSQL real, limitador real e relógio fixo."""

import os
import secrets
import uuid
from collections.abc import Iterator
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta

import pytest
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from alembic import command
from app.auth.accounts import add_account
from app.auth.login_limiter import PostgresLoginLimiter
from app.auth.routes import get_clock, get_login_limiter
from app.auth.settings import LoginSettings, login_settings
from app.db import get_session
from app.main import app

NOW = datetime(2026, 11, 13, 12, 0, tzinfo=UTC)
PROXY_SECRET = "p" * 32
PASSWORD = "senha-correta-123"
WRONG = "senha-errada-1234"
LIMIT = "login_rate_limited"


@dataclass
class Clock:
    now: datetime = NOW

    def advance(self, **delta: float) -> None:
        self.now += timedelta(**delta)


@dataclass
class Flow:
    client: TestClient
    clock: Clock
    email: str
    ip: str = field(default_factory=lambda: f"203.0.{secrets.randbelow(256)}.{secrets.randbelow(256)}")

    def login(self, email: str | None = None, password: str = PASSWORD, ip: str | None = None, **kwargs):
        headers = {"X-BestPrice-Client-IP": ip or self.ip, "X-BestPrice-Proxy-Secret": PROXY_SECRET}
        return self.client.post(
            "/api/auth/login", json={"email": email or self.email, "password": password}, headers=headers, **kwargs,
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


def new_account(engine) -> str:
    email = f"limite-{uuid.uuid4().hex}@exemplo.com"
    with Session(engine) as session:
        add_account(session, email, PASSWORD)
        session.commit()
    return email


def install(engine, config: LoginSettings, clock: Clock) -> None:
    def pg_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = pg_session
    app.dependency_overrides[login_settings] = lambda: config
    app.dependency_overrides[get_clock] = lambda: (lambda: clock.now)
    app.dependency_overrides[get_login_limiter] = PostgresLoginLimiter


def default_settings(**overrides) -> LoginSettings:
    values = {
        "account_attempts": 10, "source_attempts": 50, "window": timedelta(minutes=15),
        "trusted_proxy_secret": PROXY_SECRET, "hash_secret": secrets.token_hex(32),
    }
    values.update(overrides)
    return LoginSettings(**values)


@pytest.fixture
def flow(engine) -> Iterator[Flow]:
    clock = Clock()
    install(engine, default_settings(), clock)
    try:
        yield Flow(TestClient(app), clock, new_account(engine))
    finally:
        app.dependency_overrides.clear()


def fail_times(flow: Flow, times: int, **kwargs) -> None:
    for _ in range(times):
        response = flow.login(password=WRONG, **kwargs)
        assert response.status_code == 401, response.text


def assert_limited(response, retry_after: int | None = None) -> int:
    assert response.status_code == 429, response.text
    assert response.json()["error"]["code"] == LIMIT
    assert "set-cookie" not in response.headers
    seconds = response.json()["error"]["retry_after_seconds"]
    assert response.headers["retry-after"] == str(seconds)
    if retry_after is not None:
        assert seconds == retry_after
    return seconds


def test_ac01_nine_failures_then_correct_password_logs_in(flow: Flow) -> None:
    fail_times(flow, 9)
    accepted = flow.login()
    assert accepted.status_code == 200 and accepted.cookies.get("bestprice_session")


def test_ac02_ac09_ac04_combination_blocked_even_with_correct_password_then_recovers(flow: Flow) -> None:
    fail_times(flow, 10)
    flow.clock.advance(minutes=5)
    assert_limited(flow.login(), 10 * 60)
    flow.clock.advance(minutes=1)
    assert_limited(flow.login(password=WRONG), 9 * 60)  # AC09: as recusas não estendem a espera
    flow.clock.advance(minutes=9)
    assert flow.login().status_code == 200  # AC04


def test_ac03_ac04_source_blocked_for_any_email_and_malformed_body_then_recovers(engine, flow: Flow) -> None:
    for _ in range(50):
        response = flow.login(email=f"outro-{uuid.uuid4().hex}@exemplo.com", password=WRONG)
        assert response.status_code == 401
    assert_limited(flow.login(), 15 * 60)  # e-mail sem falhas próprias, senha correta
    malformed = flow.client.post(
        "/api/auth/login", content=b"{", headers={
            "Content-Type": "application/json", "X-BestPrice-Client-IP": flow.ip,
            "X-BestPrice-Proxy-Secret": PROXY_SECRET,
        },
    )
    assert_limited(malformed, 15 * 60)
    flow.clock.advance(minutes=15)
    assert flow.login().status_code == 200  # AC04


def test_ac05_success_resets_only_the_combination(flow: Flow) -> None:
    fail_times(flow, 9)
    assert flow.login().status_code == 200
    fail_times(flow, 9)
    assert flow.login().status_code == 200
    # A origem continua com as 18 falhas: mais 32 de outros e-mails chegam ao limite de 50.
    for _ in range(32):
        assert flow.login(email=f"outro-{uuid.uuid4().hex}@exemplo.com", password=WRONG).status_code == 401
    assert_limited(flow.login())


def test_ac06_owner_logs_in_from_another_source(flow: Flow) -> None:
    fail_times(flow, 10)
    assert_limited(flow.login())
    assert flow.login(ip="198.51.100.200").status_code == 200


def test_ac07_existing_and_missing_accounts_are_counted_and_refused_the_same_way(engine, flow: Flow) -> None:
    missing = f"sem-conta-{uuid.uuid4().hex}@exemplo.com"
    other_ip = "198.51.100.77"
    responses = {"existing": [], "missing": []}
    for _ in range(11):
        responses["existing"].append(flow.login(password=WRONG))
        responses["missing"].append(flow.login(email=missing, password=WRONG, ip=other_ip))
    for existing, absent in zip(responses["existing"], responses["missing"], strict=True):
        assert (existing.status_code, existing.json()) == (absent.status_code, absent.json())
        assert existing.headers.get("retry-after") == absent.headers.get("retry-after")
    assert [response.status_code for response in responses["existing"]] == [401] * 10 + [429]


def test_ac10_largest_wait_is_reported(engine) -> None:
    clock = Clock()
    install(engine, default_settings(account_attempts=2, source_attempts=4), clock)
    try:
        flow = Flow(TestClient(app), clock, new_account(engine))
        for _ in range(2):
            assert flow.login(email=f"outro-{uuid.uuid4().hex}@exemplo.com", password=WRONG).status_code == 401
        clock.advance(minutes=2)
        fail_times(flow, 2)
        clock.advance(minutes=1)
        # Origem libera no minuto 15 (12 min); combinação no minuto 17 (14 min).
        assert_limited(flow.login(), 14 * 60)
    finally:
        app.dependency_overrides.clear()


def test_ac17_open_session_keeps_working_while_the_source_is_blocked(flow: Flow) -> None:
    owner = TestClient(app)
    accepted = flow.login()
    assert accepted.status_code == 200
    owner.cookies.set("bestprice_session", accepted.cookies["bestprice_session"], path="/api")
    fail_times(flow, 10)
    assert_limited(flow.login())
    me = owner.get("/api/auth/me")
    assert me.status_code == 200 and me.json()["email"] == flow.email
