# Verificação da spec 0060

Registro da implementação backend (B1–B5) em 22/11/2026. Worktree
`.worktrees/feature-0060-issue-327-sessao-renovada-e-limpa`, branch
`feature/0060-issue-327-sessao-renovada-e-limpa`, base `origin/develop` `8c860d3`, ponta do código
avaliada **`5a93913`**. [Issue #327](https://github.com/SamiaLuvanice/bestprice/issues/327).

Este registro cobre só o que o agente backend executou. Não afirma resultado de CI, PR, revisão
independente (R1), QA ponta a ponta com a SPA (R2), Stage nem produção, porque nenhum deles foi
observado.

## Fronteiras da evidência

| Camada | Real | Simulado | Limite |
|---|---|---|---|
| pytest HTTP (`test_session_lifetime_http.py`) | Rotas FastAPI, `current_user`, middleware, cookie | SQLite em memória; relógio injetado por `get_clock` (instante inicial em 2031, para denunciar relógio real) | Não exercita PostgreSQL |
| pytest integração | PostgreSQL 17 descartável `bestprice-0060-test-pg` (localhost:55460, sem volume), migrações Alembic reais, `purge_database` com `now_utc` monkeypatchado | Falha do purge simulada (`OperationalError`) no AC07 | Ciclo de limpeza chamado diretamente, sem `cleanup_loop` com intervalo real |
| Fluxo API + SPA | — | — | **Não executado** (pendência R2) |

## Matriz de aceite

| AC | Situação | Red (antes da implementação) | Green / teste |
|---|---|---|---|
| AC01 — Uso prolonga a sessão | aprovado (teste) | `test_ac01_use_extends_…`: `assert 401 == 200` às 43 h (após B2, sem renovação) | `test_session_lifetime_http.py::test_ac01_use_extends_the_session_beyond_the_first_24_hours`; `test_session_purge_integration.py::test_ac01_renewal_is_written_once_per_hour_in_postgresql` (PostgreSQL: `expires_at` 24 h → 44 h após uso às 20 h; uso às 20h40 não regrava; 43 h aceita). Este último foi escrito depois do B3 e passou de primeira (confirmação em PostgreSQL, sem Red próprio) |
| AC02 — Inatividade encerra | aprovado (teste) | `assert 200 == 401` nos dois testes: `current_user` usava `datetime.now` real | `::test_ac02_session_unused_for_24_hours_is_rejected`, `::test_ac02_session_expires_exactly_24_hours_after_the_login_without_use` (corpo `error.code == unauthenticated`) |
| AC03 — Teto absoluto | aprovado (teste) | `assert 200 == 401` (relógio real; teto não verificado) | `::test_ac03_continuous_use_ends_seven_days_after_the_login` (uso a cada 20 h: 7 dias − 1 min → 200; 7 dias → 401); `::test_ac03_ceiling_rejects_a_session_whose_idle_expiry_is_still_ahead` |
| AC04 — Cookie acompanha a sessão | aprovado (teste) | `assert None is not None`: nenhum `Set-Cookie` na renovação | `::test_ac04_renewal_resends_the_cookie_with_the_new_expiry_and_same_attributes` (mesmo token, Max-Age de 86400 s, HttpOnly, `Path=/api`, SameSite=Lax, sem Secure em development); `::test_ac04_renewed_cookie_is_secure_in_stage`; `::test_ac04_requests_within_the_same_hour_do_not_renew`; `::test_ac04_renewed_cookie_never_outlives_the_ceiling` (às 150 h, Max-Age de 64800 s, até o teto de 168 h); `::test_ac04_renewal_cookie_is_sent_on_error_responses_too` (404 de `GET /api/tracked-products/{id}` também leva o cookie) |
| AC05 — Logout imediato | aprovado (teste) | `assert None is not None` (renovação inexistente) | `::test_ac05_logout_after_renewal_ends_the_session_immediately` |
| AC06 — Limpeza das sessões terminadas | aprovado (teste PostgreSQL) | `test_ac06_…`: as 3 sessões terminadas continuavam no banco (`Extra items in the left set`) | `test_session_purge_integration.py::test_ac06_cleanup_cycle_removes_only_finished_sessions_of_any_account` (inatividade, teto vencendo no instante, prazo antigo; ativas de duas contas permanecem) |
| AC07 — Falha na limpeza não derruba | aprovado (teste PostgreSQL) | `assert 'cleanup unavailable' in ''`: o ciclo não chamava purge de sessões | `::test_ac07_session_purge_failure_is_logged_and_does_not_escape` (`_run_cleaner` registra o aviso existente, não propaga e nada é confirmado pela metade) |
| AC08 — Sessões abertas antes da mudança | aprovado (teste PostgreSQL) | `KeyError: 'absolute_expires_at'` / `UndefinedColumn` | `test_session_migration_integration.py::test_upgrade_caps_existing_sessions_at_seven_days_from_creation` (downgrade para `20261113loginfail` remove a coluna; sessão antiga inserida; upgrade mantém `expires_at` e grava `created_at + 7 dias`); `::test_absolute_expiry_is_a_required_utc_instant` (timestamptz, NOT NULL); `::test_ac03_ceiling_rejects_…` (linha com teto anterior ao `expires_at` é recusada) |
| AC09 — Relógio injetado | aprovado (teste) | Os Reds de AC02/AC03 mostram o relógio real em uso | Todos os testes acima usam `get_clock` sobrescrito; nenhum espera o relógio real |

**Correção de regressão pré-existente (AC17 da 0057).** Antes da mudança, a suíte de base em `8c860d3` tinha **1 falha**
(`test_login_flow_integration.py::test_ac17_open_session_keeps_working_while_the_source_is_blocked`,
`assert 401 == 200`): o teste emite a sessão com relógio fixo em 13/11/2026 e `current_user` usava o
relógio real (22/11/2026), então a sessão já parecia vencida. Com `current_user` usando `get_clock`,
o teste passa sem nenhum ajuste no próprio teste (o override de `get_clock` que ele já fazia passou a
valer também em `/api/auth/me`). Red: falha em `origin/develop` `8c860d3`; Green: passa em `5a93913`
(incluído no comando de 24 testes abaixo) e o portão backend fica com **0 failed**.

## Rotas que dependem de `CurrentUser`

`current_user` passou a confirmar a transação quando renova. Conferido em `5a93913`:

- `GET /api/auth/me` (`app/auth/routes.py`).
- `app/products/routes.py`: todas as rotas de `/api/tracked-products` (criar, listar, obter,
  remover, refresh, histórico, alerta POST/GET/PATCH/DELETE), `GET/PATCH /api/notifications` e
  `GET /api/dashboard`.
- `app/research/routes.py`: `research_user` chama `current_user(request, session, clock)` e agora
  recebe o relógio de sessão por `Depends(get_clock)` de `app.auth.routes`.

Em todas, a sessão SQLAlchemy da requisição (`get_session`) chega nova ao `current_user`; nenhuma
dependência anterior (corpo Pydantic, `ClientDep`, `ProviderDep`, `ClockDep`) grava no banco. Logo
nenhuma rota depende de estado pendente anterior ao `current_user`, e o commit da renovação não
confirma trabalho alheio. A suíte inteira passou com a mudança.

## Gates (`5a93913`)

Ambiente: Windows 11, Python 3.13 (`uv`), Docker Desktop 29.1.3, `postgres:17` em container
descartável `bestprice-0060-test-pg` (`-p 55460:5432`, sem volume), removido ao final.
`TEST_DATABASE_URL` apontando para o banco `postgres` desse container em `localhost:55460` (usuário e senha padrão da imagem, só locais).

| Comando | Resultado |
|---|---|
| `node .agents/scripts/gates.mjs --scope backend` (raiz) | install ✔, lint ✔ (`ruff check .`: All checks passed!), test ✔: **563 passed, 2 skipped** em 115,53 s |
| skips | `tests/test_stage_start.py:22` (2): script de partida POSIX só roda na imagem Linux |
| `uv run pytest -q tests/test_session_migration_integration.py tests/test_session_purge_integration.py tests/test_session_lifetime_http.py tests/test_login_flow_integration.py` | **24 passed**, 0 skipped |
| `python .agents/skills/cyclomatic-complexity/scripts/complexity_report.py backend/app --changed origin/develop` | 82 blocos, média 2,06 (A); A 75 · B 7; nenhum bloco ≥ C |
| Base `8c860d3`, antes de qualquer mudança: `uv run pytest -q` | 546 passed, 2 skipped, **1 failed** (AC17 da 0057, explicado acima) |

## Documentação

- `docs/apps/backend.md`: duração da sessão atualizada (24 h sem uso, teto de 7 dias, renovação
  no máximo por hora com cookie reenviado, purge no ciclo de limpeza).
- `node .agents/scripts/docs-impact.mjs` também aponta `docs/architecture.md` e `docs/database.md`
  (nova coluna `user_sessions.absolute_expires_at`): **pendente** para o `doc-sync-onboarding` (R3).

## Pendências

- R1 revisão independente, R2 QA ponta a ponta (API + SPA, sessão continua após renovação e
  expira), R3 sincronização de `docs/architecture.md` e `docs/database.md`, R4 PR.
- Sem push nem PR nesta etapa.
