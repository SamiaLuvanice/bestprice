# Plano técnico — 0026

## Estado de partida

`origin/develop` já contém cliente oficial, gestor OAuth com tokens cifrados e
renovação protegida, provisionamento inicial e bloqueio por
`MERCADOLIVRE_THIRD_PARTY_VALIDATED=false`. Os testes de cliente e OAuth usam
transporte simulado. O README e os guias registram que ainda não houve validação
real. Esta entrega adiciona uma sonda operacional somente de leitura, e o
procedimento para executá-la; ela não substitui a autorização do operador nem
libera a integração.

## Contrato de autorização OAuth da conta operadora

- O comando `docker compose run --rm backend python -m app.marketplace.authorize_operator` gera uma URL
  oficial de autorização com `response_type=code`, `client_id`, redirect URI HTTPS
  fixa e `state` assinado com expiração curta. A URL não contém `client_secret`.
- `GET /api/marketplace/oauth/callback?code=…&state=…` valida o estado antes de
  qualquer chamada externa, troca o código em
  `https://api.mercadolibre.com/oauth/token` com o redirect URI configurado e
  persiste tokens cifrados pelo mecanismo existente. Em sucesso ou falha, responde
  `303` para `/api/marketplace/oauth/complete?status=authorized|failed`; detalhes
  externos e tokens nunca entram na resposta.
- `GET /api/marketplace/oauth/complete?status=…` retorna uma página simples sem
  credenciais nem recursos externos, com `Cache-Control: no-store` e
  `Referrer-Policy: no-referrer`.
- `MERCADOLIVRE_REDIRECT_URI` deve ser HTTPS e corresponder exatamente ao URI do
  DevCenter. Em Stage, usar
  `https://bestprice-stage-api.onrender.com/api/marketplace/oauth/callback`.
- O filtro da aplicação remove a query string do callback no logger
  `uvicorn.access`, para não registrar códigos de autorização ou `state`. Não foi
  verificado se a borda/proxy Render registra a URL original.

## Contrato da ferramenta operacional

- Executar em `backend/` com `uv run python -m app.marketplace.validate_live`.
- Exigir `MERCADOLIVRE_VALIDATION_PRICE_ITEM_ID`,
  `MERCADOLIVRE_VALIDATION_NO_PRICE_ITEM_ID` e
  `MERCADOLIVRE_VALIDATION_UNAVAILABLE_ITEM_ID`, cada um validado como ID `MLB`.
- Usar configuração OAuth e a conta operadora já provisionada, via o mesmo
  `OperatorTokenManager` e `MercadoLivreClient` usados pela aplicação.
- Fazer uma consulta por item (até dois GETs oficiais: item e preço; mais um POST
  OAuth se o token estiver no prazo de renovação); não criar/atualizar produtos,
  nem gravar tokens ou respostas em arquivo. A saída JSON sanitizada em stdout
  contém status, horário UTC, IDs, resultado OAuth, códigos de erro/ação manual,
  disponibilidade, moeda, contexto e presença/preço; não inclui token, título,
  URL ou mensagens internas. stderr é usado apenas para recusas de segurança.
  Códigos de saída: 0 se os três cenários e
  uma renovação OAuth forem confirmados; 1 para falha real da consulta/API ou
  validação inconclusiva após chamadas; 2 para recusa de segurança ou intervenção
  manual necessária antes das chamadas. Recusa por falta de
  `--confirm-live-requests` ou flag ativado usa mensagem segura em stderr;
  IDs inválidos/reutilizados e credenciais ausentes retornam JSON com
  `status: requires_manual_action` e códigos estáveis em `manual_actions`.
- Antes de qualquer HTTP, exigir `--confirm-live-requests`. Sem a opção, encerrar
  sem tráfego. Nunca alterar `MERCADOLIVRE_THIRD_PARTY_VALIDATED`.
- O JSON de uma execução inclui `observed_at` UTC, `oauth_refresh`, e cada anúncio
  como `passed`, `failed` ou `requires_manual_action`. Seleção que não corresponde
  ao cenário pede novo ID; token ainda válido pede agendar a rotação em janela
  apropriada. Exceções inesperadas são convertidas em códigos seguros, sem texto
  interno na saída.

## Camadas e arquivos

- `backend/app/marketplace/validate_live.py`: CLI operacional, validação de
  variáveis e IDs, integração com gestor OAuth/cliente oficial e relatório
  sanitizado.
- `backend/app/marketplace/oauth_routes.py` e `authorize_operator.py`: callback
  HTTPS e CLI de início do fluxo authorization-code da conta operadora.
- `backend/tests/test_marketplace_oauth_callback.py`: contrato do callback,
  validade de state, troca, persistência cifrada e sanitização de logs.
- `backend/tests/test_marketplace_live_validation.py`: cobertura de argumentos,
  configuração, cenários, sanitização e código de saída com dependências
  simuladas; nenhuma credencial/rede real.
- `specs/0026-validacao-operacional-mercado-livre/{spec,plan,tasks,verification}.md`:
  aceite e evidências honestas, incluindo critérios bloqueados por dependência
  operacional.
- `README.md`, `docs/apps/backend.md`, `docs/architecture.md` e
  `docs/apps/infraestrutura.md`: procedimento, variáveis e limites, sem segredos.

## Decisões e riscos

- O callback é público por exigência do redirect OAuth, mas só processa um código
  após validar `state` assinado, associado ao redirect URI e não expirado. A CLI
  local inicia a autorização; a API não expõe rotas para emitir URLs ou consultar
  credenciais. O segredo fica no servidor, tokens são cifrados no banco e a query
  OAuth é removida do access log.
- O fluxo de autorização grava tokens somente no banco do serviço cujo callback foi
  configurado. Em Stage, a URL pertence ao Render e a validação não liga o flag de
  integração. O deploy dessa rota ainda precisa ocorrer por promoção aprovada.
- Um 429 real não será provocado. Simulações verificam a recuperação do código;
  cadência oficial e um ciclo periódico real só podem ser confirmados com conta,
  anúncios permitidos e limites informados pelo Mercado Livre.
- A sonda não executa cadastro/atualização nem recupera dados de monitoramento;
  essas verificações exigem um banco isolado e execução operacional separada, que
  continua pendente até haver credenciais e autorização.
- Tokens e respostas brutas não entram no relatório. O token manager já cifra
  tokens em banco; a sonda usa o caminho de produção sem imprimi-los.
- A documentação oficial de publicação documenta HTTP 206 para leitura de item
  quando `X-Content-Missing` enumera `location`, `geolocation` ou
  `seller_address`. O cliente só aceita esse status em `/items/{id}` quando o
  cabeçalho contém exclusivamente esses campos e `_validate_item` encontra os
  campos obrigatórios. Respostas parciais de preço seguem inválidas.
- Anúncio sem preço ou indisponível pode não estar acessível à conta. A falha
  permanece evidência inconclusiva, não substitui o cenário requerido.
- A CLI consulta um caso por ID para confirmar normalização e acesso. Para provar
  cadastro, atualização e recuperação end-to-end, será necessário rodar a stack
  isolada após validação dos IDs, com a integração ainda controlada e cadência
  oficial conhecida; essa execução pode permanecer pendente sem ambiente e
  autorização apropriados.
