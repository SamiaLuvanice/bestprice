import os
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from alembic.config import Config
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from alembic import command
from app.marketplace.client import ListingData
from app.monitoring.worker import run_cycle
from app.products.models import PriceHistory, Product, TrackedProduct, User
from app.products.service import add_tracking


def test_concurrent_users_share_one_external_lookup(monkeypatch: pytest.MonkeyPatch) -> None:
    test_url = os.environ.get("TEST_DATABASE_URL")
    if not test_url:
        pytest.skip("TEST_DATABASE_URL não configurada para integração PostgreSQL")
    monkeypatch.setenv("DATABASE_URL", test_url)
    command.upgrade(Config("alembic.ini"), "head")
    engine = create_engine(test_url.replace("postgresql://", "postgresql+psycopg://", 1))
    external_id = f"MLB{uuid.uuid4().int % 10**15}"
    url = f"https://produto.mercadolivre.com.br/{external_id[:3]}-{external_id[3:]}-teste-_JM"
    user_ids = [uuid.uuid4(), uuid.uuid4()]
    with Session(engine) as session:
        session.add_all([User(id=user_id, email=f"{user_id}@example.com", password_hash="teste") for user_id in user_ids])
        session.commit()

    class Source:
        calls = 0
        guard = threading.Lock()

        def get_listing(self, listing_id: str) -> ListingData:
            with self.guard:
                self.calls += 1
            time.sleep(0.2)
            return ListingData(
                external_id=listing_id, title="Teste de concorrência", canonical_url=url,
                image_url=None, price=Decimal("75.00"), currency="BRL", availability="available",
            )

    source = Source()
    barrier = threading.Barrier(2)

    def register(user_id: uuid.UUID) -> uuid.UUID:
        barrier.wait(timeout=5)
        with Session(engine) as session:
            result, _created = add_tracking(session, user_id, url, source)
            return result.id

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(register, user_ids))
    assert len(set(results)) == 2
    assert source.calls == 1
    with Session(engine) as session:
        product = session.scalar(select(Product).where(Product.external_id == external_id))
        assert product is not None
        assert len(session.scalars(select(TrackedProduct).where(TrackedProduct.product_id == product.id)).all()) == 2
        assert len(session.scalars(select(PriceHistory).where(PriceHistory.product_id == product.id)).all()) == 1
    engine.dispose()


def test_concurrent_worker_sessions_refresh_due_listing_once(monkeypatch: pytest.MonkeyPatch) -> None:
    test_url = os.environ.get("TEST_DATABASE_URL")
    if not test_url:
        pytest.skip("TEST_DATABASE_URL não configurada para integração PostgreSQL")
    monkeypatch.setenv("DATABASE_URL", test_url)
    command.upgrade(Config("alembic.ini"), "head")
    engine = create_engine(test_url.replace("postgresql://", "postgresql+psycopg://", 1))
    external_id = f"MLB{uuid.uuid4().int % 10**15}"
    url = f"https://produto.mercadolivre.com.br/{external_id[:3]}-{external_id[3:]}-teste-_JM"
    user = User(id=uuid.uuid4(), email=f"{uuid.uuid4()}@example.com", password_hash="teste")

    class Source:
        calls = 0
        guard = threading.Lock()

        def get_listing(self, listing_id: str) -> ListingData:
            with self.guard:
                self.calls += 1
                price = Decimal("75.00") if self.calls == 1 else Decimal("60.00")
            time.sleep(0.2)
            return ListingData(
                external_id=listing_id, title="Teste de worker", canonical_url=url,
                image_url=None, price=price, currency="BRL", availability="available",
            )

    source = Source()
    with Session(engine) as session:
        session.add(user)
        session.commit()
        add_tracking(session, user.id, url, source)
        product = session.scalar(select(Product).where(Product.external_id == external_id))
        product.next_check_at = datetime(1970, 1, 1, tzinfo=UTC)
        product.last_attempt_at = datetime.now(UTC) - timedelta(hours=2)
        session.commit()

    barrier = threading.Barrier(2)

    def cycle() -> int:
        with Session(engine) as session:
            barrier.wait(timeout=5)
            return run_cycle(session, source, limit=1)

    with ThreadPoolExecutor(max_workers=2) as pool:
        counts = list(pool.map(lambda _: cycle(), range(2)))

    assert sorted(counts) == [0, 1]
    assert source.calls == 2  # primeiro cadastro e apenas uma atualização
    with Session(engine) as session:
        product = session.scalar(select(Product).where(Product.external_id == external_id))
        assert product.current_price == Decimal("60.00")
        assert len(session.scalars(select(PriceHistory).where(PriceHistory.product_id == product.id)).all()) == 2
    engine.dispose()


def test_worker_respects_configured_concurrency(monkeypatch: pytest.MonkeyPatch) -> None:
    test_url = os.environ.get("TEST_DATABASE_URL")
    if not test_url:
        pytest.skip("TEST_DATABASE_URL não configurada para integração PostgreSQL")
    monkeypatch.setenv("DATABASE_URL", test_url)
    monkeypatch.setenv("MONITOR_MAX_CONCURRENCY", "2")
    command.upgrade(Config("alembic.ini"), "head")
    engine = create_engine(test_url.replace("postgresql://", "postgresql+psycopg://", 1))
    user = User(id=uuid.uuid4(), email=f"{uuid.uuid4()}@example.com", password_hash="teste")

    class Source:
        active = 0
        peak = 0
        guard = threading.Lock()

        def get_listing(self, listing_id: str) -> ListingData:
            with self.guard:
                self.active += 1
                self.peak = max(self.peak, self.active)
            time.sleep(0.2)
            with self.guard:
                self.active -= 1
            return ListingData(
                external_id=listing_id, title="Teste de limite", canonical_url=f"https://produto.mercadolivre.com.br/MLB-{listing_id[3:]}-teste-_JM",
                image_url=None, price=Decimal("75.00"), currency="BRL", availability="available",
            )

    source = Source()
    with Session(engine) as session:
        session.add(user)
        session.commit()
        for _ in range(2):
            external_id = f"MLB{uuid.uuid4().int % 10**15}"
            url = f"https://produto.mercadolivre.com.br/MLB-{external_id[3:]}-teste-_JM"
            add_tracking(session, user.id, url, source)
            product = session.scalar(select(Product).where(Product.external_id == external_id))
            product.next_check_at = datetime(1970, 1, 1, tzinfo=UTC)
            product.last_attempt_at = datetime.now(UTC) - timedelta(hours=2)
            session.commit()
        source.peak = 0
        assert run_cycle(session, source, limit=2) == 2
    assert source.peak == 2
    engine.dispose()
