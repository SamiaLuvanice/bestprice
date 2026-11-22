"""Spec 0059 — redefinição de senha pela operação com PostgreSQL real e a API de login."""

import os
import secrets
import threading
import time
import uuid
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta

import pytest
from alembic.config import Config
from fastapi import Response
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, func, select, text
from sqlalchemy.orm import Session

from alembic import command
from app.auth import reset_password as reset_module
from app.auth.accounts import add_account
from app.auth.reset_password import reset_password
from app.auth.routes import LoginRequest, _authenticate, issue_session
from app.auth.security import verify_password
from app.auth.settings import LoginSettings, login_settings
from app.db import get_session
from app.main import app
from app.products.models import Product, TrackedProduct, User, UserSession

PROXY_SECRET = "p" * 32
OLD = "senha-antiga-correta-1"
NEW = "senha-nova-correta-22"


@pytest.fixture(scope="module")
def engine():
    test_url = os.environ.get("TEST_DATABASE_URL")
    if not test_url:
        pytest.skip("TEST_DATABASE_URL não configurada para integração PostgreSQL")
    previous = os.environ.get("DATABASE_URL")
    os.environ["DATABASE_URL"] = test_url
    try:
        command.upgrade(Config("alembic.ini"), "head")
    finally:
        if previous is None:
            os.environ.pop("DATABASE_URL", None)
        else:
            os.environ["DATABASE_URL"] = previous
    engine = create_engine(test_url.replace("postgresql://", "postgresql+psycopg://", 1))
    yield engine
    engine.dispose()


@pytest.fixture
def api(engine) -> Iterator[None]:
    def pg_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    config = LoginSettings(
        account_attempts=10, source_attempts=50, window=timedelta(minutes=15),
        trusted_proxy_secret=PROXY_SECRET, hash_secret=secrets.token_hex(32),
    )
    app.dependency_overrides[get_session] = pg_session
    app.dependency_overrides[login_settings] = lambda: config
    try:
        yield
    finally:
        app.dependency_overrides.pop(get_session, None)
        app.dependency_overrides.pop(login_settings, None)


def new_account(engine, tracked: bool = False) -> tuple[str, uuid.UUID]:
    email = f"redefinir-{uuid.uuid4().hex}@exemplo.com"
    with Session(engine) as session:
        user = add_account(session, email, OLD)
        if tracked:
            product = Product(
                external_id=f"MLB{secrets.randbelow(10**12)}", title="Anúncio monitorado",
                canonical_url="https://produto.mercadolivre.com.br/MLB-1", currency="BRL",
                price_context="mlb_marketplace_unit", availability="available",
                lookup_status="ok", last_attempt_status="ok",
            )
            session.add(product)
            session.flush()
            session.add(TrackedProduct(user_id=user.id, product_id=product.id, active_since=datetime.now(UTC)))
        session.commit()
        return email, user.id


def login(email: str, password: str):
    client = TestClient(app)
    headers = {"X-BestPrice-Client-IP": f"198.51.100.{secrets.randbelow(256)}", "X-BestPrice-Proxy-Secret": PROXY_SECRET}
    response = client.post("/api/auth/login", json={"email": email, "password": password}, headers=headers)
    return client, response


def run_cli(monkeypatch, engine, email: str, password: str) -> None:
    answers = iter([password, password])
    monkeypatch.setattr(reset_module.getpass, "getpass", lambda _prompt: next(answers))
    monkeypatch.setattr(reset_module, "create_database_engine", lambda: engine)
    monkeypatch.setattr("sys.argv", ["reset_password", email])
    reset_module.main()


def snapshot(engine, user_id: uuid.UUID) -> tuple[str, int]:
    with Session(engine) as session:
        password_hash = session.scalar(select(User.password_hash).where(User.id == user_id))
        sessions = session.scalar(select(func.count()).select_from(UserSession).where(UserSession.user_id == user_id))
        return password_hash, sessions


def signed_in(email: str) -> TestClient:
    client, response = login(email, OLD)
    assert response.status_code == 200, response.text
    assert client.get("/api/auth/me").status_code == 200
    return client


def error_code(response) -> tuple[int, str]:
    return response.status_code, response.json().get("error", {}).get("code")


def assert_account_data_kept(engine, email: str, user_id: uuid.UUID) -> None:
    with Session(engine) as session:
        assert session.scalar(select(User.id).where(User.email == email)) == user_id
        tracked = session.scalars(select(TrackedProduct.active).where(TrackedProduct.user_id == user_id)).all()
    assert tracked == [True]


def test_ac01_ac06_cli_reset_switches_the_password_and_ends_every_session(monkeypatch, engine, api, capsys) -> None:
    email, user_id = new_account(engine, tracked=True)
    other_email, _ = new_account(engine)
    browsers = [signed_in(email), signed_in(email)]
    other_browser = signed_in(other_email)

    run_cli(monkeypatch, engine, f"  {email.upper()} ", NEW)
    assert capsys.readouterr().out.strip() == "Senha redefinida; sessões encerradas"

    assert [error_code(client.get("/api/auth/me")) for client in browsers] == [(401, "unauthenticated")] * 2
    assert other_browser.get("/api/auth/me").status_code == 200
    assert error_code(login(email, OLD)[1]) == (401, "invalid_credentials")
    client, accepted = login(email, NEW)
    assert accepted.status_code == 200, accepted.text
    assert client.get("/api/auth/me").json()["email"] == email
    assert_account_data_kept(engine, email, user_id)


def test_ac08_database_failure_keeps_password_and_sessions_intact(engine, api) -> None:
    email, user_id = new_account(engine)
    for _ in range(2):
        assert login(email, OLD)[1].status_code == 200
    before = snapshot(engine, user_id)
    assert before[1] == 2

    with Session(engine) as session:
        inside: list[tuple[int, bool]] = []

        @event.listens_for(session, "after_flush")
        def fail_after_writes(flushed, _context) -> None:
            # Na própria transação: o DELETE e o UPDATE já foram enviados ao PostgreSQL.
            connection = flushed.connection()
            sessions = connection.scalar(
                select(func.count()).select_from(UserSession).where(UserSession.user_id == user_id),
            )
            stored = connection.scalar(select(User.password_hash).where(User.id == user_id))
            inside.append((sessions, verify_password(NEW, stored)))
            raise RuntimeError("falha simulada do banco antes do commit")

        with pytest.raises(RuntimeError, match="falha simulada"):
            reset_password(session, email, NEW)
        assert inside == [(0, True)]

    after = snapshot(engine, user_id)
    assert after == before
    assert verify_password(OLD, after[0])
    assert login(email, OLD)[1].status_code == 200



def lock_waiters(engine, fragment: str) -> int:
    """Conexões esperando trava de linha numa consulta que contém `fragment`."""
    with engine.connect() as connection:
        return connection.scalar(
            text(
                "SELECT count(*) FROM pg_stat_activity WHERE wait_event_type = 'Lock'"
                " AND datname = current_database() AND query LIKE :fragment"
            ),
            {"fragment": f"%{fragment}%"},
        )


def waits_on_lock(engine, fragment: str, thread: threading.Thread) -> bool:
    deadline = time.monotonic() + 5
    while time.monotonic() < deadline and thread.is_alive():
        if lock_waiters(engine, fragment):
            return True
        time.sleep(0.05)
    return False


def in_thread(target, errors: list[BaseException]) -> threading.Thread:
    def run() -> None:
        try:
            target()
        except BaseException as exc:  # noqa: BLE001 - repassado ao teste
            errors.append(exc)

    thread = threading.Thread(target=run)
    thread.start()
    return thread


def reset_in_new_session(engine, email: str) -> None:
    with Session(engine) as session:
        reset_password(session, email, NEW)


def test_race_login_in_progress_cannot_keep_a_session_after_the_reset(engine) -> None:
    """Login já leu a conta (scrypt em curso): o reset espera e apaga também a sessão criada."""
    email, user_id = new_account(engine)
    errors: list[BaseException] = []
    with Session(engine) as login_session:
        user = _authenticate(login_session, LoginRequest(email=email, password=OLD))
        assert user is not None
        reset = in_thread(lambda: reset_in_new_session(engine, email), errors)
        waited = waits_on_lock(engine, "FOR UPDATE", reset)
        issue_session(login_session, Response(), user, datetime.now(UTC))
    reset.join(timeout=10)
    assert errors == []
    assert waited, "o reset não esperou a trava do login em andamento"
    assert snapshot(engine, user_id)[1] == 0


def test_race_login_started_during_the_reset_reads_the_new_hash(engine) -> None:
    """Login que começa com o reset em curso espera o commit e confere a senha nova."""
    email, user_id = new_account(engine)
    held, release = threading.Event(), threading.Event()
    errors: list[BaseException] = []
    results: list[object] = []
    with Session(engine) as reset_session:

        @event.listens_for(reset_session, "after_flush")
        def hold_before_commit(_session, _context) -> None:
            held.set()
            release.wait(timeout=10)

        reset = in_thread(lambda: reset_password(reset_session, email, NEW), errors)
        assert held.wait(timeout=10)

        def attempt() -> None:
            with Session(engine) as login_session:
                results.append(_authenticate(login_session, LoginRequest(email=email, password=NEW)))

        login = in_thread(attempt, errors)
        waited = waits_on_lock(engine, "FOR SHARE", login)
        release.set()
        reset.join(timeout=10)
        login.join(timeout=10)
    assert errors == []
    assert waited, "o login não esperou a trava do reset em curso"
    assert [getattr(user, "id", None) for user in results] == [user_id]
