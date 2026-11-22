"""Spec 0060 — duração da sessão: inatividade de 24 h, teto de 7 dias e renovação horária.

O relógio da sessão é injetado (AC09): `get_clock` devolve o instante controlado pelo teste,
sem esperar o relógio real. O instante inicial fica no futuro para que um relógio real
esquecido no código seja percebido (a sessão pareceria válida por anos).
"""

from collections.abc import Iterator
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, delete, select, update
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth.routes import get_clock
from app.auth.security import hash_password
from app.db import Base, get_session
from app.main import app
from app.products.models import User, UserSession

LOGIN_AT = datetime(2031, 3, 10, 8, 0, tzinfo=UTC)
EMAIL = "sessao@example.com"
LOGIN_PHRASE = "senha-validada-123"


@dataclass
class Clock:
    now: datetime = LOGIN_AT

    def at(self, elapsed: timedelta) -> None:
        self.now = LOGIN_AT + elapsed


@pytest.fixture
def clock() -> Clock:
    return Clock()


@pytest.fixture
def engine():
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def client(engine, clock: Clock, monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    monkeypatch.setenv("APP_ENV", "development")
    with Session(engine) as session:
        session.add(User(email=EMAIL, password_hash=hash_password(LOGIN_PHRASE)))
        session.commit()

    def isolated_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = isolated_session
    app.dependency_overrides[get_clock] = lambda: (lambda: clock.now)
    try:
        client = TestClient(app)
        assert client.post("/api/auth/login", json={"email": EMAIL, "password": LOGIN_PHRASE}).status_code == 200
        yield client
    finally:
        app.dependency_overrides.clear()


def me_at(client: TestClient, clock: Clock, elapsed: timedelta):
    clock.at(elapsed)
    return client.get("/api/auth/me")


def assert_unauthenticated(response) -> None:
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthenticated"


def test_ac02_session_unused_for_24_hours_is_rejected(client: TestClient, clock: Clock) -> None:
    assert me_at(client, clock, timedelta(hours=23, minutes=59)).status_code == 200
    assert_unauthenticated(me_at(client, clock, timedelta(days=2)))


def test_ac02_session_expires_exactly_24_hours_after_the_login_without_use(client: TestClient, clock: Clock) -> None:
    assert_unauthenticated(me_at(client, clock, timedelta(hours=24)))


def test_ac03_continuous_use_ends_seven_days_after_the_login(client: TestClient, clock: Clock) -> None:
    for hours in range(20, 161, 20):
        assert me_at(client, clock, timedelta(hours=hours)).status_code == 200, hours
    assert me_at(client, clock, timedelta(days=7, minutes=-1)).status_code == 200
    assert_unauthenticated(me_at(client, clock, timedelta(days=7)))


def test_ac03_ceiling_rejects_a_session_whose_idle_expiry_is_still_ahead(engine, client: TestClient, clock: Clock) -> None:
    # Sessão antiga (AC08): o expires_at ainda vale, mas o teto contado da criação já passou.
    with Session(engine) as session:
        session.execute(update(UserSession).values(absolute_expires_at=LOGIN_AT + timedelta(hours=2)))
        session.commit()
    assert me_at(client, clock, timedelta(hours=1, minutes=59)).status_code == 200
    assert_unauthenticated(me_at(client, clock, timedelta(hours=2)))


def session_cookie_header(response) -> str | None:
    cookies = [value for name, value in response.headers.multi_items() if name == "set-cookie"]
    matching = [value for value in cookies if value.startswith("bestprice_session=")]
    assert len(matching) <= 1
    return matching[0] if matching else None


def test_ac01_use_extends_the_session_beyond_the_first_24_hours(client: TestClient, clock: Clock) -> None:
    assert me_at(client, clock, timedelta(hours=20)).status_code == 200
    assert me_at(client, clock, timedelta(hours=43)).status_code == 200


def test_ac04_renewal_resends_the_cookie_with_the_new_expiry_and_same_attributes(
    client: TestClient, clock: Clock,
) -> None:
    renewed = me_at(client, clock, timedelta(hours=20))
    header = session_cookie_header(renewed)
    assert header is not None
    attributes = [part.strip().lower() for part in header.split(";")]
    assert header.split(";")[0] == f"bestprice_session={client.cookies['bestprice_session']}"  # sem rotação
    assert "max-age=86400" in attributes
    assert {"httponly", "path=/api", "samesite=lax"} <= set(attributes)
    assert "secure" not in attributes  # desenvolvimento local em http


def test_ac04_requests_within_the_same_hour_do_not_renew(client: TestClient, clock: Clock) -> None:
    assert session_cookie_header(me_at(client, clock, timedelta(minutes=59))) is None
    assert session_cookie_header(me_at(client, clock, timedelta(hours=1))) is not None
    assert session_cookie_header(me_at(client, clock, timedelta(hours=1, minutes=30))) is None
    # A renovação de 1 h valeu: 24 h sem uso contam a partir dela, não do login.
    assert me_at(client, clock, timedelta(hours=24, minutes=59)).status_code == 200


def test_ac04_renewed_cookie_never_outlives_the_ceiling(client: TestClient, clock: Clock) -> None:
    for hours in range(20, 141, 20):
        assert me_at(client, clock, timedelta(hours=hours)).status_code == 200
    # 140 h: término em 164 h. Às 150 h, 24 h a mais passariam do teto (168 h): vale 18 h.
    renewed = me_at(client, clock, timedelta(hours=150))
    assert renewed.status_code == 200
    assert "max-age=64800" in session_cookie_header(renewed).lower()


def test_ac04_renewal_cookie_is_sent_on_error_responses_too(client: TestClient, clock: Clock) -> None:
    clock.at(timedelta(hours=20))
    missing = client.get("/api/tracked-products/00000000-0000-0000-0000-000000000000")
    assert missing.status_code == 404
    assert "max-age=86400" in session_cookie_header(missing).lower()


def test_ac04_renewed_cookie_is_secure_in_stage(client: TestClient, clock: Clock, monkeypatch) -> None:
    monkeypatch.setenv("APP_ENV", "stage")
    header = session_cookie_header(me_at(client, clock, timedelta(hours=20)))
    assert "secure" in [part.strip().lower() for part in header.split(";")]


def test_ac05_logout_after_renewal_ends_the_session_immediately(client: TestClient, clock: Clock) -> None:
    assert session_cookie_header(me_at(client, clock, timedelta(hours=20))) is not None
    cookie = client.cookies["bestprice_session"]
    assert client.post("/api/auth/logout").status_code == 204
    client.cookies.set("bestprice_session", cookie, path="/api")
    assert_unauthenticated(me_at(client, clock, timedelta(hours=20, minutes=1)))


def test_session_ended_between_read_and_renewal_is_unauthenticated(engine, client: TestClient, clock: Clock, monkeypatch) -> None:
    from app.auth import routes

    original = routes.renewed_expiry

    def ended_meanwhile(row: UserSession, now: datetime) -> datetime | None:
        with Session(engine) as other:
            other.execute(delete(UserSession))
            other.commit()
        return original(row, now)

    monkeypatch.setattr(routes, "renewed_expiry", ended_meanwhile)
    clock.at(timedelta(hours=20))
    response = TestClient(app, raise_server_exceptions=False, cookies=client.cookies).get("/api/auth/me")
    assert_unauthenticated(response)
    assert session_cookie_header(response) is None


def test_ac04_renewal_cookie_reaches_a_route_that_returns_its_own_204_response(
    engine, client: TestClient, clock: Clock,
) -> None:
    # DELETE de pesquisa devolve Response(204) próprio: o caso que motivou o middleware.
    from app.research.models import Conversation
    from app.research.service import get_clock as research_clock

    with Session(engine) as session:
        owner = session.scalar(select(User.id).where(User.email == EMAIL))
        conversation = Conversation(
            user_id=owner, title="pesquisa", created_at=LOGIN_AT, updated_at=LOGIN_AT,
            expires_at=LOGIN_AT + timedelta(days=90),
        )
        session.add(conversation)
        session.commit()
        conversation_id = conversation.id
    app.dependency_overrides[research_clock] = lambda: (lambda: clock.now)
    clock.at(timedelta(hours=20))
    deleted = client.delete(f"/api/ai/conversations/{conversation_id}")
    assert deleted.status_code == 204
    assert "max-age=86400" in session_cookie_header(deleted).lower()
