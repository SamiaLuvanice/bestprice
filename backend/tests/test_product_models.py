from decimal import Decimal

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import Base
from app.products.models import PriceHistory, Product


def test_listing_identity_is_unique_and_money_is_decimal() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        product = Product(
            external_id="MLB1234567890", title="Fone",
            canonical_url="https://produto.mercadolivre.com.br/MLB-1234567890-fone-_JM",
            currency="BRL", price_context="mlb_marketplace_unit",
            availability="available", lookup_status="located", last_attempt_status="ok",
        )
        session.add(product)
        session.flush()
        session.add(PriceHistory(product_id=product.id, price=Decimal("99.90"), currency="BRL"))
        session.commit()
        assert session.scalar(select(PriceHistory.price)) == Decimal("99.90")

    with Session(engine) as session:
        session.add(Product(
            external_id="MLB1234567890", title="Outro título",
            canonical_url="https://produto.mercadolivre.com.br/MLB-1234567890-outro-_JM",
            currency="BRL", price_context="mlb_marketplace_unit",
            availability="unknown", lookup_status="located", last_attempt_status="missing_price",
        ))
        with pytest.raises(IntegrityError):
            session.commit()
