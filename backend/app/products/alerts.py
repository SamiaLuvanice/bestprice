import re
from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.errors import ApiError
from app.monitoring.settings import load_monitoring_settings
from app.products.models import Notification, PriceAlert, Product, TrackedProduct
from app.products.schemas import PriceAlertResponse

TARGET_PRICE = re.compile(r"(?:0|[1-9][0-9]*)\.[0-9]{2}\Z")


def parse_target_price(raw: str) -> Decimal:
    if not TARGET_PRICE.fullmatch(raw):
        raise ApiError(422, "validation_error", "Informe um preço positivo com duas casas decimais.")
    value = Decimal(raw)
    if value <= 0 or value >= Decimal("10000000000000000.00"):
        raise ApiError(422, "validation_error", "Informe um preço positivo com duas casas decimais.")
    return value


def alert_response(alert: PriceAlert, tracked: TrackedProduct, product: Product, now: datetime) -> PriceAlertResponse:
    condition = "unknown"
    observed = product.last_price_observed_at
    if observed is not None and observed.tzinfo is None:
        observed = observed.replace(tzinfo=UTC)
    if (
        tracked.active and alert.enabled and product.lookup_status == "located"
        and product.availability == "available" and product.last_attempt_status == "ok"
        and product.current_price is not None and observed is not None
        and observed + load_monitoring_settings().freshness_window > now
    ):
        condition = "target_reached" if product.current_price <= alert.target_price else "above_target"
    return PriceAlertResponse(
        id=alert.id, tracked_product_id=tracked.id,
        target_price=alert.target_price, currency=alert.currency,
        enabled=alert.enabled, revision=alert.revision, condition=condition,
        last_notified_at=alert.last_notified_at,
    )


def evaluate_alerts(session: Session, product: Product, now: datetime, *, alert_id: UUID | None = None) -> None:
    """Evaluate enabled alerts of active trackings for the product's current observation.

    Routes pass ``alert_id`` so a request only touches the alert it already locked; the
    shared refresh path locks every alert of the product in primary-key order, so two
    transactions never wait on each other's alert rows in opposite order (deadlock).
    """
    observed = product.last_price_observed_at
    if observed is not None and observed.tzinfo is None:
        observed = observed.replace(tzinfo=UTC)
    if (
        product.lookup_status != "located" or product.availability != "available"
        or product.last_attempt_status != "ok" or product.current_price is None
        or observed is None or observed + load_monitoring_settings().freshness_window <= now
    ):
        return
    statement = (
        select(PriceAlert, TrackedProduct)
        .join(TrackedProduct, PriceAlert.tracked_product_id == TrackedProduct.id)
        .where(TrackedProduct.product_id == product.id, TrackedProduct.active.is_(True), PriceAlert.enabled.is_(True))
    )
    if alert_id is not None:
        statement = statement.where(PriceAlert.id == alert_id)
    rows = session.execute(
        statement.order_by(PriceAlert.id)
        .with_for_update(of=PriceAlert)
        .execution_options(populate_existing=True)
    ).all()
    for alert, tracked in rows:
        if product.current_price > alert.target_price:
            if alert.notified_in_episode:
                alert.episode += 1
                alert.notified_in_episode = False
            continue
        if alert.notified_in_episode:
            continue
        session.add(Notification(
            user_id=tracked.user_id, tracked_product_id=tracked.id,
            alert_id=alert.id, revision=alert.revision, episode=alert.episode,
            type="target_price_reached", product_title=product.title,
            observed_price=product.current_price, target_price=alert.target_price,
            currency="BRL", observed_at=observed,
        ))
        alert.notified_in_episode = True
        alert.last_notified_at = now
