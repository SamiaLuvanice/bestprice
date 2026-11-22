---
description: Executa tarefas de uma spec com TDD
argument-hint: <numero-da-spec>
---

Implemente a spec $ARGUMENTS na worktree da Issue. Leia spec.md, plan.md, tasks.md, as regras do perfil ativo (arquitetura, camadas, erros, testes e nomes) e a skill agent-orchestration se houver delegação.

Siga tasks.md e marque uma tarefa somente após evidência. Para mudança de comportamento, use TDD Red → Green → Refactor em fatias pequenas. Contrato primeiro, depois cada camada, com as skills do perfil para cada uma. Rode os portões da camada tocada ao terminar (`node .agents/scripts/gates.mjs --scope <escopo>`). Se o plano estiver incorreto, atualize-o com a razão antes de prosseguir. Ao final, rode todos os portões, registre verification.md, encaminhe à revisão independente e sincronize a documentação conforme `.agents/rules/task-done-criteria.md`.
