"""Spec 0059 — redefinição de senha pela operação (SQLite em memória)."""

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth.accounts import AccountRuleError, add_account
from app.auth.reset_password import AccountNotFound, reset_password
from app.auth.security import verify_password
from app.db import Base
from app.products.models import User, UserSession

OLD = "senha-antiga-123"
NEW = "senha-nova-validada-456"


@pytest.fixture
def engine():
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


def create_account(engine, email: str, sessions: int = 0) -> uuid.UUID:
    with Session(engine) as session:
        user = add_account(session, email, OLD)
        expires = datetime.now(UTC) + timedelta(days=1)
        for _ in range(sessions):
            session.add(UserSession(user_id=user.id, token_hash=uuid.uuid4().hex, expires_at=expires))
        session.commit()
        return user.id


def password_hash(engine, email: str) -> str:
    with Session(engine) as session:
        return session.scalar(select(User.password_hash).where(User.email == email))


def session_count(engine, user_id: uuid.UUID) -> int:
    with Session(engine) as session:
        return session.scalar(select(func.count()).select_from(UserSession).where(UserSession.user_id == user_id))


def test_ac01_new_password_replaces_the_old_one(engine) -> None:
    create_account(engine, "pessoa@exemplo.com")
    with Session(engine) as session:
        reset_password(session, "pessoa@exemplo.com", NEW)
    stored = password_hash(engine, "pessoa@exemplo.com")
    assert verify_password(NEW, stored)
    assert not verify_password(OLD, stored)


def test_ac02_email_is_normalized_like_the_login(engine) -> None:
    create_account(engine, "pessoa@exemplo.com")
    with Session(engine) as session:
        reset_password(session, "  Pessoa@EXEMPLO.com \t", NEW)
    assert verify_password(NEW, password_hash(engine, "pessoa@exemplo.com"))


def test_ac03_unknown_email_fails_without_creating_or_changing_anything(engine) -> None:
    create_account(engine, "pessoa@exemplo.com")
    original = password_hash(engine, "pessoa@exemplo.com")
    with Session(engine) as session, pytest.raises(AccountNotFound) as raised:
        reset_password(session, "outra@exemplo.com", NEW)
    assert str(raised.value) == "Nenhuma conta com este e-mail."
    with Session(engine) as session:
        assert session.scalars(select(User.email)).all() == ["pessoa@exemplo.com"]
    assert password_hash(engine, "pessoa@exemplo.com") == original


@pytest.mark.parametrize(("password", "code", "message"), [
    ("a" * 11, "password_too_short", "A senha precisa ter pelo menos 12 caracteres."),
    ("a" * 1025, "password_too_long", "A senha pode ter no máximo 1024 caracteres."),
], ids=["senha-11", "senha-1025"])
def test_ac04_signup_password_rules_apply_and_keep_the_password(engine, password, code, message) -> None:
    user_id = create_account(engine, "pessoa@exemplo.com", sessions=1)
    original = password_hash(engine, "pessoa@exemplo.com")
    with Session(engine) as session, pytest.raises(AccountRuleError) as raised:
        reset_password(session, "pessoa@exemplo.com", password)
    assert [v.code for v in raised.value.violations] == [code]
    assert str(raised.value) == message
    assert password_hash(engine, "pessoa@exemplo.com") == original
    assert session_count(engine, user_id) == 1


def test_ac04_limits_are_inclusive(engine) -> None:
    create_account(engine, "pessoa@exemplo.com")
    for password in ("b" * 12, "c" * 1024):
        with Session(engine) as session:
            reset_password(session, "pessoa@exemplo.com", password)
        assert verify_password(password, password_hash(engine, "pessoa@exemplo.com"))


def test_ac06_all_sessions_of_the_account_end_and_others_stay(engine) -> None:
    owner = create_account(engine, "pessoa@exemplo.com", sessions=2)
    other = create_account(engine, "outra@exemplo.com", sessions=1)
    with Session(engine) as session:
        reset_password(session, "pessoa@exemplo.com", NEW)
    assert session_count(engine, owner) == 0
    assert session_count(engine, other) == 1
