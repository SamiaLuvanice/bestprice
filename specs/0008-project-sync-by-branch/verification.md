# Verificação — 0008

Data: 2026-10-06. Branch: `fix/issue-17-project-status-branch`.
Issue: https://github.com/SamiaLuvanice/bestprice/issues/17.
PR: https://github.com/SamiaLuvanice/bestprice/pull/18.

## Red → Green

- Antes da implementação, `node .github/scripts/project-state.test.cjs` falhou com os
  valores antigos (`Todo` e `Canceled`) contra os estados `Backlog` exigidos.
- `node .github/scripts/sync-project.test.cjs` também falhou porque o sincronizador
  ainda solicitava a opção `Done`, ausente da taxonomia real; a PR integrada não era
  determinada pela branch-base.
- Após a implementação, `node --test .github/scripts/*.test.cjs`: **15/15 testes
  passaram**, incluindo política de PR, mapeamento das três branches, fechamento
  causal de Issue, não planejada, repetição idempotente, branch/opção inválida e
  configuração faltante.

## Portões locais

- `node --check .github/scripts/project-state.cjs`: passou.
- `node --check .github/scripts/sync-project.cjs`: passou.
- `node --check .github/scripts/project-state.test.cjs`: passou.
- `node --check .github/scripts/sync-project.test.cjs`: passou.
- `git diff --check`: passou.
- `actionlint -color`: não executado; `actionlint` não está instalado localmente. O
  workflow de qualidade roda actionlint no CI da PR.

## Evidências remotas

- PR #18: checks `PR policy`, `quality / Backend`, `quality / Frontend`,
  `quality / Automation`, `sync` e o agregador `CI` concluídos com sucesso.
- Execução CI: https://github.com/SamiaLuvanice/bestprice/actions/runs/37535443869.
- Execução Project sync: https://github.com/SamiaLuvanice/bestprice/actions/runs/37535443542.

## Critérios de aceite

| Critério | Evidência | Situação |
|---|---|---|
| Issue aberta sem responsável vai para `Backlog` | `project-state.test.cjs`, teste de estados de Issue | Demonstrado |
| Issue aberta com responsável vai para `In progress` | `project-state.test.cjs`, teste de estados de Issue; eventos cobertos pelo workflow | Demonstrado |
| Issue fechada por PR integrada em `develop` vai para `Develop` | `sync-project.test.cjs`, teste de fechamento causal via `ClosedEvent` | Demonstrado |
| PR draft vai para `In progress` e PR pronta para revisão vai para `In review` | `project-state.test.cjs`, teste de estados de PR | Demonstrado |
| PR mergeada em `develop`, `stage` ou `main` usa a coluna correspondente | `project-state.test.cjs` e `sync-project.test.cjs`, incluindo `base.ref` atual | Demonstrado |
| PR fechada sem merge vai para `Backlog` | `project-state.test.cjs`, teste de fechamento sem merge | Demonstrado |
| Nenhuma opção `Todo`, `Done` ou `Canceled` é exigida | `sync-project.test.cjs`, fixture com as sete opções reais | Demonstrado |
| Issue não planejada vai para `Backlog` e informa a ausência de `Canceled` | `sync-project.test.cjs`, teste de resumo de cancelamento | Demonstrado |
| Branch-base ou opção necessária ausente falha antes da mutação | `sync-project.test.cjs`, testes de branch e opção inválidas | Demonstrado |
| Evento antigo consulta o estado atual antes de sincronizar | `sync-project.test.cjs`, teste de reexecução idempotente com `base.ref` atual | Demonstrado |
| Ausência de credencial informa pendência sem declarar sucesso | `.github/workflows/project.yml` e documentação operacional; teste cobre configuração ausente no script | Demonstrado em código; execução real depende de secret externo |

## Cobertura e limites

- A PR sincronizada usa o estado atual da REST API e mapeia `base.ref` para
  `Develop`, `Stage` ou `Main`. Base mergeada não suportada falha antes de consultar
  ou modificar o Project.
- O fechamento de Issue é identificado pelo `ClosedEvent.closer` da timeline GraphQL
  cujo `createdAt` coincide com o `closed_at` consultado; a PR causal precisa ter
  `mergedAt` preenchido, sem exigir igualdade entre os dois instantes. A conexão é paginada em
  blocos de 100 para Issues com histórico longo. O teste simula múltiplos eventos e
  uma PR anterior; não fez mutação em um Project real, pois isso exige `PROJECT_TOKEN`
  e acesso de escrita externos.
- A Issue não planejada usa `Backlog` e inclui aviso de que o Project não tem opção
  `Canceled`. O workflow existente preserva aviso e resumo **não sincronizado** quando
  `PROJECT_TOKEN` está ausente.
- CI e aprovação independente ainda dependem da PR aberta; não foram presumidos.
- A revisão independente ainda não foi concluída; o CI remoto está verde e a PR
  aguarda aprovação independente antes do merge.
