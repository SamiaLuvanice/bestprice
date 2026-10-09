import re
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth.security import hash_password
from app.db import Base, get_session
from app.main import app
from app.marketplace.client import IntegrationError, ListingData
from app.products.models import (
    PriceHistory,
    Product,
    ProductEvent,
    TrackedProduct,
    User,
)
from app.products.routes import get_marketplace_client

URL = "https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM"


class Source:
    def __init__(self) -> None:
        self.calls = 0
        self.error: IntegrationError | None = None
        self.price: Decimal | None = Decimal("100.00")

    def get_listing(self, external_id: str) -> ListingData:
        self.calls += 1
        if self.error is not None:
            raise self.error
        return ListingData(
            external_id=external_id, title="Fone", canonical_url=URL,
            image_url=None, price=self.price, currency="BRL", availability="available",
        )


@pytest.fixture
def harness() -> Iterator[tuple[object, Source]]:
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    source = Source()

    def isolated_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = isolated_session
    app.dependency_overrides[get_marketplace_client] = lambda: source
    with Session(engine) as session:
        session.add_all([
            User(email="primeira@example.com", password_hash=hash_password("senha-validada-123")),
            User(email="segunda@example.com", password_hash=hash_password("senha-validada-456")),
        ])
        session.commit()
    try:
        yield engine, source
    finally:
        app.dependency_overrides.clear()


def login(email: str, password: str) -> TestClient:
    client = TestClient(app)
    assert client.post("/api/auth/login", json={"email": email, "password": password}).status_code == 200
    return client


def counts(engine) -> tuple[int, int, int]:
    with Session(engine) as session:
        return (
            session.scalar(select(func.count()).select_from(Product)),
            session.scalar(select(func.count()).select_from(TrackedProduct)),
            session.scalar(select(func.count()).select_from(PriceHistory)),
        )


@pytest.mark.parametrize(
    ("code", "retry_after", "status", "message"),
    [
        ("product_not_found", None, 404, "Anúncio não localizado no Mercado Livre."),
        ("integration_rate_limited", 42, 429, "limite de consultas"),
        ("integration_unavailable", None, 503, "não respondeu"),
        ("integration_auth_required", None, 503, "autorização"),
        ("integration_access_denied", None, 503, "não permitiu"),
        ("integration_invalid_response", None, 502, "dados incompletos"),
        ("unsupported_price_context", None, 502, "preço único"),
        ("integration_not_configured", None, 503, "cadastro de novos anúncios está indisponível"),
    ],
)
def test_registration_source_error_has_specific_message_and_no_partial_data(
    harness, code: str, retry_after: int | None, status: int, message: str,
) -> None:
    engine, source = harness
    source.error = IntegrationError(code, retry_after)
    client = login("primeira@example.com", "senha-validada-123")

    response = client.post("/api/tracked-products", json={"url": URL})

    assert response.status_code == status
    error = response.json()["error"]
    assert error["code"] == code
    assert message in error["message"]
    assert error["retry_after_seconds"] == retry_after
    if retry_after is not None:
        assert response.headers["Retry-After"] == str(retry_after)
    assert counts(engine) == (0, 0, 0)


def test_unknown_source_code_is_reported_as_unavailable(harness) -> None:
    _engine, source = harness
    source.error = IntegrationError("something_new")
    client = login("primeira@example.com", "senha-validada-123")

    response = client.post("/api/tracked-products", json={"url": URL})

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "integration_unavailable"


def _register_then_age(engine, source: Source, **changes: object) -> None:
    client = login("primeira@example.com", "senha-validada-123")
    assert client.post("/api/tracked-products", json={"url": URL}).status_code == 201
    with Session(engine) as session:
        product = session.scalar(select(Product))
        old = datetime.now(UTC) - timedelta(hours=3)
        product.last_attempt_at = old
        product.last_price_observed_at = old
        for name, value in changes.items():
            setattr(product, name, value)
        session.commit()
    source.calls = 0


def test_registration_of_existing_listing_respects_integration_retry_after(harness) -> None:
    engine, source = harness
    _register_then_age(
        engine, source,
        last_attempt_status="rate_limited",
        retry_after_at=datetime.now(UTC) + timedelta(seconds=120),
        next_check_at=datetime.now(UTC) + timedelta(seconds=120),
    )
    second = login("segunda@example.com", "senha-validada-456")

    response = second.post("/api/tracked-products", json={"url": URL})

    assert response.status_code == 429
    assert response.json()["error"]["code"] == "integration_rate_limited"
    assert 0 < response.json()["error"]["retry_after_seconds"] <= 120
    assert response.headers["Retry-After"] == str(response.json()["error"]["retry_after_seconds"])
    assert source.calls == 0
    assert counts(engine)[1] == 1


def test_registration_of_existing_listing_respects_failure_backoff(harness) -> None:
    engine, source = harness
    _register_then_age(
        engine, source,
        last_attempt_status="temporary_error",
        next_check_at=datetime.now(UTC) + timedelta(minutes=30),
    )
    second = login("segunda@example.com", "senha-validada-456")

    response = second.post("/api/tracked-products", json={"url": URL})

    assert response.status_code == 429
    assert response.json()["error"]["code"] == "refresh_not_due"
    assert response.headers["Retry-After"] == str(response.json()["error"]["retry_after_seconds"])
    assert source.calls == 0


def test_registration_of_existing_listing_respects_attempt_cooldown(harness) -> None:
    engine, source = harness
    _register_then_age(engine, source, last_attempt_at=datetime.now(UTC) - timedelta(seconds=10))
    second = login("segunda@example.com", "senha-validada-456")

    response = second.post("/api/tracked-products", json={"url": URL})

    assert response.status_code == 429
    assert response.json()["error"]["code"] == "refresh_not_due"
    assert source.calls == 0


def test_registration_of_listing_recently_confirmed_missing_does_not_query_source(harness) -> None:
    engine, source = harness
    _register_then_age(
        engine, source,
        lookup_status="not_found", last_attempt_status="not_found",
        next_check_at=datetime.now(UTC) + timedelta(hours=20),
    )
    second = login("segunda@example.com", "senha-validada-456")

    response = second.post("/api/tracked-products", json={"url": URL})

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "product_not_found"
    assert source.calls == 0
    assert counts(engine)[1] == 1


def test_registration_of_stale_listing_with_due_check_queries_source(harness) -> None:
    engine, source = harness
    _register_then_age(engine, source)
    source.price = Decimal("90.00")
    second = login("segunda@example.com", "senha-validada-456")

    response = second.post("/api/tracked-products", json={"url": URL})

    assert response.status_code == 201
    assert response.json()["product"]["current_price"] == "90.00"
    assert source.calls == 1


def test_refresh_without_configured_integration_does_not_record_attempt(harness, monkeypatch) -> None:
    engine, _source = harness
    client = login("primeira@example.com", "senha-validada-123")
    created = client.post("/api/tracked-products", json={"url": URL}).json()
    with Session(engine) as session:
        product = session.scalar(select(Product))
        product.last_attempt_at = datetime.now(UTC) - timedelta(hours=2)
        session.commit()
        before = (product.last_attempt_at, product.last_attempt_status, product.failure_count, product.next_check_at)
    del app.dependency_overrides[get_marketplace_client]
    monkeypatch.setenv("MERCADOLIVRE_THIRD_PARTY_VALIDATED", "false")

    response = client.post(f"/api/tracked-products/{created['id']}/refresh")

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "integration_not_configured"
    with Session(engine) as session:
        product = session.scalar(select(Product))
        assert (product.last_attempt_at, product.last_attempt_status, product.failure_count, product.next_check_at) == before
    assert "integração oficial com o Mercado Livre" in response.json()["error"]["message"]


def test_dashboard_events_use_utc_z_and_declared_schema(harness) -> None:
    engine, _source = harness
    client = login("primeira@example.com", "senha-validada-123")
    created = client.post("/api/tracked-products", json={"url": URL}).json()
    with Session(engine) as session:
        session.add(ProductEvent(
            product_id=session.scalar(select(Product.id)), type="price_changed",
            previous_value="100.00", current_value="90.00",
            observed_at=datetime.now(UTC) + timedelta(seconds=1),
        ))
        session.commit()

    body = client.get("/api/dashboard").json()

    assert set(body) == {"summary", "opportunities", "tracked_products", "recent_updates"}
    event = body["recent_updates"][0]
    assert event["tracked_product_id"] == created["id"]
    assert event["currency"] == "BRL"
    assert re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z", event["observed_at"])
    schema = app.openapi()["paths"]["/api/dashboard"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
    assert schema.get("$ref", "").endswith("/DashboardResponse")
