# Verificação da spec 0049

Registro do papel `frontend` (Fases 0 a 4 de [tasks.md](tasks.md)). Worktree
`.worktrees/feature-0049-issue-267-design-system-2026`, branch
`feature/0049-issue-267-design-system-2026`, base `origin/develop` `de5d8ee`
(ponta inicial `1d35d5c`). Sistema da execução: Windows 11 (sem SF Pro instalada),
Chromium do Playwright 1.64 headless, Node do ambiente local. Evidência de TDD em
[frontend-evidence.md](frontend-evidence.md).

Este registro não afirma resultado de CI, PR, revisão independente nem comparação lado a lado
com o Figma (Fase 5, D3/F24–F26, fora desta delegação).

## F0 — Linha de base (sem alterações, ponta `1d35d5c`)

Comandos em `frontend/` depois de `npm ci`:

| Comando | Resultado |
|---|---|
| `npm run lint` | 0 problemas |
| `npm test` (1ª execução) | 38 arquivos; **530 passed, 1 failed** (531) |
| `npm test` (2ª execução) | 4 arquivos falharam; 4 testes: `App.test.tsx` (heading "Fone sem fio" não encontrado) e 3 *timeouts* de 15 s (`hero`, `products`, `refresh-row`) |
| `npx vitest run` só nos 4 arquivos | **82 passed** (4 arquivos) |
| `npm run build` | ok (2666 módulos; CSS 97,70 kB, JS principal 424,92 kB) |
| `npx playwright test` | **203 passed, 19 failed, 54 skipped** (4,8 min) |

**Observação sobre o Vitest:** as falhas mudam entre execuções e somem com os arquivos isolados.
Inferência: instabilidade por carga (12 núcleos, 38 ambientes jsdom em paralelo), não regressão.
Não foi corrigida nesta spec; fica registrada como risco para as contagens das fases seguintes.

### Classificação das 19 falhas da Issue #259

Reexecutadas com `npx playwright test --last-failed --reporter=line`; diffs em
`frontend/test-results/` (não versionado).

| # | Teste | Larguras | Falha observada | Causa (evidência) | Classe | Destino |
|---|---|---|---|---|---|---|
| 1–8 | `public-pages.spec.ts` "landing pública" (claro e escuro) | 320, 390, 768, 1280 | 801 px diferentes (0,01) | O diff (`landing-light-diff.png`) só marca a marca no cabeçalho; o restante da página é idêntico. A marca da landing passou a 34 px em `fb46498` (assistente do Figma, 02/11) e a baseline é anterior | **Baseline desatualizada** | Separada para a Fase 5 (F26) / #259; nenhuma baseline foi alterada nesta delegação |
| 9–16 | `brand.spec.ts` "marca landing" e "marca inicio" | 320, 390, 768, 1280 | `image.width` esperado ≥ 40, recebido 34 | Mesma mudança intencional: `.research-brand .brand-logo { width:34px }` (shell interno aprovado no Figma, 0040/0043). A asserção é anterior ao shell | **Asserção visual desatualizada** (não é regressão de produto) | Separada para a Fase 5 / #259; atualizar a asserção exige confirmar o tamanho contra o quadro do Figma |
| 17–19 | `redesign.spec.ts` "produtos", "detalhe", "alertas" | 1280 | axe `label-content-name-mismatch` em `.account-button` | Em 1280 o e-mail fica visível; o texto visível do botão incluía a inicial do avatar ("P" + e-mail), que não está contida no nome acessível `Conta: pessoa@example.com` (WCAG 2.5.3) | **Regressão real de acessibilidade** | **Corrigida** antes da Fase 1: a inicial passou para `data-initial` + `::before` (CSS), sem mudar o nome acessível. `npx playwright test tests/visual/redesign.spec.ts --project=viewport-1280` → **15 passed** |

## F5 — CLI do shadcn (07/11/2026)

**1ª tentativa (bloqueada):** o `--dry-run` do comando aprovado mostrou dependências fora da
aprovação (`next-themes`, exigida pelo `sonner` do registry, e um pacote npm `cn`, declarado por
todos os itens), 4 sobrescritas (`button`, `separator`, `input`, `skeleton`) e "16 CSS variables
added to src/styles.css". A CLI não foi executada; reportado à coordenação.

**Decisão da responsável ("Sem next-themes"):** rodar a CLI sem `sonner`, sem sobrescritas, sem
aceitar variáveis CSS do registry, sem pacote `cn`; `sonner.tsx` escrito à mão sobre o pacote
`sonner`.

**Execução:**

1. `npx shadcn@latest add textarea label checkbox switch radio-group select tabs alert alert-dialog dropdown-menu tooltip avatar progress pagination sidebar --dry-run`
   → 17 arquivos novos, 4 sobrescritas, dependências `cn`, `radix-ui`, `class-variance-authority`,
   `lucide-react`, 16 variáveis CSS.
2. Para que nem o pacote `cn` nem as variáveis CSS chegassem ao projeto, a CLI rodou numa cópia
   isolada (`package.json`, `package-lock.json`, `components.json`, `tsconfig.json`,
   `vite.config.ts`, `styles.css`, `lib/utils.ts` e `components/ui/` copiados para o scratchpad),
   com `npm_config_dry_run=true` e `npm_config_ignore_scripts=true` (o npm não instalou nada) e
   respondendo **n** a cada pergunta de sobrescrita (`yes n | npx shadcn@latest add … --yes`).
3. Conferido na cópia: `button`, `separator`, `input` e `skeleton` idênticos aos do projeto;
   `package.json` e `package-lock.json` idênticos. A cópia de `styles.css` recebeu as variáveis do
   registry e **não** foi trazida.
4. Copiados para o projeto só os arquivos novos: `textarea`, `label`, `checkbox`, `switch`,
   `radio-group`, `select`, `tabs`, `alert`, `alert-dialog`, `dropdown-menu`, `tooltip`, `avatar`,
   `progress`, `pagination`, `sidebar`, `sheet` (dependência do `sidebar`) e `hooks/use-mobile.ts`.
5. O registry gerou `import { cn } from "cn"` em 16 arquivos; trocado por `@/lib/utils`.
   `buttonVariants` foi para `components/ui/button-variants.ts` (o `pagination` o importa; mantém o
   `button.tsx` só com componentes, sem aviso de fast refresh).
6. `npm install sonner` (aprovado). `components/ui/sonner.tsx` escrito à mão: `theme="light"` fixo,
   cores e raio por token, sem `next-themes`.

**Diff de dependências** (`git diff` antes do commit `10f6d2d`):

| Arquivo | Mudança |
|---|---|
| `package.json` | `+ "sonner": "^2.0.8"` (única linha) |
| `package-lock.json` | +17 linhas: entrada raiz `sonner ^2.0.8` e `node_modules/sonner` 2.0.8 (MIT, peers `react`/`react-dom` 18–19, `@types/react` opcional) |
| `next-themes`, `cn` | ausentes do `package.json` e do lockfile (`grep -c '"node_modules/next-themes"\|"node_modules/cn"'` → 0) |

Somando a Fase 1: dependências novas da spec = `@fontsource/geist-mono` e `sonner`, as duas aprovadas.

**Ajustes aos tokens** (sem dark: — tema claro fixo): campos com 44 px e `rounded-xl` como o
Input; foco com `--ring-width`; Switch ligado em `bg-action`, 44 × 24 px; Checkbox e Radio
marcados em rosa `--primary`; Tabs em pílula (`rounded-full`, aba ativa com `--shadow-1`, inativa
com `--muted-foreground` para AA); Alert com `warning` e `success` sobre `--status-*-soft`
(`role="alert"` para destrutivo e atenção, `role="status"` para informação e sucesso); Alert
Dialog e Sheet com sobreposição `--color-overlay` e `--shadow-3`; Dropdown com itens de 44 px e
`--shadow-2`; Tooltip na superfície escura fixa `--night-900`; Avatar em `--accent`/`--primary`;
Sidebar com os tokens `--sidebar-*` do registry, já definidos pelo snapshot do Figma.

## D2 — Inventário do AC05 no catálogo local

Catálogo em `/dev/design-system` (`src/dev/DesignSystemCatalog.tsx`), capturado por
`tests/visual/catalog.spec.ts`: uma captura por seção (22 seções) e os estados abertos por teclado
(select, menu, tooltip, diálogo e toast), em 320, 390, 768, 1280 e 1440. Capturas em
`frontend/test-results/catalog-*/` (não versionadas). Node-ids da seção 2: preenchidos com os valores tirados do Figma (seção 2) e enviados pela coordenação em 07/11/2026
(o snapshot exportado não os traz e não houve acesso ao Figma nesta sessão).

| Componente (Figma) | Código | Variantes no catálogo | Estados no catálogo | Node-id |
|---|---|---|---|---|
| Button | `ui/button.tsx` (+ `button-variants.ts`) | action→`default`, default→`brand`, secondary, outline, ghost, link, destructive; sm, default, lg, icon | padrão, hover e foco forçados por classe, desabilitado, carregando; sm com 36 px visíveis e alvo de 44 px | 239:2710 |
| Badge | `ui/badge.tsx` | default, secondary, destructive, outline, `down`, `up`, `stable`, `target`, `stale`, `unverified` | — | 239:2762 |
| Input / Field | `ui/input.tsx`, `ui/field.tsx` | com descrição, erro, contador | padrão, foco forçado, inválido, desabilitado, contador perto do limite | 239:2799 (Input), 239:2850 (Field) |
| Textarea / Label | `ui/textarea.tsx`, `ui/label.tsx` | dentro de Field | padrão, erro | 239:2812 (Textarea) |
| Checkbox | `ui/checkbox.tsx` | — | desmarcado, marcado, inválido, desabilitado; foco por teclado (teste) | 239:2862 |
| Switch | `ui/switch.tsx` | default, sm | desligado, ligado, desabilitado; Espaço/Enter (teste) | 239:2875 |
| Radio Group | `ui/radio-group.tsx` | — | selecionado, não selecionado, desabilitado; setas (teste) | 239:2885 (Radio Group Item) |
| Select | `ui/select.tsx` | default | fechado, aberto (captura `select-aberto`); Enter + setas (teste) | 239:2907 |
| Tabs | `ui/tabs.tsx` | pílula | ativa, inativa, desabilitada; setas (teste) | 239:3197 |
| Card | `ui/card.tsx` | header, descrição, conteúdo, rodapé | — | 239:3065 |
| Alert | `ui/alert.tsx` | default, success, warning, destructive | — | 239:3094 |
| Alert Dialog | `ui/alert-dialog.tsx` | — | fechado, aberto (captura `dialogo-aberto`, axe sem violações), Esc fecha | 239:3095 |
| Dropdown Menu | `ui/dropdown-menu.tsx` | item padrão e destrutivo, rótulo, separador | aberto (captura `menu-aberto`) | 239:3113 |
| Tooltip | `ui/tooltip.tsx` | — | aberto por foco (captura `tooltip-aberto`) | 239:3144 |
| Sonner | `ui/sonner.tsx` | success, warning, error | toast visível (captura `toast`) | 239:3175 (Toast) |
| Table | `ui/table.tsx` | cabeçalho Mono/Label | linha com hover forçado | 239:3293 (Table Row) |
| Pagination | `ui/pagination.tsx` | anterior, página, ativa, reticências, próxima | — | 239:3457 |
| Sidebar | `ui/sidebar.tsx` (+ `sheet.tsx`, `hooks/use-mobile.ts`) | `collapsible="none"` | item ativo em rosa | 239:3488 (Sidebar MenuItem) |
| Avatar | `ui/avatar.tsx` | default, lg | iniciais | 239:3525 |
| Progress | `ui/progress.tsx` | — | 25%, 70% | 239:3530 |
| Skeleton, Separator | `ui/skeleton.tsx`, `ui/separator.tsx` | — | — | 239:3518 (Skeleton), 239:3532 (Separator) |
| Chart / card de gráfico | `ui/chart.tsx`, `components/PriceChartCard.tsx` | degraus, área, ponto atual | — | 239:3533 (Chart card) |
| Estado vazio | `components/EmptyState.tsx` | com ação | — | 239:3560 (Empty State) |

## F12–F14 — Catálogo restrito (AC06)

- `src/dev/catalogRoute.test.tsx`: **Red** com a rota ausente → 1 failed | 1 passed (o caso
  `DEV=false` já mostrava "não encontrada"); **Green** → 2 passed. Detalhes em frontend-evidence.md.
- `npm run build:check` → build ok e "Sem vestígios do catálogo em dist (5 marcadores conferidos)".
  O script tem teste próprio (`scripts/check-no-catalog.test.ts`, 3 passed) e substitui
  `npm run build` no job de frontend de `.github/workflows/quality.yml`.
- O dev server libera só `../designsystem/tokens` (além da raiz padrão) em `server.fs.allow`,
  para o catálogo ler o snapshot do Figma.

## Fase 4 — Telas (F15–F23)

### O que mudou nas telas (sem mudar texto, rota ou chamada)

- **Sistêmico (listas A e B):** Button em pílula com alturas do Figma e peso Button/M; Input de
  44 px; cards (`.panel`, `.track-panel`, `.detail-alert-card`) brancos com borda (Figma 2026
  prevalece sobre a 0039); cabeçalho da tabela de produtos em Mono/Label; títulos `h1`/`h2` com
  `font-stretch: expanded`; anel de foco com `--ring-width`; transições com `--motion-*`.
- **Dados em Geist Mono + `tabular-nums` (AC03):** preço atual/anterior/menor, células de
  preço, histórico, tempos relativos (`.relative-time`), contador de notificações, valores dos
  indicadores, ID MLB do detalhe (novo `<span class="detail-reference-id">`, mesmo texto),
  contador de caracteres do assistente, variação percentual e eixos/tooltip do gráfico.
- **Barra lateral (AC09, F16):** fundo `--sidebar`, texto `--sidebar-foreground`, item ativo com
  `--sidebar-accent` e rosa `--sidebar-accent-foreground` (mais filete `--sidebar-primary`), foco
  `--sidebar-ring`; o menu móvel aberto também fica escuro. Navegação inferior inalterada:
  Assistente, Histórico e Monitorar, ativo em rosa.
- **Gráfico (AC10, F15):** superfície clara (`--card` com borda) em vez do grafite, para a linha
  escura `--chart-1` ser legível; grade `--border`, rótulos `--muted-foreground`.
- **Ação única (AC07, F22):** 21 controles com aparência própria ganharam a variante que
  corresponde ao seu papel (não eram verdes na tela, mas carregavam `data-variant="default"`).

### Playwright após a Fase 4 (`npx playwright test`, ponta não commitada desta fase)

**178 passed, 49 failed, 54 skipped** (4,6 min). Nenhuma baseline foi atualizada (Fase 5).

| Grupo | Falhas | Classe |
|---|---|---|
| `public-pages` landing (claro/escuro × 4) | 8 | Preexistente (#259, baseline desatualizada) |
| `brand` marca landing/inicio (× 4) | 8 | Preexistente (#259, asserção ≥ 40 px desatualizada) |
| `public-pages` login e "não encontrada" (claro/escuro × 4) | 16 | **Diferença visual esperada** desta spec (Button, Input, cards, tipografia); revisar na F26 |
| `signup.spec.ts` quadros do cadastro (7 estados × desktop/mobile) + login/landing com Criar conta | 16 | **Diferença visual esperada**; revisar na F26 contra os quadros 220:* |
| `assistant.spec.ts:36` (768) `loaded: false` do robô | 1 | Instável sob carga: o teste não espera a imagem de 1,1 MB carregar; isolado, `npx playwright test tests/visual/assistant.spec.ts:36` → **4 passed** duas vezes |

Todas as asserções funcionais e de acessibilidade das outras specs passaram, inclusive
`redesign.spec.ts` (axe, alvos de 44 px, sem rolagem horizontal) e as 3 falhas de axe da #259,
corrigidas na F0.

### Asserções visuais existentes alteradas

Nenhuma nesta fase (ver "Correções da revisão independente" para a única alteração posterior).
As baselines afetadas ficam para a F26.

### Omissões de elementos do Figma (sem comportamento ou dado existente)

Não foram criados: indicadores de queda, de alertas ativos e de sem estoque do quadro
151:11/152:312, a busca, os filtros por situação, o seletor de período e o resumo por situação do
monitoramento, a seleção de produtos em tabela e novas ações no menu de produto. Os indicadores
que já existiam (`SummaryIndicators`) seguem com os mesmos dados e textos.

### Limites desta fase

- **Sem acesso ao Figma nesta sessão** (nenhum MCP do Figma disponível): F17–F20 receberam só a
  adoção sistêmica de tokens e componentes; tamanho, ordem e espaçamento por quadro da lista A
  não foram comparados. Isso é a F24/D3 (Fase 5) e pode exigir ajustes de layout depois.
- **Raio do Input:** usa `rounded-xl` = `--radius-xl` (24 px), como diz o plano; confirmar no
  quadro do Figma (pode ter sido escrito pensando no `rounded-xl` padrão do Tailwind, 12 px).
- **Preços:** o Figma define `Data/Price XL/M` em SF Pro Expanded; a decisão da spec (AC03) pede
  Geist Mono para preços. O código aplica Geist Mono nos preços das telas e mantém os utilitários
  `text-data-price-*` fiéis ao estilo do Figma (usados no catálogo e no `PriceChartCard`).
- **Títulos expandidos em macOS:** `font-stretch: expanded` alarga `h1`/`h2` onde a SF Pro
  Expanded existir; a ausência de rolagem horizontal só foi conferida no Windows (sem SF Pro).

## Correções da revisão independente (I2)

### 1. Fontes: subconjuntos e base64 (AC14)

- `main.tsx` importa só `latin-{400,500,600}` e `latin-ext-{400,500,600}` da Geist Mono.
- `vite.config.ts`: `build.assetsInlineLimit` como função; `.woff`/`.woff2` nunca viram base64.
- `scripts/check-fonts.mjs` (no `npm run build:check`) falha com fonte em base64 no CSS ou com
  subconjunto/peso fora de latin/latin-ext 400–600. Teste próprio: `scripts/check-fonts.test.ts`, 3 passed.
- **Red:** build da configuração anterior (`main.tsx` e `vite.config.ts` de `HEAD`, saída no
  scratchpad) → `node scripts/check-fonts.mjs <dist-antigo>` sai com 1 e 13 problemas (CSS com fonte
  em base64 e 12 arquivos `cyrillic`/`vietnamese`/`symbols2`/etc.).
- **Tamanho do CSS principal:**

| Momento | CSS principal | gzip |
|---|---|---|
| Medição da revisão (antes dos componentes da F5) | 167,78 kB | — |
| Antes da correção, com os componentes da F5 (`index-CUlqhbPn.css`) | 206,11 kB | 69,09 kB |
| Depois da correção (`index-DVVJlnca.css`) | 145,75 kB | 26,19 kB |
| Ponta final (catálogo e ajustes; `index-OUTF1db7.css`) | 146,69 kB | 26,28 kB |

### 2. Licença versionada (AC14)

`designsystem/licenses/GeistMono-OFL.txt`: texto integral da OFL 1.1 com o aviso de copyright
(© 2024 The Geist Project Authors), copiado de `@fontsource/geist-mono/LICENSE`. Referenciado no
`designsystem/README.md`.

### 3. Tokens próprios com literal (AC01) — divergências

Teste novo em `src/tokens.figma.test.ts`: todo token de `:root` com cor literal precisa ser
variável ou efeito do Figma, ou estar na lista de divergências do próprio teste.
**Red:** → 1 failed | 103 passed (104), listando os 15 tokens próprios com literal (mais as 4 sombras,
que são efeitos do Figma; o teste passou a aceitar os nomes de `effectStyles`).
**Green:** → 105 passed, depois do mapeamento:

| Token próprio | Antes | Depois (token do Figma) | Observação |
|---|---|---|---|
| `--color-border-soft` | `#e8e8ed` | `var(--border)` | divisórias ficam no `#d2d2d7` do Figma (mais visíveis) |
| `--color-badge-text` | `#fff` | `var(--destructive-foreground)` | mesmo valor |
| `--color-logo-surface` | `#fff` | `var(--background)` | mesmo valor |
| `--color-danger-text` | `#a61b1b` | `var(--destructive)` (`#b42318`) | 5,9:1 sobre `--status-up-soft` |
| `--color-danger-bg` | `#fff0f0` | `var(--status-up-soft)` (`#fff0ee`) | — |
| `--color-danger-border` | `#ffd4d4` | `color-mix(in srgb, var(--destructive) 25%, var(--background))` | — |
| `--color-glass` | `rgba(251,251,253,.96)` | `color-mix(in srgb, var(--surface-raised) 96%, transparent)` | mesmo valor |
| `--color-glass-edge` | `rgba(255,255,255,.9)` | `color-mix(in srgb, var(--background) 90%, transparent)` | mesmo valor |
| `--color-overlay` | `rgba(0,0,0,.62)` | `color-mix(in srgb, var(--night-950) 62%, transparent)` | — |
| `--color-skeleton-a` | `#e8e8ed` | `color-mix(in srgb, var(--border) 50%, var(--muted))` | — |
| `--color-skeleton-b` | `#f5f5f7` | `var(--muted)` | mesmo valor |
| `--color-graphite` | `#18171b` | `var(--night-900)` | — |
| `--color-on-graphite` | `#fff` | `var(--primary-foreground)` | mesmo valor |
| `--color-footer-bg` | `#000` | `var(--night-950)` (`#0a0a0f`) | asserção visual atualizada (abaixo) |

**Divergência que restou** (lista `colorLiteralExceptions` do teste):

| Token | Valor | Motivo | Aprovação |
|---|---|---|---|
| `--color-brand-strong` | `#a0004c` | hover de link (rosa escurecido, 8,1:1 sobre branco); o Figma não define estado hover para link | aprovada pela responsável em 2026-11-07; criar a variável no Figma depois |

Qualquer literal novo fora dessa lista falha o teste (é o Red acima). Um segundo caso garante que a
lista não tem entrada morta.

### 4. Ação principal única sem espera fixa (AC07)

`src/primaryAction.test.tsx`: cada tela espera um título ou texto próprio do estado (`findBy*`),
sem `setTimeout`; um caso extra comprova que a espera falha quando o elemento não aparece.
→ 10 passed. O estado "Assistente indisponível" passou a usar `capabilities.enabled: false` (aviso
"O assistente está indisponível no momento…"), que é o estado da tela; o 503 anterior não tinha
um elemento visível para esperar.

### 5. Menores

- `no-raw-colors`: a exceção retira só o trecho permitido da linha; teste novo comprova que outra
  cor na mesma linha ainda falha (2 passed).
- Botões pequenos: regras com `:where()`; o alvo mínimo de 44 px do CSS global vale só fora de
  `sm`/`xs`/`icon-sm`/`icon-xs`. Teste no catálogo: Button `sm` com 36 px visíveis, `::after` de 44 px.
- `@source not "./dev"` **não foi aplicado**: classes usadas só no catálogo
  (`md:grid-cols-[160px_1fr]`, `max-w-[1248px]` e outras) deixariam de ser geradas e o catálogo
  ficaria sem estilo no dev. O build de distribuição continua sem vestígio do catálogo
  (`check-no-catalog`); os utilitários gerados são genéricos.
- Catálogo: comentário liga o componente aos 5 marcadores de `scripts/check-no-catalog.mjs`.
- Gráfico: a linha do alvo aparece só com alerta ativo (`chartTargetPrice`, `src/lib/targetPrice.ts`).
  **Red:** `chartTargetPrice is not a function` (2 failed); **Green:** 2 passed.

### Asserções visuais existentes alteradas (AC11)

| Arquivo | Antes | Depois | Motivo |
|---|---|---|---|
| `tests/visual/review-corrections.spec.ts` (rodapé da landing) | `background: 'rgb(0, 0, 0)'` | `background: 'rgb(10, 10, 15)'` | `--color-footer-bg` → `--night-950` (AC01). `npx playwright test tests/visual/review-corrections.spec.ts` → 12 passed |

## Playwright final desta delegação (ponta `74ee602`)

`npx playwright test` → **189 passed, 48 failed, 54 skipped** (5,0 min; 291 testes com o projeto
`viewport-1440`, que roda só `catalog.spec.ts`). Nenhuma baseline foi atualizada. Todas as falhas
são de captura ou da asserção ≥ 40 px da #259; nenhuma asserção funcional ou de acessibilidade
falhou.

| Grupo | Falhas | Classe | Destino |
|---|---|---|---|
| `public-pages` landing (claro/escuro × 4) | 8 | Preexistente (#259, baseline desatualizada) | F26 / #259 |
| `brand` marca landing/inicio (× 4) | 8 | Preexistente (#259, asserção ≥ 40 px desatualizada) | F26 / #259 |
| `public-pages` login (claro/escuro × 4) | 8 | Diferença visual nova desta spec | F26 |
| `public-pages` "não encontrada" (claro/escuro × 4) | 8 | Diferença visual nova desta spec | F26 |
| `signup.spec.ts` 7 estados do cadastro × desktop/mobile | 14 | Diferença visual nova desta spec | F26 (quadros 220:*) |
| `signup.spec.ts` login e landing com "Criar conta" | 2 | Diferença visual nova desta spec | F26 |

O `assistant.spec.ts:36` (instável na Fase 4) passou nesta execução.

## F24 e F17–F20 — Telas da lista A × quadros do Figma (AC08)

- **Quadros:** `evidence/figma/` (commit `4ae5777`; node-ids no README da pasta), exportados em 07/11/2026.
- **Capturas do app:** `evidence/app/`, mesmo nome do PNG do Figma, geradas por
  `frontend/tests/visual/evidence-0049.spec.ts` (projeto `viewport-1440`, cada teste fixa a largura e
  a altura do quadro; `fullPage`; API simulada). São evidência, não baselines.
- **Execução:** `npx playwright test tests/visual/evidence-0049.spec.ts --project=viewport-1440` → **38 passed**.
- **Sistema:** Windows 11 e Chromium, sem SF Pro. Os títulos caem para a pilha de sistema (fonte substituta).

**Categorias de divergência (AC08):** **FS** = fonte substituta; **SC** = elemento sem
comportamento ou dado existente; **LT** = limite técnico descrito. Toda divergência precisa de
aprovação explícita; as que não têm decisão anterior na spec estão marcadas **aprovada em 2026-11-07**.

**Conferência:** "lado a lado" = os dois PNGs foram abertos e comparados; "por amostragem" = o
estado compartilha layout com um par conferido e só o conteúdo do estado muda.

### Ajustes feitos depois da comparação

| Tela | Ajuste |
|---|---|
| Campos (todas) | Input, Textarea e Select com raio de 12 px (`rounded-md`); os quadros 59:44 e 220:* mostram 12 px, não 24 |
| Entrar / Criar conta | "Voltar para o início" em Button/S (14/18) |
| Barra lateral | Logo sem quadro branco sobre a superfície escura; espaço entre marca e navegação de 62 px; ativo sem filete lateral; topo sem filete inferior |
| Assistente — início | Envio como ação verde (`default`, antes `brand`); "Conversas recentes" com 240 × 48, raio 12 e Button/S; halo rosa do mascote (`--chart-5` via `color-mix`); "Até 2.000 caracteres" em Mono |
| Assistente — conversa | Título na linha de "Conversas recentes" (padding superior 40 px) em 32/40; resposta da IA em Display S expandido (22/32, 600) |
| Histórico | Título 32/40; Continuar com raio 12 e Button/S; Excluir com 14 px |
| Monitoramento | Título Display expandido 32/40; área de conteúdo `--surface-raised`; estado vazio em card branco com borda |
| Navegação inferior | Destino ativo com pílula `--accent`, além do rosa; rótulos mantidos (AC09) |

### Pares

| Tela / estado | Largura | Figma | App | Conferência | Divergências restantes (categoria) |
|---|---|---|---|---|---|
| Entrar | 1440 | `figma/entrar-desktop.png` | `app/entrar-desktop.png` | lado a lado | Título sem SF Pro Expanded e bloco 24 px mais alto por causa da altura da fonte (FS). "Criar conta" sublinhado, pela regra axe `link-in-text-block` da 0048 (LT, aprovado na 0048) |
| Entrar | 390 | `figma/entrar-mobile.png` | `app/entrar-mobile.png` | lado a lado | Título em uma linha mais estreita, subtítulo em uma linha e marca ~20 px mais alta (FS) |
| Criar conta 1–7 | 1440 | `figma/cadastro-{1..7}-desktop.png` | `app/cadastro-{1..7}-desktop.png` | estado 4 lado a lado; demais por amostragem | Título (FS). A mensagem de e-mail inválido é o texto atual do produto, mais longo que o do quadro (LT: texto inalterado por regra da spec) — **aprovada em 2026-11-07** |
| Criar conta 1–7 | 390 | `figma/cadastro-{1..7}-mobile.png` | `app/cadastro-{1..7}-mobile.png` | por amostragem | Igual ao desktop (FS; o texto de erro é LT e **aprovada em 2026-11-07**) |
| Assistente — início | 1440 | `figma/assistente-inicio-desktop.png` | `app/assistente-inicio-desktop.png` | lado a lado | Título (FS). O aviso do Google dentro do campo segue visível; no Figma ele vai para "Sobre a IA e seus dados", sob demanda, um painel que o produto não tem (SC) — **aprovada em 2026-11-07**. Alça de redimensionar do textarea (LT: comportamento nativo preservado) — **aprovada em 2026-11-07** |
| Assistente — início | 390 | `figma/assistente-inicio-mobile.png` | `app/assistente-inicio-mobile.png` | lado a lado | Título (FS). "Conversas recentes" fica no topo, e não fixo acima da navegação inferior: a posição fixa cobriria o campo em telas baixas, como 390 × 640 (LT) — **aprovada em 2026-11-07**. Navegação inferior com rótulos, enquanto o quadro mostra só ícones (decisão AC09). Aviso do Google (SC, **aprovada em 2026-11-07**). Placeholder "até R$ 3.500" em Mono no quadro (LT: o placeholder é um texto único) |
| Assistente — conversa | 1440 | `figma/assistente-conversa-desktop.png` | `app/assistente-conversa-desktop.png` | lado a lado (depois do ajuste) | Título e resposta (FS). "R$ 3.500" dentro da mensagem do usuário em Mono no quadro (LT: o conteúdo livre não é analisado). Aviso do Google (SC, **aprovada em 2026-11-07**) |
| Assistente — conversa | 390 | `figma/assistente-conversa-mobile.png` | `app/assistente-conversa-mobile.png` | por amostragem | Iguais às do desktop e do início mobile |
| Histórico | 1440 | `figma/historico-desktop.png` | `app/historico-desktop.png` | lado a lado | Título (FS). Subtítulo "Retome suas conversas…", data "Atualizada em …" e rodapé de retenção são textos e dados atuais (LT: texto inalterado). Borda da busca com `--input` (3:1) em vez da borda clara do quadro (LT: AC12, já registrado na 0045) |
| Histórico | 390 | `figma/historico-mobile.png` | `app/historico-mobile.png` | lado a lado | Título (FS). "Excluir" aparece no card, enquanto o quadro mobile só mostra "Continuar" (LT: a ação existe e não pode sumir) — **aprovada em 2026-11-07**. Na captura `fullPage`, a navegação inferior fixa aparece no meio da página (artefato da captura, não do layout) |
| Monitoramento — sem produtos | 1440 | `figma/monitoramento-vazio-desktop.png` | `app/monitoramento-vazio-desktop.png` | lado a lado | Estrutura diferente. O quadro reúne num só painel o título "Monitoramento de preços", o aviso de atualização indisponível, o card vazio com "Ir ao assistente", o card do histórico de preço e a seção Alertas. O app mantém as páginas atuais (Início/Produtos/Alertas, com "Seus produtos" e o formulário de link). Refazer a arquitetura mudaria rotas e textos, fora do escopo (LT). O aviso e "Ir ao assistente" não existem nesse estado (SC). **Aguarda aprovação** |
| Monitoramento — sem produtos | 390 | `figma/monitoramento-vazio-mobile.png` | `app/monitoramento-vazio-mobile.png` | por amostragem | Iguais às do desktop (LT/SC, **aprovada em 2026-11-07**) |
| Monitoramento — com produtos | 1440 | `figma/monitoramento-produtos-desktop.png` | `app/monitoramento-produtos-desktop.png` | lado a lado | Omitidos (SC, decididos na spec): indicadores com "sem estoque", seletor de período, gráfico agregado, "Visão dos produtos", busca, filtros por situação, coluna Loja e seleção. A tabela do app mantém colunas, detalhes por linha e "Ver detalhes" atuais (LT: comportamento preservado) — **aprovada em 2026-11-07** quanto à densidade da tabela. Título (FS) |
| Monitoramento — com produtos | 390 | `figma/monitoramento-produtos-mobile.png` | `app/monitoramento-produtos-mobile.png` | por amostragem | Iguais às do desktop |
| Estados do assistente (137:43) | 1440 | `figma/estados-desktop-a.png` | `app/estados-desktop-a-{carregando-conversas,historico-vazio,falha-lista,envio-em-andamento,falha-envio,ia-indisponivel}.png` | por estado, por amostragem | O quadro é uma prancha de referência com cards isolados; o app mostra cada estado na própria tela. Os textos são os atuais (LT). Nota de rodapé do quadro (SC) |
| Estados do monitoramento (152:535) | 1440 | `figma/estados-desktop-b.png` | `app/estados-desktop-b-{carregando,primeiro-preco,falha,atualizacao-indisponivel}.png` | por estado, por amostragem | "Tentar novamente" é verde no quadro; no app fica em texto, porque a página mantém "Monitorar preço" como única ação verde (AC07) — **aprovada em 2026-11-07**. O card "Atualização de preços indisponível" com dados salvos aparece no app só como sinal "Preço desatualizado" na linha (SC para o card) — **aprovada em 2026-11-07** |
| Estados do assistente mobile (184:200) | 390 | `figma/estados-mobile.png` | `app/estados-mobile-{conversas-recentes,falha-envio}.png` | por amostragem | "Ver exemplos" e "Sobre a IA e seus dados" não existem no produto (SC). "Conversas recentes" e "Quando algo não funciona" foram capturados nos estados reais |

### AC12 — títulos largos a 320 px

- O WebKit do Playwright **não está instalado** (`~/AppData/Local/ms-playwright` só tem Chromium).
  Pela instrução, não foi baixado: fica registrado como limite.
- **Simulação:** `tests/visual/wide-titles.spec.ts` injeta `h1, h2 { letter-spacing: .14em }`, cerca
  de 25% a mais de largura média, acima da diferença entre SF Pro e SF Pro Expanded. Confere em 320 px
  as 12 telas das listas A e B: nenhum `h1`/`h2` passa da viewport e não há rolagem horizontal.
  `npx playwright test tests/visual/wide-titles.spec.ts --project=viewport-320` → **12 passed**.
- **Sensibilidade:** com `1em` de tracking, o mesmo teste falha (8 failed, 4 passed), então ele detecta
  o problema.

### Playwright completo depois de F24/F17–F20 (ponta `518a534`)

`npx playwright test` → **236 passed, 51 failed, 242 skipped** (6,2 min). Os skips incluem a
evidência e a checagem de 320 px, que rodam num só projeto cada. Nenhuma baseline foi atualizada.

| Grupo | Falhas | Classe | Destino |
|---|---|---|---|
| `public-pages` landing (claro/escuro × 4) | 8 | Preexistente (#259) | F26 / #259 |
| `brand` marca landing/inicio (× 4) | 8 | Preexistente (#259, asserção ≥ 40 px) | F26 / #259 |
| `public-pages` login (claro/escuro × 4) | 8 | Diferença visual desta spec | F26 |
| `public-pages` "não encontrada" (claro/escuro × 4) | 8 | Diferença visual desta spec | F26 |
| `signup.spec.ts` 7 estados × desktop/mobile + login/landing com "Criar conta" | 16 | Diferença visual desta spec (inclui o raio de 12 px e "Voltar para o início" em Button/S) | F26 |
| `review-corrections.spec.ts` (390) rodapé e marca do login | 2 | Instáveis sob carga (tempo esgotado em `scrollIntoViewIfNeeded`) | Reexecução isolada: `review-corrections` + `assistant.spec.ts:36` → 1 failed / 15 passed na 1ª e **16 passed** na 2ª |
| `assistant.spec.ts:36` (768) robô `loaded: false` | 1 | Instável sob carga (já registrado na Fase 4) | idem |

### Revisão da F24: todos os pares abertos (substitui a coluna "Conferência" acima)

A coordenação apontou uma regressão no início do assistente e quebras na tabela. Por isso, **os 29
quadros do Figma e as 38 capturas do app foram abertos um a um** (ferramenta Read, PNG), depois da
recaptura. Em cada par foram procurados sobreposição, elemento fora do lugar, quebra indevida e corte.
A coluna "Conferência" da tabela anterior ("por amostragem") fica substituída por esta seção.

**Regressão corrigida — mascote do assistente.**

- **Causa:** a regra `.assistant-welcome > * { position: relative }` (commit `b4bf355`) tirava o mascote
  da posição absoluta. No desktop ele caía sobre o subtítulo; no mobile, entre o subtítulo e o campo.
  O halo ficava sozinho no canto.
- **Correção:** o halo é centrado no mascote pelas mesmas variáveis (`--robot-size`, `--robot-top`,
  `--halo-size`). No mobile, o título reserva o espaço do mascote.
- **Teste novo:** `tests/visual/assistant-hero.spec.ts` (320, 390, 768, 1280). Falha se a caixa do
  mascote cruzar a do `h1` ou a do subtítulo, ou se o centro do halo ficar fora da caixa do mascote.
- **Red:** → **4 failed**: "mascote cobre o subtítulo" a 1280 e "centro do halo fora do mascote" a 320,
  390 e 768. Depois da 1ª correção → 3 failed ("mascote cobre o título" no mobile: o `h1` usava
  `padding-right` e a caixa dele cruzava a do mascote).
- **Green:** → **4 passed**.

| Par (Figma × app) | Largura | Achado ao abrir | Ação |
|---|---|---|---|
| entrar | 1440 | sem sobreposição nem corte; título FS | "Voltar para o início" em Button/S |
| entrar | 390 | espaçamento vertical maior que o do quadro | marca 28 px, título 6 px e campos 24 px abaixo do subtítulo (≤ 700 px) |
| cadastro-1 | 1440 | ok (FS) | — |
| cadastro-2 | 1440 | **estado errado na captura**: foco no e-mail vazio, mas o quadro mostra e-mail e senha preenchidos e foco em Confirmar senha | spec de evidência ajustado |
| cadastro-3 | 1440 | botão "Criando conta…" cinza com contorno; no quadro, verde esmaecido com texto escuro | `aria-disabled` com `color-mix(--action 45%, --background)` e texto `--foreground` (15:1), sem opacity |
| cadastro-4 | 1440 | mensagem de e-mail mais longa (texto atual, LT) | — |
| cadastro-5 | 1440 | senhas apagadas após o 409 (comportamento da 0048, LT) | — |
| cadastro-6 | 1440 | caixa de erro com 72 px; no quadro, 58 px | caixa 15/18 com padding 10 px |
| cadastro-7 | 1440 | mensagem quebrava em duas linhas por causa do tamanho da caixa | mesma correção; senhas apagadas (LT) |
| cadastro-1 a 7 | 390 | estrutura igual à do quadro; espaçamento maior (corrigido junto com Entrar); erro de e-mail em duas linhas (texto atual, LT); senhas apagadas após 409, 429 e falha de rede (LT) | — |
| assistente-inicio | 1440 | **mascote sobre o subtítulo, halo sozinho** | corrigido (acima) |
| assistente-inicio | 390 | **mascote entre subtítulo e campo, halo vazio** | corrigido (acima) |
| assistente-conversa | 1440 | ok depois do ajuste anterior | — |
| assistente-conversa | 390 | navegação inferior desenhada no meio da página (artefato da captura `fullPage` com elemento fixo); resposta e mensagem maiores que no quadro | capturas mobile sem `fullPage` (a viewport cresce até o documento); resposta 17/25 e mensagem do usuário 15/24 |
| historico | 1440 | ok | — |
| historico | 390 | mesmo artefato da navegação fixa | corrigido na captura |
| monitoramento-vazio | 1440 / 390 | divergência estrutural já registrada; sem sobreposição nem corte | — |
| monitoramento-produtos | 1440 | **data "29/10/2026, 14:30" em duas linhas; nomes curtos quebrando; "Ver detalhes" e ⋮ empilhados** | ≥ 1100 px: coluna do produto com 24%; preço, aviso de preço, data e menor preço sem quebra; ações lado a lado. Colunas e dados iguais |
| monitoramento-produtos | 390 | linhas compactas; sem corte | — (densidade já registrada) |
| estados-desktop-a × carregando, vazio, falha da lista | 1440 | painel de recentes cobre o mascote por ser sobreposição (intencional); "Nova conversa" e "Tentar novamente" em pílula, mas o quadro usa raio 12 | raio 12 e Button/S; "Tentar novamente" com contorno rosa |
| estados-desktop-a × envio em andamento | 1440 | campo sem esmaecer; aviso sem destaque | campo `--surface` durante o envio; "Preparando uma resposta…" em 600 |
| estados-desktop-a × falha no envio | 1440 | sem a caixa "mensagem preservada" nem o botão de tentar de novo do quadro (SC) | — |
| estados-desktop-a × IA indisponível | 1440 | aviso cinza; no quadro, amarelo de atenção | aviso com `--status-warning-soft`/`--status-warning`. A primeira versão ficou em negrito escuro por uma regra de status; corrigida com `:not(.research-notice)` |
| estados-desktop-b × carregando, primeiro preço, falha | 1440 | sem sobreposição; "Tentar novamente" em texto (já registrado, aprovada em 2026-11-07) | — |
| estados-desktop-b × atualização indisponível | 1440 | "Preço desatualizado" quebrava em duas linhas | sem quebra no desktop |
| estados-mobile × conversas recentes, falha no envio | 390 | datas sem Mono | datas das recentes em Mono |

Recaptura final: `npx playwright test tests/visual/evidence-0049.spec.ts tests/visual/assistant-hero.spec.ts`
→ **42 passed**.

### Playwright completo depois da revisão da F24 (ponta `cfa2b19`)

`npx playwright test` → **238 passed, 53 failed, 242 skipped** (6,6 min).

| Grupo | Falhas | Classe | Destino |
|---|---|---|---|
| `public-pages` landing (claro/escuro × 4) | 8 | Preexistente (#259) | F26 / #259 |
| `brand` marca landing/inicio (× 4) | 8 | Preexistente (#259, asserção ≥ 40 px) | F26 / #259 |
| `public-pages` login e "não encontrada" (claro/escuro × 4) | 16 | Diferença visual desta spec | F26 |
| `signup.spec.ts` 7 estados × desktop/mobile + login/landing com "Criar conta" | 16 | Diferença visual desta spec (agora inclui o botão enviando em verde esmaecido, a caixa de erro de 58 px e o espaçamento mobile) | F26 |
| `signup.spec.ts:170`, `:214`, `assistant.spec.ts:36`, `:84`, `:109` | 5 | Instáveis no ambiente: `net::ERR_NETWORK_CHANGED` em `page.goto` e tempo esgotado sob carga | Reexecução isolada (`assistant.spec.ts`, `signup.spec.ts:170`, `:214`) → **40 passed** |

A lista da F26 não muda de composição: são as 16 preexistentes e as 32 desta spec, e as capturas
do cadastro absorvem os novos ajustes.

## Aprovação das divergências do AC08 (2026-11-07)

A responsável aprovou, no chat, todas as divergências que aguardavam decisão:

- **Assistente:** aviso do Google dentro do campo; alça de redimensionar; "Conversas recentes" no topo no mobile.
- **Cadastro e Histórico:** texto de erro de e-mail atual; senhas apagadas após 409, 429 ou falha de rede (0048); "Excluir" no card do histórico mobile.
- **Monitoramento:** estrutura do estado vazio; densidade da tabela; "Tentar novamente" em texto (AC07); indisponibilidade como aviso "Preço desatualizado" na linha.

Nenhuma divergência do AC08 fica pendente.

## F26 — Atualização das referências visuais (2026-11-07)

- A revisão aconteceu numa página com o antes e o depois de cada captura. A responsável aprovou no chat todos os grupos:
  - Entrar: 9 capturas, mais o login mobile com "Criar conta";
  - Criar conta: 14 capturas;
  - Não encontrada: 8 capturas;
  - Landing atual: 9 capturas, mais o menu mobile.
- No total foram 42 capturas, em `public-pages.spec.ts` e `signup.spec.ts`.
- Comando: `npx playwright test tests/visual/public-pages.spec.ts tests/visual/signup.spec.ts --update-snapshots`.
  - Na reexecução sem a atualização: **48 passed**.
- `brand.spec.ts`: o tamanho mínimo da marca passou de 40 para 34 px. Isso segue a mudança intencional do cabeçalho feita nas specs 0040 e 0043 (#259).
  - **Correção do registro (I3/QA):** a execução teve **32 passed e 4 failed**, não "32 passed". "marca inicio" falhava nas 4 larguras com `toHaveCount(1)` recebendo 0: o teste procurava a marca por um nome que o shell interno não usa. Corrigido no commit "procura a marca do shell interno pelo nome que a tela usa" (seletor por "BestPrice IA — Assistente", demais asserções iguais). `npx playwright test tests/visual/brand.spec.ts --workers=2` → **36 passed**.
- As 16 falhas preexistentes da #259 ficam resolvidas por esta atualização, aprovada pela responsável.

## F25 — Acessibilidade e responsividade das listas A e B (QA, 2026-11-07, ponta `a2d2e32`)

Papel `qa`. Windows 11, Chromium do Playwright 1.64 headless, sem SF Pro e sem WebKit. Todas as
verificações usam API simulada por `page.route`; nenhuma usa backend nem PostgreSQL reais.

### Cobertura dos specs Playwright versionados (execução completa na F27, abaixo)

| Verificação | Specs que cobrem | Telas | Larguras |
|---|---|---|---|
| axe (wcag2a/aa, 21a/aa, 22aa) | `redesign`, `assistant`, `history`, `signup`, `brand`, `grounding`, `catalog` | Entrar, Criar conta, Assistente, Conversa, Histórico, Monitoramento (vazio, erro, carregando), Produtos, Detalhe, Alertas, Landing, Não encontrada, catálogo | 320, 390, 768, 1280 |
| Alvos de 44 px | `redesign`, `assistant`, `history`, `signup`, `grounding`, `catalog` | as mesmas | 320, 390, 768, 1280 |
| Sem rolagem horizontal | os mesmos, mais `wide-titles` (títulos largos simulados) e `login-footer` | as mesmas, mais o Comparador (só no `wide-titles`) | 320, 390, 768, 1280; `wide-titles` só a 320 |
| Teclado | `interaction` (menu da landing), `signup` (Tab/Shift+Tab), `history` (busca), `assistant` (shell), `catalog` (select, menu, tooltip, diálogo, toast), `grounding` | Landing, Criar conta, Histórico, Assistente/Monitoramento, catálogo | 320, 390, 768, 1280 |
| `prefers-reduced-motion` | `interaction.spec.ts` ("movimento reduzido…") | só Entrar | 320, 390, 768, 1280 |

**Lacunas dos specs versionados:**

- **Comparador** (`/app/compare`, lista B): sem axe, sem alvos de 44 px e sem teclado. Só tem a
  checagem de rolagem do `wide-titles`, a 320 px.
- **Movimento reduzido:** só a tela Entrar é verificada.
- **Teclado:** não há um percurso por Tab com foco visível em cada tela.

### Verificação suplementar ad hoc (não versionada)

Para fechar essas lacunas sem alterar testes, rodou-se um script no scratchpad da sessão
(`qa-f25.cjs`), com o Chromium e o `@axe-core/playwright` do `frontend/`, contra
`npm run dev -- --port 5199`. Foram 13 telas × 4 larguras = **52 combinações**, todas com
`reducedMotion: 'reduce'` e altura de 800 px.

- **Telas:** Entrar, Criar conta, Assistente, Conversa, Histórico, Monitoramento vazio,
  Monitoramento com produtos, Produtos, Detalhe, Alertas, Comparador, Landing e Não encontrada.
- **Medidas por combinação:**
  - axe com as mesmas tags;
  - controles visíveis menores que 43 px (contando o `::after` de alvo);
  - `scrollWidth − innerWidth`;
  - animações CSS ativas e transições não nulas;
  - até 60 Tabs, com o indicador de foco (outline ou box-shadow) de cada parada;
  - requisições de fonte para fora da origem;
  - botões verdes visíveis.

| Medida | Resultado nas 52 combinações |
|---|---|
| Violações axe | **0** |
| Alvos < 44 px | **0** |
| Rolagem horizontal | **0 px** em todas |
| Animação ativa / transição não nula com `reduce` | **0 / 0** |
| Paradas de Tab sem indicador | 0 reais. O script marcou "Ver detalhes de …" (Monitoramento com produtos e Produtos, a 320, 390 e 768); a inspeção mostrou que o anel fica no `::after` que cobre a linha (`styles.css:639`). É falso positivo do script |
| Fonte externa | **0** requisições |
| Verde visível (AC07) | Lista A: no máximo 1 (Entrar, Criar conta, Enviar mensagem, Monitorar preço; Histórico e Monitoramento com produtos: 0). Lista B: Detalhe 1, Comparador 1, Não encontrada 1; a Landing tem 2 ou 3 "Começar com IA" (o AC07 vale só para a lista A; a landing atual fica para a spec própria) |

**Limites:**

- O script é evidência de QA, não teste versionado; quem quiser repetir precisa recriá-lo.
- O contraste 3:1 de bordas de controle e foco (WCAG 1.4.11) não é medido pelo axe nem pelo
  script; só os pares de texto e fundo (`color-contrast`) foram verificados.
- Os estados de carregamento sem quadro só têm a cobertura do `redesign` ("carregando").
- Títulos largos continuam simulados (WebKit não instalado, limite já aceito).

**Situação F25:** passou. Nenhuma violação nas 4 larguras, nas listas A e B, somando os specs
versionados e a verificação ad hoc. As lacunas dos specs (Comparador, movimento reduzido fora de
Entrar, percurso de Tab) ficam registradas como sugestão de teste, sem defeito de produto.

## F27/QA — Gates finais (2026-11-07, ponta `a2d2e32`)

### Frontend (`frontend/`, `node_modules` já instalado, Node 22.18.0)

| Comando | Resultado |
|---|---|
| `npm run lint` | saída 0, sem problemas |
| `npm test` (1ª) | **1 failed, 705 passed (706)**, 50 arquivos. A falha foi em `App.test.tsx` "preserva preço desconhecido…": `findByRole('heading', 'Fone sem fio')` esgotou o tempo, a mesma instabilidade de carga da F0 |
| `npx vitest run src/App.test.tsx` (2 vezes) | **40 passed** nas duas |
| `npm test` (2ª, completa) | **706 passed (706)**, 50 arquivos |
| `npm run build:check` | saída 0. `tsc -b` + `vite build` passaram (CSS `index-CSJhvWMH.css` 150,37 kB, gzip 26,86 kB). Saídas: "Sem vestígios do catálogo em dist (5 marcadores conferidos)" e "Fontes conforme em dist: Geist Mono latin/latin-ext 400–600, sem base64" |
| `npx playwright test` (completa) | **286 passed, 5 failed, 242 skipped** (533 testes, 6,8 min) |
| Reexecução isolada: `npx playwright test tests/visual/brand.spec.ts tests/visual/assistant.spec.ts:36` | **36 passed, 4 failed**. `assistant.spec.ts:36` (390) passou: é a instabilidade conhecida da imagem de 1,1 MB (`loaded: false`). Os 4 de `brand` "marca inicio" falharam de novo |

**Falha determinística (defeito, não corrigido pelo QA):** `brand.spec.ts:44` "marca inicio"
falha em 320, 390, 768 e 1280.

- **Erro:** `toHaveCount(1)` recebeu 0 na linha 120.
- **Causa:** o localizador aceita `img "BestPrice"` ou os links "BestPrice — Início",
  "BestPrice AI — Início" e "BestPrice AI — Dashboard". Em `/app/monitoring/overview`, a marca é o
  link "BestPrice IA — Assistente" (`ResearchArea.tsx:67`, igual em `origin/develop` desde `fb46498`).
- **Por que só apareceu agora:** antes da F26, o teste parava antes, na asserção de largura ≥ 40 px
  (linha 110). Com o limite em 34 px, ele chega ao localizador.
- **Registro da F26:** o "brand.spec.ts: 32 passed" corresponde a 32 de 36 testes; esses 4 não
  foram registrados como falha.
- **Reproduzir:** `cd frontend && npx playwright test tests/visual/brand.spec.ts -g "marca inicio"`.
- **Situação:** falha da #259 ainda aberta. A correção é do teste (incluir o nome
  "BestPrice IA — Assistente" no localizador) e precisa de decisão da responsável e do papel
  `frontend`.

**Efeito colateral observado:** a execução completa regravou 6 PNGs versionados de
`evidence/app/`, porque `evidence-0049.spec.ts` grava direto em `specs/…/evidence/app/`:

- `cadastro-3` e `cadastro-7` (desktop e mobile);
- `estados-desktop-a-envio-em-andamento`;
- `estados-desktop-a-falha-envio`.

Os arquivos foram restaurados com `git checkout`. Qualquer `npx playwright test` completo suja a
árvore com diferenças de renderização.

### Backend (sanidade; o branch não altera `backend/`: `git diff --stat de5d8ee..HEAD -- backend` vazio)

| Comando | Resultado |
|---|---|
| `uv sync --locked --extra dev` | ok |
| `uv run ruff check .` | All checks passed! |
| `uv run pytest -q -rs` | **407 passed, 61 skipped**, 1 warning (34,8 s) |
| `uv run pytest -q tests/test_health.py tests/test_health_integration.py -rs` | **3 passed, 2 skipped** |

- **Testes pulados:** 59 dos 61 são de integração, pulados por `TEST_DATABASE_URL` não
  configurada; os outros 2 são `test_stage_start.py`, um script POSIX.
- **Ambiente:** o Docker não está disponível (`docker ps` não conecta ao `dockerDesktopLinuxEngine`)
  e não há PostgreSQL de teste.
- **`/api/health`:** as respostas **200 e 503 foram verificadas só por simulação**
  (`test_health.py`, conexão substituída por dublê). As versões com PostgreSQL real
  (`test_health_integration.py`) **não rodaram**.
- **Falha de rede na UI:** também só por simulação, com API interceptada. Cobrem esse caso
  `signup.spec.ts` "falha-de-rede", o `redesign` "erro" (503 do painel) e os estados de falha de
  `assistant`/`history`.
- **Fluxo ponta a ponta:** não foi conferido com os três serviços reais (API, SPA e PostgreSQL). A
  spec não muda o backend nem o contrato; fica como limite.
- **Complexidade:** o `complexity_report.py` não foi executado, porque não há mudança no backend.

**Não executado / não afirmado:** CI do GitHub, PR, Project e release. A revisão `arch-reviewer`
final (I3) é separada e não é afirmada aqui.

**Situação F27:** **não passou**. O Playwright completo tem 4 falhas determinísticas
(`brand.spec.ts` "marca inicio"). Lint, Vitest (2ª execução), `build:check` e pytest passaram, com
contagens positivas.

### AC01–AC15 (QA)

| AC | Evidência | Situação |
|---|---|---|
| AC01 Tokens | `src/tokens.figma.test.ts` compara as 67 variáveis, os valores Noite, os efeitos e os estilos de texto com `styles.css` (no `npm test`, 706 passed). Divergência `--color-brand-strong` aprovada (seção I2) | **Parcial:** a comparação é automática, mas a verificação não traz a tabela 1:1 (variável, token, esperado, obtido) que o AC pede |
| AC02 Sem cor solta | `src/no-raw-colors.test.ts` (2 passed, dentro dos 706). Exceções justificadas: seletores de traço do Recharts e `--color-brand-strong` | Demonstrado (varredura estática de `src/`) |
| AC03 Tipografia | `tokens.figma.test.ts` (22 estilos), pares do AC08 e Geist Mono + `tabular-nums` nos dados (seção Fase 4). Sistema da comparação: Windows 11, sem SF Pro | Demonstrado, com fonte substituta (FS) aprovada |
| AC04 Forma, elevação, foco e movimento | `tokens.figma.test.ts` (efeitos, `--ring-width`, `--motion-*`, bloco de movimento reduzido). Com `reduce`, 0 transições (F25) | **Parcial:** falta na verificação a lista de valor esperado × obtido dos estilos calculados de botão, campo, card, menu e diálogo |
| AC05 Biblioteca completa | Inventário D2, `catalog.spec.ts` (passou nas 5 larguras) | **Parcial:** a coluna node-id da seção 2 continua "a preencher na D3" |
| AC06 Catálogo restrito | `src/dev/catalogRoute.test.tsx`, `scripts/check-no-catalog.test.ts`, `npm run build:check` ("Sem vestígios… 5 marcadores") | Demonstrado |
| AC07 Ação única | `src/primaryAction.test.tsx` (jsdom). Contagem no navegador (F25 ad hoc): no máximo 1 verde nas telas da lista A. `redesign` "tokens": `bg-action` `rgb(57,255,20)` com texto `rgb(0,0,0)` | Demonstrado |
| AC08 Telas fiéis | Pares em `evidence/`, seção F24 e aprovação de 2026-11-07 | Demonstrado (todas as divergências aprovadas) |
| AC09 Navegação | Seção Fase 4 (F16), capturas `evidence/app/*`, `assistant.spec.ts` "shell" (uma `aria-current`) | Demonstrado por captura e revisão visual; a cor rosa do item ativo não tem asserção automática |
| AC10 Gráfico | `src/dashboard/PriceHistoryChart.test.tsx` (14 passed na F15; dentro dos 706); `chartTargetPrice` (seção I2); `App.test.tsx` "preserva preço desconhecido" (sem histórico) | Demonstrado |
| AC11 Comportamento preservado | Vitest **706 passed**; pytest **407 passed**. Asserções visuais alteradas listadas (rodapé `rgb(10,10,15)`; marca ≥ 34 px na F26) | **Parcial:** a suíte Playwright não está verde (`brand` "marca inicio", 4 failed) |
| AC12 Acessibilidade | F25: specs versionados e verificação ad hoc com 52 combinações, 0 violações | **Parcial:** o 3:1 de bordas e foco (1.4.11) não foi medido de forma sistemática; títulos largos só simulados (limite aceito) |
| AC13 Regressão visual revisada | Seção F26 (42 capturas aprovadas) | **Parcial:** as 4 falhas de `brand` "marca inicio" da #259 não estão resolvidas nem separadas explicitamente |
| AC14 Fontes sem serviço externo | `catalog.spec.ts` (fonte local), `scripts/check-fonts.mjs`. F25 ad hoc: 0 requisições externas de fonte em 52 combinações. `designsystem/licenses/GeistMono-OFL.txt` | Demonstrado |
| AC15 Documentação | `designsystem/README.md` § "Design system 2026" (tokens novos e alterados, correspondência do Button, substituição da 0042, fontes e licença, versão do Figma) | **Parcial:** D4 em aberto. O README não registra as variantes de status de preço do Badge, a exceção `--color-brand-strong` nem a lista das divergências resolvidas a favor do Figma; `docs/apps/frontend.md` e `docs/PROGRESS.md` não foram conferidos pelo QA |

## Correções da revisão I3 e lacunas da QA (2026-11-07)

| Item | Resultado | Evidência |
|---|---|---|
| I-1 rolagem lateral no monitoramento (AC12) | **Corrigido.** O bloco de uma linha da tabela passou de `@media (min-width:1100px)` para uma container query na área de conteúdo (`.dashboard-content`, ≥ 1120 px), com tabela compacta abaixo de 900 px | `tests/visual/monitoring-overflow.spec.ts` (preço R$ 12.879,00 e nome longo, em `/app/monitoring` e `/produtos`). **Red:** 2 failed (+130 px a 1100 e +50 px a 1200; 1280 e 1440 passaram). 1ª correção: +28 px a 1100. **Green:** **10 passed** (1024, 1100, 1200, 1280 e 1440 nas duas rotas), data numa linha a 1440 |
| I-2 textos em inglês | **Corrigido** em `pagination.tsx`, `sheet.tsx` e `sidebar.tsx`, com comentário do desvio em relação ao registry | `src/components/ui/i18n.test.tsx`: **Red** 5 failed; **Green** 5 passed |
| `brand.spec.ts:44` "marca inicio" | **Corrigido no teste:** o seletor aceita "BestPrice IA — Assistente", o nome do shell desde `fb46498`. Demais asserções iguais | `npx playwright test tests/visual/brand.spec.ts --workers=2` → **36 passed** (antes: 32 passed, 4 failed) |
| Evidência sob `EVIDENCE_0049=1` | `evidence-0049.spec.ts` é pulado sem a variável; a rodada completa não altera `evidence/app/` | Para regravar: `EVIDENCE_0049=1 npx playwright test tests/visual/evidence-0049.spec.ts --project=viewport-1440` |
| `networkidle` → espera de texto | Espera "Você ainda não está acompanhando nenhum produto." | — |
| `catalogRoute.test.tsx` | `it(..., 30_000)`, limite explícito acima da espera de 14 s | `npx vitest run src/dev` → 2 passed |
| `--destructive-soft` | `--color-danger-bg: var(--destructive-soft)`, com `--destructive-soft: color-mix(in srgb, var(--destructive) 7%, var(--background))`; o erro não usa mais o token de status "preço subiu" | `tokens.figma.test.ts` verde |
| `no-raw-colors` | Detecta `oklch()`, `lab()`, `lch()`, `oklab()` e `hwb()`, além da paleta fixa do Tailwind (`bg-white`, `text-zinc-500`, `bg-black/50`...) | **Red:** 5 failed; **Green:** 8 passed. Nenhuma ocorrência no código |
| `sheet.tsx` foco | Fechar com `focus-visible:ring-[length:var(--ring-width)]` | — |
| Seletor por id em `assistant.css` | Trocado por `.assistant-message-hint`; em `styles.css`, `#assistant-character-count` virou `.assistant-character-count` | — |

### AC01 — tabela 1:1 gerada (`cd frontend && node scripts/token-table.mjs`)

A tabela abaixo é a saída do script, não foi escrita à mão. `scripts/token-table.test.ts` garante 74
linhas e nenhuma divergência. "Noite (fixas)" confere as superfícies escuras fixas (`--sidebar-*`, `--night-*`).

| Variável do Figma | Token CSS | Esperado | Obtido | Noite (fixas) | Confere |
|---|---|---|---|---|---|
| color/background | `--background` | `#ffffff` | `#ffffff` | — | sim |
| color/foreground | `--foreground` | `#1d1d1f` | `#1d1d1f` | — | sim |
| color/card | `--card` | `#ffffff` | `#ffffff` | — | sim |
| color/card-foreground | `--card-foreground` | `#1d1d1f` | `#1d1d1f` | — | sim |
| color/popover | `--popover` | `#ffffff` | `#ffffff` | — | sim |
| color/popover-foreground | `--popover-foreground` | `#1d1d1f` | `#1d1d1f` | — | sim |
| color/primary | `--primary` | `#c7005e` | `#c7005e` | — | sim |
| color/primary-foreground | `--primary-foreground` | `#ffffff` | `#ffffff` | — | sim |
| color/secondary | `--secondary` | `#f5f5f7` | `#f5f5f7` | — | sim |
| color/secondary-foreground | `--secondary-foreground` | `#1d1d1f` | `#1d1d1f` | — | sim |
| color/muted | `--muted` | `#f5f5f7` | `#f5f5f7` | — | sim |
| color/muted-foreground | `--muted-foreground` | `#626267` | `#626267` | — | sim |
| color/accent | `--accent` | `#fce9f2` | `#fce9f2` | — | sim |
| color/accent-foreground | `--accent-foreground` | `#1d1d1f` | `#1d1d1f` | — | sim |
| color/destructive | `--destructive` | `#b42318` | `#b42318` | — | sim |
| color/destructive-foreground | `--destructive-foreground` | `#ffffff` | `#ffffff` | — | sim |
| color/border | `--border` | `#d2d2d7` | `#d2d2d7` | — | sim |
| color/input | `--input` | `#86868b` | `#86868b` | — | sim |
| color/ring | `--ring` | `#c7005e` | `#c7005e` | — | sim |
| color/action | `--action` | `#39ff14` | `#39ff14` | — | sim |
| color/action-foreground | `--action-foreground` | `#000000` | `#000000` | — | sim |
| color/action-hover | `--action-hover` | `#2fe80c` | `#2fe80c` | — | sim |
| color/surface | `--surface` | `#f5f5f7` | `#f5f5f7` | — | sim |
| color/surface-raised | `--surface-raised` | `#fbfbfd` | `#fbfbfd` | — | sim |
| color/chart-1 | `--chart-1` | `#1d1d1f` | `#1d1d1f` | — | sim |
| color/chart-2 | `--chart-2` | `#39ff14` | `#39ff14` | — | sim |
| color/chart-3 | `--chart-3` | `#c7005e` | `#c7005e` | — | sim |
| color/chart-4 | `--chart-4` | `#86868b` | `#86868b` | — | sim |
| color/chart-5 | `--chart-5` | `#ff3ea5` | `#ff3ea5` | — | sim |
| color/sidebar | `--sidebar` | `#0a0a0f` | `#0a0a0f` | `#0a0a0f` | sim |
| color/sidebar-foreground | `--sidebar-foreground` | `#f5f5f7` | `#f5f5f7` | `#f5f5f7` | sim |
| color/sidebar-primary | `--sidebar-primary` | `#ff3ea5` | `#ff3ea5` | `#ff3ea5` | sim |
| color/sidebar-primary-foreground | `--sidebar-primary-foreground` | `#0a0a0f` | `#0a0a0f` | `#0a0a0f` | sim |
| color/sidebar-accent | `--sidebar-accent` | `#1e1e28` | `#1e1e28` | `#1e1e28` | sim |
| color/sidebar-accent-foreground | `--sidebar-accent-foreground` | `#ff3ea5` | `#ff3ea5` | `#ff3ea5` | sim |
| color/sidebar-border | `--sidebar-border` | `#2a2a36` | `#2a2a36` | `#2a2a36` | sim |
| color/sidebar-ring | `--sidebar-ring` | `#ff3ea5` | `#ff3ea5` | `#ff3ea5` | sim |
| color/status/down | `--status-down` | `#146c38` | `#146c38` | — | sim |
| color/status/down-soft | `--status-down-soft` | `#e9fbe8` | `#e9fbe8` | — | sim |
| color/status/up | `--status-up` | `#b42318` | `#b42318` | — | sim |
| color/status/up-soft | `--status-up-soft` | `#fff0ee` | `#fff0ee` | — | sim |
| color/status/warning | `--status-warning` | `#925400` | `#925400` | — | sim |
| color/status/warning-soft | `--status-warning-soft` | `#fff4dd` | `#fff4dd` | — | sim |
| color/status/target | `--status-target` | `#39ff14` | `#39ff14` | — | sim |
| color/night/950 | `--night-950` | `#0a0a0f` | `#0a0a0f` | `#0a0a0f` | sim |
| color/night/900 | `--night-900` | `#13131a` | `#13131a` | `#13131a` | sim |
| color/night/800 | `--night-800` | `#1e1e28` | `#1e1e28` | `#1e1e28` | sim |
| color/night/line | `--night-line` | `#2a2a36` | `#2a2a36` | `#2a2a36` | sim |
| color/night/muted | `--night-muted` | `#a1a1aa` | `#a1a1aa` | `#a1a1aa` | sim |
| radius/sm | `--radius-sm` | `8px` | `8px` | — | sim |
| radius/md | `--radius-md` | `12px` | `12px` | — | sim |
| radius/lg | `--radius-lg` | `18px` | `18px` | — | sim |
| radius/xl | `--radius-xl` | `24px` | `24px` | — | sim |
| radius/2xl | `--radius-2xl` | `32px` | `32px` | — | sim |
| radius/pill | `--radius-pill` | `980px` | `980px` | — | sim |
| space/1 | `--space-1` | `4px` | `4px` | — | sim |
| space/2 | `--space-2` | `8px` | `8px` | — | sim |
| space/3 | `--space-3` | `12px` | `12px` | — | sim |
| space/4 | `--space-4` | `16px` | `16px` | — | sim |
| space/5 | `--space-5` | `20px` | `20px` | — | sim |
| space/6 | `--space-6` | `24px` | `24px` | — | sim |
| space/8 | `--space-8` | `32px` | `32px` | — | sim |
| space/10 | `--space-10` | `40px` | `40px` | — | sim |
| space/12 | `--space-12` | `48px` | `48px` | — | sim |
| space/16 | `--space-16` | `64px` | `64px` | — | sim |
| space/20 | `--space-20` | `80px` | `80px` | — | sim |
| space/30 | `--space-30` | `120px` | `120px` | — | sim |
| Elevação/0 · plano | `--shadow-0` | `none` | `none` | — | sim |
| Elevação/1 · card | `--shadow-1` | `0 1px 2px rgb(0 0 0 / .04), 0 8px 24px rgb(0 0 0 / .06)` | `0 1px 2px rgb(0 0 0 / .04), 0 8px 24px rgb(0 0 0 / .06)` | — | sim |
| Elevação/2 · flutuante | `--shadow-2` | `0 12px 32px rgb(0 0 0 / .10)` | `0 12px 32px rgb(0 0 0 / .10)` | — | sim |
| Elevação/3 · destaque | `--shadow-3` | `0 30px 60px rgb(0 0 0 / .14)` | `0 30px 60px rgb(0 0 0 / .14)` | — | sim |
| Elevação/Brilho ação | `--shadow-action-glow` | `0 8px 24px rgb(56 255 20 / .45)` | `0 8px 24px rgb(56 255 20 / .45)` | — | sim |
| Foco/Anel rosa | `--ring-width` | `3px` | `3px` | — | sim |
| Vidro/Desfoque 20 | `--blur-glass` | `20px` | `20px` | — | sim |

74 linhas (67 variáveis + 7 efeitos); divergências: 0.

### AC04 — esperado × obtido nos estilos calculados (`tests/visual/ds-measures.spec.ts`)

Medido no Chromium (1280 px) sobre o catálogo local. Os estados de foco foram medidos com movimento
reduzido, para não ler uma transição em curso. A tabela vem de `ac04-medidas.json`, gerado pelo
spec (`test-results/`). O spec falha se algum valor divergir.

| Componente | Propriedade | Esperado (Figma) | Obtido (estilo calculado) |
|---|---|---|---|
| Button (`default`) | raio | pílula (`rounded-full`) | `3.35544e+07px` |
| Button (`default`) | duração da transição | `--motion-fast` 160 ms | `0.16s, 0.16s, 0.16s, 0.16s` |
| Button (`default`) | anel de foco | 3px `--ring` (#c7005e) | `3px rgb(199, 0, 94)` |
| Input | raio | `--radius-md` 12 px | `12px` |
| Input | duração da transição | 160 ms | `0.16s` |
| Input | borda em repouso | `--input` (#86868b) | `rgb(134, 134, 139)` |
| Input | foco: borda / anel | `--ring` / 3px `--ring` | `rgb(199, 0, 94) / 3px rgb(199, 0, 94)` |
| Card | raio | `--radius-lg` 18 px | `18px` |
| Card | sombra | `--shadow-0` (none) | `none` |
| Alert Dialog | raio | `--radius-xl` 24 px | `24px` |
| Alert Dialog | sombra | `--shadow-3` 0 30px 60px rgb(0 0 0 / .14) | `0.14) 0px 30px 60px 0px` |

Contraste (WCAG 1.4.11, mínimo 3:1, contra o fundo `#ffffff`): borda do campo **3.62:1**; borda do campo em foco **5.85:1**; anel de foco do Button **5.85:1**.

O anel de foco do Input é o contorno global `:focus-visible` (3 px `--ring`) somado à borda rosa: o
`box-shadow` do anel do Tailwind é anulado pela regra global `[data-slot="input"] { box-shadow: none }`.

### AC05, AC09 e AC12

- **AC05:** node-ids da seção 2 preenchidos no inventário da D2 (valores do Figma enviados pela coordenação).
- **AC09:** `ds-measures.spec.ts` confere que a cor calculada do item ativo é a do token: na barra
  lateral, a 1280 px, é `--sidebar-accent-foreground` (rgb(255, 62, 165)); na navegação inferior, a
  390 px, é `--primary` (rgb(199, 0, 94)). → 2 passed.
- **AC12:** contraste ≥ 3:1 da borda do campo, da borda em foco e do anel de foco (valores acima).
  Comparador (`/app/compare`) com axe WCAG 2.2 AA, alvos de 44 px e sem rolagem lateral em 320, 390,
  768 e 1280 px → **4 passed**. `ds-measures.spec.ts` no total: **7 passed**.

### F27 — Gates depois das correções da I3 e da QA (ponta `72566f7`)

| Comando | Resultado |
|---|---|
| `npm run lint` | 0 problemas |
| `npm test` | 52 arquivos, **718 passed** |
| `npm run build:check` | build ok; "Sem vestígios do catálogo em dist"; "Fontes conforme em dist" (CSS principal 151,15 kB, gzip 27,02 kB) |
| `npx playwright test` (12 workers, execução única) | **270 passed, 0 failed, 331 skipped** (5,9 min). Os skips são testes com largura fixa que rodam num só projeto e a evidência sem `EVIDENCE_0049` |
| `git status` depois do Playwright | limpo (a evidência versionada não foi regravada) |
| Backend (sanidade): `uv run ruff check .` / `uv run pytest -q` | All checks passed! / **407 passed, 61 skipped** (integração sem `TEST_DATABASE_URL`, como no registro da QA) |

Não foi preciso reexecutar com `--workers=2`. Nenhuma referência visual aprovada na F26 mudou: os 42
snapshots de `public-pages.spec.ts` e `signup.spec.ts` passaram sem atualização.
