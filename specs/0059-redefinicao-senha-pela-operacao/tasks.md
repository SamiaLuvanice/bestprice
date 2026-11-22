# Tarefas — 0059

Cada tarefa só fecha com evidência registrada em `verification.md`.

## Preparação

- [x] P1 — Issue #326, branch e worktree `feature/0059-issue-326-redefinicao-senha-pela-operacao` a partir de `origin/develop`.
- [x] P2 — Spec aprovada pela responsável (22/11/2026), status `pronta`.
- [x] P3 — Plano fixado em `plan.md` (sem contrato REST novo).

## Backend (agente `backend`)

- [x] B1 — `reset_password`: testes Red (AC01–AC04, AC06) e implementação.
- [x] B2 — CLI `python -m app.auth.reset_password`: testes Red (AC05, AC07) e implementação.
- [x] B3 — Integração com PostgreSQL real: login antigo/novo, sessão anterior → 401 (AC01, AC06), atomicidade (AC08).
- [ ] B4 — Gates do backend (`node .agents/scripts/gates.mjs --scope backend`) com contagem positiva; complexidade conforme a skill quality-gates.
  Pendente: lint e complexidade ok; `backend:test` com 563 passed, 2 skipped e 1 falha pré-existente
  (`test_login_flow_integration.py::test_ac17_…`, reproduzida em `origin/develop`; ver `verification.md`).

## Revisão, QA e entrega

- [ ] R1 — `arch-reviewer` independente do diff.
- [ ] R2 — `qa` valida AC01–AC09 com evidência.
- [ ] R3 — Documentação (AC09) e `docs-impact` / `doc-sync-onboarding`.
- [ ] R4 — PR para `develop` com `Closes #326`.
