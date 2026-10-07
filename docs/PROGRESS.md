# Progresso das specs

| Spec | Refinamento e plano | Implementação | Revisão | Verificação |
|---|---|---|---|---|
| 0009-skills-compativeis-com-a-stack | Spec/plano/tarefas registrados; Issue [#23](https://github.com/SamiaLuvanice/bestprice/issues/23) | Guias locais curados na worktree da Issue | Revisão documental sem bloqueios; PR [#25](https://github.com/SamiaLuvanice/bestprice/pull/25) aguarda CI e aprovação | Estrutura das três skills válida e adaptadores sincronizados; ver [verification.md](../specs/0009-skills-compativeis-com-a-stack/verification.md) |
| 0008-project-sync-by-branch | Spec/plano/tarefas registrados; Issue [#17](https://github.com/SamiaLuvanice/bestprice/issues/17) | Status do Project alinhado à branch-base e à taxonomia configurada | PR [#18](https://github.com/SamiaLuvanice/bestprice/pull/18) integrada em `develop` | CI remoto verde; workflow real sincronizou Issue #17 para `Develop`; ver [verification.md](../specs/0008-project-sync-by-branch/verification.md) |
| 0007-reinicio-fastapi-react-postgresql | Spec/plano/tarefas registrados; Issue [#15](https://github.com/SamiaLuvanice/bestprice/issues/15) | API FastAPI, SPA React, Compose e harness implementados | PR [#16](https://github.com/SamiaLuvanice/bestprice/pull/16) integrada em `develop`; limpeza histórica em revisão na PR [#22](https://github.com/SamiaLuvanice/bestprice/pull/22) | Implementação e limpeza verificadas localmente; checks remotos da PR #22 verdes; ver [verification.md](../specs/0007-reinicio-fastapi-react-postgresql/verification.md) |

## Histórico

Specs anteriores à 0007 e a decisão de autenticação da aplicação anterior foram
movidas para `specs/archive/legacy-java-angular/` e
`docs/archive/legacy-java-angular/`. Elas não fazem parte da stack ativa nem
devem ser usadas como instrução para novas mudanças.
