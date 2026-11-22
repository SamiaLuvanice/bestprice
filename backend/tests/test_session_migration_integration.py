"""B1 — AC08: teto absoluto das sessões com backfill a partir da criação; upgrade e downgrade reais."""

import os
import uuid
from datetime import UTC, datetime, timedelta

import pytest
from alembic.config import Config
from sqlalchemy import create_engine, inspect, text

from alembic import command

PREVIOUS_REVISION = "20261113loginfail"
CREATED = datetime(2026, 11, 20, 9, 30, tzinfo=UTC)


@pytest.fixture
def engine(monkeypatch: pytest.MonkeyPatch):
    test_url = os.environ.get("TEST_DATABASE_URL")
    if not test_url:
        pytest.skip("TEST_DATABASE_URL não configurada para integração PostgreSQL")
    monkeypatch.setenv("DATABASE_URL", test_url)
    command.upgrade(Config("alembic.ini"), "head")
    engine = create_engine(test_url.replace("postgresql://", "postgresql+psycopg://", 1))
    yield engine
    engine.dispose()
    command.upgrade(Config("alembic.ini"), "head")  # o banco de teste sempre volta ao head


def _columns(engine) -> dict[str, dict]:
    return {column["name"]: column for column in inspect(engine).get_columns("user_sessions")}


def test_absolute_expiry_is_a_required_utc_instant(engine) -> None:
    column = _columns(engine)["absolute_expires_at"]
    assert column["type"].timezone is True
    assert column["nullable"] is False


def test_upgrade_caps_existing_sessions_at_seven_days_from_creation(engine) -> None:
    config = Config("alembic.ini")
    command.downgrade(config, PREVIOUS_REVISION)
    assert "absolute_expires_at" not in _columns(engine)
    user_id, session_id = uuid.uuid4(), uuid.uuid4()
    old_expiry = CREATED + timedelta(hours=24)
    with engine.begin() as connection:
        connection.execute(
            text("INSERT INTO users (id, email, password_hash) VALUES (:id, :email, 'x')"),
            {"id": user_id, "email": f"migracao-{user_id.hex}@exemplo.com"},
        )
        connection.execute(
            text(
                "INSERT INTO user_sessions (id, user_id, token_hash, expires_at, created_at) "
                "VALUES (:id, :user_id, :token_hash, :expires_at, :created_at)",
            ),
            {
                "id": session_id, "user_id": user_id, "token_hash": uuid.uuid4().hex * 2,
                "expires_at": old_expiry, "created_at": CREATED,
            },
        )
    command.upgrade(config, "head")
    with engine.connect() as connection:
        expires_at, absolute_expires_at = connection.execute(
            text("SELECT expires_at, absolute_expires_at FROM user_sessions WHERE id = :id"), {"id": session_id},
        ).one()
    assert expires_at == old_expiry  # mantém o término que já tinha
    assert absolute_expires_at == CREATED + timedelta(days=7)


def test_insert_without_ceiling_from_an_old_instance_gets_seven_days(engine) -> None:
    # Implantação sem parada: a instância antiga ainda grava sessões sem a coluna nova.
    user_id = uuid.uuid4()
    with engine.begin() as connection:
        connection.execute(
            text("INSERT INTO users (id, email, password_hash) VALUES (:id, :email, 'x')"),
            {"id": user_id, "email": f"antiga-{user_id.hex}@exemplo.com"},
        )
        connection.execute(
            text(
                "INSERT INTO user_sessions (id, user_id, token_hash, expires_at) "
                "VALUES (:id, :user_id, :token_hash, now() + interval '24 hours')",
            ),
            {"id": uuid.uuid4(), "user_id": user_id, "token_hash": uuid.uuid4().hex * 2},
        )
        ceiling_offset = connection.execute(
            text("SELECT absolute_expires_at - now() FROM user_sessions WHERE user_id = :id"), {"id": user_id},
        ).scalar_one()
    assert ceiling_offset == timedelta(days=7)  # now() é o instante da transação
