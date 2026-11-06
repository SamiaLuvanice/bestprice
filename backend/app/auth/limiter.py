"""Origem do cadastro e limite de tentativas por origem.

A origem só vem do cabeçalho do proxy quando ele traz o segredo compartilhado; a API é
pública e qualquer outro cabeçalho (X-Forwarded-For, CF-Connecting-IP) é forjável. A origem
normalizada nunca é gravada nem registrada em log: só o HMAC-SHA256 com segredo próprio.
"""

import hashlib
import hmac
import ipaddress
import math
from datetime import datetime, timedelta

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session
from starlette.requests import Request

from app.auth.models import SignupAttempt
from app.auth.settings import SignupSettings

CLIENT_IP_HEADER = "x-bestprice-client-ip"
PROXY_SECRET_HEADER = "x-bestprice-proxy-secret"
UNKNOWN_SOURCE = "unknown"


def normalize_source(raw: str) -> str:
    """IPv4 completo; IPv6 reduzido ao /64; IPv4 mapeado vira IPv4; outro valor fica como está."""
    try:
        address = ipaddress.ip_address(raw)
    except ValueError:
        return raw
    if isinstance(address, ipaddress.IPv6Address):
        if address.ipv4_mapped is not None:
            return str(address.ipv4_mapped)
        return str(ipaddress.IPv6Network(f"{address}/64", strict=False))
    return str(address)


def _trusted_client_ip(request: Request, proxy_secret: str) -> str | None:
    if not proxy_secret:
        return None
    presented = request.headers.get(PROXY_SECRET_HEADER, "")
    if not hmac.compare_digest(presented.encode("utf-8"), proxy_secret.encode("utf-8")):
        return None
    candidate = request.headers.get(CLIENT_IP_HEADER, "").strip()
    try:
        ipaddress.ip_address(candidate)
    except ValueError:
        return None
    return candidate


def source_hash(normalized_source: str, secret: str) -> str:
    return hmac.new(secret.encode("utf-8"), normalized_source.encode("utf-8"), hashlib.sha256).hexdigest()


def signup_source_key(request: Request, settings: SignupSettings) -> str:
    raw = _trusted_client_ip(request, settings.trusted_proxy_secret)
    if raw is None:
        raw = request.client.host if request.client else UNKNOWN_SOURCE
    return source_hash(normalize_source(raw), settings.source_hash_secret)


class SignupRateLimited(Exception):
    def __init__(self, retry_after_seconds: int) -> None:
        super().__init__("signup rate limited")
        self.retry_after_seconds = retry_after_seconds


def purge_signup_attempts(session: Session, now: datetime, window: timedelta) -> int:
    """Apaga as tentativas que já saíram da janela (de todas as origens). Não confirma."""
    result = session.execute(delete(SignupAttempt).where(SignupAttempt.attempted_at <= now - window))
    return result.rowcount or 0


class PostgresSignupLimiter:
    """Janela deslizante por origem, persistida no PostgreSQL.

    Recusas não são registradas: o Retry-After informado continua verdadeiro. Uma tentativa
    aceita apaga as vencidas da própria origem; as das demais ficam com o purge do cleanup.
    """

    def check_and_record(self, session: Session, source_key: str, now: datetime, settings: SignupSettings) -> None:
        # Serializa envios simultâneos da mesma origem até o commit desta transação.
        session.execute(select(func.pg_advisory_xact_lock(
            func.hashtextextended("signup:" + source_key, 0),
        )))
        window = settings.rate_limit_window
        # Só a própria origem (sob o lock dela): nada de DELETE global por requisição.
        session.execute(delete(SignupAttempt).where(
            SignupAttempt.source_hash == source_key, SignupAttempt.attempted_at <= now - window,
        ))
        recent = list(session.scalars(
            select(SignupAttempt.attempted_at)
            .where(SignupAttempt.source_hash == source_key, SignupAttempt.attempted_at > now - window)
            .order_by(SignupAttempt.attempted_at),
        ))
        limit = settings.rate_limit_attempts
        if len(recent) >= limit:
            session.rollback()  # libera o lock sem gravar nada
            frees_at = recent[len(recent) - limit] + window
            raise SignupRateLimited(max(1, math.ceil((frees_at - now).total_seconds())))
        session.add(SignupAttempt(source_hash=source_key, attempted_at=now))
        session.commit()
