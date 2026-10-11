import os
from datetime import UTC, datetime, timedelta
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import and_, or_, select, update
from sqlalchemy.orm import Session

from app.auth.routes import CurrentUser, SessionDep
from app.db import create_database_engine
from app.errors import ApiError
from app.marketplace.client import IntegrationError, ListingData, MercadoLivreClient
from app.marketplace.oauth import OperatorTokenManager
from app.products.alerts import alert_response, evaluate_alerts, parse_target_price
from app.products.models import (
    Notification,
    PriceAlert,
    PriceHistory,
    Product,
    ProductEvent,
    TrackedProduct,
)
from app.products.pagination import decode_cursor, encode_cursor
from app.products.schemas import (
    AlertCreateRequest,
    AlertUpdateRequest,
    DashboardResponse,
    DashboardSummary,
    NotificationReadRequest,
    NotificationResponse,
    PriceAlertResponse,
    PriceHistoryEntry,
    ProductEventResponse,
    TrackedProductPage,
    TrackedProductResponse,
    TrackRequest,
)
from app.products.service import (
    add_tracking,
    provider_error,
    refresh_tracking,
    tracked_response,
)

router = APIRouter(prefix="/api/tracked-products", tags=["tracked-products"])
dashboard_router = APIRouter(prefix="/api", tags=["dashboard"])


def build_marketplace_client() -> MercadoLivreClient:
    if os.environ.get("MERCADOLIVRE_THIRD_PARTY_VALIDATED") != "true":
        raise ApiError(503, "integration_not_configured", "Integração indisponível no momento.")
    key = os.environ.get("MERCADOLIVRE_OAUTH_KEY")
    client_id = os.environ.get("MERCADOLIVRE_CLIENT_ID")
    client_secret = os.environ.get("MERCADOLIVRE_CLIENT_SECRET")
    if not key or not client_id or not client_secret:
        raise ApiError(503, "integration_not_configured", "Integração indisponível no momento.")
    try:
        access_token = OperatorTokenManager(
            create_database_engine(), key.encode(), client_id, client_secret,
        ).get_access_token()
    except IntegrationError as exc:
        raise provider_error(exc) from exc
    return MercadoLivreClient(access_token)


class DeferredMarketplaceClient:
    def get_listing(self, external_id: str) -> ListingData:
        try:
            return build_marketplace_client().get_listing(external_id)
        except ApiError as exc:
            if exc.code.startswith("integration_"):
                raise IntegrationError(exc.code, exc.retry_after_seconds) from exc
            raise


def get_marketplace_client() -> DeferredMarketplaceClient:
    return DeferredMarketplaceClient()


ClientDep = Annotated[DeferredMarketplaceClient, Depends(get_marketplace_client)]


@router.post("", response_model=TrackedProductResponse)
def create_tracking(
    payload: TrackRequest,
    response: Response,
    user: CurrentUser,
    session: SessionDep,
    source: ClientDep,
) -> TrackedProductResponse:
    result, created = add_tracking(session, user.id, payload.url, source)
    response.status_code = 201 if created else 200
    return result


@router.get("")
def list_tracking(
    user: CurrentUser, session: SessionDep,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    cursor: str | None = None,
) -> dict[str, object]:
    statement = select(TrackedProduct).where(TrackedProduct.user_id == user.id, TrackedProduct.active.is_(True))
    if cursor is not None:
        moment, row_id = decode_cursor(cursor)
        statement = statement.where(or_(
            TrackedProduct.active_since < moment,
            and_(TrackedProduct.active_since == moment, TrackedProduct.id < row_id),
        ))
    rows = session.scalars(statement.order_by(TrackedProduct.active_since.desc(), TrackedProduct.id.desc()).limit(limit + 1)).all()
    tracked = rows[:limit]
    now = datetime.now(UTC)
    items = [tracked_response(session, item, session.get(Product, item.product_id), now) for item in tracked]
    next_cursor = encode_cursor(tracked[-1].active_since, tracked[-1].id) if len(rows) > limit else None
    return {"items": items, "next_cursor": next_cursor}


def own_tracking(session: Session, user_id: UUID, tracking_id: UUID, *, for_update: bool = False) -> TrackedProduct:
    statement = select(TrackedProduct).where(
        TrackedProduct.id == tracking_id, TrackedProduct.user_id == user_id,
    )
    if for_update:
        statement = statement.with_for_update().execution_options(populate_existing=True)
    tracked = session.scalar(statement)
    if tracked is None:
        raise ApiError(404, "resource_not_found", "Monitoramento não encontrado.")
    return tracked


@router.get("/{tracking_id}", response_model=TrackedProductResponse)
def get_tracking(
    tracking_id: UUID,
    user: CurrentUser, session: SessionDep,
) -> TrackedProductResponse:
    tracked = own_tracking(session, user.id, tracking_id)
    return tracked_response(session, tracked, session.get(Product, tracked.product_id), datetime.now(UTC))


@router.delete("/{tracking_id}", status_code=204)
def stop_tracking(
    tracking_id: UUID,
    user: CurrentUser, session: SessionDep,
) -> None:
    tracked = own_tracking(session, user.id, tracking_id, for_update=True)
    if tracked.active:
        tracked.active = False
        alert = session.scalar(select(PriceAlert).where(PriceAlert.tracked_product_id == tracked.id))
        if alert is not None:
            alert.enabled = False
        session.commit()


@router.post("/{tracking_id}/refresh", response_model=TrackedProductResponse)
def refresh_product(
    tracking_id: UUID, user: CurrentUser, session: SessionDep, source: ClientDep,
) -> TrackedProductResponse:
    return refresh_tracking(session, user.id, tracking_id, source)


@router.get("/{tracking_id}/history")
def get_history(
    tracking_id: UUID, user: CurrentUser, session: SessionDep,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    cursor: str | None = None,
    from_at: Annotated[datetime | None, Query(alias="from")] = None,
    to_at: Annotated[datetime | None, Query(alias="to")] = None,
) -> dict[str, object]:
    tracked = own_tracking(session, user.id, tracking_id)
    if (from_at is not None and from_at.utcoffset() != timedelta(0)) or (to_at is not None and to_at.utcoffset() != timedelta(0)):
        raise ApiError(422, "validation_error", "Informe instantes em UTC.")
    if from_at is not None and to_at is not None and from_at >= to_at:
        raise ApiError(422, "validation_error", "O início deve ser anterior ao fim.")
    statement = select(PriceHistory).where(PriceHistory.product_id == tracked.product_id)
    if from_at is not None:
        statement = statement.where(PriceHistory.captured_at >= from_at)
    if to_at is not None:
        statement = statement.where(PriceHistory.captured_at < to_at)
    if cursor is not None:
        moment, row_id = decode_cursor(cursor)
        statement = statement.where(or_(
            PriceHistory.captured_at > moment,
            and_(PriceHistory.captured_at == moment, PriceHistory.id > row_id),
        ))
    rows = session.scalars(statement.order_by(PriceHistory.captured_at, PriceHistory.id).limit(limit + 1)).all()
    history = rows[:limit]
    return {"items": [PriceHistoryEntry(
        id=row.id, price=row.price, currency=row.currency,
        price_context=row.price_context, captured_at=row.captured_at,
    ) for row in history], "next_cursor": encode_cursor(history[-1].captured_at, history[-1].id) if len(rows) > limit else None}


@router.post("/{tracking_id}/alert", response_model=PriceAlertResponse, status_code=201)
def create_alert(
    tracking_id: UUID, payload: AlertCreateRequest,
    user: CurrentUser, session: SessionDep,
) -> PriceAlertResponse:
    tracked = own_tracking(session, user.id, tracking_id, for_update=True)
    if not tracked.active:
        raise ApiError(409, "tracking_inactive", "Monitoramento interrompido.")
    if session.scalar(select(PriceAlert).where(PriceAlert.tracked_product_id == tracked.id)) is not None:
        raise ApiError(409, "alert_already_exists", "Este produto já tem um alerta.")
    alert = PriceAlert(tracked_product_id=tracked.id, target_price=parse_target_price(payload.target_price))
    session.add(alert)
    session.flush()
    product = session.get(Product, tracked.product_id)
    now = datetime.now(UTC)
    evaluate_alerts(session, product, now, alert_id=alert.id)
    session.commit()
    return alert_response(alert, tracked, product, now)


def own_alert(session: Session, tracked: TrackedProduct, *, for_update: bool = False) -> PriceAlert:
    statement = select(PriceAlert).where(PriceAlert.tracked_product_id == tracked.id)
    if for_update:
        statement = statement.with_for_update().execution_options(populate_existing=True)
    alert = session.scalar(statement)
    if alert is None:
        raise ApiError(404, "resource_not_found", "Alerta não encontrado.")
    return alert


@router.get("/{tracking_id}/alert", response_model=PriceAlertResponse)
def get_alert(tracking_id: UUID, user: CurrentUser, session: SessionDep) -> PriceAlertResponse:
    tracked = own_tracking(session, user.id, tracking_id)
    alert = own_alert(session, tracked)
    return alert_response(alert, tracked, session.get(Product, tracked.product_id), datetime.now(UTC))


@router.patch("/{tracking_id}/alert", response_model=PriceAlertResponse)
def update_alert(
    tracking_id: UUID, payload: AlertUpdateRequest,
    user: CurrentUser, session: SessionDep,
) -> PriceAlertResponse:
    tracked = own_tracking(session, user.id, tracking_id, for_update=True)
    alert = own_alert(session, tracked, for_update=True)
    if not tracked.active and payload.enabled is True:
        raise ApiError(409, "tracking_inactive", "Monitoramento interrompido.")
    if payload.target_price is None and payload.enabled is None:
        raise ApiError(422, "validation_error", "Informe pelo menos uma alteração.")
    target_changed = False
    if payload.target_price is not None:
        target = parse_target_price(payload.target_price)
        if target != alert.target_price:
            alert.target_price = target
            alert.revision += 1
            alert.episode = 1
            alert.notified_in_episode = False
            target_changed = True
    if payload.enabled is not None:
        alert.enabled = payload.enabled
    product = session.get(Product, tracked.product_id)
    now = datetime.now(UTC)
    if target_changed or payload.enabled is True:
        evaluate_alerts(session, product, now, alert_id=alert.id)
    session.commit()
    return alert_response(alert, tracked, product, now)


@router.delete("/{tracking_id}/alert", status_code=204)
def delete_alert(tracking_id: UUID, user: CurrentUser, session: SessionDep) -> None:
    tracked = own_tracking(session, user.id, tracking_id, for_update=True)
    alert = session.scalar(select(PriceAlert).where(PriceAlert.tracked_product_id == tracked.id))
    if alert is not None:
        session.delete(alert)
        session.commit()


@dashboard_router.get("/notifications")
def list_notifications(
    user: CurrentUser, session: SessionDep,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    cursor: str | None = None,
    unread_only: bool = False,
) -> dict[str, object]:
    statement = select(Notification).where(Notification.user_id == user.id)
    if unread_only:
        statement = statement.where(Notification.read_at.is_(None))
    if cursor is not None:
        moment, row_id = decode_cursor(cursor)
        statement = statement.where(or_(
            Notification.created_at < moment,
            and_(Notification.created_at == moment, Notification.id < row_id),
        ))
    rows = session.scalars(statement.order_by(Notification.created_at.desc(), Notification.id.desc()).limit(limit + 1)).all()
    page = rows[:limit]
    return {"items": [NotificationResponse(
        id=row.id, tracked_product_id=row.tracked_product_id,
        type=row.type, product_title=row.product_title,
        observed_price=row.observed_price, target_price=row.target_price,
        currency=row.currency, observed_at=row.observed_at,
        created_at=row.created_at, read_at=row.read_at,
    ) for row in page], "next_cursor": encode_cursor(page[-1].created_at, page[-1].id) if len(rows) > limit else None}


@dashboard_router.patch("/notifications/{notification_id}", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: UUID, _payload: NotificationReadRequest,
    user: CurrentUser, session: SessionDep,
) -> NotificationResponse:
    owned = (Notification.id == notification_id, Notification.user_id == user.id)
    if session.scalar(select(Notification.id).where(*owned)) is None:
        raise ApiError(404, "resource_not_found", "Notificação não encontrada.")
    # Atomic conditional update: concurrent marks keep the first read_at.
    session.execute(
        update(Notification).where(*owned, Notification.read_at.is_(None)).values(read_at=datetime.now(UTC))
    )
    session.commit()
    row = session.scalar(select(Notification).where(*owned).execution_options(populate_existing=True))
    return NotificationResponse(
        id=row.id, tracked_product_id=row.tracked_product_id,
        type=row.type, product_title=row.product_title,
        observed_price=row.observed_price, target_price=row.target_price,
        currency=row.currency, observed_at=row.observed_at,
        created_at=row.created_at, read_at=row.read_at,
    )


@dashboard_router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(user: CurrentUser, session: SessionDep) -> DashboardResponse:
    now = datetime.now(UTC)
    tracked_rows = session.scalars(select(TrackedProduct).where(
        TrackedProduct.user_id == user.id, TrackedProduct.active.is_(True),
    ).order_by(TrackedProduct.active_since.desc(), TrackedProduct.id.desc())).all()
    products = {row.product_id: session.get(Product, row.product_id) for row in tracked_rows}
    cards = [tracked_response(session, row, products[row.product_id], now) for row in tracked_rows]
    events: list[ProductEventResponse] = []
    opportunities: list[tuple[TrackedProductResponse, datetime]] = []
    for tracked, card in zip(tracked_rows, cards, strict=True):
        product = products[tracked.product_id]
        event_rows = session.scalars(select(ProductEvent).where(
            ProductEvent.product_id == product.id,
            ProductEvent.observed_at >= tracked.active_since,
        ).order_by(ProductEvent.observed_at.desc(), ProductEvent.id.desc()).limit(20)).all()
        for event in event_rows:
            events.append(ProductEventResponse(
                id=event.id, tracked_product_id=tracked.id,
                type=event.type, previous_value=event.previous_value,
                current_value=event.current_value,
                currency="BRL" if event.type == "price_changed" else None,
                observed_at=event.observed_at,
            ))
        changed_at = product.price_changed_at
        if changed_at is not None and changed_at.tzinfo is None:
            changed_at = changed_at.replace(tzinfo=UTC)
        if (
            card.product.percentage_change is not None
            and card.product.percentage_change < 0
            and not card.product.stale
            and product.lookup_status == "located"
            and product.availability == "available"
            and product.last_attempt_status == "ok"
            and changed_at is not None
            and changed_at >= (tracked.active_since if tracked.active_since.tzinfo is not None else tracked.active_since.replace(tzinfo=UTC))
            and changed_at >= now - timedelta(hours=24)
        ):
            opportunities.append((card, changed_at))
    events.sort(key=lambda event: (event.observed_at, str(event.id)), reverse=True)
    opportunities.sort(key=lambda entry: (
        entry[0].product.percentage_change,
        -entry[1].timestamp(),
        str(entry[0].product.id),
    ))
    return DashboardResponse(
        summary=DashboardSummary(
            tracked_count=len(tracked_rows),
            price_drop_count=len(opportunities),
            active_alert_count=sum(card.alert is not None and card.alert.enabled for card in cards),
            target_reached_count=sum(
                card.alert is not None and card.alert.condition == "target_reached" for card in cards
            ),
        ),
        opportunities=[card for card, _changed_at in opportunities[:5]],
        tracked_products=TrackedProductPage(
            items=cards[:20],
            next_cursor=encode_cursor(tracked_rows[19].active_since, tracked_rows[19].id) if len(cards) > 20 else None,
        ),
        recent_updates=events[:20],
    )
