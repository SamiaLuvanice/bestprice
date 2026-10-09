from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth.provision import provision_user
from app.auth.security import verify_password
from app.db import Base
from app.products.models import User


def test_provision_user_normalizes_email_and_rejects_duplicate() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        provision_user(session, " Pessoa@Example.com ", "senha-validada-123")
        row = session.scalar(select(User))
        assert row.email == "pessoa@example.com"
        assert verify_password("senha-validada-123", row.password_hash)
        try:
            provision_user(session, "pessoa@example.com", "outra-senha-validada")
        except ValueError as error:
            assert str(error) == "Usuário já existe"
        else:
            raise AssertionError("Usuário duplicado aceito")
        assert len(session.scalars(select(User)).all()) == 1
