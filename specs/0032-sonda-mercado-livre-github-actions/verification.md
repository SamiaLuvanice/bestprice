# Verificação — 0032

Issue: [#182](https://github.com/SamiaLuvanice/bestprice/issues/182).
Base: `origin/develop` (`396f0ac`).

## Critérios e evidências

| Critério | Estado | Evidência/limite |
|---|---|---|
| AC01 | Parcial | Workflow manual com três IDs requeridos; branch guard e validação/unicidade são anteriores às chamadas no script. Não executado: workflow ainda não está em `develop`. |
| AC02 | Implementado localmente | Environment `stage-validation` confirmado no GitHub, deployment limitado a `develop`; workflow fixa SHAs e usa `contents: read`. A execução ainda depende do PR. |
| AC03 | Parcial | Quatro secrets configurados no environment protegido; workflow os injeta apenas na etapa da sonda. Revisão automatizada pendente. |
| AC04 | Pendente | Sonda não executada; depende de IDs confirmados e do workflow em `develop`. O refresh pode rotacionar credenciais OAuth no banco Stage. |
| AC05 | Implementado localmente | Workflow fixa a flag como `false` e não tem etapa para alterar configuração Render. |
| AC06 | Implementado | Procedimento, escopo, limpeza e riscos de OAuth documentados em `docs/apps/infraestrutura.md` e `docs/github-workflow.md`. |

## Comandos e resultados

- `node --test .github/scripts/*.test.cjs` — **50/50 passaram** (fora do
  sandbox; a primeira tentativa no sandbox foi bloqueada por `spawn EPERM`).
- `git diff --check` — **passou**.
- `actionlint` — ferramenta ausente no ambiente local; CI executará o lint do workflow após o push.
- Doc-sync-onboarding aplicado por último após a revisão local: `docs/apps/infraestrutura.md`,
  `docs/github-workflow.md`, `docs/PROGRESS.md` e `docs/LEARNINGS.md` atualizados;
  `README.md`, `docs/index.md`, `AGENTS.md` e `CLAUDE.md` conferidos, sem necessidade
  de alteração adicional.

## Limites operacionais

- Environment GitHub `stage-validation` configurado e limitado à branch `develop`.
  Os quatro secrets de conexão Stage/OAuth foram copiados diretamente da tela do
  Render para o ambiente GitHub; seus valores não foram exibidos ou registrados.
- O arquivo do workflow ainda não está em `develop`; o GitHub só oferece o
  `workflow_dispatch` a partir da branch padrão, então a sonda não pode ser
  executada antes da revisão e integração do PR.
- A sonda de rede real não foi executada; o gate Stage permanece desligado.
- O item `MLB4002132867` apareceu em uma página pública como anúncio pausado; a
  API oficial ainda precisa confirmar se é o cenário `unavailable`.
- A aplicação do Mercado Livre exige preço nos anúncios comuns, portanto um ID
  `no_price` não está confirmado e pode exigir intervenção manual.
