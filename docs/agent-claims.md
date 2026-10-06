# Coordenação de revisão

Skill `agent-orchestration` invocada pelo usuário para a spec 0006. Aplicação
restrita à revisão independente, correções e QA do fluxo GitHub atual; sem
reativar ferramentas ou convenções da stack arquivada.

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
