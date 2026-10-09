import pytest

from app.marketplace.url import InvalidProductUrl, parse_product_url


@pytest.mark.parametrize(
    "url",
    [
        "https://produto.mercadolivre.com.br/MLB-1234567890-titulo-do-anuncio-_JM",
        "https://www.mercadolivre.com.br/MLB-1234567890-titulo-do-anuncio-_JM/",
        "https://produto.mercadolivre.com.br/MLB-1234567890-titulo-do-anuncio-_JM?tracking_id=x#position=1",
    ],
)
def test_product_url_identifies_listing_without_network(url: str) -> None:
    result = parse_product_url(url)

    assert result.external_id == "MLB1234567890"


@pytest.mark.parametrize(
    "url",
    [
        "https://www.mercadolivre.com.br/produto/p/MLB1234567890?wid=MLB9999999999",
        "https://meli.la/exemplo",
        "https://www.mercadolivre.com.br/sec/exemplo",
        "https://lista.mercadolivre.com.br/celular",
        "http://produto.mercadolivre.com.br/MLB-1234567890-titulo-_JM",
        "https://produto.mercadolivre.com.br:8443/MLB-1234567890-titulo-_JM",
        "https://mercadolivre.com.br.evil.example/MLB-1234567890-titulo-_JM",
        "https://usuario@produto.mercadolivre.com.br/MLB-1234567890-titulo-_JM",
        "https://produto.mercadolivre.com.br/MLB-1234567890-titulo-MLB-9999999999-_JM",
        "https://produto.mercadolivre.com.br/MLB-%31%32%33-titulo-_JM",
    ],
)
def test_product_url_rejects_unsupported_or_unsafe_input(url: str) -> None:
    with pytest.raises(InvalidProductUrl):
        parse_product_url(url)
