"""Pure extraction of Google Search grounding from a Gemini candidate.

Web content is data: titles and URLs are only validated and bounded, never fetched.
The suggestions HTML is kept verbatim (Google terms forbid altering it) and is
isolated by the client; an oversized or missing snippet invalidates the response.
"""

from urllib.parse import urlsplit

from app.research.settings import (
    MAX_GROUNDING_SOURCES,
    MAX_SOURCE_TITLE_CHARS,
    MAX_SOURCE_URL_CHARS,
    MAX_SUGGESTIONS_HTML_CHARS,
)


class InvalidGroundingError(ValueError):
    """The provider returned grounding we cannot show safely or completely."""


def extract_grounding(candidate: dict) -> dict | None:
    """Return the searched grounding, None when nothing was searched, or raise InvalidGroundingError."""
    metadata = candidate.get("groundingMetadata")
    if metadata is None:
        return None
    if not isinstance(metadata, dict):
        raise InvalidGroundingError("Invalid grounding metadata")
    chunks = metadata.get("groundingChunks") or []
    if not isinstance(chunks, list):
        raise InvalidGroundingError("Invalid grounding chunks")
    if not (chunks or metadata.get("webSearchQueries") or metadata.get("searchEntryPoint")):
        return None  # The model chose not to search.
    sources = unique_sources(chunks)
    if not sources:
        # It searched but nothing can be shown with suggestions: never present it as a plain answer.
        raise InvalidGroundingError("Searched without valid sources")
    return {"status": "searched", "sources": sources, "search_suggestions_html": suggestions_html(metadata)}


def unique_sources(chunks: list) -> list[dict[str, str]]:
    sources: dict[str, dict[str, str]] = {}
    for chunk in chunks:
        source = web_source(chunk)
        if source is not None and source["url"] not in sources:
            sources[source["url"]] = source
        if len(sources) == MAX_GROUNDING_SOURCES:
            break
    return list(sources.values())


def web_source(chunk) -> dict[str, str] | None:
    web = chunk.get("web") if isinstance(chunk, dict) else None
    if not isinstance(web, dict):
        return None
    host = https_host(web.get("uri"))
    if host is None:
        return None
    title = web.get("title")
    title = title.strip() if isinstance(title, str) else ""
    return {"title": (title or host)[:MAX_SOURCE_TITLE_CHARS], "url": web["uri"]}


def https_host(uri) -> str | None:
    if not isinstance(uri, str) or len(uri) > MAX_SOURCE_URL_CHARS:
        return None
    try:
        parsed = urlsplit(uri)
        host = parsed.hostname
    except ValueError:
        return None
    return host if parsed.scheme == "https" and host else None


def suggestions_html(metadata: dict) -> str:
    entry_point = metadata.get("searchEntryPoint")
    html = entry_point.get("renderedContent") if isinstance(entry_point, dict) else None
    if not isinstance(html, str) or not html.strip() or len(html) > MAX_SUGGESTIONS_HTML_CHARS:
        raise InvalidGroundingError("Invalid search suggestions")
    return html
