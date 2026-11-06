import hashlib
import os
import secrets
from datetime import UTC, datetime, timedelta
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.accounts import EMAIL_MAX_CHARS, PASSWORD_MAX_CHARS, normalize_email
from app.auth.security import verify_password
from app.db import get_session
from app.errors import ApiError
from app.products.models import User, UserSession

router = APIRouter(prefix="/api/auth", tags=["auth"])
SESSION_COOKIE = "bestprice_session"
SESSION_LIFETIME_SECONDS = 86400
SessionDep = Annotated[Session, Depends(get_session)]


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str
    password: str


class UserResponse(BaseModel):
    id: UUID
    email: str


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
