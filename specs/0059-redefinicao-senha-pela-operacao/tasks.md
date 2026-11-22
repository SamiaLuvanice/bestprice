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
  Pendente só pelo `test_login_flow_integration.py::test_ac17_…`, pré-existente em `origin/develop` e corrigido
  pela 0060. Na ponta `45dc5a5`: lint ✔, complexidade sem rank C, `backend:test` com 569 passed, 2 skipped e 1 failed (ver `verification.md`).

## Revisão, QA e entrega

- [x] R1 — `arch-reviewer` independente do diff. As correções 1–6 têm Red/Green em `verification.md` (seção "Correções de R1 e R2").
- [x] R2 — `qa` valida AC01–AC09 com evidência (`verification.md`, seção QA). O achado Q1 foi corrigido em `c4869d4`.
- [ ] R3 — Documentação (AC09) e `docs-impact` / `doc-sync-onboarding`.
- [ ] R4 — PR para `develop` com `Closes #326`.
