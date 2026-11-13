"""B6 — AC15: nada em claro no banco, nos logs ou nas respostas; purge no ciclo de limpeza."""

import hashlib
import hmac
import logging
import os
import secrets
import uuid
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta

import pytest
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import Session

from alembic import command
from app.auth.accounts import add_account
from app.auth.login_limiter import PostgresLoginLimiter
from app.auth.models import LoginFailure
from app.auth.routes import get_clock, get_login_limiter
from app.auth.settings import LoginSettings, login_settings
from app.db import get_session
from app.main import app

NOW = datetime(2026, 11, 13, 12, 0, tzinfo=UTC)
PROXY_SECRET = "p" * 32
IPV4 = "203.0.113.46"
IPV6 = "2001:db8:abcd:13:3456:789a:bcde:f012"
IPV6_PREFIX = "2001:db8:abcd:13::/64"


@pytest.fixture
def engine(monkeypatch: pytest.MonkeyPatch):
    test_url = os.environ.get("TEST_DATABASE_URL")
    if not test_url:
        pytest.skip("TEST_DATABASE_URL não configurada para integração PostgreSQL")
    monkeypatch.setenv("DATABASE_URL", test_url)
    command.upgrade(Config("alembic.ini"), "head")
    # Como a engine da aplicação (engine_kwargs): os logs de SQL não trazem os parâmetros.
    engine = create_engine(test_url.replace("postgresql://", "postgresql+psycopg://", 1), hide_parameters=True)
    yield engine
    engine.dispose()


@pytest.fixture
def hash_secret() -> str:
    return secrets.token_hex(32)


@pytest.fixture
def client(engine, hash_secret: str) -> Iterator[TestClient]:
    config = LoginSettings(
        account_attempts=2, source_attempts=50, window=timedelta(minutes=15),
        trusted_proxy_secret=PROXY_SECRET, hash_secret=hash_secret,
    )

    def pg_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = pg_session
    app.dependency_overrides[login_settings] = lambda: config
    app.dependency_overrides[get_clock] = lambda: (lambda: NOW)
    app.dependency_overrides[get_login_limiter] = PostgresLoginLimiter
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def proxied(ip: str) -> dict[str, str]:
    return {"X-BestPrice-Client-IP": ip, "X-BestPrice-Proxy-Secret": PROXY_SECRET}


def keyed(secret: str, value: str) -> str:
    return hmac.new(secret.encode(), value.encode(), hashlib.sha256).hexdigest()


def test_passwords_emails_and_source_ips_never_leak(engine, client: TestClient, hash_secret: str, caplog) -> None:
    caplog.set_level(logging.DEBUG)
    # SQL e parâmetros ligados (INFO). O DEBUG do SQLAlchemy despeja as linhas de resultado,
    # inclusive o e-mail de `users` em qualquer consulta: modo de diagnóstico que a API não liga.
    caplog.set_level(logging.INFO, logger="sqlalchemy.engine")
    email = f"sigilo-login-{uuid.uuid4().hex}@exemplo.com"
    missing = f"sem-conta-{uuid.uuid4().hex}@exemplo.com"
    correct = "senha-sigilo-correta-" + secrets.token_hex(4)
    with Session(engine) as session:
        add_account(session, email, correct)
        session.commit()
    wrong = ["senha-sigilo-errada-" + secrets.token_hex(4) for _ in range(3)]
    submissions = [
        (IPV4, email, wrong[0], 401),
        (IPV4, missing, wrong[1], 401),
        (IPV4, email, correct, 200),
        (IPV6, email, wrong[2], 401),
        (IPV6, email, wrong[2], 401),
        (IPV6, email, correct, 429),
    ]
    responses = []
    for ip, address, password, expected in submissions:
        response = client.post("/api/auth/login", json={"email": address, "password": password}, headers=proxied(ip))
        assert response.status_code == expected, response.text
        responses.append(response)
    malformed = client.post(
        "/api/auth/login", content=f'{{"email": "{email}", "password": "{correct}", "x": 1}}'.encode(),
        headers={"Content-Type": "application/json", **proxied(IPV4)},
    )
    assert malformed.status_code == 422
    responses.append(malformed)

    with engine.connect() as connection:
        stored = "\n".join(connection.execute(text("SELECT t::text FROM login_failures AS t")).scalars())
    leaked = [*wrong, correct, email, missing, IPV4, IPV6, IPV6_PREFIX, "2001:db8:abcd:13::"]
    exposed = {
        "logs": caplog.text,
        "responses": "\n".join(f"{r.headers}\n{r.text}" for r in responses),
        "login_failures": stored,
    }
    assert "login_failures" in caplog.text  # o log de SQL estava ligado durante o teste
    for where, content in exposed.items():
        for value in leaked:
            if where == "responses" and value == email:
                continue  # o próprio e-mail volta no corpo do login bem-sucedido
            assert value not in content, f"{value!r} apareceu em {where}"
    for value in (email, missing, IPV4, IPV6_PREFIX, f"login-email:{email}"):
        assert hashlib.sha256(value.encode()).hexdigest() not in stored  # sem hash sem segredo

    ipv4_source, ipv6_source = keyed(hash_secret, IPV4), keyed(hash_secret, IPV6_PREFIX)
    with Session(engine) as session:
        rows = session.execute(
            select(LoginFailure.source_hash, LoginFailure.account_hash)
            .where(LoginFailure.source_hash.in_([ipv4_source, ipv6_source])).order_by(LoginFailure.id),
        ).all()
    account = keyed(hash_secret, f"login-email:{email}")
    # IPv4: falha do e-mail zerada pelo sucesso (fica só na origem), e-mail sem conta, corpo malformado.
    # IPv6: duas falhas da combinação; o 429 não gravou nada. Por último, o corpo malformado (IPv4).
    assert [tuple(row) for row in rows] == [
        (ipv4_source, None), (ipv4_source, keyed(hash_secret, f"login-email:{missing}")),
        (ipv6_source, account), (ipv6_source, account), (ipv4_source, None),
    ]


def test_hourly_cleanup_purges_expired_login_failures(engine, monkeypatch: pytest.MonkeyPatch) -> None:
    from app import db
    from app.research import cleanup

    source = uuid.uuid4().hex * 2
    with Session(engine) as session:
        session.add_all([
            LoginFailure(source_hash=source, account_hash=None, failed_at=NOW - timedelta(hours=2)),
            LoginFailure(source_hash=source, account_hash=source, failed_at=NOW - timedelta(minutes=15)),
            LoginFailure(source_hash=source, account_hash=None, failed_at=NOW - timedelta(minutes=10)),
        ])
        session.commit()
    monkeypatch.setenv("DATABASE_URL", os.environ["TEST_DATABASE_URL"])
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.delenv("LOGIN_RATE_LIMIT_WINDOW_MINUTES", raising=False)
    monkeypatch.setattr(cleanup, "now_utc", lambda: NOW)
    db.create_database_engine.cache_clear()
    try:
        cleanup.purge_database()
    finally:
        db.create_database_engine().dispose()
        db.create_database_engine.cache_clear()
    with Session(engine) as session:
        remaining = list(session.scalars(select(LoginFailure.failed_at).where(LoginFailure.source_hash == source)))
    assert remaining == [NOW - timedelta(minutes=10)]


def test_cleanup_uses_the_configured_login_window(engine, monkeypatch: pytest.MonkeyPatch) -> None:
    from app import db
    from app.research import cleanup

    source = uuid.uuid4().hex * 2
    with Session(engine) as session:
        session.add(LoginFailure(source_hash=source, account_hash=None, failed_at=NOW - timedelta(minutes=10)))
        session.commit()
    monkeypatch.setenv("DATABASE_URL", os.environ["TEST_DATABASE_URL"])
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("LOGIN_RATE_LIMIT_WINDOW_MINUTES", "5")
    monkeypatch.setattr(cleanup, "now_utc", lambda: NOW)
    db.create_database_engine.cache_clear()
    try:
        cleanup.purge_database()
    finally:
        db.create_database_engine().dispose()
        db.create_database_engine.cache_clear()
    with Session(engine) as session:
        assert session.scalar(select(LoginFailure.id).where(LoginFailure.source_hash == source)) is None
