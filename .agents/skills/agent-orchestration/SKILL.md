---
name: agent-orchestration
description: Orquestrar uma spec com papéis, evidência por transição, Issue GitHub e PR para develop. Use quando houver trabalho paralelo entre backend, frontend, revisão e QA.
---

# Orquestração de uma spec

A Issue identifica a tarefa; spec.md define aceite; plan.md fixa contrato e sequência; tasks.md e docs/PROGRESS.md registram andamento. Project é opcional e só pode ser declarado sincronizado com evidência da integração. Não dependa de board nem implantação externa.

1. Confirme Issue, spec, plan, tasks, origin/develop e worktree da feature. Nunca use stage como base da feature. Leia git-worktree-required.md e docs/github-workflow.md.
2. Despache papéis citando .agents/agents/<papel>.md, arquivos exclusivos, contrato, tarefas, worktree e gates. Backend cuida de FastAPI/PostgreSQL; frontend de React; fullstack resolve cruzamentos. Permita execução paralela somente quando arquivos não colidirem.
3. Para cada transição, peça evidência concreta: teste Red esperado, Green, lint/build, resposta HTTP ou observação da UI. Registre resultado real em verification.md e docs/PROGRESS.md; tarefas sem prova continuam abertas.
4. Encaminhe diff a arch-reviewer independente e aceite a QA. Achado ou bug volta ao implementador na mesma worktree, com teste de regressão, nova evidência e revisão.
5. Prepare PR da branch feature para develop com Closes #<issue>, spec, testes e pendências. O check obrigatório CI e aprovação independente antecedem o merge. Não faça autoaprovação ou bypass.
6. Após integração em develop e sem pendências, use task-cleanup. Release é fluxo separado de develop → stage → main; publicação e Project só são relatados se observados.

Para a spec 0007, o contrato é GET /api/health 200/503 em plan.md; backend prova SELECT 1 real, frontend prova estados de erro, QA demonstra o caminho ponta a ponta.
