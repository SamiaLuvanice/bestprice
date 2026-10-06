# .agents — fonte única das instruções

Stack ativa: FastAPI, React + TypeScript e PostgreSQL. Funciona com Codex, Claude Code, Cursor e OpenCode. Papéis ficam em agents/, regras em rules/, skills em skills/ e comandos em commands/. archive/ guarda referências históricas inativas; não as aplique ao projeto atual.

O processo preserva /spec → /plan → /implement com TDD → /verify, Issue GitHub, worktree de origin/develop, revisão independente e PR para develop. A skill agent-orchestration coordena papéis e evidências quando há delegação. Project é opcional; implantação externa não está configurada.

Papéis ativos: product-owner, spec-reviewer, backend, frontend, fullstack, qa, arch-reviewer e debugger. Skills centrais: spec-driven, po-intake, agent-orchestration, api-contract, fastapi-feature, fastapi-persistence, fastapi-testing, react-feature, quality-gates, bug-resolve, learnings, task-cleanup, tdd e monorepo-navigation. Leia modules.yaml para o perfil e sources.md para referências.

As ferramentas enxergam .agents/ diretamente ou por projeções: Codex lê AGENTS.md; Claude usa CLAUDE.md e links; OpenCode/Cursor podem usar links opcionais. No Windows execute .agents/sync.ps1; no Unix, bash .agents/sync.sh. Edite apenas .agents/, nunca conteúdo das projeções.

Nomes neutros, instruções simples e segredos fora do repositório. Para stack antiga, consulte archive/ e Git histórico.
