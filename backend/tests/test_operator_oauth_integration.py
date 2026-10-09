import os
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta

import httpx
import pytest
from alembic.config import Config
from cryptography.fernet import Fernet
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from alembic import command
from app.marketplace.oauth import OperatorTokenManager, provision_operator_tokens
from app.products.models import OperatorCredential


def test_concurrent_api_and_worker_refresh_one_time_token_once(monkeypatch: pytest.MonkeyPatch) -> None:
    test_url = os.environ.get("TEST_DATABASE_URL")
    if not test_url:
        pytest.skip("TEST_DATABASE_URL não configurada para integração PostgreSQL")
    monkeypatch.setenv("DATABASE_URL", test_url)
    command.upgrade(Config("alembic.ini"), "head")
    engine = create_engine(test_url.replace("postgresql://", "postgresql+psycopg://", 1))
    key = Fernet.generate_key()
    now = datetime(2026, 10, 9, 12, tzinfo=UTC)
    with Session(engine) as session:
        provision_operator_tokens(session, key, "old-access", "one-time-refresh", now + timedelta(minutes=1))

    requests: list[httpx.Request] = []
    guard = threading.Lock()

    def respond(request: httpx.Request) -> httpx.Response:
        with guard:
            requests.append(request)
        time.sleep(0.2)
        return httpx.Response(200, json={
            "access_token": "new-access", "refresh_token": "new-refresh",
            "token_type": "Bearer", "expires_in": 21600,
        })

    barrier = threading.Barrier(2)

    def acquire() -> str:
        manager = OperatorTokenManager(
            engine, key, "client-id", "client-secret", transport=httpx.MockTransport(respond), clock=lambda: now,
        )
        barrier.wait(timeout=5)
        return manager.get_access_token()

    with ThreadPoolExecutor(max_workers=2) as pool:
        tokens = list(pool.map(lambda _: acquire(), range(2)))
    assert tokens == ["new-access", "new-access"]
    assert len(requests) == 1
    with Session(engine) as session:
        row = session.scalar(select(OperatorCredential))
        assert Fernet(key).decrypt(row.encrypted_refresh_token.encode()) == b"new-refresh"
    engine.dispose()
