# Evidência frontend — 0047

Worktree `.worktrees/feature-0047-issue-245-chat-pesquisa-precos-web`, branch
`feature/0047-issue-245-chat-pesquisa-precos-web`, 04/11/2026. Dados simulados na fronteira HTTP
(`fakeApi` no Vitest, `page.route` no Playwright); o backend real não foi exercitado.
Dependências instaladas com `npm ci` na worktree.

## Escopo implementado

- **F1** — `frontend/src/features/research/api.ts`: tipos `Grounding`/`GroundingSource`,
  `Message.grounding` e `Capabilities.web_search`. O validador aceita `null`, `searched`
  (instante UTC, ao menos uma fonte `https`, HTML de sugestões em string) e `unavailable`
  (`sources: []`, HTML `null`, `searched_at` opcional). Ele recusa URL não `https` (reusa
  `safeHttpsUrl`), status desconhecido e combinações fora do contrato. A ausência do campo
  (mensagens anteriores) é normalizada para `null`, e a ausência de `web_search`, para `false`.
- **F2** — `frontend/src/features/research/MessageGrounding.tsx`: rótulo "Não verificado",
  "Pesquisado em" com `<time dateTime>` formatado por `Intl.DateTimeFormat('pt-BR')` no fuso
  do navegador, e lista de fontes com `<a target="_blank" rel="noopener noreferrer">`, sem
  handler de clique e com nome acessível "<título> (abre em nova aba)". O iframe usa
  `srcDoc` com o HTML intacto, `sandbox="allow-popups allow-popups-to-escape-sandbox"`,
  `referrerPolicy="no-referrer"`, `title="Sugestões de pesquisa do Google"` e altura fixa de
  72px. Para `unavailable`, mostra o aviso; para `null`, nada.
- **F3** — `AssistantPage.tsx` + `common.tsx` (`webSearchNotice`): com
  `capabilities.web_search === true`, o aviso do composer acrescenta "Sua pergunta pode ser
  pesquisada pelo Google, e o fornecedor guarda a pergunta e a resposta por 30 dias.". CSS em
  `assistant.css` só com tokens existentes (`--color-surface-raised`, `--color-border-soft`,
  `--radius-md`, `--color-brand` etc.), links com `min-height:44px` e foco pelo
  `:focus-visible` global. Nenhuma dependência nova (`lucide-react` já existia).

## Red → Green

Comando: `npx vitest run src/features/research/api.test.ts src/assistant.test.tsx`.

- **Red** (antes da implementação): 13 testes falharam, todos pelo motivo esperado.
  - Ausência → `null`: `expected [ undefined, undefined ] to deeply equal [ null, null ]`.
  - 8 casos "recusa grounding fora do contrato": `promise resolved ... instead of rejecting`.
  - `web_search` ausente: `expected undefined to be false`.
  - Bloco com busca: `Unable to find ... role "region" and name "Fontes da pesquisa na web"`.
  - Indisponível: `Unable to find an element with the text: A pesquisa na web está indisponível agora...`.
  - Aviso de privacidade: `Unable to find an element with the text: /pode ser pesquisada pelo Google/`.
  - Passaram já no Red, como guardas de regressão: o teste "aceita grounding pesquisado,
    indisponível e nulo" (o validador antigo ignorava campos extras) e "não mostra bloco
    quando grounding é nulo/ausente".
- **Green:** `Test Files 2 passed (2) · Tests 32 passed (32)`.

## Gates (F4)

| Comando (em `frontend/`) | Resultado |
|---|---|
| `npm run lint` | exit 0, sem problemas. A primeira execução apontou `no-unused-vars` no teste novo, corrigido. |
| `npm test -- --run` | `Test Files 35 passed (35) · Tests 413 passed (413)`. Numa execução anterior, `App.test.tsx > preserva preço desconhecido sem criar valor zero no detalhe` estourou o tempo (6,4s) sob carga; isolado passou, e a reexecução completa ficou verde. É um teste de dashboard, fora da área alterada. |
| `npm run build` | exit 0 (`tsc -b && vite build`, `✓ built`). |

## Validação visual (Playwright local)

Spec nova `frontend/tests/visual/grounding.spec.ts`, sem baseline de screenshot. Roda no projeto
`viewport-1280` e percorre as larguras 320/390/768/1280/1440 com `setViewportSize`. Ela
verifica: sem scroll horizontal, iframe dentro do bloco, links de fonte com altura de pelo
menos 44px, foco visível (outline diferente de `none`), ordem de Tab entre as fontes e axe sem
violações. O iframe do Google fica excluído do axe, porque o conteúdo não é nosso e não pode
ser alterado. A spec também confere o aviso de `web_search` e salva capturas.

- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5199 npx playwright test grounding.spec.ts --project=viewport-1280`
  → `1 passed`. Na primeira execução, o limite de 30s estourou no axe (arranque frio do
  servidor); a spec passou a usar `test.setTimeout(120_000)`.
- Regressão do Assistente: `npx playwright test assistant.spec.ts grounding.spec.ts`
  → `32 passed, 3 skipped, 1 failed`. A falha foi `[viewport-768] inicial`, no `loaded: true`
  da imagem do robô, sob execução paralela. Reexecutado isoladamente: `1 passed`. A tela
  inicial não foi alterada.
- As capturas (`grounding-{320,390,768,1280,1440}.png`) ficam em `frontend/test-results/`, que
  é ignorado pelo Git e não foi versionado. As de 320 e 1280 foram inspecionadas: bloco dentro
  da coluna, título longo quebrando linha e chips de sugestão visíveis.

## Correções da revisão (review.md I3/S2)

**Commit `7b45d87`.** O `srcDoc` do iframe passa a ser este prefixo fixo, seguido do HTML do
Google intacto: `'<base target="_blank"><meta name="referrer" content="no-referrer">' + html`.
O sandbox continua igual. Assim os chips sem `target` abrem em nova página, em vez de navegar
o iframe (que o Google recusa por `X-Frame-Options`). O documento `srcdoc` também deixa de
herdar a política de referrer da SPA.

- **Red:**
  - Vitest (`assistant.test.tsx`, teste "mostra fontes…"): `srcdoc.startsWith(prefix)`
    → `expected false to be true`.
  - Playwright (`grounding.spec.ts`, teste novo "chip de sugestão do Google abre em nova
    página…"): `TimeoutError: page.waitForEvent: Timeout 5000ms exceeded while waiting for
    event "popup"`.
- **Green:**
  - Vitest: o teste novo passou (1 passed).
  - Playwright: `2 passed`. O popup abre em
    `https://www.google.com/search?q=notebook+pre%C3%A7o`, atendido por `context.route`
    local, sem sair da máquina. A requisição sai sem cabeçalho `Referer` e o iframe continua
    em `about:srcdoc`.

**Teste instável fora do diff:** `App.test.tsx > preserva preço desconhecido sem criar valor
zero no detalhe`. O arquivo do teste e `dashboard/AccountArea.tsx` são idênticos aos de
`origin/develop` (`git diff --stat origin/develop` vazio), então a instabilidade não nasce
desta branch.

- Isolado (`npx vitest run src/App.test.tsx`), passou 5 de 5 vezes (23/23).
- Testei `{ timeout: 5000 }` no `findByRole` e no `findByText` desse teste. A suíte
  completa ainda falhou 1 vez em 5. No DOM da falha, a tela continuava em
  "Carregando produto…" depois de 5s, embora o dublê responda com `Promise.resolve`.
- Ou seja, a causa não é só um timeout curto: o detalhe não sai do carregamento sob carga
  (havia outros processos node/python ativos na máquina, incluindo o backend em paralelo).
- Por isso a alteração foi **revertida e não versionada**. O teste e o código de produção
  ficaram inalterados.
- A investigação de `open()` / `openSequence` em `AccountArea.tsx` sob carga fica como
  pendência separada, fora da 0047.

**Gates após a correção** (em `frontend/`):

| Comando | Resultado |
|---|---|
| `npm run lint` | exit 0 |
| `npm test -- --run` ×3 | 35/35 arquivos e 413/413 testes nas três execuções |
| `npm run build` | exit 0 |
| `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5199 npx playwright test grounding.spec.ts --project=viewport-1280` | `2 passed` |

## Desvios e limites

- `unavailable` aceita `searched_at` ausente, `null` ou instante. O contrato o mostra no
  formato geral, mas não o exige nesse status. É uma tolerância deliberada para não quebrar a
  integração.
- A normalização `grounding`/`web_search` ausentes ocorre dentro do type guard, que muta o
  objeto recebido. Assim, a assinatura de `request()` não muda.
- Altura do iframe fixa em 72px: o `renderedContent` real do Google costuma ser um carrossel
  horizontal de uma linha. Com HTML real mais alto, pode haver corte interno. Isso só pode ser
  validado com a conta real (pendência).
- Não há frame Figma para este bloco (plan.md). O bloco segue os tokens e o padrão das
  mensagens existentes.
- Pendências: integração ponta a ponta com o backend da 0047, verificação com o HTML real do
  Google e tema escuro (o produto usa tema claro fixo, spec 0016).
