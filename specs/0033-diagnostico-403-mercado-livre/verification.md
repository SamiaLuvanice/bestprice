# Verificação — 0033

Data: 2026-10-23. Base `origin/develop` em `f364e7c`.

## Evidência local

| Critério | Resultado observado | Comando / evidência | Limite |
|---|---|---|---|
| AC01 — 403 na leitura do anúncio | Passou: erro continua `integration_access_denied` e recurso é `item` | `uv run pytest -q tests/test_mercado_livre_client.py tests/test_marketplace_live_validation.py` (**48 passed**) | Transporte simulado |
| AC02 — 403 na leitura do preço | Passou: erro continua `integration_access_denied` e recurso é `sale_price` | Mesmo teste direcionado (**48 passed**) | Transporte simulado |
| AC03 — saída sem conteúdo upstream | Passou: testes confirmam mensagem upstream e credenciais ausentes do relatório | `uv run pytest -q tests/test_mercado_livre_client.py tests/test_marketplace_live_validation.py` | Não valida logs do provedor externo; nenhum corpo é lido para o diagnóstico |
| AC04 — sem origem inventada | Passou: 403 sem metadado de recurso não contém `blocked_resource`; outros erros preservam mapeamento | Mesmo teste direcionado; suíte completa abaixo | Fronteira simulada |
| AC05 — sem ampliar escopo ou habilitar gate | Passou por inspeção: diff não altera OAuth, DevCenter, workflow de ativação nem configuração do gate | `git diff --check` e revisão do diff | Revisão operacional Stage pendente |

## Portões executados

- `uv run ruff check .` — passou.
- `uv run pytest -q` em `backend/` — **166 passed, 31 skipped, 1 warning**.
  Os 31 testes que exigem `TEST_DATABASE_URL` foram pulados porque não há banco
  PostgreSQL isolado configurado nesta sessão. O aviso é de depreciação do
  TestClient (Starlette/httpx).
- `python .agents/skills/cyclomatic-complexity/scripts/complexity_report.py backend/app --changed origin/develop` — passou; 67 blocos, nenhum rank D+.
- `git diff --check` — passou; sem whitespace ou conflitos de patch.
- Revisão independente `fullstack_review` — nenhum achado de segurança ou regressão; confirmou enumeração allowlist, erro público preservado e saída sanitizada. Revisão limitada ao diff, sem execução independente dos gates.
- Doc-sync-onboarding executado: `docs/apps/backend.md`, `docs/apps/infraestrutura.md` e `docs/PROGRESS.md` atualizados. `docs/index.md`, `AGENTS.md` e `CLAUDE.md` conferidos e sem necessidade de mudança.

## Validação real e limites

A execução Stage anterior confirmou `oauth_refresh: confirmed`; os três itens
falharam com `integration_access_denied`, sem recurso identificado. O DevCenter
mostra `Publicação e sincronização` em Leitura e a verificação de conta foi
concluída. Esta mudança ainda não foi executada no Stage. Após merge e checks,
disparar uma execução manual usando os IDs autorizados já registrados na
configuração do environment; a saída indicará `item` ou `sale_price`. A sonda
não habilita `MERCADOLIVRE_THIRD_PARTY_VALIDATED`, e o 503 da API permanece até
decisão operacional explícita baseada em evidência.
