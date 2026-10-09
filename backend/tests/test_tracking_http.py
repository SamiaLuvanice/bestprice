from collections.abc import Iterator
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth.security import hash_password
from app.db import Base, get_session
from app.main import app
from app.marketplace.client import ListingData
from app.products.models import PriceHistory, Product, TrackedProduct, User
from app.products.routes import get_marketplace_client


class ListingSource:
    def __init__(self) -> None:
        self.calls = 0

    def get_listing(self, external_id: str) -> ListingData:
        self.calls += 1
        return ListingData(
            external_id=external_id, title="Fone sem fio",
            canonical_url="https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM",
            image_url=None, price=Decimal("99.90"), currency="BRL", availability="available",
        )


def test_tracking_reuses_listing_across_users_and_blocks_duplicate() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    source = ListingSource()

    def isolated_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = isolated_session
    app.dependency_overrides[get_marketplace_client] = lambda: source
    url = "https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM"
    try:
        with Session(engine) as session:
            session.add_all([
                User(email="primeira@example.com", password_hash=hash_password("senha-validada-123")),
                User(email="segunda@example.com", password_hash=hash_password("senha-validada-456")),
            ])
            session.commit()
        first = TestClient(app)
        assert first.post("/api/auth/login", json={"email": "primeira@example.com", "password": "senha-validada-123"}).status_code == 200
        created = first.post("/api/tracked-products", json={"url": url})
        assert created.status_code == 201
        assert created.json()["product"]["current_price"] == "99.90"
        invalid = first.post("/api/tracked-products", json={"url": url, "manual_price": "1.00"})
        assert invalid.status_code == 422
        assert invalid.json()["error"]["code"] == "validation_error"
        assert invalid.json()["error"]["fields"][0]["field"] == "manual_price"
        duplicate = first.post("/api/tracked-products", json={"url": url})
        assert duplicate.status_code == 409
        assert duplicate.json()["error"]["tracked_product_id"] == created.json()["id"]

        second = TestClient(app)
        assert second.post("/api/auth/login", json={"email": "segunda@example.com", "password": "senha-validada-456"}).status_code == 200
        reused = second.post("/api/tracked-products", json={"url": url})
        assert reused.status_code == 201
        assert reused.json()["product"]["id"] == created.json()["product"]["id"]
        assert second.get(f"/api/tracked-products/{created.json()['id']}").status_code == 404
        listed = first.get("/api/tracked-products")
        assert listed.status_code == 200
        assert [item["id"] for item in listed.json()["items"]] == [created.json()["id"]]
        assert first.get("/api/tracked-products?cursor=invalid!").json()["error"]["code"] == "validation_error"
        assert first.delete(f"/api/tracked-products/{created.json()['id']}").status_code == 204
        assert first.get("/api/tracked-products").json()["items"] == []
        assert len(second.get("/api/tracked-products").json()["items"]) == 1
        restarted = first.post("/api/tracked-products", json={"url": url})
        assert restarted.status_code == 200
        assert restarted.json()["id"] == created.json()["id"]
        assert source.calls == 1
        with Session(engine) as session:
            assert len(session.scalars(select(Product)).all()) == 1
            assert len(session.scalars(select(TrackedProduct)).all()) == 2
            assert len(session.scalars(select(PriceHistory)).all()) == 1
    finally:
        app.dependency_overrides.clear()


def test_local_tracking_decisions_precede_unavailable_marketplace(monkeypatch) -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    source = ListingSource()

    def isolated_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = isolated_session
    app.dependency_overrides[get_marketplace_client] = lambda: source
    url = "https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM"
    try:
        with Session(engine) as session:
            session.add(User(email="pessoa@example.com", password_hash=hash_password("senha-validada-123")))
            session.commit()
        client = TestClient(app)
        assert client.post("/api/auth/login", json={"email": "pessoa@example.com", "password": "senha-validada-123"}).status_code == 200
        created = client.post("/api/tracked-products", json={"url": url})
        assert created.status_code == 201
        del app.dependency_overrides[get_marketplace_client]
        monkeypatch.setenv("MERCADOLIVRE_THIRD_PARTY_VALIDATED", "false")

        invalid = client.post("/api/tracked-products", json={"url": "https://example.com/item"})
        assert invalid.status_code == 400
        assert invalid.json()["error"]["code"] == "invalid_url"
        duplicate = client.post("/api/tracked-products", json={"url": url})
        assert duplicate.status_code == 409
        assert duplicate.json()["error"]["tracked_product_id"] == created.json()["id"]
        assert client.delete(f"/api/tracked-products/{created.json()['id']}").status_code == 204
        resumed = client.post("/api/tracked-products", json={"url": url})
        assert resumed.status_code == 200
        assert resumed.json()["id"] == created.json()["id"]
        new_listing = client.post("/api/tracked-products", json={
            "url": "https://produto.mercadolivre.com.br/MLB-9999999999-outro-_JM",
        })
        assert new_listing.status_code == 503
        assert new_listing.json()["error"]["code"] == "integration_not_configured"
        assert source.calls == 1
    finally:
        app.dependency_overrides.clear()
