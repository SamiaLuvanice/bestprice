from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.db import Base, get_session
from app.main import app
from app.products.models import User
from app.research import models  # noqa: F401
from app.research.models import AIRequest, AIUsage, Comparison, Conversation, Message
from app.research.provider import get_provider
from app.research.routes import research_user
from app.research.service import get_clock


class FakeProvider:
    def __init__(self):
        self.calls = []
        self.action = None

    def ensure_available(self):
        pass

    def generate(self, history):
        self.calls.append(history)
        if self.action:
            self.action()
        return "Compare os dados fornecidos; preço e estoque não foram verificados."


@pytest.fixture
def research_clock():
    return [datetime(2026, 10, 26, 12, tzinfo=UTC)]


@pytest.fixture
def fake_provider():
    return FakeProvider()


@pytest.fixture
def research_client(research_clock, fake_provider):
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    owner_id = uuid4()
    with Session(engine) as session:
        session.add(User(id=owner_id, email="research@example.com", password_hash="unused"))
        session.commit()

    def sessions():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = sessions
    app.dependency_overrides[research_user] = lambda: User(
        id=owner_id, email="research@example.com", password_hash="unused",
    )
    app.dependency_overrides[get_clock] = lambda: lambda: research_clock[0]
    app.dependency_overrides[get_provider] = lambda: fake_provider
    try:
        yield TestClient(app), owner_id, engine
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def comparison_payload():
    return {
        "title": "Notebooks para estudar", "use_case": "Estudar",
        "products": [
            {"name": "Opção A", "details": "8 GB de memória", "price": None, "currency": "BRL", "url": None},
            {"name": "Opção B", "details": "16 GB de memória", "price": "2000.00", "currency": "BRL", "url": None},
        ],
    }


def test_saves_a_comparison_without_requiring_ai_configuration(research_client, monkeypatch) -> None:
    monkeypatch.delenv("AI_ENABLED", raising=False)
    client, _, _ = research_client
    response = client.post("/api/comparisons", json=comparison_payload())
    assert response.status_code == 201
    body = response.json()
    assert body["products"][0]["price"] is None
    assert body["analysis"] is None
    assert body["version"] == 1
    assert client.get(f"/api/comparisons/{body['id']}").json() == body


def test_capabilities_are_authenticated_and_disabled_without_configuration(monkeypatch) -> None:
    monkeypatch.delenv("AI_ENABLED", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    app.dependency_overrides[research_user] = lambda: User(
        id=uuid4(), email="research@example.com", password_hash="unused",
    )
    try:
        response = TestClient(app).get("/api/ai/capabilities")
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json() == {
        "enabled": False,
        "provider": "google",
        "model": "gemini-3.5-flash-lite",
        "retention_days": 90,
        "max_message_chars": 2000,
        "user_daily_limit": 20,
    }


def chat_payload(conversation_id=None, request_id=None, message="Um notebook para estudar"):
    return {"conversation_id": conversation_id, "request_id": str(request_id or uuid4()), "message": message}


def test_chat_persists_context_and_replays_without_another_generation(research_client, fake_provider) -> None:
    client, _, _ = research_client
    payload = chat_payload()
    first = client.post("/api/ai/chat", json=payload)
    assert first.status_code == 200
    assert client.post("/api/ai/chat", json=payload).json() == first.json()
    assert len(fake_provider.calls) == 1
    conversation_id = first.json()["conversation_id"]
    second = client.post("/api/ai/chat", json=chat_payload(conversation_id, message="Prefiro boa bateria"))
    assert second.status_code == 200
    assert len(fake_provider.calls[-1]) == 3
    detail = client.get(f"/api/ai/conversations/{conversation_id}").json()
    assert [entry["role"] for entry in detail["messages"]] == ["user", "assistant", "user", "assistant"]
    assert len(client.get("/api/research").json()["items"]) == 1
    changed = client.post("/api/ai/chat", json={**payload, "message": "Outro pedido"})
    assert changed.status_code == 409


def test_initial_generation_failure_leaves_no_empty_conversation(research_client, fake_provider) -> None:
    from app.errors import ApiError

    client, _, engine = research_client
    fake_provider.action = lambda: (_ for _ in ()).throw(ApiError(504, "ai_timeout", "Tente novamente."))
    payload = chat_payload()
    assert client.post("/api/ai/chat", json=payload).status_code == 504
    assert client.post("/api/ai/chat", json=payload).status_code == 504
    assert len(fake_provider.calls) == 1
    assert client.get("/api/research").json()["items"] == []
    with Session(engine) as session:
        assert session.scalar(select(Conversation)) is None
        assert session.scalar(select(Message)) is None
        assert all(row.count == 1 for row in session.scalars(select(AIUsage)))


def test_delete_prevents_replay_and_does_not_refund_quota(research_client, fake_provider) -> None:
    client, _, engine = research_client
    payload = chat_payload()
    body = client.post("/api/ai/chat", json=payload).json()
    assert client.delete(f"/api/ai/conversations/{body['conversation_id']}").status_code == 204
    assert client.post("/api/ai/chat", json=payload).status_code == 404
    assert len(fake_provider.calls) == 1
    with Session(engine) as session:
        assert session.scalar(select(AIRequest)).result is None
        assert session.scalar(select(Message)) is None
        assert all(row.count == 1 for row in session.scalars(select(AIUsage)))
    for _ in range(2):
        assert client.post("/api/ai/chat", json=chat_payload()).status_code == 200
    limited = client.post("/api/ai/chat", json=chat_payload())
    assert limited.status_code == 429
    assert limited.headers["retry-after"]


def test_research_expiration_is_fixed_at_creation_and_hidden(research_client, research_clock) -> None:
    client, _, _ = research_client
    body = client.post("/api/comparisons", json=comparison_payload()).json()
    created_at = datetime.fromisoformat(body["created_at"])
    expires_at = datetime.fromisoformat(body["expires_at"])
    assert expires_at - created_at == timedelta(days=90)
    research_clock[0] += timedelta(days=89)
    edited = client.put(f"/api/comparisons/{body['id']}", json={**comparison_payload(), "version": 1})
    assert edited.status_code == 200
    assert edited.json()["expires_at"] == body["expires_at"]
    research_clock[0] += timedelta(days=1)
    assert client.get(f"/api/comparisons/{body['id']}").status_code == 404
    assert client.get("/api/research").json()["items"] == []


def test_comparison_analysis_invalidates_after_edit_and_rejects_stale_versions(research_client) -> None:
    client, _, _ = research_client
    body = client.post("/api/comparisons", json=comparison_payload()).json()
    analysis_payload = {"request_id": str(uuid4()), "version": 1}
    analyzed = client.post(f"/api/comparisons/{body['id']}/analyze", json=analysis_payload)
    assert analyzed.status_code == 200
    assert analyzed.json()["analysis"]["version"] == 1
    edited = client.put(f"/api/comparisons/{body['id']}", json={**comparison_payload(), "version": 1})
    assert edited.json()["version"] == 2
    assert edited.json()["analysis"] is None
    assert client.post(f"/api/comparisons/{body['id']}/analyze", json=analysis_payload).status_code == 409
    assert client.put(f"/api/comparisons/{body['id']}", json={**comparison_payload(), "version": 1}).status_code == 409


def test_all_operations_hide_other_owners_research(research_client) -> None:
    client, _, _ = research_client
    comparison = client.post("/api/comparisons", json=comparison_payload()).json()
    conversation = client.post("/api/ai/chat", json=chat_payload()).json()
    app.dependency_overrides[research_user] = lambda: User(id=uuid4(), email="other@example.com", password_hash="unused")
    comparison_url = f"/api/comparisons/{comparison['id']}"
    conversation_url = f"/api/ai/conversations/{conversation['conversation_id']}"
    checks = [
        client.get(comparison_url), client.delete(comparison_url),
        client.put(comparison_url, json={**comparison_payload(), "version": 1}),
        client.post(comparison_url + "/analyze", json={"request_id": str(uuid4()), "version": 1}),
        client.get(conversation_url), client.delete(conversation_url),
        client.post("/api/ai/chat", json=chat_payload(conversation["conversation_id"])),
    ]
    assert all(result.status_code == 404 for result in checks)
    assert all(result.json()["error"]["code"] == "research_not_found" for result in checks)
    assert client.get("/api/research").json()["items"] == []


@pytest.mark.parametrize("products", [[], [0], [0, 0, 0, 0]])
def test_comparison_requires_two_or_three_products(research_client, products) -> None:
    client, _, _ = research_client
    payload = comparison_payload()
    payload["products"] = [payload["products"][0] for _ in products]
    assert client.post("/api/comparisons", json=payload).status_code == 422


@pytest.mark.parametrize("message", ["  ", "x" * 2001])
def test_invalid_messages_do_not_call_provider(research_client, fake_provider, message) -> None:
    client, _, _ = research_client
    assert client.post("/api/ai/chat", json=chat_payload(message=message)).status_code == 422
    assert not fake_provider.calls


def test_history_filters_searches_and_paginates(research_client) -> None:
    client, _, _ = research_client
    client.post("/api/comparisons", json=comparison_payload())
    client.post("/api/ai/chat", json=chat_payload(message="Pesquisar um celular"))
    first = client.get("/api/research?limit=1").json()
    assert len(first["items"]) == 1
    assert first["next_offset"] == 1
    last = client.get("/api/research?offset=1&limit=1").json()
    assert last["next_offset"] is None
    assert first["items"][0]["id"] != last["items"][0]["id"]
    found = client.get("/api/research?q=NOTEBOOK&kind=comparison").json()
    assert len(found["items"]) == 1
    assert found["items"][0]["kind"] == "comparison"
    assert client.get("/api/research?q=ausente").json()["items"] == []


def test_delete_during_generation_discards_result(research_client, fake_provider) -> None:
    from app.research.repository import delete_research

    client, owner_id, engine = research_client
    first = client.post("/api/ai/chat", json=chat_payload()).json()
    resource_id = UUID(first["conversation_id"])

    def remove():
        with Session(engine) as session:
            delete_research(session, Conversation, resource_id, owner_id, datetime(2026, 10, 26, 12, tzinfo=UTC))
            session.commit()

    fake_provider.action = remove
    payload = chat_payload(str(resource_id))
    response = client.post("/api/ai/chat", json=payload)
    assert response.status_code == 404
    assert client.post("/api/ai/chat", json=payload).status_code == 404
    with Session(engine) as session:
        assert session.scalar(select(Message)) is None
        assert all(row.result is None for row in session.scalars(select(AIRequest)))


def test_expiration_during_generation_discards_result(research_client, fake_provider, research_clock) -> None:
    client, _, _ = research_client
    first = client.post("/api/ai/chat", json=chat_payload()).json()
    fake_provider.action = lambda: research_clock.__setitem__(0, research_clock[0] + timedelta(days=90))
    assert client.post("/api/ai/chat", json=chat_payload(first["conversation_id"])).status_code == 404
    assert client.get("/api/research").json()["items"] == []


def test_comparison_edit_during_generation_discards_stale_result(research_client, fake_provider) -> None:
    client, _, engine = research_client
    first = client.post("/api/comparisons", json=comparison_payload()).json()

    def edit():
        with Session(engine) as session:
            resource = session.get(Comparison, UUID(first["id"]))
            resource.version = 2
            session.commit()

    fake_provider.action = edit
    result = client.post(f"/api/comparisons/{first['id']}/analyze", json={"request_id": str(uuid4()), "version": 1})
    assert result.status_code == 409
    assert client.get(f"/api/comparisons/{first['id']}").json()["analysis"] is None


def test_purge_physically_deletes_expired_content_and_preserves_current_quota(research_client, research_clock) -> None:
    from app.research.repository import purge_expired

    client, _, engine = research_client
    first = client.post("/api/ai/chat", json=chat_payload()).json()
    with Session(engine) as session:
        conversation = session.get(Conversation, UUID(first["conversation_id"]))
        conversation.expires_at = research_clock[0]
        session.commit()
        assert purge_expired(session, research_clock[0]) == 1
        session.commit()
        assert session.scalar(select(Conversation)) is None
        assert session.scalar(select(Message)) is None
        assert session.scalar(select(AIRequest)).result is None
        assert all(row.count == 1 for row in session.scalars(select(AIUsage)))


def test_saved_replay_does_not_require_provider_to_still_be_enabled(research_client, fake_provider) -> None:
    from app.errors import ApiError

    client, _, _ = research_client
    payload = chat_payload()
    first = client.post("/api/ai/chat", json=payload)
    fake_provider.ensure_available = lambda: (_ for _ in ()).throw(ApiError(503, "ai_unavailable", "Indisponível."))
    assert client.post("/api/ai/chat", json=payload).json() == first.json()


def test_authentication_is_required_for_research(research_client) -> None:
    client, _, _ = research_client
    app.dependency_overrides.pop(research_user)
    assert client.get("/api/research").status_code == 401
    assert client.post("/api/comparisons", json=comparison_payload()).status_code == 401


def test_disabled_ai_does_not_create_attempts_or_consume_quota(research_client, monkeypatch) -> None:
    client, _, engine = research_client
    monkeypatch.delenv("AI_ENABLED", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    app.dependency_overrides.pop(get_provider)
    response = client.post("/api/ai/chat", json=chat_payload())
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "ai_unavailable"
    with Session(engine) as session:
        assert session.scalar(select(AIRequest)) is None
        assert session.scalar(select(AIUsage)) is None
        assert session.scalar(select(Conversation)) is None


def test_database_write_failure_is_not_reported_as_saved(research_client, monkeypatch) -> None:
    from sqlalchemy.exc import OperationalError

    client, _, _ = research_client

    def unavailable(_session):
        raise OperationalError("private SQL", {}, Exception("private connection details"))

    monkeypatch.setattr(Session, "commit", unavailable)
    response = client.post("/api/comparisons", json=comparison_payload())
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "research_unavailable"
    assert "private" not in response.text


def test_stale_processing_attempt_does_not_generate_again(research_client, research_clock, fake_provider) -> None:
    from app.research.service import fingerprint

    client, owner_id, engine = research_client
    payload = chat_payload()
    with Session(engine) as session:
        session.add(AIRequest(
            user_id=owner_id, request_id=UUID(payload["request_id"]), kind="conversation", target_id=None,
            fingerprint=fingerprint("conversation", {"conversation_id": None, "message": payload["message"]}),
            state="processing", created_at=research_clock[0] - timedelta(seconds=90),
        ))
        session.commit()
    response = client.post("/api/ai/chat", json=payload)
    assert response.status_code == 504
    assert not fake_provider.calls


def test_reference_urls_and_money_are_validated_without_fetching(research_client) -> None:
    client, _, _ = research_client
    for field, value in (("price", "0.00"), ("price", "1,00"), ("price", "1.2"), ("url", "javascript:alert(1)")):
        payload = comparison_payload()
        payload["products"][0][field] = value
        assert client.post("/api/comparisons", json=payload).status_code == 422


def test_comparison_prompt_explicitly_requests_evidence_based_pros_cons_and_gaps(research_client, fake_provider) -> None:
    client, _, _ = research_client
    saved = client.post("/api/comparisons", json=comparison_payload()).json()
    response = client.post(f"/api/comparisons/{saved['id']}/analyze", json={"request_id": str(uuid4()), "version": 1})
    assert response.status_code == 200
    prompt = fake_provider.calls[0][0]["content"]
    for instruction in ("prós", "contras", "lacunas", "uso declarado", "insuficientes", "não escolha um vencedor"):
        assert instruction in prompt
    assert "8 GB de memória" in prompt
    assert "16 GB de memória" in prompt
    assert '"price": null' in prompt


def test_oversized_serialized_comparison_is_rejected_before_quota_or_provider(research_client, fake_provider) -> None:
    client, _, engine = research_client
    payload = comparison_payload()
    payload["use_case"] = '"' * 2000
    payload["products"] = [
        {"name": f"Produto {index}", "details": '"' * 2000, "price": None, "currency": "BRL", "url": "https://example.com/?" + '"' * 2000}
        for index in range(3)
    ]
    saved = client.post("/api/comparisons", json=payload)
    assert saved.status_code == 201
    response = client.post(f"/api/comparisons/{saved.json()['id']}/analyze", json={"request_id": str(uuid4()), "version": 1})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"
    assert not fake_provider.calls
    with Session(engine) as session:
        assert session.scalar(select(AIUsage)) is None
        assert session.scalar(select(AIRequest)) is None
