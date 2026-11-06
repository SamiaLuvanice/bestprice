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
