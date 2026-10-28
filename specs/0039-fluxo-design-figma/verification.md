# Verificação — 0039

Data: 28/10/2026, America/Sao_Paulo. Issue #211; base `origin/develop`
`3f230793e6699f16e8443ecad045dc1d13ba3304`.
Status: implementação entregue para revisão; sem merge ou deploy.

## Entrada e revisão da spec

Escopo apresentado antes de qualquer exclusão; usuário aprovou com “siga” e
invocou agent-orchestration. Issue #211 criada e branch vinculada
`feature/0039-issue-211-fluxo-design-figma` criada a partir de develop atualizado.
Spec-reviewer independente: sem bloqueios. Pontos incorporados ao plano:
precedência Figma vs. HTML local, diff da aplicação, preservação da worktree
0038 e distinção entre configuração MCP do projeto e plugins globais.

## Evidências executadas

| Comando/inspeção | Observado | Limite |
|---|---|---|
| `git fetch origin` e `git show-ref --verify refs/remotes/origin/develop` | Base confirmada no SHA acima | Execução com acesso necessário a Git/rede |
| `pre-commit install --hook-type pre-commit --hook-type commit-msg` | Ambos os hooks instalados | Compartilhados pelo repositório/worktrees |
| Inventário de consumidores, imports e caminhos absolutos de `tools/paper-bridge` | 46 arquivos versionados exclusivos; nenhum arquivo novo na worktree da limpeza; consumidor externo executável somente CI | Não apagados arquivos de outras worktrees |
| `node --test .github/scripts/*.test.cjs` (implementador tooling) | 50 testes passaram, zero falhas/skips | Testes gerais de automação; testes exclusivos Paper retirados |
| `.agents/sync.ps1 -WithCursor -WithOpenCode` | Configurações MCP e projeções do harness regeneradas | Executado somente na nova worktree |
| Comparação JSON dos quatro arquivos MCP com `git show origin/develop:<arquivo>` | Somente `paper` retirado; demais valores semanticamente idênticos | Conexões globais do cliente fora do escopo |
| `git diff --name-only origin/develop -- frontend backend scripts docker-compose.yml` | Saída vazia | Aplicação, dependências, testes, assets e Compose intactos no diff |
| `git diff --check` (implementador tooling) | Passou | Resultado final após doc-sync registrado abaixo |
| Comparação YAML de `quality.yml` com a base, UTF-8 explícito | Somente as três etapas Paper retiradas; todos os outros campos preservados | Checagem estrutural; actionlint será executado no CI |
| `pre-commit run --all-files` | Todos os sete hooks de conteúdo passaram | Hook de commit-msg será executado no commit |
| `python .agents/skills/cyclomatic-complexity/scripts/complexity_report.py --changed origin/develop` | Nenhum arquivo .py alterado; exit 0 | Sem implementação Python para medir |
| Validação UTF-8, links e cercas dos Markdown alterados | 19 documentos, 147 links locais existentes, cercas balanceadas | Existência local; não testa URLs remotas |
| QA independente: testes Node e comparação Git/JSON/YAML | 50/50 testes passaram, zero falhas/skips; AC01–AC07 aprovados | Sem execução de UI, serviços reais ou MCP remoto |
| Doc-sync final: validação UTF-8, links e cercas Markdown; `git diff --check` e `git diff --cached --check` | 20 documentos, 149 links locais existentes, zero problemas de cercas; ambos os diff-checks passaram | Não verifica URLs remotas; PR e CI pendentes |

## Critérios de aceite

- AC01: 46 arquivos exclusivos removidos; três etapas exclusivas CI removidas, testes Node e actionlint gerais preservados.
- AC02: MCP canônico e três projeções comparados semanticamente; servidores chrome-devtools e Mercado Livre preservados.
- AC03–AC05: regras de precedência e referências locais alinhadas; guia principal em `docs/apps/frontend.md`; QA independente aprovou cobertura do fluxo, reutilização, desktop/mobile, validação e fallback.
- AC06: zero diff frontend/backend/scripts/Compose; worktree 0038 e mudanças locais anteriores não editadas.
- AC07: histórico 0035–0037 intacto, avisos de descontinuação e links ao snapshot anterior publicados; substituição da direção 0038 registrada sem editar sua worktree ou Issue.
- AC08: spec-reviewer, arch-reviewer e QA independentes sem bloqueios; hooks de conteúdo e gates locais aplicáveis aprovados; doc-sync final concluído. CI remoto e PR aguardam publicação/acompanhamento.

## Revisão independente

Arch-reviewer leu spec/plano/diff total e regras: sem achados bloqueantes ou
regressões concretas. Confirmou isolamento de tooling/CI/MCP e coerência do guia
Figma com preservação da identidade, reutilização e fallback; diff-check e
complexidade sem Python alterado passaram. QA confirmou AC01–AC07, 147 links
locais válidos e estado pendente preservado do checkout principal e worktree
0038. Não há hash inicial de cada arquivo local; a evidência de preservação usa
o inventário/status anterior e a ausência de operações nessas worktrees.

## Sincronização final do onboarding

Agente doc-sync-onboarding executado após os gates e as revisões independentes,
na mesma worktree, conforme o papel e a skill canônicos. Conferiu diff staged e
unstaged, arquivos novos da spec, configuração MCP, workflow e documentação.
Atualizou o progresso com os resultados reais e consolidou o registro final em
`doc-sync.md`; não alterou código, configuração, CI, regras ou tokens.

`AGENTS.md` e `CLAUDE.md` foram conferidos sem edição: o primeiro encaminha para
`.agents/`, e o segundo importa AGENTS e as regras compartilhadas; a fonte
canônica já registra Figma e o fluxo oficial. O procedimento continua concentrado
em `docs/apps/frontend.md`, com referências curtas nos demais guias.

## Limites

Não houve consulta/autenticação de arquivo Figma, escrita em canvas, redesign,
captura visual ou novo comportamento de aplicação. TDD Red/Green de produto não
se aplica a esta retirada de tooling. Playwright de testes da SPA permanece.
Lint/test/build de backend e frontend e actionlint serão conferidos no CI da PR;
não executados localmente nesta etapa, pois essas camadas não mudaram e actionlint
não está instalado no ambiente local. Sem validação ponta a ponta PostgreSQL,
Mercado Livre ou IA, sem release, deploy ou sincronização de Project declarada.
