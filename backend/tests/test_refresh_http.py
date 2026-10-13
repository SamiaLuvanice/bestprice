from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth.security import hash_password
from app.db import Base, get_session
from app.errors import ApiError
from app.main import app
from app.marketplace.client import IntegrationError, ListingData
from app.products import routes, service
from app.products.models import PriceHistory, Product, User
from app.products.routes import get_marketplace_client


class MutableSource:
    price = Decimal("100.00")
    error: IntegrationError | None = None

    def get_listing(self, external_id: str) -> ListingData:
        if self.error is not None:
            raise self.error
        return ListingData(
            external_id=external_id, title="Fone",
            canonical_url="https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM",
            image_url=None, price=self.price, currency="BRL", availability="available",
        )


def test_refresh_records_changes_but_preserves_price_on_rate_limit(monkeypatch: pytest.MonkeyPatch) -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    source = MutableSource()

    def isolated_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = isolated_session
    app.dependency_overrides[get_marketplace_client] = lambda: source
    try:
        with Session(engine) as session:
            session.add(User(email="pessoa@example.com", password_hash=hash_password("senha-validada-123")))
            session.commit()
        client = TestClient(app)
        client.post("/api/auth/login", json={"email": "pessoa@example.com", "password": "senha-validada-123"})
        created = client.post("/api/tracked-products", json={
            "url": "https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM",
        })
        tracking_id = created.json()["id"]
        source.price = Decimal("80.00")
        with Session(engine) as session:
            product = session.scalar(select(Product))
            product.last_attempt_at = datetime.now(UTC) - timedelta(minutes=2)
            session.commit()
        refreshed = client.post(f"/api/tracked-products/{tracking_id}/refresh")
        assert refreshed.status_code == 200
        assert refreshed.json()["product"]["current_price"] == "80.00"
        assert refreshed.json()["product"]["previous_price"] == "100.00"
        history = client.get(f"/api/tracked-products/{tracking_id}/history")
        assert history.status_code == 200
        assert [item["price"] for item in history.json()["items"]] == ["100.00", "80.00"]
        first_page = client.get(f"/api/tracked-products/{tracking_id}/history?limit=1")
        assert [item["price"] for item in first_page.json()["items"]] == ["100.00"]
        assert first_page.json()["next_cursor"] is not None
        next_page = client.get(f"/api/tracked-products/{tracking_id}/history", params={"limit": 1, "cursor": first_page.json()["next_cursor"]})
        assert [item["price"] for item in next_page.json()["items"]] == ["80.00"]
        assert next_page.json()["next_cursor"] is None
        dashboard = client.get("/api/dashboard")
        assert dashboard.status_code == 200
        assert dashboard.json()["summary"]["tracked_count"] == 1
        assert dashboard.json()["summary"]["price_drop_count"] == 1
        assert len(dashboard.json()["opportunities"]) == 1

        source.error = IntegrationError("integration_rate_limited", 42)
        with Session(engine) as session:
            product = session.scalar(select(Product))
            product.last_attempt_at = datetime.now(UTC) - timedelta(minutes=2)
            session.commit()
        limited = client.post(f"/api/tracked-products/{tracking_id}/refresh")
        assert limited.status_code == 429
        assert limited.headers["Retry-After"] == "42"
        detail = client.get(f"/api/tracked-products/{tracking_id}")
        assert detail.json()["product"]["current_price"] == "80.00"
        assert detail.json()["product"]["last_attempt_status"] == "rate_limited"
        with Session(engine) as session:
            assert len(session.scalars(select(PriceHistory)).all()) == 2

        source.error = IntegrationError("product_not_found")
        with Session(engine) as session:
            product = session.scalar(select(Product))
            product.last_attempt_at = datetime.now(UTC) - timedelta(hours=2)
            product.retry_after_at = None
            product.next_check_at = datetime.now(UTC) - timedelta(seconds=1)
            session.commit()
        missing = client.post(f"/api/tracked-products/{tracking_id}/refresh")
        assert missing.status_code == 200
        assert missing.json()["product"]["lookup_status"] == "not_found"
        del app.dependency_overrides[get_marketplace_client]
        monkeypatch.setenv("MERCADOLIVRE_THIRD_PARTY_VALIDATED", "false")
        too_early = client.post(f"/api/tracked-products/{tracking_id}/refresh")
        assert too_early.status_code == 429
        assert too_early.json()["error"]["code"] == "refresh_not_due"
        assert too_early.json()["error"]["retry_after_seconds"] > 23 * 3600
    finally:
        app.dependency_overrides.clear()


def test_operator_auth_failure_records_refresh_attempt(monkeypatch: pytest.MonkeyPatch) -> None:
    fixed = datetime(2030, 3, 4, 12, tzinfo=UTC)

    class Clock(datetime):
        current = fixed - timedelta(hours=3)

        @classmethod
        def now(cls, _zone=None) -> datetime:
            return cls.current

    monkeypatch.setattr(service, "datetime", Clock)
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    source = MutableSource()

    def isolated_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = isolated_session
    app.dependency_overrides[get_marketplace_client] = lambda: source
    try:
        with Session(engine) as session:
            session.add(User(email="auth-failure@example.com", password_hash=hash_password("senha-validada-123")))
            session.commit()
        client = TestClient(app)
        assert client.post("/api/auth/login", json={"email": "auth-failure@example.com", "password": "senha-validada-123"}).status_code == 200
        created = client.post("/api/tracked-products", json={"url": "https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM"})
        tracking_id = created.json()["id"]
        initial_observed = created.json()["product"]["last_price_observed_at"]
        del app.dependency_overrides[get_marketplace_client]
        Clock.current = fixed

        failure = ApiError(503, "integration_auth_required", "Integração indisponível no momento.")

        def deny_client():
            raise failure

        monkeypatch.setattr(routes, "build_marketplace_client", deny_client)
        denied = client.post(f"/api/tracked-products/{tracking_id}/refresh")
        assert denied.status_code == 503
        assert denied.json()["error"]["code"] == "integration_auth_required"
        detail = client.get(f"/api/tracked-products/{tracking_id}").json()["product"]
        assert detail["last_attempt_status"] == "auth_required"
        recorded_attempt = datetime.fromisoformat(detail["last_attempt_at"])
        assert recorded_attempt.replace(tzinfo=recorded_attempt.tzinfo or UTC) == fixed
        assert detail["last_price_observed_at"] == initial_observed
        assert detail["current_price"] == "100.00"

        Clock.current = fixed + timedelta(hours=2)
        failure = ApiError(429, "integration_rate_limited", "Limite da integração.", retry_after_seconds=42)
        limited = client.post(f"/api/tracked-products/{tracking_id}/refresh")
        assert limited.status_code == 429
        assert limited.headers["Retry-After"] == "42"
        assert client.get(f"/api/tracked-products/{tracking_id}").json()["product"]["last_attempt_status"] == "rate_limited"
    finally:
        app.dependency_overrides.clear()
