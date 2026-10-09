import os
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from alembic.config import Config
from sqlalchemy import create_engine, select, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from alembic import command
from app import db
from app.errors import ApiError
from app.marketplace.client import ListingData
from app.products import locking, routes
from app.products.models import Notification, PriceAlert, Product, TrackedProduct, User
from app.products.schemas import AlertUpdateRequest, NotificationReadRequest
from app.products.service import add_tracking


def _engine(monkeypatch: pytest.MonkeyPatch) -> Engine:
    test_url = os.environ.get("TEST_DATABASE_URL")
    if not test_url:
        pytest.skip("TEST_DATABASE_URL não configurada para integração PostgreSQL")
    monkeypatch.setenv("DATABASE_URL", test_url)
    command.upgrade(Config("alembic.ini"), "head")
    return create_engine(test_url.replace("postgresql://", "postgresql+psycopg://", 1))


def _product(external_id: str, now: datetime) -> Product:
    return Product(
        external_id=external_id, title="Fone",
        canonical_url=f"https://produto.mercadolivre.com.br/MLB-{external_id[3:]}-fone-_JM",
        current_price=Decimal("80.00"), currency="BRL", price_context="mlb_marketplace_unit",
        availability="available", lookup_status="located", last_attempt_status="ok",
        last_attempt_at=now, last_success_at=now, last_price_observed_at=now,
    )


def test_two_users_editing_alerts_on_same_listing_do_not_deadlock(monkeypatch: pytest.MonkeyPatch) -> None:
    engine = _engine(monkeypatch)
    now = datetime.now(UTC)
    external_id = f"MLB{uuid.uuid4().int % 10**15}"
    with Session(engine) as session:
        users = [User(email=f"{uuid.uuid4()}@example.com", password_hash="teste") for _ in range(2)]
        product = _product(external_id, now)
        session.add_all([*users, product])
        session.flush()
        trackings = [TrackedProduct(user_id=user.id, product_id=product.id, active=True, active_since=now - timedelta(days=1)) for user in users]
        session.add_all(trackings)
        session.flush()
        session.add_all([PriceAlert(tracked_product_id=tracked.id, target_price=Decimal("70.00")) for tracked in trackings])
        session.commit()
        pairs = [(user.id, tracked.id) for user, tracked in zip(users, trackings, strict=True)]

    both_locked_own_alert = threading.Barrier(2, timeout=5)
    original_own_alert = routes.own_alert

    def gated_own_alert(session: Session, tracked: TrackedProduct, **kwargs) -> PriceAlert:
        row = original_own_alert(session, tracked, **kwargs)
        if kwargs.get("for_update"):
            both_locked_own_alert.wait()
        return row

    monkeypatch.setattr(routes, "own_alert", gated_own_alert)

    def edit(pair: tuple[uuid.UUID, uuid.UUID], target: str) -> str:
        user_id, tracking_id = pair
        with Session(engine) as session:
            response = routes.update_alert(
                tracking_id, AlertUpdateRequest(target_price=target), session.get(User, user_id), session,
            )
            return str(response.target_price)

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = [pool.submit(edit, pairs[0], "90.00"), pool.submit(edit, pairs[1], "95.00")]
        assert [future.result(timeout=15) for future in results] == ["90.00", "95.00"]

    with Session(engine) as session:
        for _user_id, tracking_id in pairs:
            alert = session.scalar(select(PriceAlert).where(PriceAlert.tracked_product_id == tracking_id))
            assert alert.revision == 2
            assert len(session.scalars(select(Notification).where(Notification.alert_id == alert.id)).all()) == 1
    engine.dispose()


def test_concurrent_read_marks_preserve_first_read_at(monkeypatch: pytest.MonkeyPatch) -> None:
    engine = _engine(monkeypatch)
    now = datetime.now(UTC)
    external_id = f"MLB{uuid.uuid4().int % 10**15}"
    with Session(engine) as session:
        user = User(email=f"{uuid.uuid4()}@example.com", password_hash="teste")
        product = _product(external_id, now)
        session.add_all([user, product])
        session.flush()
        tracked = TrackedProduct(user_id=user.id, product_id=product.id, active=True, active_since=now)
        session.add(tracked)
        session.flush()
        notification = Notification(
            user_id=user.id, tracked_product_id=tracked.id, alert_id=uuid.uuid4(), revision=1, episode=1,
            type="target_price_reached", product_title="Fone", observed_price=Decimal("80.00"),
            target_price=Decimal("90.00"), currency="BRL", observed_at=now,
        )
        session.add(notification)
        session.commit()
        user_id, notification_id = user.id, notification.id

    both_read = threading.Barrier(2, timeout=5)
    stamps = iter([datetime(2030, 1, 2, 12, tzinfo=UTC), datetime(2030, 1, 2, 12, 0, 1, tzinfo=UTC)])
    stamp_guard = threading.Lock()

    class Clock(datetime):
        @classmethod
        def now(cls, _zone=None) -> datetime:
            with stamp_guard:
                value = next(stamps)
            both_read.wait()
            return value

    monkeypatch.setattr(routes, "datetime", Clock)

    def mark() -> datetime:
        with Session(engine) as session:
            return routes.mark_notification_read(
                notification_id, NotificationReadRequest(read=True), session.get(User, user_id), session,
            ).read_at

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = [pool.submit(mark) for _ in range(2)]
        first, second = (future.result(timeout=10) for future in results)

    assert first == second
    with Session(engine) as session:
        assert session.get(Notification, notification_id).read_at == first
    engine.dispose()


def test_concurrent_registration_by_same_person_returns_conflict_to_loser(monkeypatch: pytest.MonkeyPatch) -> None:
    engine = _engine(monkeypatch)
    external_id = f"MLB{uuid.uuid4().int % 10**15}"
    url = f"https://produto.mercadolivre.com.br/MLB-{external_id[3:]}-teste-_JM"
    user_id = uuid.uuid4()
    with Session(engine) as session:
        session.add(User(id=user_id, email=f"{user_id}@example.com", password_hash="teste"))
        session.commit()

    class Source:
        calls = 0

        def get_listing(self, listing_id: str) -> ListingData:
            self.calls += 1
            time.sleep(0.3)
            return ListingData(
                external_id=listing_id, title="Corrida", canonical_url=url,
                image_url=None, price=Decimal("75.00"), currency="BRL", availability="available",
            )

    source = Source()
    barrier = threading.Barrier(2)

    def register() -> tuple[str, str | None]:
        barrier.wait(timeout=5)
        with Session(engine) as session:
            try:
                result, _created = add_tracking(session, user_id, url, source)
                return "created", str(result.id)
            except ApiError as exc:
                return f"{exc.status_code}:{exc.code}", exc.tracked_product_id

    with ThreadPoolExecutor(max_workers=2) as pool:
        outcomes = sorted(pool.map(lambda _: register(), range(2)))

    assert [outcome[0] for outcome in outcomes] == ["409:already_tracked", "created"]
    assert outcomes[0][1] == outcomes[1][1]
    assert source.calls == 1
    with Session(engine) as session:
        product = session.scalar(select(Product).where(Product.external_id == external_id))
        assert len(session.scalars(select(TrackedProduct).where(TrackedProduct.product_id == product.id)).all()) == 1
    engine.dispose()


def test_listing_lock_timeout_uses_contract_code_and_releases_no_transaction(monkeypatch: pytest.MonkeyPatch) -> None:
    engine = _engine(monkeypatch)
    monkeypatch.setattr(locking, "LOCK_WAIT_SECONDS", 0.2)
    external_id = f"MLB{uuid.uuid4().int % 10**15}"
    holder_inside = threading.Event()
    release_holder = threading.Event()

    def hold() -> str | None:
        with Session(engine) as session, locking.listing_lock(session, external_id):
            holder_inside.set()
            with engine.connect() as probe:
                states = probe.scalars(text(
                    "SELECT state FROM pg_stat_activity WHERE pid IN "
                    "(SELECT pid FROM pg_locks WHERE locktype = 'advisory' AND granted)"
                )).all()
            assert release_holder.wait(timeout=5)
            return ",".join(states)

    with ThreadPoolExecutor(max_workers=1) as pool:
        holder = pool.submit(hold)
        assert holder_inside.wait(timeout=5)
        with Session(engine) as session, pytest.raises(ApiError) as failure, locking.listing_lock(session, external_id):
            pass
        release_holder.set()
        lock_states = holder.result(timeout=5)

    assert failure.value.status_code == 503
    assert failure.value.code == "integration_unavailable"
    assert failure.value.retry_after_seconds is not None
    assert "idle in transaction" not in lock_states
    engine.dispose()


def test_application_engine_pins_utc_session_timezone(monkeypatch: pytest.MonkeyPatch) -> None:
    test_url = os.environ.get("TEST_DATABASE_URL")
    if not test_url:
        pytest.skip("TEST_DATABASE_URL não configurada para integração PostgreSQL")
    monkeypatch.setenv("DATABASE_URL", test_url)
    monkeypatch.setenv("PGTZ", "America/Sao_Paulo")
    db.create_database_engine.cache_clear()
    try:
        engine = db.create_database_engine()
        with engine.connect() as connection:
            assert connection.scalar(text("SHOW TimeZone")) == "UTC"
            assert connection.scalar(text("SELECT now()")).utcoffset() == timedelta(0)
        engine.dispose()
    finally:
        db.create_database_engine.cache_clear()
