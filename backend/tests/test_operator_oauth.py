from datetime import UTC, datetime, timedelta
from urllib.parse import parse_qs

import httpx
import pytest
from cryptography.fernet import Fernet
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.db import Base
from app.marketplace.client import IntegrationError
from app.marketplace.oauth import OperatorTokenManager, provision_operator_tokens
from app.products.models import OperatorCredential
from app.products.routes import build_marketplace_client


def test_operator_token_is_encrypted_and_reused_before_expiry() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    key = Fernet.generate_key()
    now = datetime(2026, 10, 9, 12, tzinfo=UTC)
    with Session(engine) as session:
        provision_operator_tokens(session, key, "access-initial", "refresh-initial", now + timedelta(hours=6))
        stored = session.scalar(select(OperatorCredential))
        assert "access-initial" not in stored.encrypted_access_token
        assert "refresh-initial" not in stored.encrypted_refresh_token

    def unexpected_request(_request: httpx.Request) -> httpx.Response:
        raise AssertionError("Token válido não deve acionar refresh")

    manager = OperatorTokenManager(
        engine, key, "client-id", "client-secret", transport=httpx.MockTransport(unexpected_request), clock=lambda: now,
    )
    assert manager.get_access_token() == "access-initial"


def test_expiring_token_is_rotated_once_and_persisted() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    key = Fernet.generate_key()
    now = datetime(2026, 10, 9, 12, tzinfo=UTC)
    with Session(engine) as session:
        provision_operator_tokens(session, key, "access-initial", "refresh-initial", now + timedelta(minutes=2))
    requests: list[httpx.Request] = []

    def respond(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        assert request.method == "POST"
        assert str(request.url) == "https://api.mercadolibre.com/oauth/token"
        assert parse_qs(request.content.decode()) == {
            "grant_type": ["refresh_token"], "client_id": ["client-id"],
            "client_secret": ["client-secret"], "refresh_token": ["refresh-initial"],
        }
        return httpx.Response(200, json={
            "access_token": "access-rotated", "refresh_token": "refresh-rotated",
            "token_type": "Bearer", "expires_in": 21600,
        })

    manager = OperatorTokenManager(
        engine, key, "client-id", "client-secret", transport=httpx.MockTransport(respond), clock=lambda: now,
    )
    assert manager.get_access_token() == "access-rotated"
    assert manager.get_access_token() == "access-rotated"
    assert len(requests) == 1
    with Session(engine) as session:
        row = session.scalar(select(OperatorCredential))
        assert "refresh-rotated" not in row.encrypted_refresh_token
        assert Fernet(key).decrypt(row.encrypted_refresh_token.encode()) == b"refresh-rotated"
        assert row.expires_at.replace(tzinfo=UTC) == now + timedelta(seconds=21600)


def test_marketplace_dependency_uses_persisted_operator_token(monkeypatch: pytest.MonkeyPatch) -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    key = Fernet.generate_key()
    with Session(engine) as session:
        provision_operator_tokens(session, key, "stored-access", "stored-refresh", datetime.now(UTC) + timedelta(hours=6))
    monkeypatch.setenv("MERCADOLIVRE_THIRD_PARTY_VALIDATED", "true")
    monkeypatch.setenv("MERCADOLIVRE_OAUTH_KEY", key.decode())
    monkeypatch.setenv("MERCADOLIVRE_CLIENT_ID", "client-id")
    monkeypatch.setenv("MERCADOLIVRE_CLIENT_SECRET", "client-secret")
    monkeypatch.delenv("MERCADOLIVRE_ACCESS_TOKEN", raising=False)
    monkeypatch.setattr("app.products.routes.create_database_engine", lambda: engine, raising=False)

    assert build_marketplace_client().access_token == "stored-access"


def test_rejected_refresh_preserves_previous_encrypted_tokens() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    key = Fernet.generate_key()
    now = datetime(2026, 10, 9, 12, tzinfo=UTC)
    with Session(engine) as session:
        provision_operator_tokens(session, key, "access-initial", "refresh-initial", now + timedelta(minutes=1))
        original = session.scalar(select(OperatorCredential))
        encrypted_before = (original.encrypted_access_token, original.encrypted_refresh_token)

    manager = OperatorTokenManager(
        engine, key, "client-id", "client-secret",
        transport=httpx.MockTransport(lambda _request: httpx.Response(400, json={"error": "invalid_grant"})),
        clock=lambda: now,
    )
    with pytest.raises(IntegrationError) as failure:
        manager.get_access_token()
    assert failure.value.code == "integration_auth_required"
    with Session(engine) as session:
        row = session.scalar(select(OperatorCredential))
        assert (row.encrypted_access_token, row.encrypted_refresh_token) == encrypted_before


def test_refresh_rate_limit_exposes_retry_window_without_rotating_token() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    key = Fernet.generate_key()
    now = datetime(2026, 10, 9, 12, tzinfo=UTC)
    with Session(engine) as session:
        provision_operator_tokens(session, key, "old-access", "old-refresh", now + timedelta(minutes=1))
    calls = 0

    def rate_limited(_request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return httpx.Response(429, headers={"Retry-After": "42"})

    manager = OperatorTokenManager(
        engine, key, "client-id", "client-secret",
        transport=httpx.MockTransport(rate_limited),
        clock=lambda: now,
    )
    with pytest.raises(IntegrationError) as failure:
        manager.get_access_token()
    assert failure.value.code == "integration_rate_limited"
    assert failure.value.retry_after_seconds == 42
    with pytest.raises(IntegrationError) as second:
        manager.get_access_token()
    assert second.value.code == "integration_rate_limited"
    assert calls == 1
    with Session(engine) as session:
        row = session.scalar(select(OperatorCredential))
        assert Fernet(key).decrypt(row.encrypted_refresh_token.encode()) == b"old-refresh"


def test_ambiguous_refresh_failure_blocks_token_reuse_until_reprovisioned() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    key = Fernet.generate_key()
    now = datetime(2026, 10, 9, 12, tzinfo=UTC)
    with Session(engine) as session:
        provision_operator_tokens(session, key, "old-access", "one-time-refresh", now + timedelta(minutes=1))
    calls = 0

    def timeout(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        raise httpx.ReadTimeout("resultado incerto", request=request)

    manager = OperatorTokenManager(
        engine, key, "client-id", "client-secret", transport=httpx.MockTransport(timeout), clock=lambda: now,
    )
    with pytest.raises(IntegrationError) as first:
        manager.get_access_token()
    assert first.value.code == "integration_unavailable"
    with pytest.raises(IntegrationError) as second:
        manager.get_access_token()
    assert second.value.code == "integration_auth_required"
    assert calls == 1

    with Session(engine) as session:
        provision_operator_tokens(session, key, "new-access", "new-refresh", now + timedelta(hours=6))
    assert manager.get_access_token() == "new-access"


@pytest.mark.parametrize("unsent", [httpx.ConnectError, httpx.ConnectTimeout, httpx.PoolTimeout])
def test_refresh_failure_before_sending_does_not_block_retry(unsent: type[httpx.RequestError]) -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    key = Fernet.generate_key()
    now = datetime(2026, 10, 9, 12, tzinfo=UTC)
    with Session(engine) as session:
        provision_operator_tokens(session, key, "old-access", "old-refresh", now + timedelta(minutes=1))
    outcomes = iter(["fail", "ok"])

    def respond(request: httpx.Request) -> httpx.Response:
        if next(outcomes) == "fail":
            raise unsent("pedido não saiu", request=request)
        return httpx.Response(200, json={
            "access_token": "access-rotated", "refresh_token": "refresh-rotated",
            "token_type": "Bearer", "expires_in": 21600,
        })

    manager = OperatorTokenManager(
        engine, key, "client-id", "client-secret", transport=httpx.MockTransport(respond), clock=lambda: now,
    )
    with pytest.raises(IntegrationError) as first:
        manager.get_access_token()
    assert first.value.code == "integration_unavailable"
    with Session(engine) as session:
        assert session.scalar(select(OperatorCredential)).refresh_blocked is False
    assert manager.get_access_token() == "access-rotated"


def test_refresh_rate_limit_without_header_reports_effective_window() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    key = Fernet.generate_key()
    now = datetime(2026, 10, 9, 12, tzinfo=UTC)
    with Session(engine) as session:
        provision_operator_tokens(session, key, "old-access", "old-refresh", now + timedelta(minutes=1))

    manager = OperatorTokenManager(
        engine, key, "client-id", "client-secret",
        transport=httpx.MockTransport(lambda _request: httpx.Response(429)), clock=lambda: now,
    )
    with pytest.raises(IntegrationError) as failure:
        manager.get_access_token()
    assert failure.value.code == "integration_rate_limited"
    assert failure.value.retry_after_seconds == 60
    with Session(engine) as session:
        assert session.scalar(select(OperatorCredential)).refresh_retry_after_at.replace(tzinfo=UTC) == now + timedelta(seconds=60)
