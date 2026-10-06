---
description: Handoff obrigatório ao terminar implementação de uma spec — evidências, PR e revisão.
alwaysApply: true
---

# Handoff de implementação

Implementar não é o mesmo que concluir a spec. CI, Issues, Projects e entrega de
artefatos seguem docs/github-workflow.md. Implantação externa não está configurada.

Ao terminar a implementação:

1. Confirme que o trabalho está na worktree/branch da feature, conforme
   git-worktree-required.md, e rode os gates aplicáveis de .agents/skills/quality-gates/SKILL.md.
2. Registre comandos e resultados de verificação em specs/<id>/verification.md e atualize
   docs/PROGRESS.md conforme os comandos do projeto. Não invente resultados que não rodou.
3. Abra a Pull Request da branch da feature para develop, incluindo Closes #<issue>.
4. **Fluxo de Revisão e Merge (obrigatório — nunca feito pelo implementador):**
   Após abrir a PR, a revisão é realizada obrigatoriamente por outro agente / outra sessão:
   - **rch-reviewer (subagente):** realiza a revisão de arquitetura (dependências, separação de camadas, ports/adapters, tratamento de erros, nomenclatura) com base em .agents/agents/arch-reviewer.md.
   - **Revisor da faixa (ackend/rontend/ullstack):** sessão despachada pelo orquestrador quando a PR abre, carregando as skills da faixa correspondente + pr-review-merge (ver .agents/skills/agent-orchestration/SKILL.md).
5. **Aprovação e Merge:**
   Aprovado o review, quem faz o merge é o revisor/orquestrador (configuração merge_apos_review: automatico).
6. **Conclusão e Limpeza:**
   - O **QA** fecha e valida a tarefa depois, seguindo os critérios de .agents/rules/task-done-criteria.md.
   - Após o merge em develop e validação pelo QA, finalize os recursos locais da tarefa seguindo a skill .agents/skills/task-cleanup/SKILL.md. Não remova worktree ou branch durante a revisão.

Promoção de release é um fluxo separado: PR develop → stage, validação local e depois
PR stage → main. A movimentação dos cards no Kanban do GitHub Projects deve acompanhar a sequência exata de colunas: **Backlog** → **Ready** → **In progress** → **In review** → **Develop** → **Stage** → **Main**. Se deploy/CI for introduzido no futuro, documente-o como mudança explícita deste fluxo.
