from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from math import ceil

import httpx
from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy import select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from app.marketplace.client import IntegrationError
from app.products.models import OperatorCredential

REFRESH_MARGIN = timedelta(minutes=5)
TOKEN_URL = "https://api.mercadolibre.com/oauth/token"


def _cipher(key: bytes) -> Fernet:
    try:
        return Fernet(key)
    except (TypeError, ValueError) as exc:
        raise IntegrationError("integration_not_configured") from exc


def provision_operator_tokens(
    session: Session, key: bytes, access_token: str, refresh_token: str, expires_at: datetime,
) -> None:
    if not access_token or not refresh_token or expires_at.tzinfo is None:
        raise ValueError("Credenciais ou expiração inválidas")
    cipher = _cipher(key)
    row = session.get(OperatorCredential, 1)
    if row is None:
        row = OperatorCredential(id=1)
        session.add(row)
    row.encrypted_access_token = cipher.encrypt(access_token.encode()).decode()
    row.encrypted_refresh_token = cipher.encrypt(refresh_token.encode()).decode()
    row.expires_at = expires_at.astimezone(UTC)
    row.refresh_blocked = False
    row.refresh_retry_after_at = None
    session.commit()


class OperatorTokenManager:
    def __init__(
        self, engine: Engine, key: bytes, client_id: str, client_secret: str,
        *, transport: httpx.BaseTransport | None = None, clock: Callable[[], datetime] | None = None,
    ) -> None:
        self.engine = engine
        self.cipher = _cipher(key)
        self.client_id = client_id
        self.client_secret = client_secret
        self.transport = transport
        self.clock = clock or (lambda: datetime.now(UTC))

    def get_access_token(self) -> str:
        with Session(self.engine) as session:
            row = session.scalar(select(OperatorCredential).where(OperatorCredential.id == 1).with_for_update())
            if row is None:
                raise IntegrationError("integration_auth_required")
            if row.refresh_blocked:
                raise IntegrationError("integration_auth_required")
            retry_at = row.refresh_retry_after_at
            if retry_at is not None:
                if retry_at.tzinfo is None:
                    retry_at = retry_at.replace(tzinfo=UTC)
                if retry_at > self.clock():
                    raise IntegrationError("integration_rate_limited", ceil((retry_at - self.clock()).total_seconds()))
            expires_at = row.expires_at
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=UTC)
            if expires_at <= self.clock() + REFRESH_MARGIN:
                self._refresh(session, row)
            return self._decrypt(row.encrypted_access_token)

    def _decrypt(self, encrypted: str) -> str:
        try:
            return self.cipher.decrypt(encrypted.encode()).decode()
        except (InvalidToken, UnicodeDecodeError) as exc:
            raise IntegrationError("integration_auth_required") from exc

    def _refresh(self, session: Session, row: OperatorCredential) -> None:
        if not self.client_id or not self.client_secret:
            raise IntegrationError("integration_not_configured")
        refresh_token = self._decrypt(row.encrypted_refresh_token)
        try:
            with httpx.Client(timeout=httpx.Timeout(5.0), follow_redirects=False, transport=self.transport) as client:
                response = client.post(TOKEN_URL, data={
                    "grant_type": "refresh_token", "client_id": self.client_id,
                    "client_secret": self.client_secret, "refresh_token": refresh_token,
                })
        except httpx.RequestError as exc:
            row.refresh_blocked = True
            session.commit()
            raise IntegrationError("integration_unavailable") from exc
        if response.status_code == 429:
            retry_after = response.headers.get("Retry-After", "")
            seconds = int(retry_after) if retry_after.isdigit() else None
            row.refresh_retry_after_at = self.clock() + timedelta(seconds=seconds or 60)
            session.commit()
            raise IntegrationError("integration_rate_limited", seconds)
        if response.status_code != 200:
            code = "integration_auth_required" if response.status_code in {400, 401, 403} else "integration_unavailable"
            row.refresh_blocked = True
            session.commit()
            raise IntegrationError(code)
        try:
            payload = response.json()
        except ValueError as exc:
            row.refresh_blocked = True
            session.commit()
            raise IntegrationError("integration_invalid_response") from exc
        if not isinstance(payload, dict):
            row.refresh_blocked = True
            session.commit()
            raise IntegrationError("integration_invalid_response")
        access_token = payload.get("access_token")
        new_refresh_token = payload.get("refresh_token")
        lifetime = payload.get("expires_in")
        if (
            not isinstance(access_token, str) or not access_token
            or not isinstance(new_refresh_token, str) or not new_refresh_token
            or payload.get("token_type") != "Bearer"
            or isinstance(lifetime, bool) or not isinstance(lifetime, int) or lifetime <= 300
        ):
            row.refresh_blocked = True
            session.commit()
            raise IntegrationError("integration_invalid_response")
        row.encrypted_access_token = self.cipher.encrypt(access_token.encode()).decode()
        row.encrypted_refresh_token = self.cipher.encrypt(new_refresh_token.encode()).decode()
        row.expires_at = self.clock() + timedelta(seconds=lifetime)
        row.refresh_retry_after_at = None
        session.commit()
