import pytest

from app.research.grounding import InvalidGroundingError, extract_grounding

HTML = "<style>.x{}</style><div class=\"x\">Sugestões</div>"


def chunk(uri, title="Loja"):
    return {"web": {"uri": uri, "title": title}}


def candidate(chunks, html=HTML):
    metadata = {"groundingChunks": chunks, "webSearchQueries": ["preço notebook"]}
    if html is not None:
        metadata["searchEntryPoint"] = {"renderedContent": html}
    return {"groundingMetadata": metadata}


def test_searched_grounding_keeps_https_sources_and_suggestions() -> None:
    result = extract_grounding(candidate([chunk("https://loja.example/p/1", "Loja X")]))
    assert result == {
        "status": "searched",
        "sources": [{"title": "Loja X", "url": "https://loja.example/p/1"}],
        "search_suggestions_html": HTML,
    }
    assert "webSearchQueries" not in str(result)


def test_without_metadata_or_sources_there_is_no_grounding() -> None:
    assert extract_grounding({}) is None
    assert extract_grounding(candidate([])) is None
    assert extract_grounding(candidate([], html=None)) is None


@pytest.mark.parametrize("uri", [
    "http://loja.example/p", "javascript:alert(1)", "https:///sem-host", "ftp://loja.example",
    "https://loja.example/" + "a" * 2048, 42, None,
])
def test_unsafe_or_oversized_uris_are_discarded(uri) -> None:
    assert extract_grounding(candidate([chunk(uri), "texto", {"web": "x"}])) is None


def test_sources_are_unique_limited_and_titles_truncated() -> None:
    chunks = [chunk("https://loja.example/1", "A" * 300), chunk("https://loja.example/1", "Duplicada")]
    chunks += [chunk(f"https://loja{index}.example/") for index in range(15)]
    chunks.append(chunk("https://sem-titulo.example/p", "  "))
    sources = extract_grounding(candidate(chunks))["sources"]
    assert len(sources) == 10
    assert sources[0] == {"title": "A" * 200, "url": "https://loja.example/1"}
    assert len({source["url"] for source in sources}) == 10


def test_missing_title_falls_back_to_host() -> None:
    sources = extract_grounding(candidate([chunk("https://sem-titulo.example/p", None)]))["sources"]
    assert sources == [{"title": "sem-titulo.example", "url": "https://sem-titulo.example/p"}]


@pytest.mark.parametrize("html", [None, "", "   ", 7, "x" * 32001])
def test_sources_without_valid_suggestions_are_invalid(html) -> None:
    with pytest.raises(InvalidGroundingError):
        extract_grounding(candidate([chunk("https://loja.example/p")], html=html))


def test_suggestions_at_the_limit_are_accepted() -> None:
    html = "x" * 32000
    assert extract_grounding(candidate([chunk("https://loja.example/p")], html=html))["search_suggestions_html"] == html


@pytest.mark.parametrize("metadata", ["texto", [], {"groundingChunks": "x"}, {"groundingChunks": [chunk("https://a.example")], "searchEntryPoint": "x"}])
def test_malformed_metadata_is_invalid(metadata) -> None:
    with pytest.raises(InvalidGroundingError):
        extract_grounding({"groundingMetadata": metadata})
