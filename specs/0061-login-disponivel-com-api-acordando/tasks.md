# Tarefas — 0061

Cada tarefa só fecha com evidência registrada em `verification.md`.

## Preparação

- [x] P1 — Issue #336, branch e worktree `feature/0061-issue-336-login-disponivel-com-api-acordando` a partir de `origin/develop` (`2b585c9`).
- [x] P2 — Spec revisada pelo `spec-reviewer` (25/11/2026); lacunas resolvidas como decisões na spec, status `pronta`. Pendente: confirmação das decisões pela responsável.
- [x] P3 — Plano fixado em `plan.md` (contrato REST inalterado).

## Frontend (agente `frontend`)

- [x] F1 — `wakeRetry.ts`: testes Red de `isUnavailable` e do hook com timers falsos (AC12, AC15); implementação.
- [x] F2 — `useSessionCheck` + `App.tsx` no login: testes Red AC01–AC07, AC14; implementação; `LoginForm` com `notice`.
- [x] F3 — Cadastro: `useSignupAvailability` com novas tentativas; testes Red AC08, AC09; implementação.
- [x] F4 — Áreas logadas e navegação: testes Red AC10, AC11, AC13; implementação.
- [x] F5 — Gates do frontend (`node .agents/scripts/gates.mjs --scope frontend`) com contagem positiva.

## Revisão, QA e entrega

- [ ] R1 — `arch-reviewer` independente do diff.
- [ ] R2 — `qa` valida AC01–AC15 com evidência, incluindo fluxo local com API indisponível e lenta.
- [ ] R3 — `docs-impact` / `doc-sync-onboarding`.
- [ ] R4 — PR para `develop` com `Closes #336`.
