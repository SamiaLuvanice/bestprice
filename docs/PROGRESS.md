# Progresso das specs

| Spec | Refinamento e plano | Implementação | Revisão | Verificação |
|---|---|---|---|---|
| 0007-reinicio-fastapi-react-postgresql | [Spec](../specs/0007-reinicio-fastapi-react-postgresql/spec.md) revisada; [plano](../specs/0007-reinicio-fastapi-react-postgresql/plan.md) e tarefas registrados; Issue [#15](https://github.com/SamiaLuvanice/bestprice/issues/15) | API, interface, harness e Compose implementados na worktree `feature-0007-issue-15-reinicio-fastapi-react` | Revisão de spec e arquitetura concluídas sem bloqueios; QA local concluiu cenários no Chrome headless | Backend 5/5, frontend 7/7, automações 11/11; Compose 200/503/504 e tela nos três estados demonstrados; PR e CI remoto pendentes; ver [verification.md](../specs/0007-reinicio-fastapi-react-postgresql/verification.md) |
| 0006-integracao-github-ci-cd | Spec/plano registrados; Issue #12 | Workflows, templates e automações implementados; develop padrão e proteções ativas | [PR #13](https://github.com/SamiaLuvanice/bestprice/pull/13) aguarda aprovação independente | CI remoto verde; Maven 23/23, Angular 31/31, Node 10/10, actionlint; Project e entrega real pendentes; ver verification.md |
| 0002-login-e-redirecionamento | Plano aprovado; ADR 0002 registrado | Implementada na worktree `feature/0002-login-e-redirecionamento` | Revisão independente sem bloqueios; PR [#8](https://github.com/SamiaLuvanice/bestprice/pull/8) integrada em `develop` | Maven verify 23/23, Angular build e 31/31 testes, Compose válido e Chrome E2E passando; 18 aceites demonstrados |
| 0003-aproveitamento-seletivo-do-archive | Spec e plano registrados | Implementada na worktree `chore/archive-reuse-review` | PR [#4](https://github.com/SamiaLuvanice/bestprice/pull/4) integrada em `develop` | Checagens estáticas e resolução do Compose documentadas em `specs/0003-aproveitamento-seletivo-do-archive/verification.md` |
| 0004-limpeza-pos-spec | Spec e plano registrados | Implementada na worktree `chore/spec-cleanup-routine` | PR [#5](https://github.com/SamiaLuvanice/bestprice/pull/5) integrada em `develop` | Ver `specs/0004-limpeza-pos-spec/verification.md` |
| 0005-fluxo-tdd | Spec e plano registrados | Implementada na worktree `chore/tdd-harness` | Revisão independente concluída; PR [#6](https://github.com/SamiaLuvanice/bestprice/pull/6) integrada em `develop` | Ver `specs/0005-fluxo-tdd/verification.md` |

## Orquestração da 0002

Iniciada a pedido do usuário com a skill arquivada
`.agents/archive/skills/agent-orchestration/SKILL.md`.
Aplicação restrita à coordenação local de planejamento e revisão, adaptada ao fluxo
`/spec` → `/plan` → `/implement` → `/verify` de Java/Spring Boot e Angular.

Não existe `.agents/orquestracao.yml` ativo. As etapas antigas de board externo,
PR, merge e deploy não se aplicam a este início local. Os estados da spec seguem
`po-intake/reference.md`; não será introduzido o estado legado `em revisão`.

O usuário autorizou implementar a base registrada na spec e no plano.
Seu status é `implementada`, após portões, revisão e demonstração dos critérios.
Evidência: [verification.md](../specs/0002-login-e-redirecionamento/verification.md).

## Entrega do planejamento

- Plano: [plan.md](../specs/0002-login-e-redirecionamento/plan.md).
- Tarefas: [tasks.md](../specs/0002-login-e-redirecionamento/tasks.md), concluídas durante a implementação autorizada.
- Revisão independente: contrato, CSRF, precedência 401/403, expiração, conta local,
  isolamento de testes e fluxo Angular/API conferidos; nenhum bloqueio identificado.
- Decisão principal: sessão no servidor com cookie HttpOnly; conta de estudo em memória
  configurada pelo ambiente, sem entidade ou migração nesta etapa.
- Implementação: sessão, CSRF, conta local, API de autenticação, login e dashboard entregues.
- Verificação final: Maven verify, Angular build/test, duas mutações de regressão restauradas,
  Chrome headless com F5, logout, falha de rede, expiração, fechamento/reabertura e reinício da API.
- Limites: H2 no fluxo local, Compose validado sem recriar Docker; sem operação remota.
