from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.health import database_available
from app.main import app


def test_health_returns_ok_when_database_is_available() -> None:
    app.dependency_overrides[database_available] = lambda: True
    try:
        response = TestClient(app).get("/api/health")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_health_returns_unavailable_when_database_fails() -> None:
    app.dependency_overrides[database_available] = lambda: False
    try:
        response = TestClient(app).get("/api/health")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 503
    assert response.json() == {"status": "unavailable", "database": "unavailable"}


def test_database_password_with_reserved_character_is_passed_as_argument(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("DB_HOST", "localhost")
    monkeypatch.setenv("DB_PORT", "5432")
    monkeypatch.setenv("DB_NAME", "bestprice")
    monkeypatch.setenv("DB_USER", "bestprice")
    monkeypatch.setenv("DB_PASSWORD", "secret@word")
    connection = MagicMock()
    connection.__enter__.return_value.cursor.return_value.__enter__.return_value.fetchone.return_value = (1,)

    with patch("app.health.psycopg.connect", return_value=connection) as connect:
        assert database_available()

    assert connect.call_args.kwargs["password"] == "secret@word"
    assert "conninfo" not in connect.call_args.kwargs
