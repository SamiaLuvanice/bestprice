# Evidência do backend — 0048

Worktree `.worktrees/feature-0048-issue-252-cadastro-self-service`, branch
`feature/0048-issue-252-cadastro-self-service`, base `d1acd81`.

## Ambiente de teste

Docker Desktop não estava em execução (`docker ps` → `failed to connect to the docker API at
npipe:////./pipe/dockerDesktopLinuxEngine`). Para não depender dele nem tocar no serviço
PostgreSQL já instalado na máquina, foi criado um cluster PostgreSQL 18 descartável,
exclusivo desta tarefa, com os binários locais:

- `initdb -D <scratchpad>/pg0048 -U bestprice -A scram-sha-256 -E UTF8 --locale=C`
- `pg_ctl -D <scratchpad>/pg0048 -o "-p 55448 -c listen_addresses=127.0.0.1" start` → `server started`
- `createdb -h 127.0.0.1 -p 55448 -U bestprice bestprice_test` → ok

`TEST_DATABASE_URL=postgresql://bestprice:***@127.0.0.1:55448/bestprice_test` em todos os
comandos abaixo que citam PostgreSQL. Nenhum container, volume ou banco preexistente foi alterado.

Baseline antes de qualquer mudança (`backend/`):

| Comando | Resultado |
|---|---|
| `uv sync --locked --extra dev` | ok |
| `uv run ruff check .` | All checks passed! |
| `uv run pytest -q -p no:cacheprovider -rs` (com `TEST_DATABASE_URL`) | **302 passed, 2 skipped** em 124,51 s. Skips: `test_stage_start.py` (script POSIX, só na imagem Linux). |

## B0 — `CF-Connecting-IP` na Pages Function

Fonte oficial: [Cloudflare HTTP headers](https://developers.cloudflare.com/fundamentals/reference/http-headers/)
(consultada em 06/11/2026).

Observado (citações da página):

- `CF-Connecting-IP` "provides the client IP address connecting to Cloudflare to the origin web server".
- Sobre Workers sem subrequest (caso da Pages Function, que recebe a requisição do
  visitante): "`cf-connecting-ip` reflects the client's IP address" e "the `x-real-ip`
  header is stripped".
- Só em subrequests de Worker na mesma zona o valor passa a refletir `x-real-ip`, que o
  script pode alterar; em subrequests entre zonas vira `2a06:98c0:3600::103`. A
  Function lê o cabeçalho da requisição **recebida**, não de um subrequest, então esse caso
  não se aplica à leitura; ele só reforça que a API não pode confiar no `CF-Connecting-IP`
  que **ela** recebe do `fetch` da Function (daí o cabeçalho próprio assinado).
- Com Pseudo IPv4 em "Overwrite Headers", o valor vira um IPv4 pseudo; não usamos essa opção.

Apoio não oficial: um membro da equipe da Cloudflare no canal Cloudflare Developers
([answeroverflow](https://www.answeroverflow.com/m/1215650658837991527)) afirma que o
`cf-connecting-ip` é imutável por segurança, com exceção dos subrequests da mesma zona.
Incidentes como [GHSA-73p3-rqpv-59wx](https://github.com/hestiacp/hestiacp/security/advisories/GHSA-73p3-rqpv-59wx)
mostram o risco oposto: uma origem que aceita o cabeçalho de qualquer cliente. A decisão 3
do plano já evita isso, porque a API só aceita a origem com o segredo do proxy.

Inferência: a documentação oficial confirma que, na requisição que chega à Function, o
cabeçalho traz o IP do visitante. Ela não diz explicitamente que um valor enviado pelo
cliente é sobrescrito; isso vem da declaração da equipe da Cloudflare citada acima, não da
documentação. A decisão 3 do plano se mantém. A prova real (6 envios de um IP e 1 de outro
atrás do Pages) continua pendente até o interruptor ser ligado em Stage (I3).

## B1 — Regras de conta (`tests/test_account_rules.py`)

- Red: `uv run pytest -q -p no:cacheprovider tests/test_account_rules.py` →
  `ModuleNotFoundError: No module named 'app.auth.accounts'` (1 error na coleta). Motivo esperado.
- Green: `app/auth/accounts.py` com `EMAIL_PATTERN`, `normalize_email` e
  `account_rule_violations` → **30 passed**. Casos: `a@b`, `a@b.`, `a b@c.com`, `a@@b.com`,
  `a@b..com`, `@b.com`, `a@.com`, NBSP e EM SPACE → `email_invalid`; `ana@exemplo.com.br` e
  domínio acentuado aceitos; 320/321 contando espaços (321 → `email_too_long` antes do strip);
  senha 11/12 e 1024/1025; 12 emojis aceitos (code points); os dois campos de uma vez.

## B2 — `add_account`

- Red: 4 testes novos → `ImportError: cannot import name 'add_account' / 'AccountRuleError' /
  'EmailAlreadyRegistered'` (**4 failed, 30 passed**). Motivo esperado.
- Green: `add_account` valida, gera hash `scrypt$`, faz `flush` sem commit; em
  `IntegrityError` faz rollback, confirma por `SELECT` e levanta `EmailAlreadyRegistered`
  (relança se o e-mail não existir) → **34 passed**. Refactor: imports subidos ao topo; 34 passed;
  `ruff check` ok.

## B3 — CLI e login alinhados

- Red: `uv run pytest -q -p no:cacheprovider tests/test_user_provision.py tests/test_auth_http.py`
  → **9 failed, 2 passed**. Motivos: `DID NOT RAISE AccountRuleError` (321 por espaços, `a@b`,
  senha 1025 aceitos pela CLI antiga), `ValueError: Senha muito curta` em vez de
  `AccountRuleError`, mensagem de duplicado antiga (`Usuário já existe`), prompt
  `Senha (mínimo 12 caracteres)` e `DID NOT RAISE SystemExit`. Os 2 que passaram são o login
  existente e o teste de regressão "conta `a@b` gravada no banco ainda entra", que já passava
  por desenho (o login não muda de comportamento).
- Green: `provision_user` passa a chamar `add_account` + `commit`; `AccountRuleError` traz as
  mensagens em português, que `main` repassa a `parser.error`; prompt "Senha (12 a 1024
  caracteres)". → **45 passed** (regras, CLI e auth).
- Refactor: o login usa `EMAIL_MAX_CHARS`, `PASSWORD_MAX_CHARS` e `normalize_email` e a
  emissão de sessão vira `issue_session(session, response, user, now)`, reaproveitada pelo
  cadastro. `ruff check` ok; 45 passed.

## B4 — Configuração do cadastro (`tests/test_signup_settings.py`)

- Red 1: `uv run pytest -q -p no:cacheprovider tests/test_signup_settings.py` →
  `ModuleNotFoundError: No module named 'app.auth.settings'`. Motivo esperado.
- Red 2 (após `settings.py`): **1 failed, 19 passed** — `test_lifespan_refuses_to_start_with_invalid_signup_configuration`
  com `DID NOT RAISE RuntimeError`: o `lifespan` ainda não validava. Motivo esperado.
- Green: `signup_settings()` chamado no início do `lifespan` → **20 passed**. Cobertos: padrões
  `false`/5/60; só `true` liga; 2/10 min lidos do ambiente; 0, 1001, texto, janela 0 e 1441,
  segredo curto → `RuntimeError` com o nome da variável e sem o valor; ligado sem
  `SIGNUP_SOURCE_HASH_SECRET` falha em development/test/stage/production; ligado em
  stage/production sem `TRUSTED_PROXY_SECRET` falha; local sem segredo do proxy inicia;
  `lifespan` em stage com cadastro desligado e sem segredos inicia.

## B5 — Origem do cadastro (`tests/test_signup_source.py`)

Pré-requisito B0 registrado acima antes deste Red.

- Red: `uv run pytest -q -p no:cacheprovider tests/test_signup_source.py` →
  `ModuleNotFoundError: No module named 'app.auth.limiter'`. Motivo esperado.
- Green: `app/auth/limiter.py` com `normalize_source`, `source_hash` e `signup_source_key`
  → **16 passed**. Cobertos: segredo correto + IP válido usa o cabeçalho; sem segredo,
  segredo errado ou vazio, IP inválido, lista de IPs e `X-Forwarded-For`/`CF-Connecting-IP`
  diretos caem no peer; sem `TRUSTED_PROXY_SECRET` o cabeçalho é ignorado; peer ausente →
  balde `unknown`; IPv6 → `/64` (mesmo /64 compartilha balde, outro /64 não); IPv4 mapeado →
  IPv4; chave = HMAC-SHA256 hexadecimal de 64 caracteres, determinística, muda com o segredo,
  diferente do SHA-256 sem segredo e sem o IP. Comparação do segredo com `hmac.compare_digest`.

## B6 — Migração `20261106signup`

- Red: `signup_attempts` adicionada a `PUBLIC_TABLES`;
  `uv run pytest -q -p no:cacheprovider tests/test_rls_migration_integration.py` (PostgreSQL)
  → **2 failed**: o SQL offline não contém `ALTER TABLE public.signup_attempts ENABLE ROW LEVEL
  SECURITY;` e o banco real não tem `{'signup_attempts': (True, False)}`. Motivo esperado.
- Green: modelo `app/auth/models.py` (`SignupAttempt`), migração
  `alembic/versions/20261106_signup_attempts.py` (`BIGINT GENERATED ALWAYS AS IDENTITY`,
  `CHAR(64)`, `TIMESTAMPTZ`, índices `(source_hash, attempted_at)` e `(attempted_at)`, RLS) e
  import em `alembic/env.py` → **2 passed**.
- `DATABASE_URL=… uv run alembic check` → `No new upgrade operations detected.`
- `alembic downgrade -1` → `to_regclass('public.signup_attempts')` vazio, versão
  `20261104grounding`; `alembic upgrade head` → tabela de volta, versão `20261106signup`;
  `\d signup_attempts`: `id bigint generated always as identity`, `source_hash character(64)`,
  `attempted_at timestamp with time zone`, todos `not null`.

## B7 — Limitador em PostgreSQL (`tests/test_signup_limit_integration.py`)

- Red: `TEST_DATABASE_URL=… uv run pytest -q -p no:cacheprovider tests/test_signup_limit_integration.py`
  → `ImportError: cannot import name 'PostgresSignupLimiter' from 'app.auth.limiter'`. Motivo esperado.
- Green: `PostgresSignupLimiter.check_and_record` (advisory lock por origem, purge global das
  vencidas, contagem na janela deslizante, `SignupRateLimited(retry)` sem inserir, senão
  `INSERT` + commit) e `purge_signup_attempts` → **6 passed** em PostgreSQL 18 real, sem skip.
  Cobertos (relógio fixo, sem `sleep`): 5 passam; o 6º (30 min depois) → `retry_after = 1800`;
  a recusa não insere; em `retry − 1` s ainda recusa com 1 s; em `now + retry` volta a passar;
  arredondamento para cima (`2`); configuração 2/10 min (`480`); origens independentes;
  purge apaga só `attempted_at <= now − janela`; dois envios simultâneos com limite 1 → um
  passa, outro `3600`, exatamente 1 linha.
- Prova do lock: removendo temporariamente o `pg_advisory_xact_lock`, o teste simultâneo falhou
  3 de 3 vezes com `assert [None, None] == [None, 3600]` (os dois passavam). Lock restaurado →
  22 passed (limitador + origem).

## B8 — Endpoint `/api/auth/signup` (`tests/test_signup_http.py`)

SQLite + `FakeSignupLimiter` (mesma regra: recusa não conta) + relógio fixo injetado.

- Red: `uv run pytest -q -p no:cacheprovider tests/test_signup_http.py` →
  `ImportError: cannot import name 'get_clock' from 'app.auth.routes'` (as dependências do
  endpoint ainda não existiam). Motivo esperado: comportamento ausente.
- Green: `errors.py` ganha `fields` em `ApiError` e `validation_fields` (reuso do formatador,
  sem `input`); `routes.py` ganha `GET /signup` (`Cache-Control: no-store`, sem banco) e
  `POST /signup` (rota síncrona, corpo por `raw_body`, ordem interruptor → limitador em
  sessão própria com commit → JSON → regras → `add_account` + `issue_session`) → **25 passed**.
  Cobertos: AC14 (GET `false`, POST 404 `signup_unavailable` sem usuário e sem tentativa, até
  com JSON malformado); GET `true`; 201 com `{id,email}` normalizado, cookie `HttpOnly`,
  `SameSite=Lax`, `Path=/api`, `Max-Age=86400`, `Secure` em stage e sem `Secure` em
  development; `expires_at = now + 86400` pelo relógio injetado; `/me`, logout e novo login
  (AC02/AC03/AC04); cookie anterior substituído; 422 por campo com códigos e mensagens do
  contrato, os dois campos de uma vez (AC05/AC06); `text/plain`, sem Content-Type,
  formulário, JSON malformado e bytes inválidos → `json_required`; `charset=utf-8` aceito;
  `missing`, `string_type`, `extra_forbidden`, `model_type` sem ecoar a senha; 409 com
  `fields[email]`, sem `Set-Cookie`, sem sessão e com o hash antigo (AC07); 422, 422, 201 e
  409 contam e o 5º envio → 429 com `Retry-After: 1800` e `retry_after_seconds` (AC09);
  OpenAPI documenta `SignupRequest` e 201/404/409/422/429.
- Regressão: `uv run pytest -q -p no:cacheprovider tests/ -k "http or auth or provision or
  account or signup or url_error or acceptance"` → **244 passed, 10 skipped** (skips: integrações
  sem `TEST_DATABASE_URL` neste comando; a suíte completa com PostgreSQL fica em B13).

## B9 — Cadastros simultâneos (`tests/test_signup_concurrency_integration.py`, AC08)

O comportamento já existia desde B2/B8, então o Red foi demonstrado por **mutação**: o
tratamento de `IntegrityError` em `add_account` foi removido temporariamente.

- Red (mutante): `TEST_DATABASE_URL=… uv run pytest -q -p no:cacheprovider tests/test_signup_concurrency_integration.py`
  → **2 failed**, ambos com `sqlalchemy.exc.IntegrityError: (psycopg.errors.UniqueViolation)
  duplicate key value violates unique constraint "users_email_key"` (no HTTP isso seria um 500
  genérico). Motivo esperado.
- Green (código restaurado, `git diff` vazio em `accounts.py`): **2 passed**, repetido 3 vezes
  (2 passed em cada). Testes:
  - determinístico: a 1ª sessão faz `flush` sem confirmar; a 2ª insere o mesmo e-mail em
    maiúsculas e fica bloqueada no índice único até a 1ª confirmar → `["created", "duplicate"]`,
    1 linha em `users`;
  - HTTP com `threading.Barrier` e sessões PostgreSQL independentes, e-mails que diferem só na
    caixa → um `201` e um `409 email_already_registered` sem `Set-Cookie`, nunca 500; exatamente
    1 usuário e 1 sessão.

## B10 — Sigilo (`tests/test_signup_privacy_integration.py`, AC10)

PostgreSQL real, `PostgresSignupLimiter` real, cabeçalho confiável do proxy, relógio fixo,
`caplog` em DEBUG para todos os loggers **e** `sqlalchemy.engine` em DEBUG (SQL e parâmetros).
Cenário: IPv4 `203.0.113.45` → 201, 422, 409, 429; IPv6 `2001:db8:abcd:12:…` → 201; cinco
senhas distintas. Verifica que nenhuma senha, IP, prefixo `/64` (com e sem sufixo) aparece em
logs, cabeçalhos/corpos de resposta, `users` ou `signup_attempts` (tabelas inteiras como
texto); que o SHA-256 sem segredo dos IPs não aparece em `signup_attempts`; hashes `scrypt$`;
`source_hash` igual ao HMAC esperado com 3 linhas para o IPv4 (201/422/409; o 429 não conta) e
1 para o IPv6; outro segredo gera outra chave.

- Primeira execução: **1 failed** por defeito do teste (o log de SQL não estava ligado:
  o SQLAlchemy fixa o logger `sqlalchemy` em WARN). Corrigido ligando `sqlalchemy.engine`.
- Green: **1 passed**.
- Red por mutação (o comportamento já existia):
  - mutante 1, `signup_source_key` devolve a origem sem HMAC → **1 failed**,
    `AssertionError: '203.0.113.45' apareceu em logs` (e no banco);
  - mutante 2, `logger.debug('signup %s', payload)` na rota → **1 failed**,
    `AssertionError: 'senha-sigilo-criada-…' apareceu em logs`.
  - Código restaurado (`git status` limpo em `backend/app`). O mutante 1 deixou 4 linhas com IP
    em claro no banco de teste descartável; removidas com
    `DELETE FROM signup_attempts WHERE source_hash !~ '^[0-9a-f]{64}$'` (`DELETE 4`) → **1 passed**.

## B11 — Isolamento (`tests/test_signup_http.py::test_new_account_sees_only_its_own_empty_data`, AC11)

Outra conta com monitoramento, alerta, notificação e conversa (com mensagem). Antes, o teste
confirma que a outra conta enxerga os próprios dados (o teste não é vazio). A conta criada
pelo cadastro recebe listas vazias em `/api/tracked-products`, `/api/dashboard` (monitoramentos,
oportunidades, atualizações e resumo zerado), `/api/notifications` e `/api/research`, e `404`
no monitoramento, no alerta e na conversa da outra conta.

- Primeira execução: **1 passed**. Esperado: as consultas já filtravam por `user_id`; o
  plano trata AC11 como regressão.
- Red por mutação: sem `TrackedProduct.user_id == user.id` em `list_tracking` → **1 failed**
  (`AssertionError` com o monitoramento da outra conta em `tracked`). Restaurado (`git status`
  limpo em `backend/app`) → `tests/test_signup_http.py` **26 passed**.
