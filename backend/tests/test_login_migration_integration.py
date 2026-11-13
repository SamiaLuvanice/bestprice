"""B2 — tabela login_failures: colunas, índices, RLS, upgrade e downgrade reais."""

import os

import pytest
from alembic.config import Config
from sqlalchemy import create_engine, inspect, text

from alembic import command

PREVIOUS_REVISION = "20261106signup"


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


def test_login_failures_table_stores_only_keyed_hashes_and_instants(engine) -> None:
    inspector = inspect(engine)
    columns = {column["name"]: column for column in inspector.get_columns("login_failures")}
    assert set(columns) == {"id", "source_hash", "account_hash", "failed_at"}
    assert str(columns["source_hash"]["type"]) == "CHAR(64)" and columns["source_hash"]["nullable"] is False
    assert str(columns["account_hash"]["type"]) == "CHAR(64)" and columns["account_hash"]["nullable"] is True
    assert columns["failed_at"]["type"].timezone is True and columns["failed_at"]["nullable"] is False
    assert columns["id"]["identity"]["always"] is True
    indexes = {index["name"]: index["column_names"] for index in inspector.get_indexes("login_failures")}
    assert indexes == {
        "ix_login_failures_source_hash_failed_at": ["source_hash", "failed_at"],
        "ix_login_failures_source_hash_account_hash_failed_at": ["source_hash", "account_hash", "failed_at"],
        "ix_login_failures_failed_at": ["failed_at"],
    }
    assert inspector.get_foreign_keys("login_failures") == []  # e-mails sem conta também contam
    with engine.connect() as connection:
        rls = connection.execute(text(
            "SELECT relrowsecurity FROM pg_class WHERE relname = 'login_failures'",
        )).scalar_one()
    assert rls is True


def test_downgrade_drops_only_login_failures_and_upgrade_restores_it(engine) -> None:
    config = Config("alembic.ini")
    command.downgrade(config, PREVIOUS_REVISION)
    inspector = inspect(engine)
    assert "login_failures" not in inspector.get_table_names()
    assert "signup_attempts" in inspector.get_table_names()
    command.upgrade(config, "head")
    assert "login_failures" in inspect(engine).get_table_names()
