from datetime import UTC, datetime
from decimal import Decimal
from typing import Annotated, Literal
from uuid import UUID

from pydantic import AfterValidator, BaseModel, ConfigDict


def _as_utc(value: datetime) -> datetime:
    # Instants stored as timestamptz are UTC; a naive value only appears from test
    # dialects. Normalizing here guarantees ISO 8601 with "Z" in every response.
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


UtcDateTime = Annotated[datetime, AfterValidator(_as_utc)]


class TrackRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str


class ProductResponse(BaseModel):
    id: UUID
    external_id: str
    title: str
    image_url: str | None
    canonical_url: str
    currency: str
    price_context: str
    current_price: Decimal | None
    previous_price: Decimal | None
    min_price: Decimal | None
    max_price: Decimal | None
    absolute_change: Decimal | None
    percentage_change: Decimal | None
    lookup_status: str
    availability: str
    last_confirmed_availability: str | None
    last_confirmed_availability_at: UtcDateTime | None
    last_attempt_status: str
    last_attempt_at: UtcDateTime | None
    last_success_at: UtcDateTime | None
    last_price_observed_at: UtcDateTime | None
    price_changed_at: UtcDateTime | None
    stale: bool


class PriceAlertResponse(BaseModel):
    id: UUID
    tracked_product_id: UUID
    target_price: Decimal
    currency: str
    enabled: bool
    revision: int
    condition: str
    last_notified_at: UtcDateTime | None


class TrackedProductResponse(BaseModel):
    id: UUID
    active: bool
    active_since: UtcDateTime
    product: ProductResponse
    alert: PriceAlertResponse | None = None


class PriceHistoryEntry(BaseModel):
    id: UUID
    price: Decimal
    currency: str
    price_context: str
    captured_at: UtcDateTime


class AlertCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    target_price: str


class AlertUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    target_price: str | None = None
    enabled: bool | None = None


class NotificationResponse(BaseModel):
    id: UUID
    tracked_product_id: UUID
    type: str
    product_title: str
    observed_price: Decimal
    target_price: Decimal
    currency: str
    observed_at: UtcDateTime
    created_at: UtcDateTime
    read_at: UtcDateTime | None


class NotificationReadRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    read: Literal[True]


class ProductEventResponse(BaseModel):
    id: UUID
    tracked_product_id: UUID
    type: Literal["price_changed", "availability_changed"]
    previous_value: str
    current_value: str
    currency: str | None
    observed_at: UtcDateTime


class DashboardSummary(BaseModel):
    tracked_count: int
    price_drop_count: int
    active_alert_count: int
    target_reached_count: int


class TrackedProductPage(BaseModel):
    items: list[TrackedProductResponse]
    next_cursor: str | None


class DashboardResponse(BaseModel):
    summary: DashboardSummary
    opportunities: list[TrackedProductResponse]
    tracked_products: TrackedProductPage
    recent_updates: list[ProductEventResponse]
