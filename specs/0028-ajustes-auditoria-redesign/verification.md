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

## Gates finais (estado commitado, `89cb25b`)

- `npm run lint`: passou, 0 erros e 0 avisos.
- `npm test -- --run`: **340 passed (340)**, 31 arquivos. Numa execução anterior do mesmo
  estado, `routes.test.tsx › preserva o destino protegido durante login e recarga` falhou
  uma vez (~3 s, tempo sob carga); repetido isolado 3× (**17/17** cada) e a suíte inteira
  de novo (**340/340**). Mesmo padrão intermitente da linha de base; não relacionado à 0028.
- `npm run build`: TypeScript e Vite passaram; Recharts segue em chunk lazy.
- `npm run test:visual -- --workers=3`: **57 passed** sem `--update-snapshots`
  (18 capturas públicas + 30 cenários com axe + 9 novos: tokens e imagem do detalhe).
- `git diff --check origin/develop..HEAD`: passou.
- Hooks `pre-commit` (trailing whitespace, EOF, large files, private key, guarda de
  branch) passaram em todos os commits; nenhum `--no-verify`.

Baselines: as 12 capturas de landing e login foram regeneradas intencionalmente com
`--update-snapshots` e conferidas visualmente (landing 320/1280, login 1280) contra os
quadros 01/02/08; as 6 de rota inexistente não mudaram. Execução limpa posterior: 57/57.

## Imagens (AC03)

| Arquivo | Antes | Depois | Dimensões finais |
|---|---|---|---|
| `hero-person` | PNG 1.598.387 B (1774×887, ⅓ transparente à esquerda) | WebP 70.734 B | 1120×682 (recortado ao conteúdo) |
| `login-left` | PNG 1.660.601 B (1024×1536) | WebP 46.720 B | 960×1440 |
| `footer-phone` | PNG 1.431.980 B (2168×725) | WebP 47.458 B | 1600×548 |
| `dashboard-preview.svg` | 279.594 B (2 PNG embutidos) | 9.215 B (WebP 104 px embutidos) | 1248×491 |
| `logo-bestprice.png` (cópia da SPA) | 491.530 B (1254×1254) | 9.865 B | 128×128, sem perda; original em `designsystem/` |

Conversão com Pillow 12.3 (Python 3.13), `quality` 78–82, `method=6`. `dist/assets` após o
build: maior imagem 70.734 B; nenhuma acima de 300 KB. O hero mantém `fetchPriority="high"`
e passou a declarar as dimensões reais (`1120×682`, antes `1024×1024`). Removidos:
`assets/landing/*.webp` (9 arquivos) e `assets/imagem-lateral.png`, sem importação (grep).

## Matriz de aceite

| AC | Situação | Evidência | Limite |
|---|---|---|---|
| AC01 | Feito | Playwright: imagem 80×80 com título longo em 320 e 390 px; `flex: none` | Desktop 140×140 conferido por captura |
| AC02 | Feito | Testes de normalização e de criação/edição; contrato inalterado | Sem chamada real ao backend nesta tarefa |
| AC03 | Feito | Tabela acima e `dist/assets` | — |
| AC04 | Feito | `tokens.test.ts`; Playwright confere `bg-primary`/`text-primary` `rgb(199,0,94)`, `text-muted-foreground` `rgb(98,98,103)`, `bg-muted` `rgb(245,245,247)`, `bg-action` verde com texto preto; README | `text-muted` documentado como proibido, não removido do Tailwind |
| AC05 | Feito | Teste de Produtos compacto; captura 320 (linha ~170 px, antes ~310 px) | A linha móvel omite menor preço e horário (no detalhe) |
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

- Revisão independente, QA, `doc-sync-onboarding` e PR para `develop` (T10, orquestrador).
- `docs/apps/frontend.md` ainda cita `login-left.png` e `hero-person.png`/`footer-phone.png`
  (linhas 65 e 117): atualizar no doc-sync.
- Backend: não alterado; Ruff/pytest não executados por este papel.
