"""AC-016: ambiguous variation or personal benefit never reaches the shared price history."""

import os
import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import httpx
import pytest
from alembic.config import Config
from sqlalchemy import create_engine, func, select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from alembic import command
from app.errors import ApiError
from app.marketplace.client import MercadoLivreClient
from app.products.models import (
    PriceHistory,
    Product,
    ProductEvent,
    TrackedProduct,
    User,
)
from app.products.service import add_tracking, refresh_tracking

AMBIGUOUS_VARIATION = {
    "item": {"variations": [{"id": 1, "price": 99.90}, {"id": 2, "price": 129.90}]},
    "sale": {"amount": 99.90, "currency_id": "BRL"},
}
PERSONAL_BENEFIT = {
    "item": {},
    "sale": {
        "amount": 79.90, "currency_id": "BRL",
        "conditions": {"context_restrictions": ["channel_marketplace", "user_type_loyalty_3"], "eligible": True},
    },
}
SCENARIOS = {"ambiguous_variation": AMBIGUOUS_VARIATION, "personal_benefit": PERSONAL_BENEFIT}


def _engine(monkeypatch: pytest.MonkeyPatch) -> Engine:
    test_url = os.environ.get("TEST_DATABASE_URL")
    if not test_url:
        pytest.skip("TEST_DATABASE_URL não configurada para integração PostgreSQL")
    monkeypatch.setenv("DATABASE_URL", test_url)
    command.upgrade(Config("alembic.ini"), "head")
    return create_engine(test_url.replace("postgresql://", "postgresql+psycopg://", 1))


class FakeApi:
    """Mock transport for the official item and sale_price resources; no network access."""

    def __init__(self, external_id: str) -> None:
        self.external_id = external_id
        self.response = {"item": {}, "sale": {"amount": 89.90, "currency_id": "BRL"}}
        self.calls = 0

    def __call__(self, request: httpx.Request) -> httpx.Response:
        self.calls += 1
        if request.url.path.endswith("/sale_price"):
            return httpx.Response(200, json=self.response["sale"])
        return httpx.Response(200, json={
            "id": self.external_id, "site_id": "MLB", "title": "Camiseta", "currency_id": "BRL",
            "permalink": f"https://produto.mercadolivre.com.br/MLB-{self.external_id[3:]}-camiseta-_JM",
            "status": "active", "available_quantity": 3, **self.response["item"],
        })


def _setup(engine: Engine) -> tuple[str, str, uuid.UUID, FakeApi, MercadoLivreClient]:
    external_id = f"MLB{uuid.uuid4().int % 10**15}"
    url = f"https://produto.mercadolivre.com.br/MLB-{external_id[3:]}-camiseta-_JM"
    user_id = uuid.uuid4()
    with Session(engine) as session:
        session.add(User(id=user_id, email=f"{user_id}@example.com", password_hash="teste"))
        session.commit()
    api = FakeApi(external_id)
    return external_id, url, user_id, api, MercadoLivreClient("token-test", httpx.MockTransport(api))


@pytest.mark.parametrize("scenario", SCENARIOS)
def test_registration_refuses_incompatible_price_context_without_rows(monkeypatch: pytest.MonkeyPatch, scenario: str) -> None:
    engine = _engine(monkeypatch)
    external_id, url, user_id, api, client = _setup(engine)
    api.response = SCENARIOS[scenario]

    with Session(engine) as session, pytest.raises(ApiError) as failure:
        add_tracking(session, user_id, url, client)

    assert (failure.value.status_code, failure.value.code) == (502, "unsupported_price_context")
    with Session(engine) as session:
        assert session.scalar(select(Product).where(Product.external_id == external_id)) is None
        assert session.scalar(select(func.count()).select_from(TrackedProduct).where(TrackedProduct.user_id == user_id)) == 0
    engine.dispose()


@pytest.mark.parametrize("scenario", SCENARIOS)
def test_refresh_flags_incompatible_price_context_and_keeps_shared_history(monkeypatch: pytest.MonkeyPatch, scenario: str) -> None:
    engine = _engine(monkeypatch)
    external_id, url, user_id, api, client = _setup(engine)
    with Session(engine) as session:
        tracked, _created = add_tracking(session, user_id, url, client)
        product = session.scalar(select(Product).where(Product.external_id == external_id))
        observed = product.last_price_observed_at
        product.next_check_at = datetime.now(UTC) - timedelta(seconds=1)
        product.last_attempt_at = datetime.now(UTC) - timedelta(hours=2)
        session.commit()
        product_id = product.id

    api.response = SCENARIOS[scenario]
    with Session(engine) as session, pytest.raises(ApiError) as failure:
        refresh_tracking(session, user_id, tracked.id, client)

    assert failure.value.code == "unsupported_price_context"
    with Session(engine) as session:
        product = session.get(Product, product_id)
        assert product.last_attempt_status == "unsupported_price_context"
        assert product.current_price == Decimal("89.90")
        assert product.last_price_observed_at == observed
        assert product.price_changed_at is None
        history = session.scalars(select(PriceHistory.price).where(PriceHistory.product_id == product_id)).all()
        assert history == [Decimal("89.90")]
        assert session.scalar(select(func.count()).select_from(ProductEvent).where(ProductEvent.product_id == product_id)) == 0
    engine.dispose()
