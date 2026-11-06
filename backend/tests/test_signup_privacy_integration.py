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
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from alembic import command
from app.auth.limiter import source_hash
from app.auth.routes import get_clock
from app.auth.settings import SignupSettings, signup_settings
from app.db import get_session
from app.main import app

NOW = datetime(2026, 11, 6, 12, 0, tzinfo=UTC)
PROXY_SECRET = "p" * 32
IPV4 = "203.0.113.45"
IPV6 = "2001:db8:abcd:12:3456:789a:bcde:f012"
IPV6_PREFIX = "2001:db8:abcd:12::/64"


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


@pytest.fixture
def hash_secret() -> str:
    return secrets.token_hex(32)


@pytest.fixture
def client(engine, hash_secret: str) -> Iterator[TestClient]:
    config = SignupSettings(
        enabled=True, rate_limit_attempts=3, rate_limit_window=timedelta(minutes=60),
        trusted_proxy_secret=PROXY_SECRET, source_hash_secret=hash_secret,
    )

    def pg_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = pg_session
    app.dependency_overrides[signup_settings] = lambda: config
    app.dependency_overrides[get_clock] = lambda: (lambda: NOW)
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def proxied(ip: str) -> dict[str, str]:
    return {"X-BestPrice-Client-IP": ip, "X-BestPrice-Proxy-Secret": PROXY_SECRET}


def table_text(engine, table: str) -> str:
    with engine.connect() as connection:
        return "\n".join(connection.execute(text(f"SELECT t::text FROM {table} AS t")).scalars())


def test_passwords_and_source_ips_never_leak(engine, client: TestClient, hash_secret: str, caplog) -> None:
    caplog.set_level(logging.DEBUG)
    # O SQLAlchemy fixa o logger "sqlalchemy" em WARN; liga o log de SQL e parâmetros.
    caplog.set_level(logging.DEBUG, logger="sqlalchemy.engine")
    email = f"sigilo-{uuid.uuid4().hex}@exemplo.com"
    passwords = {
        "created": "senha-sigilo-criada-" + secrets.token_hex(4),
        "short": "curta-" + secrets.token_hex(2),
        "duplicate": "senha-sigilo-duplicada-" + secrets.token_hex(4),
        "limited": "senha-sigilo-limitada-" + secrets.token_hex(4),
        "ipv6": "senha-sigilo-ipv6-" + secrets.token_hex(4),
    }
    submissions = [
        (IPV4, email, passwords["created"], 201),
        (IPV4, email, passwords["short"], 422),
        (IPV4, email, passwords["duplicate"], 409),
        (IPV4, email, passwords["limited"], 429),
        (IPV6, f"v6-{email}", passwords["ipv6"], 201),
    ]
    responses = []
    for ip, address, password, expected in submissions:
        response = client.post("/api/auth/signup", json={"email": address, "password": password}, headers=proxied(ip))
        assert response.status_code == expected, response.text
        responses.append(response)

    leaked_values = [*passwords.values(), IPV4, IPV6, IPV6_PREFIX, "2001:db8:abcd:12::"]
    unsalted = [hashlib.sha256(value.encode()).hexdigest() for value in (IPV4, IPV6, IPV6_PREFIX)]
    exposed = {
        "logs": caplog.text,
        "responses": "\n".join(f"{r.headers}\n{r.text}" for r in responses),
        "users": table_text(engine, "users"),
        "signup_attempts": table_text(engine, "signup_attempts"),
    }
    assert "INSERT INTO users" in caplog.text  # o log de SQL estava ligado durante o teste
    for where, content in exposed.items():
        for value in leaked_values:
            assert value not in content, f"{value!r} apareceu em {where}"
    for digest in unsalted:
        assert digest not in exposed["signup_attempts"]

    with engine.connect() as connection:
        hashes = connection.execute(text(
            "SELECT u.password_hash FROM users AS u WHERE u.email IN (:a, :b) ORDER BY u.email",
        ), {"a": email, "b": f"v6-{email}"}).scalars().all()
        assert len(hashes) == 2 and all(value.startswith("scrypt$") for value in hashes)
        expected_ipv4 = hmac.new(hash_secret.encode(), IPV4.encode(), hashlib.sha256).hexdigest()
        expected_ipv6 = hmac.new(hash_secret.encode(), IPV6_PREFIX.encode(), hashlib.sha256).hexdigest()
        counts = dict(connection.execute(text(
            "SELECT source_hash, count(*) FROM signup_attempts WHERE source_hash IN (:v4, :v6) GROUP BY source_hash",
        ), {"v4": expected_ipv4, "v6": expected_ipv6}).all())
    # 201, 422 e 409 contam; o 429 não.
    assert counts == {expected_ipv4: 3, expected_ipv6: 1}
    assert source_hash(IPV4, secrets.token_hex(32)) != expected_ipv4


def test_control_characters_in_email_are_refused_before_postgres(engine, client: TestClient) -> None:
    for control in (chr(0), chr(0x1C), chr(0xFEFF)):
        email = f"ctrl{control}-{uuid.uuid4().hex}@exemplo.com"
        refused = client.post("/api/auth/signup", json={"email": email, "password": "senha-controle-123"})
        assert refused.status_code == 422, refused.text
        assert refused.json()["error"]["fields"][0]["code"] == "email_invalid"


def test_unexpected_database_error_does_not_log_password_ip_or_parameters(
    monkeypatch: pytest.MonkeyPatch, engine, hash_secret: str, caplog,
) -> None:
    import traceback

    from sqlalchemy.exc import DBAPIError

    from app import db
    from app.auth import accounts

    # Usa a engine da aplicação (engine_kwargs), como em produção, sem sobrescrever get_session.
    monkeypatch.setenv("DATABASE_URL", os.environ["TEST_DATABASE_URL"])
    db.create_database_engine.cache_clear()
    marker = "marcador-do-hash-" + secrets.token_hex(8)
    # Erro inesperado no INSERT: o hash não cabe em VARCHAR(255).
    monkeypatch.setattr(accounts, "hash_password", lambda _password: "scrypt$" + marker + "x" * 300)
    config = SignupSettings(
        enabled=True, rate_limit_attempts=5, rate_limit_window=timedelta(minutes=60),
        trusted_proxy_secret=PROXY_SECRET, source_hash_secret=hash_secret,
    )
    app.dependency_overrides[signup_settings] = lambda: config
    app.dependency_overrides[get_clock] = lambda: (lambda: NOW)
    caplog.set_level(logging.DEBUG)
    caplog.set_level(logging.DEBUG, logger="sqlalchemy.engine")
    email = f"erro-{uuid.uuid4().hex}@exemplo.com"
    password = "senha-erro-banco-" + secrets.token_hex(4)
    try:
        with pytest.raises(DBAPIError) as raised:
            TestClient(app).post(
                "/api/auth/signup", json={"email": email, "password": password}, headers=proxied(IPV4),
            )
    finally:
        app.dependency_overrides.clear()
        db.create_database_engine().dispose()
        db.create_database_engine.cache_clear()

    # O que o Uvicorn registraria: o traceback completo da exceção não tratada.
    reported = "".join(traceback.format_exception(raised.value)) + "\n" + caplog.text
    assert "INSERT INTO users" in reported
    for value in (password, IPV4, email, marker):
        assert value not in reported, f"{value!r} apareceu no log/traceback"


@pytest.mark.parametrize("field", ["email", "password"])
def test_lone_surrogate_is_refused_before_postgres(engine, client: TestClient, field: str) -> None:
    import json

    payload = {"email": f"surrogate-{uuid.uuid4().hex}@exemplo.com", "password": "senha-surrogate-123"}
    payload[field] = chr(0xD800) + payload[field]
    refused = client.post(
        "/api/auth/signup", content=json.dumps(payload).encode("ascii"), headers={"Content-Type": "application/json"},
    )
    assert refused.status_code == 422, refused.text
    assert refused.json()["error"]["fields"] == [
        {"field": "body", "code": "json_required", "message": "Valor inválido ou ausente."},
    ]
