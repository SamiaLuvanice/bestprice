from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth.security import hash_password
from app.db import Base, get_session
from app.main import app
from app.marketplace.url import InvalidProductUrl, parse_product_url
from app.products.models import User
from app.products.routes import get_marketplace_client

SHORT_LINK_HINT = "copie o endereço completo"


@pytest.mark.parametrize(
    ("url", "code"),
    [
        ("https://www.mercadolivre.com.br/produto/p/MLB1234567890", "unsupported_url_format"),
        ("https://www.mercadolivre.com.br/produto/p/MLB1234567890?wid=MLB9999999999", "unsupported_url_format"),
        ("https://lista.mercadolivre.com.br/celular", "unsupported_url_format"),
        ("https://www.mercadolivre.com.br/ofertas", "unsupported_url_format"),
        ("https://meli.la/exemplo", "unsupported_url_format"),
        ("https://www.mercadolivre.com.br/sec/exemplo", "unsupported_url_format"),
        ("https://produto.mercadolivre.com.br/MLB-1234567890-titulo-MLB-9999999999-_JM", "ambiguous_item_id"),
        ("http://produto.mercadolivre.com.br/MLB-1234567890-titulo-_JM", "invalid_url"),
        ("https://produto.mercadolivre.com.br:8443/MLB-1234567890-titulo-_JM", "invalid_url"),
        ("https://mercadolivre.com.br.evil.example/MLB-1234567890-titulo-_JM", "invalid_url"),
        ("https://usuario@produto.mercadolivre.com.br/MLB-1234567890-titulo-_JM", "invalid_url"),
        ("https://203.0.113.10/MLB-1234567890-titulo-_JM", "invalid_url"),
        ("https://produto.mercadolivre.com.br./MLB-1234567890-titulo-_JM", "invalid_url"),
        ("https://produto.mercadolivre.com.br/MLB-%31%32%33-titulo-_JM", "invalid_url"),
        ("not a url", "invalid_url"),
    ],
)
def test_parser_reports_contract_code_for_each_rejected_entry(url: str, code: str) -> None:
    with pytest.raises(InvalidProductUrl) as failure:
        parse_product_url(url)

    assert failure.value.code == code


def test_parser_accepts_mixed_case_host_scheme_and_affixes() -> None:
    parsed = parse_product_url("HTTPS://Produto.MercadoLivre.COM.br/mlb-1234567890-Titulo-_jm")

    assert parsed.external_id == "MLB1234567890"


def test_catalog_identifier_never_becomes_listing() -> None:
    with pytest.raises(InvalidProductUrl) as failure:
        parse_product_url("https://www.mercadolivre.com.br/MLB1234567890")

    assert failure.value.code == "unsupported_url_format"


class ForbiddenSource:
    def get_listing(self, external_id: str):
        raise AssertionError("A fonte não deve ser consultada para URL rejeitada")


@pytest.mark.parametrize(
    ("url", "code", "hint"),
    [
        ("https://meli.la/exemplo", "unsupported_url_format", SHORT_LINK_HINT),
        ("https://www.mercadolivre.com.br/sec/exemplo", "unsupported_url_format", SHORT_LINK_HINT),
        ("https://www.mercadolivre.com.br/produto/p/MLB1234567890", "unsupported_url_format", "anúncio"),
        ("https://produto.mercadolivre.com.br/MLB-1234567890-titulo-MLB-9999999999-_JM", "ambiguous_item_id", "identificador"),
        ("https://example.com/item", "invalid_url", "Insira um link válido"),
    ],
)
def test_registration_returns_specific_url_error_without_calling_source(url: str, code: str, hint: str) -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)

    def isolated_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = isolated_session
    app.dependency_overrides[get_marketplace_client] = ForbiddenSource
    try:
        with Session(engine) as session:
            session.add(User(email="url@example.com", password_hash=hash_password("senha-validada-123")))
            session.commit()
        client = TestClient(app)
        assert client.post("/api/auth/login", json={"email": "url@example.com", "password": "senha-validada-123"}).status_code == 200
        response = client.post("/api/tracked-products", json={"url": url})
        assert response.status_code == 400
        error = response.json()["error"]
        assert error["code"] == code
        assert hint in error["message"]
        assert error["tracked_product_id"] is None
        assert error["retry_after_seconds"] is None
    finally:
        app.dependency_overrides.clear()
