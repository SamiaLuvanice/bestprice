# Verificação da spec 0059

Registro do agente `backend` em 22/11/2026. Worktree
`.worktrees/feature-0059-issue-326-redefinicao-senha-pela-operacao`, branch
`feature/0059-issue-326-redefinicao-senha-pela-operacao`, base `origin/develop` `8c860d3`, ponta
avaliada **`daad98f`**. [Issue #326](https://github.com/SamiaLuvanice/bestprice/issues/326).

Este registro cobre a implementação (B1–B4) e a documentação do AC09. Revisão independente (R1),
QA (R2), `doc-sync-onboarding` (R3), CI e PR (R4) **não foram executados** e não são afirmados aqui.

## Fronteiras da evidência

| Camada | Real | Simulado | Limite |
|---|---|---|---|
| pytest unitário (`test_password_reset.py`) | Função `reset_password` e `main()` reais, hash scrypt real | SQLite em memória; `getpass`, `sys.argv` e `create_database_engine` monkeypatchados | Não prova eco desligado no terminal: prova que a senha só é lida por `getpass` e nunca por argumento |
| pytest integração (`test_password_reset_integration.py`) | PostgreSQL 17.12 descartável `bestprice-0059-test-pg` (localhost:55459), migrações Alembic até o head, `main()` contra esse banco, API FastAPI (`/api/auth/login`, `/api/auth/me`) via `TestClient` | Dublê autouse do limitador de login (`tests/conftest.py`); falha do banco do AC08 forçada por evento `after_flush` do SQLAlchemy | A falha do AC08 é injetada depois do envio do `DELETE` e do `UPDATE` ao PostgreSQL e antes do `COMMIT`; não simula queda de rede no meio do `COMMIT` |
| Fluxo ponta a ponta | — | — | **Não executado** com uvicorn/terminal interativo; fica para o QA (R2) |

## Ciclos TDD (Red → Green)

| Tarefa | Red (motivo esperado) | Green |
|---|---|---|
| B1 — `reset_password` (AC01–AC04, AC06) | Esqueleto com `raise NotImplementedError`: **7 failed**, todos `NotImplementedError` | **7 passed** |
| B2 — CLI (AC03–AC05, AC07 via `main()`) | Primeira execução falhou por `AttributeError: ... no attribute 'getpass'` (preparação, não Red válido); acrescentados os imports ao esqueleto, `main()` com `raise NotImplementedError`: **8 failed** por `NotImplementedError`, 7 passed | **15 passed** |
| B3 — integração (AC01, AC06, AC08) | Comportamento já implementado em B1; a sensibilidade foi provada por mutação temporária (código restaurado com `git checkout` em seguida): sem o `DELETE` das sessões → AC01/AC06 falha com `[(200, None), (200, None)] == [(401, 'unauthenticated')] * 2`; com `commit` separado após o `DELETE` → AC08 falha com sessões `0 != 2` (estado parcial) | **2 passed** no PostgreSQL |

## Matriz de aceite

| AC | Situação | Evidência | Teste |
|---|---|---|---|
| AC01 — Redefinição bem-sucedida | aprovado (teste) | No PostgreSQL, após `main()`: login com a senha antiga → `401 invalid_credentials`; com a nova → 200 e `/api/auth/me` 200 com o mesmo e-mail; `users.id` e o vínculo em `tracked_products` (ativo) inalterados | `test_password_reset_integration.py::test_ac01_ac06_cli_reset_switches_the_password_and_ends_every_session`; `test_password_reset.py::test_ac01_new_password_replaces_the_old_one`, `::test_cli_resets_password_with_hidden_prompt_and_confirmation` |
| AC02 — E-mail normalizado | aprovado (teste) | `"  Pessoa@EXEMPLO.com \t"` e o e-mail em maiúsculas com espaços (integração) encontram a conta | `test_password_reset.py::test_ac02_email_is_normalized_like_the_login`; integração acima (`f"  {email.upper()} "`) |
| AC03 — Conta inexistente | aprovado (teste) | `AccountNotFound("Nenhuma conta com este e-mail.")`; CLI sai com código 2 e a mensagem em português; nenhuma conta criada, hash existente intacto | `test_password_reset.py::test_ac03_unknown_email_fails_without_creating_or_changing_anything`, `::test_cli_reports_errors_in_portuguese_without_changes[sem-conta]` |
| AC04 — Regras de senha do cadastro | aprovado (teste) | 11 e 1025 caracteres → mesmas mensagens do cadastro (`password_too_short`, `password_too_long`); 12 e 1024 aceitos; surrogate isolado → "A senha contém caracteres inválidos."; hash e sessões intactos. A referência da regra de caractere inválido é a CLI de criar conta (`provision`, mesma mensagem), não a API: o JSON da API não chega a ter texto que não vira UTF-8 | `test_password_reset.py::test_ac04_signup_password_rules_apply_and_keep_the_password[senha-11/senha-1025]`, `::test_ac04_limits_are_inclusive`, `::test_cli_reports_errors_in_portuguese_without_changes[senha-curta/senha-1025/senha-nao-utf8/email-nao-utf8]` |
| AC05 — Confirmação diferente | aprovado (teste) | Código 2, "As senhas não conferem", hash e sessão intactos | `test_password_reset.py::test_ac05_different_confirmation_fails_and_keeps_the_password` |
| AC06 — Sessões encerradas | aprovado (teste) | Duas sessões abertas pela API → ambas `401 unauthenticated` em `/api/auth/me`; sessão de outra conta segue 200 | integração `test_ac01_ac06_…`; `test_password_reset.py::test_ac06_all_sessions_of_the_account_end_and_others_stay` |
| AC07 — Senha nunca exposta | aprovado (teste) | Argumento posicional extra ou `--password` → código 2 sem alterar o hash; prompts via `getpass` ("Nova senha (12 a 1024 caracteres): ", "Confirme a nova senha: "); a senha não aparece em stdout, stderr nem `caplog` no sucesso e em cada erro | `test_password_reset.py::test_ac07_password_is_not_accepted_as_argument`, `::test_cli_resets_password_with_hidden_prompt_and_confirmation`, `::test_ac05_…`, `::test_cli_reports_errors_in_portuguese_without_changes` |
| AC08 — Atomicidade | aprovado (teste) | Falha forçada depois do envio do `DELETE` e do `UPDATE` ao PostgreSQL → hash e as 2 sessões idênticos ao antes; login com a senha antiga segue 200 | `test_password_reset_integration.py::test_ac08_database_failure_keeps_password_and_sessions_intact` |
| AC09 — Documentação da operação | aprovado (documental) | `docs/apps/backend.md` (parágrafo de sessão/CLI) e `README.md` (passo 4) trazem `uv run python -m app.auth.reset_password EMAIL`, o lembrete de confirmar a identidade fora do sistema, o efeito nas sessões e como rodar contra o banco Stage (sem Shell no Render Free) | commit `daad98f` |

## Portões e checagens

| Comando | Resultado |
|---|---|
| `uv run pytest -q tests/test_password_reset.py tests/test_password_reset_integration.py` (com `TEST_DATABASE_URL`) | **17 passed**, 0 skipped |
| `node .agents/scripts/gates.mjs --scope backend` (com `TEST_DATABASE_URL`, ponta `daad98f`) | install ✔, lint ✔ (`All checks passed!`), test **✘: 1 failed, 563 passed, 2 skipped** |
| Skips | 2 × `tests/test_stage_start.py:22: POSIX startup script runs in the Linux image` (Windows) |
| `python .agents/skills/cyclomatic-complexity/scripts/complexity_report.py backend/app --changed origin/develop` | 33 blocos, média 2,88 (A), A 30 · B 3, nenhum rank C ou pior. Uma primeira versão do teste de integração tinha rank C (CC 16) e foi dividida em helpers |
| `node .agents/scripts/docs-impact.mjs` | `docs/apps/backend.md` alterado; `docs/architecture.md` a revisar: conferido, descreve `app/auth` em alto nível e continua correto sem edição |

### Falha pré-existente fora do escopo

`tests/test_login_flow_integration.py::test_ac17_open_session_keeps_working_while_the_source_is_blocked`
falha com `assert (401 == 200)` em `/api/auth/me`. Reproduzida também em `origin/develop` `8c860d3`
(worktree destacada temporária, sem nenhum código desta spec; removida em seguida), portanto não é
regressão da 0059. Causa observada no código: o login grava `expires_at` com o relógio fixo do teste
(`NOW = 2026-11-13 12:00 UTC` + 24 h), mas `current_user` em `app/auth/routes.py` compara com
`datetime.now(UTC)` real; desde 14/11/2026 a sessão já nasce vencida. A correção toca `routes.py`
ou o teste da 0057, fora do escopo exclusivo desta spec (a 0060 altera `routes.py`).

## Pendências

- Portão `backend:test` vermelho pela falha pré-existente acima; precisa de correção em spec/PR próprio
  (ou na 0060) antes do CI desta PR ficar verde.
- R3 (`doc-sync-onboarding`) e R4 (PR). R1 e R2 foram feitos; as correções estão na seção final.
- `docs/PROGRESS.md` fica com o orquestrador.

## QA (R2)

Registro do agente `qa` em 22/11/2026, ponta avaliada **`42e2173`**, sem alteração de código de
produção. Saídas brutas em [`qa/`](qa/) (senhas descartáveis redigidas como `<SENHA_ANTIGA>`,
`<SENHA_NOVA>`, `<SENHA_OUTRA>`); o método completo está em `qa/00-como-foi-feito.txt`.

### Fronteiras da evidência

| Camada | Real | Simulado | Limite |
|---|---|---|---|
| Banco | PostgreSQL 17.12 descartável `bestprice-0059-qa-pg` (localhost:55462), migrações até `20261113loginfail` | Anúncio monitorado da conta A semeado por SQL (sem Mercado Livre) | Banco Stage (Supabase) não foi tocado |
| API | `uvicorn app.main:app --port 8059` no host, `APP_ENV=development`, login e `/api/auth/me` por `curl` com três cookie jars | — | Sem navegador real; "dois navegadores" = dois cookie jars |
| CLI | `app.auth.provision` e `app.auth.reset_password` reais, na imagem de `backend/Dockerfile`, sob pseudo-terminal Linux real (`pty`), lendo o estado `ECHO` do termios no momento de cada resposta | Respostas digitadas por um driver (`ptydrive.py`, fora do repositório) a partir de variáveis de ambiente | Eco no console Windows não observado (ver abaixo) |

Controle negativo do driver: contra um programa com `input()` comum, o mesmo driver registrou
`ECHO [True, True]` e a resposta na transcrição; logo, a leitura `ECHO [False, False]` das CLIs é
observação, não artefato do driver.

### Matriz de aceite (R2)

| AC | Veredito | Comando | Resultado observado |
|---|---|---|---|
| AC01 | aprovado | `ptydrive.py app.auth.reset_password "  ANA.QA@Exemplo.COM "` e logins por `curl` (`qa/03-e2e.txt` passos 5 e 7; `qa/05-anuncios-api.txt`) | CLI: "Senha redefinida; sessões encerradas", exit 0. Login com a senha antiga → `401 invalid_credentials`; com a nova → 200 e `/api/auth/me` 200. `users.id` igual; `md5(password_hash)` mudou de `35b466fd…` para `f95fadf9…`; o vínculo `22222222-…0001` segue ativo com o mesmo `active_since`; `GET /api/tracked-products` da nova sessão devolve o mesmo anúncio |
| AC02 | aprovado | o mesmo comando com `"  ANA.QA@Exemplo.COM "` | Encontrou a conta `ana.qa@exemplo.com` (a mesma do login); nenhuma conta nova |
| AC03 | aprovado | `ptydrive.py app.auth.reset_password ninguem@exemplo.com` (passo 1) | exit 2, `error: Nenhuma conta com este e-mail.`; `count(*) users LIKE 'ninguem%'` = 0; hashes, sessões e anúncios idênticos ao antes |
| AC04 | aprovado (parcial no E2E) | senha de 11 caracteres (passo 3) | exit 2, `A senha precisa ter pelo menos 12 caracteres.`, estado intacto. 1025 caracteres e não UTF-8 ficam com a evidência automatizada (B2) |
| AC05 | aprovado | confirmação diferente (passo 2) | exit 2, `As senhas não conferem`; hash e as 2 sessões da conta A intactos (`/api/auth/me` segue 200 nos dois jars) |
| AC06 | aprovado | `curl -b jar-a1/jar-a2/jar-b /api/auth/me` após a redefinição (passo 6) | jar-a1 e jar-a2 → `401 unauthenticated`; jar-b (conta B) → 200; `user_sessions` da conta A = 0, da conta B = 1 |
| AC07 | aprovado, com achado Q1 | prompts sob pty; senha como argumento (passo 4); busca nos logs (`qa/04-logs.txt`) | `ECHO [False, False]` em toda leitura de senha; nenhuma senha na transcrição do terminal em sucesso e erros; 0 ocorrências das 5 senhas no log do uvicorn e no log do PostgreSQL; nenhum hash scrypt no log do banco. Senha como argumento é recusada (exit 2, hash intacto), **mas o argparse ecoa o valor**: ver Q1 |
| AC08 | não reexecutado no R2 | — | Depende de falha injetada; fica com o teste de integração (17 passed nesta rodada) |
| AC09 | aprovado (documental) | leitura de `README.md` passo 4 e `docs/apps/backend.md` §sessão/CLI, cruzados com `docs/apps/infraestrutura.md` | Comando local correto (`uv run python -m app.auth.reset_password EMAIL` em `backend/`, conferido nesta rodada); lembrete de confirmar a identidade fora do sistema; efeito nas sessões; Stage: rodar com a `DATABASE_URL` do banco Stage só na sessão do terminal, coerente com "Render Free não disponibiliza Shell" (`infraestrutura.md`). O procedimento de Stage **não foi executado** (sem acesso e fora do escopo) |

### Achados

- **Q1 (baixa severidade, AC07):** se a operação digitar a senha por engano como argumento, o
  comando a recusa sem alterar nada, mas a mensagem de erro do argparse a repete no stderr.
  Reprodução: `python -m app.auth.reset_password pessoa@exemplo.com SENHA` →
  `reset_password.py: error: unrecognized arguments: SENHA` (o mesmo com `--password SENHA`).
  O AC07 diz que a senha "não é escrita em saída, log ou mensagem de erro". O valor já ficou
  exposto no histórico do shell por erro de quem digitou, então o impacto extra é pequeno, mas
  `test_ac07_password_is_not_accepted_as_argument` não confere o stderr e não pegaria isso. O
  `provision` tem o mesmo comportamento (fora do escopo). Decisão de corrigir fica com o
  orquestrador/revisão.
- **Limite (AC07, Windows):** no host Windows, `printf … | uv run python -m app.auth.reset_password
  …` ficou esperando o console (o `getpass` do Windows lê via `msvcrt`, sem fallback para stdin),
  terminou por `timeout` (exit 124) sem saída e sem alterar a conta (`qa/06-host-windows.txt`). O
  eco desligado foi observado só no terminal Linux (pty); no console Windows não foi observado.

### Portões nesta rodada

| Comando | Resultado |
|---|---|
| `uv run pytest -q -rs tests/test_password_reset.py tests/test_password_reset_integration.py` (com `TEST_DATABASE_URL` no container de QA, banco `bestprice_test`) | **17 passed**, 0 skipped |
| `node .agents/scripts/gates.mjs --scope backend` (mesma `TEST_DATABASE_URL`) | install ✔, lint ✔ (`All checks passed!`), test ✘: **1 failed, 563 passed, 2 skipped** — a falha é a mesma pré-existente `test_login_flow_integration.py::test_ac17_…` já descrita acima; os 2 skips são os POSIX de `test_stage_start.py` |

CI, PR, Project e release não foram verificados pelo QA.

### Limpeza

Container `bestprice-0059-qa-pg`, imagem `bestprice-0059-qa-api` e o processo uvicorn da porta
8059 removidos/parados ao final.

## Correções de R1 e R2

Registro do agente `backend` em 22/11/2026. A ponta inicial era `5ad760c` (commit da QA) e a ponta
avaliada é **`45dc5a5`**. PostgreSQL 17 descartável `bestprice-0059-test-pg` (localhost:55459), removido ao final.

| Item | Origem | Red (motivo esperado) | Green | Commit |
|---|---|---|---|---|
| 1 — Corrida login × redefinição | R1 (importante) | `test_race_login_in_progress_cannot_keep_a_session_after_the_reset`: `AssertionError: o reset não esperou a trava do login em andamento`; `test_race_login_started_during_the_reset_reads_the_new_hash`: `AssertionError: o login não esperou a trava do reset em curso` | `_authenticate` lê a conta com `with_for_update(read=True)` (FOR SHARE, mantido até o commit de `issue_session`); `reset_password` faz `SELECT … FOR UPDATE` na linha antes do `DELETE`. Os 2 testes passam, e as suítes de login com PostgreSQL (`test_login_concurrency_integration.py`, `test_login_flow_integration.py`) e SQLite (`test_login_http.py`, `test_auth_http.py`) também, exceto o `test_ac17` pré-existente | `e5000bc` |
| 2 — Senha ecoada pelo argparse | Q1 do R2 e sugestão 5 do R1 | `test_ac07_password_is_not_accepted_as_argument_nor_echoed[posicional/opcao/opcao-com-igual]`: o stderr continha `unrecognized arguments: senha-nova-validada-456` (e `--password …`, `--password=…`) | `parse_known_args` e `allow_abbrev=False`. Os argumentos extras saem com código 2 e a mensagem "Argumentos não reconhecidos; a senha é solicitada no terminal.", sem o valor em stdout, stderr nem log. O `provision` tem o mesmo eco: fica como observação, fora do escopo | `c4869d4` |
| 3 — Conta conferida antes dos prompts | R1 | `test_cli_checks_the_account_before_asking_for_the_password[sem-conta/email-nao-utf8]`: `assert ['Nova senha …', 'Confirme a nova senha: '] == []` | `utf8_encodable(email)` e `find_account` rodam antes do `getpass`, com as mesmas mensagens e o código 2; `reset_password` continua conferindo a conta na própria transação | `58c27ab` |
| 4 — Hash fora da trava | R1 | Refatoração sem mudança observável (sem Red) | `hash_password` roda antes do `SELECT … FOR UPDATE`; 23 passed | `479eb5f` |
| 5 — AC08 autossuficiente | R1 | Mudança de teste. Controle por mutação (commit separado após o `DELETE`): falha com sessões `0 != 2` | Dentro do listener `after_flush`, a própria transação vê `(sessões=0, hash novo)`, `inside == [(0, True)]`; depois do rollback, hash e as 2 sessões voltam a ser os de antes | `3e37df7` |
| 6 — DATABASE_URL do Stage fora do histórico | R1 | Documentação | `docs/apps/backend.md`: no PowerShell, `Read-Host -AsSecureString` e `Remove-Item Env:DATABASE_URL`; no bash, `read -rs` e `unset`. Também registra as travas do login e do reset | `45dc5a5` |

### Portões nesta rodada (ponta `45dc5a5`)

| Comando | Resultado |
|---|---|
| `uv run pytest -q tests/test_password_reset.py tests/test_password_reset_integration.py` (com `TEST_DATABASE_URL`) | **23 passed**, 0 skipped |
| `node .agents/scripts/gates.mjs --scope backend` (com `TEST_DATABASE_URL`) | install ✔, lint ✔, test ✘: **1 failed, 569 passed, 2 skipped**. A falha é só o `test_ac17` pré-existente; os skips são os 2 POSIX de `test_stage_start.py` |
| `complexity_report.py backend/app --changed origin/develop` | 65 blocos, média 2,63 (A), A 58 · B 7, nenhum rank C ou pior |
| `node .agents/scripts/docs-impact.mjs` | `docs/apps/backend.md` alterado (por `reset_password.py` e `routes.py`). `docs/architecture.md` a revisar: conferido, continua correto sem edição |

Limites: as corridas foram exercitadas com as funções reais (`_authenticate`, `issue_session`,
`reset_password`) em threads e sessões independentes no PostgreSQL. A espera foi detectada em
`pg_stat_activity` (`wait_event_type = 'Lock'`), não por requisições HTTP concorrentes. O eco no console
Windows continua não observado (ver R2).
