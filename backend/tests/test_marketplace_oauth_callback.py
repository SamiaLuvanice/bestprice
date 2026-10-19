import logging
from datetime import UTC, datetime, timedelta
from urllib.parse import parse_qs, urlsplit

import httpx
import pytest
from cryptography.fernet import Fernet
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth.routes import get_session
from app.db import Base
from app.marketplace.oauth import provision_operator_tokens
from app.marketplace.oauth_routes import OAuthCallbackAccessLogFilter, router
from app.marketplace.oauth_setup import (
    build_authorization_url,
    exchange_authorization_code,
    verify_authorization_state,
)
from app.products.models import OperatorCredential

NOW = datetime(2026, 10, 19, 12, tzinfo=UTC)
REDIRECT_URI = "https://bestprice-stage-api.onrender.com/api/marketplace/oauth/callback"


def test_authorization_url_uses_official_endpoint_and_signed_expiring_state() -> None:
    key = Fernet.generate_key()
    url = build_authorization_url("client-id", REDIRECT_URI, key, now=NOW)
    parsed = urlsplit(url)
    query = parse_qs(parsed.query)

    assert parsed.scheme == "https"
    assert parsed.netloc == "auth.mercadolivre.com.br"
    assert query["response_type"] == ["code"]
    assert query["client_id"] == ["client-id"]
    assert query["redirect_uri"] == [REDIRECT_URI]
    assert "client_secret" not in query
    assert verify_authorization_state(query["state"][0], key, REDIRECT_URI, now=NOW)
    assert not verify_authorization_state(
        query["state"][0], key, REDIRECT_URI, now=NOW + timedelta(minutes=11),
    )


def test_authorization_state_rejects_tampering_and_redirect_mismatch() -> None:
    key = Fernet.generate_key()
    query = parse_qs(urlsplit(build_authorization_url("client-id", REDIRECT_URI, key, now=NOW)).query)
    state = query["state"][0]
    prefix, signature = state.rsplit(".", maxsplit=1)
    changed_state = f"{prefix[:-1]}{'A' if prefix[-1] != 'A' else 'B'}.{signature}"

    assert not verify_authorization_state(changed_state, key, REDIRECT_URI, now=NOW)
    assert not verify_authorization_state(state, key, "https://other.example/callback", now=NOW)


@pytest.mark.parametrize("token_type", ["Bearer", "bearer"])
def test_code_exchange_posts_registered_redirect_and_persists_encrypted_tokens(token_type: str) -> None:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    key = Fernet.generate_key()

    def exchange(request: httpx.Request) -> httpx.Response:
        assert request.method == "POST"
        assert str(request.url) == "https://api.mercadolibre.com/oauth/token"
        assert parse_qs(request.content.decode()) == {
            "grant_type": ["authorization_code"],
            "client_id": ["client-id"],
            "client_secret": ["client-secret"],
            "code": ["one-time-code"],
            "redirect_uri": [REDIRECT_URI],
        }
        return httpx.Response(200, json={
            "access_token": "access-secret",
            "refresh_token": "refresh-secret",
            "token_type": token_type,
            "expires_in": 21600,
        })

    with Session(engine) as session:
        exchange_authorization_code(
            session, key, "client-id", "client-secret", "one-time-code", REDIRECT_URI,
            transport=httpx.MockTransport(exchange), now=NOW,
        )

    with Session(engine) as session:
        row = session.scalar(select(OperatorCredential))
        assert row is not None
        assert "access-secret" not in row.encrypted_access_token
        assert "refresh-secret" not in row.encrypted_refresh_token
        assert Fernet(key).decrypt(row.encrypted_access_token.encode()) == b"access-secret"
        assert Fernet(key).decrypt(row.encrypted_refresh_token.encode()) == b"refresh-secret"
        assert row.expires_at.replace(tzinfo=UTC) == NOW + timedelta(seconds=21600)


def test_callback_rejects_invalid_state_without_exchange(monkeypatch) -> None:
    key = Fernet.generate_key()
    app = FastAPI()
    app.include_router(router)

    def session_dependency():
        with Session(create_engine("sqlite+pysqlite:///:memory:")) as session:
            yield session

    app.dependency_overrides[get_session] = session_dependency

    def unexpected_exchange(*_args, **_kwargs) -> None:
        raise AssertionError("invalid state must not exchange an OAuth code")

    monkeypatch.setenv("MERCADOLIVRE_OAUTH_KEY", key.decode())
    monkeypatch.setenv("MERCADOLIVRE_CLIENT_ID", "client-id")
    monkeypatch.setenv("MERCADOLIVRE_CLIENT_SECRET", "client-secret")
    monkeypatch.setenv("MERCADOLIVRE_REDIRECT_URI", REDIRECT_URI)
    monkeypatch.setattr("app.marketplace.oauth_routes.exchange_authorization_code", unexpected_exchange)

    with TestClient(app, follow_redirects=False) as client:
        response = client.get("/api/marketplace/oauth/callback?code=one-time-code&state=invalid")

    assert response.status_code == 303
    assert response.headers["location"] == "/api/marketplace/oauth/complete?status=failed"
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["referrer-policy"] == "no-referrer"
    assert "one-time-code" not in response.text


def test_callback_exchanges_valid_code_and_redirects_without_query_credentials(monkeypatch) -> None:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    key = Fernet.generate_key()
    app = FastAPI()
    app.include_router(router)

    def session_dependency():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = session_dependency
    url = build_authorization_url("client-id", REDIRECT_URI, key)
    state = parse_qs(urlsplit(url).query)["state"][0]

    def exchange(session, actual_key, client_id, client_secret, code, redirect_uri) -> None:
        assert (client_id, client_secret, code, redirect_uri) == (
            "client-id", "client-secret", "one-time-code", REDIRECT_URI,
        )
        provision_operator_tokens(
            session, actual_key, "access-secret", "refresh-secret", NOW + timedelta(hours=6),
        )

    monkeypatch.setenv("MERCADOLIVRE_OAUTH_KEY", key.decode())
    monkeypatch.setenv("MERCADOLIVRE_CLIENT_ID", "client-id")
    monkeypatch.setenv("MERCADOLIVRE_CLIENT_SECRET", "client-secret")
    monkeypatch.setenv("MERCADOLIVRE_REDIRECT_URI", REDIRECT_URI)
    monkeypatch.setattr("app.marketplace.oauth_routes.exchange_authorization_code", exchange)

    with TestClient(app, follow_redirects=False) as client:
        response = client.get(f"/api/marketplace/oauth/callback?code=one-time-code&state={state}")

    assert response.status_code == 303
    assert response.headers["location"] == "/api/marketplace/oauth/complete?status=authorized"
    with Session(engine) as session:
        row = session.scalar(select(OperatorCredential))
        assert row is not None
        assert Fernet(key).decrypt(row.encrypted_access_token.encode()) == b"access-secret"


def test_callback_access_log_filter_removes_oauth_query_values() -> None:
    record = logging.LogRecord(
        "uvicorn.access", logging.INFO, "", 0, '%s - "%s %s HTTP/%s" %d',
        ("127.0.0.1", "GET", "/api/marketplace/oauth/callback?code=secret&state=private", "1.1", 303), None,
    )

    assert OAuthCallbackAccessLogFilter().filter(record)
    assert "secret" not in record.getMessage()
    assert "private" not in record.getMessage()
    assert "/api/marketplace/oauth/callback" in record.getMessage()
