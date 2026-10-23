# Verificação — 0031

Data: 2026-10-23. Issue [#180](https://github.com/SamiaLuvanice/bestprice/issues/180).
Base de implementação: `origin/develop` (`396f0ac`).

## Critérios de aceite

| Critério | Estado | Evidência e limite |
|---|---|---|
| AC01 — Resolver `item_id` no link `/p/MLB…` | Demonstrado | Testes do parser resolvem o ID da publicação escolhido, sem confundir o ID do catálogo; teste HTTP envia esse ID à fonte de consulta. |
| AC02 — Repetição igual | Demonstrado | Testes com separador `|` literal e `%7C` resolvem a repetição como uma seleção. |
| AC03 — Filtro ausente, inválido ou IDs diferentes | Demonstrado | Testes rejeitam filtro ausente/malformado como `unsupported_url_format`, IDs distintos como `ambiguous_item_id` e preservam a fronteira HTTP sem chamar a fonte para entradas rejeitadas. |
| AC04 — Allowlist e links diretos existentes | Demonstrado | Suíte `test_url_error_codes.py`: protocolo, host, porta, credenciais URL, link direto, busca, link curto e formatos não suportados continuam cobertos. |
| AC05 — Cliente oficial e gate de ativação | Confirmado por revisão e Stage | O diff não altera cliente nem flag. O Stage permaneceu com `MERCADOLIVRE_THIRD_PARTY_VALIDATED=false`; o formulário devolveu 503 `integration_not_configured`, sem criar vínculo. O acesso real à API continua pendente. |

## Comandos e resultados

- Red antes da implementação: `uv run pytest -q tests/test_url_error_codes.py -p no:cacheprovider --tb=short` — **2 failed, 24 passed**. O link `/p/MLB…` com `pdp_filters` foi rejeitado como `unsupported_url_format`; o caso com IDs distintos não chegou a `ambiguous_item_id`. Falhas esperadas.
- Testes focados após resolver o parser: `uv run pytest -q tests/test_url_error_codes.py -p no:cacheprovider --tb=short` — **28 passed**, 1 aviso de depreciação do `TestClient` Starlette/httpx.
- Suíte final: `uv run pytest -q -rs -p no:cacheprovider --tb=short` (em `backend/`) — **168 passed, 31 skipped, 1 warning**. Os skips são de integração que exigem `TEST_DATABASE_URL` PostgreSQL (29) e de inicialização POSIX no Windows (2).
- Lint: `.venv\Scripts\ruff.exe check .` (em `backend/`) — **All checks passed!**
- Complexidade: `backend\.venv\Scripts\python.exe .agents\skills\cyclomatic-complexity\scripts\complexity_report.py --changed origin/develop` — passou; `parse_product_url` CC19 rank C, nenhum bloco rank D+ novo, nenhum arquivo abaixo do MI 20.
- Diff: `git diff --check` — passou.

## Revisão de arquitetura e segurança

- O parser mantém allowlist HTTPS e nunca requisita a URL recebida; só extrai
  um ID validado que seguirá ao cliente oficial de host fixo.
- O ID `/p/MLB…` é tratado apenas como catálogo. A publicação vem do filtro
  `pdp_filters`; filtros malformados e seleções conflitantes são recusados.
- O diff preserva os códigos HTTP existentes e não altera OAuth, permissões,
  persistência, worker ou a flag da integração. Revisão local contra
  `docs/architecture.md`, `backend.md`, `security.md`, `errors.md` e `testing.md`
  não encontrou achado bloqueante. Revisão independente da PR permanece pendente.

## Limites operacionais

- No Chrome, o Stage confirmou configuração de callback OAuth e variáveis do
  aplicativo presentes no Render; o flag permanece `false`. O DevCenter já
  mostra o escopo somente de leitura.
- A tentativa do link de catálogo no Stage antes do deploy desta correção
  retornou 400 `unsupported_url_format`. Uma tentativa com URL normalizada para
  o ID da publicação passou pela validação local, mas retornou 503
  `integration_not_configured`; nenhum produto foi persistido.
- O plano gratuito do Render não oferece Shell nem One-off Jobs, conforme painel
  do serviço. A consulta direta à API pelo navegador foi bloqueada pelo
  PolicyAgent local com 403 antes de produzir resposta do Mercado Livre. Não há
  evidência de leitura real de anúncios, rotação OAuth ou permissão para anúncio
  de terceiros.
- O cadastro real e o monitoramento periódico continuam desativados e dependem
  da validação operacional 0026. Não habilitar `MERCADOLIVRE_THIRD_PARTY_VALIDATED`
  com base apenas nos testes locais ou na página pública do produto.

## Entrega

Implementação entregue; aguarda revisão independente. PR para `develop` e
validação PostgreSQL real ainda pendentes.
