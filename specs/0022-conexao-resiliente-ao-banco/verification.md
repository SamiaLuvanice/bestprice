# Verificação — 0022 Conexão resiliente ao banco

Issue [#101](https://github.com/SamiaLuvanice/bestprice/issues/101).
Ambiente: worktree `.worktrees/feature-0022-issue-101-conexao-resiliente-ao-banco/`,
`sqlalchemy==2.1.4`, `psycopg[binary]` e PostgreSQL `postgres:17-alpine` isolado em
`127.0.0.1:55433` (container dedicado `bestprice-0022-db`, sem compartilhar banco com
outras tarefas). Migrations aplicadas até o head `20261014rls`.

## Fase Red (falha pelo motivo esperado)

| # | Comando | Resultado |
|---|---|---|
| Red unit | `uv run pytest tests/test_db_engine.py -q` | **2 failed** — `AttributeError: module 'app.db' has no attribute 'engine_kwargs'` (a configuração do pool ainda não existia) |
| Red comportamento | `db.engine_kwargs()` temporariamente revertido ao comportamento antigo; `uv run pytest tests/test_db_engine_integration.py -k age_is_replaced -q` | **1 failed** — `assert 87 != 87`: sem `pool_recycle` a conexão velha era reutilizada (mesmo PID), confirmando que o critério AC01 falha antes da mudança |

## Fase Green e portões

| # | Comando | Resultado |
|---|---|---|
| Unit + integração da feature | `TEST_DATABASE_URL=…55433 uv run pytest tests/test_db_engine.py tests/test_db_engine_integration.py -q -p no:cacheprovider` | **6 passed** em 5,9 s (2 unit + 4 integração) |
| Suíte backend completa | `TEST_DATABASE_URL=…55433 uv run pytest -q -p no:cacheprovider -rs` | **158 passed, 2 skipped** em 61,7 s; os 2 skips são `test_stage_start.py` (script de boot POSIX, roda só na imagem Linux) |
| Lint | `uv run ruff check .` | **All checks passed!** |
| Health e2e (HTTP real) | `uvicorn app.main:app --port 8099` + `Invoke-RestMethod /api/health` | **200** `{"status":"ok","database":"ok"}` com o banco no ar; após `docker stop` do banco, **503** `{"status":"unavailable","database":"unavailable"}` |
| Esquema | `uv run alembic upgrade head` | head `20261014rls`; nenhuma migration nova (AC07) |

## Matriz de critérios de aceite

| AC | Descrição | Evidência | Resultado |
|---|---|---|---|
| AC01 | Conexão acima do limite de idade é substituída no próximo uso | Red: `test_connection_past_its_age_is_replaced` falhou sem `pool_recycle` (mesmo PID). Green: com `POOL_RECYCLE_SECONDS=1` e `sleep 1,5 s`, o PID muda | **Comprovado** |
| AC02 | Conexões íntegras são reutilizadas sem abrir novas além do conjunto | `test_healthy_connections_are_reused_within_the_pool`: 5 retiradas, 1 único PID e `pool.checkedout()==0` | **Comprovado** |
| AC03 | Espera por conexão do conjunto é limitada por prazo | `test_waiting_for_a_pooled_connection_is_bounded_and_safe`: `pool_size=1`, `max_overflow=0`, `POOL_TIMEOUT_SECONDS=1`; `TimeoutError` em `< 5 s` | **Comprovado** |
| AC04 | Abertura de conexão nova é limitada por prazo | `test_opening_a_connection_is_bounded`: `CONNECT_TIMEOUT_SECONDS=1` para IP não roteável `192.0.2.1:5432`; `OperationalError` em `< 10 s`. Red (unit) em `test_engine_options_bound_age_reuse_and_wait` | **Comprovado** |
| AC05 | Falha por prazo termina rápido e sem expor detalhes internos | No AC03/AC04, a exceção é lançada em prazo e a `str(exceção)` não contém a senha nem a URL de conexão; nenhum handler novo foi adicionado, contrato de erro inalterado | **Comprovado** |
| AC06 | Health preservado: 200 ok/ok com banco, 503 seguro sem banco | `test_health.py` (unit) + `test_health_integration.py` (PostgreSQL real) na suíte, e a checagem HTTP e2e acima | **Comprovado** |
| AC07 | Nenhuma migration necessária; head inalterado | `alembic upgrade head` sem novas revisões; `backend/alembic/` não mudou no diff | **Comprovado** |

## Rastreabilidade e limites

- Testes de comportamento: `backend/tests/test_db_engine.py` (config, sem banco) e
  `backend/tests/test_db_engine_integration.py` (reciclo, reuso, prazos), com
  `create_database_engine.cache_clear()` entre casos.
- Riscos residuais aceitos e documentados no `plan.md`: bloqueio no `pre_ping` sem prazo
  se a conexão TCP estagnar sem RST/FIN, e resolução DNS fora do `connect_timeout`.
  Ambos exigiriam `statement_timeout`/keepalive, deliberadamente fora de escopo.
- Escopo preservado: apenas `backend/app/db.py` mudou em produção; health e migrations
  intocados. Sem alteração de contrato REST.
