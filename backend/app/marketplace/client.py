import json
import re
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal
from urllib.parse import urlsplit

import httpx

ITEM_ID = re.compile(r"MLB[0-9]+\Z")
API_BASE_URL = "https://api.mercadolibre.com"
CENT = Decimal("0.01")


class IntegrationError(Exception):
    def __init__(self, code: str, retry_after_seconds: int | None = None) -> None:
        super().__init__(code)
        self.code = code
        self.retry_after_seconds = retry_after_seconds


@dataclass(frozen=True)
class ListingData:
    external_id: str
    title: str
    canonical_url: str
    image_url: str | None
    price: Decimal | None
    currency: str
    availability: str


class MercadoLivreClient:
    def __init__(self, access_token: str, transport: httpx.BaseTransport | None = None) -> None:
        self.access_token = access_token
        self.transport = transport

    def get_listing(self, external_id: str) -> ListingData:
        if not ITEM_ID.fullmatch(external_id):
            raise ValueError("Identificador de publicação inválido")
        if not self.access_token:
            raise IntegrationError("integration_auth_required")
        with httpx.Client(
            base_url=API_BASE_URL,
            timeout=httpx.Timeout(5.0),
            follow_redirects=False,
            transport=self.transport,
            headers={"Authorization": f"Bearer {self.access_token}"},
        ) as client:
            item_response = self._get(client, f"/items/{external_id}")
            if item_response.status_code == 404:
                raise IntegrationError("product_not_found")
            item = self._decode(item_response)
            self._validate_item(item, external_id)
            price_response = self._get(
                client,
                f"/items/{external_id}/sale_price",
                params={"context": "channel_marketplace", "quantity": "1"},
            )
            price = None
            if price_response.status_code != 404:
                price_data = self._decode(price_response)
                if price_data.get("amount") is not None:
                    if price_data.get("currency_id") != "BRL":
                        raise IntegrationError("unsupported_price_context")
                    amount = price_data["amount"]
                    if isinstance(amount, bool) or not isinstance(amount, (int, Decimal)):
                        raise IntegrationError("integration_invalid_response")
                    price = Decimal(amount)
                    if not price.is_finite() or price < 0:
                        raise IntegrationError("integration_invalid_response")
                    # Single rounding at the source boundary: comparisons and NUMERIC(18, 2)
                    # storage see the same value, so sub-cent noise is never a "change".
                    price = price.quantize(CENT, rounding=ROUND_HALF_UP)
            image_url = next(
                (
                    candidate for candidate in (item.get("secure_thumbnail"), item.get("thumbnail"))
                    if self._is_allowed_url(candidate, "mlstatic.com", subdomains=True)
                ),
                None,
            )
            status = item.get("status")
            quantity = item.get("available_quantity")
            if status == "active" and isinstance(quantity, int) and not isinstance(quantity, bool):
                availability = "available" if quantity > 0 else "unavailable"
            elif status in {"paused", "closed"}:
                availability = "unavailable"
            else:
                availability = "unknown"
            return ListingData(
                external_id=external_id,
                title=item["title"],
                canonical_url=item["permalink"],
                image_url=image_url,
                price=price,
                currency="BRL",
                availability=availability,
            )

    @staticmethod
    def _get(client: httpx.Client, path: str, params: dict[str, str] | None = None) -> httpx.Response:
        try:
            response = client.get(path, params=params)
        except httpx.RequestError as exc:
            raise IntegrationError("integration_unavailable") from exc
        if response.status_code == 401:
            raise IntegrationError("integration_auth_required")
        if response.status_code == 403:
            raise IntegrationError("integration_access_denied")
        if response.status_code == 429:
            retry_after = response.headers.get("Retry-After", "")
            seconds = int(retry_after) if retry_after.isdigit() else None
            raise IntegrationError("integration_rate_limited", seconds)
        if response.status_code >= 500:
            raise IntegrationError("integration_unavailable")
        if response.status_code != 200 and response.status_code != 404:
            raise IntegrationError("integration_invalid_response")
        return response

    @staticmethod
    def _decode(response: httpx.Response) -> dict[str, object]:
        try:
            data = json.loads(response.content, parse_float=Decimal)
        except (ValueError, UnicodeDecodeError) as exc:
            raise IntegrationError("integration_invalid_response") from exc
        if not isinstance(data, dict):
            raise IntegrationError("integration_invalid_response")
        return data

    @classmethod
    def _validate_item(cls, item: dict[str, object], external_id: str) -> None:
        if (
            item.get("id") != external_id
            or item.get("site_id") != "MLB"
            or item.get("currency_id") != "BRL"
            or not isinstance(item.get("title"), str)
            or not item["title"].strip()
            or not cls._is_allowed_url(item.get("permalink"), "mercadolivre.com.br", subdomains=True)
        ):
            raise IntegrationError("integration_invalid_response")

    @staticmethod
    def _is_allowed_url(value: object, domain: str, *, subdomains: bool) -> bool:
        if not isinstance(value, str):
            return False
        try:
            parsed = urlsplit(value)
            hostname = parsed.hostname
            return (
                parsed.scheme == "https"
                and hostname is not None
                and (hostname == domain or (subdomains and hostname.endswith(f".{domain}")))
                and parsed.username is None
                and parsed.password is None
                and parsed.port in (None, 443)
            )
        except ValueError:
            return False
