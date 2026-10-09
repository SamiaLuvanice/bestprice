# Harness do projeto

BestPrice: monitoramento automático de preços de anúncios do Mercado Livre Brasil, destinado a usuários reais (marketplace exclusivo desta fase pela spec 0013; a premissa anterior era a Amazon). Stack: FastAPI (Python 3.13) em backend/, React + TypeScript em frontend/ e PostgreSQL. Priorize simplicidade, qualidade de produção e explique o porquê. A visão do produto está em docs/product-context.md; as orientações ativas ficam em .agents/rules/workspace.md.

Toda configuração de agentes vive em .agents/, a fonte única de verdade (ver .agents/AGENTS.md).

- Papéis: .agents/agents/ · Skills: .agents/skills/ · Comandos: .agents/commands/
- Regras: .agents/rules/
- Fluxo: /spec → /plan → /implement (TDD para comportamento) → /verify
- Orquestração de trabalho delegado: .agents/skills/agent-orchestration/SKILL.md
- Após qualquer alteração de código, execute por último o agente .agents/agents/doc-sync-onboarding.md e confira AGENTS.md, CLAUDE.md e docs/.
- Após integrar em develop, aplique .agents/skills/task-cleanup/SKILL.md.
- Use apenas papéis, regras, skills e comandos listados no perfil ativo de .agents/.

## Regras sempre ativas

Leia antes de qualquer tarefa: .agents/rules/workspace.md, evidencia.md, task-done-criteria.md, datetime-pipeline.md, git.md, git-worktree-required.md e implementation-handoff.md.

## Regras por tema

Backend: .agents/rules/architecture.md, backend.md, errors.md. Frontend: frontend.md. Transversais: naming.md, testing.md, security.md.

## Skills, agents e comandos

Leia .agents/skills/<nome>/SKILL.md quando a descrição combinar com a tarefa; cite .agents/agents/<papel>.md ao delegar. Para /spec, /plan, /implement e /verify, leia .agents/commands/<nome>.md quando a ferramenta não tiver slash-command. $ARGUMENTS é o argumento do pedido.

Este arquivo é lido por Codex, Cursor e OpenCode; Claude importa via CLAUDE.md. Pastas .claude/, .opencode/ e .cursor/ são projeções. Edite .agents/ e execute .agents/sync.ps1 no Windows ou bash .agents/sync.sh em sistemas Unix.
