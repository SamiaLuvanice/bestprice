# Plano técnico — 0033

Issue [#184](https://github.com/SamiaLuvanice/bestprice/issues/184). Base:
`origin/develop` (`f364e7c`). Alteração limitada ao cliente oficial e à saída
JSON da sonda já existente.

## Contrato operacional

- O erro segue com o código público estável `integration_access_denied`.
- A sonda acrescenta `blocked_resource` somente quando o cliente associa o 403
  a um recurso conhecido: `item` ou `sale_price`.
- O relatório não recebe URL, caminho completo, status arbitrário, corpo,
  cabeçalhos, título, permalink nem detalhes de exceções upstream.
- Outros erros mantêm seu formato atual. Se a origem não for conhecida, não se
  preenche `blocked_resource`.

## Camadas e arquivos

- `backend/app/marketplace/client.py`: transportar metadado interno restrito de
  recurso junto a `IntegrationError`; nome fornecido por cada chamada fixa, sem
  inferência a partir de resposta ou texto dinâmico.
- `backend/app/marketplace/validate_live.py`: incluir somente a enumeração
  segura no relatório da sonda para `integration_access_denied`.
- `backend/tests/test_mercado_livre_client.py` e
  `backend/tests/test_marketplace_live_validation.py`: cobrir os dois recursos,
  mapeamento de erro e ausência de vazamento.
- `specs/0033-diagnostico-403-mercado-livre/verification.md` e onboarding
  afetado: evidências e comportamento de operação.

## Decisões e riscos

- Manter `resource` como dado interno tipado com valores literais e produzir a
  chave explícita `blocked_resource` no relatório; isso evita expor URL e evita
  criar novos códigos públicos para o mesmo 403.
- Não ler nem registrar corpo/resposta 403. O Mercado Livre pode retornar dados
  variáveis ou pessoais; eles não são necessários para esta distinção.
- A sonda continua dependendo de uma execução manual posterior no Stage para
  obter a evidência nova; a implementação local não resolve a política que causa
  o 403 nem habilita o gate.
