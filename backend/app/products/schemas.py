from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


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
    last_confirmed_availability_at: datetime | None
    last_attempt_status: str
    last_attempt_at: datetime | None
    last_success_at: datetime | None
    last_price_observed_at: datetime | None
    price_changed_at: datetime | None
    stale: bool


class PriceAlertResponse(BaseModel):
    id: UUID
    tracked_product_id: UUID
    target_price: Decimal
    currency: str
    enabled: bool
    revision: int
    condition: str
    last_notified_at: datetime | None


class TrackedProductResponse(BaseModel):
    id: UUID
    active: bool
    active_since: datetime
    product: ProductResponse
    alert: PriceAlertResponse | None = None


class PriceHistoryEntry(BaseModel):
    id: UUID
    price: Decimal
    currency: str
    price_context: str
    captured_at: datetime


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
    observed_at: datetime
    created_at: datetime
    read_at: datetime | None


class NotificationReadRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    read: Literal[True]
