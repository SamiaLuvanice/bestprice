# Verificação documental — 0013

Data: 2026-10-08. Escopo: ajustes nos seis achados da revisão da spec;
nenhuma implementação da aplicação faz parte desta entrega.

## Orquestração

- Skill aplicada: `.agents/skills/agent-orchestration/SKILL.md`.
- Agente `adjust_spec`, seguindo `.agents/agents/product-owner.md`, responsável
  exclusivamente por corrigir `spec.md`.
- Agente independente `review_adjustments`, seguindo
  `.agents/agents/spec-reviewer.md`, revisou o documento corrigido e concluiu
  **sem achados acionáveis nos seis ajustes**. Não alterou arquivos.
- O coordenador registra evidências neste arquivo e acrescenta o andamento em
  `docs/PROGRESS.md`, preservando as entradas e mudanças locais anteriores.

## Achados corrigidos e revisados

1. Contexto de preço compartilhado, identidade da publicação e limites da
   autorização OAuth definidos sem presumir acesso a anúncios de terceiros.
2. Alertas incluídos no escopo, com canal, criação/edição, disparo, repetição e
   reativação especificados.
3. Preço ausente, erro, anúncio não localizado e recuperação possuem regras de
   persistência, apresentação e retentativa.
4. Matriz de URLs aceitas e rejeitadas diferencia publicação, catálogo e links
   curtos, sem consultas arbitrárias a destinos fornecidos pelo usuário.
5. Métricas e oportunidades têm janela, base de comparação e casos sem dados.
6. Contrato mínimo inclui respostas, duplicação, histórico, alertas e notificações;
   falhas das credenciais externas não encerram a sessão BestPrice.

As seis correções estão refletidas nas seções de comportamento, contrato e nos
critérios AC-001–022. A revisão independente conferiu a coerência entre esses
trechos, o isolamento por usuário, a deduplicação dos alertas e a manutenção do
bloqueio de liberação sem validação externa. É aprovação dos ajustes documentais,
não aprovação de PR nem demonstração dos critérios funcionais.

## Checks documentais executados

- PowerShell leu diretamente os arquivos, inclusive não rastreados: 22 critérios
  de aceite únicos, 14 requisitos funcionais únicos, sem espaços finais ou
  caracteres de substituição Unicode em `spec.md` e `verification.md`.
- O agente executou `git diff --check -- specs/0013-monitoramento-mercado-livre-brasil/spec.md`
  com saída 0. Como a spec está não rastreada, esse comando isolado não comprova
  sua formatação; a leitura direta acima cobre esse limite.
- Após registrar a revisão e atualizar o progresso, `git diff --check` passou
  (somente aviso LF/CRLF em `docs/PROGRESS.md`). A leitura direta dos três documentos
  passou; a entrada 0013 no progresso é única e aponta para evidência existente.

## Evidências e limites

- `git show-ref --verify refs/remotes/origin/develop`: referência local presente,
  apontando para `210fac749c69e7d6b4e8cfa574e962e3b897678d` na inspeção inicial.
- `git worktree list`: checkout principal em `develop` e worktree da spec 0012
  presentes. Esta correção documental da spec 0013 ocorre no checkout principal,
  sem edição de código, commit ou alteração da worktree de outra tarefa.
- Spec 0013 não possui `plan.md` ou `tasks.md`; a elaboração desses artefatos é
  posterior ao refinamento. A Issue permanece pendente conforme a falha de
  autenticação GitHub registrada na criação da spec; não houve nova tentativa.
- Testes, lint, build, migrations e integração externa não foram executados nesta
  etapa documental. Critérios funcionais não estão demonstrados por esta revisão.
- Autenticação real de usuários depende de 0011. Acesso oficial a publicações de
  terceiros, credenciais e cotas continuam pendentes de validação externa.
- Status permanece `rascunho`. Não houve PR, merge, implantação ou sincronização
  com Project. A etapa `doc-sync-onboarding` aplica-se após alterações de código;
  não foi acionada nesta correção documental.

## Implementação em andamento na worktree da feature

Data: 2026-10-08. Branch provisória `feature/0013-mercado-livre`, baseada em
`origin/develop`, worktree `.worktrees/feature-0013-mercado-livre`. O nome é
provisório porque `gh auth status` retornou token inválido; Issue 0013 ainda não
tem número. A worktree 0012 e as alterações do checkout principal foram preservadas.

- `plan.md` e `tasks.md` criados antes de editar código; contrato e ordem de
  implementação registrados.
- Parser MLB: 13 casos Red por `NotImplementedError`, depois 13 passaram.
  `test_mercado_livre_url.py` valida formato aceito/rejeitado sem resolução HTTP.
- Cliente oficial: 6 casos Red por `NotImplementedError`, depois passaram com
  HTTPX MockTransport. São dublês de teste; não demonstram acesso real.
- Unicidade e dinheiro: teste Red mostrou falta da constraint; depois passou em
  SQLite. Alembic gerou `d0d0756a0096_initial_domain.py`, aplicado com sucesso
  a PostgreSQL 17 isolado do projeto Compose `bestprice0013`. Um teste de
  integração PostgreSQL confirmou DECIMAL `129.90` e rejeição de duplicata.
- Sessão BestPrice: teste HTTP Red 404, depois passou para login, senha errada,
  cookie HttpOnly e leitura da sessão. Sem tela de login nem provisionamento de
  conta nesta etapa.
- Cadastro e vínculo: teste HTTP Red 404, depois passou para primeiro preço,
  reuso por duas pessoas, duplicado 409, isolamento de detalhe, interrupção e
  retomada.
- Concorrência: teste PostgreSQL Red mostrou `UniqueViolation` por duas
  inserções simultâneas. Depois da trava por ID, passou com uma consulta externa,
  dois vínculos e um preço inicial.
- Refresh, histórico e dashboard: testes HTTP Red 404, depois passaram para
  mudança de preço, preservação após 429, histórico e oportunidade recente.
- `pytest -q -p no:cacheprovider --tb=short` com `TEST_DATABASE_URL` apontando
  apenas ao PostgreSQL isolado: **30 passed, 1 warning** (aviso depreciação
  Starlette/TestClient). Nenhum teste pulado nessa execução.
- `ruff check .` detectou 11 problemas corrigíveis na primeira rodada; após
  `ruff check --fix .`, retornou **All checks passed**. O comando `git diff
  --check` passou, com avisos de conversão LF/CRLF em arquivos rastreados.

Ainda faltam alertas/notificações, worker periódico, cobertura integral de estados
e concorrência, paginação/contratos completos, frontend, configuração OAuth com
renovação segura, execução ponta a ponta e validação com credenciais autorizadas
para anúncios de terceiros. `MERCADOLIVRE_THIRD_PARTY_VALIDATED=true` é exigido
para habilitar o cliente real; nenhum teste real externo foi executado. Acesso
autorizado, frequência permitida e preço compartilhável seguem não demonstrados.
Não há PR, revisão de código nem sincronização final de onboarding; manter a spec
em `rascunho` e as tarefas restantes abertas.

## Continuação da implementação em 08/10/2026

- Alertas e notificações: teste HTTP falhou inicialmente por rota ausente; após
  implementação passou para disparo imediato/episódios, edição, pausa, leitura
  idempotente, exclusão e isolamento por usuário. O dashboard agora calcula
  `active_alert_count` e `target_reached_count` a partir dos vínculos próprios.
- Cadência: teste Red mostrou que atualização manual permitia nova consulta 60
  segundos depois de `not_found`; Green exige a janela persistida de pelo menos
  24 horas. O worker seleciona apenas publicações vencidas com vínculo ativo,
  usa a mesma atualização transacional da API e preserva preço em 429. O teste
  do worker passou, mas concorrência entre **múltiplos processos do worker**
  ainda não foi exercitada ponta a ponta.
- Contrato: o teste Red de corpo com campo extra mostrou o `detail` padrão do
  FastAPI; o handler agora devolve `error.code=validation_error` com campos
  seguros. Listagens de vínculos, histórico e notificações aceitam `limit` e
  cursor; o histórico aceita intervalo UTC. Os testes de paginação passaram em
  SQLite; falta conferir os mesmos cursores no PostgreSQL e paginação da UI
  para histórico/notificações.
- Compose: imagem do backend inclui Alembic; o serviço backend executa migration
  antes de subir, e o worker aguarda seu health check. `docker compose config
  --quiet` passou com senha **de teste** local. O worker fica inativo enquanto a
  integração real não estiver habilitada. Imagem/stack completa ainda não foi
  construída ou executada nesta continuação.
- Frontend: teste Red confirmou que a tela antiga não atendia à proposta. O
  React agora exibe hero, login, dashboard real, formulário de URL, detalhe,
  histórico, alerta, notificações, atualização manual, interrupção e paginação
  de monitoramentos. O cliente valida o formato básico das respostas recebidas
  como `unknown`; a interface ainda precisa de cobertura mais ampla de erros,
  paginação de histórico/notificações e verificação visual ponta a ponta.
- Gates finais desta continuação: `ruff check .` passou; `pytest -q -p
  no:cacheprovider --tb=short` com `TEST_DATABASE_URL` para PostgreSQL 17
  isolado: **32 passed, 1 warning**. `npm run lint`, `npm test -- --run`:
  **3 passed**, e `npm run build` passaram na worktree. Vitest exigiu execução
  fora do sandbox por `spawn EPERM` no Windows. O aviso pytest é depreciação do
  adaptador Starlette/TestClient.
- Reconsulta oficial em 08/10/2026: a [documentação de autenticação](https://developers.mercadolivre.com.br/autenticacao-e-autorizacao)
  descreve access token com duração de cerca de 6 horas e refresh token de uso
  único, substituído em cada renovação. A [API de preços](https://developers.mercadolivre.com.br/pt_br/produto-consulta-de-usuarios/api-de-precos)
  documenta `sale_price` e a descontinuação de campos de preço de `/items`.
  O token estático atual ainda **não** é uma solução operacional durável; rotação
  segura e armazenamento persistente continuam pendentes. Essas páginas não
  comprovam a permissão da aplicação BestPrice para monitorar anúncios de
  terceiros. Nenhuma consulta real autenticada foi realizada.

Permanecem abertos OAuth durável, provisionamento seguro de usuário, testes de
estados/concorrência e integração ponta a ponta, documentação operacional,
revisão independente e PR. A spec não está implementada nem liberada.

## Continuação em 09/10/2026 — paginação da interface

- T10: teste de interface acrescentado para páginas seguintes de histórico de
  preços e notificações. Red: 1 de 4 testes falhou porque não havia botão
  “Carregar mais notificações”. Green: `npm test -- --run src/App.test.tsx`
  passou com **4 testes** após ligar os cursores ao cliente e à tela.
- `npm run lint` passou. `npm run build` passou, com 17 módulos transformados.
  Vitest e Vite falharam inicialmente no sandbox Windows com `spawn EPERM`;
  ambos passaram ao repetir fora dele. `git diff --check` passou, com avisos
  LF/CRLF nos arquivos rastreados já modificados.
- O teste usa respostas simuladas da API. Ainda faltam verificação visual,
  paginação integrada com PostgreSQL e os demais critérios de T10–T14.

## Sincronização de onboarding após a alteração de código

O agente `doc-sync-onboarding` conferiu o diff e o código da worktree após os
gates da continuação. Atualizou `README.md`, `docs/index.md`,
`docs/architecture.md`, `docs/database.md`, `docs/apps/backend.md`,
`docs/apps/frontend.md`, `docs/apps/infraestrutura.md` e `docs/PROGRESS.md`
para refletir o fluxo MLB, migration, worker, sessão e paginação da interface.
`AGENTS.md` e `CLAUDE.md` foram conferidos; as instruções do harness e suas
referências não mudaram. `git diff --check -- README.md docs` retornou código
zero, com avisos LF/CRLF em arquivos rastreados. Nenhum teste da aplicação foi
executado nesta etapa documental e nenhum código foi alterado.

## Continuação em 09/10/2026 — PostgreSQL e Compose isolados

- Foi acrescentado em `test_tracking_concurrency_integration.py` um teste com
  duas sessões PostgreSQL que iniciam o ciclo do worker ao mesmo tempo.
  `uv run pytest -q tests/test_tracking_concurrency_integration.py -p
  no:cacheprovider --tb=short`, com `TEST_DATABASE_URL` apontando ao banco
  isolado, passou: **2 passed**. O novo caso observou uma única consulta na
  atualização, uma mudança de preço e dois registros históricos no total
  (preço inicial e mudança). Sessões e conexões distintas exercitam a trava
  do banco; processos de sistema operacional distintos ainda não foram testados.
- `docker compose -p bestprice0013verify up -d --build` construiu e iniciou
  banco, backend, frontend e worker. PostgreSQL e backend ficaram saudáveis.
  `SELECT version_num FROM alembic_version` retornou `d0d0756a0096`.
  Logs do worker mostraram “Monitoramento aguardando integração autorizada”.
- `curl -i` no backend retornou `GET /api/health` **200** com
  `{"status":"ok","database":"ok"}`. A SPA pelo Nginx retornou **200**
  com o HTML e assets compilados; `/api/auth/me` sem sessão pelo proxy
  retornou **401** com `unauthenticated`.
- Em uma conta fictícia criada apenas nesse banco isolado, o fluxo HTTP pelo
  proxy retornou login **200**, dashboard vazio **200**, cadastro de anúncio
  sintético **503** `integration_not_configured` e `/api/auth/me` ainda **200**
  na mesma sessão. Isso demonstra o bloqueio e a preservação da sessão,
  sem alegar consulta real à fonte.
- A primeira execução da suíte backend usou uma URL `postgresql+psycopg://`
  incompatível com o teste de health baseado em psycopg: **2 failed,
  32 passed**. Repetida com `TEST_DATABASE_URL=postgresql://...`, a suíte
  completa passou: **34 passed, 1 warning** (depreciação Starlette/TestClient).
  `uv run ruff check .` passou. No frontend, `npm run lint`, `npm test --
  --run` (**4 passed**) e `npm run build` (17 módulos) passaram.
- Ainda não houve inspeção visual da SPA em navegador, chamadas reais
  autorizadas ao Mercado Livre, renovação OAuth durável, teste com dois
  processos worker, revisão independente ou PR. O Compose de verificação
  permanece isolado sob o projeto `bestprice0013verify`.

## Continuação OAuth em 09/10/2026

- As páginas oficiais [gestão de tokens](https://developers.mercadolivre.com.br/pt_br/publicacao-de-produtos/gestao-de-identidades-e-acessos-oauth-e-tokens),
  [guia OAuth](https://developers.mercadolivre.com.br/devcenter/desenvolvimento-in-house)
  e [autenticação](https://developers.mercadolivre.com.br/pt_br/realizacao-de-testes/autenticacao-e-autorizacao)
  foram consultadas nesta etapa. Descrevem expiração do access token, refresh
  token substituído a cada uso e proteção das credenciais em repouso. Não
  comprovam acesso da aplicação BestPrice a anúncios de terceiros.
- `uv add 'cryptography>=46,<48'` atualizou dependência e lock. Tokens da
  conta operadora passaram a ser cifrados no PostgreSQL com chave do ambiente;
  o cliente oficial recebe um token válido do serviço compartilhado pela API
  e pelo worker. O provisionamento inicial usa prompt administrativo, sem
  token em argumento. O flag de validação de terceiros continua obrigatório.
- TDD: o primeiro teste falhou por `NotImplementedError` em provisionamento e
  passou após cifragem/recuperação. O teste de renovação falhou pelo mesmo
  motivo e passou após refresh com persistência dos dois tokens. A dependência
  API falhou com `integration_not_configured` antes de usar o token do banco e
  passou após a integração. O caso de 429 falhou por retornar
  `integration_unavailable`; após correção, preserva token e `Retry-After`.
  Uma falha de timeout antes permitia segunda tentativa com refresh token
  possivelmente consumido; agora marca o registro como bloqueado até novo
  provisionamento. Testes com respostas HTTP simuladas não provam OAuth real.
- `uv run pytest -q tests/test_operator_oauth.py
  tests/test_operator_oauth_integration.py -p no:cacheprovider --tb=short`
  com PostgreSQL isolado: **7 passed**. Duas sessões simultâneas fizeram
  somente um POST de refresh; ambas receberam o novo access token. O teste
  de integração representa processos diferentes pelo bloqueio da linha no
  banco, mas usa threads no mesmo processo de teste.
- Gate final backend com `TEST_DATABASE_URL=postgresql://...`:
  `uv run pytest -q -p no:cacheprovider --tb=short` **41 passed,
  1 warning** (depreciação Starlette/TestClient); `uv run ruff check .`
  **All checks passed**. `docker compose -p bestprice0013verify config
  --quiet` passou. `docker compose -p bestprice0013verify up -d --build`
  reconstruiu backend/worker com `cryptography`, aplicou as migrations e
  iniciou a stack; `alembic_version` retornou `20261009safe`, health 200
  e worker continuou aguardando integração autorizada.
- Faltam credenciais reais, autorização inicial da conta operadora,
  validação da finalidade/acesso a terceiros, teste de renovação com a API
  oficial e revisão independente. Nenhum token real foi configurado ou
  registrado. A spec permanece `rascunho`.

## Sincronização de onboarding após a verificação PostgreSQL/Compose

O agente `.agents/agents/doc-sync-onboarding.md` conferiu o diff, o novo teste
de duas sessões, o worker, a trava PostgreSQL, `docker-compose.yml`, `README.md`,
`AGENTS.md`, `CLAUDE.md` e os guias em `docs/`. Atualizou
`docs/apps/backend.md` e `docs/database.md` para registrar o alcance do teste
de concorrência; `docs/apps/infraestrutura.md` para registrar a execução real
da stack isolada; e `docs/PROGRESS.md` com os gates e limites da continuação.
`README.md`, `AGENTS.md`, `CLAUDE.md` e os demais guias não exigiram edição:
suas instruções e descrições continuam coerentes com o código e a evidência.

`git diff --check -- README.md docs` retornou código zero, com avisos de
conversão LF/CRLF nos arquivos rastreados. O diff dos documentos foi revisado;
esta etapa não alterou código nem executou testes da aplicação. A evidência
de duas sessões não demonstra execução de dois processos worker distintos.

## Sincronização de onboarding após OAuth em 09/10/2026

O agente `.agents/agents/doc-sync-onboarding.md` conferiu o diff e o código
OAuth, as duas migrations, Compose, `.env.example`, `README.md`,
`AGENTS.md`, `CLAUDE.md` e os guias em `docs/`. Atualizou `README.md`,
`docs/architecture.md`, `docs/database.md`, `docs/apps/backend.md`,
`docs/apps/infraestrutura.md` e `docs/PROGRESS.md`: substituiu referências
ao token estático pela configuração OAuth, provisionamento por terminal,
armazenamento cifrado, refresh serializado e suas condições de bloqueio.
`docs/index.md`, `docs/apps/frontend.md`, `docs/product-context.md`,
`AGENTS.md` e `CLAUDE.md` não exigiram edição; não houve alteração do
fluxo de onboarding do harness nem do código frontend nesta etapa.

O código e os testes simulados demonstram a lógica local, mas nenhuma
credencial real foi configurada. A autorização inicial, a renovação com a API
oficial e o acesso a anúncios de terceiros continuam sem prova. Esta etapa
documental não alterou código nem executou testes da aplicação.
`git diff --check -- README.md docs specs/0013-monitoramento-mercado-livre-brasil/verification.md`
retornou código zero, com avisos LF/CRLF nos arquivos rastreados; a busca por
`MERCADOLIVRE_ACCESS_TOKEN`, “token estático” e “renovação OAuth ainda” em
`README.md` e `docs/` não encontrou referências desatualizadas.

## Continuação em 09/10/2026 — contrato antes da integração

- Observação inicial: sem `MERCADOLIVRE_THIRD_PARTY_VALIDATED=true`, a
  dependência FastAPI inicializava o cliente externo antes de validar a URL
  ou consultar vínculo já persistido. O teste HTTP novo falhou como esperado:
  URL de domínio alheio retornou **503**, quando a spec exige **400**.
- A fonte da rota agora é diferida até `get_listing`. A decisão local sob a
  trava ocorre primeiro; o worker continua verificando a configuração ao
  iniciar o ciclo. `uv run pytest -q tests/test_tracking_http.py
  tests/test_operator_oauth.py -p no:cacheprovider --tb=short` passou com
  **8 testes**. Com a integração desligada, o contrato testado é: URL inválida
  400 `invalid_url`, vínculo ativo 409 `already_tracked` com ID próprio,
  retomada 200, cadastro que requer consulta 503 `integration_not_configured`.
  O refresh em janela de cooldown retorna 429 `refresh_not_due` antes da fonte.
- A primeira suíte completa em banco reutilizado falhou no teste de worker:
  `sorted(counts)` foi `[0, 7]` em vez de `[0, 1]`, porque sete publicações
  antigas também estavam vencidas. O teste passou a priorizar o anúncio
  criado pelo próprio caso e usar `limit=1`. Repetido contra o mesmo banco,
  `uv run pytest -q -p no:cacheprovider --tb=short` passou com **42 testes,
  1 warning**; a repetição focada de concorrência passou com **2 testes**.
  `uv run ruff check .` e `git diff --check` passaram (este último apenas com
  avisos LF/CRLF nos arquivos rastreados).
- `docker compose -p bestprice0013verify up -d --build` reconstruiu e iniciou
  a stack isolada. Pelo proxy Nginx, a conta fictícia retornou login 200,
  URL inválida 400 `invalid_url` e anúncio novo 503
  `integration_not_configured`. Nenhuma consulta real à fonte foi feita.
- O diff desta mudança foi revisado quanto a arquitetura, erros seguros e
  ordem das decisões. A API continua a impor autorização por usuário; a
  fonte diferida só é chamada na consulta que realmente precisa dela.
  Regra generalizável registrada em `docs/LEARNINGS.md`.

## Sincronização de onboarding após a correção da ordem HTTP

O agente `.agents/agents/doc-sync-onboarding.md` conferiu o diff, a implementação
das rotas, serviço e worker, os testes HTTP, `README.md`, `AGENTS.md`,
`CLAUDE.md` e os guias em `docs/`. Atualizou `README.md`,
`docs/architecture.md`, `docs/apps/backend.md` e `docs/apps/frontend.md` para
descrever que URL inválida, duplicação, retomada e cooldown são resolvidos antes
de construir o cliente externo. Atualizou `docs/apps/infraestrutura.md` com o
resultado recente do proxy e `docs/PROGRESS.md` de 41 para 42 testes backend.
`AGENTS.md`, `CLAUDE.md`, `docs/index.md`, `docs/database.md`,
`docs/product-context.md` e os demais guias não exigiram edição: a mudança
não alterou instruções do harness, esquema ou catálogo. `git diff --check --
README.md docs specs/0013-monitoramento-mercado-livre-brasil/verification.md`
retornou código zero, com avisos de conversão LF/CRLF em arquivos rastreados.
Esta etapa documental não alterou código nem executou testes da aplicação;
os resultados dos gates e do proxy constam na seção anterior.

## Cadência, concorrência e jitter — 09/10/2026

- Um teste novo começou vermelho: com `MONITOR_CHECK_INTERVAL_SECONDS=7200`,
  o produto ainda recebia intervalo de uma hora. A configuração validada
  passou a controlar a próxima consulta; `MONITOR_FRESHNESS_SECONDS` controla
  reuso de preço e `stale`.
- O ciclo aceita lote configurado e usa até `MONITOR_MAX_CONCURRENCY` sessões
  independentes para publicações distintas. O teste PostgreSQL observou pico
  de duas consultas simultâneas com limite 2. O relógio do ciclo é repassado
  ao refresh; teste com instante fixo confirmou tentativa, preservação da
  observação de preço e próximo vencimento com jitter de 20%.
- `MONITOR_POLL_INTERVAL_SECONDS` controla a pausa entre ciclos. Todos os
  parâmetros têm limites numéricos validados; `.env.example` e Compose os
  expõem a backend e worker. Ainda não há cadência escolhida a partir de
  limite oficial validado, nem teste de processos worker distintos.
- `uv run pytest -q -p no:cacheprovider --tb=short` com PostgreSQL isolado:
  **45 passed, 1 warning**. `uv run ruff check .` e
  `docker compose config --quiet` passaram. Não houve consulta externa real.

## Sincronização de onboarding após configuração do worker

O agente `.agents/agents/doc-sync-onboarding.md` conferiu o código de configuração,
worker e refresh, `.env.example`, Compose, testes e os guias de onboarding.
Atualizou `README.md`, `docs/architecture.md`, `docs/apps/backend.md` e
`docs/apps/infraestrutura.md` para descrever padrões, faixas aceitas,
concorrência com sessões independentes, frescor, backoff e limites da integração.
Atualizou `docs/PROGRESS.md` para refletir os 45 testes backend e a concorrência
verificada. `AGENTS.md`, `CLAUDE.md`, `docs/index.md`, `docs/database.md`,
`docs/apps/frontend.md` e `docs/product-context.md` foram conferidos e não
exigiram alteração: a mudança não afetou harness, catálogo, esquema, interface
nem a visão do produto. `git diff --check -- README.md docs` retornou código
zero, com avisos de conversão LF/CRLF. Esta etapa não alterou código nem
reexecutou testes da aplicação; os resultados pertencem à seção anterior.

## Alerta com janela configurável — 09/10/2026

- O teste HTTP novo começou vermelho: com `MONITOR_FRESHNESS_SECONDS=600`,
  preço observado 11 minutos antes retornava condição `target_reached`
  em vez de `unknown`. A regra ainda usava uma hora fixa e podia criar
  notificação a partir de preço mostrado como `stale`.
- `alert_response` e `evaluate_alerts` agora usam a janela configurada. O
  teste confirma ausência de notificação no estado stale e um disparo após
  nova consulta válida. `uv run pytest tests/test_alert_http.py -q
  -p no:cacheprovider --tb=short`: **2 passed, 1 warning**.
- `TEST_DATABASE_URL` apontando ao PostgreSQL isolado, `uv run pytest -q
  -p no:cacheprovider --tb=short`: **46 passed, 1 warning**. `uv run ruff
  check .`: **All checks passed!**. Não houve consulta real à fonte.

## Sincronização de onboarding após correção do alerta

O agente `.agents/agents/doc-sync-onboarding.md` conferiu
`backend/app/products/alerts.py`, `backend/tests/test_alert_http.py`,
`AGENTS.md`, `CLAUDE.md` e os guias afetados. Atualizou
`docs/apps/backend.md` e `docs/architecture.md` para explicitar que a mesma
janela configurada governa `stale`, condição do alerta e criação da notificação.
Atualizou `docs/PROGRESS.md` com os 46 testes backend informados acima.
`docs/apps/frontend.md`, `docs/database.md`, `docs/index.md` e
`docs/product-context.md` foram conferidos e não exigiram mudança nesta
correção: a interface, o esquema, o catálogo e a visão do produto não mudaram.
`git diff --check -- docs/PROGRESS.md docs/architecture.md
docs/apps/backend.md` retornou código zero, com avisos LF/CRLF. Esta
sincronização não alterou código nem reexecutou testes da aplicação.

## Métricas e ordem das oportunidades — 09/10/2026

- Teste novo com relógio fixo começou vermelho: duas quedas percentuais iguais
  apareciam em ordem de vínculo (`Produto 2`, `Produto 1`), embora a mudança
  mais recente fosse a de `Produto 1`. O dashboard passou a desempatar por
  instante de mudança e ID do produto, normalizando o fuso ao comparar com
  `active_since`.
- Outro teste confirmou histórico `100.00 → 80.00 → 90.00`, atual 90,
  anterior 80, mínimo 80, máximo 100, diferença 10 e variação 12,50%,
  mesmo após pedir a primeira página do histórico com limite 1.
- `uv run pytest tests/test_dashboard_metrics.py -q -p no:cacheprovider
  --tb=short`: **2 passed**. Suíte completa com `TEST_DATABASE_URL` do
  PostgreSQL isolado: **48 passed, 1 warning**. `uv run ruff check .`:
  **All checks passed!**. A integração externa permanece desativada.

## Sincronização de onboarding após correção das métricas

O agente `.agents/agents/doc-sync-onboarding.md` conferiu a ordenação em
`backend/app/products/routes.py`, os testes em
`backend/tests/test_dashboard_metrics.py`, a UI e a documentação existente.
Atualizou `docs/apps/backend.md` com os critérios das oportunidades e a
independência dos extremos em relação à paginação; `docs/apps/frontend.md`
com a ordem apresentada e os extremos do detalhe; e `docs/PROGRESS.md` com
os 48 testes backend e o avanço de AC-020. `AGENTS.md`, `CLAUDE.md`,
`docs/index.md`, `docs/architecture.md`, `docs/database.md` e
`docs/product-context.md` não exigiram mudança: a correção não alterou
instruções, catálogo, arquitetura, esquema ou visão do produto. Esta etapa
não alterou código nem reexecutou testes da aplicação.

## Ciclo de vida do produto e falha OAuth — 09/10/2026

- Teste com relógio fixo começou vermelho: após `not_found` e falha transitória,
  `last_attempt_status` ficava `unavailable` em vez de `temporary_error`.
  O mesmo fluxo reagendava em cerca de uma hora, embora o anúncio permanecesse
  `not_found`. Corrigidos o estado e a janela mínima de 24 horas; o teste
  confirmou preço/histórico preservados, recuperação com preço igual sem novo
  registro e mudança posterior registrada no instante observado.
- Outro teste controlado confirmou cadastro inicial sem preço e sem histórico,
  primeira amostra válida sem mudança, preço igual sem nova linha, leitura
  válida sem preço avançando apenas sucesso de item e falha avançando apenas
  tentativa. Erro inicial não deixou produto parcial.
- Teste HTTP começou vermelho: falha OAuth antes do HTTP do anúncio retornava
  503, mas `last_attempt_status` ainda era `ok`. O cliente diferido agora
  repassa a falha ao serviço como erro de integração; o teste confirmou
  `auth_required` persistido, preço anterior preservado e 429 com cabeçalho
  `Retry-After` preservado. Decisões locais de URL e vínculo continuam antes
  da fonte, confirmadas pelo teste de regressão existente.
- Suíte completa com `TEST_DATABASE_URL` do PostgreSQL isolado:
  `uv run pytest -q -p no:cacheprovider --tb=short` → **51 passed,
  1 warning**. `uv run ruff check .` → **All checks passed!**. Nenhuma
  consulta real ao Mercado Livre foi feita.

## Sincronização de onboarding após ciclo de vida e falha OAuth

O agente `.agents/agents/doc-sync-onboarding.md` conferiu o serviço de
produtos, o cliente diferido, os testes de ciclo de vida e refresh HTTP,
`docs/LEARNINGS.md`, `AGENTS.md`, `CLAUDE.md` e os guias em `docs/`. Atualizou
`docs/apps/backend.md` e `docs/architecture.md` para documentar a tentativa
persistida quando o token OAuth falha e a janela mínima após `not_found`;
atualizou `docs/PROGRESS.md` com a evidência de **51 testes backend** relatada
acima. `README.md`, `docs/index.md`, `docs/database.md`,
`docs/apps/frontend.md`, `docs/apps/infraestrutura.md`,
`docs/product-context.md`, `AGENTS.md` e `CLAUDE.md` não exigiram alteração:
o ajuste não mudou setup, catálogo, esquema, interface, infraestrutura,
visão do produto ou instruções do harness. Esta etapa documental não alterou
código nem reexecutou os testes da aplicação.

## Concorrência de alertas — 09/10/2026

- Teste PostgreSQL de duas avaliações simultâneas começou vermelho com
  `IntegrityError` na restrição `uq_notification_alert_episode`. A linha do
  alerta passou a ser travada e recarregada antes da decisão; ambas as
  transações terminam e há uma notificação no episódio.
- Teste de duas edições simultâneas com alvos diferentes começou vermelho:
  o alvo final era `90.00` em vez de `95.00`, perdendo a segunda revisão.
  A rota de edição passou a travar a linha antes de ler e alterar o alvo.
  O resultado confirmado foi revisão 3, alvo final 95 e duas notificações
  nas revisões 2 e 3.
- `uv run pytest tests/test_alert_concurrency_integration.py -q
  -p no:cacheprovider --tb=short` passou **2 testes**, repetido duas vezes
  no PostgreSQL isolado. Após corrigir a ordem dos imports apontada por Ruff,
  `uv run pytest -q -p no:cacheprovider --tb=short` passou **53 testes,
  1 warning** e `uv run ruff check .` retornou **All checks passed!**.
  Não houve API externa real.

## Sincronização de onboarding após concorrência de alertas

O agente `.agents/agents/doc-sync-onboarding.md` conferiu
`backend/app/products/alerts.py`, `backend/app/products/routes.py`,
`backend/tests/test_alert_concurrency_integration.py`, `AGENTS.md`,
`CLAUDE.md` e os guias de `docs/`. Atualizou `docs/apps/backend.md` e
`docs/database.md` para descrever a trava e a releitura da linha do alerta
antes da avaliação ou edição, e `docs/PROGRESS.md` com a evidência de
**53 testes backend** registrada acima. `README.md`, `docs/index.md`,
`docs/architecture.md`, `docs/apps/frontend.md`,
`docs/apps/infraestrutura.md`, `docs/product-context.md`, `AGENTS.md` e
`CLAUDE.md` não exigiram mudança: setup, catálogo, fronteiras da aplicação,
interface, infraestrutura, visão do produto e instruções do harness não foram
alterados por esta correção. `git diff --check -- docs/PROGRESS.md
docs/apps/backend.md docs/database.md` retornou código zero, com avisos
LF/CRLF. Esta sincronização não alterou código nem reexecutou testes da
aplicação.

## Interrupção e edição concorrentes — 09/10/2026

- O teste PostgreSQL novo começou vermelho: após interromper um vínculo
  enquanto outra sessão habilitava seu alerta, `tracked.active=false`, mas
  `alert.enabled=true`. A leitura dos vínculos para criação, edição, exclusão
  de alerta e interrupção passou a usar trava de linha e releitura. Se a
  edição termina primeiro, a interrupção seguinte pausa o alerta. A ordem
  inversa ainda não foi exercitada por este teste concorrente.
- `uv run pytest tests/test_alert_concurrency_integration.py -q
  -p no:cacheprovider --tb=short` passou **3 testes** em duas execuções
  contra PostgreSQL isolado. Suíte backend completa com `TEST_DATABASE_URL`:
  **54 passed, 1 warning**. `uv run ruff check .` retornou
  **All checks passed!**. Sem validação com processos worker distintos ou
  API externa autorizada.

## Sincronização de onboarding após interrupção concorrente

O agente `.agents/agents/doc-sync-onboarding.md` conferiu
`backend/app/products/routes.py`, o teste PostgreSQL em
`backend/tests/test_alert_concurrency_integration.py`, `docs/LEARNINGS.md`,
`AGENTS.md` e `CLAUDE.md`. Atualizou `docs/apps/backend.md` e
`docs/database.md` para descrever a trava e releitura do vínculo, e
`docs/PROGRESS.md` com os 54 testes relatados acima e o limite da ordem
inversa ainda não exercitada. `README.md`, `docs/index.md`,
`docs/architecture.md`, `docs/apps/frontend.md`,
`docs/apps/infraestrutura.md`, `docs/product-context.md`, `AGENTS.md` e
`CLAUDE.md` não exigiram alteração: a correção não mudou setup, catálogo,
fronteiras da aplicação, interface, infraestrutura, visão do produto ou
instruções do harness. `git diff --check -- docs/apps/backend.md
docs/database.md docs/PROGRESS.md` retornou código zero, com avisos LF/CRLF.
Esta sincronização não alterou código nem reexecutou testes da aplicação.

## Ordens inversas e cadastro simultâneo de alerta — 09/10/2026

- Ampliei o teste PostgreSQL de interrupção/edição para a ordem inversa. Com
  a interrupção segurando a trava do vínculo, a edição aguardou, recebeu
  `tracking_inactive` e o alerta permaneceu desabilitado.
- Outro teste PostgreSQL iniciou dois cadastros do mesmo alerta. A segunda
  tentativa aguardou a primeira transação e retornou `alert_already_exists`;
  permaneceram um alerta e uma notificação, sem `IntegrityError` exposto.
- `uv run pytest tests/test_alert_concurrency_integration.py -q
  -p no:cacheprovider --tb=short`: **4 passed**, repetido duas vezes.
  `TEST_DATABASE_URL` no PostgreSQL isolado, suíte backend completa:
  **55 passed, 1 warning**. `uv run ruff check .`: **All checks passed!**.
  Esta rodada ampliou testes; não alterou comportamento da aplicação.

## Sincronização de onboarding após ordens inversas e cadastro simultâneo

O agente `.agents/agents/doc-sync-onboarding.md` conferiu o teste PostgreSQL,
`backend/app/products/routes.py`, `AGENTS.md`, `CLAUDE.md` e os guias de
`docs/`. Atualizou `docs/PROGRESS.md`, `docs/apps/backend.md` e
`docs/database.md` para registrar as duas ordens da corrida entre edição e
interrupção, o cadastro simultâneo e os **55 testes backend** informados acima.
`README.md`, `docs/index.md`, `docs/architecture.md`,
`docs/apps/frontend.md`, `docs/apps/infraestrutura.md`,
`docs/product-context.md`, `AGENTS.md` e `CLAUDE.md` não exigiram alteração:
o teste não mudou setup, catálogo, arquitetura, interface, infraestrutura,
visão do produto nem instruções do harness. Esta sincronização não alterou
código nem reexecutou testes da aplicação.

## Estados de consulta e métricas no React — 09/10/2026

- Teste de UI novo com preço `80.00`, anterior `100.00`, última tentativa
  `rate_limited` e dado `stale` começou vermelho: o cartão dizia “consulta
  pendente” no lugar de “preço desatualizado”. Após a mudança, o detalhe
  apresenta separadamente `last_attempt_at`, `last_success_at`,
  `last_price_observed_at` e `price_changed_at`, resultado da tentativa,
  disponibilidade, anterior, diferença e percentual.
- `npm test -- --run`: **5 passed**. `npm run lint`: código zero.
  `npm run build`: código zero, após executar fora do sandbox porque o Vite
  retornou `spawn EPERM` no ambiente restrito. O teste usa resposta simulada;
  não comprova consulta autorizada à fonte nem inspeção visual no navegador.

## Auditoria QA dos critérios AC-001 a AC-022 — 09/10/2026

Executada pelo papel `.agents/agents/qa.md` em `HEAD 6c0515b`, sem alterar
código. "Simulado" indica fonte Mercado Livre substituída por dublê em teste;
"stack real" indica PostgreSQL 17, FastAPI e Nginx/SPA do projeto Compose
`bestprice0013verify`. Nenhuma consulta à API do Mercado Livre foi feita.

### Gates

| Comando | Resultado |
|---|---|
| `backend/: uv run ruff check .` | All checks passed (código 0) |
| `backend/: TEST_DATABASE_URL=…@127.0.0.1:55413/bestprice uv run pytest -q -p no:cacheprovider -rs` | **55 passed**, 0 skipped, 1 warning (depreciação Starlette); as 11 integrações PostgreSQL executaram |
| `frontend/: npm run lint` | código 0 |
| `frontend/: npm test -- --run` | **5 passed** (1 arquivo) |
| `frontend/: npm run build` | código 0; `index-s4oAgMmZ.js` 239.26 kB |

### Stack Compose (serviços reais)

- `docker compose -p bestprice0013verify up -d --build` (portas 55413/58113/58114,
  senha de teste local): código 0; backend healthy; worker e frontend recriados.
  O bundle servido em 58114 tem o mesmo hash do build local.
- `alembic_version` = `20261009safe`; 9 tabelas de domínio presentes.
- `GET /api/health` 200 `{"status":"ok","database":"ok"}` no backend e pelo proxy.
  Com `docker compose stop db`: **503** `{"status":"unavailable","database":"unavailable"}`
  nos dois caminhos; log `Verificação do banco falhou (OperationalError)` sem
  credenciais. Após `start db`, voltou a 200.
- Worker: `MERCADOLIVRE_THIRD_PARTY_VALIDATED=false`; log repetido
  “Monitoramento aguardando integração autorizada”.
- Conta `qa0013-audit@example.invalid` provisionada por
  `python -m app.auth.provision` (senha via stdin). Sem sessão:
  `/api/tracked-products` e `/api/dashboard` **401** `unauthenticated`. Senha
  errada 401 `invalid_credentials`. Login 200 com cookie `HttpOnly; Path=/api;
  SameSite=lax`; `/api/auth/me` 200; dashboard vazio 200; logout 204 e `me`
  seguinte 401.
- `POST /api/tracked-products`: anúncio MLB novo **503**
  `integration_not_configured` (mensagem “Não conseguimos consultar este anúncio
  agora.”), sem linha em `products`; `example.com`, `meli.la` e catálogo
  `/produto/p/` **400** `invalid_url`; `manual_price` e corpo vazio **422**.
- Fixture **sintética** `MLB5566778899` inserida por SQL no banco isolado com
  preço observado há 5 min: POST **201**; repetição **409** `already_tracked`
  com o ID próprio; alerta alvo `120.00` **201** com `target_reached` e uma
  notificação imediata; DELETE **204** pausou o alerta; nova POST **200** com o
  mesmo ID, `active_since` renovado e alerta ainda desabilitado; leitura de
  notificação repetida manteve o primeiro `read_at`. Segunda conta recebeu
  **404** em detalhe, alerta, histórico, DELETE e PATCH da notificação alheia.
- Refresh com a integração desligada **503** `integration_not_configured`
  gravou `last_attempt_status=temporary_error` no produto compartilhado; o
  refresh seguinte retornou **429** `refresh_not_due` com `retry-after: 2889`,
  e a segunda conta não conseguiu mais reutilizar o produto (503).
- UI: não houve inspeção visual em navegador. Foram conferidos o HTML servido
  (200) e as strings do bundle (título, botão “Monitorar preço”, mensagem de
  falha de rede; nenhuma ocorrência de “Amazon”).

### Situação por critério

| AC | Situação | Evidência / lacuna |
|---|---|---|
| 001 | demonstrado | `test_product_url_identifies_listing_without_network`, `test_product_url_rejects_unsupported_or_unsafe_input`, `test_local_tracking_decisions_precede_unavailable_marketplace`; 400 na stack |
| 002 | bloqueado por AC-013 | só com dublê (`test_tracking_reuses_listing_across_users_and_blocks_duplicate`, teste UI de anúncio persistido) |
| 003 | parcial | `test_client_maps_upstream_failures` (401/403/429/503), testes de refresh/ciclo de vida; faltam timeout, item 404 e JSON inválido no cliente, e erros da fonte no POST de cadastro |
| 004 | demonstrado | `test_tracking_reuses_listing_across_users_and_blocks_duplicate`; 409 na stack |
| 005 | parcial | `test_concurrent_users_share_one_external_lookup` (PostgreSQL); faltam POST concorrente da mesma pessoa e falha no meio da transação |
| 006 | demonstrado (simulado) | `test_missing_price_and_attempt_timestamps_follow_controlled_clock`, `test_refresh_records_changes_but_preserves_price_on_rate_limit` |
| 007 | parcial | `test_history_summary_keeps_global_extremes_when_history_is_paginated` e testes UI; sem teste de UI para métricas nulas nem inspeção visual |
| 008 | parcial | testes de worker e `test_concurrent_worker_sessions_refresh_due_listing_once`; ciclo real na stack bloqueado e processos distintos não testados |
| 009 | demonstrado (simulado) | teste do worker com 429, `test_failed_refresh_uses_controlled_clock_and_jitter` |
| 010 | parcial | `test_alert_notifies_once_per_price_episode_and_requires_ownership`, `test_alert_does_not_fire_when_price_is_stale_for_configured_window`; faltam indisponível, `missing_price` e não rearmar com preço acima enquanto stale/erro |
| 011 | demonstrado | teste HTTP de tracking e última asserção do teste do worker; stack confirmou |
| 012 | parcial | textos da UI e bundle sem Amazon; faltam acessibilidade/mobile em navegador; `docs/product-context.md`, `README.md` e `AGENTS.md` ainda citam Amazon |
| 013 | não demonstrável | sem credenciais nem autorização |
| 014 | parcial | 503 e worker bloqueado na stack; a mensagem real é genérica, e o teste UI simula outra (“Integração indisponível no momento.”); o hero diz “integração oficial autorizada” |
| 015 | parcial | 10 entradas rejeitadas em teste; catálogo sem `wid`, `/ofertas`, IP, ponto final e caixa só sondados manualmente (corretos); API não emite `unsupported_url_format`/`ambiguous_item_id` nem orienta link curto |
| 016 | parcial | contexto `channel_marketplace` e OAuth operadora testados; não há teste de moeda ≠ BRL nem de variante/benefício pessoal |
| 017 | demonstrado (simulado) | `test_missing_price_and_attempt_timestamps_follow_controlled_clock` |
| 018 | parcial | `test_not_found_then_timeout_keeps_state_and_24_hour_retry`; faltam total monitorado, GET após recarga e recuperação já com preço diferente |
| 019 | demonstrado (simulado) | teste de ciclo de vida e teste UI “distingue tentativa falha…” |
| 020 | parcial | 100→80→90, paginação e desempate testados; faltam anterior zero → `null` e exclusões por `active_since`, stale e >24 h |
| 021 | parcial | pausa, leitura idempotente, exclusão e concorrência testadas; retomada sem reabilitar alerta e sem repetir eventos só observada manualmente |
| 022 | parcial | API coberta por testes e stack; a UI não trata 401 durante a sessão, não usa `tracked_product_id` no 409 e não testa que 503 mantém a sessão |

### Limites

Nenhuma inspeção visual, nenhuma chamada real ao Mercado Livre, nenhum worker em
processos distintos. pytest e a stack E2E compartilham o mesmo banco (111 contas
de teste). A fixture `MLB5566778899` e as contas `qa0013-audit*` permanecem no
volume isolado. CI, Project e PR não foram verificados.

## Reverificação QA após correções `898215b` e `810def5` — 09/10/2026

Sem alteração de código pelo QA. Fonte Mercado Livre não consultada.

### Gates

| Comando | Resultado |
|---|---|
| `backend/: uv run ruff check .` | All checks passed |
| `backend/: TEST_DATABASE_URL=…55413 uv run pytest -q -p no:cacheprovider -rs` | **116 passed**, 0 skipped, 1 warning (Starlette) |
| `frontend/: npm run lint` | código 0 |
| `frontend/: npm test -- --run` | **19 passed** |
| `frontend/: npm run build` | código 0; `index-CmHkZN8t.js` 241.07 kB |

### Stack real (`docker compose -p bestprice0013verify up -d --build`, código 0)

- Bundle servido `index-CmHkZN8t.js` igual ao build local; contém “Ver produto”,
  “Tentar novamente” e “Preço indisponível”; zero ocorrências de “integração
  oficial autorizada” e de “Amazon”. `alembic_version` `20261009safe`; health 200.
- (a) Anúncio novo: **503** `integration_not_configured`, mensagem “O cadastro de
  novos anúncios está indisponível até a integração oficial com o Mercado Livre
  ser autorizada. As atualizações também ficam suspensas até lá.”; 0 linhas
  `MLB4455667788` em `products`.
- (b) **400** `unsupported_url_format` para catálogo, catálogo com `wid`, busca,
  `/ofertas` e `meli.la`/`/sec/` (estes com “Links curtos não são aceitos…
  copie o endereço completo da página.”); `ambiguous_item_id` para ID repetido;
  `invalid_url` para domínio semelhante, `http`, porta 8443, userinfo e
  `example.com`.
- (c) Fixture sintética `MLB5566778899` reposta a estado fresco por SQL. Dois
  refresh da conta 1 → **503** `integration_not_configured`; `last_attempt_status`,
  `last_attempt_at`, `last_success_at`, `next_check_at`, `failure_count` e
  `retry_after_at` idênticos antes/depois. A conta 2 reutilizou a fixture com
  **201** (mesmo `product.id`).
- (d) Evento sintético inserido em `product_events`: `recent_updates[0].observed_at`
  = `2026-10-09T16:28:13.565051Z`. Todos os 27 instantes em dashboard,
  notificações e listagem das duas contas terminam em `Z`.
- (e) 409 `already_tracked` com o `tracked_product_id` próprio para cada conta;
  404 `resource_not_found` para vínculo alheio; 401 `unauthenticated` sem sessão.
- (f) Worker: apenas “Monitoramento aguardando integração autorizada” (2 linhas);
  backend sem error/traceback/warning nos logs.
- Não houve inspeção visual em navegador.

### Situação atualizada

Mudaram para **demonstrado**: AC-001, AC-003 e AC-015 (testes de URL, cliente e
erros da fonte, mais a stack); AC-010 (`test_unavailable_missing_price_or_stale_neither_fire_nor_rearm`);
AC-014 (stack e teste UI de bloqueio sem encerrar sessão); AC-017; AC-018
(`test_not_found_keeps_tracked_count_and_survives_reload_and_timeout`); AC-020
(`test_previous_zero_has_no_percentage_and_opportunities_exclude_old_stale_or_pre_tracking_drops`);
AC-021 (`test_resume_does_not_enable_alert_nor_repeat_old_events` e testes concorrentes);
AC-022 (testes UI de 401, 503, 409 com “Ver produto” e stack). AC-005 passa a
demonstrado para concorrência (`test_concurrent_registration_by_same_person_returns_conflict_to_loser`).

Continuam: AC-002 e AC-013 bloqueados por credenciais; AC-005 parcial, porque
falta falha no meio da transação de escrita; AC-007 parcial, porque não houve
inspeção visual; AC-008 parcial, sem ciclo real na stack e sem processos worker
distintos; AC-012 parcial, sem acessibilidade e mobile no navegador, e
`README.md`, `docs/product-context.md`, `AGENTS.md` e `.agents/rules/workspace.md`
ainda citam Amazon; AC-016 parcial, porque moeda diferente está testada, mas
variante ambígua e benefício pessoal não são detectados. Os demais (004, 006,
009, 011 e 019) seguem como antes.
