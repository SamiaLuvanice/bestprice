# Harness do projeto

BestPrice: monitoramento automático de preços de anúncios do Mercado Livre Brasil, destinado a usuários reais (marketplace exclusivo desta fase pela spec 0013; a premissa anterior era a Amazon). Stack: FastAPI (Python 3.13) em backend/, React + TypeScript em frontend/ e PostgreSQL. Priorize simplicidade, qualidade de produção e explique o porquê. A visão do produto está em docs/product-context.md; as orientações ativas ficam em .agents/rules/workspace.md.

Toda configuração de agentes vive em .agents/, a fonte única de verdade (ver .agents/AGENTS.md).

- Papéis: .agents/agents/ · Skills: .agents/skills/ · Comandos: .agents/commands/
- Regras: .agents/rules/
- Fluxo: /spec → /plan → /implement (TDD para comportamento) → /verify
- Orquestração de trabalho delegado: .agents/skills/agent-orchestration/SKILL.md
- Documentação: regra única em .agents/rules/task-done-criteria.md (`node .agents/scripts/docs-impact.mjs` decide se o agente doc-sync-onboarding roda).
- Scripts do núcleo em .agents/scripts/ (Node, sem dependências), configurados por harness.yaml: `gates.mjs` (portões), `diagnose.mjs`, `docs-impact.mjs`, `commit-msg.mjs` (hook) e `sync.mjs`.
- Após integrar em develop, aplique .agents/skills/task-cleanup/SKILL.md.
- Use apenas papéis, regras, skills e comandos listados no perfil ativo de .agents/.

## Regras sempre ativas

Leia antes de qualquer tarefa: .agents/rules/workspace.md, evidencia.md, task-done-criteria.md, datetime-pipeline.md, git.md, git-worktree-required.md e implementation-handoff.md.

## Regras por tema

Backend: .agents/rules/architecture.md, backend.md, complexity.md, errors.md. Frontend: frontend.md. Transversais: naming.md, testing.md, security.md.

## Skills, agents e comandos

Leia .agents/skills/<nome>/SKILL.md quando a descrição combinar com a tarefa; cite .agents/agents/<papel>.md ao delegar. Para /spec, /plan, /implement e /verify, leia .agents/commands/<nome>.md quando a ferramenta não tiver slash-command. $ARGUMENTS é o argumento do pedido.

Este arquivo é lido por Codex, Cursor e OpenCode; Claude importa via CLAUDE.md. Pastas .claude/, .opencode/ e .cursor/ são projeções. Edite .agents/ e execute `node .agents/scripts/sync.mjs` (os wrappers .agents/sync.ps1 e .agents/sync.sh chamam o mesmo script).

MCP: a fonte é .agents/mcp.json (formato agnóstico mcpServers). O sync gera .mcp.json na raiz (com `type: http` nas entradas remotas) e o bloco mcp de opencode.json — não edite os gerados. Use o Context7 para documentação de bibliotecas quando a versão importar.
