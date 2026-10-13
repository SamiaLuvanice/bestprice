from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth.security import hash_password
from app.db import Base, get_session
from app.main import app
from app.marketplace.client import IntegrationError, ListingData, MercadoLivreClient
from app.products import routes, service
from app.products.models import (
    Notification,
    PriceAlert,
    PriceHistory,
    Product,
    TrackedProduct,
    User,
)
from app.products.routes import get_marketplace_client
from app.products.service import tracked_response

URL = "https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM"


class Source:
    def __init__(self) -> None:
        self.price: Decimal | None = Decimal("100.00")
        self.availability = "available"
        self.error: IntegrationError | None = None

    def get_listing(self, external_id: str) -> ListingData:
        if self.error is not None:
            raise self.error
        return ListingData(
            external_id=external_id, title="Fone", canonical_url=URL,
            image_url=None, price=self.price, currency="BRL", availability=self.availability,
        )


@pytest.fixture
def harness() -> Iterator[tuple[object, Source, TestClient]]:
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    source = Source()

    def isolated_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = isolated_session
    app.dependency_overrides[get_marketplace_client] = lambda: source
    with Session(engine) as session:
        session.add(User(email="pessoa@example.com", password_hash=hash_password("senha-validada-123")))
        session.commit()
    client = TestClient(app)
    assert client.post("/api/auth/login", json={"email": "pessoa@example.com", "password": "senha-validada-123"}).status_code == 200
    try:
        yield engine, source, client
    finally:
        app.dependency_overrides.clear()


def age_attempt(engine, **changes: object) -> None:
    with Session(engine) as session:
        product = session.scalar(select(Product))
        product.last_attempt_at = datetime.now(UTC) - timedelta(minutes=2)
        for name, value in changes.items():
            setattr(product, name, value)
        session.commit()


def refresh(engine, client: TestClient, tracking_id: str) -> dict:
    age_attempt(engine)
    response = client.post(f"/api/tracked-products/{tracking_id}/refresh")
    assert response.status_code == 200
    return response.json()


def alert_state(engine) -> tuple[int, bool, int]:
    with Session(engine) as session:
        alert = session.scalar(select(PriceAlert))
        notifications = session.scalar(select(func.count()).select_from(Notification))
        return alert.episode, alert.notified_in_episode, notifications


def test_unavailable_missing_price_or_stale_neither_fire_nor_rearm(harness) -> None:
    engine, source, client = harness
    tracking_id = client.post("/api/tracked-products", json={"url": URL}).json()["id"]
    assert client.post(f"/api/tracked-products/{tracking_id}/alert", json={"target_price": "90.00"}).status_code == 201
    source.price = Decimal("80.00")
    refresh(engine, client, tracking_id)
    assert alert_state(engine) == (1, True, 1)

    source.availability, source.price = "unavailable", Decimal("120.00")
    body = refresh(engine, client, tracking_id)
    assert body["alert"]["condition"] == "unknown"
    assert alert_state(engine) == (1, True, 1)

    source.availability, source.price = "available", None
    body = refresh(engine, client, tracking_id)
    assert body["product"]["last_attempt_status"] == "missing_price"
    assert body["alert"]["condition"] == "unknown"
    assert alert_state(engine) == (1, True, 1)

    source.price = Decimal("80.00")
    refresh(engine, client, tracking_id)
    assert alert_state(engine) == (1, True, 1)

    with Session(engine) as session:
        product = session.scalar(select(Product))
        product.current_price = Decimal("120.00")
        product.last_price_observed_at = datetime.now(UTC) - timedelta(days=2)
        session.commit()
    client.patch(f"/api/tracked-products/{tracking_id}/alert", json={"enabled": False})
    enabled = client.patch(f"/api/tracked-products/{tracking_id}/alert", json={"enabled": True})
    assert enabled.json()["condition"] == "unknown"
    assert alert_state(engine) == (1, True, 1)


def test_not_found_keeps_tracked_count_and_survives_reload_and_timeout(harness, monkeypatch) -> None:
    engine, source, client = harness
    monkeypatch.setattr(service, "uniform", lambda _lower, _upper: 1.0)
    tracking_id = client.post("/api/tracked-products", json={"url": URL}).json()["id"]
    source.error = IntegrationError("product_not_found")
    missing = refresh(engine, client, tracking_id)
    assert missing["product"]["lookup_status"] == "not_found"

    reloaded = client.get(f"/api/tracked-products/{tracking_id}").json()["product"]
    assert (reloaded["lookup_status"], reloaded["current_price"]) == ("not_found", "100.00")
    dashboard = client.get("/api/dashboard").json()
    assert dashboard["summary"]["tracked_count"] == 1
    assert dashboard["opportunities"] == []
    assert [item["id"] for item in client.get("/api/tracked-products").json()["items"]] == [tracking_id]

    source.error = IntegrationError("integration_unavailable")
    age_attempt(engine, next_check_at=datetime.now(UTC) - timedelta(seconds=1))
    assert client.post(f"/api/tracked-products/{tracking_id}/refresh").status_code == 503
    after_timeout = client.get(f"/api/tracked-products/{tracking_id}").json()["product"]
    assert (after_timeout["lookup_status"], after_timeout["current_price"]) == ("not_found", "100.00")
    assert after_timeout["last_attempt_status"] == "temporary_error"
    assert client.get("/api/dashboard").json()["summary"]["tracked_count"] == 1
    with Session(engine) as session:
        product = session.scalar(select(Product))
        assert product.next_check_at.replace(tzinfo=UTC) >= datetime.now(UTC) + timedelta(hours=23)
        assert session.scalar(select(func.count()).select_from(PriceHistory)) == 1


def test_resume_does_not_enable_alert_nor_repeat_old_events(harness) -> None:
    engine, source, client = harness
    tracking_id = client.post("/api/tracked-products", json={"url": URL}).json()["id"]
    client.post(f"/api/tracked-products/{tracking_id}/alert", json={"target_price": "50.00"})
    source.price = Decimal("90.00")
    refresh(engine, client, tracking_id)
    assert len(client.get("/api/dashboard").json()["recent_updates"]) == 1

    assert client.delete(f"/api/tracked-products/{tracking_id}").status_code == 204
    resumed = client.post("/api/tracked-products", json={"url": URL})
    assert resumed.status_code == 200
    assert resumed.json()["alert"]["enabled"] is False
    assert client.get(f"/api/tracked-products/{tracking_id}/alert").json()["enabled"] is False
    assert client.get("/api/dashboard").json()["recent_updates"] == []

    source.price = Decimal("85.00")
    refresh(engine, client, tracking_id)
    updates = client.get("/api/dashboard").json()["recent_updates"]
    assert [(item["previous_value"], item["current_value"]) for item in updates] == [("90.00", "85.00")]


def _seed(session: Session, user: User, number: int, now: datetime, *, history: list[tuple[str, datetime]],
          observed_at: datetime, active_since: datetime) -> TrackedProduct:
    product = Product(
        external_id=f"MLB99999999{number}", title=f"Produto {number}",
        canonical_url=f"https://produto.mercadolivre.com.br/MLB-99999999{number}-teste-_JM",
        current_price=Decimal(history[-1][0]), currency="BRL", price_context="mlb_marketplace_unit",
        availability="available", lookup_status="located", last_attempt_status="ok",
        last_attempt_at=observed_at, last_success_at=observed_at, last_price_observed_at=observed_at,
        price_changed_at=history[-1][1] if len(history) > 1 else None,
    )
    session.add(product)
    session.flush()
    tracked = TrackedProduct(user_id=user.id, product_id=product.id, active=True, active_since=active_since)
    session.add(tracked)
    session.add_all([
        PriceHistory(product_id=product.id, price=Decimal(price), currency="BRL", captured_at=captured)
        for price, captured in history
    ])
    session.flush()
    return tracked


def test_previous_zero_has_no_percentage_and_opportunities_exclude_old_stale_or_pre_tracking_drops(monkeypatch) -> None:
    fixed = datetime(2030, 1, 2, 12, tzinfo=UTC)

    class Clock(datetime):
        @classmethod
        def now(cls, _zone=None) -> datetime:
            return fixed

    monkeypatch.setattr(routes, "datetime", Clock)
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        user = User(email="metricas@example.com", password_hash="teste")
        session.add(user)
        session.flush()
        zero = _seed(session, user, 1, fixed, history=[("0.00", fixed - timedelta(hours=3)), ("50.00", fixed - timedelta(hours=1))],
                     observed_at=fixed - timedelta(minutes=5), active_since=fixed - timedelta(days=1))
        drop = [("100.00", fixed - timedelta(days=3)), ("80.00", fixed - timedelta(hours=1))]
        _seed(session, user, 2, fixed, history=drop, observed_at=fixed - timedelta(minutes=5),
              active_since=fixed - timedelta(minutes=30))
        _seed(session, user, 3, fixed, history=drop, observed_at=fixed - timedelta(hours=2),
              active_since=fixed - timedelta(days=1))
        _seed(session, user, 4, fixed, history=[("100.00", fixed - timedelta(days=3)), ("80.00", fixed - timedelta(hours=30))],
              observed_at=fixed - timedelta(minutes=5), active_since=fixed - timedelta(days=2))
        _seed(session, user, 5, fixed, history=drop, observed_at=fixed - timedelta(minutes=5),
              active_since=fixed - timedelta(days=1))
        session.commit()

        summary = tracked_response(session, zero, session.get(Product, zero.product_id), fixed).product
        assert (summary.previous_price, summary.absolute_change, summary.percentage_change) == (
            Decimal("0.00"), Decimal("50.00"), None,
        )
        dashboard = routes.get_dashboard(user, session)
        assert [card.product.title for card in dashboard.opportunities] == ["Produto 5"]
        assert dashboard.summary.price_drop_count == 1
        assert dashboard.summary.tracked_count == 5


def test_sub_cent_source_noise_does_not_create_phantom_change() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    amounts = iter(["99.90", "99.899", "99.901"])

    def respond(request: httpx.Request) -> httpx.Response:
        if request.url.path.endswith("/sale_price"):
            return httpx.Response(200, content=f'{{"amount": {next(amounts)}, "currency_id": "BRL"}}'.encode())
        return httpx.Response(200, json={
            "id": "MLB1234567890", "site_id": "MLB", "title": "Fone", "permalink": URL,
            "status": "active", "available_quantity": 1, "currency_id": "BRL",
        })

    client = MercadoLivreClient("token-test", httpx.MockTransport(respond))
    with Session(engine) as session:
        user = User(email="centavos@example.com", password_hash="teste")
        session.add(user)
        session.commit()
        tracked, _ = service.add_tracking(session, user.id, URL, client)
        for minutes in (2, 4):
            product = session.scalar(select(Product))
            product.last_attempt_at = datetime.now(UTC) - timedelta(minutes=minutes + 60)
            session.commit()
            refreshed = service.refresh_tracking(session, user.id, tracked.id, client)
            assert refreshed.product.price_changed_at is None
        assert session.scalar(select(func.count()).select_from(PriceHistory)) == 1
        assert session.scalar(select(Product)).current_price == Decimal("99.90")
