---
description: Handoff obrigatório ao terminar implementação — PR, PROGRESS, prompt do revisor.
alwaysApply: true
---

# Conclusão de implementação — handoff obrigatório

**Tarefa pronta** (✅ no backlog) só quando a regra `task-done-criteria` estiver cumprida: review por **outro** agente, merge em `stage`, deploy/stack acessível e verificação (endpoints, e2e ou cobertura com evidência).

Quando você **terminar a implementação** (código/docs da feature):

0. **Worktree** — código da feature só em `<repo>/.worktrees/<slug>/`; principal em `stage` (regra `git-worktree-required`).
1. **Invoque** a skill `task-handoff` e siga o checklist completo.
2. **Abra PR** no repo tocado (`pr-review-merge`) — um tema por PR, push do worktree; inclua link na resposta.
3. **Atualize** o `status` da spec e o card no board com o link da PR — **não** marque ✅ até o revisor fechar a tarefa (`task-done-criteria`).
4. **Informe** na resposta: **implementação entregue** + URL da PR + **próxima tarefa** (revisar → merge → deploy → verificar → só então novo ID).
5. **Percentuais** — tabela **Progresso por serviço (%)**; ✅ no cálculo só para tarefas que passaram pelo critério de prontidão.

O **próximo agente** (sessão distinta): revisar PR → merge em `stage` → deploy → testar endpoints/e2e/cobertura → QA → marcar ✅ → implementar novo backlog no worktree.

Não diga "tarefa concluída/pronta" ao implementar — use "implementação entregue; aguarda review". Não encerre sem PR nem sem prompt explícito para o revisor.
