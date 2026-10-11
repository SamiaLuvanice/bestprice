# Verificação — 0014

Branch `feature/0014-issue-39-project-ready-automatico`, worktree
`.worktrees/feature-0014-issue-39-project-ready-automatico`. Escopo: automação do
GitHub (`.github/`) e documentação; `backend/` e `frontend/` sem alteração, portanto
os gates de Python e React não se aplicam a esta mudança (o CI os executa mesmo assim).

## Revisão da spec

- `spec-reviewer`, rodada 1: **reprovada**. Bloqueante: pelo fluxo atual, a spec só
  chega `pronta` a `develop` na PR que fecha a Issue. A responsável escolheu como
  sinal a spec na branch da feature.
- `spec-reviewer`, rodada 2: **aprovada com ressalvas**; ressalvas 1–10
  incorporadas (spec ilegível → Backlog, branch sem pasta sem aviso, remoção de
  branch como suposição, push que só altera outras specs não conta, premissas de
  vínculo e segurança). Status `pronta` no commit `1f5f98b`.

## TDD

| Etapa | Comando | Resultado |
|---|---|---|
| Red I01/I02 | `node --test .github/scripts/spec-status.test.cjs .github/scripts/project-state.test.cjs` | `Cannot find module './spec-status.cjs'`; `expected: 'Ready'`, `actual: 'Backlog'` |
| Green I01/I02 | `node --test .github/scripts/*.test.cjs` | tests 24, pass 24, fail 0 |
| Red I03/I04 | `node --test .github/scripts/sync-project.test.cjs` | tests 16, pass 8, fail 8: 7 com `Informe kind e number válidos.` (push não suportado) e 1 com `expected 'option-1'`/`actual 'option-0'` (evento de Issue ignorava a spec). Os 2 testes novos que já passavam protegem o comportamento atual (branch sem spec → Backlog; Issue fechada ignora spec) |
| Green I03/I04 | `node --test .github/scripts/*.test.cjs` | tests 34, pass 34, fail 0 |
| Merge `origin/develop` (#40) | `git merge --no-ff origin/develop`; conflito em `sync-project.cjs` resolvido mantendo `pushChangedSpec` (0014) e `CLOSED_EVENT_TOLERANCE_MS` (#40) | tests 40, pass 40, fail 0; `git diff --stat origin/develop..HEAD` só lista arquivos da 0014 |
| Red achados 3–6 da revisão | `node --test .github/scripts/*.test.cjs` | tests 43, fail 4: status entre aspas ilegível; `Unknown encoding: none`; force-push `actual: ~` (nada escrito); remoção caiu em "spec não alterada" |
| Green achados 3–6 | `node --test .github/scripts/*.test.cjs` | tests 43, pass 43, fail 0 |

## Gates

| Gate | Comando | Resultado |
|---|---|---|
| Testes de automação | `node --test .github/scripts/*.test.cjs` | 43 passed, 0 failed (commit `441e7b4`) |
| actionlint 1.7.12 | `docker run --rm -v <worktree>:/repo -w /repo rhysd/actionlint:1.7.12 -color` | saída 0, sem achados, também após o job `resolve` (Go não está instalado no Windows; foi usada a imagem oficial na mesma versão do CI) |

## Critérios de aceite

| # | Critério | Evidência |
|---|---|---|
| 1 | push torna spec `pronta` → Ready | teste `push que torna a spec pronta leva a Issue da branch a Ready` |
| 2 | evento de Issue/reconciliação manual com spec `pronta` → Ready | teste `evento de Issue e reconciliação manual consideram a spec da branch` |
| 3 | responsável → In progress; sem responsável volta a Ready | testes `responsável tem precedência sobre spec pronta` e `Issue aberta sem responsável e com spec pronta vai para Ready` |
| 4 | spec sai de `pronta` → Backlog | teste `push que tira a spec de pronta devolve a Issue a Backlog` (rascunho, implementada, descartada) |
| 5 | sem branch / sem pasta / `rascunho` → Backlog sem aviso | testes `branch recém-criada sem spec mantém Backlog sem aviso`, `branch sem pasta ou sem spec.md fica fora de Ready sem aviso` e caso `other` do teste do critério 2 |
| 6 | várias branches, uma `pronta` → Ready | teste `Issue fica pronta quando ao menos uma branch tem a spec pronta` |
| 7 | Issue fechada ignora spec | testes `Issue fechada ignora a spec da branch` e casos fechados de `project-state` |
| 8 | publicações fora de ordem convergem | **parcial**: a convergência depende de ler o SHA atual **e** da serialização por Issue (critério 9). Testes provam a primeira parte: `leitura usa o SHA atual da branch, não o do evento` (lê `git.getRef` atual, não `payload.after`); teste `force-push é tratado como alteração da spec, mesmo com diff vazio` |
| 9 | push e evento de Issue simultâneos | job `resolve` + `concurrency: project-<Issue>` no job `sync`: as execuções da mesma Issue ficam serializadas e cada uma lê o estado atual. A resolução da chave foi exercitada localmente em bash (`feature/0014-issue-39-x` → `39`; outros nomes → `ref-…`). `workflow_dispatch` com `number=013` normalizado para `13`, igual ao `Number()` do script. **Por inspeção**: nenhum teste roda execuções concorrentes e a concorrência real no GitHub não foi reproduzida (V04) |
| 10 | spec ilegível → Backlog, aviso, sem falha | testes `spec ilegível mantém Backlog, avisa no resumo e não falha` e `spec ilegível ou pasta ambígua gera aviso com branch e motivo` |
| 11 | Issue inexistente ou PR → nada alterado, sem falha | teste `push que aponta Issue inexistente ou PR não altera o Project e não falha` |
| 12 | branch fora do padrão ou spec da branch não alterada → nada alterado | testes `push fora do padrão ou sem alterar a spec da branch não altera o Project`, `somente feature/<spec>-issue-<n>-<slug> vincula spec e Issue` e `push só conta quando altera a spec da própria branch`; filtro `paths` no workflow |
| 13 | credencial ausente → comportamento da 0008 | **por inspeção**: o passo `Conferir configuração` do job `sync` está inalterado e também roda no push; o job `resolve` não usa o token. Não há teste nem execução de push sem `PROJECT_TOKEN` |
| 14 | eventos de PR inalterados | testes 0008 de PR em `project-state` e `sync-project` seguem verdes |
| 15 | documentação | `docs/github-workflow.md`: matriz com Ready, seção "Ready pela spec (0014)", limite de confiança do push, "Ready só manual" removido, credenciais marcadas como configuradas |

## QA

`qa`: **aceito com ressalvas** (43 testes reexecutados). Critérios 8, 9 e 13
reclassificados acima como parcial/por inspeção; a brecha de `number=013` fora do
grupo de concorrência foi corrigida; na documentação, foram incluídos o evento
"desatribuída" e a dependência da serialização.

## Pendências

- **Execução real (V04):** o gatilho `push` com o código novo só funciona depois do
  merge em `develop`, porque os scripts vêm da branch padrão. Antes do merge, pushes
  desta branch que alterem a spec disparam o workflow com os scripts antigos de
  `develop`, que falham com `Informe kind e number válidos.`. Isso é esperado e
  restrito a esta PR. Depois do merge: criar uma branch de teste para uma Issue sem
  responsável, publicar a spec `pronta`, observar Ready; mudar para `rascunho`,
  observar Backlog; atribuir e remover responsável (In progress → Ready); push e
  evento de Issue em sequência rápida (critérios 8 e 9); remover a branch de teste.
