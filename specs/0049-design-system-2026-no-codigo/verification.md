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

## F5 — CLI do shadcn: bloqueada (pendente de aprovação)

`npx shadcn@latest add textarea label checkbox switch radio-group select tabs alert alert-dialog dropdown-menu tooltip sonner avatar progress pagination sidebar --dry-run`
(07/11/2026, em `frontend/`) mostrou, **antes de gravar qualquer arquivo**:

- **Dependências fora da aprovação:** `next-themes` (exigida pelo `sonner` do registry) e `cn`
  (declarada por todos os itens, inclusive `textarea` e `sidebar`). A aprovação cobre só
  `sonner` e `@fontsource/geist-mono`. Pela regra da delegação, a CLI **não foi executada**.
- **Sobrescritas:** `button.tsx`, `separator.tsx`, `input.tsx` e `skeleton.tsx` (dependências de
  `sidebar`/`alert-dialog`/`pagination`) seriam sobrescritas; seriam recusadas.
- **CSS:** "16 CSS variables added to src/styles.css" (variáveis do `sidebar`), que entrariam em
  conflito com os tokens do snapshot do Figma.

Ficam pendentes F5, F9 (Checkbox, Switch, Radio, Select) e a parte CLI de F8 (Textarea, Label),
F10 (Alert, Alert Dialog, Dropdown Menu, Tooltip, Sonner, Tabs) e F11 (Pagination, Sidebar,
Avatar, Progress). Decisão necessária da pessoa responsável: aprovar `next-themes` (ou um
`sonner.tsx` sem ele, já que o tema é claro fixo) e decidir sobre `cn` (possivelmente um
artefato do registry; instalar um pacote npm chamado `cn` não é necessário, pois `cn` já existe
em `src/lib/utils.ts`), além de rodar a CLI recusando as sobrescritas e sem aceitar as variáveis
CSS do registry.

## D2 — Inventário do AC05 no catálogo local (parcial)

Catálogo em `/dev/design-system` (`src/dev/DesignSystemCatalog.tsx`), capturado por
`tests/visual/catalog.spec.ts` (seções em `frontend/test-results/catalog-*/<seção>.png`, não
versionadas). `npx playwright test tests/visual/catalog.spec.ts` → **5 passed** (320, 390, 768,
1280 e 1440): seções visíveis, nenhuma fonte de origem externa, `document.fonts.check('13px
"Geist Mono"')` verdadeiro, sem rolagem horizontal e axe WCAG 2.2 AA sem violações.
Os node-ids da seção 2 não estão no snapshot exportado; a coluna fica para a Fase 5 (D3), com
acesso ao Figma.

| Componente (Figma) | Código | Variantes no catálogo | Estados no catálogo | Situação |
|---|---|---|---|---|
| Button | `ui/button.tsx` | action→`default`, default→`brand`, secondary, outline, ghost, link, destructive; sm/default/lg/icon | padrão, hover e foco forçados por classe, desabilitado, carregando | presente |
| Badge | `ui/badge.tsx` | default, secondary, destructive, outline; status `down`, `up`, `stable`, `target`, `stale`, `unverified` (ícone + texto) | — | presente |
| Input / Field | `ui/input.tsx`, `ui/field.tsx` | com descrição, erro, contador | padrão, foco forçado, inválido, desabilitado, contador perto do limite | presente |
| Card | `ui/card.tsx` | header, descrição, conteúdo, rodapé | — | presente |
| Table | `ui/table.tsx` | cabeçalho mono, linhas | linha com hover forçado | presente |
| Skeleton, Separator | `ui/skeleton.tsx`, `ui/separator.tsx` | — | — | presente |
| Estado vazio | `components/EmptyState.tsx` | com ação | — | presente |
| Card de gráfico | `components/PriceChartCard.tsx` + `PriceHistoryChart` | — | — | presente |
| Chart | `ui/chart.tsx` | dentro do card de gráfico | — | presente |
| Textarea, Label, Checkbox, Switch, Radio Group, Select, Tabs, Alert (+warning/success), Alert Dialog, Dropdown Menu, Tooltip, Sonner, Avatar, Progress, Pagination, Sidebar | — | — | — | **pendente (F5 bloqueada)**; listados na seção "Pendentes" do catálogo |

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

Nenhuma. Nenhum teste existente teve expectativa mudada; os testes novos estão em
frontend-evidence.md. As baselines afetadas ficam para a F26.

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
