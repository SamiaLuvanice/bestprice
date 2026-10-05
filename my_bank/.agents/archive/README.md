# Arquivo (não usado)

Material do harness original (stack FastAPI + React/Vue, board ClickUp, deploy Railway,
orquestração de vários agentes) que **não faz parte** do fluxo de estudo Java + Spring Boot + Angular.

Fica aqui, fora de `skills/`, `agents/`, `rules/` e `commands/`, portanto **nenhuma ferramenta
o carrega**. Serve de referência; não mova uma pasta inteira de volta sem revisar as
dependências, branches, ferramentas e arquitetura que ela pressupõe.

| Pasta | Conteúdo | Por que saiu |
|---|---|---|
| `skills/clickup`, `drive-artefatos` | integração com board e Google Drive | serviços externos desnecessários |
| `skills/stage-to-main` | promoção stage → produção (Railway) | sem deploy em nuvem |
| `skills/agent-orchestration`, `agents/orchestrator.md`, `config/orquestracao.yml` | pipeline com vários subagentes em paralelo | complexidade além do necessário |
| `skills/task-handoff`, `pr-review-merge`, `rules/implementation-handoff.md`, `rules/git-worktree-required.md` | handoff, branches, worktrees e deploy Railway | fluxo atual usa `develop`, PR e handoff local, sem deploy obrigatório |
| `skills/fastapi-*`, `react-feature`, `vue-feature`, `frontend-parity`, `clean-architecture` | stack Python, três SPAs e Clean Architecture com ports | não correspondem à stack/arquitetura simples deste projeto |
| `skills/angular-feature` | orientação de feature Angular do harness anterior | reescrita para este monorepo em `.agents/skills/angular-feature/` |
| `skills/i18n`, `rules/i18n.md`, `skills/datetime` | i18n pt/en/es e casos de fuso do domínio anterior | i18n continua fora do escopo; casos Java de data/hora foram adaptados em `.agents/skills/java-datetime/` |
| `skills/qa-visual`, `config/e2e-map.example.yaml` | QA visual em staging com Playwright | sem ambiente de staging |
| `scripts/` | worktree-stack, guard-stage-branch, e2e, contract-test, qa-capture | worktree-stack e guard foram adaptados; E2E/contrato ainda dependem de infraestrutura ausente |
