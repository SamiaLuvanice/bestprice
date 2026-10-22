# Verificação — 0028

Worktree `.worktrees/feature-0028-issue-157-ajustes-auditoria-redesign`, branch
`feature/0028-issue-157-ajustes-auditoria-redesign`, base `origin/develop` em `fb71646`.
Data: 21/10/2026. Papel: frontend. Backend e contrato REST não foram alterados.

Ambiente da suíte visual: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5181` e
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` apontando ao Chromium já instalado
(`ms-playwright/chromium-1234`). A configuração padrão do repositório não mudou.

## Linha de base antes das mudanças

- `npx vitest run`: 1ª execução **1 failed | 298 passed (299)** (falha intermitente por
  tempo sob carga); 2ª execução **299 passed (299)**.
- `npx playwright test --workers=3`: **42 passed, 6 failed**. As 6 falhas eram a landing
  em `public-pages.spec.ts` (3 viewports × 2 temas): `waitForFunction` estourava 30 s.
  Causa observada depois: o banner `loading="lazy"` nunca entrava na tela porque a landing
  usa `scroll-behavior: smooth` e o teste rolava em passos de 50 ms (`currentSrc` vazio,
  `complete: false`). Corrigido no teste com rolagem instantânea.

## TDD (Red → Green)

| AC | Teste | Red observado | Green |
|---|---|---|---|
| AC02 | `src/lib/targetPrice.test.ts` | `Failed to resolve import "./targetPrice"` (módulo inexistente) | 25 casos passam |
| AC02 | `detail.test.tsx` › cria com vírgula | placeholder era `99.90` | POST envia `{"target_price":"99.90"}` |
| AC02 | `detail.test.tsx` › recusa inválido | texto de erro ausente e chamada inesperada à API (`99,999` chegava ao fetch) | erro local, `aria-invalid`, nenhum POST |
| AC02/AC06 | `detail.test.tsx` › alvo atual com vírgula | rótulo `Novo valor desejado` inexistente | campo mostra `99,90`; `1.899,90` envia `"1899.90"` |
| AC06 | `detail.test.tsx` › pausa sem depender do campo | mesmo botão mudava de função | `Pausar alerta` envia `{enabled:false}` com texto no campo; `Excluir` é `outline`; `Parar de monitorar` é `destructive` |
| AC06 | `detail.test.tsx` › metadados agrupados | sem `Detalhes da consulta` | `<details>` fechado; "sem frete" aparece 1 vez |
| AC07 | `PriceHistoryChart.test.tsx` › eixo | `formatAxisPrice is not a function` | `R$ 1.900`, `R$ 1.899,90`, sem "mil"; legenda sem "sem frete" |
| AC09 | `states.test.tsx` › estado vazio | indicadores `0,0,0,0` presentes | região de resumo ausente sem produtos |
| AC14 | `App.test.tsx` › verificação de sessão | `Found multiple elements with the role "status"` (status do formulário de link presente) | só marca, status e "Tentar novamente"; nenhum `textbox` |
| AC05 | `products.test.tsx` › Adicionar anúncio | título "Comece por um link" e campo visíveis | botão `aria-expanded` abre e foca o campo |
| AC10 | `products.test.tsx` › pílula | pílula continha "vs. preço anterior" | rótulo fora do `data-slot="badge"` |
| AC04 | `src/tokens.test.ts` (executado contra o `styles.css` de `HEAD` antes da troca) | 3 falhas: conflitos `--color-muted`, `--color-border`, `--color-primary`; `--primary` verde; regra corretiva `[data-variant="link"] { color }` | 3 passam com o novo stylesheet |

Testes existentes ajustados por mudança intencional de comportamento: rótulo do campo de
edição (`Novo valor desejado`, com valor pré-preenchido), metadados como `dt/dd`
(`products.test.tsx`), `hero.test.tsx` e `refresh-row.test.tsx` abrindo "Adicionar anúncio"
em Produtos, e `App.test.tsx`/`states.test.tsx` conforme AC14/AC09.

## Intermitência do Vitest (investigada)

Com `asyncUtilTimeout` de 3000 ms, a suíte inteira falhou de forma intermitente em testes
variados, sempre no limite de 3 s de `findBy`/`waitFor`:

- Linha de base (antes da 0028): 1ª execução `1 failed | 298 passed`; 2ª `299 passed`.
- Durante a 0028, 6 execuções da suíte inteira: 3 com `340 passed`, uma com
  `routes.test.tsx › preserva o destino protegido durante login e recarga` (3030 ms), uma com
  esse mesmo teste (4513 ms) e `App.test.tsx › preserva preço desconhecido sem criar valor zero
  no detalhe` (3042 ms).
- Isolados: `App.test.tsx` + `routes.test.tsx` 5× seguidas, **33 passed (33)** em todas;
  `routes.test.tsx` sozinho 3×, **17 passed (17)**.

Conclusão: espera de teste curta para a carga dos workers em paralelo, não regressão
(testes diferentes, passam isolados, padrão já presente na linha de base). Ajuste:
`asyncUtilTimeout` de 3000 → 6000 ms em `src/test-setup.ts` (o `testTimeout` continua
15 s; um estado que nunca aparece ainda reprova). Depois do ajuste, 3 execuções seguidas da
suíte inteira: **340 passed (340)** em todas.

A landing em `public-pages.spec.ts` também falhou 1 vez em 18 com a rolagem instantânea
(imagem lazy ainda não iniciada). O auxiliar passou a trocar as imagens para `eager` e
aguardar `decode()`, como já fazia `redesign.spec.ts`.

## Gates finais (após as correções pós-revisão, `71267b3`)

- `npm run lint`: passou, 0 erros e 0 avisos.
- `npm test -- --run`: **348 passed (348)**, 31 arquivos, em 2 execuções seguidas.
- `npm run build`: TypeScript e Vite passaram; Recharts segue em chunk lazy.
- `npm run test:visual -- --workers=3`: **63 passed (1,2 min)**, sem `--update-snapshots`:
  18 capturas públicas, 30 cenários com axe (`wcag2a/2aa/21a/21aa/22aa`), sonda de cores (3),
  imagem do detalhe com título longo (6), linha compacta de Produtos (3) e alinhamento dos
  vazios em Alertas (3).
- `git diff --check origin/develop..HEAD`: passou. Porta 5181 sem processo ao final; o
  servidor Vite do Playwright é encerrado pelo próprio Playwright.
- Hooks `pre-commit` passaram em todos os commits; nenhum `--no-verify`.

Baselines: as 12 capturas de landing e login foram regeneradas intencionalmente com
`--update-snapshots` e conferidas visualmente (landing 320/1280, login 1280) contra os
quadros 01/02/08; as 6 de rota inexistente não mudaram. Execução limpa posterior: 57/57.

## Imagens (AC03)

| Arquivo | Antes | Depois | Dimensões finais |
|---|---|---|---|
| `hero-person` | PNG 1.598.387 B (1774×887, ⅓ transparente à esquerda) | WebP 70.734 B | 1120×682 (recortado ao conteúdo) |
| `login-left` | PNG 1.660.601 B (1024×1536) | WebP 46.720 B | 960×1440 |
| `footer-phone` | PNG 1.431.980 B (2168×725) | WebP 47.458 B | 1600×548 |
| `dashboard-preview` | SVG 279.594 B (2 PNG embutidos) | SVG 9.215 B; após a revisão, WebP 27.708 B | 1872×737 (1,5×) |
| `price-preview` | SVG 1.519 B (embutido no JS) | WebP 15.944 B (após a revisão) | 1012×402 (2×) |
| `logo-bestprice.png` (cópia da SPA) | 491.530 B (1254×1254) | 9.865 B | 128×128, sem perda; original em `designsystem/` |

Conversão com Pillow 12.3 (Python 3.13), `quality` 78–88, `method=6`; as prévias SVG foram
renderizadas pelo Chromium local antes da conversão. `dist/assets` após o build final:
maior imagem 70.734 B (`hero-person`); nenhuma acima de 300 KB. O hero mantém `fetchPriority="high"`
e passou a declarar as dimensões reais (`1120×682`, antes `1024×1024`). Removidos:
`assets/landing/*.webp` (9 arquivos) e `assets/imagem-lateral.png`, sem importação (grep).

## Matriz de aceite

| AC | Situação | Evidência | Limite |
|---|---|---|---|
| AC01 | Feito | Playwright: imagem 80×80 com título longo em 320 e 390 px; `flex: none` | Desktop 140×140 conferido por captura |
| AC02 | Feito | Testes de normalização e de criação/edição; contrato inalterado | Sem chamada real ao backend nesta tarefa |
| AC03 | Feito | Tabela acima e `dist/assets` | — |
| AC04 | Feito | `tokens.test.ts`; Playwright confere `bg-primary`/`text-primary` `rgb(199,0,94)`, `text-muted-foreground` `rgb(98,98,103)`, `bg-muted` `rgb(245,245,247)`, `bg-action` verde com texto preto; README | `text-muted` = `--muted-foreground` desde a correção 4 (pós-revisão) |
| AC05 | Feito | Teste de Produtos compacto; após a correção 3, linha ≤ 140 px em 390 px (~80 px em 320 px), h1 único | Abaixo de 960 px a linha omite disponibilidade, menor preço, horários, ⋮ e selo de alerta (todos no detalhe) |
| AC06 | Feito | Testes de controles e metadados; captura do detalhe | — |
| AC07 | Feito | Teste do formatador; captura com eixo `R$ 375 … R$ 275` | Marcas são coordenadas do Recharts; valor exato no tooltip/tabela |
| AC08 | Feito | Captura 320 de Alertas: título, alvo e estado em grade | No celular o link "Configurar alerta" fica oculto (o título leva ao mesmo detalhe) |
| AC09 | Feito | Teste e captura do estado vazio | — |
| AC10 | Feito | Teste da pílula; captura 1280 | No celular o rótulo fica só para leitores de tela |
| AC11 | Feito | Baseline da landing 1280: rosto e celular visíveis | Comparado ao quadro 01 local |
| AC12 | Feito | Playwright: borda do cabeçalho = borda do conteúdo (±1 px) em 320/768/1280 | — |
| AC13 | Feito | Arquivos removidos; regras mortas removidas | `.detail-backdrop` **estava em uso** (fundo do diálogo de parada): foi renomeado para `.dialog-backdrop` e unificado |
| AC14 | Feito | Teste de App na verificação e na falha da sessão | — |
| AC15 | Feito | axe `wcag2a/2aa/21a/21aa/22aa` sem violações em 320/768/1280; lint, testes, build e visual verdes | Auditoria automática não substitui teste com leitor de tela |

## Pendências

- PR [#158](https://github.com/SamiaLuvanice/bestprice/pull/158) integrada em `develop` (merge
  `4a0505a`, 21/10/2026 22:51 UTC) com 10 checks remotos verdes (CI, PR policy, quality
  Frontend/Backend/Automation, resolve, sync, Cloudflare Pages). Revisão independente e QA
  concluídas (ver "Correções pós-revisão"). Worktree e branches da tarefa removidas.
- `doc-sync-onboarding` executado sobre `37cac54`: `docs/apps/frontend.md` passou a citar as
  artes `.webp`, tokens, Produtos com "Adicionar anúncio", preço-alvo pt-BR e
  `asyncUtilTimeout` de 6 s; `designsystem/README.md` e `brand-spec.md` deixaram de apontar
  `imagem-lateral.png` como arte vigente; `docs/PROGRESS.md` ganhou a linha da 0028.
  `git diff --check` dos documentos passou.
- Backend: não alterado; Ruff/pytest não executados por este papel.

## Correções pós-revisão

A revisão independente (aprovada com ressalvas) e a QA (13 aceitos, 2 parciais) devolveram 8
achados. Cada comportamento ganhou teste de regressão com Red observado antes do Green.

| # | Achado | Commit | Red → Green |
|---|---|---|---|
| 1 (P2) | Milhar com zero à esquerda: `"0.500"` virava `"500.00"` | `50101d0` | 5 casos novos em `targetPrice.test.ts` (`0.500`, `0.999`, `00.123`, `0.500,00`, `01.899,90`) falharam (5 failed); com primeiro grupo `[1-9]\d{0,2}`, 30/30 |
| 2 (P2) | Erro local do preço-alvo não anunciado | `2eefadf` | `findByRole('alert')` falhou (`Unable to find role="alert"`); `role="alert"` no `.field-error`, 26/26 |
| 3 (QA AC05) | Linha móvel de Produtos com 206 px e h1 "Produtos" duplicado | `fb53fd8` | Playwright em 390 px: `Received: 206.40625` (limite 140); unit: h1 `['Produtos']`. Green: "Seus produtos" é o único h1 e região; linha com imagem, título, preço, pílula e seta (~80 px em 320 px); a linha inteira abre o detalhe, onde ficam "Atualizar agora" e "Parar de monitorar" (conferido no teste); disponibilidade, "Ver detalhes", ⋮ e selo de alerta ocultos abaixo de 960 px; link com 44×44 px |
| 4 (QA AC04) | `text-muted` resolvia `rgb(245,245,247)` | `0884831` | `tokens.test.ts` falhou; `@utility text-muted` foi testado e não venceu o utilitário do tema (CSS gerado `.text-muted{color:var(--muted)}`). Solução: `--text-color-muted: var(--muted-foreground)` no `@theme` (namespace v4 só de `text-*`); CSS gerado `.text-muted,.text-muted-foreground{color:var(--muted-foreground)}`, `bg-muted` segue `var(--muted)`. Sonda no navegador: `text-muted` = `rgb(98, 98, 103)` |
| 5 (P3) | Pausar/Retomar apagava o rascunho do alvo | `7c85c97` | Teste esperava `120,50` e recebeu vazio; o campo só é reescrito após criar, salvar alvo ou excluir, 27/27 |
| 6 (P3) | `aria-expanded`/sinal/clique de "Adicionar anúncio" com fontes diferentes | `0d1f446` | `aria-controls` apontava para id inexistente (`expected null to be truthy`); fonte única `expanded`, painel sempre no DOM com `hidden`, recolher limpa erro/sucesso, 42/42 nos arquivos afetados |
| 7 (P3) | "Nenhuma notificação por enquanto." recuado 24 px | `fbbc052` | Playwright: `Received: 24` (limite 1); `.empty` sem recuo lateral, 3/3 viewports |
| 8 (P3) | Baselines 320 claro × escuro diferentes | `71267b3` | Diferença determinística (mesmos 2 pixels, delta 1, em 3 regenerações) no texto do SVG `<img>` do painel; após rasterizá-lo apareceu outra em 768 px (17 pixels, cartão de preço SVG). Pinar `color-scheme: light` no SVG não resolveu. As duas prévias viraram WebP; duas regenerações seguidas: claro = escuro nos 3 viewports (`getbbox() = None`) |

Ajustes de teste por mudança intencional: títulos `'Produtos'` → `'Seus produtos'` (App,
header, refresh-row, states, routes) e o menu ⋮ do cenário `produtos` só é exercitado a
partir de 960 px.

Observação de ambiente: durante as correções, uma execução isolada de `detail.test.tsx`
levou 79 s num único teste (carga externa: processos de outras ferramentas, nenhum servidor
desta tarefa); repetida, 26/26.

## Ajuste visual pós-integração — 22/10/2026

A pedido do responsável, a imagem principal do hero recebeu `border-radius: 18px`; a prévia de preço sobreposta preserva o raio próprio. Alterações em `frontend/src/landing/LandingPage.css` e `docs/apps/frontend.md`, na worktree `fix/issue-157-raio-foto-hero` baseada em `origin/develop` (`583f522`).

- `.agents/skills/impeccable/scripts/impeccable.cmd detect --json frontend/src/landing/LandingPage.css`: `[]`.
- `npm ci`: 395 pacotes instalados, 0 vulnerabilidades.
- `npm run lint`: passou.
- `npm run build`: passou.
- `npm test -- --run`: no sandbox, 30 arquivos falharam ao abrir arquivos temporários (`ENOENT`) e 1 arquivo passou com 14 testes; executado isoladamente fora do sandbox, passou com 31 arquivos e 348/348 testes.
- `npm run test:visual` e tentativas focadas na landing: ficaram sem saída e foram interrompidas. O uso de Chrome instalado e de porta explícita não resolveu; iniciar Vite na porta 53219 informou que já estava em uso. Capturas visuais não verificadas.
- `git diff --check`: passou.

A tentativa paralela inicial de testes também teve `ENOENT`; gates repetidos separadamente produziram os resultados acima. Revisão independente e QA não encontraram achados bloqueantes; ambas apontaram a falta de captura visual deste delta. `AGENTS.md` e `CLAUDE.md` conferidos, sem necessidade de edição.

- Hooks: `pre-commit install --hook-type pre-commit --hook-type commit-msg`; ambos instalados. `git commit` passou pelos hooks de whitespace, arquivos, YAML/JSON aplicáveis, conflitos, arquivos grandes, chave privada e proteção de branch.
- Revisão independente (`arch-reviewer`): sem achados bloqueantes; observou que o seletor depende da ordem atual das imagens no JSX.
- QA independente: confirmou o alvo do CSS e a separação da prévia, lint/build, e usou a evidência de 348/348 testes; não conseguiu demonstrar captura visual.
- Commit local: `0a4811b` (`fix(frontend): arredonda foto da hero`; `Refs #157`).
- Handoff GitHub pendente: `gh auth status` informa token inválido para a conta ativa `SamiaLuvanice`; a Issue #157 já está fechada pela PR #158. Não foi possível criar nova Issue ou PR, e a política local exige Issue aberta vinculada à PR.
