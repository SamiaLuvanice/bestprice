import hashlib
import hmac
from datetime import timedelta

import pytest
from starlette.requests import Request

from app.auth.limiter import normalize_source, signup_source_key, source_hash
from app.auth.settings import SignupSettings

PROXY_SECRET = "p" * 32
HASH_SECRET = "h" * 32


def settings(proxy_secret: str = PROXY_SECRET) -> SignupSettings:
    return SignupSettings(
        enabled=True, rate_limit_attempts=5, rate_limit_window=timedelta(minutes=60),
        trusted_proxy_secret=proxy_secret, source_hash_secret=HASH_SECRET,
    )


def request(peer: str | None, headers: dict[str, str]) -> Request:
    return Request({
        "type": "http", "method": "POST", "path": "/api/auth/signup",
        "headers": [(k.lower().encode(), v.encode()) for k, v in headers.items()],
        "client": (peer, 50000) if peer else None,
    })


def expected(origin: str) -> str:
    return hmac.new(HASH_SECRET.encode(), origin.encode(), hashlib.sha256).hexdigest()


def proxied(ip: str, secret: str = PROXY_SECRET) -> dict[str, str]:
    return {"X-BestPrice-Client-IP": ip, "X-BestPrice-Proxy-Secret": secret}


def test_trusted_proxy_header_identifies_the_visitor() -> None:
    key = signup_source_key(request("10.0.0.9", proxied("203.0.113.7")), settings())
    assert key == expected("203.0.113.7")


@pytest.mark.parametrize("headers", [
    {"X-BestPrice-Client-IP": "203.0.113.7"},
    proxied("203.0.113.7", secret="x" * 32),
    proxied("203.0.113.7", secret=""),
    proxied("não-é-ip"),
    proxied("203.0.113.7, 198.51.100.1"),
    {"X-Forwarded-For": "203.0.113.7", "CF-Connecting-IP": "203.0.113.7"},
], ids=["sem-segredo", "segredo-errado", "segredo-vazio", "ip-invalido", "lista", "cabecalhos-padrao"])
def test_untrusted_or_invalid_header_falls_back_to_the_peer(headers: dict[str, str]) -> None:
    assert signup_source_key(request("10.0.0.9", headers), settings()) == expected("10.0.0.9")


def test_header_is_ignored_when_no_proxy_secret_is_configured() -> None:
    key = signup_source_key(request("10.0.0.9", proxied("203.0.113.7", secret="")), settings(proxy_secret=""))
    assert key == expected("10.0.0.9")


def test_missing_peer_still_produces_a_stable_bucket() -> None:
    assert signup_source_key(request(None, {}), settings()) == expected("unknown")


@pytest.mark.parametrize(("raw", "normalized"), [
    ("203.0.113.7", "203.0.113.7"),
    ("2001:db8:1:2:aaaa:bbbb:cccc:dddd", "2001:db8:1:2::/64"),
    ("2001:DB8:1:2::1", "2001:db8:1:2::/64"),
    ("::ffff:203.0.113.7", "203.0.113.7"),
    ("testclient", "testclient"),
])
def test_normalize_source(raw: str, normalized: str) -> None:
    assert normalize_source(raw) == normalized


def test_ipv6_addresses_in_the_same_64_share_a_bucket() -> None:
    first = signup_source_key(request("10.0.0.9", proxied("2001:db8:1:2::1")), settings())
    second = signup_source_key(request("10.0.0.9", proxied("2001:db8:1:2:ffff::9")), settings())
    other = signup_source_key(request("10.0.0.9", proxied("2001:db8:1:3::1")), settings())
    assert first == second != other


def test_source_hash_is_keyed_hex_without_the_ip() -> None:
    key = source_hash("203.0.113.7", HASH_SECRET)
    assert len(key) == 64 and int(key, 16) >= 0
    assert key == source_hash("203.0.113.7", HASH_SECRET)
    assert key != source_hash("203.0.113.7", "outro" * 8)
    assert key != hashlib.sha256(b"203.0.113.7").hexdigest()
    assert "203.0.113.7" not in key
