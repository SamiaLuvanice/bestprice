import hashlib
import json
import os
import secrets
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import Annotated, Any, Protocol
from uuid import UUID

from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel, ConfigDict, ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.accounts import (
    EMAIL_MAX_CHARS,
    PASSWORD_MAX_CHARS,
    AccountRuleError,
    EmailAlreadyRegistered,
    add_account,
    normalize_email,
)
from app.auth.limiter import PostgresSignupLimiter, SignupRateLimited, signup_source_key
from app.auth.security import verify_password
from app.auth.settings import SignupSettings, signup_settings
from app.db import get_session
from app.errors import GENERIC_FIELD_MESSAGE, ApiError, validation_fields
from app.products.models import User, UserSession

router = APIRouter(prefix="/api/auth", tags=["auth"])
SESSION_COOKIE = "bestprice_session"
SESSION_LIFETIME_SECONDS = 86400
SessionDep = Annotated[Session, Depends(get_session)]


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str
    password: str


class SignupRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str
    password: str


class UserResponse(BaseModel):
    id: UUID
    email: str


class SignupStatus(BaseModel):
    enabled: bool


def current_user(request: Request, session: SessionDep) -> User:
    raw_token = request.cookies.get(SESSION_COOKIE)
    if not raw_token:
        raise ApiError(401, "unauthenticated", "Entre para continuar.")
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    row = session.scalar(select(UserSession).where(UserSession.token_hash == token_hash))
    if row is None:
        raise ApiError(401, "unauthenticated", "Entre para continuar.")
    expires_at = row.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    if expires_at <= datetime.now(UTC):
        raise ApiError(401, "unauthenticated", "Entre para continuar.")
    user = session.get(User, row.user_id)
    if user is None:
        raise ApiError(401, "unauthenticated", "Entre para continuar.")
    return user


CurrentUser = Annotated[User, Depends(current_user)]


def issue_session(session: Session, response: Response, user: User, now: datetime) -> None:
    """Grava a sessão, confirma a transação e emite o cookie privado (login e cadastro)."""
    raw_token = secrets.token_urlsafe(32)
    session.add(UserSession(
        user_id=user.id,
        token_hash=hashlib.sha256(raw_token.encode("utf-8")).hexdigest(),
        expires_at=now + timedelta(seconds=SESSION_LIFETIME_SECONDS),
    ))
    session.commit()
    response.set_cookie(
        SESSION_COOKIE, raw_token, max_age=SESSION_LIFETIME_SECONDS,
        secure=os.environ.get("APP_ENV") in {"stage", "production"}, httponly=True,
        samesite="lax", path="/api",
    )


@router.post("/login", response_model=UserResponse)
def login(payload: LoginRequest, response: Response, session: SessionDep) -> UserResponse:
    # O login não aplica o formato nome@domínio.tld: contas antigas continuam entrando.
    if len(payload.password) > PASSWORD_MAX_CHARS or len(payload.email) > EMAIL_MAX_CHARS:
        raise ApiError(401, "invalid_credentials", "E-mail ou senha inválidos.")
    user = session.scalar(select(User).where(User.email == normalize_email(payload.email)))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise ApiError(401, "invalid_credentials", "E-mail ou senha inválidos.")
    issue_session(session, response, user, datetime.now(UTC))
    return UserResponse(id=user.id, email=user.email)


@router.get("/me", response_model=UserResponse)
def me(user: CurrentUser) -> UserResponse:
    return UserResponse(id=user.id, email=user.email)


@router.post("/logout", status_code=204)
def logout(request: Request, response: Response, session: SessionDep) -> None:
    raw_token = request.cookies.get(SESSION_COOKIE)
    if raw_token:
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        row = session.scalar(select(UserSession).where(UserSession.token_hash == token_hash))
        if row is not None:
            session.delete(row)
            session.commit()
    response.delete_cookie(SESSION_COOKIE, path="/api")


Clock = Callable[[], datetime]


class SignupLimiter(Protocol):
    def check_and_record(self, session: Session, source_key: str, now: datetime, settings: SignupSettings) -> None: ...


def get_clock() -> Clock:
    return lambda: datetime.now(UTC)


def get_signup_limiter() -> SignupLimiter:
    return PostgresSignupLimiter()


SignupSettingsDep = Annotated[SignupSettings, Depends(signup_settings)]


def signup_source(request: Request, settings: SignupSettingsDep) -> str:
    return signup_source_key(request, settings)


async def raw_body(request: Request) -> bytes:
    # Lido como bytes para o limite contar antes da validação do JSON.
    return await request.body()


def _field(field: str, code: str, message: str) -> dict[str, str]:
    return {"field": field, "code": code, "message": message}


def _validation_error(fields: list[dict[str, str]]) -> ApiError:
    return ApiError(422, "validation_error", "Confira os dados informados.", fields=fields)


def parse_signup_body(content_type: str, body: bytes) -> SignupRequest:
    """Só aceita JSON: um formulário text/plain de outro site não pode criar conta (login CSRF)."""
    json_required = _validation_error([_field("body", "json_required", GENERIC_FIELD_MESSAGE)])
    if content_type.split(";", 1)[0].strip().lower() != "application/json":
        raise json_required
    try:
        data: Any = json.loads(body)
    except ValueError:
        raise json_required from None
    try:
        return SignupRequest.model_validate(data)
    except ValidationError as exc:
        raise _validation_error(validation_fields(exc.errors())) from None


EMAIL_TAKEN_MESSAGE = "Já existe uma conta com este e-mail."
SIGNUP_RESPONSES: dict[int | str, dict[str, Any]] = {
    404: {"description": "Cadastro indisponível (signup_unavailable)."},
    409: {"description": "E-mail já cadastrado (email_already_registered)."},
    422: {"description": "Dados inválidos (validation_error com fields)."},
    429: {"description": "Muitas tentativas (signup_rate_limited, Retry-After)."},
}
SIGNUP_OPENAPI = {"requestBody": {"required": True, "content": {
    "application/json": {"schema": SignupRequest.model_json_schema()},
}}}


@router.get("/signup", response_model=SignupStatus)
def signup_status(response: Response, settings: SignupSettingsDep) -> SignupStatus:
    response.headers["Cache-Control"] = "no-store"
    return SignupStatus(enabled=settings.enabled)


@router.post(
    "/signup", status_code=201, response_model=UserResponse,
    responses=SIGNUP_RESPONSES, openapi_extra=SIGNUP_OPENAPI,
)
def signup(
    request: Request,
    response: Response,
    session: SessionDep,
    settings: SignupSettingsDep,
    body: Annotated[bytes, Depends(raw_body)],
    source_key: Annotated[str, Depends(signup_source)],
    clock: Annotated[Clock, Depends(get_clock)],
    limiter: Annotated[SignupLimiter, Depends(get_signup_limiter)],
) -> UserResponse:
    # A ordem é contrato: interruptor, limite (registrado e confirmado), formato, regras, criação.
    if not settings.enabled:
        raise ApiError(404, "signup_unavailable", "Cadastro indisponível.")
    now = clock()
    with Session(session.get_bind()) as limiter_session:
        try:
            limiter.check_and_record(limiter_session, source_key, now, settings)
        except SignupRateLimited as limited:
            raise ApiError(
                429, "signup_rate_limited", "Muitas tentativas de cadastro. Tente novamente mais tarde.",
                retry_after_seconds=limited.retry_after_seconds,
            ) from None
    payload = parse_signup_body(request.headers.get("content-type", ""), body)
    try:
        user = add_account(session, payload.email, payload.password)
    except AccountRuleError as invalid:
        raise _validation_error([_field(v.field, v.code, v.message) for v in invalid.violations]) from None
    except EmailAlreadyRegistered:
        raise ApiError(
            409, "email_already_registered", EMAIL_TAKEN_MESSAGE,
            fields=[_field("email", "email_already_registered", EMAIL_TAKEN_MESSAGE)],
        ) from None
    issue_session(session, response, user, now)
    return UserResponse(id=user.id, email=user.email)
