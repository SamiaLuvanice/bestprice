from collections.abc import Iterator
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth.limiter import SignupRateLimited
from app.auth.routes import get_clock, get_signup_limiter
from app.auth.security import hash_password, verify_password
from app.auth.settings import SignupSettings, signup_settings
from app.db import Base, get_session
from app.main import app
from app.products.models import (
    Notification,
    PriceAlert,
    Product,
    TrackedProduct,
    User,
    UserSession,
)
from app.research.models import Conversation, Message

PASSWORD = "senha-do-cadastro-1"
GENERIC = "Valor inválido ou ausente."


@dataclass
class FakeSignupLimiter:
    """Dublê do limitador: mesma regra (recusa não conta), sem PostgreSQL."""

    attempts: int = 5
    retry_after_seconds: int = 1800
    recorded: list[tuple[str, datetime]] = field(default_factory=list)

    def check_and_record(self, _session: Session, source_key: str, now: datetime, _settings: SignupSettings) -> None:
        if sum(1 for key, _ in self.recorded if key == source_key) >= self.attempts:
            raise SignupRateLimited(self.retry_after_seconds)
        self.recorded.append((source_key, now))


@dataclass
class Harness:
    client: TestClient
    engine: object
    limiter: FakeSignupLimiter
    now: datetime

    def users(self) -> list[User]:
        with Session(self.engine) as session:
            return list(session.scalars(select(User)))

    def signup(self, email: str = " Ana@Exemplo.com ", password: str = PASSWORD, **kwargs):
        return self.client.post("/api/auth/signup", json={"email": email, "password": password}, **kwargs)


def build_harness(monkeypatch: pytest.MonkeyPatch, *, enabled: bool, app_env: str = "stage") -> Iterator[Harness]:
    monkeypatch.setenv("APP_ENV", app_env)
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    limiter = FakeSignupLimiter()
    now = datetime.now(UTC).replace(microsecond=0)
    config = SignupSettings(
        enabled=enabled, rate_limit_attempts=5, rate_limit_window=timedelta(minutes=60),
        trusted_proxy_secret="", source_hash_secret="h" * 32,
    )

    def isolated_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = isolated_session
    app.dependency_overrides[signup_settings] = lambda: config
    app.dependency_overrides[get_clock] = lambda: (lambda: now)
    app.dependency_overrides[get_signup_limiter] = lambda: limiter
    try:
        yield Harness(TestClient(app, base_url="https://testserver"), engine, limiter, now)
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


@pytest.fixture
def enabled(monkeypatch: pytest.MonkeyPatch) -> Iterator[Harness]:
    yield from build_harness(monkeypatch, enabled=True)


@pytest.fixture
def disabled(monkeypatch: pytest.MonkeyPatch) -> Iterator[Harness]:
    yield from build_harness(monkeypatch, enabled=False)


def error(response) -> dict:
    return response.json()["error"]


# AC14 — interruptor desligado


def test_disabled_signup_reports_unavailable_and_refuses_without_counting(disabled: Harness) -> None:
    status = disabled.client.get("/api/auth/signup")
    assert status.status_code == 200
    assert status.json() == {"enabled": False}
    assert status.headers["cache-control"] == "no-store"

    refused = disabled.signup()
    assert refused.status_code == 404
    assert error(refused) == {
        "code": "signup_unavailable", "message": "Cadastro indisponível.", "fields": [],
        "tracked_product_id": None, "retry_after_seconds": None,
    }
    assert "set-cookie" not in refused.headers
    assert disabled.users() == []
    assert disabled.limiter.recorded == []


def test_disabled_signup_refuses_even_malformed_body_without_counting(disabled: Harness) -> None:
    refused = disabled.client.post("/api/auth/signup", content=b"{", headers={"Content-Type": "application/json"})
    assert refused.status_code == 404
    assert disabled.limiter.recorded == []


# AC02, AC03, AC04 — sucesso


def test_enabled_signup_status_is_public_and_not_cached(enabled: Harness) -> None:
    status = enabled.client.get("/api/auth/signup")
    assert status.status_code == 200
    assert status.json() == {"enabled": True}
    assert status.headers["cache-control"] == "no-store"


def test_signup_creates_account_and_starts_the_same_session_as_login(enabled: Harness) -> None:
    created = enabled.signup()
    assert created.status_code == 201
    body = created.json()
    assert set(body) == {"id", "email"} and body["email"] == "ana@exemplo.com"
    cookie = created.headers["set-cookie"].lower()
    for attribute in ("bestprice_session=", "httponly", "samesite=lax", "path=/api", "max-age=86400", "secure"):
        assert attribute in cookie

    me = enabled.client.get("/api/auth/me")
    assert me.status_code == 200 and me.json() == body

    with Session(enabled.engine) as session:
        stored = session.scalar(select(UserSession))
        expires_at = stored.expires_at if stored.expires_at.tzinfo else stored.expires_at.replace(tzinfo=UTC)
        assert expires_at == enabled.now + timedelta(seconds=86400)

    assert enabled.client.post("/api/auth/logout").status_code == 204
    assert enabled.client.get("/api/auth/me").status_code == 401
    login = enabled.client.post("/api/auth/login", json={"email": "ana@exemplo.com", "password": PASSWORD})
    assert login.status_code == 200 and login.json() == body


def test_signup_cookie_is_not_secure_in_development(monkeypatch: pytest.MonkeyPatch) -> None:
    for harness in build_harness(monkeypatch, enabled=True, app_env="development"):
        created = harness.signup()
        assert created.status_code == 201
        assert "secure" not in created.headers["set-cookie"].lower()


def test_existing_session_cookie_is_replaced_by_the_new_account(enabled: Harness) -> None:
    first = enabled.signup("primeira@exemplo.com")
    old_token = first.cookies["bestprice_session"]
    second = enabled.signup("segunda@exemplo.com")
    assert second.status_code == 201
    assert second.cookies["bestprice_session"] != old_token
    assert enabled.client.get("/api/auth/me").json()["email"] == "segunda@exemplo.com"


# AC05, AC06 — validação


@pytest.mark.parametrize(("email", "password", "expected"), [
    ("", PASSWORD, [("email", "email_required", "Informe seu e-mail.")]),
    ("a@b", PASSWORD, [("email", "email_invalid", "Informe um e-mail válido, como nome@exemplo.com.")]),
    (" " * 315 + "a@b.co", PASSWORD, [("email", "email_too_long", "O e-mail pode ter no máximo 320 caracteres.")]),
    ("ana@exemplo.com", "a" * 11, [("password", "password_too_short", "A senha precisa ter pelo menos 12 caracteres.")]),
    ("ana@exemplo.com", "a" * 1025, [("password", "password_too_long", "A senha pode ter no máximo 1024 caracteres.")]),
    ("a@b", "curta", [
        ("email", "email_invalid", "Informe um e-mail válido, como nome@exemplo.com."),
        ("password", "password_too_short", "A senha precisa ter pelo menos 12 caracteres."),
    ]),
], ids=["email-vazio", "email-a@b", "email-321", "senha-11", "senha-1025", "dois-campos"])
def test_rule_violations_return_422_per_field(enabled: Harness, email, password, expected) -> None:
    refused = enabled.signup(email, password)
    assert refused.status_code == 422
    body = error(refused)
    assert (body["code"], body["message"]) == ("validation_error", "Confira os dados informados.")
    assert [(f["field"], f["code"], f["message"]) for f in body["fields"]] == expected
    assert "set-cookie" not in refused.headers
    assert enabled.users() == []


@pytest.mark.parametrize(("content", "content_type"), [
    (b'{"email": "ana@exemplo.com", "password": "senha-do-cadastro-1"}', "text/plain"),
    (b'{"email": "ana@exemplo.com", "password": "senha-do-cadastro-1"}', None),
    (b"email=ana%40exemplo.com&password=senha-do-cadastro-1", "application/x-www-form-urlencoded"),
    (b'{"email": "ana@exemplo.com", "password": ', "application/json"),
    (b"\xff\xfe", "application/json"),
], ids=["text-plain", "sem-content-type", "formulario", "json-malformado", "bytes-invalidos"])
def test_non_json_body_is_refused_with_json_required(enabled: Harness, content: bytes, content_type) -> None:
    headers = {"Content-Type": content_type} if content_type else {}
    refused = enabled.client.post("/api/auth/signup", content=content, headers=headers)
    assert refused.status_code == 422
    assert error(refused)["fields"] == [{"field": "body", "code": "json_required", "message": GENERIC}]
    assert "senha-do-cadastro-1" not in refused.text
    assert enabled.users() == []


def test_json_content_type_with_charset_is_accepted(enabled: Harness) -> None:
    created = enabled.client.post(
        "/api/auth/signup", content=b'{"email": "ana@exemplo.com", "password": "senha-do-cadastro-1"}',
        headers={"Content-Type": "application/json; charset=utf-8"},
    )
    assert created.status_code == 201


@pytest.mark.parametrize(("payload", "expected"), [
    ({"email": "ana@exemplo.com"}, [("password", "missing")]),
    ({"email": 1, "password": PASSWORD}, [("email", "string_type")]),
    ({"email": "ana@exemplo.com", "password": PASSWORD, "confirmation": PASSWORD}, [("confirmation", "extra_forbidden")]),
    (["ana@exemplo.com", PASSWORD], [("body", "model_type")]),
], ids=["sem-senha", "email-numero", "campo-extra", "lista"])
def test_wrong_shape_uses_pydantic_codes_without_echoing_input(enabled: Harness, payload, expected) -> None:
    refused = enabled.client.post("/api/auth/signup", json=payload)
    assert refused.status_code == 422
    fields = error(refused)["fields"]
    assert [(f["field"], f["code"]) for f in fields] == expected
    assert all(set(f) == {"field", "code", "message"} and f["message"] == GENERIC for f in fields)
    assert PASSWORD not in refused.text


# AC07 — e-mail já cadastrado


def test_duplicate_email_returns_409_without_session_or_password_change(enabled: Harness) -> None:
    with Session(enabled.engine) as session:
        session.add(User(email="ana@exemplo.com", password_hash=hash_password("senha-original-123")))
        session.commit()
    original = enabled.users()[0].password_hash

    refused = enabled.signup("ANA@exemplo.com")
    assert refused.status_code == 409
    message = "Já existe uma conta com este e-mail."
    assert error(refused) == {
        "code": "email_already_registered", "message": message,
        "fields": [{"field": "email", "code": "email_already_registered", "message": message}],
        "tracked_product_id": None, "retry_after_seconds": None,
    }
    assert "set-cookie" not in refused.headers
    users = enabled.users()
    assert [u.password_hash for u in users] == [original]
    assert verify_password("senha-original-123", users[0].password_hash)
    with Session(enabled.engine) as session:
        assert session.scalar(select(UserSession)) is None


# AC09 — limite


def test_every_submission_past_the_switch_counts_and_the_limit_returns_429(enabled: Harness) -> None:
    enabled.limiter.attempts = 4
    assert enabled.client.post("/api/auth/signup", content=b"{", headers={"Content-Type": "application/json"}).status_code == 422
    assert enabled.signup("a@b").status_code == 422
    assert enabled.signup().status_code == 201
    assert enabled.signup().status_code == 409
    assert len(enabled.limiter.recorded) == 4
    key = enabled.limiter.recorded[0][0]
    assert len(key) == 64 and all(k == key for k, _ in enabled.limiter.recorded)
    assert all(instant == enabled.now for _, instant in enabled.limiter.recorded)

    limited = enabled.signup("outra@exemplo.com")
    assert limited.status_code == 429
    assert limited.headers["retry-after"] == "1800"
    assert error(limited) == {
        "code": "signup_rate_limited",
        "message": "Muitas tentativas de cadastro. Tente novamente mais tarde.",
        "fields": [], "tracked_product_id": None, "retry_after_seconds": 1800,
    }
    assert "set-cookie" not in limited.headers
    assert [u.email for u in enabled.users()] == ["ana@exemplo.com"]
    assert len(enabled.limiter.recorded) == 4


def test_openapi_documents_the_signup_request_schema(enabled: Harness) -> None:
    operation = enabled.client.get("/openapi.json").json()["paths"]["/api/auth/signup"]["post"]
    schema = operation["requestBody"]["content"]["application/json"]["schema"]
    assert set(schema["properties"]) == {"email", "password"}
    assert set(operation["responses"]) >= {"201", "404", "409", "422", "429"}


# AC11 — isolamento


def seed_other_account(harness: Harness) -> dict[str, str]:
    now = harness.now
    with Session(harness.engine) as session:
        other = User(email="outra@exemplo.com", password_hash=hash_password("senha-da-outra-1"))
        product = Product(
            external_id="MLB1234567890", title="Produto da outra conta",
            canonical_url="https://produto.mercadolivre.com.br/MLB-1234567890-produto-_JM",
            current_price=Decimal("99.90"), currency="BRL", price_context="mlb_marketplace_unit",
            availability="available", lookup_status="ok", last_attempt_status="ok",
        )
        session.add_all([other, product])
        session.flush()
        tracked = TrackedProduct(user_id=other.id, product_id=product.id, active_since=now)
        session.add(tracked)
        session.flush()
        alert = PriceAlert(tracked_product_id=tracked.id, target_price=Decimal("80.00"))
        conversation = Conversation(
            user_id=other.id, title="Conversa da outra conta",
            created_at=now, updated_at=now, expires_at=now + timedelta(days=90),
        )
        session.add_all([alert, conversation])
        session.flush()
        session.add_all([
            Notification(
                user_id=other.id, tracked_product_id=tracked.id, alert_id=alert.id, revision=1, episode=1,
                type="target_reached", product_title=product.title, observed_price=Decimal("79.90"),
                target_price=Decimal("80.00"), currency="BRL", observed_at=now,
            ),
            Message(conversation_id=conversation.id, role="user", content="Pergunta da outra", position=0, created_at=now),
        ])
        session.commit()
        return {"tracking": str(tracked.id), "conversation": str(conversation.id)}


def own_data(client: TestClient) -> dict[str, object]:
    dashboard = client.get("/api/dashboard").json()
    return {
        "tracked": client.get("/api/tracked-products").json()["items"],
        "dashboard": dashboard["tracked_products"]["items"] + dashboard["opportunities"] + dashboard["recent_updates"],
        "notifications": client.get("/api/notifications").json()["items"],
        "research": client.get("/api/research").json()["items"],
    }


def test_new_account_sees_only_its_own_empty_data(enabled: Harness) -> None:
    other_ids = seed_other_account(enabled)

    other_client = TestClient(app, base_url="https://testserver")
    assert other_client.post(
        "/api/auth/login", json={"email": "outra@exemplo.com", "password": "senha-da-outra-1"},
    ).status_code == 200
    seen_by_other = own_data(other_client)
    assert all(seen_by_other[name] for name in ("tracked", "notifications", "research"))

    assert enabled.signup("nova@exemplo.com").status_code == 201
    assert own_data(enabled.client) == {"tracked": [], "dashboard": [], "notifications": [], "research": []}
    summary = enabled.client.get("/api/dashboard").json()["summary"]
    assert all(value in (0, None) for value in summary.values())
    for path in (
        f"/api/tracked-products/{other_ids['tracking']}",
        f"/api/tracked-products/{other_ids['tracking']}/alert",
        f"/api/ai/conversations/{other_ids['conversation']}",
    ):
        assert enabled.client.get(path).status_code == 404, path
