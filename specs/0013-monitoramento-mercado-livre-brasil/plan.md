# Plano técnico — 0013

## Estado de partida

`origin/develop` contém health FastAPI, uma tela de verificação React e PostgreSQL sem tabelas de domínio. A spec 0013 foi copiada para a worktree desta feature antes de alterações de código. A spec 0011 ainda não entregou autenticação executável. Credenciais e autorização do Mercado Livre para terceiros não foram fornecidas. A branch provisória `feature/0013-mercado-livre` foi renomeada em 09/10/2026 para `feature/0013-issue-34-monitoramento-mercado-livre`, após a criação da Issue #34.

## Contrato e identidade

A identidade compartilhada é o ID da publicação MLB e o contexto `mlb_marketplace_unit` em BRL. Não agrupar pelo título, catálogo ou modelo. URL do usuário é analisada localmente; o cliente HTTP só chama host oficial fixo com ID validado. Produção mantém o cadastro externo indisponível até validar uma aplicação autorizada, acesso a terceiros, preço de venda do contexto, disponibilidade, limites e finalidade de monitoramento. Uma credencial OAuth de conta operadora só pode ser usada no backend, com renovação protegida e sem vazamento em erros/logs.

O contrato interno segue a tabela e os DTOs da spec. `401 unauthenticated` é exclusivo da sessão BestPrice; erros 401/403 externos viram `503 integration_auth_required`/`integration_access_denied`. `409 already_tracked` inclui apenas ID do vínculo próprio. `404 resource_not_found` cobre recursos inexistentes ou alheios. Moedas/percentuais são strings decimais, instantes UTC com `Z`. Payloads recusam campos extras. `POST` novo 201, retomada 200, duplicado ativo 409; refresh válido 200, não localizado existente 200 com `lookup_status=not_found`. O plano deve ser revisado junto da implementação se o contrato mudar.

### Gestão durável da credencial operadora

Um único registro PostgreSQL guarda access token, refresh token e expiração da
conta operadora. Os tokens são cifrados com uma chave Fernet vinda somente do
ambiente (`MERCADOLIVRE_OAUTH_KEY`); Client ID e Client Secret também vêm do
ambiente. Um comando administrativo recebe os tokens iniciais sem argumentos
de linha de comando e os persiste cifrados. A obtenção da autorização inicial
e a verificação de finalidade/permissões são externas a esse comando.

Antes de cada consulta, API e worker obtêm um token válido pelo mesmo serviço.
Perto da expiração, o serviço bloqueia a linha com `SELECT FOR UPDATE`, confere
novamente a expiração e chama somente `POST https://api.mercadolibre.com/oauth/token`
com o refresh token no corpo form. Salva access token, novo refresh token e
expiração na mesma transação. Não repete automaticamente um refresh cujo
resultado seja ambíguo, pois o token anterior pode já ter sido consumido;
marca a credencial como bloqueada no banco e exige novo provisionamento/
reauthorização. Um 429 guarda a janela de `Retry-After` antes da próxima
tentativa. A trava evita duas renovações
simultâneas por API e worker. O modo real continua condicionado a
`MERCADOLIVRE_THIRD_PARTY_VALIDATED=true` e às evidências de AC-013.

### Ordem das decisões locais

O `POST` de monitoramento valida a URL e consulta o vínculo próprio sob a
trava da publicação antes de obter credenciais ou fazer HTTP externo. Assim,
URL inválida retorna 400, vínculo ativo 409 e retomada 200 mesmo quando a
integração está indisponível; cadastro que realmente precisa da fonte segue
503 seguro. O `POST` de refresh também verifica vínculo, janela de tentativa
e backoff antes de acessar a integração. A rota recebe uma fonte diferida,
enquanto o worker verifica configuração ao iniciar cada ciclo.

## Camadas e arquivos previstos

- `backend/app/marketplace/url.py`: parser puro para a matriz de URLs da spec, sem HTTP.
- `backend/app/marketplace/client.py`: cliente HTTPX dedicado para item e preço documentados, timeout, OAuth, 429 e erro externo; nenhuma leitura de URL arbitrária. Somente endpoints oficiais verificados.
- `backend/app/products/{models,schemas,repository,service,routes}.py`: identidade, atualização transacional, métricas, histórico, vínculos, alertas, notificações e contrato HTTP. Dependências por injeção.
- `backend/app/db.py`, `backend/alembic/` e configuração Alembic: sessões/conexões, schema e migrações explícitas. Não usar `create_all` em produção.
- `backend/app/monitoring/worker.py`: loop em processo separado, com vencimento persistido, trava por publicação, concorrência limitada e backoff. API e worker usam a mesma regra de atualização.
- `frontend/src/features/dashboard/` e módulo de API tipado: formulário, listas, resumo, histórico, alertas, notificações, estados e validação de respostas `unknown`.
- `docker-compose.yml`, `.env.example`, dependências e documentação: somente variáveis realmente usadas. Segredos apenas por ambiente.

## Persistência

`users` e sessões dependem da implementação de 0011. Caso não existam ao começar os módulos da 0013, criar somente a infraestrutura necessária para isolamento real, com autenticação segura e um caminho operacional de provisionamento documentado; não usar ID de usuário constante, cabeçalho confiado do navegador ou login fictício.

`products` tem ID interno, `external_id` único para MLB, título, imagem/URL, preço atual nullable, moeda/contexto, status de localização/tentativa, disponibilidade observada e última confirmada, instantes de tentativa/sucesso/observação de preço/mudança, `next_check_at`, `retry_after_at` e timestamps. `tracked_products` guarda usuário, produto, ativo e `active_since`, único por par. `price_history` guarda somente primeiro preço válido e mudanças, nunca preço zero inferido. Eventos duráveis representam mudanças de preço e disponibilidade confirmada. `price_alerts` guarda alvo, habilitação, revisão, estado do episódio e unicidade por vínculo; `notifications` guarda instantâneo do disparo e `read_at` com restrição por usuário. Dinheiro NUMERIC(18,2), cálculos Decimal, instantes TIMESTAMPTZ UTC.

Antes de migrar ambiente existente, inspecionar dados/tabelas. Se houver dados Amazon fora do checkout, criar migração de preservação com origem explícita e plano de backup/reversão, sem reatribuir ASIN a MLB. No checkout atual a migration será inicial para domínio. Downgrade só em banco descartável.

## Consistência e agendamento

O cadastro e a atualização compartilham a mesma coordenação por ID MLB; unicidade do banco é garantia final. A transação inclui produto, primeiro preço, vínculo e mudanças; consulta externa não mantém transação aberta desnecessariamente. Retentativas após conflitos recarregam estado persistido. Produto sem preço pode ser acompanhado com estado `missing_price`; falha externa no primeiro cadastro não cria vínculo.

O worker consulta apenas produtos com vínculo ativo e `next_check_at` vencido. Uma publicação é consultada uma vez por ciclo, também com vários workers. Falhas atualizam tentativa e backoff, mantendo últimos dados; 429 respeita `Retry-After` quando presente. `not_found` persiste e retenta após pelo menos 24h. Atualização manual respeita cooldown e limites compartilhados. Métricas e alertas só usam amostras comparáveis e válidas do contexto fixo.

## Ordem de execução e evidência

1. Parser e testes Red/Green com formatos aceitos/rejeitados.
2. Cliente oficial com testes de resposta, ausência de preço, auth, 429 e timeout. Sem afirmar integração real a partir de mocks.
3. Schema/migração e persistência com teste PostgreSQL real de unicidade/transação/concorrência.
4. Contrato HTTP autenticado e serviços de cadastro, listagem, histórico, alertas, notificações e dashboard.
5. Worker com relógio injetado, concorrência e recuperação.
6. Frontend com testes de fluxo visível e estados de erro.
7. Compose, integração ponta a ponta, lint/testes/build e revisão do diff.
8. Sincronização de onboarding após último ajuste de código; handoff via PR quando GitHub disponível.

Registrar comandos/resultados reais em `verification.md`. AC-013 exige credenciais reais e autorização explícita; enquanto não for demonstrado, AC-014 define estado operacional honesto. A spec permanece rascunho até critérios comprovados, revisão e integração em `develop`.

## Decisões caras e riscos

- Contexto de preço compartilhado pode não ser oferecido pela API para publicações de terceiros; bloquear fluxo dependente se não houver autorização ou dado confiável.
- Login BestPrice ainda depende de 0011; sem ele não liberar rotas por usuário.
- Condição de preço personalizada por conta/região não alimenta produto compartilhado.
- Não introduzir scraping, credenciais no navegador, catálogo fake ou geração automática de preço.
