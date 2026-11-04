# Revisão independente — 0047

Revisor: papel `arch-reviewer` (`.agents/agents/arch-reviewer.md`). Data: 04/11/2026.
Escopo: `git diff origin/develop...HEAD` (a63d07d..c336a1d), somente leitura, exceto este arquivo.
Referências usadas: spec.md, plan.md, `.agents/rules/architecture.md`, `backend.md`, `errors.md`, `security.md`,
`frontend.md`, `datetime-pipeline.md`, `testing.md` e `complexity.md`.

## Gates conferidos pelo revisor

| Comando | Resultado |
|---|---|
| `uv run ruff check .` (backend) | All checks passed! |
| `uv run pytest -q tests/test_research_grounding.py tests/test_research_provider.py tests/test_research_http.py` | 77 passed |
| `python .agents/skills/cyclomatic-complexity/scripts/complexity_report.py backend/app --changed origin/develop` | Nenhum bloco >= D. Os dois blocos C são testes preexistentes. |
| `npx vitest run src/features/research src/assistant.test.tsx` (frontend) | 3 arquivos, 41 passed |

Não reexecutei: a suíte PostgreSQL (`test_research_integration.py`), o build do frontend, o Playwright visual nem
a chamada real ao Gemini. Para esses itens, a evidência é a registrada em `backend-evidence.md` e `frontend-evidence.md`.

Sondagens feitas pelo revisor, sem alterar o código:

- `MessageOutput.model_validate({...})` sem a chave `grounding` gera `ValidationError: grounding Field required`.
- `extract_grounding` com `webSearchQueries` e `searchEntryPoint` presentes e só fontes `http` devolve `None`.

## Achados

### Bloqueante

Nenhum.

### Importante

**I1 — Replay de tentativa anterior à 0047 retorna 500.** `backend/app/research/schemas.py:113`.
`grounding: GroundingOutput | None` não tem default e, no Pydantic v2, isso torna o campo obrigatório.
`AIRequest.result` guarda o `ChatOutput` serializado no momento da conclusão. Os resultados gravados antes do
deploy não têm a chave `grounding`. Cenário: a pessoa envia uma mensagem, perde a resposta por falha de rede,
a versão nova sobe e o cliente reenvia o mesmo `request_id` dentro de 24 h. `replay_attempt` devolve o dict
antigo, `response_model=ChatOutput` falha na validação e a API responde 500 em vez do replay idempotente. Isso
quebra a promessa de contrato "somente adição, compatível" do plano e o AC06 (idempotência). A janela é curta,
mas o caso é real. Correção: `grounding: GroundingOutput | None = None` e um teste HTTP de replay com um
`result` sem a chave.

**I2 — Resposta que pesquisou na web pode ser exibida sem sugestões e sem o rótulo.**
`backend/app/research/grounding.py:31-34`. Quando o modelo pesquisou (`webSearchQueries` e
`searchEntryPoint.renderedContent` presentes) mas nenhuma fonte passa no filtro, porque os chunks vieram
vazios ou só com `http`, `extract_grounding` devolve `None`. O texto, que pode trazer preços tirados da web,
aparece como resposta comum: sem "Não verificado", sem data e sem as sugestões do Google. Isso contraria os
termos listados na spec, que exigem exibir o resultado fundamentado junto das sugestões, e o AC02. Correção
proposta: decidir pela presença de `searchEntryPoint` ou de `webSearchQueries`, não só pelas fontes. Se houve
pesquisa, uma de duas: (a) `status: "searched"` com as sugestões, o que exige relaxar no contrato e no validador
do frontend a regra "ao menos uma fonte"; ou (b) tratar o caso como grounding inválido e acionar o fallback sem
`tools`. A opção (b) mantém o contrato atual. Teste: metadata com `webSearchQueries` e `searchEntryPoint`, mas
sem chunks `https`.

**I3 — Chips de sugestão do Google provavelmente não funcionam ao clicar.**
`frontend/src/features/research/MessageGrounding.tsx:20-21`. Pela documentação pública, o `renderedContent`
do Google traz âncoras `<a class="chip" href="https://www.google.com/search?...">` sem `target`. No iframe com
`sandbox="allow-popups allow-popups-to-escape-sandbox"`, um link sem `target="_blank"` navega o próprio iframe.
O `www.google.com` recusa enquadramento (`X-Frame-Options`), e o bloco de 72 px mostra a página de erro.
`allow-popups` só tem efeito quando o link abre outra janela. As fixtures do Vitest e do Playwright não clicam
nos chips, e a conta real não foi testada, então o problema não aparece nos testes. Correção: envolver o
conteúdo sem alterá-lo, com `srcDoc={'<base target="_blank"><meta name="referrer" content="no-referrer">' + html}`.
O `<meta referrer>` também resolve S2. Confirme o formato real na primeira chamada à conta operadora. Teste:
o `srcdoc` contém `<base target="_blank">` e termina com o HTML original byte a byte.

**I4 — O fallback não cobre falhas do grounding que não sejam 429 ou 5xx.** `backend/app/research/provider.py:74`
e `:101`. O AC04 diz "se o grounding falhar ou estiver sem cota (429)". O plano restringiu o fallback a 429 e 5xx,
e a implementação ainda acrescentou erros de transporte. Cenário provável: o Google retira o grounding do free
tier do `2.5-flash-lite` ou recusa a ferramenta para o projeto, e a API devolve 400 ou 403
(`FAILED_PRECONDITION` ou `PERMISSION_DENIED` ligado à ferramenta). Com `AI_WEB_SEARCH_ENABLED=true`, **todo** o
chat livre passa a responder `ai_unavailable` até alguém desligar a flag, quando bastaria seguir sem busca. Pelo
mesmo motivo, uma resposta 200 com grounding inválido (HTML acima de 32.000 caracteres ou sem
`searchEntryPoint`) vira 502 em vez de fallback. Correção: acionar o fallback também em 400 e 403 da chamada
com `tools`. O custo é uma requisição extra no caso de 400 de conteúdo, que falharia de novo e manteria o erro
existente. Avalie incluir `InvalidGroundingError` no fallback. Registre a decisão na spec ou no plano, porque
hoje o texto do AC04 e o código divergem.

### Sugestão

**S1 — O orçamento de 90 s não é garantido.** `backend/app/research/provider.py:97`. `httpx.Client(timeout=25)`
aplica 25 s a cada fase (connect, write, read entre bytes e pool), não ao total. Com fallback, o pior caso
teórico de duas chamadas passa de 90 s. Nesse caso, `ensure_active_attempt` descarta a resposta pronta com
`ai_timeout`. Não há corrupção, porque o tombstone e o estado ficam consistentes, mas a cota é gasta à toa. O
comentário do código e o `backend-evidence.md` afirmam "pior caso 50 s", e isso não procede. Correção: um prazo
total, com o fallback recebendo o tempo restante (`deadline - monotonic()`), ou um `httpx.Timeout` menor para o
fallback.

**S2 — Referrer nos chips.** `MessageGrounding.tsx:21`. `referrerPolicy="no-referrer"` no iframe vale só para
a requisição de `src`. Um documento `srcdoc` herda a política do documento pai, então a navegação a partir
dos chips envia a origem do BestPrice ao Google. O AC07 pede "sem rastreamento". Use o `<meta name="referrer">`
de I3.

**S3 — Validadores do frontend com efeito colateral.** `frontend/src/features/research/api.ts:43` e `:71`.
Os type guards preenchem `grounding = null` e `web_search = false` no objeto recebido. Hoje é inofensivo:
o objeto vem fresco de `response.json()`, e os testes cobrem a ausência dos campos. O problema é que um type
guard que muta engana quem o lê, e outro chamador, como um cache ou dados reutilizados, receberia o objeto
alterado sem esperar. A mutação também roda em `capabilities` mesmo quando o restante é inválido. Aceitável
para esta entrega. Como melhoria, normalize numa etapa explícita depois da validação, com
`withDefaults(raw)` seguido de `guard(value)`, ou documente o contrato do helper.

**S4 — Uma fonte inválida derruba a conversa inteira.** `api.ts` `source()` × `backend/app/research/grounding.py:61`.
O backend aceita qualquer `uri` `https` com host segundo `urlsplit`, mas o frontend revalida com `new URL()`.
Uma URL que o `urlsplit` aceita e o WHATWG rejeita, como um host com espaço ou caracteres inválidos, faz
`researchApi.conversation` falhar com `invalid_response`. Com isso, a conversa fica inacessível por até 90 dias.
A chance é baixa, porque as URIs vêm do Google. Correção: validar no backend com a mesma regra
(`urlsplit` mais host sem espaços ou caracteres de controle) ou descartar a fonte inválida no cliente em vez de
recusar a mensagem.

**S5 — Validade dos links de fonte.** As `groundingChunks[].web.uri` da Gemini API costumam ser redirecionadores
do Google (`vertexaisearch.cloud.google.com/grounding-api-redirect/...`), com título igual ao domínio. É
possível que expirem antes dos 90 dias de retenção. Isso não foi verificado, porque não houve chamada real.
Registre como pendência da validação com a conta operadora.

**S6 — Cota.** Com fallback, uma unidade da cota local (60/dia) pode gerar duas requisições ao Google. Isso
ainda fica abaixo das 500 RPD com grounding, mas vale anotar no plano ou nos riscos, porque "sem custo
extra" vale para cobrança, não para o consumo de cota do fornecedor.

## Pontos conferidos sem achado

- A migration `20261104grounding` encadeia em `20261026research` de forma linear. É aditiva, com
  `nullable=True` e sem default, então não reescreve a tabela, e tem downgrade com `drop_column`. A coluna fica
  na própria linha de `research_messages`, então expira e é excluída em cascata com a conversa.
- `searched_at` é carimbado no service com o relógio injetado, em UTC com `Z`. O frontend mostra a data com
  `Intl` no fuso local.
- Prompt injection: o conteúdo da web entra só pelo modelo. O texto é renderizado com escape do React (`<p>`),
  o backend nunca faz requisições às URIs e os dois prompts declaram que conteúdo citado é dado.
- Segredos: a chave vai só no header `x-goog-api-key`. Não aparece no corpo, nem em `capabilities`, nem em logs
  do diff. `web_search_enabled` exige `available`, ou seja, `AI_ENABLED` e uma chave configurada.
- A análise de comparação não envia `tools`. Há teste para isso, e o modelo `gemini-2.5-flash-lite` é único.
- As rotas são `def` síncronas, então o FastAPI as roda em threadpool e o event loop não fica bloqueado.
- No sandbox, sem `allow-scripts`, `allow-same-origin` e `allow-forms`, o HTML de terceiros não executa JS, não
  acessa a origem do app e não envia formulários. O limite de 32.000 caracteres e o teto de 160 KB no corpo são
  aplicados no backend. Não há CSP no `nginx.conf` que bloqueie o `<style>` inline do `srcdoc`.
- Os links de fonte usam `target="_blank"`, `rel="noopener noreferrer"`, só `https` (validado nas duas pontas)
  e não têm handler de clique. Também não há página intermediária.
- Os testes cobrem sucesso e erro principal na fronteira simulada (429, 5xx, transporte, falha do fallback e 403
  sem nova tentativa), mais replay HTTP e PG e capabilities. Contagens positivas.

## Veredito

**Aprovar com ajustes.** Corrigir I1 e I2 antes do merge. Ambos são pequenos e quebram AC06 e AC02 e os termos
do Google em cenários plausíveis. Corrigir I3 ou validá-lo com um payload real antes de ativar
`AI_WEB_SEARCH_ENABLED` em qualquer ambiente. Para I4, alinhar spec e código, de preferência ampliando o
fallback. As sugestões podem virar follow-up. Esta revisão não substitui o QA nem a validação com a conta real
do Gemini, que continua pendente.

## Revisão das correções

Revisor: papel `arch-reviewer`. Data: 04/11/2026. Escopo: `git diff 4c26b6c~4 4c26b6c -- backend frontend`
(commits 7b45d87 e 96a7cc0), somente leitura, exceto este arquivo. Referências: achados acima, `spec.md` AC04
(texto já atualizado), `plan.md` seção "Fallback" e o bug de `null` JSONB de `verification.md`.

### Gates reexecutados pelo revisor

| Comando | Resultado |
|---|---|
| `uv run ruff check .` (backend) | All checks passed! |
| `uv run pytest -q tests/test_research_grounding.py tests/test_research_provider.py tests/test_research_http.py` | 93 passed (antes 77) |
| `TEST_DATABASE_URL=postgresql://bestprice:***@127.0.0.1:55447/bestprice_test uv run pytest -q -p no:cacheprovider tests/test_research_integration.py` | 11 passed (PG real, container `bestprice-0047-testdb`) |
| `python .agents/skills/cyclomatic-complexity/scripts/complexity_report.py backend/app --changed 4c26b6c~4` | Nenhum bloco >= D. Os únicos blocos C são os mesmos dois testes preexistentes; nada piorou. |
| `npx vitest run src/assistant.test.tsx src/features/research` (frontend) | 3 arquivos, 41 passed |

Não reexecutei o Playwright (`grounding.spec.ts`, inclusive o teste novo do chip), o build do frontend nem a
chamada real ao Gemini. Para o Playwright, vale a evidência de `frontend-evidence.md` ("2 passed", popup aberto).
O Red dos testes novos foi conferido apenas pelo registro em `backend-evidence.md`. Pela leitura do diff, cada
teste novo falharia no código anterior pelo motivo registrado.

### Veredito por item

- **I1 — corrigido e provado.** `schemas.py:114` agora tem `= None`. O teste
  `test_replay_of_result_saved_before_grounding_still_succeeds` remove a chave `grounding` das duas mensagens do
  `result` gravado e confirma 200, corpo igual ao original e uma única geração.
- **I2 — corrigido e provado (opção b).** `grounding.py:32-37`: com sinal de busca (`groundingChunks`,
  `webSearchQueries` ou `searchEntryPoint`) e sem fonte `https` válida, a função levanta `InvalidGroundingError`,
  e o provider aciona o fallback com `unavailable`. O contrato `searched` (>= 1 fonte e HTML) continua igual, e o
  validador do frontend não mudou. Os testes cobrem: sem metadata, metadata vazia e listas vazias (sem busca, `None`),
  busca sem fonte, busca só com `http`, só `webSearchQueries` e fontes válidas sem HTML ou com HTML grande demais.
- **I3 — corrigido; provado na fronteira local.** `MessageGrounding.tsx:6` e `:23` usam um prefixo fixo, e o HTML
  do Google vem depois, sem alteração. No parsing, `<base>` e `<meta>` vão para o `<head>` implícito antes do
  `<style>` do Google, e o `<div>` abre o `<body>`. A ausência de DOCTYPE não muda nada, porque documentos
  `srcdoc` são no-quirks por definição e o HTML original também não tinha DOCTYPE. Um `target` explícito no HTML
  do Google continuaria valendo sobre o `<base>`. O Vitest confere o prefixo e o HTML byte a byte, e o Playwright
  confere o popup, o iframe ainda em `about:srcdoc` e a ausência de `Referer`. Falta confirmar com o
  `renderedContent` real.
- **I4 — corrigido; spec, plano e código alinhados.** `provider.py:82-92`: qualquer `httpx.HTTPError` ou `ApiError`
  da chamada com `tools` gera uma nova tentativa, sem `tools`. Isso inclui 400, 403, timeout e 200 com grounding
  inválido, porque `InvalidGroundingError` é `ValueError` e vira `ApiError(502)` em `parse_response`. Sobre o risco
  de um 400 permanente ficar mascarado: um 400 de conteúdo falha de novo sem `tools` e devolve o erro existente
  (`ai_unavailable`), e o teste `test_fallback_failure_after_any_grounding_failure_uses_existing_errors` prova isso.
  Nada é mascarado. O custo é uma chamada extra. O risco que sobra é de observabilidade (ver N1).
- **S1 — corrigido, dentro do que o httpx permite.** O deadline é monotônico e injetável
  (`deadline = monotonic() + 50`). O fallback recebe `min(25, restante)` e é pulado com `ai_timeout` quando restam
  menos de 5 s. A ordem dos cálculos está correta, e o `remaining` é medido depois da primeira chamada. Os testes
  conferem os timeouts por fase enviados (25 e depois 20) e o caminho de orçamento esgotado (uma chamada só). O
  comentário do código e o plano agora dizem, corretamente, que o limite vale por fase. Um servidor que manda os
  bytes muito devagar ainda pode passar de 50 s. Nesse caso, a janela de 90 s do attempt continua protegendo a
  consistência.
- **S2 — corrigido**, pelo mesmo `<meta name="referrer" content="no-referrer">`. O Playwright observou
  `referer` indefinido na navegação para `www.google.com`.
- **Bug `null` JSONB — corrigido e provado no PG real.** `models.py:52-54`: `none_as_null=True` vale só para a
  coluna `grounding`. `AIRequest.result` e as outras colunas JSON não mudam. Não há migration, porque o tipo do banco
  é o mesmo, e o `alembic check` está limpo segundo `backend-evidence.md`. O teste
  `test_messages_without_search_store_sql_null_not_json_null` passou aqui. Linhas antigas com `'null'::jsonb` só
  existem em bancos locais, porque a coluna não está em `origin/develop`, e mesmo assim são lidas como `None`.
  Nenhum código filtra por `grounding IS NULL`.

### Achados novos

Nenhum bloqueante nem importante.

- **N1 (Sugestão) — Fallback silencioso.** `backend/app/research/provider.py:85-86`: `except (httpx.HTTPError,
  ApiError): pass` não registra nada. Se o Google recusar a ferramenta de forma permanente (400/403 ligado ao
  `google_search`), cada mensagem passa a custar duas requisições ao fornecedor e mostra "pesquisa indisponível",
  e o operador não recebe nenhum sinal para desligar `AI_WEB_SEARCH_ENABLED` ou investigar. Sugestão:
  `logger.warning` só com o status HTTP ou a classe da exceção, sem corpo, chave ou prompt, como já faz
  `cleanup.py`.
- **N2 (Sugestão) — Erro do orçamento esgotado.** `provider.py:88-89`: quando a chamada com `tools` falha de forma
  lenta (por exemplo, 429 depois de mais de 45 s), a resposta é `ai_timeout`, sem `retry_after_seconds`, e não
  `ai_rate_limited`. É um caso raro, e a mensagem continua honesta. Só registro.
- **Observação (sem ação):** com `allow-popups-to-escape-sandbox` e sem `noopener` nos chips, a página do Google
  aberta recebe `window.opener`, que aponta para o iframe sandboxed de origem opaca. Ela só conseguiria navegar o
  iframe, não a SPA. O risco é aceitável, porque o destino é o próprio Google e o HTML não pode ser alterado pelos
  termos.

### Veredito

**Aprovar.** I1, I2, I3, I4, S1, S2 e o bug de `null` foram corrigidos, com testes que executaram e contagens
positivas, sem regressão de contrato nem de complexidade. N1 vale como follow-up de baixo custo antes de ativar
`AI_WEB_SEARCH_ENABLED` em stage. As pendências de S3 a S6 e a validação com a conta real do Gemini (formato do
`renderedContent`, validade das URIs de redirecionamento) continuam abertas. Esta revisão não substitui o QA.
