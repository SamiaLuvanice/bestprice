# Verificação — Spec 0018

Iniciada em 13/10/2026; atualizada em 14/10/2026. Issue [#60](https://github.com/SamiaLuvanice/bestprice/issues/60).
Base: `dbd20d7` de `origin/develop`; branch
`feature/0018-issue-60-stage-render-supabase-pages` na worktree própria.

## Evidência local

| Comando ou ação | Resultado observado |
|---|---|
| `uv run pytest -q tests/test_auth_http.py` antes da correção | 1 falha: cookie em `APP_ENV=stage` não tinha `Secure`. |
| Mesmo teste após a correção, com `TestClient` em HTTPS | 1 passed; `Secure` e `HttpOnly`, seguido de `/api/auth/me` 200. |
| `npm test -- --run src/pagesProxy.test.ts` antes da implementação | 1 falha: proxy não chamava a API. |
| Mesmo teste após a implementação | 2 passed: método, caminho, consulta, corpo e cookie encaminhados; configuração inválida e falha de rede retornam 502 seguro. |
| `uv run ruff check .` | All checks passed. |
| `uv run pytest -q` sem `TEST_DATABASE_URL` | 124 passed, 25 skipped; skips eram integração PostgreSQL. |
| `uv run pytest -q` com `TEST_DATABASE_URL` em PostgreSQL 17 isolado | **149 passed, nenhum skip**, 1 aviso de depreciação Starlette. |
| `npm run lint`; `npm test -- --run`; `npm run build` | Lint verde; **255 passed** em 24 arquivos; build Vite verde. `_routes.json` presente em `dist/`. |
| `node --test .github/scripts/*.test.cjs` | **43 passed**, nenhum skip. |
| Compose isolado: `docker compose ... up -d --build backend frontend` | Imagens construídas, DB healthy, backend healthy, SPA iniciada. |
| `docker exec ... alembic current` | `20261009safe (head)` após migration no start do backend. |
| `curl -i` em API `:26105/api/health` e SPA `:33105/api/health` | Ambos 200 com `{"status":"ok","database":"ok"}`. |
| Parar somente o DB isolado; `curl -i :26105/api/health`; religar DB | 503 com `{"status":"unavailable","database":"unavailable"}`; após reinício, proxy voltou a 200. |
| `git diff --check` | Sem erros. |

O primeiro `npm test`, `npm run build` e `node --test` no sandbox falharam com
`spawn EPERM`; as execuções fora do sandbox produziram os resultados acima. O
primeiro `uv run` no sandbox falhou por permissão no cache; a suíte foi executada
fora dele. Não há `actionlint` instalado e os workflows não foram alterados.

## Handoff e revisão da preparação local

O commit `101b07b` integrou a PR [#61](https://github.com/SamiaLuvanice/bestprice/pull/61)
em `develop`. `gh pr checks 61 --watch` concluiu nesse commit com CI, Backend,
Frontend, Automation, PR policy, sync e resolve verdes. A revisão independente
de arquitetura do mesmo HEAD não apontou achado de código; QA aceitou a
preparação local com
a ressalva de que nenhum critério dependente do ambiente público foi aceito.
Não havia aprovação humana registrada no GitHub na revisão inicial. Esses checks,
isoladamente, não comprovavam projetos externos, promoção para `stage` ou deploy.

## Provisionamento Supabase

Em 13/10/2026, após confirmação do custo pelo responsável, `get_cost` informou
**0 por mês** para novo projeto na organização `Samia's Org` (plano `free`). O
projeto `bestprice-stage`, ref `nhqlkqgliofpesfslozb`, foi criado em `sa-east-1`.
`get_project` retornou `ACTIVE_HEALTHY`, PostgreSQL 17.11; `list_tables` no
esquema `public` retornou lista vazia e o advisor de segurança não trouxe avisos.
Uma consulta somente leitura retornou `connection_uses_tls=true` para a conexão
do conector Supabase. Isso não comprova o TLS da futura conexão Render → Session
pooler nem migrations. O painel confirmou plano `Free`, compute `NANO` a
**US$ 0/h**, sem réplicas, e add-ons IPv4 dedicado, PITR e domínio personalizado
**desativados**. O spend cap da organização está **habilitado** e o painel informa
que não haverá cobrança extra por uso, embora o projeto possa ficar sem resposta
ou somente leitura ao exceder a cota. Isso não comprova disponibilidade contínua.
Nenhuma senha ou URL de banco foi registrada.

## Conferência de cobrança em Chrome

Em 13/10/2026, os painéis das contas usadas para stage mostraram:

- **Render / My Workspace:** plano `Hobby`, sem cartão cadastrado, sem cobrança
  pendente e sem serviços; 750 horas gratuitas, 5 GB de banda e 500 minutos de
  pipeline incluídos no mês. A configuração do pipeline tinha limite mensal de
  gasto de **US$ 0**; o painel informa que builds param ao esgotar os minutos.
  O aviso de cobrança além das franquias continua visível e não foi encontrado
  limite equivalente para toda a banda. A [documentação oficial do
  Render](https://render.com/docs/free#bandwidth-and-build-pipeline) esclarece
  que, **sem forma de pagamento**, excesso de banda suspende os serviços Free e
  excesso de minutos desativa novos builds, em vez de gerar cobrança.
- **Cloudflare:** `Workers Free` ativo, **US$ 0**, sem forma de pagamento e sem
  projetos Workers & Pages. O painel mostrava 0/100.000 requests no dia e
  3.000 minutos de Workers Builds por mês no plano Free.
- **Supabase / Samia's Org:** plano `Free`, spend cap habilitado e compute Nano
  no projeto de stage; os três add-ons listados estavam desativados.

Render e Cloudflare ainda não tinham sido provisionados nessa conferência inicial. Essa proteção de custo
depende de manter a conta Render sem forma de pagamento e de implantar apenas
instâncias Free; o excedente pode interromper o stage.

## Promoção e primeiro deploy externo

Em 13/10/2026, a PR [#61](https://github.com/SamiaLuvanice/bestprice/pull/61)
foi integrada em `develop` (`16c8235`); a PR
[#62](https://github.com/SamiaLuvanice/bestprice/pull/62) promoveu `develop` para
`stage` (`3e18697`) e o CI de `stage` passou. A PR reversa
[#63](https://github.com/SamiaLuvanice/bestprice/pull/63) foi aberta para preservar
a ancestralidade em `develop`; ainda não há registro de integração dela aqui.

O projeto Cloudflare Pages `bestprice-stage` publicou a revisão `3e18697` em
[bestprice-stage.pages.dev](https://bestprice-stage.pages.dev). A interface abriu
no navegador. Isso não demonstra que o proxy `/api/*`, login ou cookie funcionam,
porque a API ainda não iniciou.

O serviço Render Free `bestprice-stage-api`, em
[bestprice-stage-api.onrender.com](https://bestprice-stage-api.onrender.com), foi
criado com `DATABASE_URL` inserida diretamente pelo responsável como segredo. A
senha do Supabase foi girada; seu valor não é registrado aqui. O primeiro deploy
da revisão `3e18697` ficou **FAILED**. O log mostrou
`sh: 1: alembic upgrade head && exec uvicorn ...: not found`: `dockerCommand`
fornecia uma expressão de shell que o Render tentou iniciar como um único comando.
Não há evidência de migration aplicada nem de API saudável nesse deploy. A Issue
[#60](https://github.com/SamiaLuvanice/bestprice/issues/60) foi reaberta para a
correção.

Na branch `fix/0018-issue-60-render-start`, a correção em preparação substitui o
`dockerCommand` por `/app/start-stage.sh`. O Dockerfile copia e marca o script
executável; ele aplica `alembic upgrade head` e só depois inicia Uvicorn. O teste
`backend/tests/test_stage_start.py` cobre a referência do Blueprint e Dockerfile;
os cenários POSIX foram escritos para conferir a ordem e a falha da migration.
Com o diretório de trabalho em `backend/` desta worktree, usando os executáveis
Ruff e pytest da venv da worktree anterior, `ruff check .` passou e
`pytest -q tests/test_stage_start.py --basetemp=.pytest-tmp` retornou
**1 passed, 2 skipped**. O teste que confere a configuração passou; os dois
cenários de execução POSIX foram pulados no Windows e não estão verificados
localmente. `uv run` não estava disponível por restrições de cache/rede.
Ainda faltam CI em Linux e novo deploy no Render; nenhum resultado de migration
ou health público pode ser atribuído a essa correção neste ponto.

## Critérios de aceite

| Critério | Estado e limite |
|---|---|
| Render Free na branch `stage`, deploy após checks | Serviço criado; primeiro deploy da revisão `3e18697` falhou na inicialização. Novo deploy e política de checks no serviço real ainda precisam de conferência. |
| Pages compila `frontend/` e publica `stage` | Projeto Pages publicou `3e18697` em HTTPS e a interface abriu; atualização posterior ainda não verificada. |
| Três serviços gratuitos, sem add-ons | Supabase `Free` com Nano US$ 0/h e add-ons desativados; serviço Render `Free`; projeto Pages em `Workers Free`. Revalidar planos/controles após a correção. |
| Sem excedentes faturáveis | Supabase spend cap ligado; Render sem cartão e pipeline limitado a US$ 0; Cloudflare Workers Free sem forma de pagamento. A documentação Render prevê suspensão dos serviços Free em vez de cobrar banda sem cartão. Revalidar os controles com os serviços já criados e não cadastrar pagamento. |
| Proxy `/api/*` na mesma origem | Teste da Function e `_routes.json` verdes; Pages público disponível, mas fluxo via API ainda não verificado. |
| Supabase isolado, TLS e segredos | Projeto `bestprice-stage` exclusivo criado; `DATABASE_URL` foi inserida como segredo pelo responsável. TLS Render → Supabase e migrations ainda não verificados. |
| Migrations e health 200 em deploy limpo | Comprovados no Compose local; primeiro deploy Render falhou antes da migration. Novo deploy pendente. |
| Health 503 sem DB e Render considera unhealthy | 503 real local comprovado; decisão do Render pendente. |
| Cookie `Secure` e `HttpOnly` | Teste HTTPS local verde; cookie no endereço Pages pendente. |
| Nova promoção atualiza somente `stage` | Promoção inicial #62 e CI de `stage` concluídos; promoção posterior e deploy atualizado pendentes. |
| Procedimento, variáveis, cotas e reversão documentados e conferidos | Painéis conferidos antes do provisionamento; operação real e rollback pendentes. |

Os testes locais e o CI não substituem a validação pública. O Pages está publicado,
mas o primeiro deploy da API falhou; migrations, health, proxy, cookie e rollback
permanecem pendentes.
