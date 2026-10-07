# Harness ativo

O perfil ativo usa FastAPI, React + TypeScript e PostgreSQL. O processo de spec, TDD, evidência, worktree, revisão, QA e PR para `develop` está descrito em `.agents/`, `harness.yaml` e [docs/github-workflow.md](github-workflow.md). A skill `agent-orchestration` coordena Issues, specs locais, gates e revisão independente. O agente `doc-sync-onboarding` encerra toda tarefa com alteração de código, conferindo `AGENTS.md`, `CLAUDE.md` e a documentação afetada em `docs/`; uma nova alteração de código exige nova sincronização.
