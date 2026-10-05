---
numero: 0004
titulo: Limpeza segura apos spec
tipo: melhoria
prioridade: P2
status: pronta
toca: [harness, docs]
depende_de: []
---

# 0004 — Limpeza segura após spec

## Problema

Ao terminar uma spec, worktrees, branches e recursos Docker criados durante o trabalho
podem permanecer no ambiente. A limpeza manual é fácil de esquecer e uma limpeza ampla
pode apagar dados ou recursos pertencentes a outras tarefas.

## Comportamento esperado

Depois que a mudança tiver sido integrada em `develop`, quem implementou consegue encerrar
os recursos isolados que criou e remover a worktree e branches da tarefa, com verificações
que impedem a limpeza prematura ou a remoção de recursos alheios. Dados persistentes são
preservados por padrão, e qualquer exceção destrutiva é explícita.

## Critérios de aceite

- [ ] A rotina só começa após confirmar que a PR da tarefa foi integrada em `develop` e que
      não há alterações locais pendentes na worktree.
- [ ] Arquivos ignorados são inspecionados antes da remoção; segredos, dados locais ou arquivos
      de finalidade desconhecida bloqueiam a remoção até haver um destino de preservação acordado.
- [ ] Containers, redes e serviços Compose são encerrados apenas para o projeto isolado da
      worktree; nenhum comando global de prune é utilizado.
- [ ] Volumes Docker são preservados por padrão; removê-los requer confirmação explícita e
      confirmação de que pertencem exclusivamente à tarefa concluída.
- [ ] A worktree é removida sem forçar descarte de alterações, e a branch local só é removida
      após confirmar merge completo e que não está em uso por outra worktree.
- [ ] Branch remota só é removida quando for a branch de origem da PR desta tarefa, já integrada
      em `develop` e contida em `origin/develop`; branches protegidas nunca são alvo.
- [ ] A rotina é repetível: recursos já removidos são relatados como ausentes, sem ampliar o
      escopo nem afetar outros projetos.
- [ ] As regras e o inventário do harness apontam para um procedimento reutilizável de limpeza.

## Fora de escopo

- Automatizar a limpeza por serviço em nuvem, CI ou integração externa.
- Remover imagens ou volumes Docker compartilhados e não identificados como exclusivos da tarefa.
- Alterar políticas de retenção do repositório ou de branches protegidas.

## Perguntas em aberto

- Volumes de banco podem conter dados úteis para estudo; por segurança, são preservados por
  padrão. A limpeza deles exige confirmação específica.
- A branch remota pode já ter sido apagada automaticamente pelo provedor após o merge; a
  rotina trata esse caso como já limpo.
