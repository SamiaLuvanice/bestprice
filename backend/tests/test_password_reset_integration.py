"""Spec 0059 — redefinição de senha pela operação com PostgreSQL real e a API de login."""

import os
import secrets
import uuid
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta

import pytest
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, func, select
from sqlalchemy.orm import Session

from alembic import command
from app.auth import reset_password as reset_module
from app.auth.accounts import add_account
from app.auth.reset_password import reset_password
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


def test_ac01_ac06_cli_reset_switches_the_password_and_ends_every_session(monkeypatch, engine, api, capsys) -> None:
    email, user_id = new_account(engine, tracked=True)
    other_email, _ = new_account(engine)
    browsers = []
    for _ in range(2):
        client, response = login(email, OLD)
        assert response.status_code == 200, response.text
        browsers.append(client)
    other_client, response = login(other_email, OLD)
    assert response.status_code == 200, response.text
    assert all(client.get("/api/auth/me").status_code == 200 for client in browsers)

    run_cli(monkeypatch, engine, f"  {email.upper()} ", NEW)
    assert capsys.readouterr().out.strip() == "Senha redefinida; sessões encerradas"

    for client in browsers:
        me = client.get("/api/auth/me")
        assert me.status_code == 401
        assert me.json()["error"]["code"] == "unauthenticated"
    assert other_client.get("/api/auth/me").status_code == 200

    _, refused = login(email, OLD)
    assert refused.status_code == 401
    assert refused.json()["error"]["code"] == "invalid_credentials"
    client, accepted = login(email, NEW)
    assert accepted.status_code == 200, accepted.text
    me = client.get("/api/auth/me")
    assert me.status_code == 200 and me.json()["email"] == email
    with Session(engine) as session:
        assert session.scalar(select(User.id).where(User.email == email)) == user_id
        tracked = session.scalars(select(TrackedProduct.active).where(TrackedProduct.user_id == user_id)).all()
        assert tracked == [True]


def test_ac08_database_failure_keeps_password_and_sessions_intact(engine, api) -> None:
    email, user_id = new_account(engine)
    for _ in range(2):
        assert login(email, OLD)[1].status_code == 200
    before = snapshot(engine, user_id)
    assert before[1] == 2

    with Session(engine) as session:
        statements: list[str] = []

        @event.listens_for(session, "after_flush")
        def fail_after_writes(_session, _context) -> None:
            # O DELETE das sessões e o UPDATE do hash já foram enviados ao PostgreSQL.
            statements.append("flush")
            raise RuntimeError("falha simulada do banco antes do commit")

        with pytest.raises(RuntimeError, match="falha simulada"):
            reset_password(session, email, NEW)
        assert statements == ["flush"]

    after = snapshot(engine, user_id)
    assert after == before
    assert verify_password(OLD, after[0])
    assert login(email, OLD)[1].status_code == 200
