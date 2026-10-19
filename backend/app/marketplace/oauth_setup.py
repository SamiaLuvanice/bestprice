"""Operator authorization-code flow for the official Mercado Livre OAuth API."""

import base64
import binascii
import hashlib
import hmac
import json
import secrets
from collections.abc import Mapping
from datetime import UTC, datetime, timedelta
from urllib.parse import urlencode, urlsplit

import httpx
from cryptography.fernet import Fernet
from sqlalchemy.orm import Session

from app.marketplace.client import IntegrationError
from app.marketplace.oauth import (
    TOKEN_URL,
    is_bearer_token_type,
    provision_operator_tokens,
)

AUTHORIZATION_URL = "https://auth.mercadolivre.com.br/authorization"
STATE_TTL = timedelta(minutes=10)
STATE_CONTEXT = b"bestprice-mercadolivre-oauth-state-v1"
CALLBACK_PATH = "/api/marketplace/oauth/callback"


def _redirect_uri_is_valid(redirect_uri: str) -> bool:
    try:
        parsed = urlsplit(redirect_uri)
        return bool(
            parsed.scheme == "https" and parsed.netloc and parsed.hostname
            and parsed.username is None and parsed.password is None
            and not parsed.query and not parsed.fragment
        )
    except ValueError:
        return False


def _signing_key(key: bytes) -> bytes:
    try:
        Fernet(key)
        decoded = base64.urlsafe_b64decode(key)
    except (binascii.Error, TypeError, ValueError) as exc:
        raise ValueError("OAuth key is invalid") from exc
    if len(decoded) != 32:
        raise ValueError("OAuth key is invalid")
    return hmac.new(decoded, STATE_CONTEXT, hashlib.sha256).digest()


def _encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def _signed_state(key: bytes, redirect_uri: str, *, now: datetime) -> str:
    payload = json.dumps(
        {
            "expires_at": int((now + STATE_TTL).timestamp()),
            "nonce": secrets.token_urlsafe(24),
            "redirect_uri": redirect_uri,
            "version": 1,
        },
        separators=(",", ":"), sort_keys=True,
    ).encode("utf-8")
    encoded = _encode(payload)
    signature = hmac.new(_signing_key(key), encoded.encode("ascii"), hashlib.sha256).digest()
    return f"{encoded}.{_encode(signature)}"


def build_authorization_url(
    client_id: str, redirect_uri: str, key: bytes, *, now: datetime | None = None,
) -> str:
    if not client_id or not _redirect_uri_is_valid(redirect_uri):
        raise ValueError("OAuth client ID and an HTTPS redirect URI are required")
    observed = now or datetime.now(UTC)
    if observed.tzinfo is None:
        raise ValueError("OAuth state clock must include a timezone")
    state = _signed_state(key, redirect_uri, now=observed.astimezone(UTC))
    query = urlencode({
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "state": state,
    })
    return f"{AUTHORIZATION_URL}?{query}"


def verify_authorization_state(
    state: str, key: bytes, redirect_uri: str, *, now: datetime | None = None,
) -> bool:
    if not state or len(state) > 2048 or not _redirect_uri_is_valid(redirect_uri):
        return False
    try:
        encoded, signature = state.split(".", maxsplit=1)
        expected = hmac.new(_signing_key(key), encoded.encode("ascii"), hashlib.sha256).digest()
        if not hmac.compare_digest(expected, _decode(signature)):
            return False
        payload = json.loads(_decode(encoded))
        expires_at = payload.get("expires_at")
        nonce = payload.get("nonce")
        if (
            payload.get("version") != 1 or payload.get("redirect_uri") != redirect_uri
            or isinstance(expires_at, bool) or not isinstance(expires_at, int)
            or not isinstance(nonce, str) or not nonce
        ):
            return False
        observed = now or datetime.now(UTC)
        if observed.tzinfo is None:
            return False
        return int(observed.astimezone(UTC).timestamp()) <= expires_at
    except (binascii.Error, ValueError, TypeError, UnicodeError, json.JSONDecodeError):
        return False


def _validate_exchange_configuration(
    client_id: str,
    client_secret: str,
    code: str,
    redirect_uri: str,
) -> None:
    if (
        not client_id or not client_secret or not code or len(code) > 2048
        or not _redirect_uri_is_valid(redirect_uri)
    ):
        raise IntegrationError("integration_not_configured")


def _request_authorization_token(
    client_id: str,
    client_secret: str,
    code: str,
    redirect_uri: str,
    transport: httpx.BaseTransport | None,
) -> Mapping[str, object]:
    try:
        with httpx.Client(timeout=httpx.Timeout(5.0), follow_redirects=False, transport=transport) as client:
            response = client.post(TOKEN_URL, data={
                "grant_type": "authorization_code",
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "redirect_uri": redirect_uri,
            })
    except httpx.RequestError as exc:
        raise IntegrationError("integration_unavailable") from exc
    if response.status_code == 429:
        raise IntegrationError("integration_rate_limited")
    if response.status_code in {400, 401, 403}:
        raise IntegrationError("integration_auth_required")
    if response.status_code != 200:
        raise IntegrationError("integration_unavailable")
    try:
        payload = response.json()
    except ValueError as exc:
        raise IntegrationError("integration_invalid_response") from exc
    if not isinstance(payload, Mapping):
        raise IntegrationError("integration_invalid_response")
    return payload


def _validated_token_values(
    payload: Mapping[str, object], now: datetime | None,
) -> tuple[str, str, datetime]:
    access_token = payload.get("access_token")
    refresh_token = payload.get("refresh_token")
    lifetime = payload.get("expires_in")
    token_type = payload.get("token_type")
    if (
        not isinstance(access_token, str) or not access_token
        or not isinstance(refresh_token, str) or not refresh_token
        or not is_bearer_token_type(token_type)
        or isinstance(lifetime, bool) or not isinstance(lifetime, int) or lifetime <= 300
    ):
        raise IntegrationError("integration_invalid_response")
    observed = now or datetime.now(UTC)
    if observed.tzinfo is None:
        raise IntegrationError("integration_invalid_response")
    expires_at = observed.astimezone(UTC) + timedelta(seconds=lifetime)
    return access_token, refresh_token, expires_at


def exchange_authorization_code(
    session: Session,
    key: bytes,
    client_id: str,
    client_secret: str,
    code: str,
    redirect_uri: str,
    *,
    transport: httpx.BaseTransport | None = None,
    now: datetime | None = None,
) -> None:
    _validate_exchange_configuration(client_id, client_secret, code, redirect_uri)
    payload = _request_authorization_token(client_id, client_secret, code, redirect_uri, transport)
    access_token, refresh_token, expires_at = _validated_token_values(payload, now)
    provision_operator_tokens(
        session, key, access_token, refresh_token, expires_at,
    )
