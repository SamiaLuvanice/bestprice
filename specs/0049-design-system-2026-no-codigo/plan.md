# Plano — 0049

Spec: [spec.md](spec.md) · Issue [#267](https://github.com/SamiaLuvanice/bestprice/issues/267) ·
branch `feature/0049-issue-267-design-system-2026` (base `origin/develop` `de5d8ee`).

## Escopo técnico

Mudança só de frontend e de documentação.

- **Sem mudança de contrato REST:** nenhum endpoint, payload, status ou erro muda.
- **Backend:** o pytest roda apenas como sanidade (AC11).
- **Fonte de verdade visual:** Figma BestPrice IA, versão de histórico
  "Design system 2026 · shadcn/ui" (página 00) e páginas 01/02 com os node-ids da spec.

## Decisões caras de reverter

1. **Snapshot versionado das variáveis do Figma (AC01).**
   - A coleção "shadcn/ui · BestPrice" é exportada para
     `designsystem/tokens/figma-variables-2026-11.json`: nome, tipo, valor claro,
     valor Noite documentado e sintaxe web.
   - Um teste Vitest compara esse JSON com os blocos `:root`/`@theme` de
     `frontend/src/styles.css`.
   - Mudanças futuras de token passam a exigir a atualização do snapshot. Esse é o
     contrato entre Figma e código.
2. **Nomes das variantes do Button: o código fica como está.**
   - O código já usa `default` para o verde (ação) e `brand` para o rosa (0028/AC04).
     O Figma 2026 chama esses estilos de `action` e `default`.
   - Renomear no código mexeria em todas as telas e testes. Por isso, adotamos uma
     **tabela de correspondência** Figma → código, documentada no design system (AC15):

     | Figma | Código |
     |---|---|
     | `action` | `default` |
     | `default` | `brand` |
     | `secondary`, `outline`, `ghost`, `link`, `destructive` | mesmo nome |

   - O AC05 é cumprido pela correspondência: variantes e estados existem; o nome é mapeado.
3. **Geist Mono empacotada.**
   - Dependência `@fontsource/geist-mono` (OFL 1.1), importada uma vez em `main.tsx`
     com os pesos 400, 500 e 600. Os arquivos `woff2` saem no próprio build, sem CDN.
   - A licença fica registrada em `designsystem/README.md` (AC14).
4. **SF Pro Expanded só por `font-stretch`, sem distribuir a fonte.**
   - `--font-display` mantém a pilha de sistema e os títulos usam `font-stretch: expanded`.
   - Onde a variação larga não existir, o navegador usa a largura normal. Esse é o
     fallback decidido.
5. **Catálogo só no servidor de desenvolvimento.**
   - Rota `/dev/design-system` registrada apenas quando `import.meta.env.DEV`, com
     `lazy(() => import('./dev/DesignSystemCatalog'))`.
   - Em build de distribuição, o ramo é eliminado. A URL cai no `notFound` existente e
     nenhum chunk do catálogo é emitido.
   - Garantias: um teste de build verifica `dist/` (AC06) e um teste de rotas confirma
     que a rota não existe com `DEV=false`.
6. **Componentes shadcn instalados pela CLI.**
   - Comando: `npx shadcn@latest add textarea label checkbox switch radio-group select tabs alert alert-dialog dropdown-menu tooltip sonner avatar progress pagination sidebar`.
   - Exige aprovação explícita (skill `shadcn`, "Uso no BestPrice").
   - Os arquivos já existentes (`button`, `badge`, `card`, `input`, `table`, `chart`,
     `skeleton`, `separator`) **não** são reinstalados, para não perder as variantes
     BestPrice: são editados à mão.
   - Dependência nova esperada: `sonner`. Os primitivos já vêm de `radix-ui`.
     Revisar o diff de `package.json` antes de aceitar.
7. **Uma branch, uma PR, commits por tema.** A política exige `Closes #267` por PR.
   Fatiar em duas PRs exigiria outra Issue. Commits:
   - `feat(frontend): tokens e fontes`;
   - `feat(frontend): componentes`;
   - `feat(frontend): catálogo`;
   - `feat(frontend): telas`;
   - `test(frontend): referências visuais`;
   - `docs(...)`.

## Tokens (AC01, AC02, AC04)

- **`:root`** em `styles.css`:
  - valores do Figma para os tokens que já existem. Muda `--card` (`#f5f5f7` →
    `#ffffff`) e `--action-hover` (`#65ff48` → `#2fe80c`);
  - tokens novos: `--surface`, `--surface-raised`, `--chart-1..5`, `--sidebar-*`
    (8), `--night-950/900/800/line/muted` e `--status-down|down-soft|up|up-soft|warning|warning-soft|target`;
  - raios `--radius-sm/md/lg/xl/2xl/pill` e espaços `--space-1..30` conforme o JSON.
- **`@theme inline`:** expõe os novos como `--color-*`. Mantém a regra 0028/AC04: sem nome
  do tema com outro significado.
- **Tokens próprios antigos** (`--color-brand`, `--color-down`, `--color-surface`...):
  passam a apontar para os novos (`var(--status-down)` etc.), para não quebrar CSS
  existente. A remoção fica para depois.
- **Sombras e foco:** `--shadow-1/2/3`, `--shadow-action-glow` e `--ring-width: 3px`. A
  duração `--motion-fast: 160ms` já existe; entram `--motion-base: 250ms` e
  `--motion-enter: 400ms` (AC04).
- **`prefers-reduced-motion`:** zera as durações não essenciais (AC12).
- **Teste de cor solta (AC02):** `src/no-raw-colors.test.ts` varre `.css` e `.tsx` de
  `src/` em busca de `#hex`, `rgb(` ou `hsl(` fora dos blocos `:root`.
  - Exceções explícitas: os assets e o gradiente de imagem da marca, cada uma
    justificada no teste.

## Tipografia (AC03, AC14)

- **Escalas:** `--font-display` (títulos, com `font-stretch: expanded`), `--font-body` e
  `--font-mono: "Geist Mono", ui-monospace, "SF Mono", monospace`.
- **Utilitários** `@utility` / classes:
  - `.text-display-xl/l/m/s`, `.text-heading-3/4`, `.text-body-l/m/s/xs`, `.text-label`;
  - `.text-mono-label`, `.text-mono-data`, `.text-price-xl/m`;
  - todos com tamanho, peso, entrelinha e tracking do Figma (22 estilos; tabela no JSON).
- **Dados:** preço, horário, MLB e contador recebem `font-mono tabular-nums`. Os pontos de
  aplicação são `formatMoney`/`RelativeTime` e as colunas de tabela, por classe e não por
  mudança de formato. Texto e formatação não mudam (AC11).

## Componentes (AC05)

Inventário da seção 2 do Figma × arquivo no código:

| Figma | Código | Trabalho |
|---|---|---|
| Button (7 variantes × 5 estados + sm/lg/icon) | `ui/button.tsx` | Correspondência da decisão 2. Altura `default` 44 px (`h-11`), `sm` 36 px com alvo ampliado, `lg` 52 px, `icon` 44 px, `rounded-full`, estado `loading` (prop `loading` com spinner `Loader2` e `aria-busy`), glow no hover da ação |
| Badge (10) | `ui/badge.tsx` | Variantes `queda`, `alta`, `estavel`, `alvo`, `desatualizado`, `naoVerificado` (ícone + texto) |
| Input / Textarea / Field | `ui/input.tsx`, `ui/textarea.tsx`, `ui/label.tsx`, novo `ui/field.tsx` | h-11, `rounded-xl`, `aria-invalid` com borda `destructive`; contador do Textarea perto do limite (componente controlado; o limite continua o atual) |
| Checkbox, Switch, Radio, Select | CLI | Switch ligado em `bg-action`; foco com anel rosa |
| Card, Alert (+warning/success), Alert Dialog, Dropdown Menu, Tooltip, Sonner, Tabs | CLI + edição | Alert com variantes `warning` e `success`; Tabs em pílula |
| Table, Pagination, Sidebar, Skeleton, Avatar, Progress, Separator, Chart | existentes + CLI | Linha com hover `surface-raised`; Sidebar com tokens `sidebar-*` |
| Estado vazio, card de gráfico | `components/EmptyState.tsx`, `components/PriceChartCard.tsx` | Composições com o robô existente (`assets/research/assistant-robot.png`) |

- **Testes de componente (Vitest + Testing Library):**
  - variantes renderizam `data-variant`;
  - `loading` desabilita e anuncia;
  - Field liga `aria-describedby` à mensagem;
  - Switch e Select funcionam pelo teclado.
- **Comportamento:** é coberto em TDD só onde há lógica: `loading`, contador e Field.
  Visual não é TDD.

## Catálogo (AC05, AC06)

- **`src/dev/DesignSystemCatalog.tsx`:** uma página com âncoras por componente, que
  renderiza cada variante e cada estado.
  - Os estados `hover` e `focus` são forçados com classes `data-state` para a captura.
  - Inclui também as tabelas de token geradas a partir do JSON (AC01 visual).
- **Playwright `tests/visual/catalog.spec.ts`:** captura cada seção em 390 e 1280 para o
  inventário do AC05.
- **Verificação de build:** `npm run build`, depois
  `grep -r "DesignSystemCatalog\|design-system" dist/` vazio. Isso vira script
  `scripts/check-no-catalog.mjs`, chamado num teste e no CI de frontend.

## Telas (AC07–AC10, AC12)

O trabalho troca classes e tokens. A estrutura de JSX só muda onde o Figma exige outro
componente (por exemplo, `Button` em vez de `.primary-button`). Textos, rotas e chamadas
não mudam.

| Lista | Rota / componente | Arquivos |
|---|---|---|
| A — Entrar / Criar conta | `/login`, `/cadastro` | `LoginForm.tsx`, `auth/SignupForm.tsx`, `styles.css` (bloco login) |
| A — Assistente, Histórico | `/app/assistant`, `/app/history` | `features/research/*.tsx`, `research.css`, `assistant.css`, `history.css` |
| A — Monitoramento | `/app/monitoring` (área research) | `dashboard/*` usados nela, `PriceHistoryChart.tsx` |
| A — Barra lateral e nav inferior | `ResearchArea.tsx` | `research.css`: barra com `bg-sidebar`, ativo com `sidebar-accent`/rosa; rótulos atuais preservados (AC09) |
| B — Produtos, detalhe, alertas, comparador | `/produtos`, `/produtos/:id`, `/alertas`, `/app/compare` | Só tokens e componentes |
| B — Landing atual, não encontrada | `/`, `*` | Só tokens (`LandingPage.css`, `NotFoundPage.tsx`) |

- **Gráfico (AC10), em `PriceHistoryChart.tsx`:**
  - `Area` `stepAfter` com gradiente `--chart-2`, mais a `Line` `stepAfter` em `--chart-1`;
  - ponto só no último registro, em `--chart-2` com borda branca;
  - `ReferenceLine` tracejada `--chart-3` apenas quando houver preço-alvo;
  - o domínio X termina em `dataMax` (última leitura), como hoje;
  - com um registro: só o ponto.
  - Testes de comportamento (TDD) para: sem alvo, nenhuma `ReferenceLine`; um ponto;
    nenhum ponto extra.
- **Ação única (AC07):** um teste de integração por tela da lista A conta os elementos
  `[data-variant="default"]` visíveis, que deve ser ≤ 1.
- **Elementos sem comportamento:** indicadores, busca e filtros do quadro 151:11 não são
  criados. A omissão vai para `verification.md` (AC08).

## Regressão visual e evidência (AC08, AC11, AC12, AC13)

1. **Primeiro, a #259.** Rodar a suíte em `develop` e classificar as 19 falhas:
   - se forem só baseline desatualizada, separar para a #259;
   - se forem regressão real, corrigir antes.
   - Registrar em `verification.md`.
2. **Projeto Playwright `viewport-1440`**, só para capturas de evidência do AC08: uma
   captura por tela e estado da lista A, em 1440 e 390. As capturas ficam em
   `specs/0049-design-system-2026-no-codigo/evidence/` lado a lado com o PNG do quadro
   do Figma (exportado com node-id e data).
3. **Baselines** atualizados com `--update-snapshots` só por spec de teste, cada diff
   apresentado à pessoa responsável (AC13).
4. **Acessibilidade:** `@axe-core/playwright` (já instalado) nas telas A e B em 320, 390,
   768 e 1280. Também:
   - verificar alvos de 44 px;
   - verificar o foco por teclado;
   - emular `prefers-reduced-motion`;
   - checar a ausência de rolagem horizontal (`scrollWidth` igual a `clientWidth`).

## Arquivos e responsáveis

Um único papel implementa: `frontend`, conforme `.agents/agents/frontend.md`, na worktree
da feature. Não há paralelismo seguro, porque `styles.css` e `button.tsx` são
compartilhados por todas as fases.

- **Revisão:** `arch-reviewer` ao fim da fase de componentes e ao fim da fase de telas.
- **QA:** `qa` no fim.
- **Documentação:** `doc-sync-onboarding` por último.

## Riscos

- **Falhas da #259** podem esconder regressões novas. Mitigação: passo 1 da regressão
  visual, antes de tocar em baselines.
- **CLI do shadcn** pode sobrescrever personalizações ou trazer versões de dependência
  diferentes. Mitigação: não reinstalar os existentes e revisar o diff de `package.json`
  e do lockfile.
- **Variação larga do SF Pro** pode não ser aplicada nem em macOS. O fallback é aceito
  pela spec. A verificação informa o sistema usado (AC03).
- **Mudança global de `--card`** (cinza → branco) afeta as telas da lista B sem
  redesenho. As diferenças entram no AC13.
- **Tamanho do diff:** commits por tema e duas revisões intermediárias reduzem o risco.
