from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.db import Base
from app.errors import ApiError
from app.marketplace.client import IntegrationError, ListingData
from app.products import service
from app.products.models import PriceHistory, Product, User


class Source:
    price: Decimal | None = Decimal("100.00")
    availability = "available"
    error: IntegrationError | None = None

    def get_listing(self, external_id: str) -> ListingData:
        if self.error is not None:
            raise self.error
        return ListingData(
            external_id=external_id, title="Fone",
            canonical_url="https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM",
            image_url=None, price=self.price, currency="BRL", availability=self.availability,
        )


def utc(value: datetime) -> datetime:
    return value if value.tzinfo is not None else value.replace(tzinfo=UTC)


def test_not_found_then_timeout_keeps_state_and_24_hour_retry(monkeypatch) -> None:
    initial = datetime(2030, 1, 2, 12, tzinfo=UTC)

    class Clock(datetime):
        @classmethod
        def now(cls, _zone=None) -> datetime:
            return initial

    monkeypatch.setattr(service, "datetime", Clock)
    monkeypatch.setattr(service, "uniform", lambda _lower, _upper: 1.0)
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    source = Source()
    with Session(engine) as session:
        user = User(email="lifecycle@example.com", password_hash="teste")
        session.add(user)
        session.commit()
        tracked, _ = service.add_tracking(
            session, user.id, "https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM", source,
        )
        product = session.get(Product, tracked.product.id)
        source.error = IntegrationError("product_not_found")
        not_found_at = initial + timedelta(hours=1)
        missing = service.refresh_tracking(session, user.id, tracked.id, source, now=not_found_at)
        assert missing.product.lookup_status == "not_found"
        assert utc(product.next_check_at) == not_found_at + timedelta(hours=24)

        source.error = IntegrationError("integration_unavailable")
        timeout_at = not_found_at + timedelta(hours=24)
        with pytest.raises(ApiError) as error:
            service.refresh_tracking(session, user.id, tracked.id, source, now=timeout_at)
        assert error.value.code == "integration_unavailable"
        session.refresh(product)
        assert product.lookup_status == "not_found"
        assert product.last_attempt_status == "temporary_error"
        assert utc(product.last_attempt_at) == timeout_at
        assert utc(product.last_success_at) == initial
        assert utc(product.last_price_observed_at) == initial
        assert utc(product.next_check_at) >= timeout_at + timedelta(hours=24)
        assert product.current_price == Decimal("100.00")
        assert len(session.scalars(select(PriceHistory)).all()) == 1

        source.error = None
        recovered_at = timeout_at + timedelta(hours=24)
        recovered = service.refresh_tracking(session, user.id, tracked.id, source, now=recovered_at)
        assert recovered.product.lookup_status == "located"
        assert recovered.product.last_attempt_status == "ok"
        assert utc(product.last_price_observed_at) == recovered_at
        assert product.price_changed_at is None
        assert len(session.scalars(select(PriceHistory)).all()) == 1

        source.price = Decimal("80.00")
        changed_at = recovered_at + timedelta(hours=1)
        changed = service.refresh_tracking(session, user.id, tracked.id, source, now=changed_at)
        assert changed.product.current_price == Decimal("80.00")
        assert utc(product.price_changed_at) == changed_at
        assert len(session.scalars(select(PriceHistory)).all()) == 2


def test_missing_price_and_attempt_timestamps_follow_controlled_clock(monkeypatch) -> None:
    initial = datetime(2030, 2, 3, 12, tzinfo=UTC)

    class Clock(datetime):
        @classmethod
        def now(cls, _zone=None) -> datetime:
            return initial

    monkeypatch.setattr(service, "datetime", Clock)
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    source = Source()
    source.price = None
    source.availability = "unknown"
    with Session(engine) as session:
        user = User(email="missing-price@example.com", password_hash="teste")
        session.add(user)
        session.commit()
        url = "https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM"
        source.error = IntegrationError("integration_unavailable")
        with pytest.raises(ApiError):
            service.add_tracking(session, user.id, url, source)
        assert session.scalar(select(Product)) is None

        source.error = None
        tracked, _ = service.add_tracking(session, user.id, url, source)
        product = session.get(Product, tracked.product.id)
        assert tracked.product.current_price is None
        assert tracked.product.stale is True
        assert product.availability == "unknown"
        assert product.last_confirmed_availability is None
        assert utc(product.last_attempt_at) == initial
        assert utc(product.last_success_at) == initial
        assert product.last_price_observed_at is None
        assert session.scalars(select(PriceHistory)).all() == []

        source.price = Decimal("100.00")
        first_price_at = initial + timedelta(hours=1)
        first_price = service.refresh_tracking(session, user.id, tracked.id, source, now=first_price_at)
        assert first_price.product.current_price == Decimal("100.00")
        assert first_price.product.previous_price is None
        assert product.price_changed_at is None
        assert utc(product.last_price_observed_at) == first_price_at
        assert len(session.scalars(select(PriceHistory)).all()) == 1

        same_price_at = initial + timedelta(hours=2)
        service.refresh_tracking(session, user.id, tracked.id, source, now=same_price_at)
        assert utc(product.last_price_observed_at) == same_price_at
        assert product.price_changed_at is None
        assert len(session.scalars(select(PriceHistory)).all()) == 1

        source.price = Decimal("80.00")
        changed_at = initial + timedelta(hours=3)
        service.refresh_tracking(session, user.id, tracked.id, source, now=changed_at)
        assert utc(product.price_changed_at) == changed_at
        assert len(session.scalars(select(PriceHistory)).all()) == 2

        source.price = None
        missing_again_at = initial + timedelta(hours=4)
        missing_again = service.refresh_tracking(session, user.id, tracked.id, source, now=missing_again_at)
        assert missing_again.product.last_attempt_status == "missing_price"
        assert missing_again.product.current_price == Decimal("80.00")
        assert utc(product.last_success_at) == missing_again_at
        assert utc(product.last_price_observed_at) == changed_at

        source.error = IntegrationError("integration_unavailable")
        error_at = initial + timedelta(hours=5)
        with pytest.raises(ApiError):
            service.refresh_tracking(session, user.id, tracked.id, source, now=error_at)
        session.refresh(product)
        assert product.last_attempt_status == "temporary_error"
        assert utc(product.last_attempt_at) == error_at
        assert utc(product.last_success_at) == missing_again_at
        assert utc(product.last_price_observed_at) == changed_at
        assert len(session.scalars(select(PriceHistory)).all()) == 2
