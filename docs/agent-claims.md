# Coordenação de revisão

## Spec 0007 — reinício FastAPI/React/PostgreSQL

Issue [#15](https://github.com/SamiaLuvanice/bestprice/issues/15), branch
`feature/0007-issue-15-reinicio-fastapi-react`, worktree
`.worktrees/feature-0007-issue-15-reinicio-fastapi-react/`, base `develop`.
O coordenador mantém contrato, tarefas, estado e integração; cada agente edita
apenas sua área. Nenhum agente faz merge ou publicação.

| Slot | Papel | Arquivos sob responsabilidade | Estado |
|---|---|---|---|
| A | backend_impl | `backend/` | Entregue; 5 testes com PostgreSQL |
| B | frontend_impl | `frontend/` | Entregue; 7 testes e build |
| C | harness_impl | `.agents/`, raiz, CI e docs operacionais (exceto este registro e `docs/PROGRESS.md`) | Entregue; 11 testes das automações |
| R | spec_review | Spec 0007, somente leitura | Revisão concluída; correções incorporadas |

O material de `designsystem/` e as remoções locais no checkout principal são
preservados. A revisão de código e o QA serão registrados após os gates.

## Histórico

Skill `agent-orchestration` invocada pelo usuário para a spec 0006. Aplicação
restrita à revisão independente, correções e QA do fluxo GitHub atual; sem
reativar ferramentas ou convenções desativadas.

| Slot | Spec | Papel | Escopo | Estado |
|---|---|---|---|---|
| A | 0006 | review_security / arch-reviewer | Workflows, permissões e segurança; somente leitura | Veredito: ajuste P2 corrigido |
| B | 0006 | review_flow / revisor fullstack | Rastreabilidade, Project, promoções e documentação; somente leitura | Veredito: ajustes P2/P3 corrigidos |
| C | 0006 | QA | Aceites e verificação após retorno dos revisores | Aguardando aprovação/merge |

PR #13, branch `feature/0006-issue-12-github-workflow`, base `develop`.
Snapshot inicial: `e8fef783f6f305ed5400c8b5eeee01d9ebf6160f`.
O coordenador é o único escritor dos registros desta revisão; correções de código
serão atribuídas a um implementador com escopo explícito. Mudanças locais do usuário
no checkout principal permanecem preservadas.
