"""AC-005: a failure in the middle of the registration write leaves no partial rows."""

import os
import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from alembic.config import Config
from sqlalchemy import create_engine, event, func, select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from alembic import command
from app.marketplace.client import ListingData
from app.products.models import (
    PriceHistory,
    Product,
    ProductEvent,
    TrackedProduct,
    User,
)
from app.products.service import add_tracking


def _engine(monkeypatch: pytest.MonkeyPatch) -> Engine:
    test_url = os.environ.get("TEST_DATABASE_URL")
    if not test_url:
        pytest.skip("TEST_DATABASE_URL não configurada para integração PostgreSQL")
    monkeypatch.setenv("DATABASE_URL", test_url)
    command.upgrade(Config("alembic.ini"), "head")
    return create_engine(test_url.replace("postgresql://", "postgresql+psycopg://", 1))


class Source:
    def __init__(self, url: str, price: str) -> None:
        self.url = url
        self.price = Decimal(price)
        self.calls = 0

    def get_listing(self, listing_id: str) -> ListingData:
        self.calls += 1
        return ListingData(
            external_id=listing_id, title="Falha transacional", canonical_url=self.url,
            image_url=None, price=self.price, currency="BRL", availability="available",
        )


class InjectedFailure(RuntimeError):
    pass


def _fail_after_link_insert(session: Session) -> list[str]:
    """Abort right after the INSERTs of the link (and price) reach PostgreSQL, before COMMIT."""
    flushed: list[str] = []

    @event.listens_for(session, "after_flush")
    def explode(flushing: Session, _context: object) -> None:
        flushed.extend(type(row).__name__ for row in flushing.new)
        if any(isinstance(row, TrackedProduct) for row in flushing.new):
            raise InjectedFailure("falha injetada depois do INSERT do vínculo")

    return flushed


def _count(session: Session, model: type, **filters: object) -> int:
    query = select(func.count()).select_from(model)
    for name, value in filters.items():
        query = query.where(getattr(model, name) == value)
    return session.scalar(query)


def test_new_listing_write_failure_leaves_no_rows_and_retry_succeeds(monkeypatch: pytest.MonkeyPatch) -> None:
    engine = _engine(monkeypatch)
    external_id = f"MLB{uuid.uuid4().int % 10**15}"
    url = f"https://produto.mercadolivre.com.br/MLB-{external_id[3:]}-teste-_JM"
    user_id = uuid.uuid4()
    with Session(engine) as session:
        session.add(User(id=user_id, email=f"{user_id}@example.com", password_hash="teste"))
        session.commit()
    source = Source(url, "75.00")

    with Session(engine) as session:
        flushed = _fail_after_link_insert(session)
        with pytest.raises(InjectedFailure):
            add_tracking(session, user_id, url, source)
    # The publication was inserted in an earlier flush; price and link in the failing one.
    assert {"Product", "PriceHistory", "TrackedProduct"} <= set(flushed)

    with Session(engine) as session:
        assert session.scalar(select(Product).where(Product.external_id == external_id)) is None
        assert _count(session, TrackedProduct, user_id=user_id) == 0
        orphans = select(func.count()).select_from(PriceHistory).outerjoin(
            Product, Product.id == PriceHistory.product_id,
        ).where(Product.id.is_(None))
        assert session.scalar(orphans) == 0

    # Retry with a fresh session: the listing lock was released and nothing blocks the new write.
    with Session(engine) as session:
        result, created = add_tracking(session, user_id, url, source)
    assert created is True
    assert result.product.current_price == Decimal("75.00")
    with Session(engine) as session:
        product = session.scalar(select(Product).where(Product.external_id == external_id))
        assert product is not None
        assert _count(session, TrackedProduct, user_id=user_id, product_id=product.id) == 1
        assert _count(session, PriceHistory, product_id=product.id) == 1
    assert source.calls == 2
    engine.dispose()


def test_shared_listing_write_failure_keeps_previous_state_and_retry_succeeds(monkeypatch: pytest.MonkeyPatch) -> None:
    engine = _engine(monkeypatch)
    external_id = f"MLB{uuid.uuid4().int % 10**15}"
    url = f"https://produto.mercadolivre.com.br/MLB-{external_id[3:]}-teste-_JM"
    first, second = uuid.uuid4(), uuid.uuid4()
    with Session(engine) as session:
        session.add_all([User(id=uid, email=f"{uid}@example.com", password_hash="teste") for uid in (first, second)])
        session.commit()
    with Session(engine) as session:
        add_tracking(session, first, url, Source(url, "80.00"))
        product = session.scalar(select(Product).where(Product.external_id == external_id))
        # Stale shared listing: the second registration must query the source and update it.
        old = datetime.now(UTC) - timedelta(days=2)
        product.last_price_observed_at = old
        product.last_attempt_at = old
        product.last_success_at = old
        product.next_check_at = old
        session.commit()
        product_id = product.id

    source = Source(url, "60.00")
    with Session(engine) as session:
        _fail_after_link_insert(session)
        with pytest.raises(InjectedFailure):
            add_tracking(session, second, url, source)
    assert source.calls == 1

    with Session(engine) as session:
        product = session.get(Product, product_id)
        assert product.current_price == Decimal("80.00")
        assert product.last_attempt_at == old
        assert product.price_changed_at is None
        assert _count(session, PriceHistory, product_id=product_id) == 1
        assert _count(session, ProductEvent, product_id=product_id) == 0
        assert _count(session, TrackedProduct, user_id=second) == 0

    with Session(engine) as session:
        result, created = add_tracking(session, second, url, source)
    assert created is True
    assert result.product.current_price == Decimal("60.00")
    with Session(engine) as session:
        assert _count(session, PriceHistory, product_id=product_id) == 2
        assert _count(session, ProductEvent, product_id=product_id, type="price_changed") == 1
        assert _count(session, TrackedProduct, product_id=product_id) == 2
    engine.dispose()
