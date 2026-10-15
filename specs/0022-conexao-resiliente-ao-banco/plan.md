# Plano — 0022 Conexão resiliente ao banco

Data: 15/10/2026. Issue: [#101](https://github.com/SamiaLuvanice/bestprice/issues/101).
Base: `origin/develop` em `73b99e7afe1ba1ee8c95eaa9020e88115ea8fde2`.
Branch: `feature/0022-issue-101-conexao-resiliente-ao-banco`.
Worktree: `.worktrees/feature-0022-issue-101-conexao-resiliente-ao-banco/`.

## Resultado e limites

Endurecer o conjunto de conexões do engine de domínio para sobreviver a pausa/reinício
do pooler compartilhado (Supavisor, modo sessão) sem travar requisições: reutilizar
conexões íntegras, descartar conexões velhas e limitar por prazo a obtenção de conexão.
Nenhuma rota, contrato HTTP, esquema ou migration muda. Este documento prepara a
implementação; nenhum critério de aceite é demonstrado apenas por existir um plano.

O alvo é exclusivamente `create_database_engine()` em `backend/app/db.py`, usado pelas
rotas de domínio via `get_session()`. O health (`backend/app/health.py`) e as migrations
(`backend/alembic/env.py`) criam conexões próprias e ficam fora do escopo.

## Decisões

1. **Ajustar o pool do engine de domínio** (`create_database_engine()`), mantendo o
   comportamento atual e acrescentando os limites:
   - `pool_pre_ping=True` — **mantido**; revalida a conexão ao retirá-la e descarta a
     que estiver morta (cobre o caso obsoleto imediato).
   - `pool_recycle=300` — **novo**; descarta a conexão com idade acima do limite,
     contada desde a sua abertura (`pool_recycle` do SQLAlchemy mede tempo desde a
     criação). Evita reutilizar conexão que o pooler já encerrou.
   - `pool_use_lifo=True` — **novo**; reutiliza a conexão usada há menos tempo, deixando
     as mais antigas expirarem pelo `pool_recycle` em vez de serem mantidas ociosas.
   - `pool_timeout=10` — **novo**; limita a espera por uma conexão do conjunto quando
     todas estão em uso (hoje o padrão de 30 s já é um limite, mas fica explícito).
   - `connect_args={"connect_timeout": 5}` — **novo**; limita a abertura de uma conexão
     nova quando o banco não responde (hoje sem prazo, podendo travar).
   - `pool_size`/`max_overflow` — **mantidos os padrões** (5/10); instância única e
     tráfego baixo não justificam mudança.
2. **Valores como constantes de módulo em `app/db.py`** (`POOL_RECYCLE_SECONDS`,
   `POOL_TIMEOUT_SECONDS`, `CONNECT_TIMEOUT_SECONDS`), no mesmo estilo de `health.py`.
   Motivo: permitir que os testes usem valores curtos por `monkeypatch` + `cache_clear`,
   exercitando o **mesmo caminho de produção**, sem introduzir um novo conjunto de
   variáveis de ambiente nem parâmetros na função.
3. **Contrato REST preservado.** Sem rota, status ou formato de erro novo. A falha por
   estourar o prazo cai no erro já existente para falha de consulta (hoje o FastAPI
   devolve 500 genérico, sem detalhes internos); a única mudança observável é **falhar
   rápido** em vez de esperar indefinidamente. Isto mantém "Alteração de contrato" fora
   de escopo.
4. **Health e migrations intocados.** `health.py` usa `psycopg` direto com
   `connect_timeout=3`; `alembic/env.py` cria engine próprio `NullPool`. Nenhum deles
   usa `create_database_engine()`, então continuam valendo como estão.
5. **Descartadas:** trocar para `NullPool` (fora de escopo; só faz sentido em pooler
   transacional/efêmero) e aplicar `statement_timeout` no engine de domínio (poderia
   interromper operações legítimas). Ambas ficam registradas no fora de escopo da spec.

## Estrutura proposta e propriedade de arquivos

| Responsabilidade | Arquivos previstos | Papel |
|---|---|---|
| Constantes e parâmetros do pool do engine de domínio | `backend/app/db.py` | backend |
| Testes unitários de configuração do engine (sem banco) | novo `backend/tests/test_db_engine.py` | backend |
| Testes de comportamento com PostgreSQL real (reciclo, reuso, prazos) | novo `backend/tests/test_db_engine_integration.py` | backend |
| Evidência e revisão | arquivos desta spec e `docs/PROGRESS.md` | coordenação/QA |
| Documentação final | `docs/database.md` e demais docs afetados; `AGENTS.md`/`CLAUDE.md` se preciso | doc-sync-onboarding |

Um único implementador backend tem posse de `backend/app/db.py` e dos arquivos de teste.
Revisão e QA entram após a fatia. Não há tarefa frontend.

## Contrato REST preservado

Nenhuma rota muda. Relevante para esta spec:

| Método e rota | Entrada | Resposta de sucesso | Erros relevantes |
|---|---|---|---|
| `GET /api/health` | — | 200 `{"status":"ok","database":"ok"}` | 503 `{"status":"unavailable","database":"unavailable"}`, sem detalhes internos |

As rotas de domínio (autenticadas) permanecem com o mesmo contrato documentado em
`docs/`. Falha de banco nessas rotas continua sendo erro não estruturado, sem expor
host, SQL, senha ou stack trace; a mudança é o tempo de resposta, não o formato.

## Comportamento do pool (mecânica)

- **Retirada (checkout):** ao pedir conexão, o conjunto entrega uma conexão íntegra
  disponível (LIFO); se a conexão estiver velha (`pool_recycle`) ou morta
  (`pool_pre_ping`), ela é substituída por uma nova antes de entregar.
- **Devolução (checkin):** a conexão volta ao conjunto para reuso; não é fechada a cada
  requisição, então o número de conexões abertas no banco fica limitado pelo conjunto.
- **Espera por conexão:** se todas estiverem em uso, a espera é limitada por
  `pool_timeout`; ao estourar, o erro é propagado de imediato.
- **Abertura de conexão nova:** limitada por `connect_timeout` na camada do driver; se o
  banco não responde, a abertura falha dentro do prazo.

## Validação e riscos

TDD em fatias: cada teste de comportamento falha pelo motivo esperado antes da mudança,
depois passa com lint. Testes unitários não tocam banco; testes de armazenamento e prazo
usam PostgreSQL real via `TEST_DATABASE_URL` (padrão já usado no repositório, com
`create_database_engine.cache_clear()` entre casos).

| Risco | Demonstração planejada |
|---|---|
| Reciclo não ocorre (conexão velha reutilizada) | Engine com `POOL_RECYCLE_SECONDS` curto; capturar `pg_backend_pid()`, esperar além do limite, retirar de novo e observar PID novo |
| Reuso abre conexões novas (conjunto não limita) | Vários checkouts/checkins em sequência dentro do `pool_size`; mesmo PID e `checkedout()==0` ao final |
| Espera indefinida ao retirar conexão | Engine própria com `pool_size=1`, `max_overflow=0` e `POOL_TIMEOUT_SECONDS` curto; segundo checkout estoura em prazo previsível |
| Espera indefinida ao abrir conexão | Engine com `CONNECT_TIMEOUT_SECONDS` curto apontando para host/porta inalcançável; falha dentro do prazo |
| Regressão em health, migrations ou boot | `test_health.py`, `test_health_integration.py`, `test_domain_migration_integration.py`, `test_stage_start.py` e `alembic upgrade head` continuam passando |

Gates da implementação: `ruff check` e `pytest` no backend com PostgreSQL isolado
(TEST_DATABASE_URL), conforme `quality-gates`, incluindo os testes de integração que não
podem ser pulados; health 200/503 conferido no Compose isolado. QA registra cada
critério de aceite individualmente em `verification.md`. Revisão independente precede
`doc-sync-onboarding`, que é a última etapa após alterações de código; repetir se houver
correção posterior. A PR desta implementação tem base `develop`; promoção a `stage` é
fluxo separado.
