# Arquivo (não usado)

Material do harness original (stack FastAPI + React/Vue, board ClickUp, deploy Railway,
orquestração de vários agentes) que **não faz parte** do fluxo de estudo Java + Spring Boot + Angular.

Fica aqui, fora de `skills/`, `agents/`, `rules/` e `commands/`, portanto **nenhuma ferramenta
o carrega**. Serve de referência e pode ser restaurado movendo a pasta de volta
(depois, `bash .agents/sync.sh`).

| Pasta | Conteúdo | Por que saiu |
|---|---|---|
| `skills/clickup`, `drive-artefatos` | integração com board e Google Drive | serviços externos desnecessários |
| `skills/stage-to-main` | promoção stage → produção (Railway) | sem deploy em nuvem |
| `skills/agent-orchestration`, `agents/orchestrator.md`, `config/orquestracao.yml` | pipeline com vários subagentes em paralelo | complexidade além do necessário |
| `skills/task-handoff`, `pr-review-merge`, `rules/implementation-handoff.md`, `rules/git-worktree-required.md` | handoff entre sessões, worktrees obrigatórios, deploy Railway | fluxo de equipe; para estudo solo é peso |
| `skills/fastapi-*`, `react-feature`, `vue-feature`, `angular-feature`, `frontend-parity`, `clean-architecture` | stack Python, três SPAs, Clean Architecture com ports | substituídas por `spring-boot-*` e `angular-developer` |
| `skills/i18n`, `rules/i18n.md`, `skills/datetime` | i18n pt/en/es e fuso (detalhe de outro domínio) | complexidade não pedida (datas/dinheiro ficaram na rule `datetime-pipeline`) |
| `skills/qa-visual`, `config/e2e-map.example.yaml` | QA visual em staging com Playwright | sem ambiente de staging |
| `scripts/` | worktree-stack, guard-stage-branch, e2e, contract-test, qa-capture | dependem do fluxo/stack antigos |
