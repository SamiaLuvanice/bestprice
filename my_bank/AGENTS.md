# Harness do projeto

Projeto de estudos: **Java + Spring Boot** (`backend/`) e **Angular** (`frontend/`).
Priorize simplicidade, boas práticas e explicar o porquê das decisões.

Toda configuração de agentes vive em `.agents/`, a fonte única de verdade para
agents, skills, commands e rules (ver `.agents/AGENTS.md`).

- Papéis: `.agents/agents/` · Skills: `.agents/skills/` · Comandos: `.agents/commands/`
- Regras: `.agents/rules/`
- Fluxo: `/spec` → `/plan` → `/implement` → `/verify`
- Após integrar uma spec em `develop`, finalize recursos locais da tarefa conforme a skill
  `.agents/skills/task-cleanup/SKILL.md`.
- Material de outras stacks e integrações (ClickUp, Railway...) fica em `.agents/archive/` e **não** é usado.

## Regras sempre ativas (leia **antes de qualquer tarefa**)

- `.agents/rules/workspace.md` (índice: cada assunto tem um dono)
- `.agents/rules/evidencia.md`
- `.agents/rules/task-done-criteria.md`
- `.agents/rules/datetime-pipeline.md`
- `.agents/rules/git.md`
- `.agents/rules/git-worktree-required.md`
- `.agents/rules/implementation-handoff.md`

## Regras por tema (leia sob demanda, conforme o arquivo que for editar)

- Backend Java/Spring: `.agents/rules/architecture.md`, `java-spring.md`, `errors.md`
- Frontend Angular/TypeScript: `.agents/rules/frontend.md`
- Transversais: `naming.md`, `testing.md`, `security.md`

## Skills, agents e comandos em qualquer ferramenta

- **Skills:** `.agents/skills/<nome>/SKILL.md`. Se a ferramenta não as carrega sozinha,
  abra o `SKILL.md` quando a descrição (frontmatter) combinar com a tarefa.
- **Agents:** `.agents/agents/<papel>.md`. Sem suporte a subagentes, assuma o papel
  lendo o arquivo; com suporte, cite o caminho no prompt do subagente.
- **Comandos** (`/spec`, `/plan`, `/implement`, `/verify`): `.agents/commands/<nome>.md`.
  Sem slash-command na ferramenta, leia o arquivo e execute os passos; `$ARGUMENTS` é o
  que o usuário informou junto do pedido.

## Ferramentas

Este arquivo é lido direto por Codex, Cursor, OpenCode e outros; o Claude Code o importa via
`CLAUDE.md`. As pastas `.claude/`, `.opencode/` e `.cursor/` são projeções geradas. Não edite
o conteúdo dos links; altere `.agents/` e execute `bash .agents/sync.sh`.
