"""HTTPS callback for provisioning the single operator OAuth credential."""

import logging
import os
from urllib.parse import urlsplit

from fastapi import APIRouter, Request
from fastapi.responses import PlainTextResponse, RedirectResponse

from app.auth.routes import SessionDep
from app.marketplace.client import IntegrationError
from app.marketplace.oauth_setup import (
    CALLBACK_PATH,
    authorization_state_failure,
    exchange_authorization_code,
)

router = APIRouter(prefix="/api/marketplace/oauth", tags=["marketplace-oauth"])
COMPLETION_PATH = "/api/marketplace/oauth/complete"
LOGGER = logging.getLogger(__name__)
SAFE_OAUTH_ERROR_CODES = frozenset({
    "integration_not_configured",
    "integration_unavailable",
    "integration_rate_limited",
    "integration_auth_required",
    "integration_invalid_response",
})


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


def _log_exchange_failure(exc: Exception) -> None:
    if isinstance(exc, IntegrationError):
        category = exc.code if exc.code in SAFE_OAUTH_ERROR_CODES else "integration_unknown_error"
    else:
        category = "unexpected_error"
    LOGGER.warning("Mercado Livre OAuth callback failed: %s", category)


def _log_state_failure(category: str, code_present: bool, error_present: bool) -> None:
    if category == "state_missing":
        LOGGER.warning(
            "Mercado Livre OAuth callback failed: state_missing code_present=%s error_present=%s",
            code_present, error_present,
        )
    else:
        LOGGER.warning("Mercado Livre OAuth callback failed: %s", category)


def _callback_state_failure(states: list[str], key: bytes, redirect_uri: str) -> str | None:
    if len(states) > 1:
        return "state_invalid_format"
    state = states[0] if states else ""
    return authorization_state_failure(state, key, redirect_uri)


@router.get("/callback", include_in_schema=False)
def oauth_callback(request: Request, session: SessionDep) -> RedirectResponse:
    params = request.query_params
    codes = params.getlist("code")
    states = params.getlist("state")
    code = codes[0] if len(codes) == 1 else ""
    key = os.environ.get("MERCADOLIVRE_OAUTH_KEY", "").encode()
    redirect_uri = os.environ.get("MERCADOLIVRE_REDIRECT_URI", "")
    if not key or not redirect_uri:
        LOGGER.warning("Mercado Livre OAuth callback failed: integration_not_configured")
        return _redirect("failed")
    state_failure = _callback_state_failure(states, key, redirect_uri)
    if state_failure is not None:
        _log_state_failure(state_failure, bool(codes), bool(params.getlist("error")))
        return _redirect("failed")
    if params.get("error") or not code or len(code) > 2048:
        LOGGER.warning("Mercado Livre OAuth callback failed: authorization_response_invalid")
        return _redirect("failed")
    client_id = os.environ.get("MERCADOLIVRE_CLIENT_ID", "")
    client_secret = os.environ.get("MERCADOLIVRE_CLIENT_SECRET", "")
    try:
        exchange_authorization_code(session, key, client_id, client_secret, code, redirect_uri)
    except Exception as exc:  # noqa: BLE001 - callback never exposes provider or database details.
        session.rollback()
        _log_exchange_failure(exc)
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
