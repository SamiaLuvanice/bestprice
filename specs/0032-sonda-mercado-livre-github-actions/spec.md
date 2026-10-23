---
numero: 0032
titulo: Sonda operacional do Mercado Livre pelo GitHub Actions
tipo: melhoria
prioridade: P0
status: pronta
toca: [infraestrutura, docs]
depende_de: [0026]
---

# 0032 — Sonda operacional do Mercado Livre pelo GitHub Actions

Issue: https://github.com/SamiaLuvanice/bestprice/issues/182

## Problema

O plano Free do Render não oferece Shell nem One-off Jobs. Isso impede rodar a
sonda operacional somente de leitura no ambiente Stage, onde estão o banco e as
credenciais OAuth já provisionadas. Sem a sonda, a conta operadora, a rotação do
refresh token e o acesso a anúncios continuam sem comprovação; o gate de
integração corretamente mantém as consultas da aplicação respondendo 503.

## Comportamento esperado

Uma pessoa operadora dispara manualmente uma execução controlada no runner
hospedado do GitHub. O workflow usa um ambiente de segredos restrito ao branch
padrão `develop`, conecta ao banco do Stage e executa a sonda existente com
três IDs MLB distintos. O relatório sanitizado confirma renovação OAuth e os
cenários observados, sem gravar dados de anúncios. A execução nunca habilita a
integração automaticamente.

## Critérios de aceite

- [ ] **AC01** — A execução é manual no branch padrão `develop` (requisito de
  `workflow_dispatch`) e exige IDs MLB válidos para os três cenários antes de
  qualquer chamada externa.
- [ ] **AC02** — O job usa o ambiente GitHub `stage-validation`, restrito a
  `develop`, com permissões mínimas e ações fixadas por SHA.
- [ ] **AC03** — `DATABASE_URL` e credenciais OAuth só chegam ao passo que roda a
  sonda; nenhum segredo é ecoado, anexado como artefato ou gravado no repositório.
- [ ] **AC04** — A execução usa a sonda operacional existente. Ela faz apenas
  GETs de anúncios e, quando necessário, o POST OAuth de refresh que rotaciona
  e persiste os tokens no banco Stage; não altera produtos.
- [ ] **AC05** — O workflow não altera
  `MERCADOLIVRE_THIRD_PARTY_VALIDATED`; qualquer ativação continua sendo uma
  decisão explícita posterior à evidência operacional.
- [ ] **AC06** — O procedimento de configuração, execução e limpeza dos segredos
  está documentado; logs contêm apenas o relatório seguro já produzido pela
  sonda.

## Fora de escopo

- Upgrade pago do Render.
- Ativar automaticamente o gate ou realizar escrita em anúncios.
- Mudar a lógica OAuth, cliente do Mercado Livre ou contrato da sonda 0026.

## Perguntas em aberto

- O cenário `no_price` pode não existir entre anúncios válidos do Mercado Livre.
  A sonda deve registrar `requires_manual_action` quando um ID não corresponder;
  nunca deve inferir aprovação nem substituir preço ausente por zero.
