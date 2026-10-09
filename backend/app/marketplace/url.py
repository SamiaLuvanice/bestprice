import re
from dataclasses import dataclass
from urllib.parse import urlsplit

ALLOWED_HOSTS = frozenset({"produto.mercadolivre.com.br", "www.mercadolivre.com.br"})
LISTING_PATH = re.compile(r"/MLB-([0-9]+)-([A-Za-z0-9][A-Za-z0-9._-]*)-_JM/?", re.IGNORECASE)
EMBEDDED_ID = re.compile(r"MLB-?[0-9]+", re.IGNORECASE)


class InvalidProductUrl(ValueError):
    pass


@dataclass(frozen=True)
class ParsedProductUrl:
    external_id: str


def parse_product_url(url: str) -> ParsedProductUrl:
    if not isinstance(url, str) or not url or len(url) > 2048:
        raise InvalidProductUrl("URL de anúncio inválida")
    if any(ord(character) < 32 or ord(character) == 127 for character in url):
        raise InvalidProductUrl("URL de anúncio inválida")
    try:
        parsed = urlsplit(url)
        hostname = parsed.hostname
        port = parsed.port
    except ValueError as exc:
        raise InvalidProductUrl("URL de anúncio inválida") from exc
    if (
        parsed.scheme.lower() != "https"
        or hostname not in ALLOWED_HOSTS
        or parsed.username is not None
        or parsed.password is not None
        or port not in (None, 443)
        or parsed.netloc.endswith(".")
        or "%" in parsed.path
    ):
        raise InvalidProductUrl("URL de anúncio inválida")
    match = LISTING_PATH.fullmatch(parsed.path)
    if match is None or EMBEDDED_ID.search(match.group(2)):
        raise InvalidProductUrl("Formato de anúncio não suportado")
    return ParsedProductUrl(external_id=f"MLB{match.group(1)}")
