# Tarefas — 0049

Legenda: **[F]** frontend · **[D]** design/evidência · **[I]** integração/coordenação.

- **Tarefa com comportamento:** registra Red (motivo esperado) e Green, com comando e
  contagem, em `frontend-evidence.md`.
- **Tarefa visual:** registra captura ou observação em `verification.md`.

## Preparação

- [x] Spec `pronta`, Issue #267, worktree a partir de `origin/develop` `de5d8ee`.
- [x] Plano ([plan.md](plan.md)), sem mudança de contrato REST.
- [x] I1 — Aprovação explícita para:
  - a CLI do shadcn (decisão 6);
  - as dependências novas `@fontsource/geist-mono` e `sonner`.

## Fase 0 — Linha de base

- [x] F0 — Rodar `npm run lint`, `npm test`, `npm run build` e `npx playwright test` na
  worktree sem alterações. Registrar as contagens e classificar as 19 falhas da #259
  (baseline × regressão).
  - **Aceite:** tabela em `verification.md`.

## Fase 1 — Tokens e fontes (AC01–AC04, AC14)

- [x] D1 — Exportar a coleção "shadcn/ui · BestPrice" do Figma para
  `designsystem/tokens/figma-variables-2026-11.json` (67 variáveis, mais os valores Noite
  documentados e os 22 estilos de texto).
- [x] F1 — **Red:** `src/tokens.figma.test.ts` compara o JSON com `styles.css` e falha nos
  tokens ausentes ou divergentes. **Green:** atualizar `:root` e `@theme inline`.
  - Atualizar as expectativas visuais de `tokens.test.ts` (`--card`, `--action-hover`) e
    listar cada mudança (AC11).
- [x] F2 — **Red:** `src/no-raw-colors.test.ts` lista as cores soltas atuais. **Green** ao
  fim da Fase 4, quando as exceções restantes estiverem justificadas.
- [x] F3 — Tipografia:
  - `--font-display` com `font-stretch: expanded`;
  - `--font-mono` com Geist Mono (import em `main.tsx`);
  - utilitários dos 22 estilos.
  - **Aceite:** build sem requisição externa de fonte (Network) e licença registrada.
- [x] F4 — Sombras, anel de foco, durações e `prefers-reduced-motion` (AC04 e AC12).

## Fase 2 — Componentes (AC05)

- [x] F5 — Rodar a CLI (após I1) e revisar o diff de `package.json` e do lockfile.
- [x] F6 — **Button:**
  - **Red:** testes de `loading` (desabilitado, `aria-busy`, spinner) e dos tamanhos.
  - **Green:** variantes e estados conforme a correspondência da decisão 2.
- [x] F7 — **Badge:** variantes de status com ícone e texto, mais o teste de renderização.
- [x] F8 — **Input, Textarea, Label e Field:**
  - **Red:** Field liga `aria-describedby` e `aria-invalid`; o contador aparece perto do
    limite.
  - **Green:** implementação.
- [x] F9 — **Checkbox, Switch, Radio e Select:** estilos com tokens e teste de teclado
  (Space/Enter/setas).
- [x] F10 — **Card, Alert, Alert Dialog, Dropdown Menu, Tooltip, Sonner e Tabs:** variantes
  `warning` e `success` no Alert e Tabs em pílula.
- [x] F11 — **Table, Pagination, Sidebar, Skeleton, Avatar, Progress, Separator,
  EmptyState e PriceChartCard.**
- [ ] I2 — Revisão `arch-reviewer` das Fases 1 e 2.

## Fase 3 — Catálogo (AC05, AC06)

- [x] F12 — **Red:** teste de rotas mostra que `/dev/design-system` dá "não encontrada" com
  `DEV=false` e abre com `DEV=true`. **Green:** rota condicional e `lazy`.
- [x] F13 — Catálogo com todas as variantes e estados, mais as tabelas de token do JSON.
- [x] F14 — Criar `scripts/check-no-catalog.mjs`: `dist/` sem nenhum vestígio do catálogo.
  - Chamado por `npm run build:check` e incluído no CI de frontend.
- [x] D2 — Inventário do AC05 em `verification.md`: componente, variantes, estados,
  node-id e captura `catalog.spec.ts`.

## Fase 4 — Telas (AC07–AC10, AC12)

- [x] F15 — **Gráfico:**
  - **Red:** sem alvo, nenhuma `ReferenceLine`; um registro, só o ponto; nenhum ponto
    além dos registros.
  - **Green:** Area + Line `stepAfter`, ponto final e alvo tracejado.
- [x] F16 — **Barra lateral e navegação inferior** (`ResearchArea`, `research.css`): tokens
  `sidebar-*`, ativo em rosa e rótulos inalterados (AC09).
- [x] F17 — **Entrar e Criar conta (7 estados)** com os componentes novos. Textos e fluxos
  inalterados; os testes existentes seguem verdes.
- [x] F18 — **Assistente (início e conversa) e Histórico.**
- [x] F19 — **Monitoramento (vazio e com produtos):** sem indicadores, busca ou filtros
  inexistentes; as omissões vão para `verification.md`.
- [x] F20 — **Estados de indisponibilidade e recuperação** (quadros 137:43, 152:535 e
  184:200).
- [x] F21 — **Lista B:** produtos, detalhe, alertas, comparador, landing atual e
  "não encontrada", só com tokens e componentes.
- [x] F22 — **Red/Green:** teste de ação única (≤ 1 `data-variant="default"` visível) em
  cada tela da lista A (AC07).
- [x] F23 — Fechar o F2: nenhuma cor solta fora das exceções justificadas (AC02).

## Fase 5 — Verificação visual e acessibilidade (AC08, AC12, AC13)

- [ ] D3 — Exportar do Figma os PNGs dos quadros da lista A (node-id e data) para
  `evidence/`.
- [x] F24 — Projeto `viewport-1440` e capturas de evidência das telas da lista A em 1440 e
  390.
  - **Aceite:** pares lado a lado em `verification.md`, com a classificação de cada
    divergência.
- [ ] F25 — Rodar axe, alvos de 44 px, teclado, movimento reduzido e ausência de rolagem
  horizontal nas listas A e B, em 320, 390, 768 e 1280.
- [ ] F26 — Atualizar os baselines por spec de teste, apresentando cada diff.
  - **Aceite:** aprovação registrada (AC13).

## Fechamento

- [ ] I3 — Revisão `arch-reviewer` final e QA (`qa`) dos AC01–AC15.
- [ ] F27 — Gates:
  - `npm run lint`, `npm test`, `npm run build`, `npm run build:check` e
    `npx playwright test`;
  - pytest do backend como sanidade.
  - Contagens positivas em `verification.md`.
- [ ] D4 — Documentação: `designsystem/README.md` com:
  - tokens;
  - a correspondência de variantes;
  - a substituição da 0042;
  - fontes e licença;
  - a versão do Figma.
  - Também `docs/apps/frontend.md` e `docs/PROGRESS.md` (AC15).
- [ ] I4 — `doc-sync-onboarding` por último.
- [ ] I5 — PR para `develop` com `Closes #267` e `Closes #222`, a spec, as evidências e
  as pendências.
