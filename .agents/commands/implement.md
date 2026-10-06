---
description: Executa tarefas de uma spec com TDD
argument-hint: <numero-da-spec>
---

Implemente a spec $ARGUMENTS na worktree da Issue. Leia spec.md, plan.md, tasks.md, regras architecture/backend/frontend/errors/testing/naming e a skill agent-orchestration se houver delegação.

Siga tasks.md e marque uma tarefa somente após evidência. Para mudança de comportamento, use TDD Red → Green → Refactor em fatias pequenas. Contrato primeiro, backend e banco, depois frontend. Use skills fastapi-feature, fastapi-testing e react-feature conforme a camada. Rode gates da camada tocada ao terminar. Se o plano estiver incorreto, atualize-o com a razão antes de prosseguir. Ao final, rode quality-gates, registre verification.md e encaminhe à revisão independente.
