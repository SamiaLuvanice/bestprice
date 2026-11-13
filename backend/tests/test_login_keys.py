"""Chaves do limite de login: HMAC com segredo, nunca o valor em claro."""

import hashlib
import hmac
from datetime import timedelta

from starlette.requests import Request

from app.auth.limiter import source_hash
from app.auth.login_limiter import login_account_key, login_source_key
from app.auth.settings import LoginSettings

SECRET = "h" * 32
PROXY_SECRET = "p" * 32


def settings(proxy_secret: str = PROXY_SECRET) -> LoginSettings:
    return LoginSettings(
        account_attempts=10, source_attempts=50, window=timedelta(minutes=15),
        trusted_proxy_secret=proxy_secret, hash_secret=SECRET,
    )


def request(headers: dict[str, str], peer: str = "198.51.100.7") -> Request:
    return Request({
        "type": "http", "method": "POST", "path": "/api/auth/login", "client": (peer, 50000),
        "headers": [(key.lower().encode(), value.encode()) for key, value in headers.items()],
    })


def test_account_key_is_keyed_hmac_of_normalized_email_with_domain_prefix() -> None:
    expected = hmac.new(SECRET.encode(), b"login-email:ana@exemplo.com", hashlib.sha256).hexdigest()
    assert login_account_key("  Ana@Exemplo.COM \t", SECRET) == expected
    assert len(expected) == 64


def test_account_key_never_collides_with_source_hash_of_the_same_text() -> None:
    assert login_account_key("ana@exemplo.com", SECRET) != source_hash("ana@exemplo.com", SECRET)


def test_account_key_depends_on_secret() -> None:
    assert login_account_key("ana@exemplo.com", SECRET) != login_account_key("ana@exemplo.com", "o" * 32)


def test_source_key_uses_trusted_proxy_header_only_with_the_shared_secret() -> None:
    proxied = {"X-BestPrice-Client-IP": "203.0.113.9", "X-BestPrice-Proxy-Secret": PROXY_SECRET}
    assert login_source_key(request(proxied), settings()) == source_hash("203.0.113.9", SECRET)
    forged = {"X-BestPrice-Client-IP": "203.0.113.9", "X-BestPrice-Proxy-Secret": "x" * 32}
    assert login_source_key(request(forged), settings()) == source_hash("198.51.100.7", SECRET)


def test_source_key_reduces_ipv6_to_its_64_prefix() -> None:
    first = request({}, peer="2001:db8:abcd:12::1")
    second = request({}, peer="2001:db8:abcd:12:ffff::2")
    assert login_source_key(first, settings("")) == login_source_key(second, settings(""))
