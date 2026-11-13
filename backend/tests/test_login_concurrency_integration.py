"""B5 — AC11 (envios simultâneos) e AC12 (várias instâncias) contra PostgreSQL real."""

import os
import secrets
import threading
import uuid
from collections.abc import Iterator
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta

import pytest
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

from alembic import command
from app.auth.accounts import add_account
from app.auth.login_limiter import (
    LoginRateLimited,
    PostgresLoginLimiter,
    login_account_key,
    login_source_key,
)
from app.auth.models import LoginFailure
from app.auth.routes import get_clock, get_login_limiter
from app.auth.settings import LoginSettings, login_settings
from app.db import get_session
from app.main import app
from app.products.models import User, UserSession

NOW = datetime(2026, 11, 13, 12, 0, tzinfo=UTC)
PROXY_SECRET = "p" * 32
PASSWORD = "senha-correta-123"
PARALLEL = 20


@pytest.fixture(scope="module")
def test_url() -> str:
    url = os.environ.get("TEST_DATABASE_URL")
    if not url:
        pytest.skip("TEST_DATABASE_URL não configurada para integração PostgreSQL")
    previous = os.environ.get("DATABASE_URL")
    os.environ["DATABASE_URL"] = url
    try:
        command.upgrade(Config("alembic.ini"), "head")
    finally:
        if previous is None:
            os.environ.pop("DATABASE_URL", None)
        else:
            os.environ["DATABASE_URL"] = previous
    return url.replace("postgresql://", "postgresql+psycopg://", 1)


@pytest.fixture
def engine(test_url: str):
    # Pool maior que o número de envios: nenhum envio espera conexão, todos disputam o lock.
    engine = create_engine(test_url, pool_size=PARALLEL * 2 + 5, max_overflow=0)
    yield engine
    engine.dispose()


@pytest.fixture
def settings() -> LoginSettings:
    return LoginSettings(
        account_attempts=10, source_attempts=50, window=timedelta(minutes=15),
        trusted_proxy_secret=PROXY_SECRET, hash_secret=secrets.token_hex(32),
    )


@pytest.fixture
def client(engine, settings: LoginSettings) -> Iterator[TestClient]:
    def pg_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = pg_session
    app.dependency_overrides[login_settings] = lambda: settings
    app.dependency_overrides[get_clock] = lambda: (lambda: NOW)
    app.dependency_overrides[get_login_limiter] = PostgresLoginLimiter
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def new_account(engine) -> str:
    email = f"paralelo-{uuid.uuid4().hex}@exemplo.com"
    with Session(engine) as session:
        add_account(session, email, PASSWORD)
        session.commit()
    return email


def proxied(ip: str) -> dict[str, str]:
    return {"X-BestPrice-Client-IP": ip, "X-BestPrice-Proxy-Secret": PROXY_SECRET}


def source_of(ip: str, settings: LoginSettings) -> str:
    from starlette.requests import Request

    scope = {"type": "http", "headers": [(k.lower().encode(), v.encode()) for k, v in proxied(ip).items()]}
    return login_source_key(Request(scope), settings)


def failures(engine, source: str, account: str | None = None) -> int:
    query = select(func.count()).select_from(LoginFailure).where(LoginFailure.source_hash == source)
    if account is not None:
        query = query.where(LoginFailure.account_hash == account)
    with Session(engine) as session:
        return session.scalar(query)


def sessions_of(engine, email: str) -> int:
    with Session(engine) as session:
        user_id = session.scalar(select(User.id).where(User.email == email))
        return session.scalar(select(func.count()).select_from(UserSession).where(UserSession.user_id == user_id))


def parallel_logins(client: TestClient, email: str, password: str, ip: str) -> list:
    barrier = threading.Barrier(PARALLEL)

    def submit(_: int):
        barrier.wait(timeout=10)
        return client.post("/api/auth/login", json={"email": email, "password": password}, headers=proxied(ip))

    with ThreadPoolExecutor(max_workers=PARALLEL) as pool:
        return list(pool.map(submit, range(PARALLEL)))


def seed_failures(engine, source: str, account: str, count: int) -> None:
    with Session(engine) as session:
        session.add_all([
            LoginFailure(source_hash=source, account_hash=account, failed_at=NOW - timedelta(seconds=count - index))
            for index in range(count)
        ])
        session.commit()


def test_ac11_twenty_parallel_wrong_passwords_after_nine_failures_record_at_most_one(
    engine, client: TestClient, settings: LoginSettings,
) -> None:
    email, ip = new_account(engine), "203.0.113.111"
    source, account = source_of(ip, settings), login_account_key(email, settings.hash_secret)
    seed_failures(engine, source, account, 9)
    responses = parallel_logins(client, email, "senha-errada-1234", ip)
    statuses = sorted(response.status_code for response in responses)
    assert statuses == [401] + [429] * (PARALLEL - 1)
    assert failures(engine, source, account) == 10


def test_ac11_twenty_parallel_correct_passwords_after_ten_failures_open_no_session(
    engine, client: TestClient, settings: LoginSettings,
) -> None:
    email, ip = new_account(engine), "203.0.113.112"
    source, account = source_of(ip, settings), login_account_key(email, settings.hash_secret)
    seed_failures(engine, source, account, 10)
    responses = parallel_logins(client, email, PASSWORD, ip)
    assert [response.status_code for response in responses] == [429] * PARALLEL
    assert all("set-cookie" not in response.headers for response in responses)
    assert sessions_of(engine, email) == 0
    assert failures(engine, source, account) == 10


def test_ac12_failures_split_between_two_instances_share_the_limit(test_url: str, settings: LoginSettings) -> None:
    # Duas engines independentes no mesmo banco simulam duas instâncias da API.
    first, second = create_engine(test_url), create_engine(test_url)
    source, account = uuid.uuid4().hex * 2, login_account_key(f"{uuid.uuid4().hex}@x.com", settings.hash_secret)
    try:
        for index in range(10):
            instance = first if index % 2 == 0 else second
            with Session(instance) as session:
                PostgresLoginLimiter().reserve(session, source, account, NOW, settings)
        for instance in (first, second):
            with Session(instance) as session, pytest.raises(LoginRateLimited):
                PostgresLoginLimiter().reserve(session, source, account, NOW, settings)
    finally:
        first.dispose()
        second.dispose()


def test_reservation_waits_for_the_source_lock_held_by_another_transaction(engine, settings: LoginSettings) -> None:
    # Determinístico: enquanto outra transação segura o lock da origem, a reserva não lê nem grava.
    source, account = uuid.uuid4().hex * 2, uuid.uuid4().hex * 2
    finished = threading.Event()

    def reserve() -> None:
        with Session(engine) as session:
            PostgresLoginLimiter().reserve(session, source, account, NOW, settings)
        finished.set()

    with Session(engine) as holder:
        holder.execute(select(func.pg_advisory_xact_lock(func.hashtextextended("login:" + source, 0))))
        worker = threading.Thread(target=reserve)
        worker.start()
        assert not finished.wait(timeout=0.5), "a reserva não esperou o lock da origem"
        assert failures(engine, source) == 0
        holder.rollback()  # solta o lock
    worker.join(timeout=5)
    assert finished.is_set()
    assert failures(engine, source) == 1


def test_parallel_reservations_on_the_limiter_never_exceed_the_limit(engine, settings: LoginSettings) -> None:
    source, account = uuid.uuid4().hex * 2, uuid.uuid4().hex * 2
    seed_failures(engine, source, account, 9)
    barrier = threading.Barrier(PARALLEL)

    def reserve(_: int) -> str:
        with Session(engine) as session:
            session.execute(select(1))  # conexão já aberta: os envios chegam juntos ao lock
            barrier.wait(timeout=10)
            try:
                PostgresLoginLimiter().reserve(session, source, account, NOW, settings)
            except LoginRateLimited:
                return "refused"
            return "reserved"

    with ThreadPoolExecutor(max_workers=PARALLEL) as pool:
        results = sorted(pool.map(reserve, range(PARALLEL)))
    assert results == ["refused"] * (PARALLEL - 1) + ["reserved"]
    assert failures(engine, source, account) == 10


def test_correct_login_needs_a_single_pool_connection(test_url: str, settings: LoginSettings) -> None:
    # Regressão: o sucesso não pode pedir uma 2ª conexão enquanto a sessão da requisição segura
    # a 1ª. Com o pool cheio (logins corretos simultâneos), isso virava 500 e a reserva ficava
    # contando uma senha correta como falha. Pool de 1 conexão torna o cenário determinístico.
    engine = create_engine(test_url, pool_size=1, max_overflow=0, pool_timeout=1)
    email, ip = new_account(engine), "203.0.113.113"
    source, account = source_of(ip, settings), login_account_key(email, settings.hash_secret)

    def pg_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = pg_session
    app.dependency_overrides[login_settings] = lambda: settings
    app.dependency_overrides[get_clock] = lambda: (lambda: NOW)
    app.dependency_overrides[get_login_limiter] = PostgresLoginLimiter
    try:
        client = TestClient(app, raise_server_exceptions=False)
        wrong = client.post("/api/auth/login", json={"email": email, "password": "senha-errada-1234"},
                            headers=proxied(ip))
        assert wrong.status_code == 401
        accepted = client.post("/api/auth/login", json={"email": email, "password": PASSWORD}, headers=proxied(ip))
        assert accepted.status_code == 200, accepted.text
        assert accepted.cookies.get("bestprice_session")
        # O sucesso desfez a reserva e zerou a combinação; a falha anterior fica só na origem.
        assert failures(engine, source) == 1
        assert failures(engine, source, account) == 0
        assert sessions_of(engine, email) == 1
    finally:
        app.dependency_overrides.clear()
        engine.dispose()
