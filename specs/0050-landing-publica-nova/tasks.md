# Tarefas — 0050

Plano: [plan.md](plan.md). Cada tarefa de comportamento segue Red → Green → Refactor; o
Red e o Green reais vão para `verification.md`.

## Fase 0 — Base

- [x] F0 — Worktree `feature/0050-issue-275-landing-publica-nova` com `npm ci`; `npm test` e
  `npm run build` verdes antes de mudar código. Registrar contagens de partida.
- [x] F1 — Snapshot `designsystem/landing/figma-landing-texts-2026-11.json` com os textos dos
  quadros 238:294 e 239:180, por seção, e o selo ajustado marcado. Conferido por SHA-256 (`a5940cdb99dd72ab`; FAQ `6c1ba3d91d2723fc`) contra o Figma em 08/11/2026.
- [x] F2 — `ui/accordion.tsx` do registry shadcn (`--dry-run` antes; sem sobrescrever outros
  componentes; textos em português).

## Fase 1 — Link do hero e destinos (AC03–AC07)

- [x] F3 — `pendingTrackLink`: salvar, consumir uma vez, substituir, armazenamento
  indisponível. Teste Vitest primeiro.
- [x] F4 — `HeroTrackForm` com `initialValue`: abre o compacto, preenche, foca, não envia.
- [x] F5 — `AccountArea` consome o link na seção de produtos; segundo acesso vem vazio.
- [x] F6 — `App`: props `authenticated` e `signupAvailable` da landing; `/login` e `/cadastro`
  respeitam `returnTo` com sessão confirmada.
- [x] F7 — Matriz de destinos da landing (todas as linhas e colunas da tabela da spec) e campo
  vazio ou com espaços (AC06), em Vitest.

## Fase 2 — Conteúdo e layout (AC01, AC02, AC13)

- [x] F8 — `BestPriceRobot` com os quatro estados e `alt` só no hero.
- [x] F9 — `LandingHeader` com âncoras, ações e menu mobile (`ui/sheet`) (AC12).
- [x] F10 — Seções Hero, Problema → virada, Como funciona e Demonstração (com `StepChart`).
- [x] F11 — Seções Por que BestPrice, Assistente (conversa ilustrativa e faixa escura),
  Perguntas (acordeão, AC11), CTA final, rodapé e barra fixa mobile.
- [x] F12 — Título da aba, marca "BestPrice" e teste do snapshot de textos (AC01).
- [x] F13 — Remover os assets só da landing antiga, depois de buscar outros usos.

## Fase 3 — Movimento (AC08–AC10, AC15)

- [x] F14 — `motion.ts` com os tempos das notas e os hooks `useInView`, `useScrollProgress` e
  `usePrefersReducedMotion`.
- [x] F15 — Animações do hero (entrada, flutuação, feixe, linha, aviso, hover "Encontrou").
- [x] F16 — Cenas em sequência, seta para Como funciona, traço 01→03 e poses, gráfico em
  degraus com o robô pousando, conversa do assistente, órbitas do CTA, FAQ.
- [x] F17 — `ScrollCompanion` (≥ 768 px, frases por seção, oculto no hero e no CTA,
  `aria-hidden`).
- [x] F18 — Movimento reduzido em todas as peças (AC09).

## Fase 4 — Verificação

- [x] F19 — `tests/visual/landing.spec.ts`: AC03–AC05, AC07, AC08 (rolagem nos dois sentidos),
  AC09, AC10, AC12, AC13 (axe, 44 px, sem rolagem lateral em 320/390/768/1280), AC15 (CLS,
  fontes locais).
- [x] F20 — `evidence-0050.spec.ts` (só com `EVIDENCE_0050=1`): capturas por seção em 1440 e
  390 px e o menu aberto; recortes do Figma em `evidence/figma/`; tabela do AC02.
- [x] F21 — Tabela do AC08 (nota × `motion.ts` × obtido) e do AC14 (afirmação × evidência).
- [x] F22 — Referências de `public-pages` "landing pública": apresentar cada diferença e
  regravar só com aprovação (AC16).
- [x] F23 — Gates: `npm run lint`, `npm test`, `npm run build:check`, `npx playwright test`;
  `uv run ruff check .` e `uv run pytest -q` como sanidade. Contagens em `verification.md`.

## Fase 5 — Revisão e entrega

- [x] I1 — Revisão independente (`arch-reviewer`) do diff; achados corrigidos com teste.
- [x] I2 — QA dos AC01–AC17 com evidência.
- [x] D1 — Documentação: `designsystem/README.md` (landing, robô 237:35, ajuste do selo),
  `docs/apps/frontend.md`, `docs/PROGRESS.md`.
- [ ] I3 — `doc-sync-onboarding` por último.
- [ ] I4 — PR para `develop` com `Closes #275`, spec, evidências e pendências; CI verde.
