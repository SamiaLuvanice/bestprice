# Harness ativo

O perfil ativo usa FastAPI, React + TypeScript e PostgreSQL. O processo de spec, TDD, evidência, worktree, revisão, QA e PR para `develop` está descrito em `.agents/`, `harness.yaml` e [docs/github-workflow.md](github-workflow.md). A skill `agent-orchestration` coordena Issues, specs locais, gates e revisão independente. A sincronização de documentação segue a regra única de `.agents/rules/task-done-criteria.md`: `node .agents/scripts/docs-impact.mjs` aponta os documentos afetados e, havendo algum, o agente `doc-sync-onboarding` os atualiza.

## 0.4.0 — núcleo agnóstico (spec 0058)

- Scripts Node sem dependências em `.agents/scripts/`, configurados por `harness.yaml`: `sync.mjs` (substitui as duas implementações; wrappers mantidos), `diagnose.mjs` (multiplataforma e no CI), `gates.mjs`, `docs-impact.mjs` e `commit-msg.mjs`.
- Hook `commit-msg` com branch protegida, Conventional Commits e bloqueio de atribuição a agentes; gitleaks no pre-commit. No CI, jobs Commit policy e Secrets entram no agregador.
- Núcleo separado do perfil em `modules.yaml`; regra de doc-sync única e condicional; comandos de portão citados como `gates.mjs`.
- Correções observadas: os agentes gerados para o OpenCode saíam com BOM e acentuação corrompida; `skills-lock.json` travava `vercel-react-best-practices` sem pasta (removida do lock).
