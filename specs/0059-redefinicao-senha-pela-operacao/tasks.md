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
- [x] B4 — Gates do backend (`node .agents/scripts/gates.mjs --scope backend`) com contagem positiva; complexidade conforme a skill quality-gates.
  Depois de integrar `develop` com a 0060 (PR #328, `674af59`): install, lint e test verdes, 592 passed,
  2 skipped (POSIX), 0 failed; o `test_ac17` voltou a passar (ver `verification.md`, seção "Integração com a 0060").

## Revisão, QA e entrega

- [x] R1 — `arch-reviewer` independente do diff. As correções 1–6 têm Red/Green em `verification.md` (seção "Correções de R1 e R2").
- [x] R2 — `qa` valida AC01–AC09 com evidência (`verification.md`, seção QA). O achado Q1 foi corrigido em `c4869d4`.
- [x] R3 — Documentação (AC09) e `docs-impact` / `doc-sync-onboarding`.
  Na ponta `84da6ea`, `docs-impact` listou `docs/apps/backend.md` (alterado) e `docs/architecture.md` (a revisar).
  `doc-sync-onboarding` conferiu `backend.md` e `README.md` contra `reset_password.py` e `_authenticate`;
  `architecture.md` segue correto sem edição; `docs/index.md` e `docs/database.md` passaram a citar a redefinição;
  entrada da 0059 em `docs/PROGRESS.md`.
- [x] R4 — PR #329 integrada em `develop` (`db90a49`), com `Closes #326`.
