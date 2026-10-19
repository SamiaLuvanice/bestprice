"""HTTPS callback for provisioning the single operator OAuth credential."""

import logging
import os
from urllib.parse import urlsplit

from fastapi import APIRouter, Request
from fastapi.responses import PlainTextResponse, RedirectResponse

from app.auth.routes import SessionDep
from app.marketplace.oauth_setup import (
    CALLBACK_PATH,
    exchange_authorization_code,
    verify_authorization_state,
)

router = APIRouter(prefix="/api/marketplace/oauth", tags=["marketplace-oauth"])
COMPLETION_PATH = "/api/marketplace/oauth/complete"


class OAuthCallbackAccessLogFilter(logging.Filter):
    """Redact the OAuth callback query from Uvicorn's request access log."""

    def filter(self, record: logging.LogRecord) -> bool:
        arguments = record.args
        if not isinstance(arguments, tuple) or len(arguments) < 3:
            return True
        request_target = arguments[2]
        if isinstance(request_target, str) and urlsplit(request_target).path == CALLBACK_PATH:
            sanitized = list(arguments)
            sanitized[2] = CALLBACK_PATH
            record.args = tuple(sanitized)
        return True


def _redirect(status: str) -> RedirectResponse:
    response = RedirectResponse(f"{COMPLETION_PATH}?status={status}", status_code=303)
    response.headers["Cache-Control"] = "no-store"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response


@router.get("/callback", include_in_schema=False)
def oauth_callback(request: Request, session: SessionDep) -> RedirectResponse:
    params = request.query_params
    codes = params.getlist("code")
    states = params.getlist("state")
    code = codes[0] if len(codes) == 1 else ""
    state = states[0] if len(states) == 1 else ""
    key = os.environ.get("MERCADOLIVRE_OAUTH_KEY", "").encode()
    redirect_uri = os.environ.get("MERCADOLIVRE_REDIRECT_URI", "")
    if not key or not verify_authorization_state(state, key, redirect_uri):
        return _redirect("failed")
    if params.get("error") or not code or len(code) > 2048:
        return _redirect("failed")
    client_id = os.environ.get("MERCADOLIVRE_CLIENT_ID", "")
    client_secret = os.environ.get("MERCADOLIVRE_CLIENT_SECRET", "")
    try:
        exchange_authorization_code(session, key, client_id, client_secret, code, redirect_uri)
    except Exception:  # noqa: BLE001 - callback never exposes provider or database details.
        session.rollback()
        return _redirect("failed")
    return _redirect("authorized")


@router.get("/complete", include_in_schema=False)
def oauth_complete(request: Request) -> PlainTextResponse:
    status = request.query_params.get("status")
    if status == "authorized":
        message = "Autorização do Mercado Livre concluída. Os tokens foram armazenados cifrados; você pode fechar esta página."
    else:
        message = "Não foi possível concluir a autorização. Verifique a configuração e inicie o fluxo novamente."
    return PlainTextResponse(message, headers={
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
    })


logging.getLogger("uvicorn.access").addFilter(OAuthCallbackAccessLogFilter())
