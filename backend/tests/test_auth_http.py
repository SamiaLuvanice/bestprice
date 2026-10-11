from collections.abc import Iterator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth.security import hash_password
from app.db import Base, get_session
from app.main import app
from app.products.models import User


def test_login_uses_private_cookie_and_rejects_wrong_password() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)

    def isolated_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = isolated_session
    try:
        with Session(engine) as session:
            session.add(User(email="pessoa@example.com", password_hash=hash_password("senha-validada-123")))
            session.commit()
        client = TestClient(app)
        wrong = client.post("/api/auth/login", json={"email": "pessoa@example.com", "password": "errada"})
        assert wrong.status_code == 401
        assert "bestprice_session" not in wrong.cookies

        accepted = client.post("/api/auth/login", json={"email": "pessoa@example.com", "password": "senha-validada-123"})
        assert accepted.status_code == 200
        assert accepted.cookies.get("bestprice_session")
        assert "httponly" in accepted.headers["set-cookie"].lower()
        assert client.get("/api/auth/me").status_code == 200
    finally:
        app.dependency_overrides.clear()
