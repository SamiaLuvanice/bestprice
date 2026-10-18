# .agents — fonte única das instruções

Stack ativa: FastAPI, React + TypeScript e PostgreSQL. Funciona com Codex, Claude Code, Cursor e OpenCode. Papéis ficam em agents/, regras em rules/, skills em skills/ e comandos em commands/.

O processo preserva /spec → /plan → /implement com TDD → /verify, Issue GitHub, worktree de origin/develop, revisão independente e PR para develop. A skill agent-orchestration coordena papéis e evidências quando há delegação. Project é opcional; implantação externa não está configurada.

Papéis ativos: product-owner, spec-reviewer, backend, frontend, fullstack, qa, arch-reviewer, debugger e doc-sync-onboarding. Skills centrais: spec-driven, po-intake, agent-orchestration, api-contract, fastapi-feature, fastapi-persistence, fastapi-testing, react-feature, quality-gates, bug-resolve, learnings, task-cleanup, tdd, monorepo-navigation e doc-sync-onboarding. `fastapi-templates`, `frontend-design` e `react-vite-performance` são guias complementares para estrutura inicial, direção visual e desempenho da SPA; `cyclomatic-complexity` mede e orienta a redução de complexidade no backend. No perfil também entram `ui-ux-pro-max` (diretrizes de design pesquisáveis em catálogo local: estilos, paletas, tipografia e regras de UX), `huashu-design` (protótipos de alta fidelidade a partir do Brand Asset Protocol, com saída em `designsystem/prototypes/`) e `impeccable` (crítica de design com detector determinístico local). Antes de criar HTML/CSS novo, leia `designsystem/agent-guidelines.md`. Leia modules.yaml para o perfil e sources.md para referências.

As ferramentas enxergam .agents/ diretamente ou por projeções: Codex lê AGENTS.md; Claude usa CLAUDE.md e links; OpenCode/Cursor podem usar links opcionais. No Windows execute .agents/sync.ps1; no Unix, bash .agents/sync.sh. Edite apenas .agents/, nunca conteúdo das projeções.

Servidores MCP ficam em .agents/mcp.json (formato agnóstico mcpServers) — a fonte única. O sync projeta .mcp.json na raiz (lido por Claude e clientes compatíveis) e gera o bloco mcp de opencode.json, cujo formato é próprio do OpenCode. Nunca edite esses dois arquivos gerados: altere .agents/mcp.json e rode o sync.

Nomes neutros, instruções simples e segredos fora do repositório. Use apenas regras, skills e papéis listados no índice ativo; não carregue snapshots inativos.
