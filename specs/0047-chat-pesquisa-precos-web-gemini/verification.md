# Verificação da spec 0047

QA local em 04/11/2026, conforme `.agents/agents/qa.md`. Worktree
`.worktrees/feature-0047-issue-245-chat-pesquisa-precos-web`, branch
`feature/0047-issue-245-chat-pesquisa-precos-web`, SHA avaliado **`c336a1d`**. A árvore estava
limpa, e o QA não alterou código. Este registro não inclui CI, Project, PR nem release, porque
nenhum deles foi observado nesta rodada.

## Fronteiras da evidência

| Camada | Real | Simulado | Limite |
|---|---|---|---|
| pytest | Código, PostgreSQL 17 descartável (`bestprice-0047-testdb`, 127.0.0.1:55447) e migrations | Transporte do Gemini (`httpx.MockTransport`) e relógio | Não valida o serviço Google |
| Fluxo ponta a ponta | SPA Vite (127.0.0.1:55473), FastAPI/uvicorn (127.0.0.1:55480), PostgreSQL 17 descartável `bestprice-0047-qa-e2e` (127.0.0.1:55448), cookie de sessão, proxy `/api`, `GeminiProvider` de produção (tools, fallback, parsing, prompt) e purga | **Apenas o transporte HTTP do Gemini**: o bootstrap [qa/qa_app.py](qa/qa_app.py) troca `get_provider` por `GeminiProvider(ai_settings(), transport=MockTransport(...))` | Usa a técnica da 0034 (override de `get_provider` no bootstrap de QA), mas a troca é mais estreita: só o transporte muda, não o provider. A chave é falsa (`qa-fake-key-not-real`). Qualquer URL fora do endpoint gera erro, e nenhuma requisição sai da máquina. |
| Vitest/Playwright | Render, jsdom e Chromium | Respostas HTTP sintéticas (`fakeApi`, `page.route`) | Comprova composição e estados, não a API |

**Não executado (pendência operacional):** chamada à conta real do Gemini com grounding no free
tier, HTML real de `searchEntryPoint` e qualidade em português do `gemini-2.5-flash-lite`.

## Gates

| Comando | Resultado |
|---|---|
| `backend/`: `uv sync --locked --extra dev` | ok (37 pacotes) |
| `backend/`: `uv run ruff check .` | All checks passed! |
| `backend/`: `TEST_DATABASE_URL=postgresql://bestprice:***@127.0.0.1:55447/bestprice_test uv run pytest -q -p no:cacheprovider -rs` | **282 passed, 2 skipped, 1 warning** (35,66 s). Os skips são `test_stage_start.py` (script POSIX). As integrações PG rodaram, porque não houve skip por falta de banco. |
| raiz: `complexity_report.py backend/app --changed origin/develop` | 158 blocos, média 3,12 (A), nenhum ≥ D, exit 0 |
| raiz: `node --test .github/scripts/*.test.cjs` | **50 pass, 0 fail** |
| `frontend/`: `npm run lint` | exit 0 |
| `frontend/`: `npm test -- --run` (5 execuções completas) | **2 verdes** com `35 files · 413 passed`. **3 falharam** com `1 failed · 412 passed`, sempre em `src/App.test.tsx > preserva preço desconhecido sem criar valor zero no detalhe` (`Unable to find role="heading" and name "Fone sem fio"`, `findByRole` com espera padrão de 1 s sob carga). |
| `frontend/`: o mesmo teste isolado (`npx vitest run src/App.test.tsx -t "preserva preço desconhecido"`) ×3 | 3/3 passed |
| `frontend/`: `npm run build` | exit 0, `✓ built in 1.76s` |
| `frontend/`: `npx playwright test assistant.spec.ts grounding.spec.ts` (Vite local), 3 execuções | 1ª: **32 passed, 3 skipped, 1 failed**, em `[viewport-1280] inicial` (`toMatchObject({loaded: true})` da imagem do robô). 2ª: a falha não se repetiu (o resumo não foi capturado). 3ª: **33 passed, 3 skipped**. |
| `npx playwright test assistant.spec.ts --project=viewport-768 -g inicial` ×3 | 3/3 passed |
| `npx playwright test grounding.spec.ts --project=viewport-1280` | 1 passed |

Os dois intermitentes estão fora do diff da 0047: `App.test.tsx` e `assistant-robot.png` não
mudaram. Mesmo assim, **o gate `npm test -- --run` não é deterministicamente verde**, porque
falhou em 3 de 5 execuções nesta máquina. Não comparamos com `origin/develop` para saber se o
problema já existia antes, o que fica como pendência.

## Fluxo ponta a ponta (Gemini simulado no transporte)

Preparação: um container novo foi criado com `alembic upgrade head` e uma conta sintética
`qa0047@example.com`, provisionada por `provision_user`. As senhas ficaram só em arquivos do
scratchpad. A jornada roda em [qa/journey.cjs](qa/journey.cjs), com Chromium, fuso
`America/Sao_Paulo` e login pela API via proxy.

| Rodada | Resultado | Artefatos |
|---|---|---|
| `node journey.cjs on` (`AI_WEB_SEARCH_ENABLED=true`), 1ª | 34/38. As 4 falhas eram do harness: leitura do aviso antes de carregar capabilities, checagem imediata do rótulo, análise que recebeu 429 da cota local por minuto e bloqueio esperado do sandbox contado como erro de console. O harness foi corrigido para esperar e classificar esses casos. | — |
| `node journey.cjs on`, 2ª | **40/40 passed** | [results-web-search-on.json](qa/results-web-search-on.json), [chat-searched-response.json](qa/chat-searched-response.json), [gemini-boundary-on.jsonl](qa/gemini-boundary-on.jsonl) |
| `node journey.cjs off` (`AI_WEB_SEARCH_ENABLED=false`) | **12/12 passed** | [results-web-search-off.json](qa/results-web-search-off.json), [gemini-boundary-off.jsonl](qa/gemini-boundary-off.jsonl) |

As capturas `bloco-{320,390,768,1280,1440}.png`, `falha-rede.png` e `off.png` ficaram fora do
Git, no scratchpad da sessão (`.../scratchpad/qa/shots-on|off/`).

Log da fronteira na 2ª rodada `on`, mais o replay: todas as chamadas foram para
`.../models/gemini-2.5-flash-lite:generateContent` com o cabeçalho de chave presente.

1. Pergunta de preço: `tools: [{"google_search": {}}]`, com o prompt de busca.
2. `[qa-429]`: chamada com `tools` → 429, depois **uma** chamada sem `tools`, com o prompt
   "Não há busca web". Foram duas chamadas no total.
3. `[qa-sem-fonte]`: chamada com `tools` → `groundingChunks: []`.
4. Análise de comparação: `tools: null`, com o prompt sem busca.
5. Chat novo para o replay: 1 chamada. O replay com o mesmo `request_id` fez **0 chamadas**.

Com a busca desligada, a única chamada saiu com `tools: null`.

Banco (`psql` no container descartável), conversa da 2ª rodada: as mensagens do usuário têm
`grounding` SQL NULL. O assistente tem `searched` (2 fontes, HTML de 400 caracteres e
`searched_at` com Z), depois `unavailable` (0 fontes, HTML nulo) e depois `null`.

Health, parando **somente** o container `bestprice-0047-qa-e2e`, com `curl` em
`/api/health` direto e pelo proxy da UI: **200** `{status:ok,database:ok}` → **503**
`{status:unavailable,database:unavailable}` (API e proxy) → **200** após `docker start`.

Falha de rede na UI: `page.route('**/api/ai/chat', abort)` mostrou o alerta "Não foi possível
conectar ao BestPrice. Tente novamente." e preservou o texto digitado. A requisição não chegou
ao backend, e o log da fronteira não tem a mensagem.

Migration (container descartável): `alembic upgrade 20261026research` deixou a coluna ausente
(0). `upgrade head` criou `grounding jsonb`, nullable, sem default. `downgrade -1` voltou a
`20261026research` sem a coluna. Um novo `upgrade head` levou a `20261104grounding`, e
`research_messages.relrowsecurity = t`.

## Matriz de aceite

| AC | Evidência (comando/observação) | Situação | Limite |
|---|---|---|---|
| AC01 | Jornada `on`: o POST `/api/ai/chat` respondeu 200 com `grounding.status=searched` e 2 fontes `{title,url}`. A fronteira recebeu `google_search`. Também há os testes `test_chat_with_web_search_sends_tool_and_returns_https_sources` (pytest). | demonstrado | O grounding é simulado; não há resposta real do Google |
| AC02 | `searched_at` `2026-11-04T19:09:17.681580Z` no contrato. A UI exibe "NÃO VERIFICADO" (texto "Não verificado" com CSS uppercase) e `04/11/2026, 16:09` em `America/Sao_Paulo`, igual a `Intl`. Com `off` e com `[qa-sem-fonte]` não há bloco. | demonstrado | — |
| AC03 | O prompt com busca, observado na fronteira e no teste `test_web_search_prompt_forbids_inventing_prices_and_treats_web_as_data`, proíbe inventar valores e eleger vencedor. Grounding sem fontes → `null`, sem bloco. | demonstrado na fronteira simulada | Que o modelo real obedeça à instrução não é verificável sem a conta real |
| AC04 | `[qa-429]`: exatamente 2 chamadas (com e sem `tools`), resposta 200 com `unavailable` e aviso "A pesquisa na web está indisponível agora; esta resposta não usou a web." Os testes pytest cobrem 500/503/ConnectError, o fallback que também falha (`ai_rate_limited`) e o 403 sem nova tentativa. | demonstrado | — |
| AC05 | Busca só com os dois flags: `AI_ENABLED=false` + web `true` → `web_search_enabled False`. Valor diferente de `true` ou ausente → `False`. Rodada `off` → `web_search:false`, sem `tools`. `.env.example` e Compose usam `false` por padrão. Não há chave em capabilities, `frontend/src` nem `frontend/dist` (grep de `GEMINI_API_KEY`, `x-goog-api-key` e `generativelanguage` sem resultado). Não há código de billing. | demonstrado | A ausência de cobrança na conta real não foi observada |
| AC06 | Cota local: a análise após 3 chats recebeu **429 `ai_rate_limited`, `Retry-After: 41`** e passou depois da espera. O replay do mesmo `request_id` devolveu o mesmo `grounding` e o mesmo id, com 0 chamadas. `DELETE` → 204, 0 mensagens, GET 404 e replay 404 sem chamada. Ao expirar a conversa (`expires_at` ← agora − 1 s; `expires_at − created_at = 90 days`), `purge_database()` retornou 1 e removeu a conversa e as mensagens com grounding. Os limites de tamanho estão no pytest. | demonstrado | A expiração foi forçada por SQL no banco descartável; a borda exata de 90 dias está coberta pelo pytest com relógio injetado |
| AC07 | Fontes `http://` e `javascript:` e a duplicata foram descartadas pelo backend. Os links têm `https`, `rel="noopener noreferrer"` e `target=_blank`, sem handler. O iframe usa `sandbox="allow-popups allow-popups-to-escape-sandbox"` e `referrerpolicy=no-referrer`. O `<script>` injetado no HTML **não executou** (`data-qa-script-ran=null`), e o Chromium registrou "Blocked script execution in 'about:srcdoc'". A fronteira só recebeu o endpoint Gemini, e o backend não requisitou as URLs das fontes. O navegador não fez requisições fora de 127.0.0.1. O limite de 32.000 caracteres está no pytest. | demonstrado | Não foi testado com HTML real do Google |
| AC08 | Com `web_search=true`, o aviso "Sua pergunta pode ser pesquisada pelo Google, e o fornecedor guarda a pergunta e a resposta por 30 dias." aparece no composer **antes** do envio, junto do aviso atual. Com `false`, fica ausente. | demonstrado | — |
| AC09 | Em 320/390/768/1280/1440, overflow 0, bloco dentro da largura e links ≥ 44 px. Tab/Shift+Tab chega à fonte, com outline `solid`. A fonte tem o nome acessível "… (abre em nova aba)", e o iframe tem `title`. O axe (WCAG 2A/AA, 2.1, 2.2AA) não encontrou violações no bloco, com o iframe excluído. Também passou `grounding.spec.ts`. | demonstrado | Não houve teste com leitor de tela nem dispositivo físico. A altura fixa de 72 px do iframe não foi validada com HTML real. |
| AC10 | `capabilities.model` = `gemini-2.5-flash-lite`. Todas as chamadas da fronteira (chat e análise) foram para `models/gemini-2.5-flash-lite`. A análise saiu com `tools: null`, e a resposta não tem `grounding`. | demonstrado | — |
| AC11 | Ruff, pytest (282), lint, build, Node (50), complexidade e testes de sucesso e erro (AC03/AC04) na fronteira simulada passaram. **Vitest completo falhou em 3 de 5 execuções** por intermitência preexistente em `App.test.tsx`. A sincronização de documentação (`product-context.md` e guias) ainda não foi conferida pelo `doc-sync-onboarding`. | **parcial** | Falta o gate frontend estável e o doc-sync |

## Achados

1. **Baixa severidade — `null` JSONB em vez de SQL NULL.** Mensagens do assistente sem busca
   (busca desligada, sem fontes ou `[qa-sem-fonte]`) são gravadas com `grounding = 'null'::jsonb`,
   não SQL NULL. A API devolve `null` normalmente, então o contrato não é afetado. Porém consultas
   `grounding IS NULL` não as encontram, o que diverge da intenção do plano ("`null`: sem busca") e
   da migration ("existing messages keep NULL"). Reprodução:
   1. Suba a API com o harness e `AI_WEB_SEARCH_ENABLED=false` (ou envie `[qa-sem-fonte] …` com `true`).
   2. Envie qualquer mensagem pelo chat.
   3. Rode `select role, grounding is null, jsonb_typeof(grounding) from research_messages order by created_at;`.
   4. Observado: `user|t|` (SQL NULL) e `assistant|f|null` (JSON null). Esperado pelo plano: SQL NULL.

   Causa provável (inferência): `JSON().with_variant(JSONB())` com `none_as_null=False`, que é o
   padrão do SQLAlchemy, ao gravar `None` vindo do service. Não foi corrigido.
2. **Intermitência de gate frontend (preexistente, fora do diff).** O teste `App.test.tsx > preserva
   preço desconhecido sem criar valor zero no detalhe` falhou em 3 de 5 execuções completas
   (`findByRole` com 1 s). Isolado, passou 3/3.
3. **Intermitência Playwright (preexistente, fora do diff).** `assistant.spec.ts › inicial`
   (`loaded: true` da imagem do robô) falhou uma vez em `viewport-1280` numa execução paralela.
   Isolado em `viewport-768`, passou 3/3.

## Recursos

- Criados e removidos pelo QA: o container `bestprice-0047-qa-e2e`, com volume anônimo, saiu por
  `docker rm -fv`. O uvicorn em 55480 foi encerrado e não responde mais.
- **Pendente de remoção:** o servidor Vite desta worktree (`npx vite --port 55473`) continuou
  respondendo em 127.0.0.1:55473 depois do encerramento da tarefa em segundo plano, e a
  inspeção do processo não foi autorizada. Encerre o processo `node`/vite manualmente.
  Ele não tem estado persistente.
- Reutilizado e preservado: `bestprice-0047-testdb`, criado pela tarefa backend e com limpeza
  prevista no `task-cleanup`.
- Nenhum outro container ou volume foi alterado.
