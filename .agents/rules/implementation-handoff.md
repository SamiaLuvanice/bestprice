---
description: Handoff obrigatório ao terminar implementação de uma spec — evidências, PR e revisão.
alwaysApply: true
---

# Handoff de implementação

Implementar não é o mesmo que concluir a spec. CI, Issues, Projects e entrega de
artefatos seguem `docs/github-workflow.md`. Implantação externa não está configurada.

Ao terminar a implementação:

1. Confirme que o trabalho está na worktree/branch da feature, conforme
   `git-worktree-required.md`, e rode os gates aplicáveis de `.agents/skills/quality-gates/SKILL.md`.
2. Registre comandos e resultados de verificação em `specs/<id>/verification.md` e atualize
   `docs/PROGRESS.md` conforme os comandos do projeto. Não invente resultados que não rodou.
3. Prepare um PR por tema, da branch da feature para `develop`. Inclua `Closes #<issue>`, spec relacionada,
   resumo, como verificar, resultados dos testes e pendências. Não faça merge sem revisão
   independente; incorpore feedback na mesma branch/worktree.
4. Só marque a spec `implementada` depois que os critérios de aceite estiverem comprovados,
   a revisão independente tiver sido concluída e o PR estiver integrado em `develop`.
   Use os status definidos pela spec/skill (`rascunho`, `pronta`, `implementada`, `descartada`).
5. Na resposta de handoff, informe “implementação entregue; aguarda revisão”, o link do PR
   (quando criado), checks executados e o próximo passo. Se não puder abrir/pushar o PR,
   diga isso claramente e deixe a branch pronta para revisão.
6. Depois que a PR estiver integrada em `develop` e não houver feedback ou commits pendentes,
   conclua a limpeza dos recursos exclusivos da tarefa seguindo a skill
   `.agents/skills/task-cleanup/SKILL.md`. Não remova worktree ou branch durante revisão.

Promoção de release é um fluxo separado: PR `develop` → `stage`, validação local e depois
PR `stage` → `main`. O GitHub Project acompanha Issues/PRs quando a credencial estiver
configurada. A entrega publica imagens e release após validação na main; não presume
implantação. Reporte separadamente qualquer automação pendente de permissão.
