import asyncio

import httpx
import pytest

from app.errors import ApiError
from app.research.cleanup import cleanup_loop
from app.research.provider import MODEL, GeminiProvider, bounded_context
from app.research.settings import AISettings


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
