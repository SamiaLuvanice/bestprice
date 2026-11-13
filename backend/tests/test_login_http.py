"""B4 — contrato HTTP do login com limite (SQLite + dublê do limitador; PostgreSQL nos *_integration)."""

from collections.abc import Iterator
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth import routes
from app.auth.login_limiter import login_account_key
from app.auth.routes import get_clock
from app.auth.security import DUMMY_PASSWORD_HASH, hash_password
from app.auth.settings import LoginSettings, login_settings
from app.db import Base, get_session
from app.main import app
from app.products.models import User
from tests.conftest import FakeLoginLimiter

PASSWORD = "senha-do-login-123"
EMAIL = "pessoa@exemplo.com"
HASH_SECRET = "h" * 32
NOW = datetime(2026, 11, 13, 12, 0, tzinfo=UTC)
LIMIT_MESSAGE = "Muitas tentativas de login. Tente novamente mais tarde."


@dataclass
class Harness:
    client: TestClient
    limiter: FakeLoginLimiter
    stored_hash: str

    def login(self, email: str = EMAIL, password: str = PASSWORD):
        return self.client.post("/api/auth/login", json={"email": email, "password": password})


@pytest.fixture
def harness(monkeypatch: pytest.MonkeyPatch, login_limiter: FakeLoginLimiter) -> Iterator[Harness]:
    monkeypatch.setenv("APP_ENV", "development")
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        user = User(email=EMAIL, password_hash=hash_password(PASSWORD))
        session.add(user)
        session.commit()
        stored_hash = user.password_hash
    config = LoginSettings(
        account_attempts=10, source_attempts=50, window=timedelta(minutes=15),
        trusted_proxy_secret="", hash_secret=HASH_SECRET,
    )

    def isolated_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = isolated_session
    app.dependency_overrides[login_settings] = lambda: config
    app.dependency_overrides[get_clock] = lambda: (lambda: NOW)
    try:
        yield Harness(TestClient(app), login_limiter, stored_hash)
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def error(response) -> dict:
    return response.json()["error"]


def account(email: str = EMAIL) -> str:
    return login_account_key(email, HASH_SECRET)


def test_success_reserves_then_clears_the_combination_and_opens_a_session(harness: Harness) -> None:
    accepted = harness.login(" Pessoa@Exemplo.com ")
    assert accepted.status_code == 200
    assert accepted.json()["email"] == EMAIL
    assert accepted.cookies.get("bestprice_session")
    [(source, reserved_account, at)] = harness.limiter.reservations
    assert (reserved_account, at) == (account(), NOW)
    assert harness.limiter.successes == [(1, source, account())]


@pytest.mark.parametrize(("email", "password"), [
    (EMAIL, "senha-errada-1234"),
    ("sem-conta@exemplo.com", PASSWORD),
    (EMAIL, "x" * 1025),
    (" " * 318 + EMAIL, PASSWORD),
])
def test_credential_failures_count_for_the_combination_and_answer_401(
    harness: Harness, email: str, password: str,
) -> None:
    refused = harness.login(email, password)
    assert refused.status_code == 401
    assert error(refused)["code"] == "invalid_credentials"
    assert error(refused)["message"] == "E-mail ou senha inválidos."
    assert "set-cookie" not in refused.headers
    assert [reserved for _, reserved, _ in harness.limiter.reservations] == [account(email)]
    assert harness.limiter.successes == []


@pytest.mark.parametrize(("content", "headers"), [
    (b'{"email": "pessoa@exemplo.com", "password": "senha-do-login-123"}', {"Content-Type": "text/plain"}),
    (b'{"email": "pessoa@exemplo.com", "password": "senha-do-login-123"}', {}),
    (b"{", {"Content-Type": "application/json"}),
    (b'{"email": "pessoa@exemplo.com"}', {"Content-Type": "application/json"}),
    (b'{"email": "a@b.c", "password": "x", "extra": 1}', {"Content-Type": "application/json"}),
    (b'["pessoa@exemplo.com"]', {"Content-Type": "application/json"}),
    (b'{"email": "\\ud800@b.c", "password": "senha-do-login-123"}', {"Content-Type": "application/json"}),
])
def test_malformed_body_counts_only_for_the_source_and_answers_422(
    harness: Harness, content: bytes, headers: dict[str, str],
) -> None:
    refused = harness.client.post("/api/auth/login", content=content, headers=headers)
    assert refused.status_code == 422, refused.text
    assert error(refused)["code"] == "validation_error"
    assert error(refused)["fields"]
    assert [reserved for _, reserved, _ in harness.limiter.reservations] == [None]
    assert "senha-do-login-123" not in refused.text


def test_rate_limited_login_is_refused_before_credentials_even_with_correct_password(
    harness: Harness, monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls: list[str] = []
    monkeypatch.setattr(routes, "verify_password", lambda password, stored: calls.append(stored) or True)
    harness.limiter.retry_after_seconds = 421
    refused = harness.login()
    assert refused.status_code == 429
    assert refused.json() == {"error": {
        "code": "login_rate_limited", "message": LIMIT_MESSAGE, "fields": [],
        "tracked_product_id": None, "retry_after_seconds": 421,
    }}
    assert refused.headers["retry-after"] == "421"
    assert "set-cookie" not in refused.headers
    assert calls == []


def test_rate_limit_is_evaluated_before_parsing_the_body(harness: Harness) -> None:
    harness.limiter.retry_after_seconds = 60
    refused = harness.client.post("/api/auth/login", content=b"{", headers={"Content-Type": "application/json"})
    assert refused.status_code == 429
    assert error(refused)["code"] == "login_rate_limited"


def test_rate_limited_answer_does_not_depend_on_the_account_existing(harness: Harness) -> None:
    harness.limiter.retry_after_seconds = 300
    with_account = harness.login(EMAIL, "senha-errada-1234")
    without_account = harness.login("sem-conta@exemplo.com", "senha-errada-1234")
    assert (with_account.status_code, with_account.json()) == (without_account.status_code, without_account.json())
    assert with_account.headers["retry-after"] == without_account.headers["retry-after"]


def test_every_credential_failure_runs_exactly_one_scrypt_of_equal_cost(
    harness: Harness, monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls: list[tuple[int, str]] = []
    real_verify = routes.verify_password

    def counting_verify(password: str, stored: str) -> bool:
        calls.append((len(password), stored))
        return real_verify(password, stored)

    monkeypatch.setattr(routes, "verify_password", counting_verify)
    cases = {
        "wrong_password": (EMAIL, "senha-errada-1234"),
        "no_account": ("sem-conta@exemplo.com", "senha-errada-1234"),
        "password_too_long": (EMAIL, "x" * 1025),
        "email_too_long": ("a" * 321 + "@exemplo.com", PASSWORD),
    }
    for name, (email, password) in cases.items():
        calls.clear()
        assert harness.login(email, password).status_code == 401, name
        assert len(calls) == 1, name
        password_length, stored = calls[0]
        # Mesmo formato e parâmetros scrypt (custo vem de n, r, p; não do tamanho da senha).
        assert stored.split("$")[0] == "scrypt", name
        assert stored in (harness.stored_hash, DUMMY_PASSWORD_HASH), name
        assert password_length <= 1024, name
    calls.clear()
    harness.client.post("/api/auth/login", content=b"{", headers={"Content-Type": "application/json"})
    assert calls == []  # corpo malformado não chega à verificação


def test_dummy_hash_uses_the_same_scrypt_parameters_as_real_hashes() -> None:
    method, salt, digest = DUMMY_PASSWORD_HASH.split("$")
    real_method, real_salt, real_digest = hash_password("qualquer-senha-123").split("$")
    assert (method, len(salt), len(digest)) == (real_method, len(real_salt), len(real_digest))


def test_openapi_documents_the_login_limit_and_json_body() -> None:
    operation = app.openapi()["paths"]["/api/auth/login"]["post"]
    assert {"200", "401", "422", "429"} <= set(operation["responses"])
    assert "login_rate_limited" in operation["responses"]["429"]["description"]
    schema = operation["requestBody"]["content"]["application/json"]["schema"]
    assert set(schema["properties"]) == {"email", "password"}
    assert operation["requestBody"]["required"] is True
