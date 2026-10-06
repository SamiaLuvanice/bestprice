# Verificação — 0006

Data: 2026-10-06. Branch: `feature/0006-issue-12-github-workflow`.
Issue: https://github.com/SamiaLuvanice/bestprice/issues/12.
PR: https://github.com/SamiaLuvanice/bestprice/pull/13.

## Evidências locais

| Verificação | Resultado |
|---|---|
| `backend/.\mvnw.cmd --batch-mode --no-transfer-progress verify` | BUILD SUCCESS; 23 testes, zero falhas/erros/skips |
| `frontend/npm ci` | 469 pacotes instalados; lockfile preservado |
| `frontend/npm run build` | Build de produção concluído |
| `frontend/npm test -- --watch=false` | 31 testes, cinco arquivos, todos passaram |
| `node --test .github/scripts/*.test.cjs` | 11 testes; política, cercas Markdown, limite de commits, sincronização reversa, transições e fronteira API com dublê |
| `actionlint` 1.7.12 | Quatro workflows válidos; binário oficial com SHA256 conferido |

TDD: três testes de política falharam contra a implementação vazia (retorno
incorreto/ausência de rejeição) e passaram após implementação. Dois testes de
status falharam contra o retorno constante Todo e passaram com as transições.
A primeira tentativa Node foi bloqueada por EPERM do sandbox; essa falha de
ambiente não foi considerada evidência Red.
O teste adicional de sincronização reversa falhou pela rejeição indevida de
main → stage; a política foi corrigida antes da entrega final.
A revisão independente também encontrou a aceitação de cercas `~~~`, o limite
de 250 commits da API e a corrida de tag na release; os três foram corrigidos
e cobertos/documentados nesta atualização.

## Evidências no GitHub

- CI do commit final `7cb4533`: [execução 37472810287](https://github.com/SamiaLuvanice/bestprice/actions/runs/37472810287),
  concluída com sucesso. Passaram PR policy, quality / Automation, quality /
  Frontend, quality / Backend e o agregador CI.
- `gh issue develop 12 --list` confirmou a branch vinculada à Issue.
- `gh repo view --json defaultBranchRef` confirmou develop como padrão.
- `scripts/configure-github.ps1 -Apply` criou o ruleset **integration-branches**,
  ID **24581959**, enforcement **active**, nas três branches.
- O mesmo script ativou **delivery-tags**, ID **24584593**, enforcement **active**,
  protegendo tags `v*` e `build-*` contra remoção e force move.
- `gh pr view 13 --json reviewDecision,mergeStateStatus,statusCheckRollup` confirmou
  todos os checks SUCCESS e merge **BLOCKED / REVIEW_REQUIRED**. Essa é a evidência
  de que checks verdes não dispensam aprovação independente.
- PROJECT_OWNER configurada como SamiaLuvanice. PROJECT_NUMBER e PROJECT_TOKEN
  não inventados nem copiados de credenciais da sessão.

## Critérios de aceite

| Critério | Situação | Evidência |
|---|---|---|
| Formulário/template | Implementado; ativação após merge | Arquivos .github/ISSUE_TEMPLATE e pull_request_template.md |
| Rastreabilidade e rejeições | Demonstrado | Branch vinculada, 7 testes de política e PR policy remoto |
| CI de backend/frontend/automações | Demonstrado em PR | Execução 37467567220 |
| Agregação de falhas | Implementado e revisado | CI exige resultado success de Quality e política; casos inválidos rejeitados nos testes |
| Proteções/revisão | Ativo e demonstrado | Ruleset 24581959; REVIEW_REQUIRED mesmo com CI verde |
| Fechamento nativo | Preparado; não exercitado | PR #13 com Closes #12 e base/padrão develop; aguarda merge |
| Project e credencial ausente | Implementado; validação remota pendente | Transições/API em 4 testes; workflow ainda não integrado, PAT ausente |
| Entrega de duas imagens/release | Implementado; não publicado | Delivery validado por actionlint; aguarda promoção revisada para main |
| Isolamento de permissões | Revisado | CI read-only; Project faz checkout apenas da padrão; Delivery só na main |
| Passos manuais e permissões | Documentado | docs/github-workflow.md |

## Limites e pendências

- Project: token atual sem escopo project. Criação, campos/visões, credencial
  PROJECT_TOKEN e execução real de sincronização exigem configuração do responsável.
- CD: lint validado; publicação real só após revisão e promoção para main.
  Nenhuma imagem/release foi publicada como teste; implantação externa não existe.
- `npm ci` relatou três vulnerabilidades preexistentes (uma alta e duas críticas).
  Correção de dependências não faz parte desta spec; não foi executado audit fix.
- Nenhum comportamento REST/Angular foi alterado; não repetido E2E de login.
- Spec permanece pronta, aguardando revisão independente, merge e comprovação
  dos critérios dependentes de configuração externa. CI verde não equivale a CD
  ou sincronização Project demonstrados.
- A revisão independente foi concluída com os achados P2/P3 corrigidos: cercas
  Markdown alternativas, limite de commits da API, corrida de tag e recuperação
  de divergência entre branches estão tratados e documentados.
