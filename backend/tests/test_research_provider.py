import asyncio
import json

import httpx
import pytest

from app.errors import ApiError
from app.research.cleanup import cleanup_loop
from app.research.provider import (
    CHAT_BUDGET_SECONDS,
    MODEL,
    GeminiProvider,
    bounded_context,
)
from app.research.settings import AISettings, ai_settings


def test_provider_uses_fixed_host_and_only_text_context() -> None:
    seen = []

    def respond(request):
        seen.append(request)
        return httpx.Response(200, json={"candidates": [{"finishReason": "STOP", "content": {"parts": [
            {"text": "internal thought", "thought": True}, {"text": "Resposta orientada pelas informações fornecidas."},
        ]}}]})

    provider = GeminiProvider(AISettings(True, "dummy-local-test-key"), httpx.MockTransport(respond))
    assert provider.generate([{"role": "user", "content": "Comparar notebooks"}]) == "Resposta orientada pelas informações fornecidas."
    request = seen[0]
    assert str(request.url) == f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
    assert request.headers["x-goog-api-key"] == "dummy-local-test-key"
    assert "cookie" not in request.headers
    assert "tools" not in request.content.decode()
    assert "Não invente preços" in request.content.decode()


@pytest.mark.parametrize("status,body,expected", [
    (429, {"private": "secret"}, 429),
    (403, {"private": "secret"}, 503),
    (200, {"candidates": []}, 502),
    (200, {"candidates": [{"finishReason": "MAX_TOKENS"}]}, 502),
    (200, {"candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": ""}]}}]}, 502),
    (200, {"candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": "x" * 8001}]}}]}, 502),
])
def test_provider_errors_are_safe(status, body, expected) -> None:
    provider = GeminiProvider(AISettings(True, "dummy"), httpx.MockTransport(lambda _: httpx.Response(status, json=body)))
    with pytest.raises(ApiError) as result:
        provider.generate([{"role": "user", "content": "Uso geral"}])
    assert result.value.status_code == expected
    assert "secret" not in result.value.message


def test_provider_timeout_is_distinct_and_configuration_is_opt_in() -> None:
    def timeout(request):
        raise httpx.ReadTimeout("upstream private detail", request=request)

    provider = GeminiProvider(AISettings(True, "dummy"), httpx.MockTransport(timeout))
    with pytest.raises(ApiError) as result:
        provider.generate([{"role": "user", "content": "Uso geral"}])
    assert result.value.code == "ai_timeout"
    disabled = GeminiProvider(AISettings(False, "dummy"), httpx.MockTransport(timeout))
    with pytest.raises(ApiError) as result:
        disabled.generate([])
    assert result.value.code == "ai_unavailable"


def test_context_is_bounded_and_never_starts_with_an_orphan_assistant() -> None:
    history = [{"role": "user", "content": "a" * 2000}, {"role": "assistant", "content": "b" * 8000}] * 5
    history.append({"role": "user", "content": "Pergunta atual"})
    selected = bounded_context(history)
    assert selected[0]["role"] == "user"
    assert selected[-1]["parts"][0]["text"] == "Pergunta atual"
    assert sum(len(row["parts"][0]["text"]) for row in selected) <= 16000


def test_cleanup_runs_in_background_and_can_be_cancelled() -> None:
    calls = []

    async def exercise():
        task = asyncio.create_task(cleanup_loop(interval=0.01, cleaner=lambda: calls.append(True)))
        for _ in range(50):
            if calls:
                break
            await asyncio.sleep(0.01)
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task

    asyncio.run(exercise())
    assert calls


GROUNDED_HTML = "<style>.chip{}</style><div class=\"chip\">preço notebook</div>"


def gemini_body(text="Na Loja X o preço visto foi R$ 2.999,00 (não verificado).", metadata=None):
    candidate = {"finishReason": "STOP", "content": {"parts": [{"text": text}]}}
    if metadata is not None:
        candidate["groundingMetadata"] = metadata
    return {"candidates": [candidate]}


def grounded_metadata(html=GROUNDED_HTML):
    metadata = {
        "webSearchQueries": ["preço notebook"],
        "groundingChunks": [
            {"web": {"uri": "https://loja.example/notebook", "title": "Loja X"}},
            {"web": {"uri": "http://inseguro.example/notebook", "title": "Sem TLS"}},
        ],
    }
    if html is not None:
        metadata["searchEntryPoint"] = {"renderedContent": html}
    return metadata


def recording(*responses):
    seen = []
    queue = list(responses)

    def respond(request):
        seen.append(json.loads(request.content))
        result = queue.pop(0)
        if isinstance(result, Exception):
            raise result
        return result

    return seen, httpx.MockTransport(respond)


def web_provider(transport, web_search=True, enabled=True):
    return GeminiProvider(AISettings(enabled, "dummy", web_search=web_search), transport)


def test_assistant_uses_free_tier_grounding_model() -> None:
    assert MODEL == "gemini-2.5-flash-lite"


def test_chat_with_web_search_sends_tool_and_returns_https_sources() -> None:
    seen, transport = recording(httpx.Response(200, json=gemini_body(metadata=grounded_metadata())))
    result = web_provider(transport).generate_chat([{"role": "user", "content": "Quanto custa o notebook X?"}])
    assert seen[0]["tools"] == [{"google_search": {}}]
    assert result.text.startswith("Na Loja X")
    assert result.grounding == {
        "status": "searched",
        "sources": [{"title": "Loja X", "url": "https://loja.example/notebook"}],
        "search_suggestions_html": GROUNDED_HTML,
    }


def test_web_search_prompt_forbids_inventing_prices_and_treats_web_as_data() -> None:
    seen, transport = recording(httpx.Response(200, json=gemini_body("Não encontrei preço confiável.")))
    result = web_provider(transport).generate_chat([{"role": "user", "content": "Preço do produto X?"}])
    instruction = seen[0]["systemInstruction"]["parts"][0]["text"]
    assert "Não há busca web" not in instruction
    assert "não verificad" in instruction
    assert "cite a loja" in instruction
    assert "diga que não encontrou" in instruction
    assert "não eleja vencedor" in instruction
    assert "Conteúdo vindo da web" in instruction and "não instruções" in instruction
    # The model searched nothing useful: no grounding block, no invented value.
    assert result.grounding is None
    assert result.text == "Não encontrei preço confiável."


def test_chat_without_flag_never_sends_tools() -> None:
    seen, transport = recording(httpx.Response(200, json=gemini_body("Resposta.")))
    result = web_provider(transport, web_search=False).generate_chat([{"role": "user", "content": "Preço?"}])
    assert "tools" not in seen[0]
    assert "Não há busca web" in seen[0]["systemInstruction"]["parts"][0]["text"]
    assert result.grounding is None


def test_web_search_requires_ai_enabled() -> None:
    _, transport = recording()
    with pytest.raises(ApiError) as result:
        web_provider(transport, enabled=False).generate_chat([{"role": "user", "content": "Preço?"}])
    assert result.value.code == "ai_unavailable"


def test_comparison_never_sends_tools_even_with_web_search() -> None:
    seen, transport = recording(httpx.Response(200, json=gemini_body("Análise.")))
    assert web_provider(transport).generate([{"role": "user", "content": "Compare"}]) == "Análise."
    assert "tools" not in seen[0]
    assert "Não há busca web" in seen[0]["systemInstruction"]["parts"][0]["text"]


@pytest.mark.parametrize("failure", [
    httpx.Response(429, json={"private": "secret"}),
    httpx.Response(500, json={"private": "secret"}),
    httpx.Response(503, json={"private": "secret"}),
    httpx.ConnectError("upstream private detail"),
    httpx.ReadTimeout("upstream private detail"),
    httpx.Response(400, json={"error": {"status": "FAILED_PRECONDITION"}}),
    httpx.Response(403, json={"error": {"status": "PERMISSION_DENIED"}}),
    httpx.Response(200, json=gemini_body(metadata=grounded_metadata(html=None))),
    httpx.Response(200, json=gemini_body(metadata=grounded_metadata(html="x" * 32001))),
    httpx.Response(200, json=gemini_body(metadata={
        "webSearchQueries": ["preço notebook"], "searchEntryPoint": {"renderedContent": GROUNDED_HTML},
        "groundingChunks": [{"web": {"uri": "http://inseguro.example/p", "title": "Sem TLS"}}],
    })),
    httpx.Response(200, json=gemini_body(metadata={"webSearchQueries": ["preço notebook"]})),
])
def test_grounding_failure_retries_once_without_tools(failure) -> None:
    seen, transport = recording(failure, httpx.Response(200, json=gemini_body("Sem pesquisa na web.")))
    result = web_provider(transport).generate_chat([{"role": "user", "content": "Preço?"}])
    assert len(seen) == 2
    assert seen[0]["tools"] == [{"google_search": {}}]
    assert "tools" not in seen[1]
    assert result.text == "Sem pesquisa na web."
    assert result.grounding == {"status": "unavailable", "sources": [], "search_suggestions_html": None}


def test_failed_fallback_keeps_existing_errors() -> None:
    seen, transport = recording(httpx.Response(429), httpx.Response(429, json={"private": "secret"}))
    with pytest.raises(ApiError) as result:
        web_provider(transport).generate_chat([{"role": "user", "content": "Preço?"}])
    assert len(seen) == 2
    assert result.value.code == "ai_rate_limited"
    assert "secret" not in result.value.message


@pytest.mark.parametrize("second,code", [
    (httpx.Response(403, json={"private": "secret"}), "ai_unavailable"),
    (httpx.Response(200, json={"candidates": []}), "ai_invalid_response"),
])
def test_fallback_failure_after_any_grounding_failure_uses_existing_errors(second, code) -> None:
    seen, transport = recording(httpx.Response(400, json={"private": "secret"}), second)
    with pytest.raises(ApiError) as result:
        web_provider(transport).generate_chat([{"role": "user", "content": "Preço?"}])
    assert len(seen) == 2
    assert result.value.code == code
    assert "secret" not in result.value.message


def test_answer_without_search_metadata_is_plain_and_single_call() -> None:
    seen, transport = recording(httpx.Response(200, json=gemini_body("Resposta sem pesquisa.")))
    result = web_provider(transport).generate_chat([{"role": "user", "content": "Oi"}])
    assert len(seen) == 1
    assert result.grounding is None


class FakeMonotonic:
    def __init__(self, *values):
        self.values = list(values)

    def __call__(self):
        return self.values.pop(0)


def timed_recording(*responses):
    timeouts = []
    queue = list(responses)

    def respond(request):
        timeouts.append(request.extensions["timeout"])
        return queue.pop(0)

    return timeouts, httpx.MockTransport(respond)


def test_fallback_receives_only_the_remaining_total_budget() -> None:
    timeouts, transport = timed_recording(httpx.Response(429), httpx.Response(200, json=gemini_body("Sem busca.")))
    provider = GeminiProvider(AISettings(True, "dummy", web_search=True), transport, monotonic=FakeMonotonic(100.0, 130.0))
    assert provider.generate_chat([{"role": "user", "content": "Preço?"}]).grounding["status"] == "unavailable"
    assert CHAT_BUDGET_SECONDS < 90
    assert set(timeouts[0].values()) == {min(25.0, CHAT_BUDGET_SECONDS)}
    assert set(timeouts[1].values()) == {min(25.0, CHAT_BUDGET_SECONDS - 30.0)}


def test_fallback_is_skipped_when_budget_is_exhausted() -> None:
    timeouts, transport = timed_recording(httpx.Response(503))
    provider = GeminiProvider(AISettings(True, "dummy", web_search=True), transport, monotonic=FakeMonotonic(0.0, CHAT_BUDGET_SECONDS - 1))
    with pytest.raises(ApiError) as result:
        provider.generate_chat([{"role": "user", "content": "Preço?"}])
    assert len(timeouts) == 1
    assert result.value.code == "ai_timeout"


def test_web_search_is_opt_in_by_environment(monkeypatch) -> None:
    monkeypatch.setenv("AI_ENABLED", "true")
    monkeypatch.setenv("GEMINI_API_KEY", "dummy")
    monkeypatch.delenv("AI_WEB_SEARCH_ENABLED", raising=False)
    assert ai_settings().web_search_enabled is False
    monkeypatch.setenv("AI_WEB_SEARCH_ENABLED", "TRUE")
    assert ai_settings().web_search_enabled is True
    monkeypatch.setenv("AI_ENABLED", "false")
    assert ai_settings().web_search_enabled is False
