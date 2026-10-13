# Verificação — Spec 0018

Data: 13/10/2026. Issue [#60](https://github.com/SamiaLuvanice/bestprice/issues/60).
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

O commit `a03fa8e` está na PR [#61](https://github.com/SamiaLuvanice/bestprice/pull/61),
aberta para `develop`. `gh pr checks 61 --watch` concluiu nesse commit com CI, Backend,
Frontend, Automation, PR policy, sync e resolve verdes. A revisão independente
de arquitetura não apontou achado de código; QA aceitou a preparação local com
a ressalva de que nenhum critério dependente do ambiente público foi aceito.
Não há aprovação humana registrada no GitHub nem merge da PR. Esses checks não
comprovam projetos externos, promoção para `stage` ou deploy.

## Critérios de aceite

| Critério | Estado e limite |
|---|---|
| Render Free na branch `stage`, deploy após checks | Configurado em `render.yaml`; falta sincronizar Blueprint e comprovar deploy no Render. |
| Pages compila `frontend/` e publica `stage` | Build local verde; projeto Pages e deploy real pendentes. |
| Três serviços gratuitos, sem add-ons | Código declara Render `free`; planos e add-ons dos painéis não conferidos. |
| Sem excedentes faturáveis | Pendente de confirmar cobrança nos painéis. Render Free pode cobrar banda e pipeline se houver forma de pagamento. |
| Proxy `/api/*` na mesma origem | Teste da Function e `_routes.json` verdes; falta navegador no Pages real. |
| Supabase isolado, TLS e segredos | Plano prevê Session pooler com `sslmode=require`; projeto e conexão real pendentes. |
| Migrations e health 200 em deploy limpo | Comprovados no Compose local; deploy Render/Supabase pendente. |
| Health 503 sem DB e Render considera unhealthy | 503 real local comprovado; decisão do Render pendente. |
| Cookie `Secure` e `HttpOnly` | Teste HTTPS local verde; cookie no endereço Pages pendente. |
| Nova promoção atualiza somente `stage` | PR #61 para `develop` aberta e CI verde; merge, promoção para `stage` e deploy pendentes. |
| Procedimento, variáveis, cotas e reversão documentados e conferidos | Documentação local sincronizada; painéis e operação real pendentes. |

Nenhum critério que depende do ambiente público é dado como aceito por um teste
local ou pelo CI da PR. Promoção, operação real e aprovação humana no GitHub
permanecem pendentes.
