"""Duração da sessão: 24 h sem uso, teto de 7 dias desde o login e renovação no máximo 1x/hora."""

import os
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta

from fastapi import Request, Response
from sqlalchemy import delete, or_
from sqlalchemy.orm import Session

from app.products.models import UserSession

SESSION_COOKIE = "bestprice_session"
SESSION_IDLE = timedelta(hours=24)
SESSION_ABSOLUTE = timedelta(days=7)
SESSION_RENEW_AFTER = timedelta(hours=1)


def _utc(instant: datetime) -> datetime:
    # SQLite (testes HTTP) devolve instantes ingênuos; o PostgreSQL devolve com fuso.
    return instant if instant.tzinfo is not None else instant.replace(tzinfo=UTC)


def session_active(row: UserSession, now: datetime) -> bool:
    """Termina por inatividade (expires_at) ou pelo teto desde o login, o que vier primeiro."""
    return now < min(_utc(row.expires_at), _utc(row.absolute_expires_at))


def renewed_expiry(row: UserSession, now: datetime) -> datetime | None:
    """Novo término por inatividade, ou None quando o ganho seria menor que 1 hora.

    Limita a uma escrita por sessão por hora e, perto do teto, não regrava o mesmo valor.
    """
    target = min(now + SESSION_IDLE, _utc(row.absolute_expires_at))
    return target if target - _utc(row.expires_at) >= SESSION_RENEW_AFTER else None


def set_session_cookie(response: Response, raw_token: str, max_age: int) -> None:
    response.set_cookie(
        SESSION_COOKIE, raw_token, max_age=max_age,
        secure=os.environ.get("APP_ENV") in {"stage", "production"}, httponly=True,
        samesite="lax", path="/api",
    )


def remember_renewal(request: Request, raw_token: str, expires_at: datetime, now: datetime) -> None:
    request.state.session_renewal = (raw_token, int((expires_at - now).total_seconds()))


async def renewed_session_cookie(
    request: Request, call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    """Reenvia o cookie renovado em qualquer resposta, inclusive erro ou Response próprio da rota.

    O Response injetado numa dependência só é mesclado quando a rota devolve um modelo; a
    renovação já está gravada no banco e o cookie não pode ficar com o término antigo.
    """
    response = await call_next(request)
    renewal = getattr(request.state, "session_renewal", None)
    if renewal is not None:
        set_session_cookie(response, *renewal)
    return response


def purge_expired_sessions(session: Session, now: datetime) -> int:
    """Apaga as sessões terminadas (inatividade, teto ou prazo antigo); quem chama confirma."""
    result = session.execute(
        delete(UserSession).where(or_(UserSession.expires_at <= now, UserSession.absolute_expires_at <= now)),
    )
    return result.rowcount
