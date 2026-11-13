# Verificação da spec 0054

Registro do QA em 13/11/2026. Worktree
`.worktrees/feature-0054-issue-128-limite-tentativas-login`, branch
`feature/0054-issue-128-limite-tentativas-login`, base `origin/develop` `dbbe496`, ponta avaliada
**`ae20bce`** (sem alterações locais de código). [Issue #128](https://github.com/SamiaLuvanice/bestprice/issues/128).

O QA começou em `af8d15e`. Durante a rodada entraram `a2ceece` (`record_success` passa a rodar na
sessão da requisição), `1dc7285` (`waitText` reutiliza `retryHint`, mesmo texto) e `ae20bce`
(`plan.md`). Os gates, o fluxo HTTP, o fluxo na UI, o AC08 e o health foram **reexecutados em
`ae20bce`** com uvicorn e Vite reiniciados. Os números abaixo são de `ae20bce`, salvo quando
marcado `af8d15e`.

Saídas e capturas em [qa/](qa/): `qa/saidas/` (`ae20bce`), `qa/saidas/af8d15e/` (rodada
anterior), `qa/capturas/` e os scripts `qa/e2e-curl.sh`, `qa/e2e-curl-success.sh` e
`qa/ac08_http.py`. Este registro não afirma resultado de CI, PR, Project, release nem Stage,
porque nenhum deles foi observado.

## Fronteiras da evidência

| Camada | Real | Simulado | Limite |
|---|---|---|---|
| pytest | Código, PostgreSQL 17 descartável `bestprice-0054-test-pg` (localhost:55454), migrações, relógio injetado nas integrações | Dublê do limitador e SQLite nos testes HTTP de outras áreas (`tests/conftest.py`) e em `test_login_http.py` | Os 80 testes `test_login_*` rodaram sem skip; os de integração usam o limitador real no PostgreSQL |
| QA ponta a ponta (I1) | API uvicorn (127.0.0.1:8054), SPA Vite (127.0.0.1:5154, proxy `/api`), PostgreSQL 17 descartável `bestprice-0054-qa-pg` (127.0.0.1:55455), Chrome real | Origens distintas via `x-bestprice-client-ip` com `TRUSTED_PROXY_SECRET` local (o proxy do Pages não rodou); o navegador usou o peer 127.0.0.1 | **Compose não rodou**; usados os três serviços reais locais. Limites baixos por ambiente: 3 por origem + e-mail, 5 por origem, janela de 1 min |
| Viewport | Chrome real | 1440 px e 390 px por `iframe` de largura fixa, na mesma origem | A janela do navegador só oferece 1359 px de viewport (painel lateral). A tela direta foi observada em 1359 px; 1440 e 390 exatos, via `iframe` |
| Vitest | Render, jsdom | Respostas HTTP por `fakeApi` | — |

## Matriz de aceite

| AC | Situação | Observado em execução real (I1, `ae20bce`) | Coberto por teste |
|---|---|---|---|
| AC01 — Uso normal preservado | aprovado | Origem 203.0.113.70: 2 × 401 e senha correta → 200 (escala 3). UI: após o bloqueio e a espera, login → `/app/dashboard`, `/api/auth/me` 200 (`qa/saidas/e2e-ae20bce.txt`) | `test_login_flow_integration.py::test_ac01_nine_failures_then_correct_password_logs_in`; `test_login_limiter_integration.py::test_nine_failures_then_correct_password_logs_in` |
| AC02 — Limite origem + e-mail | aprovado | Origem A: 3 × 401, depois senha correta → `429`, `retry-after: 60`, `login_rate_limited`, mensagem do contrato, **sem `Set-Cookie`** | `test_login_flow_integration.py::test_ac02_ac09_ac04_combination_blocked_even_with_correct_password_then_recovers`; `test_login_limiter_integration.py::test_tenth_failure_blocks_the_combination_until_the_oldest_leaves_the_window`; `test_login_http.py::test_rate_limited_login_is_refused_before_credentials_even_with_correct_password` |
| AC03 — Limite por origem | aprovado | Origem C: 4 falhas em e-mails diferentes + 1 corpo malformado (422); depois e-mail sem falhas próprias com senha correta → 429 e corpo malformado → 429 | `test_login_flow_integration.py::test_ac03_ac04_source_blocked_for_any_email_and_malformed_body_then_recovers`; `test_login_limiter_integration.py::test_fifty_failures_across_emails_block_the_source_for_any_email_and_malformed_body`, `::test_malformed_bodies_count_only_for_the_source`; `test_login_http.py::test_rate_limit_is_evaluated_before_parsing_the_body` |
| AC04 — Recuperação após a janela | aprovado | Após 1 min, senha correta: origem A (bloqueada por combinação) → 200; origens C e 203.0.113.70 (bloqueadas por origem) → 200. UI entrou após a espera | testes de AC02 e AC03 acima (relógio fixo, padrão de 15 min) |
| AC05 — Sucesso zera só a combinação | aprovado | Escala 3/5, origem 203.0.113.70: 2 × 401, 200; mais 2 × 401, **200** (combinação zerada). Em seguida, 1 falha em outro e-mail (5ª da origem) e o próximo envio → **429**, mostrando que a contagem por origem manteve as 4 falhas anteriores. No `psql`, essa origem tem 5 linhas e só 1 com `account_hash` (as 4 da combinação ficaram com `account_hash` nulo) | `test_login_flow_integration.py::test_ac05_success_resets_only_the_combination`; `test_login_limiter_integration.py::test_success_clears_only_the_combination_and_keeps_the_source_count`, `::test_success_does_not_clear_the_same_email_from_another_source` |
| AC06 — Outra origem não é bloqueada | aprovado | Origem A bloqueada para `qa0054@…`; origem B → 200 + `Set-Cookie`; também origem 203.0.113.82 → 200 com 203.0.113.81 bloqueada | `test_login_flow_integration.py::test_ac06_owner_logs_in_from_another_source` |
| AC07 — Sem revelar a conta pela resposta | aprovado | Origem D (e-mail com conta) e E (sem conta): 3 × 401 idênticos e o 4º → 429 com `retry-after: 60` e corpo idêntico | `test_login_flow_integration.py::test_ac07_existing_and_missing_accounts_are_counted_and_refused_the_same_way`; `test_login_http.py::test_rate_limited_answer_does_not_depend_on_the_account_existing` |
| AC08 — Sem revelar a conta pelo tempo | aprovado | Medição fora do processo: uvicorn e PostgreSQL reais, cliente HTTP da stdlib, origem distinta por envio, tipos intercalados e 3 envios de aquecimento. Em `ae20bce`, duas rodadas de 30 + 30: medianas **82,5 × 92,8 ms (11,1%)** e **84,5 × 87,5 ms (3,4%)**. Em `af8d15e`: 85,1 × 88,7 ms (4,0%) e 75,8 × 84,8 ms (10,6%). Todas abaixo de 20% (`qa/saidas/ac08-http-ae20bce.txt`). Os implementadores mediram 71,1 × 71,1 ms dentro do processo | `test_login_http.py::test_every_credential_failure_runs_exactly_one_scrypt_of_equal_cost`, `::test_dummy_hash_uses_the_same_scrypt_parameters_as_real_hashes` |
| AC09 — Recusa não estende o bloqueio | aprovado | Origem A: 429 com `retry-after: 60`; 2 s depois, um envio errado e um correto → ambos `58`. A espera diminuiu e não aumentou. O bloqueio por origem (AC03) não foi repetido durante a espera em I1 | `test_login_flow_integration.py::test_ac02_ac09_ac04_…`, `::test_ac03_ac04_…` |
| AC10 — Maior espera vence | aprovado (só teste) | Não reproduzido em I1 | `test_login_flow_integration.py::test_ac10_largest_wait_is_reported`; `test_login_limiter_integration.py::test_largest_wait_wins_when_the_combination_wait_is_longer`, `::test_largest_wait_wins_when_the_source_wait_is_longer` |
| AC11 — Envios simultâneos | aprovado (só teste) | Não reproduzido em I1 | `test_login_concurrency_integration.py::test_ac11_twenty_parallel_wrong_passwords_after_nine_failures_record_at_most_one`, `::test_ac11_twenty_parallel_correct_passwords_after_ten_failures_open_no_session`, `::test_parallel_reservations_on_the_limiter_never_exceed_the_limit`, `::test_reservation_waits_for_the_source_lock_held_by_another_transaction` (PostgreSQL real, 20 threads) |
| AC12 — Várias instâncias | aprovado (só teste) | Não reproduzido com duas APIs em I1 | `test_login_concurrency_integration.py::test_ac12_failures_split_between_two_instances_share_the_limit` (duas engines no mesmo PostgreSQL) |
| AC13 — Configuração | aprovado | A API iniciou com `LOGIN_RATE_LIMIT_*` = 3/5/1 e aplicou esses limites (I1). Em `af8d15e`, o início real foi recusado com `SOURCE=2 < ACCOUNT=3` e com `WINDOW=1441`, com mensagens claras, sem segredos e saída 3 (`qa/saidas/af8d15e/startup.txt`). Os commits seguintes não alteram `settings.py` | `test_login_settings.py::test_defaults_are_ten_per_account_fifty_per_source_in_fifteen_minutes`, `::test_custom_values_are_read_from_environment`, `::test_values_out_of_range_fail_fast`, `::test_range_limits_are_inclusive`, `::test_source_limit_below_account_limit_fails`, `::test_error_messages_never_echo_secret_values`, `::test_lifespan_refuses_invalid_login_limits` |
| AC14 — Ambiente implantado sem origem confiável | aprovado (local; Stage não verificado) | Em `af8d15e`, com `APP_ENV=stage`, `SIGNUP_ENABLED=false` e sem segredos, a API respondeu "TRUSTED_PROXY_SECRET é obrigatório em stage/production (limite de login)" e "Application startup failed", com saída 3. Localmente, sem `SIGNUP_SOURCE_HASH_SECRET` e sem proxy, a API iniciou e limitou | `test_login_settings.py::test_deployed_environment_requires_both_secrets_even_with_signup_off`, `::test_lifespan_refuses_stage_without_secrets_even_with_signup_off`, `::test_lifespan_starts_locally_without_secrets`, `::test_lifespan_starts_in_stage_with_both_secrets`, `::test_local_without_hash_secret_uses_one_random_secret_per_process` |
| AC15 — Sigilo e retenção | aprovado | `login_failures` com 197 linhas: `source_hash` e `account_hash` são só hexadecimais de 64. Houve 0 ocorrências de e-mails, IPs, senhas e dos dois segredos no log do uvicorn (234 POSTs de login, nenhum 500) e no log do PostgreSQL. Em `af8d15e`, o dump da tabela também teve 0 ocorrências de texto em claro. As falhas vencidas da própria origem foram apagadas na reserva: o `DELETE` antes da rodada encontrou 0 linhas antigas. O purge horário só tem evidência de teste | `test_login_privacy_integration.py::test_passwords_emails_and_source_ips_never_leak`, `::test_hourly_cleanup_purges_expired_login_failures`, `::test_cleanup_uses_the_configured_login_window`; `test_login_migration_integration.py::test_login_failures_table_stores_only_keyed_hashes_and_instants`; `test_login_limiter_integration.py::test_purge_removes_only_expired_rows` |
| AC16 — Interface | aprovado | No Chrome real, com SPA → Vite → API → PostgreSQL, 3 senhas erradas mostram "E-mail ou senha inválidos." A 4ª tentativa, com a senha correta, mostra **"Muitas tentativas de login. Tente novamente em 1 minuto."** em um único `role="alert"`. O e-mail fica mantido, a senha fica vazia e o foco vai para a senha. Observado em 1359 px na tela direta e em **1440 px e 390 px** via `iframe`, nos dois casos com senha correta recusada, sem rolagem horizontal (`qa/capturas/i1-ae20bce-429-iframes-1440-390.jpg`; capturas de `af8d15e`: `i1-429-desktop-1359.jpg`, `i1-429-iframe-1440.jpg`, `i1-429-iframe-390.png`). Após a janela, o login teve sucesso. O plural ("N minutos") só tem evidência de teste, porque a janela de I1 era de 1 min | `App.test.tsx` (429 com N minutos `it.each`, "usa a mensagem do servidor no 429 de login sem tempo de espera", "mostra envio ocupado …, mantém o e-mail e apaga a senha após 401 …", "mostra falha de conexão no login, mantém o e-mail e apaga a senha"); `LoginForm.test.tsx` ("após falha mostra um único alerta, mantém o e-mail, apaga a senha e foca o campo Senha", "não apaga a senha quando o alerta muda sem um envio em curso"); `lib/format.test.ts` (`waitText`, "preserva o texto do cadastro") |
| AC17 — Contas e sessões preservadas | aprovado | Sessão aberta pela origem 203.0.113.80. A origem 203.0.113.81 foi bloqueada para o mesmo e-mail (3 × 401, depois 429). Com o cookie, `GET /api/auth/me` → 200 e `GET /api/dashboard` → 200 | `test_login_flow_integration.py::test_ac17_open_session_keeps_working_while_the_source_is_blocked` |

Observações de I1 sobre comportamento esperado (não são falhas):

- Janela deslizante (em `af8d15e`): quando a falha mais antiga sai da janela, o envio seguinte volta
  a receber 401 e o próximo recebe 429 de novo, como o contrato define.
- `422` real: `Content-Type: text/plain` e JSON truncado → `validation_error` com
  `fields[body].code = json_required`.

## Health, banco e rede

| Cenário | Comando | Resultado |
|---|---|---|
| Health com PostgreSQL no ar (`ae20bce`) | `curl -i http://127.0.0.1:8054/api/health` | `200 {"status":"ok","database":"ok"}` |
| Health com PostgreSQL parado (`ae20bce`) | `docker stop bestprice-0054-qa-pg`; mesmo `curl` | `503 {"status":"unavailable","database":"unavailable"}` |
| Health após `docker start` (`ae20bce`) | mesmo `curl` | `200` |
| Login com PostgreSQL parado (`af8d15e`) | `curl -i -X POST …/api/auth/login` | `500 text/plain`, comportamento pré-existente igual ao O5 da 0048 |
| Falha de rede na UI (`af8d15e`) | formulário carregado, Vite encerrado e envio pelo formulário | alerta "Não foi possível conectar ao BestPrice. Tente novamente.", e-mail mantido e senha vazia. Os commits seguintes não tocam esse caminho; `App.test.tsx` cobre o caso em `ae20bce` |

Com a API fora do ar e o Vite no ar, o proxy do Vite responde `502 text/plain`. Nesse caso,
`/login` mostra "Não foi possível concluir a operação. Tente novamente." com "Tentar novamente"
(verificação de sessão, comportamento anterior à 0054).

## Gates (`ae20bce`)

Backend, em `backend/` (`qa/saidas/backend-gates-ae20bce.txt`):

| Comando | Resultado |
|---|---|
| `uv run ruff check .` | All checks passed! |
| `TEST_DATABASE_URL=postgresql://bestprice:***@localhost:55454/bestprice_test uv run pytest -q -p no:cacheprovider -rs` | **547 passed, 2 skipped** em 56,01 s. Skips: `test_stage_start.py` (script POSIX). Em `af8d15e`: 546 passed, 2 skipped |
| mesmo, só `tests/test_login_*.py` | **80 passed**, 0 skipped (em `af8d15e`: 79) |
| `python .agents/skills/cyclomatic-complexity/scripts/complexity_report.py backend/app --changed origin/develop` (na raiz) | 207 blocos, média 2,81 (A); nenhum bloco ≥ D; os blocos C são testes |

Frontend, em `frontend/` (`qa/saidas/frontend-gates-ae20bce.txt`):

| Comando | Resultado |
|---|---|
| `npm run lint` | saída 0 |
| `npm test -- --run` | **Test Files 61 passed (61), Tests 838 passed (838)** |
| `npm run build:check` | `✓ built in 1.49s`, checagens de catálogo e fontes ok, saída 0 |

Instabilidade observada em `af8d15e`: a primeira execução do Vitest rodou em paralelo com pytest
e com os servidores. Nela, `src/dashboard/detail.test.tsx` falhou (837/838); o arquivo está fora
do diff. Isolado, passou com 27 testes, e as duas execuções completas seguintes passaram com 838.
É o mesmo padrão da Issue #247.

## Revisão independente

Não foi executada por este QA. A tarefa R1 (`arch-reviewer`) segue pendente em `tasks.md`.

## Limites conhecidos

- Compose não rodou; foram usados os três serviços reais locais (uvicorn, Vite e PostgreSQL em
  contêiner).
- AC10, AC11 e AC12 só têm evidência de teste (PostgreSQL real), sem reprodução em I1.
- AC04, AC05 e AC09 foram observados em tempo real só com limites 3/5 e janela de 1 min. Os valores
  padrão estão cobertos com relógio fixo.
- AC13 (recusas de início) e AC14 foram observados na partida real em `af8d15e`. Os commits
  posteriores não alteram as configurações.
- Viewport: 1440 px e 390 px foram observados via `iframe`; a tela direta do navegador chegou a
  1359 px. Não houve comparação com o Figma, porque a spec assume o alerta existente, sem quadro
  próprio.
- Não houve teste com leitor de tela real; o anúncio foi verificado pelo papel `role="alert"` no
  DOM.
- No AC08, o caso "campo acima do máximo" teve mediana de 4% a 18% menor que a senha errada (não
  consulta o banco). O critério numérico da spec compara só e-mail sem conta com senha errada.
- Login com o banco fora do ar responde `500 text/plain` (comportamento pré-existente).
- A origem real atrás do Cloudflare Pages não foi verificada; só o cabeçalho do proxy local foi
  usado.

## Pendências explícitas

- R1: revisão independente (`arch-reviewer`) do diff completo.
- R3: `doc-sync-onboarding` por último.
- R4: PR para `develop` com `Closes #128`; CI não foi observado.
- Stage (fora deste QA): antes da promoção, conferir `TRUSTED_PROXY_SECRET` e
  `SIGNUP_SOURCE_HASH_SECRET` no Render e `API_PROXY_SECRET` no Pages, porque com o AC14 a API não
  sobe sem eles. Depois, verificar a origem real atrás do Pages.
- Decidir se `qa/` (saídas, capturas e scripts) deve ser versionado; nada foi commitado. O
  contêiner `bestprice-0054-qa-pg` foi parado, mas não removido.
