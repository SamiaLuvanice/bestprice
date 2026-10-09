from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth.security import hash_password
from app.db import Base
from app.marketplace.client import IntegrationError, ListingData
from app.monitoring.worker import run_cycle
from app.products.models import PriceHistory, Product, TrackedProduct, User
from app.products.service import add_tracking


class Source:
    def __init__(self) -> None:
        self.calls = 0
        self.price = Decimal("100.00")
        self.error: IntegrationError | None = None

    def get_listing(self, external_id: str) -> ListingData:
        self.calls += 1
        if self.error is not None:
            raise self.error
        return ListingData(
            external_id=external_id, title="Fone",
            canonical_url="https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM",
            image_url=None, price=self.price, currency="BRL", availability="available",
        )


def test_worker_refreshes_each_due_listing_once_and_preserves_price_on_failure() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    source = Source()
    with Session(engine) as session:
        users = [
            User(email="a@example.com", password_hash=hash_password("senha-validada-123")),
            User(email="b@example.com", password_hash=hash_password("senha-validada-456")),
        ]
        session.add_all(users)
        session.commit()
        url = "https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM"
        add_tracking(session, users[0].id, url, source)
        add_tracking(session, users[1].id, url, source)
        assert source.calls == 1
        product = session.scalar(select(Product))
        product.next_check_at = datetime.now(UTC) - timedelta(seconds=1)
        product.last_attempt_at = datetime.now(UTC) - timedelta(hours=2)
        session.commit()

        source.price = Decimal("80.00")
        assert run_cycle(session, source) == 1
        assert source.calls == 2
        assert run_cycle(session, source) == 0
        assert len(session.scalars(select(PriceHistory)).all()) == 2

        product.next_check_at = datetime.now(UTC) - timedelta(seconds=1)
        product.last_attempt_at = datetime.now(UTC) - timedelta(hours=2)
        session.commit()
        source.error = IntegrationError("integration_rate_limited", 42)
        assert run_cycle(session, source) == 1
        session.refresh(product)
        assert product.current_price == Decimal("80.00")
        assert product.last_attempt_status == "rate_limited"
        assert product.next_check_at.replace(tzinfo=UTC) > datetime.now(UTC) + timedelta(minutes=30)
        assert run_cycle(session, source) == 0
        assert len(session.scalars(select(PriceHistory)).all()) == 2

        for row in session.scalars(select(TrackedProduct)).all():
            row.active = False
        product.next_check_at = datetime.now(UTC) - timedelta(seconds=1)
        session.commit()
        assert run_cycle(session, source) == 0


def test_cadence_and_freshness_are_configurable(monkeypatch) -> None:
    monkeypatch.setenv("MONITOR_CHECK_INTERVAL_SECONDS", "7200")
    monkeypatch.setenv("MONITOR_FRESHNESS_SECONDS", "600")
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    source = Source()
    with Session(engine) as session:
        user = User(email="cadence@example.com", password_hash=hash_password("senha-validada-123"))
        session.add(user)
        session.commit()
        url = "https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM"
        first, _ = add_tracking(session, user.id, url, source)
        product = session.get(Product, first.product.id)
        assert product.next_check_at - product.last_attempt_at == timedelta(hours=2)
        observed = product.last_price_observed_at.replace(tzinfo=UTC)
        from app.products.service import tracked_response
        tracked = session.get(TrackedProduct, first.id)
        assert tracked_response(session, tracked, product, observed + timedelta(minutes=9)).product.stale is False
        assert tracked_response(session, tracked, product, observed + timedelta(minutes=10)).product.stale is True


def test_failed_refresh_uses_controlled_clock_and_jitter(monkeypatch) -> None:
    from app.errors import ApiError
    from app.products import service

    monkeypatch.setattr(service, "uniform", lambda lower, upper: 1.2)
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    source = Source()
    with Session(engine) as session:
        user = User(email="retry@example.com", password_hash=hash_password("senha-validada-123"))
        session.add(user)
        session.commit()
        tracked, _ = add_tracking(session, user.id, "https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM", source)
        product = session.get(Product, tracked.product.id)
        fixed = datetime(2030, 1, 2, 12, 0, tzinfo=UTC)
        source.error = IntegrationError("integration_invalid_response")
        with pytest.raises(ApiError) as error:
            service.refresh_tracking(session, user.id, tracked.id, source, now=fixed)
        assert error.value.code == "integration_invalid_response"
        session.refresh(product)
        assert product.last_attempt_at.replace(tzinfo=UTC) == fixed
        assert product.last_price_observed_at.replace(tzinfo=UTC) < fixed
        assert product.next_check_at.replace(tzinfo=UTC) == fixed + timedelta(minutes=72)
        assert len(session.scalars(select(PriceHistory)).all()) == 1


def test_unexpected_failure_on_one_listing_does_not_abort_cycle(monkeypatch, caplog) -> None:
    from app.products import service

    monkeypatch.setattr(service, "uniform", lambda _lower, _upper: 1.0)
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)

    class PoisonSource(Source):
        def get_listing(self, external_id: str) -> ListingData:
            if external_id == "MLB1111111111" and self.calls >= 2:
                self.calls += 1
                raise KeyError("payload-secreto")
            return super().get_listing(external_id)

    source = PoisonSource()
    with Session(engine) as session:
        user = User(email="poison@example.com", password_hash=hash_password("senha-validada-123"))
        session.add(user)
        session.commit()
        for number in ("1111111111", "2222222222"):
            add_tracking(session, user.id, f"https://produto.mercadolivre.com.br/MLB-{number}-fone-_JM", source)
        for product in session.scalars(select(Product)).all():
            product.next_check_at = datetime.now(UTC) - timedelta(seconds=1)
            product.last_attempt_at = datetime.now(UTC) - timedelta(hours=2)
        session.commit()
        source.price = Decimal("70.00")

        with caplog.at_level("WARNING"):
            assert run_cycle(session, source) == 2

    with Session(engine) as session:
        poisoned = session.scalar(select(Product).where(Product.external_id == "MLB1111111111"))
        healthy = session.scalar(select(Product).where(Product.external_id == "MLB2222222222"))
        assert healthy.current_price == Decimal("70.00")
        assert poisoned.current_price == Decimal("100.00")
        assert poisoned.last_attempt_status == "invalid_response"
        assert poisoned.failure_count == 1
        assert poisoned.next_check_at.replace(tzinfo=UTC) > datetime.now(UTC) + timedelta(minutes=50)
    assert str(poisoned.id) in caplog.text
    assert "KeyError" in caplog.text
    assert "payload-secreto" not in caplog.text
