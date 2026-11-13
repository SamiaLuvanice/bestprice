"""Limite de falhas de login por origem + e-mail e por origem.

Só falhas contam, mas a falha só é conhecida depois do scrypt. Para manter o limite exato
sob concorrência sem segurar o lock durante o scrypt, a falha é reservada antes (sob o lock
da origem, com commit) e, no sucesso, a reserva é desfeita. Origem e e-mail ficam guardados
só como HMAC-SHA256 com segredo; nunca em claro nem em log.
"""

import hashlib
import hmac
import math
from datetime import datetime, timedelta

from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session
from starlette.requests import Request

from app.auth.accounts import normalize_email
from app.auth.limiter import (
    UNKNOWN_SOURCE,
    _trusted_client_ip,
    normalize_source,
    source_hash,
)
from app.auth.models import LoginFailure
from app.auth.settings import LoginSettings

ACCOUNT_KEY_PREFIX = "login-email:"


def login_source_key(request: Request, settings: LoginSettings) -> str:
    """Mesma origem confiável do cadastro: cabeçalho do proxy só com o segredo compartilhado."""
    raw = _trusted_client_ip(request, settings.trusted_proxy_secret)
    if raw is None:
        raw = request.client.host if request.client else UNKNOWN_SOURCE
    return source_hash(normalize_source(raw), settings.hash_secret)


def login_account_key(email: str, secret: str) -> str:
    # O prefixo separa o domínio do e-mail do domínio da origem sob o mesmo segredo.
    message = (ACCOUNT_KEY_PREFIX + normalize_email(email)).encode("utf-8")
    return hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()


class LoginRateLimited(Exception):
    def __init__(self, retry_after_seconds: int) -> None:
        super().__init__("login rate limited")
        self.retry_after_seconds = retry_after_seconds


def _wait_seconds(recent: list[datetime], limit: int, window: timedelta, now: datetime) -> int | None:
    if len(recent) < limit:
        return None
    frees_at = recent[len(recent) - limit] + window
    return max(1, math.ceil((frees_at - now).total_seconds()))


def purge_login_failures(session: Session, now: datetime, window: timedelta) -> int:
    """Apaga as falhas que já saíram da janela (de todas as origens). Não confirma."""
    result = session.execute(delete(LoginFailure).where(LoginFailure.failed_at <= now - window))
    return result.rowcount or 0


class PostgresLoginLimiter:
    """Janela deslizante no PostgreSQL, compartilhada por todas as instâncias da API."""

    def reserve(
        self, session: Session, source_key: str, account_key: str | None, now: datetime, settings: LoginSettings,
    ) -> int:
        """Grava e confirma a falha reservada e devolve o id dela; ou levanta LoginRateLimited sem gravar.

        `account_key` é None para corpo malformado: só a contagem da origem se aplica.
        """
        # Serializa as tentativas da mesma origem até o commit desta transação (milissegundos).
        session.execute(select(func.pg_advisory_xact_lock(func.hashtextextended("login:" + source_key, 0))))
        window_start = now - settings.window
        session.execute(delete(LoginFailure).where(
            LoginFailure.source_hash == source_key, LoginFailure.failed_at <= window_start,
        ))
        recent = session.execute(
            select(LoginFailure.account_hash, LoginFailure.failed_at)
            .where(LoginFailure.source_hash == source_key, LoginFailure.failed_at > window_start)
            .order_by(LoginFailure.failed_at),
        ).all()
        waits = [_wait_seconds([at for _, at in recent], settings.source_attempts, settings.window, now)]
        if account_key is not None:
            combination = [at for account, at in recent if account == account_key]
            waits.append(_wait_seconds(combination, settings.account_attempts, settings.window, now))
        exceeded = [wait for wait in waits if wait is not None]
        if exceeded:
            session.rollback()  # libera o lock sem gravar nada: a recusa não conta
            raise LoginRateLimited(max(exceeded))
        reservation = LoginFailure(source_hash=source_key, account_hash=account_key, failed_at=now)
        session.add(reservation)
        session.flush()
        reservation_id = reservation.id
        session.commit()  # solta o lock antes do scrypt
        return reservation_id

    def record_success(self, session: Session, reservation_id: int, source_key: str, account_key: str) -> None:
        """Desfaz a reserva e zera a contagem origem + e-mail, preservando a contagem por origem. Não confirma.

        Roda na sessão da requisição e é confirmado junto com a sessão do usuário: uma só
        conexão do pool, e reserva desfeita e sessão aberta entram ou falham juntas.

        As falhas anteriores da combinação continuam contando para a origem (um atacante com
        conta própria não pode zerar a origem entrando nela); só deixam de apontar o e-mail.
        """
        session.execute(delete(LoginFailure).where(LoginFailure.id == reservation_id))
        session.execute(
            update(LoginFailure)
            .where(LoginFailure.source_hash == source_key, LoginFailure.account_hash == account_key)
            .values(account_hash=None),
        )
