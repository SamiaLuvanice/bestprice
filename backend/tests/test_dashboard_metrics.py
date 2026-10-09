from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db import Base
from app.products import routes
from app.products.models import PriceHistory, Product, TrackedProduct, User
from app.products.service import tracked_response


def test_equal_drops_are_ordered_by_latest_change(monkeypatch) -> None:
    fixed = datetime(2030, 1, 2, 12, tzinfo=UTC)

    class Clock:
        @staticmethod
        def now(_zone) -> datetime:
            return fixed

    monkeypatch.setattr(routes, "datetime", Clock)
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        user = User(email="metrics@example.com", password_hash="teste")
        session.add(user)
        session.flush()
        for number, change_age_minutes, membership_age_minutes in ((1, 30, 120), (2, 60, 90)):
            product = Product(
                external_id=f"MLB123456789{number}", title=f"Produto {number}",
                canonical_url=f"https://produto.mercadolivre.com.br/MLB-123456789{number}-teste-_JM",
                current_price=Decimal("80.00"), currency="BRL", price_context="mlb_marketplace_unit",
                availability="available", lookup_status="located", last_attempt_status="ok",
                last_attempt_at=fixed - timedelta(minutes=5), last_success_at=fixed - timedelta(minutes=5),
                last_price_observed_at=fixed - timedelta(minutes=5),
                price_changed_at=fixed - timedelta(minutes=change_age_minutes),
            )
            session.add(product)
            session.flush()
            session.add(TrackedProduct(
                user_id=user.id, product_id=product.id, active=True,
                active_since=fixed - timedelta(minutes=membership_age_minutes),
            ))
            session.add_all([
                PriceHistory(product_id=product.id, price=Decimal("100.00"), currency="BRL", captured_at=fixed - timedelta(hours=3)),
                PriceHistory(product_id=product.id, price=Decimal("80.00"), currency="BRL", captured_at=fixed - timedelta(minutes=change_age_minutes)),
            ])
        session.commit()
        dashboard = routes.get_dashboard(user, session)
        assert dashboard["summary"]["price_drop_count"] == 2
        assert [card.product.title for card in dashboard["opportunities"]] == ["Produto 1", "Produto 2"]


def test_history_summary_keeps_global_extremes_when_history_is_paginated() -> None:
    fixed = datetime(2030, 1, 2, 12, tzinfo=UTC)
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        user = User(email="history@example.com", password_hash="teste")
        product = Product(
            external_id="MLB1234567890", title="Histórico",
            canonical_url="https://produto.mercadolivre.com.br/MLB-1234567890-teste-_JM",
            current_price=Decimal("90.00"), currency="BRL", price_context="mlb_marketplace_unit",
            availability="available", lookup_status="located", last_attempt_status="ok",
            last_price_observed_at=fixed,
        )
        session.add_all([user, product])
        session.flush()
        tracked = TrackedProduct(user_id=user.id, product_id=product.id, active=True, active_since=fixed - timedelta(days=1))
        session.add(tracked)
        session.add_all([
            PriceHistory(product_id=product.id, price=Decimal(price), currency="BRL", captured_at=fixed - timedelta(hours=age))
            for price, age in (("100.00", 3), ("80.00", 2), ("90.00", 1))
        ])
        session.commit()
        page = routes.get_history(tracked.id, user, session, limit=1, cursor=None, from_at=None, to_at=None)
        assert [row.price for row in page["items"]] == [Decimal("100.00")]
        assert page["next_cursor"] is not None
        summary = tracked_response(session, tracked, product, fixed).product
        assert (summary.current_price, summary.previous_price, summary.min_price, summary.max_price) == (
            Decimal("90.00"), Decimal("80.00"), Decimal("80.00"), Decimal("100.00"),
        )
        assert summary.absolute_change == Decimal("10.00")
        assert summary.percentage_change == Decimal("12.50")
