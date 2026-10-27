"""Verify that the installed schema is private to direct Supabase API roles."""

import os

import pytest
from alembic.config import Config
from sqlalchemy import create_engine, text

from alembic import command

PUBLIC_TABLES = {
    "alembic_version",
    "products",
    "users",
    "price_history",
    "product_events",
    "tracked_products",
    "user_sessions",
    "notifications",
    "price_alerts",
    "operator_credentials",
    "research_conversations",
    "research_messages",
    "research_comparisons",
    "research_comparison_products",
    "research_ai_requests",
    "research_ai_usage",
}


def test_offline_migration_enables_rls_on_all_public_tables(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setenv("DATABASE_URL", "postgresql://unused:unused@localhost/unused")

    command.upgrade(Config("alembic.ini"), "head", sql=True)

    generated_sql = capsys.readouterr().out
    for table in PUBLIC_TABLES:
        assert f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;" in generated_sql
    assert "CREATE POLICY" not in generated_sql


def test_migration_enables_rls_without_direct_api_policies(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    test_url = os.environ.get("TEST_DATABASE_URL")
    if not test_url:
        pytest.skip("TEST_DATABASE_URL não configurada para integração PostgreSQL")

    monkeypatch.setenv("DATABASE_URL", test_url)
    command.upgrade(Config("alembic.ini"), "head")
    engine = create_engine(test_url.replace("postgresql://", "postgresql+psycopg://", 1))
    try:
        with engine.connect() as connection:
            rows = connection.execute(
                text(
                    "SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity "
                    "FROM pg_class AS c "
                    "JOIN pg_namespace AS n ON n.oid = c.relnamespace "
                    "WHERE n.nspname = 'public' AND c.relkind = 'r'"
                )
            ).all()
            table_security = {
                name: (rls_enabled, rls_forced)
                for name, rls_enabled, rls_forced in rows
            }
            policies = connection.execute(
                text(
                    "SELECT tablename FROM pg_policies "
                    "WHERE schemaname = 'public'"
                )
            ).scalars().all()
            # Alembic connects as the table owner, which must retain schema access.
            connection.execute(text("SELECT version_num FROM public.alembic_version")).all()
    finally:
        engine.dispose()

    assert table_security == {table: (True, False) for table in PUBLIC_TABLES}
    assert not PUBLIC_TABLES.intersection(policies)
