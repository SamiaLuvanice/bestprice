import os
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID, uuid4

import pytest
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import Numeric, create_engine, delete, inspect, select, text
from sqlalchemy.orm import Session

from alembic import command
from app.auth.security import hash_password
from app.db import get_session
from app.errors import ApiError
from app.main import app
from app.products.models import User
from app.research import repository as repo
from app.research.models import (
    AIRequest,
    AIUsage,
    Comparison,
    ComparisonProduct,
    Conversation,
    Message,
)
from app.research.schemas import (
    AnalysisInput,
    ChatInput,
    ComparisonInput,
    ComparisonUpdate,
)
from app.research.service import (
    analyze_comparison,
    create_comparison,
    send_chat,
    update_comparison,
)


@pytest.fixture
def postgres_research(monkeypatch):
    test_url = os.environ.get("TEST_DATABASE_URL")
    if not test_url:
        pytest.skip("TEST_DATABASE_URL é obrigatória para a evidência PostgreSQL da spec0034")
    monkeypatch.setenv("DATABASE_URL", test_url)
    command.upgrade(Config("alembic.ini"), "head")
    engine = create_engine(test_url.replace("postgresql://", "postgresql+psycopg://", 1))
    owner_id = uuid4()
    with Session(engine) as session:
        session.execute(delete(AIUsage))
        session.add(User(id=owner_id, email=f"{owner_id}@example.com", password_hash=hash_password("senha-de-teste-0034")))
        session.commit()
    try:
        yield engine, owner_id
    finally:
        with Session(engine) as session:
            ids = list(session.scalars(select(Conversation.id).where(Conversation.user_id == owner_id)))
            session.execute(delete(Message).where(Message.conversation_id.in_(ids)))
            session.execute(delete(Conversation).where(Conversation.user_id == owner_id))
            session.execute(delete(Comparison).where(Comparison.user_id == owner_id))
            session.execute(delete(AIRequest).where(AIRequest.user_id == owner_id))
            # Authentication integration may have created a session for this disposable user.
            from app.products.models import UserSession

            session.execute(delete(UserSession).where(UserSession.user_id == owner_id))
            session.execute(delete(User).where(User.id == owner_id))
            session.execute(delete(AIUsage))
            session.commit()
        engine.dispose()


class Provider:
    def __init__(self, callback=None):
        self.calls = 0
        self.callback = callback

    def ensure_available(self):
        pass

    def generate(self, history):
        self.calls += 1
        if self.callback:
            self.callback()
        return "Dados fornecidos; preços não verificados."


def test_real_postgres_cookie_authentication_crud_and_rls(postgres_research) -> None:
    engine, owner_id = postgres_research

    def sessions():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = sessions
    try:
        client = TestClient(app)
        assert client.get("/api/research").status_code == 401
        login = client.post("/api/auth/login", json={"email": f"{owner_id}@example.com", "password": "senha-de-teste-0034"})
        assert login.status_code == 200
        payload = {"title": "Pesquisa PG", "use_case": "Estudar", "products": [
            {"name": name, "details": "", "price": None, "currency": "BRL", "url": None}
            for name in ("A", "B")
        ]}
        saved = client.post("/api/comparisons", json=payload)
        assert saved.status_code == 201
        resource_id = saved.json()["id"]
        assert client.get(f"/api/comparisons/{resource_id}").json() == saved.json()
        assert len(client.get("/api/research").json()["items"]) == 1
        assert client.delete(f"/api/comparisons/{resource_id}").status_code == 204
        assert client.get(f"/api/comparisons/{resource_id}").status_code == 404
    finally:
        app.dependency_overrides.clear()


def test_concurrent_same_request_generates_once_and_releases_transaction_before_http(postgres_research) -> None:
    engine, owner_id = postgres_research
    now = datetime(2026, 10, 26, 12, tzinfo=UTC)
    request = ChatInput(conversation_id=None, request_id=uuid4(), message="Notebook para estudar")
    started, release = threading.Event(), threading.Event()
    observations = []

    def first():
        with Session(engine) as session:
            def during_http():
                observations.append(session.in_transaction())
                started.set()
                assert release.wait(5)

            return send_chat(session, owner_id, request, Provider(during_http), lambda: now)

    with ThreadPoolExecutor(max_workers=2) as executor:
        future = executor.submit(first)
        assert started.wait(5)
        with Session(engine) as session:
            with pytest.raises(ApiError) as error:
                send_chat(session, owner_id, request, Provider(), lambda: now)
            assert error.value.code == "request_in_progress"
        release.set()
        result = future.result(timeout=10)
    assert observations == [False]
    replay_provider = Provider()
    with Session(engine) as session:
        replay = send_chat(session, owner_id, request, replay_provider, lambda: now)
        assert replay == result
        assert replay_provider.calls == 0
        assert len(repo.messages(session, UUID(result["conversation_id"]))) == 2
        assert all(row.count == 1 for row in session.scalars(select(AIUsage)))


def test_concurrent_quota_reservation_does_not_overrun_the_global_window(postgres_research) -> None:
    engine, owner_id = postgres_research
    now = datetime(2026, 10, 26, 12, tzinfo=UTC)
    global_key, expires_at, limit = repo.quota_windows(owner_id, now)[0]
    with Session(engine) as session:
        session.add(AIUsage(key=global_key, count=limit - 1, expires_at=expires_at))
        session.commit()
    barrier = threading.Barrier(2)

    def generate():
        barrier.wait(timeout=5)
        with Session(engine) as session:
            try:
                send_chat(session, owner_id, ChatInput(conversation_id=None, request_id=uuid4(), message="Comparar notebooks"), Provider(), lambda: now)
                return 200
            except ApiError as error:
                return error.status_code

    with ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(lambda _: generate(), range(2)))
    assert sorted(results) == [200, 429]
    with Session(engine) as session:
        assert session.get(AIUsage, global_key).count == limit


def test_deletion_while_provider_runs_prevents_postgres_commit_and_replay(postgres_research) -> None:
    engine, owner_id = postgres_research
    now = datetime(2026, 10, 26, 12, tzinfo=UTC)
    with Session(engine) as session:
        first = send_chat(session, owner_id, ChatInput(conversation_id=None, request_id=uuid4(), message="Uma compra"), Provider(), lambda: now)
    resource_id = UUID(first["conversation_id"])

    def remove():
        with Session(engine) as session:
            repo.delete_research(session, Conversation, resource_id, owner_id, now)
            session.commit()

    payload = ChatInput(conversation_id=resource_id, request_id=uuid4(), message="Outra dúvida")
    with Session(engine) as session:
        with pytest.raises(ApiError) as error:
            send_chat(session, owner_id, payload, Provider(remove), lambda: now)
        assert error.value.status_code == 404
    with Session(engine) as session:
        assert session.scalar(select(Conversation).where(Conversation.id == resource_id)) is None
        assert session.scalar(select(Message).where(Message.conversation_id == resource_id)) is None
        assert all(row.result is None for row in session.scalars(select(AIRequest).where(AIRequest.user_id == owner_id)))


def test_chat_captures_latest_context_after_waiting_to_reserve(postgres_research, monkeypatch) -> None:
    engine, owner_id = postgres_research
    now = datetime(2026, 10, 26, 12, tzinfo=UTC)
    with Session(engine) as session:
        first = send_chat(session, owner_id, ChatInput(conversation_id=None, request_id=uuid4(), message="Primeira pergunta"), Provider(), lambda: now)
    resource_id = UUID(first["conversation_id"])
    ready, release = threading.Event(), threading.Event()
    original_reservation_lock = repo.serialize_reservations
    captured_context = []
    transaction_during_generation = []

    def pause_before_lock(session):
        if threading.current_thread().name.startswith("context-a"):
            ready.set()
            assert release.wait(5)
        original_reservation_lock(session)

    class CapturingProvider(Provider):
        def generate(self, history):
            captured_context.extend(history)
            return super().generate(history)

    monkeypatch.setattr(repo, "serialize_reservations", pause_before_lock)

    def request_a():
        with Session(engine) as session:
            provider = CapturingProvider(lambda: transaction_during_generation.append(session.in_transaction()))
            return send_chat(session, owner_id, ChatInput(conversation_id=resource_id, request_id=uuid4(), message="Pergunta A"), provider, lambda: now)

    with ThreadPoolExecutor(max_workers=1, thread_name_prefix="context-a") as executor:
        future_a = executor.submit(request_a)
        assert ready.wait(5)
        with Session(engine) as session:
            send_chat(session, owner_id, ChatInput(conversation_id=resource_id, request_id=uuid4(), message="Pergunta B"), Provider(), lambda: now)
        release.set()
        future_a.result(timeout=10)
    assert [entry["content"] for entry in captured_context if entry["role"] == "user"] == [
        "Primeira pergunta", "Pergunta B", "Pergunta A",
    ]
    assert transaction_during_generation == [False]


def test_original_comparison_prices_persist_as_numeric_and_keep_http_strings(postgres_research) -> None:
    from app.research.serialization import comparison_output

    engine, owner_id = postgres_research
    schema = inspect(engine)
    assert "research_comparison_products" in schema.get_table_names()
    price_column = next(column for column in schema.get_columns("research_comparison_products") if column["name"] == "price")
    assert isinstance(price_column["type"], Numeric)
    assert price_column["type"].precision == 18
    assert price_column["type"].scale == 2
    assert "products" not in {column["name"] for column in schema.get_columns("research_comparisons")}
    payload = ComparisonInput.model_validate({
        "title": "Preços exatos", "use_case": "Estudar", "products": [
            {"name": "A", "details": "", "price": "1899.90", "currency": "BRL", "url": None},
            {"name": "B", "details": "", "price": None, "currency": "BRL", "url": None},
        ],
    })
    now = datetime(2026, 10, 27, 12, tzinfo=UTC)
    with Session(engine) as session:
        resource = create_comparison(session, owner_id, payload, now)
        rows = session.execute(text(
            "SELECT position, price FROM research_comparison_products "
            "WHERE comparison_id = :id ORDER BY position"
        ), {"id": resource.id}).all()
        assert rows == [(0, Decimal("1899.90")), (1, None)]
        assert [product["price"] for product in comparison_output(resource)["products"]] == ["1899.90", None]
        resource_id = resource.id
        contexts, transaction_states = [], []

        class NumericProvider(Provider):
            def generate(self, history):
                contexts.append(history[0]["content"])
                transaction_states.append(session.in_transaction())
                return super().generate(history)

        result = analyze_comparison(session, owner_id, resource_id, AnalysisInput(request_id=uuid4(), version=1), NumericProvider(), lambda: now)
        assert [product["price"] for product in result["products"]] == ["1899.90", None]
        assert '"price": "1899.90"' in contexts[0]
        assert '"price": null' in contexts[0]
        assert transaction_states == [False]


def product_payload(name: str, price: str | None) -> dict:
    return {"name": name, "details": "Informação fornecida", "price": price, "currency": "BRL", "url": None}


def test_replacing_and_reordering_numeric_products_preserves_order_and_purges_children(postgres_research) -> None:
    from app.research.serialization import comparison_output

    engine, owner_id = postgres_research
    now = datetime(2026, 10, 27, 12, tzinfo=UTC)
    payload = {"title": "Opções", "use_case": "Estudar", "products": [
        product_payload("A", "1899.90"), product_payload("B", None), product_payload("C", "999.99"),
    ]}
    with Session(engine) as session:
        resource = create_comparison(session, owner_id, ComparisonInput.model_validate(payload), now)
        resource_id = resource.id
        original_expiry = resource.expires_at
        updated = update_comparison(session, owner_id, resource.id, ComparisonUpdate.model_validate({
            **payload, "version": 1, "products": [product_payload("B", None), product_payload("A", "1899.90")],
        }), now)
        assert updated.version == 2
        assert updated.expires_at == original_expiry
        rows = list(session.scalars(select(ComparisonProduct).where(
            ComparisonProduct.comparison_id == resource.id,
        ).order_by(ComparisonProduct.position)))
        assert [(row.position, row.name, row.price) for row in rows] == [(0, "B", None), (1, "A", Decimal("1899.90"))]
        assert [product["price"] for product in comparison_output(updated)["products"]] == [None, "1899.90"]
        updated.expires_at = now
        session.commit()
        assert repo.purge_expired(session, now) == 1
        session.commit()
        assert session.scalar(select(ComparisonProduct).where(ComparisonProduct.comparison_id == resource_id)) is None


def test_postgres_fk_cascades_comparison_product_deletion(postgres_research) -> None:
    engine, owner_id = postgres_research
    now = datetime(2026, 10, 27, 12, tzinfo=UTC)
    payload = ComparisonInput.model_validate({"title": "Excluir", "use_case": "", "products": [
        product_payload("A", "1899.90"), product_payload("B", None),
    ]})
    with Session(engine) as session:
        resource = create_comparison(session, owner_id, payload, now)
        resource_id = resource.id
        session.execute(delete(Comparison).where(Comparison.id == resource_id))
        session.commit()
        assert session.scalar(select(ComparisonProduct).where(ComparisonProduct.comparison_id == resource_id)) is None
