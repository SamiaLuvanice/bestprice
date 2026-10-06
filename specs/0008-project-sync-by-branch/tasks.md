# Tarefas — 0008

## Produto

- [x] **P01 — Confirmar a taxonomia do Project.** Conferir que o campo Status usa
  `Backlog`, `Ready`, `In progress`, `In review`, `Develop`, `Stage` e `Main`, sem
  exigir a criação de opções adicionais. Concluída quando o mapeamento em `plan.md`
  cobre todos os status existentes relevantes e as limitações de cancelamento estão
  documentadas.
- [x] **P02 — Aceitar as transições de produto.** Revisar os critérios da spec para
  Issue aberta/atribuída/fechada e PR aberta/draft/revisão/fechada/mergeada nas três
  branches. Concluída quando o comportamento de `develop`, `stage`, `main` e o retorno
  à `Backlog` em cancelamentos não depende de interpretação do implementador.

## Implementação e validação

- [x] **I01 — Cobrir a matriz de estados.** Escrever testes para Issues sem/com
  responsável, reabertura, fechamento por merge em `develop`, Issue não planejada; PR
  draft, em revisão, fechada sem merge e integrada em cada branch-alvo. Concluída quando testes novos
  falham pelos mapeamentos ausentes antes da correção e usam apenas as opções
  existentes.
- [x] **I02 — Determinar Status pela branch-base.** Ajustar o mapeamento de PR para
  usar a branch-base da PR integrada. Concluída quando os testes comprovam `Develop`,
  `Stage` e `Main` respectivamente e eventos antigos não regridem o estado atual.
- [x] **I03 — Sincronizar Issue fechada.** Assegurar que Issue fechada pelo mecanismo
  padrão após merge em `develop` vá para `Develop`; Issue não planejada volta para
  `Backlog` com aviso de que não existe opção `Canceled`. Concluída quando os testes
  distinguem os casos e verificam os resultados.
- [x] **I04 — Tratar PR fechada sem merge.** Retornar a PR para `Backlog`. Concluída
  quando o teste comprova que fechamento sem merge não é classificado como entrega.
- [x] **I05 — Validar interação com Projects.** Atualizar os testes de sincronização
  simulada para testar opções reais, repetição idempotente e falta de configuração.
  Concluída quando nenhuma opção `Todo`, `Done` ou `Canceled` é requerida e os testes
  têm contagem positiva.
- [x] **I06 — Atualizar documentação operacional.** Corrigir a matriz em
  `docs/github-workflow.md`. Concluída quando ela coincide com os critérios e explica
  como reconciliar após configurar credencial sem alegar sincronização não executada.
- [ ] **I07 — Verificar e preparar handoff.** Executar os testes das automações e os
  gates aplicáveis, registrar resultados em `verification.md` e abrir PR para
  `develop` com `Closes #17`. Concluída quando cada critério de aceite tem evidência,
  CI está verde e a revisão independente está pendente ou concluída conforme o estado
  real da PR.
