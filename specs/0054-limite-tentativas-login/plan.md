# Plano — 0054

Spec: [spec.md](spec.md) · Issue #128 · Branch `feature/0054-issue-128-limite-tentativas-login`

Reaproveita o desenho do limite de cadastro (0048): janela deslizante no PostgreSQL,
`pg_advisory_xact_lock` por origem, HMAC da origem e purge horário. A diferença central é
que só **falhas** contam e a falha só é conhecida depois do scrypt. Para manter o limite
exato (AC11) sem segurar o lock durante o scrypt, a falha é **reservada antes** e
**desfeita no sucesso**.

## Decisões caras de reverter

1. **Reserva antes da verificação.** Sob o lock da origem: conta as falhas das duas
   contagens; se alguma estourou, 429 sem gravar; senão grava uma linha de falha e faz
   commit (o lock é solto aqui). Só então roda o scrypt. No sucesso, apaga as linhas da
   combinação origem + e-mail (inclusive a reservada); na falha, a linha fica. O lock dura
   milissegundos, e nenhuma conexão do pool espera um scrypt. Com 9 falhas, 20 envios
   paralelos têm só 1 reserva aceita (AC11). Se o processo cair entre a reserva e o
   resultado, conta uma falha a mais, o que é conservador e aceitável.
2. **Uma tabela, `login_failures`:** `id` BIGINT IDENTITY, `source_hash` CHAR(64) NOT
   NULL, `account_hash` CHAR(64) NULL (nulo para corpo malformado), `failed_at`
   timestamptz NOT NULL. Índices `(source_hash, failed_at)`,
   `(source_hash, account_hash, failed_at)` e `(failed_at)`. RLS habilitado, como em
   `signup_attempts`. Sem FK para `users`, porque e-mails sem conta também contam (AC07).
3. **Hashes:** origem = `source_hash(normalize_source(origem), segredo)`, a mesma função do
   cadastro. E-mail = HMAC-SHA256 com o mesmo segredo e prefixo de domínio
   (`"login-email:" + normalize_email(email)`), para não colidir com o hash da origem.
   **Reusa `SIGNUP_SOURCE_HASH_SECRET`** e `TRUSTED_PROXY_SECRET`, sem segredo novo para a
   operação. O nome fica impreciso; a documentação passa a descrevê-lo como a chave dos
   limites de cadastro e login. Trocar o segredo zera as janelas correntes.
4. **Segredos obrigatórios em ambiente implantado (AC14):** com
   `APP_ENV ∈ {stage, production}`, a ausência de qualquer um dos dois impede a
   inicialização, mesmo com o cadastro desligado. Localmente, sem
   `SIGNUP_SOURCE_HASH_SECRET`, o processo gera um segredo aleatório na partida, que vale
   só para aquele processo e é suficiente para um único processo local. Sem o segredo do
   proxy, usa o peer da conexão, como no cadastro.
5. **Custo constante (AC08):** um hash fictício (`DUMMY_PASSWORD_HASH`) é calculado uma vez
   na importação com os mesmos parâmetros scrypt. E-mail sem conta → `verify_password`
   contra o fictício. Campos acima do tamanho máximo → `verify_password` de uma senha
   curta fixa contra o fictício. Assim um único scrypt de custo igual roda por falha de
   credencial, e o trabalho não cresce com o tamanho da senha enviada.
6. **Corpo lido como bytes (como o cadastro):** o limite é avaliado antes do parse (decisão
   "Ordem" da spec). O parse reusa `parse_signup_body`, generalizado para receber o modelo.
   Isso passa a exigir `Content-Type: application/json` também no login, o que protege
   contra login CSRF com `text/plain`. Corpo malformado grava falha só de origem
   (`account_hash` nulo) e responde 422 como hoje.

## Contrato REST

### `POST /api/auth/login`

Entrada: JSON `{"email": string, "password": string}`, campos extras proibidos,
`Content-Type: application/json`.

| Status | Corpo | Quando | Conta falha? |
|---|---|---|---|
| 200 | `UserResponse {id, email}` + cookie `bestprice_session` | credenciais corretas, origem abaixo dos limites | apaga as falhas da combinação |
| 401 | `error.code = invalid_credentials`, "E-mail ou senha inválidos." | e-mail sem conta, senha errada, campo acima do máximo | origem + e-mail |
| 422 | `error.code = validation_error`, `fields` | corpo não JSON, JSON inválido, campo ausente ou extra | só origem |
| 429 | `error.code = login_rate_limited`, mensagem "Muitas tentativas de login. Tente novamente mais tarde.", `retry_after_seconds` (inteiro ≥ 1) + cabeçalho `Retry-After` | qualquer das duas contagens no limite; avaliado antes de tudo | não |

O formato de erro é o de `ApiError` (`error.{code, message, fields, tracked_product_id,
retry_after_seconds}`), sem mudança. A espera é `max(espera_combinação, espera_origem)`, e
cada espera é `falhas[len - limite].failed_at + janela - agora` (AC10).

A resposta 429 nunca depende de o e-mail ter conta (AC07). O contrato fica no OpenAPI
(`responses=` no decorador, como no cadastro).

## Backend (agente `backend`)

- `app/auth/settings.py`: `LoginSettings(account_attempts, source_attempts, window,
  trusted_proxy_secret, hash_secret)` e `login_settings()`. Variáveis:
  `LOGIN_RATE_LIMIT_ACCOUNT_ATTEMPTS` (10, 1–1000), `LOGIN_RATE_LIMIT_SOURCE_ATTEMPTS`
  (50, 1–10000, ≥ conta), `LOGIN_RATE_LIMIT_WINDOW_MINUTES` (15, 1–1440), mais as regras
  da decisão 4. Validada no `lifespan` junto de `signup_settings()` (AC13, AC14). O
  segredo efêmero local é gerado uma vez por processo, com cache.
- `app/auth/login_limiter.py`: `PostgresLoginLimiter.reserve(session, source_key,
  account_key | None, now, settings)`, que levanta `LoginRateLimited(retry_after)` ou grava
  a reserva com commit; `clear_account(session, source_key, account_key)`; e
  `purge_login_failures(session, now, window)`. O lock é
  `pg_advisory_xact_lock(hashtextextended('login:' || source_key, 0))`. A reserva apaga
  as falhas vencidas da própria origem.
- `app/auth/models.py`: `LoginFailure`. Migração Alembic `20261113_login_failures.py`.
- `app/auth/security.py`: `DUMMY_PASSWORD_HASH` e uso na rota.
- `app/auth/routes.py`: a rota de login passa a usar `raw_body`, a fonte da origem, o
  relógio e o limitador por `Depends` (substituíveis em teste). A ordem é: limite → parse →
  tamanho → busca → scrypt (real ou fictício) → sessão ou 401. Usa uma sessão de banco
  própria para o limitador, como o cadastro, para que a reserva não dependa da transação
  da requisição.
- `app/research/cleanup.py`: chama `purge_login_failures` no mesmo ciclo do cadastro
  (AC15).
- Nada de e-mail, IP ou hash em log (AC15).

### Testes (TDD, Red antes)

- Unitários: settings (faixas, origem ≥ conta, segredos em stage/production com o
  cadastro desligado, segredo local efêmero) e hash do e-mail com prefixo.
- HTTP com limitador e relógio substituídos: 401, 422, 429, ordem limite-antes-do-parse,
  mensagem e `Retry-After`.
- Integração com PostgreSQL real e relógio fixo: AC01–AC07, AC09, AC10, AC15 (linhas sem
  texto em claro e purge).
- AC08: teste que conta as chamadas de `verify_password` (1 por falha nos três casos). A
  medição de mediana é evidência manual em `verification.md`.
- AC11: 20 threads com sessões próprias contra PostgreSQL real, no padrão de
  `test_signup_concurrency_integration.py`.
- AC12: duas engines ou sessões independentes no mesmo banco simulam duas instâncias.
- AC17: uma sessão aberta continua válida em `/api/auth/me` durante o bloqueio.

## Frontend (agente `frontend`)

- `App.tsx` (`login`): para `ApiFailure` com `status === 429` e `code ===
  'login_rate_limited'`, monta "Muitas tentativas de login. Tente novamente em N minutos."
  com N = `ceil(retry_after_seconds / 60)`, no mínimo 1, singular e plural. Sem
  `retry_after_seconds`, usa a mensagem do servidor. Extrai o `waitText` do cadastro para
  `lib/format.ts`, parametrizado pelo prefixo, e o cadastro passa a reutilizá-lo sem
  mudar o texto.
- `LoginForm.tsx`: hoje a senha sobrevive a uma falha. Para AC16, a senha é apagada
  quando chega um novo erro do servidor, e o e-mail é mantido. O alerta já é o único
  `role="alert"`. Mantém o foco na senha, como hoje.
- Sem tela nova: usa o mesmo alerta do formulário (suposição da spec sobre o Figma). A QA
  visual confere 1440 px e 390 px.
- Testes Vitest: mensagem com N minutos (1 e plural), fallback sem espera, senha apagada e
  e-mail mantido, 401 inalterado e regressão do cadastro com o mesmo texto.

## Configuração e documentação

- `.env.example` e `render.yaml`: as três variáveis `LOGIN_RATE_LIMIT_*`. Os segredos já
  estão declarados.
- `docs/apps/backend.md`, `docs/apps/infraestrutura.md` (pré-condição de Stage),
  `docs/architecture.md`, `docs/database.md` e `docs/PROGRESS.md`: atualizados pelo
  doc-sync.

## Arquivos e responsáveis (paralelismo)

| Agente | Arquivos exclusivos |
|---|---|
| backend | `backend/app/auth/{settings,login_limiter,models,security,routes}.py`, `backend/app/main.py`, `backend/app/research/cleanup.py`, `backend/alembic/versions/20261113_login_failures.py`, `backend/tests/test_login_*`, `.env.example`, `render.yaml` |
| frontend | `frontend/src/App.tsx`, `frontend/src/LoginForm.tsx`, `frontend/src/lib/format.ts`, `frontend/src/auth/SignupForm.tsx`, testes correspondentes |

Não há arquivo em comum, então os dois rodam em paralelo depois deste contrato.

## Riscos

- **Stage sem segredos:** com AC14, a API não sobe. Antes da promoção, a operação precisa
  confirmar no Render os valores de `TRUSTED_PROXY_SECRET` e `SIGNUP_SOURCE_HASH_SECRET`
  e, no Pages, `API_PROXY_SECRET` (que deve ser igual ao do proxy).
- **Origem atrás do Pages:** a 0048 não verificou a origem real em Stage. Se a Function não
  repassar o IP, todos compartilham uma origem e o AC03 vira negação de serviço. Isso
  precisa ser verificado em Stage depois da promoção.
- **Exigir JSON no login:** um cliente que hoje envia sem `Content-Type` passaria a receber
  422. O cliente da SPA envia JSON. Verificar se não há outro cliente.
- **Tempo:** o scrypt fictício iguala o custo da verificação, mas a busca no banco e a
  gravação da reserva acontecem nos dois casos, então não criam diferença. Fica a
  medição do AC08 como evidência.
