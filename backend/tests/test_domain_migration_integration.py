import os
import uuid
from decimal import Decimal

import pytest
from alembic.config import Config
from sqlalchemy import create_engine, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from alembic import command
from app.products.models import PriceHistory, Product


def test_migration_preserves_decimal_and_rejects_duplicate_listing(monkeypatch: pytest.MonkeyPatch) -> None:
    test_url = os.environ.get("TEST_DATABASE_URL")
    if not test_url:
        pytest.skip("TEST_DATABASE_URL não configurada para integração PostgreSQL")
    monkeypatch.setenv("DATABASE_URL", test_url)
    command.upgrade(Config("alembic.ini"), "head")
    engine = create_engine(test_url.replace("postgresql://", "postgresql+psycopg://", 1))
    external_id = f"MLB{uuid.uuid4().int % 10**15}"
    product = Product(
        external_id=external_id, title="Teste de banco",
        canonical_url="https://produto.mercadolivre.com.br/MLB-1234567890-teste-_JM",
        currency="BRL", price_context="mlb_marketplace_unit",
        availability="available", lookup_status="located", last_attempt_status="ok",
    )
    with Session(engine) as session:
        session.add(product)
        session.flush()
        session.add(PriceHistory(product_id=product.id, price=Decimal("129.90"), currency="BRL"))
        session.commit()
        assert session.scalar(select(PriceHistory.price).where(PriceHistory.product_id == product.id)) == Decimal("129.90")
    with Session(engine) as session:
        session.add(Product(
            external_id=external_id, title="Duplicado",
            canonical_url="https://produto.mercadolivre.com.br/MLB-1234567890-teste-_JM",
            currency="BRL", price_context="mlb_marketplace_unit",
            availability="available", lookup_status="located", last_attempt_status="ok",
        ))
        with pytest.raises(IntegrityError):
            session.commit()
    engine.dispose()
