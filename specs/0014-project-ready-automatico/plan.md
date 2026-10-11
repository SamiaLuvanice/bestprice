# Plano — 0014

Não há contrato REST nem mudança em backend, frontend ou banco. O contrato desta spec
é o vínculo branch → spec/Issue e o mapeamento de estados do Project.

## Contrato de estados

Extensão da matriz da 0008 (somente a linha de Issue aberta sem responsável muda):

| Issue no GitHub | Branches `feature/<spec>-issue-<n>-*` | Status |
|---|---|---|
| Aberta com responsável | qualquer | `In progress` |
| Aberta sem responsável | ao menos uma com spec `pronta` | `Ready` (novo) |
| Aberta sem responsável | nenhuma, spec em outro status ou ilegível | `Backlog` |
| Fechada | ignoradas | regras da 0008 (`Develop`/`Backlog`) |

PRs não consultam specs e continuam como na 0008.

## Contrato de vínculo e leitura

- Branch válida: `^feature/(\d{4})-issue-([1-9]\d*)-.+$` → número da spec e da Issue.
  Outros nomes não participam.
- Spec da branch: a única pasta `specs/<spec>-*` no head atual da branch, arquivo
  `spec.md`. Nenhuma pasta (branch recém-criada) = sem spec, `Backlog` sem aviso.
  Mais de uma pasta = ilegível.
- Status: campo `status:` do cabeçalho delimitado por `---` na primeira linha;
  comentário após `#` é ignorado; valores válidos `rascunho`, `pronta`,
  `implementada`, `descartada`. Cabeçalho ausente ou outro valor = ilegível.
- Leitura sempre pela API de conteúdo no SHA atual da branch, obtido na hora
  (`git.listMatchingRefs` / `git.getRef`), nunca pelo SHA do evento. Isso atende ao
  AC de execuções fora de ordem: a última execução lê o estado mais recente.
- Ilegível ⇒ não é `pronta` (Issue vai a `Backlog`, ou fica `In progress` com
  responsável), aviso no resumo com branch e motivo, execução verde.
- O vínculo vem só do nome da branch; a linha `Issue:` da spec é ignorada.

## Gatilhos em `project.yml`

| Evento | Item reconciliado |
|---|---|
| `issues` (existente) | a Issue do evento; procura branches `feature/*-issue-<n>-*` |
| `workflow_dispatch kind=issue` | idem; independe da ref em que foi disparado |
| `push` em `feature/**` com `paths: ['specs/*/spec.md']` (novo) | a Issue apontada pelo nome da branch |
| `pull_request_target` | inalterado |

- `push` em branch fora do padrão: resumo informa e nada é alterado.
- `push` que não altera a spec da própria branch (por exemplo, merge de `develop`
  trazendo outras specs): `repos.compareCommits(before, after)` não lista
  `specs/<spec>-*/spec.md` ⇒ nada é alterado. `before` todo zero (primeiro push da
  branch) ⇒ trata como alterada. O filtro `paths` evita disparo quando nenhuma spec
  muda.
- Remoção de branch não dispara sincronização (suposição da spec).
- Issue inexistente (404) ou número que é PR: resumo informa, sem falha, sem alterar
  o Project.
- `concurrency.group`: fallback `project-${{ github.ref }}` para push, serializando
  publicações da mesma branch.

## Segurança

- Scripts continuam vindo do checkout da branch padrão com
  `persist-credentials: false`; o conteúdo da spec é lido como dado pela API e só é
  analisado por expressões regulares, nunca executado.
- Em `push`, o próprio YAML do workflow vem da branch publicada. Isso já vale para
  qualquer workflow com segredos em `push`, e só quem tem escrita no repositório
  publica branches (forks não disparam `push` no repositório base). O
  `PROJECT_TOKEN` passa a estar disponível em execuções de branches de feature; a
  documentação registra esse limite de confiança.
- Permissões do workflow seguem `contents: read`; o token do Project já tem leitura
  do repositório público.

## Organização do código

- `.github/scripts/spec-status.cjs` (novo): funções puras `parseFeatureBranch(name)`,
  `parseSpecStatus(text)`, `specChanged(files, spec)` e `issueSpecReady(results)`; e `readBranchSpec(github, repo,
  branch)` / `findIssueBranches(github, repo, n)`, que usam a API e devolvem
  `{ branch, status }` ou `{ branch, error }`.
- `.github/scripts/project-state.cjs`: Issue aberta, sem responsável e com
  `item.specReady === true` → `Ready`. Continua puro.
- `.github/scripts/sync-project.cjs`: o despachante resolve `kind`/`number` também para
  `push` (pela branch); para Issue aberta, preenche `specReady` e acumula avisos;
  avisos vão para o mesmo resumo. O restante (descoberta do Project, opção, escrita)
  não muda.

## Testes (`node --test .github/scripts/*.test.cjs`, já no job Automation do CI)

- `spec-status.test.cjs`: padrão de branch (válidos/inválidos), parse de status
  (comentário, cabeçalho ausente, valor inválido), pasta ausente/ambígua, várias
  branches para a mesma Issue, leitura pelo SHA atual.
- `project-state.test.cjs`: `Ready`, precedência de responsável, fechada ignora spec.
- `sync-project.test.cjs`: push → `Ready`; push com `rascunho` → `Backlog`; push em
  branch fora do padrão não escreve; spec ilegível avisa e não falha; Issue
  inexistente/PR não escreve; evento de Issue com spec `pronta`; PR inalterada;
  credencial ausente.

## Arquivos previstos

- `.github/scripts/spec-status.cjs`, `spec-status.test.cjs` (novos)
- `.github/scripts/project-state.cjs`, `project-state.test.cjs`
- `.github/scripts/sync-project.cjs`, `sync-project.test.cjs`
- `.github/workflows/project.yml`
- `docs/github-workflow.md`, `docs/PROGRESS.md`
- `specs/0014-project-ready-automatico/{tasks,verification}.md`

## Decisões e riscos

- **Sinal na branch da feature** (decisão da responsável; cara de reverter porque
  define o fluxo do board): é onde a spec vira `pronta` hoje, sem mudar a política de
  PR. O vínculo por nome de branch já é obrigatório e validado pela política de PR,
  então dispensa interpretar texto livre da spec.
- **Transição desta própria branch:** antes do merge, `push` nesta branch dispara o
  workflow novo, mas os scripts vêm de `develop` (antigos) e falham ao não reconhecer
  o evento. É esperado e restrito a esta PR; desaparece após a integração. Registrar
  em `verification.md`.
- **Gatilho só existe em branches com o YAML novo:** branches criadas antes do merge
  não disparam `push`; suas Issues são atualizadas pelos eventos de Issue ou por
  reconciliação manual.
- **Corrida** entre push e evento de Issue: grupos de concorrência distintos, mas os
  dois leem estado atual (Issue e branch) antes de escrever, então convergem.
- **Documentação desatualizada:** `docs/github-workflow.md` ainda descreve o Project
  como pendente de permissão, embora os secrets/variáveis existam; corrigir no mesmo PR.
- **Custo de API** em eventos de Issue: uma listagem de refs `heads/feature/` paginada
  por evento; volume do repositório é pequeno.
- **Validação real** (pós-merge): criar branch de teste para uma Issue sem
  responsável, publicar spec `pronta`, observar `Ready`; mudar para `rascunho`,
  observar `Backlog`; remover a branch de teste.
