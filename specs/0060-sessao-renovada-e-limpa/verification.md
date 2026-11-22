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

- R1 revisão independente, R3 sincronização de `docs/architecture.md` e `docs/database.md`, R4 PR.
  R2 (QA ponta a ponta) registrada na seção abaixo.
- Sem push nem PR nesta etapa.

## QA (R2)

Registro do agente QA em 22/11/2026, na mesma worktree e branch, ponta avaliada **`fb6f211`**
(código igual a `5a93913`; os commits seguintes são só documentação). Nenhum código de produção foi
alterado. Saídas brutas em [`qa/`](qa/): tokens truncados em 6 caracteres, banco identificado só
pelos 12 primeiros caracteres do hash. Nenhuma senha, segredo ou token completo foi gravado (conferido
por busca nos arquivos).

### Fronteiras da evidência

| Camada | Real | Simulado | Limite |
|---|---|---|---|
| Fluxo HTTP | uvicorn `app.main:app` (127.0.0.1:8060, `APP_ENV=development`), PostgreSQL 17 descartável `bestprice-0060-qa-pg` (127.0.0.1:55464, sem volume), migrações Alembic reais, `curl` com cookie jar | Passagem do tempo: `created_at`, `expires_at` e `absolute_expires_at` recuados/ajustados por `UPDATE` no `psql` (a API usa o relógio real) | Não houve espera real de horas ou dias; `cleanup_loop` não foi observado no intervalo de 1 h, só na partida |
| SPA | Chrome real (Claude in Chrome), Vite 127.0.0.1:5160 com proxy `/api` → 8060 | Mesma manipulação de instantes no banco | Viewport única (1100 px); `Secure` em Stage não observado (só teste `::test_ac04_renewed_cookie_is_secure_in_stage`) |
| Conta | `provision_user` de `app.auth.provision` contra o banco do QA | — | **`uv run python -m app.auth.provision` não foi usado**: o `getpass` no Windows lê o console e não o stdin canalizado (o comando terminou sem criar a conta). As duas contas foram criadas chamando a mesma função `provision_user` por `uv run python -c` |
| Stage / CI / PR | — | — | Não observados |

Configuração do ambiente: na primeira partida usei `DATABASE_URL=postgresql+psycopg://…`; o health
respondeu `503` (`ProgrammingError`), porque `app/health.py` passa a URL direto ao psycopg. Erro meu de
configuração (o formato documentado é `postgresql://…`); com ele a API e o health ficaram `200`. Não é
efeito da 0060.

### Matriz de aceite (R2)

| AC | Veredito | Observado em execução real | Saída |
|---|---|---|---|
| AC01 — Uso prolonga | **aprovado** | S5: sessão com login há 43 h e `expires_at` em +1 h (última renovação às 20 h). `GET /api/dashboard` → **200** com `Set-Cookie` de renovação (valor de sessão inalterado, idade máxima de 86400 s); no banco `expires_at` passou a `now()+24h` e o teto ficou intacto (5 dias 4 h restantes) | `qa/http-flow.txt` |
| AC02 — Inatividade encerra | **aprovado** | S7: `expires_at` vencido há 1 min, teto a 5 dias 18 h → `/api/auth/me` e `/api/dashboard` **401 `unauthenticated`**, sem `Set-Cookie`. Na SPA: sessão renovada pela navegação, depois `expires_at` vencido no banco; ao abrir Monitoramento a interface foi para `/login?returnTo=%2Fapp%2Fmonitoring` com o alerta "Entre para continuar." | `qa/http-flow.txt`, `qa/ui-ac02-inatividade-volta-ao-login.jpg` |
| AC03 — Teto absoluto | **aprovado** | S8: login real, `absolute_expires_at` vencido há 1 min e `expires_at` em +23 h 55 min (uso recente) → **401** em `/me` e `/dashboard`. Fronteira: teto em +1 min → 200 sem renovação. Na SPA: novo login, teto vencido no banco, recarga de `/app/dashboard` → tela de login (`returnTo=%2Fapp%2Fdashboard`); na carga inicial a tela não mostra o alerta, igual ao que já acontecia para sessão ausente | `qa/http-flow.txt`, `qa/ui-ac03-teto-volta-ao-login.jpg` |
| AC04 — Cookie acompanha | **aprovado** (Stage só teste) | Login: `HttpOnly; Max-Age=86400; Path=/api; SameSite=lax`, sem `Secure` em development. S2: três requisições na mesma hora → sem `Set-Cookie` e `expires_at` sem escrita. S3: instantes recuados 70 min → `Set-Cookie` com o **mesmo valor de sessão** e os mesmos atributos, idade máxima de 86400 s; o cookie jar do curl manteve o token e passou a expirar em agora + 86 399 s; a requisição seguinte não renovou. S4: renovação também na resposta **404** de `GET /api/tracked-products/{id}`. S6: teto em 22 h e `expires_at` em 20 h → `Max-Age=79199` e `expires_at = absolute_expires_at` (não passa do teto). SPA: após recuo de 70 min, a navegação gravou `expires_at = now()+24h` e o recarregamento seguinte continuou autenticado | `qa/http-flow.txt` |
| AC05 — Logout imediato | **aprovado** | S9: login, recuo de 2 h, `/me` → 200 com `Set-Cookie` de renovação; `POST /api/auth/logout` → **204** com `Set-Cookie` de exclusão (`Max-Age=0`, valor vazio); 0 linhas da sessão no banco; o mesmo cookie em `/me`, `/dashboard` e `/tracked-products/{id}` → **401**, nenhum `Set-Cookie` que recrie a sessão | `qa/http-flow.txt` |
| AC06 — Limpeza | **aprovado** | Antes do ciclo havia 8 sessões nas duas contas: 5 terminadas (inatividade nas contas A e B, teto nas contas A e B e "prazo antigo" na conta B) e 3 válidas (2 da A, incluindo as duas emitidas antes da migração, e 1 da B). `uv run python -m app.research.cleanup` → ficaram **só as 3 válidas**; elas seguem com `200` em `/me` e as removidas recebem `401`. Na partida da API, o ciclo também removeu a sessão antiga vencida (`legacy_expired`) | `qa/ac06-cleanup.txt`, `qa/ac08-backfill.txt` |
| AC07 — Falha na limpeza | **aprovado** (falha total do banco; falha só do purge de sessões, só teste) | `docker stop` do PostgreSQL e partida da API: o log mostra `Research expiration cleanup unavailable; expired records remain inaccessible.` e o processo segue no ar; `/api/health` → `503 {"status":"unavailable",…}`. Após `docker start`: health `200` e a mesma sessão `/me` → `200`. Com o banco fora, `/me` → `500` (comportamento anterior, igual ao login na 0057). Nenhuma senha nem token no log do uvicorn | `qa/ac07-banco-indisponivel.txt` |
| AC08 — Sessões anteriores | **aprovado** | Na revisão `20261113loginfail`, foram inseridas 3 sessões no formato antigo. `alembic upgrade head` → coluna `absolute_expires_at timestamptz NOT NULL`, `absolute_expires_at - created_at = 7 days` nas 3, `expires_at` preservado. `legacy_recent` (23 h): 200 e renovada para +24 h (dentro do teto). `legacy_near_ceiling` (expires_at +10 h, teto em ~28 min): 200 **sem** renovação; término efetivo = teto, sem sobrevida. `legacy_expired`: 401 e removida na partida | `qa/ac08-backfill.txt` |
| AC09 — Relógio injetado | **aprovado** (teste) | Fora do escopo do fluxo real; conferido na suíte (abaixo) | — |

### Gates reexecutados pelo QA (`fb6f211`)

PostgreSQL de teste: banco `bestprice_test` no mesmo container do QA, apontado por `TEST_DATABASE_URL`.

| Comando | Resultado |
|---|---|
| `node .agents/scripts/gates.mjs --scope backend` | install ✔, lint ✔ (`All checks passed!`), test ✔: **563 passed, 2 skipped** em 120,77 s (skips: `test_stage_start.py`, POSIX) |
| `uv run pytest -q -rs tests/test_session_migration_integration.py tests/test_session_purge_integration.py tests/test_session_lifetime_http.py` | **16 passed**, 0 skipped |

Frontend não foi alterado pela spec e seus portões não foram reexecutados nesta QA.

### Observações (não bloqueiam o aceite)

- **O1 — Saída da limpeza manual.** `python -m app.research.cleanup` imprime só "Pesquisas expiradas
  removidas: 0" e não informa quantas sessões removeu (`purge_expired_sessions` devolve a contagem, mas
  `purge_database` não a usa). Só a verificação no banco mostra o efeito.
- **O2 — Corrida logout × renovação (hipótese, não reproduzida).** Se uma requisição renova a sessão
  enquanto o logout dela é confirmado em paralelo, o `UPDATE` do ORM pode afetar 0 linhas e o SQLAlchemy
  pode levantar `StaleDataError` (500 em vez de 401). A janela é de milissegundos e não houve teste
  nem reprodução.
- **O3 — `created_at` e teto.** `created_at` vem do `now()` do banco e `absolute_expires_at` do relógio da
  API, com diferença observada de cerca de 0,09 s. O efeito é desprezível.

### Bugs

Nenhum bug encontrado nos cenários executados.

### Limpeza do ambiente

uvicorn e Vite encerrados (um processo filho do Vite em 5160 sobreviveu ao fim da tarefa e foi
finalizado pelo PID). O container `bestprice-0060-qa-pg` foi removido. As portas 8060, 5160 e 55464
ficaram livres.
