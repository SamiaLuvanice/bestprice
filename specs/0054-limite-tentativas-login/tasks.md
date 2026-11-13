# Tarefas — 0054

Cada tarefa só fecha com evidência registrada em `verification.md`.

## Preparação

- [x] P1 — Issue #128, branch e worktree `feature/0054-issue-128-limite-tentativas-login` a partir de `origin/develop`.
- [x] P2 — Spec revisada pelo `spec-reviewer` e ajustada.
- [x] P3 — Contrato REST fixado em `plan.md`.

## Backend (agente `backend`), em paralelo com o frontend

- [x] B1 — Settings de login: testes Red (faixas, origem ≥ conta, segredos obrigatórios em stage/production com o cadastro desligado, segredo local efêmero), depois implementação e validação no `lifespan`. AC13, AC14.
- [x] B2 — Modelo `LoginFailure` + migração `login_failures` com índices e RLS; testar upgrade e downgrade.
- [x] B3 — Limitador com reserva e lock: testes de integração Red com relógio fixo (AC01–AC05, AC07, AC09, AC10), depois implementação.
- [x] B4 — Rota de login: corpo cru, limite antes do parse, 422 só de origem, custo constante com hash fictício, sessão do limitador própria, OpenAPI 429. Testes HTTP Red e depois Green. AC02, AC03, AC06, AC07, AC08, AC17.
- [x] B5 — Concorrência e instâncias: AC11 (20 threads) e AC12 (duas engines).
- [x] B6 — Sigilo e retenção: nada em claro, sem logs, purge no ciclo de limpeza. AC15.
- [x] B7 — `.env.example` e `render.yaml` com `LOGIN_RATE_LIMIT_*`.
- [x] B8 — Gates do backend: `ruff`, `pytest` com PostgreSQL real e contagem positiva.

## Frontend (agente `frontend`), em paralelo com o backend

- [x] F1 — Extrair `waitText` para `lib/format.ts`; cadastro sem mudança de texto (teste de regressão).
- [x] F2 — Login: 429 `login_rate_limited` → mensagem com N minutos e fallback; testes Red e depois Green. AC16.
- [x] F3 — `LoginForm`: apagar a senha e manter o e-mail em erro do servidor; manter o foco e o `role="alert"`. AC16.
- [x] F4 — Gates do frontend: lint, Vitest e build.

## Integração

- [x] I1 — Fluxo local ponta a ponta (API + SPA + PostgreSQL): errar até o 429, ver a mensagem, voltar após a janela (com uma janela curta configurada). Desktop 1440 e mobile 390.
- [x] I2 — Medição do AC08 (30 + 30 tentativas locais, medianas registradas).

## Revisão, QA e entrega

- [x] R1 — `arch-reviewer` independente do diff completo; achados voltam ao implementador.
- [x] R2 — `qa` valida AC01–AC17 com evidência.
- [x] R3 — `doc-sync-onboarding` por último (backend.md, infraestrutura.md, architecture.md, database.md, PROGRESS.md).
- [ ] R4 — PR para `develop` com `Closes #128`, resultados e pendências (pré-condição de Stage, origem real atrás do Pages).
