---
name: agent-orchestration
description: Orquestrar uma spec com papéis, evidência por transição, Issue GitHub e PR para a branch base. Use quando houver trabalho paralelo entre camadas, revisão e QA.
---

# Orquestração de uma spec

A Issue identifica a tarefa; spec.md define aceite; plan.md fixa contrato e sequência; tasks.md e docs/PROGRESS.md registram andamento. Project é opcional e só pode ser declarado sincronizado com evidência da integração. Não dependa de board nem implantação externa.

1. Confirme Issue, spec, plan, tasks, a branch base remota (`git.default_base` em harness.yaml) e a worktree da feature. Leia git-worktree-required.md e docs/github-workflow.md.
2. Antes de dividir trabalho entre camadas, fixe o contrato no plan. Despache papéis citando .agents/agents/<papel>.md, arquivos exclusivos, contrato, tarefas, worktree e portões. Os papéis de cada camada são os do perfil ativo em modules.yaml. Permita execução paralela somente quando arquivos não colidirem.
3. Para cada transição, peça evidência concreta: teste Red esperado, Green, portões, resposta do serviço ou observação da UI. Registre resultado real em verification.md e docs/PROGRESS.md; tarefas sem prova continuam abertas.
4. Encaminhe o diff a um revisor independente e o aceite à QA. Achado ou bug volta ao implementador na mesma worktree, com teste de regressão, nova evidência e revisão.
5. Sincronize a documentação conforme a regra única de `.agents/rules/task-done-criteria.md`.
6. Prepare PR da branch feature para a base com Closes #<issue>, spec, testes e pendências. O check obrigatório CI e uma revisão independente do código antecedem o merge. Solicite aprovação no GitHub apenas se o ruleset exigir; não faça autoaprovação nem use bypass para contornar portões.
7. Após integração e sem pendências, use task-cleanup. Release é fluxo separado (ver git-worktree-required.md); publicação e Project só são relatados se observados.
