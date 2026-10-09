from datetime import UTC, datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal
from math import ceil
from random import uniform
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.errors import ApiError
from app.marketplace.client import IntegrationError, ListingData
from app.marketplace.url import InvalidProductUrl, parse_product_url
from app.monitoring.settings import load_monitoring_settings
from app.products.alerts import alert_response, evaluate_alerts
from app.products.locking import listing_lock
from app.products.models import (
    PriceAlert,
    PriceHistory,
    Product,
    ProductEvent,
    TrackedProduct,
)
from app.products.schemas import ProductResponse, TrackedProductResponse


def provider_error(error: IntegrationError) -> ApiError:
    status = {
        "product_not_found": 404,
        "integration_rate_limited": 429,
        "integration_invalid_response": 502,
        "unsupported_price_context": 502,
    }.get(error.code, 503)
    return ApiError(status, error.code, "Não conseguimos consultar este anúncio agora.", retry_after_seconds=error.retry_after_seconds)


def add_tracking(session: Session, user_id: UUID, url: str, source: object) -> tuple[TrackedProductResponse, bool]:
    try:
        parsed = parse_product_url(url)
    except InvalidProductUrl as exc:
        raise ApiError(400, "invalid_url", "Insira um link válido de anúncio do Mercado Livre.") from exc
    with listing_lock(session, parsed.external_id):
        try:
            return _add_tracking_locked(session, user_id, parsed.external_id, source)
        except Exception:
            session.rollback()
            raise


def _add_tracking_locked(
    session: Session, user_id: UUID, external_id: str, source: object,
) -> tuple[TrackedProductResponse, bool]:
    now = datetime.now(UTC)
    product = session.scalar(select(Product).where(Product.external_id == external_id))
    if product is not None:
        tracked = session.scalar(select(TrackedProduct).where(
            TrackedProduct.user_id == user_id, TrackedProduct.product_id == product.id,
        ))
        if tracked is not None and tracked.active:
            raise ApiError(409, "already_tracked", "Você já monitora este anúncio.", tracked_product_id=str(tracked.id))
        if tracked is not None and not tracked.active:
            tracked.active = True
            tracked.active_since = now
            session.commit()
            return tracked_response(session, tracked, product, now), False
    if product is None or not _is_fresh(product, now):
        try:
            listing = source.get_listing(external_id)
        except IntegrationError as exc:
            raise provider_error(exc) from exc
        if product is None:
            product = _new_product(listing, now)
            session.add(product)
            session.flush()
            if listing.price is not None:
                session.add(PriceHistory(product_id=product.id, price=listing.price, currency="BRL", captured_at=now))
        else:
            _update_product(session, product, listing, now)
    tracked = TrackedProduct(user_id=user_id, product_id=product.id, active=True, active_since=now)
    session.add(tracked)
    session.commit()
    return tracked_response(session, tracked, product, now), True


def _is_fresh(product: Product, now: datetime) -> bool:
    observed = product.last_price_observed_at
    if observed is None:
        return False
    if observed.tzinfo is None:
        observed = observed.replace(tzinfo=UTC)
    return product.last_attempt_status == "ok" and product.lookup_status == "located" and observed + load_monitoring_settings().freshness_window > now


def _new_product(listing: ListingData, now: datetime) -> Product:
    status = "ok" if listing.price is not None else "missing_price"
    return Product(
        external_id=listing.external_id, title=listing.title,
        image_url=listing.image_url, canonical_url=listing.canonical_url,
        current_price=listing.price, currency=listing.currency,
        price_context="mlb_marketplace_unit", availability=listing.availability,
        last_confirmed_availability=listing.availability if listing.availability != "unknown" else None,
        last_confirmed_availability_at=now if listing.availability != "unknown" else None,
        lookup_status="located", last_attempt_status=status,
        last_attempt_at=now, last_success_at=now,
        last_price_observed_at=now if listing.price is not None else None,
        next_check_at=now + load_monitoring_settings().check_interval,
    )


def _update_product(session: Session, product: Product, listing: ListingData, now: datetime) -> None:
    previous_availability = product.last_confirmed_availability
    product.title = listing.title
    product.image_url = listing.image_url
    product.canonical_url = listing.canonical_url
    product.lookup_status = "located"
    product.last_attempt_status = "ok" if listing.price is not None else "missing_price"
    product.last_attempt_at = now
    product.last_success_at = now
    product.availability = listing.availability
    product.next_check_at = now + load_monitoring_settings().check_interval
    if listing.availability != "unknown":
        product.last_confirmed_availability = listing.availability
        product.last_confirmed_availability_at = now
        if previous_availability is not None and previous_availability != listing.availability:
            session.add(ProductEvent(
                product_id=product.id, type="availability_changed",
                previous_value=previous_availability, current_value=listing.availability,
                observed_at=now,
            ))
    if listing.price is not None:
        if product.current_price != listing.price:
            if product.current_price is not None:
                product.price_changed_at = now
                session.add(ProductEvent(
                    product_id=product.id, type="price_changed",
                    previous_value=str(product.current_price), current_value=str(listing.price),
                    observed_at=now,
                ))
            product.current_price = listing.price
            session.add(PriceHistory(product_id=product.id, price=listing.price, currency="BRL", captured_at=now))
        product.last_price_observed_at = now
    evaluate_alerts(session, product, now)


def refresh_tracking(
    session: Session, user_id: UUID, tracking_id: UUID, source: object, *, now: datetime | None = None,
) -> TrackedProductResponse:
    tracked = session.scalar(select(TrackedProduct).where(
        TrackedProduct.id == tracking_id, TrackedProduct.user_id == user_id,
    ))
    if tracked is None:
        raise ApiError(404, "resource_not_found", "Monitoramento não encontrado.")
    if not tracked.active:
        raise ApiError(409, "tracking_inactive", "Monitoramento interrompido.")
    product = session.get(Product, tracked.product_id)
    with listing_lock(session, product.external_id):
        now = now or datetime.now(UTC)
        session.refresh(product)
        if product.next_check_at is not None and (
            product.lookup_status == "not_found" or product.last_attempt_status not in {"ok", "missing_price"}
        ):
            due = product.next_check_at
            if due.tzinfo is None:
                due = due.replace(tzinfo=UTC)
            if due > now:
                raise ApiError(429, "refresh_not_due", "Aguarde para atualizar novamente.", retry_after_seconds=ceil((due - now).total_seconds()))
        if product.last_attempt_at is not None:
            attempted = product.last_attempt_at
            if attempted.tzinfo is None:
                attempted = attempted.replace(tzinfo=UTC)
            cooldown = attempted + timedelta(seconds=60)
            if cooldown > now:
                raise ApiError(429, "refresh_not_due", "Aguarde para atualizar novamente.", retry_after_seconds=ceil((cooldown - now).total_seconds()))
        if product.retry_after_at is not None:
            retry_at = product.retry_after_at
            if retry_at.tzinfo is None:
                retry_at = retry_at.replace(tzinfo=UTC)
            if retry_at > now:
                raise ApiError(429, "integration_rate_limited", "Aguarde o limite da integração.", retry_after_seconds=ceil((retry_at - now).total_seconds()))
        try:
            listing = source.get_listing(product.external_id)
        except IntegrationError as exc:
            product.last_attempt_at = now
            if exc.code == "product_not_found":
                product.lookup_status = "not_found"
                product.last_attempt_status = "not_found"
                product.next_check_at = now + timedelta(hours=24)
                product.failure_count = 0
                product.retry_after_at = None
                session.commit()
                return tracked_response(session, tracked, product, now)
            product.last_attempt_status = (
                "temporary_error" if exc.code in {"integration_unavailable", "integration_not_configured"}
                else exc.code.removeprefix("integration_")
            )
            product.failure_count += 1
            delay = min(3600 * 2 ** (product.failure_count - 1) * uniform(0.8, 1.2), 86400)
            if product.lookup_status == "not_found":
                delay = max(delay, 86400)
            if exc.retry_after_seconds is not None:
                delay = max(delay, exc.retry_after_seconds)
                product.retry_after_at = now + timedelta(seconds=exc.retry_after_seconds)
            product.next_check_at = now + timedelta(seconds=delay)
            session.commit()
            raise provider_error(exc) from exc
        _update_product(session, product, listing, now)
        product.failure_count = 0
        product.retry_after_at = None
        session.commit()
        return tracked_response(session, tracked, product, now)


def tracked_response(session: Session, tracked: TrackedProduct, product: Product, now: datetime) -> TrackedProductResponse:
    history = session.scalars(select(PriceHistory).where(PriceHistory.product_id == product.id).order_by(PriceHistory.captured_at, PriceHistory.id)).all()
    prices = [row.price for row in history]
    previous = prices[-2] if len(prices) >= 2 else None
    current = product.current_price
    difference = current - previous if current is not None and previous is not None else None
    percentage = (difference / previous * 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) if difference is not None and previous and previous > 0 else None
    observed = product.last_price_observed_at
    if observed is not None and observed.tzinfo is None:
        observed = observed.replace(tzinfo=UTC)
    alert = session.scalar(select(PriceAlert).where(PriceAlert.tracked_product_id == tracked.id))
    return TrackedProductResponse(
        id=tracked.id, active=tracked.active, active_since=tracked.active_since,
        alert=alert_response(alert, tracked, product, now) if alert is not None else None,
        product=ProductResponse(
            id=product.id, external_id=product.external_id, title=product.title,
            image_url=product.image_url, canonical_url=product.canonical_url,
            currency=product.currency, price_context=product.price_context,
            current_price=current, previous_price=previous,
            min_price=min(prices) if prices else None,
            max_price=max(prices) if prices else None,
            absolute_change=difference, percentage_change=percentage,
            lookup_status=product.lookup_status, availability=product.availability,
            last_confirmed_availability=product.last_confirmed_availability,
            last_confirmed_availability_at=product.last_confirmed_availability_at,
            last_attempt_status=product.last_attempt_status,
            last_attempt_at=product.last_attempt_at, last_success_at=product.last_success_at,
            last_price_observed_at=product.last_price_observed_at,
            price_changed_at=product.price_changed_at,
            stale=observed is None or observed + load_monitoring_settings().freshness_window <= now,
        ),
    )
