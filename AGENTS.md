# Harness do projeto

Projeto de estudos: FastAPI (Python 3.13) em backend/, React + TypeScript em frontend/ e PostgreSQL. Priorize simplicidade, boas práticas e explique o porquê.

Toda configuração de agentes vive em .agents/, a fonte única de verdade (ver .agents/AGENTS.md).

- Papéis: .agents/agents/ · Skills: .agents/skills/ · Comandos: .agents/commands/
- Regras: .agents/rules/
- Fluxo: /spec → /plan → /implement (TDD para comportamento) → /verify
- Orquestração de trabalho delegado: .agents/skills/agent-orchestration/SKILL.md
- Após integrar em develop, aplique .agents/skills/task-cleanup/SKILL.md.
- Use apenas papéis, regras, skills e comandos listados no perfil ativo de .agents/.

## Regras sempre ativas

Leia antes de qualquer tarefa: .agents/rules/workspace.md, evidencia.md, task-done-criteria.md, datetime-pipeline.md, git.md, git-worktree-required.md e implementation-handoff.md.

## Regras por tema

Backend: .agents/rules/architecture.md, backend.md, errors.md. Frontend: frontend.md. Transversais: naming.md, testing.md, security.md.

## Skills, agents e comandos

Leia .agents/skills/<nome>/SKILL.md quando a descrição combinar com a tarefa; cite .agents/agents/<papel>.md ao delegar. Para /spec, /plan, /implement e /verify, leia .agents/commands/<nome>.md quando a ferramenta não tiver slash-command. $ARGUMENTS é o argumento do pedido.

Este arquivo é lido por Codex, Cursor e OpenCode; Claude importa via CLAUDE.md. Pastas .claude/, .opencode/ e .cursor/ são projeções. Edite .agents/ e execute .agents/sync.ps1 no Windows ou bash .agents/sync.sh em sistemas Unix.
