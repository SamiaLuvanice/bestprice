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
from app.products.locking import ListingBusy, listing_lock
from app.products.models import (
    PriceAlert,
    PriceHistory,
    Product,
    ProductEvent,
    TrackedProduct,
)
from app.products.schemas import ProductResponse, TrackedProductResponse

SOURCE_ERRORS: dict[str, tuple[int, str]] = {
    "product_not_found": (404, "Anúncio não localizado no Mercado Livre."),
    "integration_rate_limited": (
        429, "O Mercado Livre atingiu o limite de consultas no momento. Tente novamente após o tempo indicado.",
    ),
    "integration_unavailable": (503, "O Mercado Livre não respondeu agora. Tente novamente em alguns minutos."),
    "integration_auth_required": (
        503, "A autorização do BestPrice com o Mercado Livre precisa ser renovada pela operação. Tente novamente mais tarde.",
    ),
    "integration_access_denied": (503, "O Mercado Livre não permitiu ao BestPrice consultar este anúncio."),
    "integration_invalid_response": (
        502, "O Mercado Livre devolveu dados incompletos ou inválidos para este anúncio. Tente novamente mais tarde.",
    ),
    "unsupported_price_context": (
        502, "Não foi possível obter um preço único e comparável (uma unidade, em reais, no marketplace) para este anúncio.",
    ),
    "integration_not_configured": (
        503, (
            "O cadastro de novos anúncios está indisponível até a integração oficial com o Mercado Livre "
            "ser autorizada. As atualizações também ficam suspensas até lá."
        ),
    ),
}
ATTEMPT_STATUSES = frozenset({
    "rate_limited", "auth_required", "access_denied", "invalid_response", "unsupported_price_context",
})
MANUAL_COOLDOWN = timedelta(seconds=60)


def provider_error(error: IntegrationError) -> ApiError:
    """Translate a source failure into the contract code and a specific, safe message."""
    code = error.code if error.code in SOURCE_ERRORS else "integration_unavailable"
    status, message = SOURCE_ERRORS[code]
    return ApiError(status, code, message, retry_after_seconds=error.retry_after_seconds)


def _utc(value: datetime | None) -> datetime | None:
    if value is not None and value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value


def _seconds_until(moment: datetime, now: datetime) -> int:
    return max(1, ceil((moment - now).total_seconds()))


def ensure_source_due(product: Product, now: datetime) -> None:
    """Refuse a source query blocked by Retry-After, failure backoff or the manual cooldown."""
    retry_at = _utc(product.retry_after_at)
    if retry_at is not None and retry_at > now:
        raise ApiError(
            429, "integration_rate_limited",
            "O Mercado Livre pediu um intervalo entre consultas. Tente novamente após o tempo indicado.",
            retry_after_seconds=_seconds_until(retry_at, now),
        )
    due = _utc(product.next_check_at)
    if due is not None and due > now and (
        product.lookup_status == "not_found" or product.last_attempt_status not in {"ok", "missing_price"}
    ):
        raise ApiError(429, "refresh_not_due", "Aguarde para atualizar novamente.", retry_after_seconds=_seconds_until(due, now))
    attempted = _utc(product.last_attempt_at)
    if attempted is not None and attempted + MANUAL_COOLDOWN > now:
        raise ApiError(
            429, "refresh_not_due", "Aguarde para atualizar novamente.",
            retry_after_seconds=_seconds_until(attempted + MANUAL_COOLDOWN, now),
        )


def record_failed_attempt(product: Product, status: str, now: datetime, retry_after_seconds: int | None = None) -> None:
    """Persist a failed attempt with exponential backoff and jitter, preserving last known data."""
    product.last_attempt_at = now
    product.last_attempt_status = status if status in ATTEMPT_STATUSES else "temporary_error"
    product.failure_count += 1
    delay = min(3600 * 2 ** (product.failure_count - 1) * uniform(0.8, 1.2), 86400)
    if product.lookup_status == "not_found":
        delay = max(delay, 86400)
    if retry_after_seconds is not None:
        delay = max(delay, retry_after_seconds)
        product.retry_after_at = now + timedelta(seconds=retry_after_seconds)
    product.next_check_at = now + timedelta(seconds=delay)


def add_tracking(session: Session, user_id: UUID, url: str, source: object) -> tuple[TrackedProductResponse, bool]:
    try:
        parsed = parse_product_url(url)
    except InvalidProductUrl as exc:
        raise ApiError(400, exc.code, exc.message) from exc
    try:
        with listing_lock(session, parsed.external_id):
            try:
                return _add_tracking_locked(session, user_id, parsed.external_id, source)
            except Exception:
                session.rollback()
                raise
    except ListingBusy:
        # Lost the race on this listing: a person who already tracks it gets the contract 409.
        session.rollback()
        existing = session.scalar(
            select(TrackedProduct).join(Product, TrackedProduct.product_id == Product.id).where(
                Product.external_id == parsed.external_id,
                TrackedProduct.user_id == user_id, TrackedProduct.active.is_(True),
            )
        )
        if existing is not None:
            raise ApiError(
                409, "already_tracked", "Você já monitora este anúncio.", tracked_product_id=str(existing.id),
            ) from None
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
        if product is not None:
            due = _utc(product.next_check_at)
            if product.lookup_status == "not_found" and due is not None and due > now:
                # Confirmed missing within the 24-hour window: known domain state, no new query.
                status, message = SOURCE_ERRORS["product_not_found"]
                raise ApiError(status, "product_not_found", message)
            ensure_source_due(product, now)
        # End the read transaction before the external call; the advisory lock still
        # serializes writers of this listing.
        session.commit()
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
            product.failure_count = 0
            product.retry_after_at = None
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
    session: Session, user_id: UUID, tracking_id: UUID, source: object, *,
    now: datetime | None = None, lock_wait_seconds: float | None = None,
) -> TrackedProductResponse:
    tracked = session.scalar(select(TrackedProduct).where(
        TrackedProduct.id == tracking_id, TrackedProduct.user_id == user_id,
    ))
    if tracked is None:
        raise ApiError(404, "resource_not_found", "Monitoramento não encontrado.")
    if not tracked.active:
        raise ApiError(409, "tracking_inactive", "Monitoramento interrompido.")
    product = session.get(Product, tracked.product_id)
    with listing_lock(session, product.external_id, wait_seconds=lock_wait_seconds):
        now = now or datetime.now(UTC)
        session.refresh(product)
        ensure_source_due(product, now)
        # No transaction stays open while the external API is called.
        session.commit()
        try:
            listing = source.get_listing(product.external_id)
        except IntegrationError as exc:
            if exc.code == "integration_not_configured":
                # The source was never called: there is no attempt to record or back off.
                session.rollback()
                raise provider_error(exc) from exc
            if exc.code == "product_not_found":
                product.last_attempt_at = now
                product.lookup_status = "not_found"
                product.last_attempt_status = "not_found"
                product.next_check_at = now + timedelta(hours=24)
                product.failure_count = 0
                product.retry_after_at = None
                session.commit()
                return tracked_response(session, tracked, product, now)
            record_failed_attempt(product, exc.code.removeprefix("integration_"), now, exc.retry_after_seconds)
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
