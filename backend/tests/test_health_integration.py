import os

import pytest
from fastapi.testclient import TestClient
from psycopg.conninfo import make_conninfo

from app.main import app


@pytest.fixture
def postgres_url() -> str:
    url = os.environ.get("TEST_DATABASE_URL")
    if not url:
        pytest.skip("TEST_DATABASE_URL não configurada para o teste de integração")
    return url


def test_health_checks_real_postgres(monkeypatch: pytest.MonkeyPatch, postgres_url: str) -> None:
    monkeypatch.setenv("DATABASE_URL", postgres_url)

    response = TestClient(app).get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_health_returns_503_for_real_connection_failure(
    monkeypatch: pytest.MonkeyPatch, postgres_url: str, caplog: pytest.LogCaptureFixture
) -> None:
    unavailable_url = make_conninfo(postgres_url, dbname="bestprice_health_missing_database")
    monkeypatch.setenv("DATABASE_URL", unavailable_url)

    response = TestClient(app).get("/api/health")

    assert response.status_code == 503
    assert response.json() == {"status": "unavailable", "database": "unavailable"}
    assert unavailable_url not in caplog.text
