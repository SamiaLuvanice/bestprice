# Plano — 0060

Só backend. O contrato REST não muda: as rotas autenticadas continuam respondendo `401
unauthenticated` para sessão inválida; a diferença é quando a sessão deixa de ser válida
e o `Set-Cookie` de renovação em respostas autenticadas. O frontend não muda.

## Decisões caras de reverter

- **Duas colunas de término:** `user_sessions.expires_at` passa a ser o término por
  inatividade (deslizante) e a nova `user_sessions.absolute_expires_at` (timestamptz, not
  null) é o teto de 7 dias desde a criação. Validade: `now < expires_at and now <
  absolute_expires_at`.
- **Migração com backfill:** `20261122_session_absolute_expiry.py` adiciona a coluna,
  preenche `absolute_expires_at = created_at + interval '7 days'` para as linhas existentes
  e então aplica `NOT NULL` (AC08: as antigas mantêm o `expires_at` atual e não passam do
  teto contado da criação). Índice em `expires_at` e em `absolute_expires_at` não é
  necessário para o volume atual; o purge usa um `DELETE ... WHERE` simples. Downgrade
  remove a coluna. RLS da tabela já está ativa (migração `20261014`).
- **Renovação com granularidade de 1 hora:** em `current_user`, se a sessão é válida e
  `expires_at - now < SESSION_IDLE - SESSION_RENEW_AFTER` (ou seja, a última renovação foi
  há mais de 1 hora), grava `expires_at = min(now + SESSION_IDLE, absolute_expires_at)`,
  confirma e reenvia o cookie com `max_age` igual aos segundos restantes até o novo
  `expires_at` (AC01, AC04). Requisições dentro da mesma hora não escrevem no banco.
- **Constantes:** `SESSION_IDLE = timedelta(hours=24)`, `SESSION_ABSOLUTE =
  timedelta(days=7)`, `SESSION_RENEW_AFTER = timedelta(hours=1)` em `routes.py` (sem
  variável de ambiente nesta fase). `SESSION_LIFETIME_SECONDS` é substituído.
- **Relógio injetado:** `current_user` recebe `clock: Clock = Depends(get_clock)` (mover
  `Clock`/`get_clock` para antes de `current_user`) e `Response` para o cookie (AC09).
- **Cookie único:** extrair `_set_session_cookie(response, raw_token, max_age)` usado por
  `issue_session` e pela renovação, com os mesmos atributos de hoje (HttpOnly,
  SameSite=Lax, path `/api`, Secure em stage/production). O token não rotaciona.
- **Desvio (implementação, 22/11/2026): cookie renovado por middleware, não pelo `Response`
  da dependência.** No FastAPI 0.142, os cabeçalhos do `Response` injetado numa dependência
  só chegam ao cliente quando a rota devolve um modelo; somem quando a rota devolve um
  `Response` próprio (ex.: `DELETE /api/ai/...` → 204) e quando a rota termina em erro
  (`ApiError` 404/409/422). Como a renovação já foi gravada no banco nesse ponto, o cookie
  ficaria com o término antigo e o navegador poderia descartá-lo horas antes da sessão (ex.:
  20 h sem uso + primeira requisição terminando em 404 → cookie expira 4 h depois). Por isso
  `current_user` grava a renovação em `request.state` e um middleware HTTP (registrado em
  `app/main.py`, definido junto do módulo de sessão) aplica o `Set-Cookie` a qualquer
  resposta, de sucesso ou de erro. `current_user` recebe só `Request`, sessão e relógio.

## Limpeza (AC06, AC07)

`purge_expired_sessions(session, now) -> int` em `backend/app/auth/sessions.py` (ou junto
de `routes.py` se ficar menor; decidir na implementação e registrar): apaga linhas com
`expires_at <= now OR absolute_expires_at <= now`, sem confirmar. Chamada em
`research/cleanup.purge_database` antes do `commit`, como os outros purges; a falha cai no
`_run_cleaner` existente que registra aviso e não derruba a API.

## Testes (TDD, Red antes, relógio fixo)

- HTTP (`test_auth_http.py` ou `test_session_lifetime_http.py` novo, com override de
  `get_clock`): AC01 (uso às 20 h renova; requisição às 43 h aceita), AC02 (>24 h sem uso →
  401), AC03 (7 dias com uso contínuo → 401), AC04 (atributos e `Max-Age` do
  `Set-Cookie` renovado; nunca além do teto; sem `Set-Cookie` dentro da mesma hora), AC05
  (logout após renovação → 401).
- Integração PostgreSQL: migração upgrade/downgrade com backfill (AC08), purge remove só
  terminadas de qualquer conta (AC06), ciclo `purge_database` com `now_utc`
  monkeypatchado (padrão de `test_login_privacy_integration.py`), falha do purge não
  propaga (AC07).

## Documentação

`docs/apps/backend.md` (duração da sessão: 24 h sem uso, teto 7 dias, renovação horária;
limpeza) e `docs/database.md`/architecture conforme `docs-impact`.

## Arquivos

Exclusivos: `backend/app/auth/routes.py`, `backend/app/products/models.py` (UserSession),
`backend/app/research/cleanup.py`, nova migração, novo módulo de purge, testes novos,
`specs/0060-*`. Compartilhados com a 0059 só em documentação (`docs/apps/backend.md`,
`docs/PROGRESS.md`).

## Riscos

- Escrita no banco em requisições autenticadas: no máximo uma por sessão por hora.
- Requisições concorrentes renovando a mesma sessão: última escrita vence com valores
  equivalentes; aceitável.
- `current_user` passa a confirmar a transação na renovação: a renovação deve ocorrer
  antes de a rota usar a sessão do banco, e nenhuma rota depende de estado pendente
  anterior ao `current_user`. Conferir rotas que usam `CurrentUser` e escrevem.
