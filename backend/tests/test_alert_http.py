from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth.security import hash_password
from app.db import Base, get_session
from app.main import app
from app.marketplace.client import ListingData
from app.products.models import Notification, Product, User
from app.products.routes import get_marketplace_client


class Source:
    price = Decimal("100.00")

    def get_listing(self, external_id: str) -> ListingData:
        return ListingData(
            external_id=external_id, title="Fone",
            canonical_url="https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM",
            image_url=None, price=self.price, currency="BRL", availability="available",
        )


def test_alert_notifies_once_per_price_episode_and_requires_ownership() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    source = Source()

    def isolated_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = isolated_session
    app.dependency_overrides[get_marketplace_client] = lambda: source
    try:
        with Session(engine) as session:
            session.add_all([
                User(email="primeira@example.com", password_hash=hash_password("senha-validada-123")),
                User(email="segunda@example.com", password_hash=hash_password("senha-validada-456")),
            ])
            session.commit()
        first = TestClient(app)
        first.post("/api/auth/login", json={"email": "primeira@example.com", "password": "senha-validada-123"})
        created = first.post("/api/tracked-products", json={
            "url": "https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM",
        })
        tracking_id = created.json()["id"]
        alert = first.post(f"/api/tracked-products/{tracking_id}/alert", json={"target_price": "90.00"})
        assert alert.status_code == 201
        assert alert.json()["condition"] == "above_target"
        assert first.get("/api/dashboard").json()["summary"]["active_alert_count"] == 1
        assert first.get("/api/notifications").json()["items"] == []

        second = TestClient(app)
        second.post("/api/auth/login", json={"email": "segunda@example.com", "password": "senha-validada-456"})
        assert second.get(f"/api/tracked-products/{tracking_id}/alert").status_code == 404

        for price in ("80.00", "80.00", "110.00", "80.00"):
            source.price = Decimal(price)
            with Session(engine) as session:
                product = session.scalar(select(Product))
                product.last_attempt_at = datetime.now(UTC) - timedelta(minutes=2)
                session.commit()
            assert first.post(f"/api/tracked-products/{tracking_id}/refresh").status_code == 200
        with Session(engine) as session:
            rows = session.scalars(select(Notification).order_by(Notification.id)).all()
            for index, row in enumerate(rows):
                row.created_at = datetime(2026, 10, 8, 12, index, 0, tzinfo=UTC)
            session.commit()
        notifications = first.get("/api/notifications")
        assert notifications.status_code == 200
        assert len(notifications.json()["items"]) == 2
        notification_page = first.get("/api/notifications?limit=1")
        assert len(notification_page.json()["items"]) == 1
        assert notification_page.json()["next_cursor"] is not None
        next_notification = first.get("/api/notifications", params={"limit": 1, "cursor": notification_page.json()["next_cursor"]})
        assert len(next_notification.json()["items"]) == 1
        assert next_notification.json()["items"][0]["id"] != notification_page.json()["items"][0]["id"]
        assert all(item["observed_price"] == "80.00" for item in notifications.json()["items"])
        assert first.get(f"/api/tracked-products/{tracking_id}/alert").json()["condition"] == "target_reached"
        assert first.get("/api/dashboard").json()["summary"]["target_reached_count"] == 1
        assert second.get("/api/dashboard").json()["summary"]["active_alert_count"] == 0
        assert second.get("/api/notifications").json()["items"] == []
        notification_id = notifications.json()["items"][0]["id"]
        assert second.patch(f"/api/notifications/{notification_id}", json={"read": True}).status_code == 404
        marked = first.patch(f"/api/notifications/{notification_id}", json={"read": True})
        assert marked.status_code == 200
        assert marked.json()["read_at"] is not None
        repeated = first.patch(f"/api/notifications/{notification_id}", json={"read": True})
        assert repeated.json()["read_at"] == marked.json()["read_at"]

        first.patch(f"/api/tracked-products/{tracking_id}/alert", json={"enabled": False})
        first.patch(f"/api/tracked-products/{tracking_id}/alert", json={"enabled": True})
        assert len(first.get("/api/notifications").json()["items"]) == 2
        changed = first.patch(f"/api/tracked-products/{tracking_id}/alert", json={"target_price": "85.00"})
        assert changed.status_code == 200
        assert changed.json()["revision"] == 2
        assert len(first.get("/api/notifications").json()["items"]) == 3
        first.patch(f"/api/tracked-products/{tracking_id}/alert", json={"target_price": "85.00"})
        assert len(first.get("/api/notifications").json()["items"]) == 3
        assert first.delete(f"/api/tracked-products/{tracking_id}/alert").status_code == 204
        assert len(first.get("/api/notifications").json()["items"]) == 3
    finally:
        app.dependency_overrides.clear()


def test_alert_does_not_fire_when_price_is_stale_for_configured_window(monkeypatch) -> None:
    monkeypatch.setenv("MONITOR_FRESHNESS_SECONDS", "600")
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    source = Source()

    def isolated_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = isolated_session
    app.dependency_overrides[get_marketplace_client] = lambda: source
    try:
        with Session(engine) as session:
            session.add(User(email="stale@example.com", password_hash=hash_password("senha-validada-123")))
            session.commit()
        client = TestClient(app)
        client.post("/api/auth/login", json={"email": "stale@example.com", "password": "senha-validada-123"})
        created = client.post("/api/tracked-products", json={"url": "https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM"})
        tracking_id = created.json()["id"]
        with Session(engine) as session:
            product = session.scalar(select(Product))
            product.last_price_observed_at = datetime.now(UTC) - timedelta(minutes=11)
            session.commit()
        alert = client.post(f"/api/tracked-products/{tracking_id}/alert", json={"target_price": "120.00"})
        assert alert.status_code == 201
        assert alert.json()["condition"] == "unknown"
        assert client.get("/api/notifications").json()["items"] == []
        assert client.get(f"/api/tracked-products/{tracking_id}").json()["product"]["stale"] is True
        with Session(engine) as session:
            product = session.scalar(select(Product))
            product.last_attempt_at = datetime.now(UTC) - timedelta(minutes=2)
            session.commit()
        assert client.post(f"/api/tracked-products/{tracking_id}/refresh").status_code == 200
        assert client.get(f"/api/tracked-products/{tracking_id}/alert").json()["condition"] == "target_reached"
        assert len(client.get("/api/notifications").json()["items"]) == 1
    finally:
        app.dependency_overrides.clear()
