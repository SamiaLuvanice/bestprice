import re
from dataclasses import dataclass
from urllib.parse import urlsplit

ALLOWED_HOSTS = frozenset({"produto.mercadolivre.com.br", "www.mercadolivre.com.br"})
# Mercado Livre hosts that never identify a single publication (search/category lists).
LIST_HOSTS = frozenset({"lista.mercadolivre.com.br"})
SHORT_LINK_HOSTS = frozenset({"meli.la"})
LISTING_PATH = re.compile(r"/MLB-([0-9]+)-([A-Za-z0-9][A-Za-z0-9._-]*)-_JM/?", re.IGNORECASE)
EMBEDDED_ID = re.compile(r"MLB-?[0-9]+", re.IGNORECASE)

INVALID_URL_MESSAGE = "Insira um link válido de anúncio do Mercado Livre."
UNSUPPORTED_FORMAT_MESSAGE = (
    "Este formato de link não identifica um anúncio. Abra a página do anúncio no Mercado Livre "
    "e copie o endereço completo."
)
LIST_PAGE_MESSAGE = (
    "Este link é de uma busca, categoria ou página de ofertas. Abra o anúncio desejado e copie o endereço completo."
)
SHORT_LINK_MESSAGE = (
    "Links curtos não são aceitos. Abra o anúncio no Mercado Livre e copie o endereço completo da página."
)
AMBIGUOUS_ID_MESSAGE = (
    "O link contém mais de um identificador de anúncio. Abra o anúncio e copie o endereço completo."
)


class InvalidProductUrl(ValueError):
    """Rejected URL with the contract error code and a user-facing message."""

    def __init__(self, code: str = "invalid_url", message: str = INVALID_URL_MESSAGE) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass(frozen=True)
class ParsedProductUrl:
    external_id: str


def parse_product_url(url: str) -> ParsedProductUrl:
    """Extract the MLB publication ID locally; the received URL is never requested."""
    if not isinstance(url, str) or not url or len(url) > 2048:
        raise InvalidProductUrl()
    if any(ord(character) < 32 or ord(character) == 127 for character in url):
        raise InvalidProductUrl()
    try:
        parsed = urlsplit(url)
        hostname = parsed.hostname
        port = parsed.port
    except ValueError as exc:
        raise InvalidProductUrl() from exc
    if (
        parsed.scheme.lower() != "https"
        or parsed.username is not None
        or parsed.password is not None
        or port not in (None, 443)
        or parsed.netloc.endswith(".")
        or "%" in parsed.path
    ):
        raise InvalidProductUrl()
    if hostname in SHORT_LINK_HOSTS:
        raise InvalidProductUrl("unsupported_url_format", SHORT_LINK_MESSAGE)
    if hostname in LIST_HOSTS:
        raise InvalidProductUrl("unsupported_url_format", LIST_PAGE_MESSAGE)
    if hostname not in ALLOWED_HOSTS:
        raise InvalidProductUrl()
    if parsed.path.lower().startswith("/sec/"):
        raise InvalidProductUrl("unsupported_url_format", SHORT_LINK_MESSAGE)
    if parsed.path.lower().rstrip("/") == "/ofertas":
        raise InvalidProductUrl("unsupported_url_format", LIST_PAGE_MESSAGE)
    match = LISTING_PATH.fullmatch(parsed.path)
    if match is None:
        raise InvalidProductUrl("unsupported_url_format", UNSUPPORTED_FORMAT_MESSAGE)
    if EMBEDDED_ID.search(match.group(2)):
        raise InvalidProductUrl("ambiguous_item_id", AMBIGUOUS_ID_MESSAGE)
    return ParsedProductUrl(external_id=f"MLB{match.group(1)}")
