# Plano técnico — 0032

Issue: [#182](https://github.com/SamiaLuvanice/bestprice/issues/182). Base:
`origin/develop` (`396f0ac`). O workflow executa código da branch padrão, usa
credenciais do ambiente GitHub `stage-validation` e acessa o banco configurado
para o Stage. `workflow_dispatch` precisa estar no branch padrão, então não será
executado de uma feature branch.

## Contrato operacional

- Workflow manual `validate-mercadolivre-stage.yml`, com três inputs MLB distintos
  (`price_item_id`, `no_price_item_id`, `unavailable_item_id`).
- Somente `develop` pode iniciar o job; qualquer outra referência é ignorada.
- O ambiente `stage-validation` restringe deployments a `develop` e contém
  `DATABASE_URL`, `MERCADOLIVRE_OAUTH_KEY`, `MERCADOLIVRE_CLIENT_ID` e
  `MERCADOLIVRE_CLIENT_SECRET` como secrets.
- O passo de validação fixa `MERCADOLIVRE_THIRD_PARTY_VALIDATED=false`, passa os
  IDs via ambiente e chama `python -m app.marketplace.validate_live
  --confirm-live-requests`.
- A sonda pode trocar e persistir um refresh token de uso único no banco Stage.
  Ela não altera tabelas de produtos; não guardar relatório como artefato.
- Uma execução que não passa não libera o gate, não deve ser repetida com os
  mesmos tokens após erro de refresh incerto; conferir o código de erro e
  reautorizar se a credencial ficou bloqueada.

## Camadas e arquivos

- `.github/workflows/validate-mercadolivre-stage.yml`: workflow manual,
  permissões mínimas, branch fixo, environment restrito e secrets injetados apenas
  no passo da sonda.
- `docs/apps/infraestrutura.md` e `docs/github-workflow.md`: configuração do
  environment, secrets, execução, segurança e limpeza após a validação.
- `specs/0032-sonda-mercado-livre-github-actions/{spec,plan,tasks,verification}.md`:
  critérios e evidências.

## Segurança e operação

- Não usar `pull_request_target`, fork, `repository_dispatch`, entrada dentro de
  comando shell, cache, debug, artifact ou step-summary com credenciais.
- Fixar actions em SHA seguindo os workflows existentes; checkout sem credencial
  persistente; `permissions: contents: read`; timeout e concorrência de execução.
- Receber IDs do operador como inputs e repassá-los por `env`, nunca interpolar
  texto de input no script. A validação MLB e unicidade existentes rodam antes de
  chamadas HTTP.
- Os secrets ficam restritos ao environment e ao branch `develop`. A política de
  retenção do GitHub Actions e o acesso dos colaboradores com escrita devem ser
  considerados no handoff; remover secrets do environment depois que a operação
  for concluída se não houver necessidade de repetição.

## Decisão

Preferir runner hospedado GitHub com environment protegido em vez de alterar o
plano do Render. O processo operacional já existe e é somente leitura para
anúncios; a mudança apenas oferece um local gratuito e auditável para executá-lo.
