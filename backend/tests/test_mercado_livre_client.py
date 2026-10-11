from decimal import Decimal

import httpx
import pytest

from app.marketplace.client import IntegrationError, MercadoLivreClient


def test_client_reads_item_and_sale_price_from_fixed_api_host() -> None:
    requests: list[httpx.Request] = []

    def respond(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if request.url.path == "/items/MLB1234567890":
            return httpx.Response(200, json={
                "id": "MLB1234567890", "site_id": "MLB", "title": "Fone",
                "permalink": "https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM",
                "thumbnail": "https://http2.mlstatic.com/image.jpg", "status": "active",
                "available_quantity": 1, "currency_id": "BRL",
                "price": 1,
            })
        assert request.url.path == "/items/MLB1234567890/sale_price"
        assert request.url.params["context"] == "channel_marketplace"
        assert request.url.params["quantity"] == "1"
        return httpx.Response(200, json={"amount": 99.90, "currency_id": "BRL"})

    client = MercadoLivreClient("token-test", httpx.MockTransport(respond))
    result = client.get_listing("MLB1234567890")

    assert result.external_id == "MLB1234567890"
    assert result.price == Decimal("99.90")
    assert result.availability == "available"
    assert len(requests) == 2
    assert all(request.url.host == "api.mercadolibre.com" for request in requests)
    assert all(request.headers["Authorization"] == "Bearer token-test" for request in requests)


@pytest.mark.parametrize(
    ("status", "expected_code"),
    [(401, "integration_auth_required"), (403, "integration_access_denied"),
     (429, "integration_rate_limited"), (503, "integration_unavailable")],
)
def test_client_maps_upstream_failures(status: int, expected_code: str) -> None:
    def respond(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(status, headers={"Retry-After": "42"})

    client = MercadoLivreClient("token-test", httpx.MockTransport(respond))
    with pytest.raises(IntegrationError) as failure:
        client.get_listing("MLB1234567890")

    assert failure.value.code == expected_code
    if status == 429:
        assert failure.value.retry_after_seconds == 42


def test_client_does_not_fall_back_to_deprecated_item_price() -> None:
    def respond(request: httpx.Request) -> httpx.Response:
        if request.url.path.endswith("/sale_price"):
            return httpx.Response(404)
        return httpx.Response(200, json={
            "id": "MLB1234567890", "site_id": "MLB", "title": "Fone",
            "permalink": "https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM",
            "status": "active", "available_quantity": 1, "currency_id": "BRL",
            "price": 299.9,
        })

    client = MercadoLivreClient("token-test", httpx.MockTransport(respond))
    assert client.get_listing("MLB1234567890").price is None


ITEM = {
    "id": "MLB1234567890", "site_id": "MLB", "title": "Fone",
    "permalink": "https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM",
    "status": "active", "available_quantity": 1, "currency_id": "BRL",
}


def _client(item: dict | None = None, sale: httpx.Response | None = None) -> MercadoLivreClient:
    def respond(request: httpx.Request) -> httpx.Response:
        if request.url.path.endswith("/sale_price"):
            return sale or httpx.Response(200, json={"amount": 99.90, "currency_id": "BRL"})
        return httpx.Response(200, json=item or ITEM)

    return MercadoLivreClient("token-test", httpx.MockTransport(respond))


def test_client_prefers_secure_thumbnail_and_drops_insecure_fallback() -> None:
    secure = _client({**ITEM, "thumbnail": "http://http2.mlstatic.com/a.jpg", "secure_thumbnail": "https://http2.mlstatic.com/a.jpg"})
    assert secure.get_listing("MLB1234567890").image_url == "https://http2.mlstatic.com/a.jpg"
    insecure = _client({**ITEM, "thumbnail": "http://http2.mlstatic.com/a.jpg"})
    assert insecure.get_listing("MLB1234567890").image_url is None
    https_only = _client({**ITEM, "thumbnail": "https://http2.mlstatic.com/b.jpg"})
    assert https_only.get_listing("MLB1234567890").image_url == "https://http2.mlstatic.com/b.jpg"


@pytest.mark.parametrize(("amount", "expected"), [("99.899", "99.90"), ("99.905", "99.91"), ("100", "100.00")])
def test_client_quantizes_price_once_to_cents(amount: str, expected: str) -> None:
    sale = httpx.Response(200, content=f'{{"amount": {amount}, "currency_id": "BRL"}}'.encode())
    price = _client(sale=sale).get_listing("MLB1234567890").price
    assert price == Decimal(expected)
    assert price.as_tuple().exponent == -2


def test_client_maps_timeout_to_unavailable() -> None:
    def respond(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("lento", request=request)

    with pytest.raises(IntegrationError) as failure:
        MercadoLivreClient("token-test", httpx.MockTransport(respond)).get_listing("MLB1234567890")
    assert failure.value.code == "integration_unavailable"


def test_client_maps_missing_item_to_not_found() -> None:
    client = MercadoLivreClient("token-test", httpx.MockTransport(lambda _request: httpx.Response(404, json={"error": "not_found"})))
    with pytest.raises(IntegrationError) as failure:
        client.get_listing("MLB1234567890")
    assert failure.value.code == "product_not_found"


def test_client_maps_invalid_json_to_invalid_response() -> None:
    client = MercadoLivreClient("token-test", httpx.MockTransport(lambda _request: httpx.Response(200, content=b"{nao-json")))
    with pytest.raises(IntegrationError) as failure:
        client.get_listing("MLB1234567890")
    assert failure.value.code == "integration_invalid_response"


def test_client_rejects_other_currency_as_unsupported_price_context() -> None:
    client = _client(sale=httpx.Response(200, json={"amount": 10, "currency_id": "USD"}))
    with pytest.raises(IntegrationError) as failure:
        client.get_listing("MLB1234567890")
    assert failure.value.code == "unsupported_price_context"


def _variation(variation_id: int, price: object) -> dict:
    return {"id": variation_id, "price": price, "available_quantity": 1, "attribute_combinations": []}


def test_client_rejects_variations_with_distinct_prices_as_unsupported_price_context() -> None:
    # The accepted URL never identifies a variation: picking one, or the cheapest, would be arbitrary.
    client = _client({**ITEM, "variations": [_variation(1, 99.90), _variation(2, 129.90)]})
    with pytest.raises(IntegrationError) as failure:
        client.get_listing("MLB1234567890")
    assert failure.value.code == "unsupported_price_context"


def test_client_accepts_variations_sharing_one_price() -> None:
    client = _client({**ITEM, "variations": [_variation(1, 99.90), _variation(2, 99.90)]})
    assert client.get_listing("MLB1234567890").price == Decimal("99.90")


@pytest.mark.parametrize(
    "conditions",
    [
        {"context_restrictions": ["channel_marketplace", "user_type_loyalty_3"], "eligible": True},
        {"context_restrictions": ["channel_marketplace"], "eligible": False},
        {"context_restrictions": ["buyer_coupon"]},
    ],
)
def test_client_rejects_personal_benefit_price_as_unsupported_price_context(conditions: dict) -> None:
    sale = httpx.Response(200, json={"amount": 89.90, "currency_id": "BRL", "conditions": conditions})
    with pytest.raises(IntegrationError) as failure:
        _client(sale=sale).get_listing("MLB1234567890")
    assert failure.value.code == "unsupported_price_context"


def test_client_accepts_marketplace_only_price_conditions() -> None:
    sale = httpx.Response(200, json={
        "amount": 89.90, "currency_id": "BRL",
        "conditions": {"context_restrictions": ["channel_marketplace"], "eligible": True},
    })
    assert _client(sale=sale).get_listing("MLB1234567890").price == Decimal("89.90")


def test_client_lets_unpriced_variation_follow_item_sale_price() -> None:
    # A variation without its own price follows the item-level sale price; the priced one agrees.
    sale = httpx.Response(200, json={"amount": 89.90, "currency_id": "BRL"})
    client = _client({**ITEM, "variations": [_variation(1, 89.90), {"id": 2, "available_quantity": 1}]}, sale)
    assert client.get_listing("MLB1234567890").price == Decimal("89.90")


def test_client_rejects_variation_price_differing_from_sale_price() -> None:
    # The unpriced variation would cost 89.90 and the priced one 99.90: no single price exists.
    sale = httpx.Response(200, json={"amount": 89.90, "currency_id": "BRL"})
    client = _client({**ITEM, "variations": [_variation(1, 99.90), {"id": 2, "available_quantity": 1}]}, sale)
    with pytest.raises(IntegrationError) as failure:
        client.get_listing("MLB1234567890")
    assert failure.value.code == "unsupported_price_context"


def test_client_keeps_missing_sale_price_without_using_variation_price() -> None:
    client = _client({**ITEM, "variations": [_variation(1, 99.90)]}, httpx.Response(404))
    assert client.get_listing("MLB1234567890").price is None


def test_client_collapses_variation_prices_differing_below_one_cent() -> None:
    # 99.901 and 99.899 both round once to 99.90, so they are one price, not an ambiguity.
    client = _client({**ITEM, "variations": [_variation(1, 99.901), _variation(2, 99.899)]})
    assert client.get_listing("MLB1234567890").price == Decimal("99.90")


@pytest.mark.parametrize("variations", [[_variation(1, "99.90"), _variation(2, 99.90)], {"id": 1}, ["MLB1"]])
def test_client_rejects_malformed_variation_price_as_invalid_response(variations: object) -> None:
    with pytest.raises(IntegrationError) as failure:
        _client({**ITEM, "variations": variations}).get_listing("MLB1234567890")
    assert failure.value.code == "integration_invalid_response"


def test_client_accepts_promotion_when_variations_match_regular_amount() -> None:
    # Variations carry the full price; the sale price is a promotion over that same price.
    sale = httpx.Response(200, json={"amount": 89.90, "regular_amount": 99.90, "currency_id": "BRL"})
    client = _client({**ITEM, "variations": [_variation(1, 99.90), _variation(2, 99.90)]}, sale)
    assert client.get_listing("MLB1234567890").price == Decimal("89.90")


@pytest.mark.parametrize("regular_amount", ["99.90", True, -1])
def test_client_rejects_malformed_regular_amount_as_invalid_response(regular_amount: object) -> None:
    sale = httpx.Response(200, json={"amount": 89.90, "regular_amount": regular_amount, "currency_id": "BRL"})
    with pytest.raises(IntegrationError) as failure:
        _client({**ITEM, "variations": [_variation(1, 99.90)]}, sale).get_listing("MLB1234567890")
    assert failure.value.code == "integration_invalid_response"


def test_client_rejects_variation_price_differing_from_amount_and_regular_amount() -> None:
    sale = httpx.Response(200, json={"amount": 89.90, "regular_amount": 109.90, "currency_id": "BRL"})
    client = _client({**ITEM, "variations": [_variation(1, 99.90), _variation(2, 99.90)]}, sale)
    with pytest.raises(IntegrationError) as failure:
        client.get_listing("MLB1234567890")
    assert failure.value.code == "unsupported_price_context"
