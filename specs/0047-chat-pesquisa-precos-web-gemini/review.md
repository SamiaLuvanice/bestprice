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
