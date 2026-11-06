# Plano — 0048

Spec: [spec.md](spec.md) (status `pronta`, inclui AC14 e as decisões de 06/11/2026).
Issue #252. Branch `feature/0048-issue-252-cadastro-self-service`, base `origin/develop` `66fb0c5`.
Brief de design: [design/figma-brief.md](design/figma-brief.md) (proposta; ainda sem quadros no Figma).

## Decisões caras de reverter

1. **Contrato público `/api/auth/signup`** (GET de disponibilidade e POST de cadastro) e os
   códigos de erro estáveis abaixo. Depois de publicados, clientes passam a depender deles.
2. **Tabela `signup_attempts` no PostgreSQL** para o limite de tentativas. Ela substitui
   qualquer contador em memória. Migração Alembic nova, com RLS ligado como as demais.
3. **Identificação da origem em Stage por cabeçalho assinado pelo proxy do Pages**
   (`X-BestPrice-Client-IP` + segredo compartilhado `API_PROXY_SECRET`/`TRUSTED_PROXY_SECRET`).
   Aceito pelo responsável em 06/11/2026. Exige a mesma variável secreta no Cloudflare
   Pages e no Render. Trocar de estratégia depois muda a infraestrutura dos dois lados.
4. **Regra única de conta em `backend/app/auth/accounts.py`**, espelhada em
   `frontend/src/auth/accountRules.ts`. Toda criação de conta (cadastro e CLI) exige o formato
   `nome@domínio.tld`, com a mesma expressão que o `LoginForm.tsx` já usa. O login não muda:
   o cliente mantém a validação atual e o servidor não recusa contas existentes por formato.
   Endurecer depois que houver contas exigiria migrar dados; afrouxar é barato.
5. **A origem fica guardada só como HMAC-SHA256** com o segredo de ambiente
   `SIGNUP_SOURCE_HASH_SECRET`, nunca em claro. Trocar o segredo zera os baldes ativos.
6. **O cadastro não usa pré-consulta de duplicidade.** A restrição única `users.email` é a
   única fonte de verdade. O mesmo caminho atende AC07 e AC08.

## Contrato REST

Tudo é aditivo. Login, `me` e `logout` mantêm o contrato atual. Os erros usam o envelope
existente `{"error": {code, message, fields, tracked_product_id, retry_after_seconds}}`.
Não há CORS: o navegador chama `/api` na mesma origem (Vite, Nginx ou Pages Function).

### `GET /api/auth/signup` — disponibilidade (público, sem sessão)

- `200` `{"enabled": true | false}`, com o cabeçalho `Cache-Control: no-store`.
- Não depende do banco e não conta tentativa.
- **Por que um GET novo na API e não `VITE_*`:** o interruptor é decidido no servidor, que
  é quem recusa o POST. Com o valor no build do frontend, ligar ou desligar exigiria
  rebuild do Pages e poderia divergir da API. A rota é pública porque landing e login
  aparecem antes de qualquer sessão. Por isso não usamos `/api/ai/capabilities`, que exige
  login.

### `POST /api/auth/signup` — cadastro

Entrada (`Content-Type: application/json` obrigatório; `extra="forbid"`):

```json
{"email": " Ana@Exemplo.com ", "password": "uma-senha-longa"}
```

- **A confirmação de senha não vai à API.** Ela é uma verificação de digitação feita na
  interface. Um script mandaria dois valores iguais, então a checagem no servidor não
  protege nada, e a senha não precisa trafegar duas vezes. Se for preciso, dá para
  acrescentar depois de forma compatível. O AC06 "inclusive quando a recusa vem do
  servidor" vale para os limites de tamanho.
- Uma sessão existente no cookie é ignorada. O cadastro emite um cookie novo, que
  sobrescreve o anterior. A interface já leva quem tem sessão ao painel (AC01).

Ordem de avaliação, que é parte do contrato:

1. Interruptor desligado → `404`, sem registrar tentativa (AC14).
2. Limitador da origem: se ela já tem `N` tentativas na janela → `429`, sem registrar.
   Caso contrário, **a tentativa é registrada e confirmada** antes de qualquer validação.
3. Content-Type diferente de JSON, JSON malformado ou formato errado → `422`.
4. Regras de conta → `422` por campo (todos os campos de uma vez).
5. Criação de usuário + sessão numa única transação → `201` ou `409`.

Respostas:

| Status | Corpo | Observações |
|---|---|---|
| `201` | `{"id": "<uuid>", "email": "ana@exemplo.com"}` (mesmo `UserResponse` do login) | `Set-Cookie: bestprice_session=…; HttpOnly; SameSite=Lax; Path=/api; Max-Age=86400`, `Secure` em `stage`/`production`. Mesma função de emissão de sessão do login. |
| `404` | `code: "signup_unavailable"`, `message: "Cadastro indisponível."` | Interruptor desligado. |
| `409` | `code: "email_already_registered"`, `message: "Já existe uma conta com este e-mail."`, `fields: [{"field": "email", "code": "email_already_registered", "message": "Já existe uma conta com este e-mail."}]` | Nenhuma sessão é criada e a conta existente não muda (AC07/AC08). |
| `422` | `code: "validation_error"`, `message: "Confira os dados informados."`, `fields: [...]` | Ver tabela de campos. |
| `429` | `code: "signup_rate_limited"`, `message: "Muitas tentativas de cadastro. Tente novamente mais tarde."`, `retry_after_seconds: N` | Cabeçalho `Retry-After: N` (inteiro ≥ 1, em segundos). |

Campos do `422`. O `field` é `email`, `password` ou `body`. Os `code` são estáveis:

| field | code | message (pt-BR) | Regra |
|---|---|---|---|
| email | `email_required` | Informe seu e-mail. | vazio após `strip()` |
| email | `email_too_long` | O e-mail pode ter no máximo 320 caracteres. | `len(bruto) > 320`, **antes** do strip |
| email | `email_invalid` | Informe um e-mail válido, como nome@exemplo.com. | o valor após `strip()` não casa com `EMAIL_PATTERN` (`a@b`, `a@b.`, `a b@c.com`, dois `@`) |
| password | `password_too_short` | A senha precisa ter pelo menos 12 caracteres. | `len < 12` |
| password | `password_too_long` | A senha pode ter no máximo 1024 caracteres. | `len > 1024` |
| body | `json_required` | Valor inválido ou ausente. | Content-Type não JSON ou JSON malformado |
| email/password/body | códigos do Pydantic (`missing`, `string_type`, `extra_forbidden`…) | Valor inválido ou ausente. | formato errado; mesmo tratamento do handler atual |

- Ordem por campo: `email_too_long` → `email_required` → `email_invalid`. Por campo vem só a
  primeira regra violada.
- **Nenhum item de `fields` ecoa `input`.** O formatador atual já descarta esse valor. A
  conversão de `ValidationError` reutiliza o mesmo formatador (AC10).
- A exigência de Content-Type JSON impede login CSRF por `<form enctype="text/plain">`.
  O corpo é lido como bytes, e sem ela qualquer formulário de outro site poderia criar
  conta e definir o cookie da vítima.
- `len` conta code points (Python `str`). A interface conta igual (`Array.from(v).length`),
  não em unidades UTF-16.

### Login (alinhamento, sem mudança de contrato)

`POST /api/auth/login` passa a usar `accounts.EMAIL_MAX_CHARS`, `PASSWORD_MAX_CHARS` e
`normalize_email`. **Não aplica `EMAIL_PATTERN`**: contas antigas fora do formato continuam
entrando (decisão do responsável). Continua respondendo `401 invalid_credentials` para
qualquer violação, sem revelar a regra. O `LoginForm` mantém a validação local atual,
agora importada de `accountRules.ts` (mesma expressão, sem mudança de comportamento).

### Documento de contrato

A skill `api-contract` fixa o contrato neste plan.md. O doc-sync atualiza a tabela de rotas em
`docs/apps/backend.md` (linha "Sessão") e o texto "Não há cadastro público", e a lista de
rotas consumidas em `docs/apps/frontend.md`.

## Backend

### Regra única de conta (AC04, AC05, AC06, AC12)

O novo arquivo `backend/app/auth/accounts.py` é a única fonte para login, cadastro e CLI:

- Constantes: `EMAIL_MAX_CHARS = 320`, `PASSWORD_MIN_CHARS = 12`, `PASSWORD_MAX_CHARS = 1024`
  e `EMAIL_PATTERN = re.compile(r"[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+")`, aplicada com
  `fullmatch` ao valor sem espaços nas pontas. É a tradução literal de
  `/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/` (`LoginForm.tsx:24`). Os testes B1 e F2 usam a mesma
  tabela de casos (incluindo espaço Unicode e acentos no domínio) para provar que as duas
  versões concordam.
- `normalize_email(raw: str) -> str` faz `strip().lower()`, como hoje, para não invalidar dados.
- `account_rule_violations(email: str, password: str) -> list[RuleViolation]`
  (`RuleViolation(field, code, message)`) é pura e testável.
- `add_account(session, email, password) -> User`: valida (levanta `AccountRuleError` com
  as violações), gera o hash, faz `session.add` e `flush`. Em `IntegrityError` faz rollback,
  confirma por `SELECT` que o e-mail normalizado existe e levanta
  `EmailAlreadyRegistered`; se ele não existir, relança a exceção. Não faz commit: o chamador
  decide a transação. O teste com dois cadastros simultâneos (AC08) cobre a falta de
  pré-consulta. A verificação depois do rollback é independente de dialeto (SQLite nos
  testes HTTP, PostgreSQL na integração).
- `security.hash_password` mantém o mínimo como defesa em profundidade.

CLI (`provision.py`): `provision_user` chama `add_account` + `commit` e mapeia os erros para
`parser.error` com a mensagem em português. O prompt passa a "Senha (12 a 1024
caracteres)". A CLI passa a recusar e-mail com mais de 320 caracteres antes do strip, e-mail
fora de `nome@domínio.tld` e senha acima de 1024, além de recusar e-mail criado pelo
cadastro (AC12). A CLI **não** depende do
interruptor (AC14).

### Endpoint

`backend/app/auth/routes.py` concentra as rotas `/api/auth/*`. A emissão de sessão do login
vira `issue_session(session, response, user, now)` e passa a servir aos dois fluxos.

- **Rota síncrona** (psycopg síncrono não roda no event loop). O corpo vem de uma dependência
  `async def raw_body(request) -> bytes`. A regra exige a ordem "limite → validação", e o
  FastAPI rejeita JSON inválido antes de executar o handler; por isso a dependência. Assim,
  todo envio que chega conta (decisão do responsável). O `openapi_extra` documenta o schema
  `SignupRequest`.
- Dependências injetáveis para teste: `signup_settings`, `get_clock` (fonte de tempo,
  `Callable[[], datetime]` UTC), `get_signup_limiter` e `signup_source` (chave da origem).
- O limitador roda numa sessão própria com commit, antes da sessão de criação. Uma falha na
  criação não desfaz a contagem.
- `ApiError` (`errors.py`) ganha o parâmetro opcional `fields`, usado no `422` de regra e no
  `409`. O `validation_error_handler` extrai `validation_fields(errors)` para reuso.

### Configuração e interruptor (AC09, AC14)

`backend/app/auth/settings.py`: `SignupSettings` (dataclass congelada) + `signup_settings()`.

| Variável | Padrão | Validação |
|---|---|---|
| `SIGNUP_ENABLED` | `false` | só `true` liga (igual a `AI_ENABLED`) |
| `SIGNUP_RATE_LIMIT_ATTEMPTS` | `5` | inteiro 1–1000 |
| `SIGNUP_RATE_LIMIT_WINDOW_MINUTES` | `60` | inteiro 1–1440 |
| `TRUSTED_PROXY_SECRET` | vazio | se preenchido, ≥ 32 caracteres |
| `SIGNUP_SOURCE_HASH_SECRET` | vazio | obrigatório com `SIGNUP_ENABLED=true` em qualquer ambiente; ≥ 32 caracteres |

- Valor inválido → `RuntimeError` no `lifespan` (falha rápida). Com `SIGNUP_ENABLED=true`:
  - em `stage`/`production` sem `TRUSTED_PROXY_SECRET`, a API **não inicia** (aceito pelo
    responsável). Sem o segredo, todo o tráfego do Pages cairia numa única origem;
  - sem `SIGNUP_SOURCE_HASH_SECRET`, a API não inicia em nenhum ambiente. Isso garante que
    nunca se grava uma origem sem hash.
  - Desligado, nenhum dos dois segredos é exigido.
- **Por que um segredo próprio para o hash:** o repositório não tem um segredo genérico de
  aplicação. Os existentes têm outro propósito: `MERCADOLIVRE_OAUTH_KEY` é a chave Fernet
  dos tokens do operador, e `TRUSTED_PROXY_SECRET` autentica o proxy e não existe
  localmente. Separar permite rotacionar cada um sem efeito no outro. Trocar o segredo do
  hash só zera os baldes da janela corrente.
- Arquivos: `.env.example` (as cinco variáveis, comentadas, segredos vazios),
  `docker-compose.yml` (só o serviço `backend`, com `${VAR:-padrão}`) e `render.yaml`
  (`SIGNUP_ENABLED: "false"`; `TRUSTED_PROXY_SECRET` e `SIGNUP_SOURCE_HASH_SECRET` com
  `sync: false`). Alterar o
  `render.yaml` exige sincronização manual do Blueprint depois dos checks
  (`docs/apps/infraestrutura.md`).

### Identificação da origem (pergunta em aberto da spec)

Observado no repositório:

- Stage: navegador → Cloudflare Pages Function `frontend/functions/api/[[path]].ts` → `fetch`
  para `https://bestprice-stage-api.onrender.com` → borda do Render → Uvicorn
  (`start-stage.sh`, sem `--proxy-headers` explícito).
- A Function copia **todos** os cabeçalhos do cliente, exceto `host`, `forwarded`,
  `x-forwarded-host` e `x-forwarded-proto`. Um `X-Forwarded-For` enviado pelo cliente chega
  intacto à API.
- A API Render é pública. Qualquer pessoa pode chamá-la direto, sem passar pelo Pages, com
  os cabeçalhos que quiser.
- Uvicorn ≥ 0.54 (`pyproject.toml`) liga `proxy_headers` por padrão, mas só confia em
  `FORWARDED_ALLOW_IPS=127.0.0.1`. Atrás do Render, `request.client.host` é o salto interno do
  Render, não o visitante.
- Local: Vite (`API_PROXY_TARGET`) não adiciona `X-Forwarded-For`, e o Nginx do Compose
  manda `X-Real-IP` sem segredo.

Inferência: nenhum cabeçalho padrão (`X-Forwarded-For`, `CF-Connecting-IP`) é confiável na
API, porque ela é acessível diretamente. Habilitar `--proxy-headers
--forwarded-allow-ips="*"` tornaria a origem forjável. **Decisão:**

1. A Function do Pages remove os cabeçalhos `x-bestprice-client-ip` e
   `x-bestprice-proxy-secret` vindos do cliente. Com `API_PROXY_SECRET` configurado, ela
   define `x-bestprice-proxy-secret` com o segredo e `x-bestprice-client-ip` com o
   `CF-Connecting-IP` recebido pela Function, que a borda do Cloudflare preenche.
2. A API usa `x-bestprice-client-ip` só quando `x-bestprice-proxy-secret` confere com
   `TRUSTED_PROXY_SECRET` (`hmac.compare_digest`) e o valor é um IP válido
   (`ipaddress.ip_address`). Nos outros casos, usa `request.client.host`. Em Stage isso
   agrupa todo acesso direto num balde conservador; localmente, é o próprio peer.
3. Origem normalizada: IPv4 completo; IPv6 reduzido ao prefixo `/64` (quem tem um `/64`
   trocaria de endereço à vontade); IPv4 mapeado em IPv6 vira IPv4.
   **Chave gravada** = `hmac.new(SIGNUP_SOURCE_HASH_SECRET, origem_normalizada,
   sha256).hexdigest()`: 64 caracteres hexadecimais, sem o IP em claro. O hash sem segredo
   não basta: os 2³² IPv4 se revertem por força bruta em minutos. O IP em claro só existe em
   memória durante a requisição e não é logado.
4. Não ativar `--proxy-headers`/`FORWARDED_ALLOW_IPS` no Render (registrar em
   `docs/apps/infraestrutura.md`).

Pendente de evidência: confirmar na documentação da Cloudflare (Context7 ou docs oficiais)
que a Function recebe `CF-Connecting-IP` com o IP do visitante e que o cliente não consegue
forjá-lo. Registrar em `backend-evidence.md` antes do Red de B5. A validação real em Stage
só pode ocorrer quando o interruptor for ligado. Fica como pendência explícita, com roteiro
em `verification.md`.

### Limitador (AC09)

- **PostgreSQL, não memória.** Um contador em memória zera a cada reinício (o Render Free
  hiberna e reinicia), não é compartilhado entre instâncias e permitiria contornar o limite
  com um redeploy.
- Tabela `signup_attempts`: `id BIGINT GENERATED ALWAYS AS IDENTITY PK`,
  `source_hash CHAR(64) NOT NULL` (HMAC hexadecimal), `attempted_at TIMESTAMPTZ NOT NULL`. Índices
  `(source_hash, attempted_at)` e `(attempted_at)`. Modelo SQLAlchemy
  `backend/app/auth/models.py`, importado em `alembic/env.py`.
- `PostgresSignupLimiter.check_and_record(session, source_hash, now, settings)`, na mesma
  transação:
  1. `SELECT pg_advisory_xact_lock(hashtextextended('signup:' || :source_hash, 0))` serializa
     envios simultâneos da mesma origem. Sem isso, dois envios contariam 4 e passariam.
  2. Busca os `attempted_at > now - janela` da origem, em ordem crescente.
  3. Com `count >= limite`: `retry = ceil((t[count - limite] + janela - now).total_seconds())`,
     no mínimo 1 → `429`, **sem inserir**.
  4. Senão, `INSERT (key, now)` e commit.
- **Recusas por 429 não são registradas.** Se fossem, cada nova tentativa durante o bloqueio
  empurraria a janela, o `Retry-After` informado deixaria de ser verdadeiro e o AC09
  ("passado esse tempo, volta a funcionar") falharia. Os demais envios, inclusive os
  inválidos e duplicados, contam.
- Janela deslizante. O tempo vem de `get_clock()` injetável. Os testes usam um relógio fixo e
  avançam 60 min sem `sleep`.
- **Retenção:** cada verificação apaga as linhas globais com `attempted_at <= now - janela`.
  O `purge_database` de `app/research/cleanup.py` (loop horário existente) chama
  `purge_signup_attempts`, para não reter IP de quem não volta. Retenção máxima ≈ janela +
  1 h.
- Um dublê em memória (`FakeSignupLimiter`) existe só nos testes HTTP. A implementação real é
  testada em PostgreSQL (`TEST_DATABASE_URL`).

### Concorrência (AC08) e sigilo (AC10)

- AC08: teste de integração PostgreSQL com dois threads, `threading.Barrier`, sessões
  independentes e o mesmo e-mail em caixas diferentes. O resultado esperado é exatamente
  1 linha em `users`, um `201` e um `409 email_already_registered`, nunca `500`. Um segundo
  teste cobre o limitador com dois envios simultâneos da mesma origem e limite 1: um passa e
  o outro recebe `429`.
- AC10: o teste percorre sucesso, 422, 409 e 429 com `caplog` em `DEBUG` para todos os loggers
  e verifica que a senha não aparece em logs, corpos de resposta, `users.password_hash`
  (começa com `scrypt$`) ou `signup_attempts`. Nenhum `logger` novo registra e-mail, senha,
  IP ou corpo.
- AC10 (origem): o teste de integração faz envios com IPv4 e IPv6 conhecidos pelo cabeçalho
  confiável. Ele verifica que nenhuma coluna de `signup_attempts` contém o IP, o prefixo
  `/64` ou o SHA-256 sem segredo deles, e que `source_hash` é igual ao HMAC esperado com o
  segredo de teste. Também verifica que o mesmo IP com outro segredo gera outra chave. `IntegrityError` é tratado; o caminho que relança não loga parâmetros.
- AC11: um teste HTTP cria a conta pelo cadastro enquanto outra conta já tem monitoramento,
  alerta, notificação e conversa. Painel, monitoramentos, notificações e conversas do
  Assistente devolvem vazio para a conta nova. As consultas existentes já filtram por
  `user_id`; o teste é regressão.

### Migração

`backend/alembic/versions/20261106_signup_attempts.py`, `revision = "20261106signup"`,
`down_revision = "20261104grounding"`. Cria a tabela com `DateTime(timezone=True)` e os
índices, e executa `ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY`
(padrão 20261014rls/20261026research). O downgrade apaga a tabela, sem perder dados de
negócio. Atualizar `PUBLIC_TABLES` em `tests/test_rls_migration_integration.py`.

## Frontend

### Comportamento (pode começar já)

- **API (`api.ts`):** `ApiFailure` ganha `fields: {field, code, message}[]` (padrão `[]`,
  validado como `unknown`). Adiciona `api.signupStatus()`, com validador `{enabled: boolean}`,
  e `api.signup(email, password)`, que aceita só `201` com `UserResponse`. O `fakeApi.apiError`
  aceita `fields`.
- **Regras (`auth/accountRules.ts`):** as mesmas constantes e ordem do backend, com
  comprimento em code points. `validateSignup(email, password, confirmation)` e
  `EMAIL_PATTERN` (a expressão atual do `LoginForm`, movida para cá). O `LoginForm` importa a
  expressão e **não muda de comportamento**. O cadastro aplica `nome@domínio.tld` + 320 +
  senha 12–1024; a senha do login continua só "não vazia".
- **Disponibilidade (`auth/useSignupAvailability.ts`):** `loading | enabled | disabled | error`.
  O `App` chama uma vez por carregamento e repassa o valor a `LandingPage` e `LoginForm`.
  Erro ou `disabled` escondem os links. Em `/cadastro`, `loading` mostra o status
  "Carregando…" e `error` mostra o alerta com "Tentar novamente".
- **Rota `/cadastro`** (o idioma segue `/produtos` e `/alertas`):
  - com sessão → `/app/dashboard` (AC01);
  - interruptor desligado → `Navigate` para `/login` preservando `returnTo` (AC14: sem
    formulário, sem página nova);
  - ligado e sem sessão → `SignupForm`.
  - O `App` inclui `/cadastro` na lista de títulos conhecidos ("Criar conta · BestPrice") e no
    efeito que limpa `postLoginTarget`.
- **returnTo:** o link do login leva a `/cadastro?returnTo=<valor>` só quando
  `safeReturnTo(valor) !== '/'`. O cadastro lê `returnTo`, valida com o `safeReturnTo`
  existente (sem open redirect) e, no sucesso, faz como o login: `setPostLoginTarget(target ??
  '/app/dashboard')` e `setUser`. "Já tem uma conta? Entrar" leva a `/login?returnTo=…`.
- **Formulário (`auth/SignupForm.tsx`):** e-mail (`autocomplete=email`), senha e confirmação
  (`autocomplete=new-password`, mostrar/ocultar como no login), a dica "Use pelo menos 12
  caracteres." ligada por `aria-describedby`, o aviso de privacidade visível antes do botão,
  o botão "Criar conta" ("Criando conta…" + `aria-busy` durante o envio) e
  `noValidate` com validação própria no envio. Em erro, o foco vai ao primeiro campo
  inválido, com `aria-invalid` e `aria-describedby` na mensagem. O alerta geral usa
  `role="alert"`.
- **Mensagens (copy provisória do brief, sujeita à revisão do Figma):**

| Situação | Onde | Texto |
|---|---|---|
| e-mail vazio | campo e-mail | Informe seu e-mail. |
| fora de `nome@domínio.tld` (`a@b`) | campo e-mail | Informe um e-mail válido, como nome@exemplo.com. |
| > 320 | campo e-mail | O e-mail pode ter no máximo 320 caracteres. |
| senha < 12 | campo senha | A senha precisa ter pelo menos 12 caracteres. |
| senha > 1024 | campo senha | A senha pode ter no máximo 1024 caracteres. |
| confirmação diferente | campo confirmação | As senhas não conferem. |
| `409` | campo e-mail | Já existe uma conta com este e-mail. + link "Entrar" (`/login?returnTo=…`) |
| `422` do servidor | campo do `field` | Texto local pelo `code`; senão, o `message` do servidor |
| `429` | alerta acima do botão | Muitas tentativas de cadastro. Tente novamente em N minutos. (`N = ceil(retry/60)`, "1 minuto" no singular; sem `retry_after_seconds`, usa a mensagem do servidor) |
| `404 signup_unavailable` | alerta | Cadastro indisponível no momento. (o interruptor foi desligado depois do GET) |
| rede/5xx/resposta inválida | alerta | Não foi possível criar a conta agora. Tente novamente. |
| aviso de privacidade | antes do botão | Usamos seu e-mail só para identificar sua conta e permitir seu acesso. Não enviamos mensagens. |

- **Preservação:** o e-mail digitado nunca é apagado. Senha e confirmação são limpas depois de
  uma resposta de erro do servidor. Na validação local, os valores ficam.
- **Proxy de Stage (`functions/api/[[path]].ts`):** remove os cabeçalhos `x-bestprice-*` vindos
  do cliente. Com `API_PROXY_SECRET`, injeta o segredo e `x-bestprice-client-ip` a partir de
  `cf-connecting-ip`. O segredo nunca volta na resposta.

### Visual (bloqueado)

Não existe tela de cadastro no Figma (confirmado pelo responsável em 06/11/2026). A tarefa
**D1** cria e aprova os quadros conforme `design/figma-brief.md`. Até lá:

- Comportamento, testes de lógica e integração podem usar a estrutura e as classes do login
  (`login-shell`, `login-card`, `login-field`) sem CSS novo nem tokens novos.
- Ficam bloqueados por D1: layout final, CSS novo, posição do link na landing e no login,
  baseline Playwright (`tests/visual/signup.spec.ts`), validação em 1440/390 px e o AC13.
- Extensões de token ou componente vão para `designsystem/README.md` antes de serem usadas.

## Arquivos e responsáveis (paralelismo)

Depois do contrato fixado aqui, backend e frontend rodam em paralelo. **Nenhum arquivo é
compartilhado.**

**Backend (agente `backend`), exclusivos:**

- `backend/app/auth/accounts.py` (novo), `settings.py` (novo), `limiter.py` (novo: chave da
  origem + `PostgresSignupLimiter` + purge), `models.py` (novo: `SignupAttempt`)
- `backend/app/auth/routes.py`, `provision.py`, `security.py` (se preciso)
- `backend/app/errors.py`, `backend/app/main.py` (validação no `lifespan`),
  `backend/app/research/cleanup.py` (chamada ao purge), `backend/alembic/env.py`
- `backend/alembic/versions/20261106_signup_attempts.py`
- `backend/tests/test_account_rules.py` (novo), `test_signup_http.py` (novo),
  `test_signup_limit_integration.py` (novo), `test_signup_concurrency_integration.py` (novo),
  `test_signup_source.py` (novo), `test_user_provision.py`, `test_auth_http.py`,
  `test_rls_migration_integration.py`
- `.env.example`, `docker-compose.yml`, `render.yaml`
- `specs/0048-…/backend-evidence.md`

**Frontend (agente `frontend`), exclusivos:**

- `frontend/src/api.ts`, `frontend/src/api.test.ts`, `frontend/src/test/fakeApi.ts`
- `frontend/src/auth/accountRules.ts` (+ `.test.ts`), `useSignupAvailability.ts` (+ teste),
  `SignupForm.tsx` (+ `SignupForm.test.tsx`)
- `frontend/src/LoginForm.tsx`, `LoginForm.test.tsx`, `App.tsx`, `App.test.tsx`
- `frontend/src/landing/LandingPage.tsx`, `LandingPage.test.tsx`, `LandingPage.css`,
  `frontend/src/styles.css` (estes dois só depois de D1)
- `frontend/functions/api/[[path]].ts`, `frontend/src/pagesProxy.test.ts`
- `frontend/tests/visual/signup.spec.ts` + screenshots (depois de D1), `designsystem/README.md`
  (se houver extensão)
- `specs/0048-…/frontend-evidence.md`

**Coordenação (fullstack/doc-sync), depois dos dois lados:** `specs/0048-…/verification.md`,
`docs/apps/backend.md`, `docs/apps/frontend.md`, `docs/apps/infraestrutura.md`,
`docs/database.md`, `docs/architecture.md`, `docs/index.md`, `docs/product-context.md`
(linha 23, "contas já provisionadas"), `docs/PROGRESS.md`.

**Design (responsável + D1):** quadros no Figma, `specs/0048-…/evidence/*.png`, node-ids em
`verification.md`. O brief não é editado.

## Riscos

- **Enumeração de contas** pelo 409 (aceita pela spec), mitigada pelo limite. Contas
  ilimitadas podem consumir a cota global da IA e as consultas da conta operadora do Mercado
  Livre. Registrado na spec, fora de escopo.
- **Proxy:** se a Cloudflare não entregar `CF-Connecting-IP` à Function, ou se o segredo vazar,
  o limite por origem perde efeito (o segredo vazado permite forjar a origem). Mitigações: o
  segredo fica só no ambiente, tem ≥ 32 caracteres e é rotacionado em conjunto. A API falha
  ao iniciar se o cadastro estiver ligado sem segredo. A evidência real em Stage fica
  pendente até o interruptor ser ligado.
- **NAT/CGNAT:** muitas pessoas atrás do mesmo IP (operadora móvel, empresa) dividem 5
  cadastros por hora. A configuração permite ajustar. Fica aceito para esta fase.
- **Privacidade (LGPD):** só o HMAC da origem fica no banco, por até ~2 h. O IP em claro
  não é gravado nem logado. Se o segredo do hash vazar junto com a tabela, os IPv4 podem ser
  revertidos por força bruta; por isso o segredo fica só no ambiente e a retenção é curta.
- **Corpo sem limite de tamanho:** igual às demais rotas. A borda do Cloudflare/Render limita.
  Não é tratado aqui.
- **Contas antigas fora do formato:** contas criadas pela CLI antes desta spec (por exemplo
  `a@b`) continuam válidas no servidor, mas a tela de login já as recusava antes; nada muda
  para elas. A CLI não cria mais contas assim.
- **Render Free hiberna:** o primeiro GET de disponibilidade pode demorar. Enquanto isso, os
  links ficam ocultos (`loading`), sem bloquear landing e login.
- **D1 sem aprovação** bloqueia AC13 e, portanto, a conclusão da spec. Backend e
  comportamento podem ser integrados atrás do interruptor desligado.
