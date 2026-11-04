"""QA harness da spec 0047: app real com o transporte HTTP do Gemini simulado.

Mesma técnica da QA da 0034 (substituir apenas get_provider no bootstrap), mas aqui o
GeminiProvider real é mantido e só o transporte httpx é trocado por MockTransport.
Assim tools, fallback, parsing do grounding e prompt são o código de produção.
Nenhuma requisição sai da máquina: o handler recusa qualquer URL que não seja o endpoint.

Cenários pela última mensagem do usuário:
- contém "[qa-429]": chamada com tools recebe 429; a sem tools responde 200.
- contém "[qa-sem-fonte]": grounding sem chunks (modelo pesquisou e não achou).
- demais: chamada com tools devolve grounding; sem tools devolve texto simples.
Cada requisição é registrada em QA_GEMINI_LOG (JSON por linha, sem a chave).
"""

import json
import os

import httpx

from app.main import app
from app.research.provider import ENDPOINT, GeminiProvider, get_provider
from app.research.settings import ai_settings

LOG = os.environ["QA_GEMINI_LOG"]

SUGGESTIONS = (
    "<style>.c{font:14px sans-serif;display:flex;gap:8px}.c a{padding:6px 12px;border:1px solid #ccc;"
    "border-radius:16px;color:#1f1f1f;text-decoration:none}</style><div class=\"c\">"
    "<a href=\"https://www.google.com/search?q=notebook+preco\">notebook preço</a>"
    "<a href=\"https://www.google.com/search?q=notebook+oferta\">notebook oferta</a></div>"
    "<script>document.body.setAttribute('data-qa-script-ran','1')</script>"
)


def text_response(text: str, metadata: dict | None = None) -> httpx.Response:
    candidate = {"content": {"parts": [{"text": text}], "role": "model"}, "finishReason": "STOP"}
    if metadata is not None:
        candidate["groundingMetadata"] = metadata
    return httpx.Response(200, json={"candidates": [candidate]})


def handler(request: httpx.Request) -> httpx.Response:
    if str(request.url) != ENDPOINT:
        raise httpx.ConnectError(f"QA: URL inesperada bloqueada: {request.url}")
    body = json.loads(request.content)
    last = body["contents"][-1]["parts"][0]["text"]
    has_tools = "tools" in body
    instruction = body["systemInstruction"]["parts"][0]["text"]
    entry = {
        "url": str(request.url),
        "tools": body.get("tools"),
        "has_key_header": bool(request.headers.get("x-goog-api-key")),
        "instruction_has_no_web": "Não há busca web" in instruction,
        "instruction_web_search": "Pesquisa Google" in instruction,
        "last_message_prefix": last[:60],
    }
    with open(LOG, "a", encoding="utf-8") as log:
        log.write(json.dumps(entry, ensure_ascii=False) + "\n")
    if has_tools and "[qa-429]" in last:
        return httpx.Response(429, json={"error": {"code": 429, "status": "RESOURCE_EXHAUSTED"}})
    if has_tools and "[qa-sem-fonte]" in last:
        return text_response("Não encontrei preço confiável na web para esse produto.",
                             {"webSearchQueries": ["produto x preço"], "groundingChunks": []})
    if has_tools:
        return text_response(
            "Encontrei referências: Loja QA por R$ 3.199,00 (não verificado).",
            {
                "webSearchQueries": ["notebook x preço"],
                "groundingChunks": [
                    {"web": {"uri": "https://loja-qa.example/notebook-x", "title": "Loja QA — Notebook X"}},
                    {"web": {"uri": "http://inseguro.example/oferta", "title": "Loja HTTP"}},
                    {"web": {"uri": "javascript:alert(1)", "title": "Script"}},
                    {"web": {"uri": "https://loja-qa.example/notebook-x", "title": "Duplicada"}},
                    {"web": {"uri": "https://outra-qa.example/oferta", "title": ""}},
                ],
                "searchEntryPoint": {"renderedContent": SUGGESTIONS},
            },
        )
    return text_response("Resposta sem pesquisa na web (QA).")


def qa_provider() -> GeminiProvider:
    return GeminiProvider(ai_settings(), transport=httpx.MockTransport(handler))


app.dependency_overrides[get_provider] = qa_provider
