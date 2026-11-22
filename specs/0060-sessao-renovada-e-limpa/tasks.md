# Tarefas — 0060

Cada tarefa só fecha com evidência registrada em `verification.md`.

## Preparação

- [x] P1 — Issue #327, branch e worktree `feature/0060-issue-327-sessao-renovada-e-limpa` a partir de `origin/develop`.
- [x] P2 — Spec aprovada pela responsável (22/11/2026), valores 24 h / 7 dias confirmados, status `pronta`.
- [x] P3 — Plano fixado em `plan.md` (contrato REST inalterado).

## Backend (agente `backend`)

- [x] B1 — Modelo + migração `absolute_expires_at` com backfill; upgrade/downgrade testados (AC08).
- [x] B2 — Validade por inatividade e teto com relógio injetado: testes Red (AC02, AC03, AC09) e implementação.
- [x] B3 — Renovação horária e cookie: testes Red (AC01, AC04, AC05) e implementação.
- [x] B4 — Purge de sessões terminadas no ciclo de limpeza: testes Red (AC06, AC07) e implementação.
- [x] B5 — Gates do backend (`node .agents/scripts/gates.mjs --scope backend`) com contagem positiva; complexidade conforme a skill quality-gates.

## Revisão, QA e entrega

- [x] R1 — `arch-reviewer` independente do diff (aprovada com condições; I1 e S1–S5 tratados em `verification.md`, "Correções pós-revisão").
- [x] R2 — `qa` valida AC01–AC09 com evidência, incluindo fluxo local API + SPA (sessão continua após renovação; expira com relógio/valores curtos). Aprovada em `fb6f211` (`927c25d`, `verification.md` "QA (R2)"); O1 e O2 corrigidas.
- [x] R3 — `docs-impact` / `doc-sync-onboarding`: `docs/database.md`, `docs/architecture.md`, `README.md` e `docs/PROGRESS.md` sincronizados (`verification.md`, "Sincronização da documentação (R3)").
- [x] R4 — PR #328 integrada em `develop` (`674af59`), com `Closes #327`.
