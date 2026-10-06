# Verificação — 0008

## Red → Green

- Antes da implementação, `node .github/scripts/project-state.test.cjs` falhou com os
  valores antigos (`Todo` e `Canceled`) contra os estados `Backlog` exigidos.
- `node .github/scripts/sync-project.test.cjs` também falhou porque o sincronizador
  ainda solicitava a opção `Done`, ausente da taxonomia real; a PR integrada não era
  determinada pela branch-base.
- Após a implementação, `node --test .github/scripts/*.test.cjs`: **15/15 testes
  passaram**, incluindo mapeamento das três branches, fechamento causal de Issue,
  não planejada, repetição idempotente, branch/opção inválida e configuração faltante.

## Portões locais

- `node --check .github/scripts/project-state.cjs`: passou.
- `node --check .github/scripts/sync-project.cjs`: passou.
- `node --check .github/scripts/project-state.test.cjs`: passou.
- `node --check .github/scripts/sync-project.test.cjs`: passou.
- `git diff --check`: passou.
- `actionlint -color`: não executado; `actionlint` não está instalado localmente. O
  workflow de qualidade roda actionlint no CI da PR.

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
