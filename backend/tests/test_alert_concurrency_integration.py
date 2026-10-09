import os
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from alembic.config import Config
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from alembic import command
from app.errors import ApiError
from app.products import routes
from app.products.alerts import evaluate_alerts
from app.products.models import Notification, PriceAlert, Product, TrackedProduct, User
from app.products.schemas import AlertCreateRequest, AlertUpdateRequest


def test_concurrent_alert_evaluations_create_one_notification(monkeypatch: pytest.MonkeyPatch) -> None:
    test_url = os.environ.get("TEST_DATABASE_URL")
    if not test_url:
        pytest.skip("TEST_DATABASE_URL não configurada para integração PostgreSQL")
    monkeypatch.setenv("DATABASE_URL", test_url)
    command.upgrade(Config("alembic.ini"), "head")
    engine = create_engine(test_url.replace("postgresql://", "postgresql+psycopg://", 1))
    now = datetime(2030, 1, 2, 12, tzinfo=UTC)
    external_id = f"MLB{uuid.uuid4().int % 10**15}"
    with Session(engine) as session:
        user = User(email=f"{uuid.uuid4()}@example.com", password_hash="teste")
        product = Product(
            external_id=external_id, title="Fone",
            canonical_url=f"https://produto.mercadolivre.com.br/MLB-{external_id[3:]}-fone-_JM",
            current_price=Decimal("80.00"), currency="BRL", price_context="mlb_marketplace_unit",
            availability="available", lookup_status="located", last_attempt_status="ok",
            last_attempt_at=now, last_success_at=now, last_price_observed_at=now,
        )
        session.add_all([user, product])
        session.flush()
        tracked = TrackedProduct(user_id=user.id, product_id=product.id, active=True, active_since=now - timedelta(days=1))
        session.add(tracked)
        session.flush()
        alert = PriceAlert(tracked_product_id=tracked.id, target_price=Decimal("90.00"))
        session.add(alert)
        session.commit()
        product_id, alert_id = product.id, alert.id

    first_evaluated = threading.Event()
    second_started = threading.Event()
    second_evaluated = threading.Event()
    allow_first_commit = threading.Event()

    def first() -> None:
        with Session(engine) as session:
            evaluate_alerts(session, session.get(Product, product_id), now)
            first_evaluated.set()
            assert allow_first_commit.wait(timeout=5)
            session.commit()

    def second() -> None:
        assert first_evaluated.wait(timeout=5)
        with Session(engine) as session:
            second_started.set()
            evaluate_alerts(session, session.get(Product, product_id), now)
            second_evaluated.set()
            session.commit()

    with ThreadPoolExecutor(max_workers=2) as pool:
        first_result = pool.submit(first)
        second_result = pool.submit(second)
        assert second_started.wait(timeout=5)
        second_evaluated.wait(timeout=0.5)
        allow_first_commit.set()
        first_result.result(timeout=5)
        second_result.result(timeout=5)

    with Session(engine) as session:
        notifications = session.scalars(select(Notification).where(Notification.alert_id == alert_id)).all()
        assert len(notifications) == 1
        assert session.get(PriceAlert, alert_id).notified_in_episode is True
    engine.dispose()


def test_concurrent_target_edits_keep_both_revisions(monkeypatch: pytest.MonkeyPatch) -> None:
    test_url = os.environ.get("TEST_DATABASE_URL")
    if not test_url:
        pytest.skip("TEST_DATABASE_URL não configurada para integração PostgreSQL")
    monkeypatch.setenv("DATABASE_URL", test_url)
    command.upgrade(Config("alembic.ini"), "head")
    engine = create_engine(test_url.replace("postgresql://", "postgresql+psycopg://", 1))
    now = datetime.now(UTC)
    external_id = f"MLB{uuid.uuid4().int % 10**15}"
    with Session(engine) as session:
        user = User(email=f"{uuid.uuid4()}@example.com", password_hash="teste")
        product = Product(
            external_id=external_id, title="Fone",
            canonical_url=f"https://produto.mercadolivre.com.br/MLB-{external_id[3:]}-fone-_JM",
            current_price=Decimal("80.00"), currency="BRL", price_context="mlb_marketplace_unit",
            availability="available", lookup_status="located", last_attempt_status="ok",
            last_attempt_at=now, last_success_at=now, last_price_observed_at=now,
        )
        session.add_all([user, product])
        session.flush()
        tracked = TrackedProduct(user_id=user.id, product_id=product.id, active=True, active_since=now - timedelta(days=1))
        session.add(tracked)
        session.flush()
        alert = PriceAlert(tracked_product_id=tracked.id, target_price=Decimal("70.00"))
        session.add(alert)
        session.commit()
        user_id, tracking_id, alert_id = user.id, tracked.id, alert.id

    first_read = threading.Event()
    second_done = threading.Event()
    allow_first = threading.Event()
    role = threading.local()
    original_own_alert = routes.own_alert

    def gated_own_alert(session: Session, tracked: TrackedProduct, **kwargs) -> PriceAlert:
        row = original_own_alert(session, tracked, **kwargs)
        if getattr(role, "value", None) == "first":
            first_read.set()
            assert allow_first.wait(timeout=5)
        return row

    monkeypatch.setattr(routes, "own_alert", gated_own_alert)

    def edit(target: str, task_role: str) -> None:
        role.value = task_role
        if task_role == "second":
            assert first_read.wait(timeout=5)
        with Session(engine) as session:
            routes.update_alert(
                tracking_id, AlertUpdateRequest(target_price=target), session.get(User, user_id), session,
            )
        if task_role == "second":
            second_done.set()

    with ThreadPoolExecutor(max_workers=2) as pool:
        first_result = pool.submit(edit, "90.00", "first")
        second_result = pool.submit(edit, "95.00", "second")
        assert first_read.wait(timeout=5)
        second_done.wait(timeout=0.5)
        allow_first.set()
        first_result.result(timeout=5)
        second_result.result(timeout=5)

    with Session(engine) as session:
        final_alert = session.get(PriceAlert, alert_id)
        assert final_alert.target_price == Decimal("95.00")
        assert final_alert.revision == 3
        notifications = session.scalars(select(Notification).where(Notification.alert_id == alert_id).order_by(Notification.revision)).all()
        assert [(row.revision, row.target_price) for row in notifications] == [
            (2, Decimal("90.00")), (3, Decimal("95.00")),
        ]
    engine.dispose()


def test_stopping_tracking_cannot_leave_alert_enabled_after_concurrent_edit(monkeypatch: pytest.MonkeyPatch) -> None:
    test_url = os.environ.get("TEST_DATABASE_URL")
    if not test_url:
        pytest.skip("TEST_DATABASE_URL não configurada para integração PostgreSQL")
    monkeypatch.setenv("DATABASE_URL", test_url)
    command.upgrade(Config("alembic.ini"), "head")
    engine = create_engine(test_url.replace("postgresql://", "postgresql+psycopg://", 1))
    fixed = datetime(2030, 1, 2, 12, tzinfo=UTC)

    class Clock(datetime):
        @classmethod
        def now(cls, _zone=None) -> datetime:
            return fixed

    monkeypatch.setattr(routes, "datetime", Clock)
    external_id = f"MLB{uuid.uuid4().int % 10**15}"
    with Session(engine) as session:
        user = User(email=f"{uuid.uuid4()}@example.com", password_hash="teste")
        product = Product(
            external_id=external_id, title="Fone",
            canonical_url=f"https://produto.mercadolivre.com.br/MLB-{external_id[3:]}-fone-_JM",
            current_price=Decimal("80.00"), currency="BRL", price_context="mlb_marketplace_unit",
            availability="available", lookup_status="located", last_attempt_status="ok",
            last_attempt_at=fixed, last_success_at=fixed, last_price_observed_at=fixed,
        )
        session.add_all([user, product])
        session.flush()
        tracked = TrackedProduct(user_id=user.id, product_id=product.id, active=True, active_since=fixed - timedelta(days=1))
        session.add(tracked)
        session.flush()
        alert = PriceAlert(tracked_product_id=tracked.id, target_price=Decimal("70.00"), enabled=False)
        session.add(alert)
        session.commit()
        user_id, tracking_id, alert_id = user.id, tracked.id, alert.id

    edit_read = threading.Event()
    stop_done = threading.Event()
    allow_edit = threading.Event()
    role = threading.local()
    original_own_tracking = routes.own_tracking

    def gated_own_tracking(session: Session, requested_user_id: uuid.UUID, requested_tracking_id: uuid.UUID, **kwargs) -> TrackedProduct:
        row = original_own_tracking(session, requested_user_id, requested_tracking_id, **kwargs)
        if getattr(role, "value", None) == "edit":
            edit_read.set()
            assert allow_edit.wait(timeout=5)
        return row

    monkeypatch.setattr(routes, "own_tracking", gated_own_tracking)

    def edit() -> None:
        role.value = "edit"
        with Session(engine) as session:
            routes.update_alert(tracking_id, AlertUpdateRequest(enabled=True), session.get(User, user_id), session)

    def stop() -> None:
        assert edit_read.wait(timeout=5)
        role.value = "stop"
        with Session(engine) as session:
            routes.stop_tracking(tracking_id, session.get(User, user_id), session)
        stop_done.set()

    with ThreadPoolExecutor(max_workers=2) as pool:
        edit_result = pool.submit(edit)
        stop_result = pool.submit(stop)
        assert edit_read.wait(timeout=5)
        stop_done.wait(timeout=0.5)
        allow_edit.set()
        edit_result.result(timeout=5)
        stop_result.result(timeout=5)

    with Session(engine) as session:
        assert session.get(TrackedProduct, tracking_id).active is False
        assert session.get(PriceAlert, alert_id).enabled is False

    with Session(engine) as session:
        session.get(TrackedProduct, tracking_id).active = True
        session.commit()

    stop_locked = threading.Event()
    edit_requested = threading.Event()
    edit_finished = threading.Event()
    allow_stop = threading.Event()

    def gate_reverse_order(session: Session, requested_user_id: uuid.UUID, requested_tracking_id: uuid.UUID, **kwargs) -> TrackedProduct:
        if getattr(role, "value", None) == "edit":
            edit_requested.set()
        row = original_own_tracking(session, requested_user_id, requested_tracking_id, **kwargs)
        if getattr(role, "value", None) == "stop":
            stop_locked.set()
            assert allow_stop.wait(timeout=5)
        return row

    monkeypatch.setattr(routes, "own_tracking", gate_reverse_order)

    def stop_first() -> None:
        role.value = "stop"
        with Session(engine) as session:
            routes.stop_tracking(tracking_id, session.get(User, user_id), session)

    def edit_second() -> str | None:
        assert stop_locked.wait(timeout=5)
        role.value = "edit"
        try:
            with Session(engine) as session:
                routes.update_alert(tracking_id, AlertUpdateRequest(enabled=True), session.get(User, user_id), session)
        except ApiError as exc:
            return exc.code
        finally:
            edit_finished.set()
        return None

    with ThreadPoolExecutor(max_workers=2) as pool:
        stop_result = pool.submit(stop_first)
        edit_result = pool.submit(edit_second)
        assert stop_locked.wait(timeout=5)
        assert edit_requested.wait(timeout=5)
        assert edit_finished.wait(timeout=0.2) is False
        allow_stop.set()
        stop_result.result(timeout=5)
        assert edit_result.result(timeout=5) == "tracking_inactive"

    with Session(engine) as session:
        assert session.get(TrackedProduct, tracking_id).active is False
        assert session.get(PriceAlert, alert_id).enabled is False
    engine.dispose()


def test_concurrent_alert_creation_returns_conflict_without_duplicate(monkeypatch: pytest.MonkeyPatch) -> None:
    test_url = os.environ.get("TEST_DATABASE_URL")
    if not test_url:
        pytest.skip("TEST_DATABASE_URL não configurada para integração PostgreSQL")
    monkeypatch.setenv("DATABASE_URL", test_url)
    command.upgrade(Config("alembic.ini"), "head")
    engine = create_engine(test_url.replace("postgresql://", "postgresql+psycopg://", 1))
    fixed = datetime(2030, 1, 2, 12, tzinfo=UTC)

    class Clock(datetime):
        @classmethod
        def now(cls, _zone=None) -> datetime:
            return fixed

    monkeypatch.setattr(routes, "datetime", Clock)
    external_id = f"MLB{uuid.uuid4().int % 10**15}"
    with Session(engine) as session:
        user = User(email=f"{uuid.uuid4()}@example.com", password_hash="teste")
        product = Product(
            external_id=external_id, title="Fone",
            canonical_url=f"https://produto.mercadolivre.com.br/MLB-{external_id[3:]}-fone-_JM",
            current_price=Decimal("80.00"), currency="BRL", price_context="mlb_marketplace_unit",
            availability="available", lookup_status="located", last_attempt_status="ok",
            last_attempt_at=fixed, last_success_at=fixed, last_price_observed_at=fixed,
        )
        session.add_all([user, product])
        session.flush()
        tracked = TrackedProduct(user_id=user.id, product_id=product.id, active=True, active_since=fixed - timedelta(days=1))
        session.add(tracked)
        session.commit()
        user_id, tracking_id = user.id, tracked.id

    first_locked = threading.Event()
    second_requested = threading.Event()
    second_finished = threading.Event()
    allow_first = threading.Event()
    role = threading.local()
    original_own_tracking = routes.own_tracking

    def gate_creation(session: Session, requested_user_id: uuid.UUID, requested_tracking_id: uuid.UUID, **kwargs) -> TrackedProduct:
        if getattr(role, "value", None) == "second":
            second_requested.set()
        row = original_own_tracking(session, requested_user_id, requested_tracking_id, **kwargs)
        if getattr(role, "value", None) == "first":
            first_locked.set()
            assert allow_first.wait(timeout=5)
        return row

    monkeypatch.setattr(routes, "own_tracking", gate_creation)

    def create(task_role: str) -> str:
        role.value = task_role
        if task_role == "second":
            assert first_locked.wait(timeout=5)
        try:
            with Session(engine) as session:
                routes.create_alert(
                    tracking_id, AlertCreateRequest(target_price="90.00"), session.get(User, user_id), session,
                )
        except ApiError as exc:
            return exc.code
        finally:
            if task_role == "second":
                second_finished.set()
        return "created"

    with ThreadPoolExecutor(max_workers=2) as pool:
        first_result = pool.submit(create, "first")
        second_result = pool.submit(create, "second")
        assert first_locked.wait(timeout=5)
        assert second_requested.wait(timeout=5)
        assert second_finished.wait(timeout=0.2) is False
        allow_first.set()
        assert first_result.result(timeout=5) == "created"
        assert second_result.result(timeout=5) == "alert_already_exists"

    with Session(engine) as session:
        alerts = session.scalars(select(PriceAlert).where(PriceAlert.tracked_product_id == tracking_id)).all()
        assert len(alerts) == 1
        assert len(session.scalars(select(Notification).where(Notification.alert_id == alerts[0].id)).all()) == 1
    engine.dispose()
