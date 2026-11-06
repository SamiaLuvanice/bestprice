# QA — 0048 Cadastro self-service (I1, I2, Q1)

Data: 06/11/2026. Worktree `.worktrees/feature-0048-issue-252-cadastro-self-service`, branch
`feature/0048-issue-252-cadastro-self-service`, HEAD `e71cf29`. Papel: `.agents/agents/qa.md`.
Nenhum arquivo rastreado foi alterado; nenhum commit. Saídas brutas em [saidas/](saidas/)
(tokens de sessão mascarados) e capturas em [capturas/](capturas/).

## Ambiente (três serviços reais, sem Docker)

Docker Desktop desligado (`docker ps` → `failed to connect to the docker API at npipe:...`).
Por isso, em vez do Compose, foram usados os três serviços reais locais:

| Serviço | Como | Observação |
|---|---|---|
| PostgreSQL 18 | `initdb -D <scratchpad>/qa/pgdata -U bestprice -A scram-sha-256 -E UTF8 --locale=C`; `pg_ctl ... -o "-p 55449 -c listen_addresses=127.0.0.1" start`; `createdb bestprice_qa` | Cluster descartável exclusivo do QA; o serviço PostgreSQL instalado e o cluster do agente backend (55448) não foram tocados. Senha de teste, não real. |
| Migrações | `DATABASE_URL=… uv run alembic upgrade head` → `20261106signup (head)`; `\d signup_attempts`: `bigint identity`, `character(64)`, `timestamptz`, 2 índices, RLS ligado | |
| API | `uv run uvicorn app.main:app --host 127.0.0.1 --port 8048` (`APP_ENV=development`, `AI_ENABLED=false`) | Fase I1: `SIGNUP_ENABLED=false`. Fase I2: `SIGNUP_ENABLED=true`, `SIGNUP_RATE_LIMIT_ATTEMPTS=5`, `SIGNUP_RATE_LIMIT_WINDOW_MINUTES=1`, `SIGNUP_SOURCE_HASH_SECRET=qa-local-hash-secret-0048-nao-real-abcdef` (valor de teste), `--log-level debug`. |
| SPA | `API_PROXY_TARGET=http://127.0.0.1:8048 npx vite --host 127.0.0.1 --port 5148` | Os `curl` de I2 passam pelo proxy do Vite (mesmo caminho do navegador). |
| Navegador | Playwright `chromium` headless do `frontend/node_modules` (scripts em `saidas/*.cjs`) | |
| CLI | `uv run python saidas/qa_provision.py EMAIL` | Executa o `app.auth.provision.main()` real; só substitui `getpass.getpass` por leitura do stdin, porque no Windows o `getpass` lê o console (msvcrt) e não aceita pipe. Argparse, regras e banco são os reais. |

Ao final: Vite, API e PostgreSQL parados (`curl` sem resposta em 5148/8048; `psql` → `Connection refused`).

**Simulação × real:** tudo abaixo roda contra API + PostgreSQL + SPA reais, exceto onde está
marcado **(simulado)**: falha de rede no navegador via `page.route(...).abort('internetdisconnected')`.
O 503 de `/api/health` e o comportamento com banco fora do ar são reais (`pg_ctl stop`).

## Gates (ponta `e71cf29`)

Arquivo: [saidas/gates.txt](saidas/gates.txt). Rodados em sequência, sem outra carga de testes do QA.

| Comando | Resultado |
|---|---|
| `backend/: uv run ruff check .` | All checks passed! (exit 0) |
| `backend/: TEST_DATABASE_URL=postgresql://bestprice:***@127.0.0.1:55449/bestprice_qa_test uv run pytest -q -p no:cacheprovider -rs` | **417 passed, 2 skipped**, 1 warning em 50,54 s (exit 0). Skips: só `test_stage_start.py` (script POSIX). As integrações PostgreSQL rodaram. |
| `frontend/: npm run lint` | `eslint .` sem problemas (exit 0) |
| `frontend/: npm test -- --run` | **Test Files 38 passed (38), Tests 511 passed (511)** (exit 0) |
| `frontend/: npm run build` | `✓ built in 1.40s` (exit 0) |

## Health

[saidas/health-503.txt](saidas/health-503.txt)

| Cenário | Observado |
|---|---|
| Banco no ar: `curl -i /api/health` | `200` `{"status":"ok","database":"ok"}` |
| `pg_ctl stop -m fast` → `curl -i /api/health` | `503` `{"status":"unavailable","database":"unavailable"}` |
| Banco parado: `GET /api/auth/signup` | `200 {"enabled":true}` (não depende do banco, como no plano) |
| Banco parado: `POST /api/auth/signup` | `500 text/plain "Internal Server Error"`; `POST /api/auth/login` responde igual (comportamento preexistente da API com banco fora, não introduzido pela 0048) |
| Banco parado, UI `/cadastro` | alerta "Não foi possível criar a conta agora. Tente novamente." ([capturas/banco-parado-cadastro-1440.png](capturas/banco-parado-cadastro-1440.png)) |
| Banco religado | health `200`; `POST` válido → `201` (os envios com banco parado não contaram) |

## Resultado por critério

| AC | Situação | Evidência (comando → observado) |
|---|---|---|
| AC01 | **aprovado** | Playwright ([saidas/ui_on.txt](saidas/ui_on.txt)): landing com 1 link "Criar conta"; login com 1 link; clique no login → `/cadastro`, título "Criar conta · BestPrice". Com sessão, `goto /cadastro` → `/app/dashboard`. Capturas `ac01-landing-1440.png`, `ac01-cadastro-1440.png`. |
| AC02 | **aprovado** | `curl -i POST /api/auth/signup {" Ana@Exemplo.com ", …}` → `201 {"id":…,"email":"ana@exemplo.com"}` + `Set-Cookie: bestprice_session=…; HttpOnly; Max-Age=86400; Path=/api; SameSite=lax`; `GET /api/auth/me` com esse cookie → `200` sem login ([saidas/ac02-ac03-ac07.txt](saidas/ac02-ac03-ac07.txt)); `/api/dashboard` vazio. UI: cadastro de `Maria@Exemplo.com` → `/app/dashboard`, sem POST de login; landing "Começar com IA" → `/login?returnTo=%2Fapp%2Fassistant` → link `/cadastro?returnTo=%2Fapp%2Fassistant` → cadastro (Enter) → `/app/assistant`. Capturas `ac02-painel-apos-cadastro-1440.png`, `ac02-returnto-assistente-1440.png`. |
| AC03 | **aprovado** | logout → `204`; `/me` → `401`; `POST /api/auth/login` `ana@exemplo.com` + senha original → `200` com novo cookie. UI: login de `maria@exemplo.com` (criada pelo cadastro) → painel ([saidas/ui_dash.txt](saidas/ui_dash.txt)). |
| AC04 | **aprovado** | Cadastro `" Ana@Exemplo.com "` gravado como `ana@exemplo.com` (psql); login com `ana@exemplo.com` → `200`; novo cadastro `ANA@exemplo.com` → `409 email_already_registered` ([saidas/loteA.txt](saidas/loteA.txt)). |
| AC05 | **aprovado** | `a@b` → `422 email_invalid` "Informe um e-mail válido, como nome@exemplo.com."; `"   "` → `422 email_required`; 321 caracteres → `422 email_too_long`; nenhuma conta criada (psql). UI: erro sob o campo, `aria-invalid=true`, `aria-describedby=signup-email-error`, foco no e-mail, sem POST (captura `ac05-ac06-erros-locais-1440.png`). |
| AC06 | **aprovado** | Servidor: senha 10 → `422 password_too_short` (junto com o erro de e-mail, dois campos de uma vez); 1025 → `422 password_too_long`. UI: senha curta e confirmação diferente ("As senhas não conferem.") por campo, sem envio, valores preservados. Recusa do servidor em campo coberta pelos testes do frontend (a UI barra antes de enviar). |
| AC07 | **aprovado** | `409` com `fields[email]`, **sem `Set-Cookie`** (0 cookies no jar); `password_hash` da conta idêntico antes/depois (`cmp` → "INALTERADO"); login com a senha do duplicado → `401`; com a original → `200`. UI: "Já existe uma conta com este e-mail. Entrar" com link `/login?returnTo=%2Fapp%2Fassistant`, e-mail preservado, senhas limpas (captura `ac07-duplicado-1440.png`). |
| AC08 | **aprovado** | Dois `curl` em paralelo com o mesmo e-mail em caixas diferentes, 3 rodadas: sempre um `201` e um `409 email_already_registered` (sem `Set-Cookie`), exatamente 1 usuário e 1 sessão, nenhum 5xx no log ([saidas/ac08-concorrencia.txt](saidas/ac08-concorrencia.txt), [saidas/loteB.txt](saidas/loteB.txt)). Limite: a sobreposição real dos dois pedidos não é garantida por `curl` (respostas em 0,153 s e 0,156 s); a corrida determinística está em `test_signup_concurrency_integration.py` (2 passed na suíte acima). Em `loteB.txt` os corpos da rodada `simul` se sobrescreveram (o Windows não diferencia caixa no nome do arquivo); os códigos `201`/`409` vêm do `-w` e valem; as rodadas `conc1`/`conc2` usam arquivos distintos. |
| AC09 | **aprovado** | Janela de 1 min. 5 envios (201, 409, 422, 422, 422) e o 6º, válido → `429 signup_rate_limited`, `Retry-After: 59`, `retry_after_seconds: 59`, sem conta criada. 17 s depois → `429`, `Retry-After: 42` e ainda 5 linhas (a recusa não conta). Às 15:57:30 (após o prazo) → `201`; o purge deixou 1 linha ([saidas/ac09-recuperacao.txt](saidas/ac09-recuperacao.txt)). UI 390 px: alerta "Muitas tentativas de cadastro. Tente novamente em 1 minuto.", e-mail preservado (captura `ac09-limite-390.png`). Padrão 60 min não exercitado em tempo real (coberto pelos testes com relógio fixo). |
| AC10 | **aprovado** (com observações) | psql: `signup_attempts` tem só `id`, `source_hash char(64)`, `attempted_at`; os 5 `source_hash` = HMAC-SHA256(`127.0.0.1`) com o segredo de teste; nenhum contém o IP nem o SHA-256 sem segredo. `users.password_hash` todos `scrypt$…` (168 caracteres) ([saidas/ac10-banco.txt](saidas/ac10-banco.txt)). Log do uvicorn (debug, 721 linhas): 0 ocorrências de 15 senhas usadas, do segredo do HMAC, da senha do banco e do hash da origem ([saidas/ac10-logs.txt](saidas/ac10-logs.txt)). Log do PostgreSQL: sem senha nem hash ([saidas/ac10-pglog.txt](saidas/ac10-pglog.txt)). Respostas: nenhum corpo ecoa senha; Pydantic (`string_type`, `extra_forbidden`) sem eco ([saidas/ac10-eco.txt](saidas/ac10-eco.txt)). Ver observações O1 e O2. |
| AC11 | **aprovado** | Conta `ops` semeada via psql com monitoramento, alerta, notificação e conversa com mensagem ([saidas/ac11-seed-outra-conta.sql](saidas/ac11-seed-outra-conta.sql)); controle: `ops` enxerga os próprios dados. Conta `maria` (criada pela UI): `/api/dashboard`, `/api/tracked-products`, `/api/notifications`, `/api/research` vazios; monitoramento, alerta e histórico da `ops` → `404 resource_not_found`; conversa → `404 research_not_found`; `PATCH` da notificação → `404` ([saidas/ac11-isolamento.txt](saidas/ac11-isolamento.txt)). |
| AC12 | **aprovado** | CLI ([saidas/ac12-cli.txt](saidas/ac12-cli.txt)): conta válida → "Conta criada" (exit 0) e login `200`; `a@b` → "Informe um e-mail válido…" (exit 2); 331 caracteres com 10 espaços em cada ponta (311 após o strip) → "O e-mail pode ter no máximo 320 caracteres."; senha 1025 → "…no máximo 1024…"; senha 11 → "…pelo menos 12…"; confirmação diferente → "As senhas não conferem"; `MARIA@exemplo.com` e `ana@exemplo.com` (criadas pelo cadastro) → "Já existe uma conta com este e-mail." Nenhuma conta recusada foi gravada. A CLI também funcionou com o interruptor desligado (I1). |
| AC13 | **pendente** (bloqueado por D1) | Sem quadros aprovados no Figma; comparação visual 1440/390 não executável. Conferido só o funcional: rótulos visíveis ("E-mail", "Senha", "Confirmar senha"); aviso de privacidade visível antes do envio; Tab: e-mail → senha → Mostrar senha → confirmação → Mostrar confirmação → Criar conta → Entrar → Voltar para o início; Enter envia; foco vai ao primeiro campo inválido com `aria-invalid`/`aria-describedby`; alerta geral com `role="alert"`; 390 px sem quebra funcional (captura `ac13-cadastro-390.png`). Ver O3. |
| AC14 | **aprovado** | Interruptor desligado ([saidas/ui_off.txt](saidas/ui_off.txt)): `GET /api/auth/signup` → `200 {"enabled":false}` com `cache-control: no-store`; `POST` (válido e JSON malformado) → `404 signup_unavailable`; psql: 0 usuários e 0 tentativas; landing e login sem "Criar conta"; `/cadastro?returnTo=/app/assistant` → `/login?returnTo=%2Fapp%2Fassistant` sem formulário (captura `ac14-off-cadastro-redireciona-login.png`); CLI cria `ops@exemplo.com` e o login (API e UI) funciona, indo para `/app/assistant`. Ligado: AC01–AC12 acima. Falha rápida: `SIGNUP_ENABLED=true` sem `SIGNUP_SOURCE_HASH_SECRET` → `RuntimeError: SIGNUP_SOURCE_HASH_SECRET é obrigatório com SIGNUP_ENABLED=true`, "Application startup failed", exit 3. |

## Falha de rede na UI (simulado no navegador)

[saidas/ui_on2.txt](saidas/ui_on2.txt)

- POST abortado → alerta "Não foi possível criar a conta agora. Tente novamente.", e-mail
  preservado, senha limpa (captura `rede-falha-post-1440.png`).
- GET de disponibilidade abortado → login sem "Criar conta"; `/cadastro` mostra "Não foi
  possível verificar o cadastro agora. Tente novamente."; "Tentar novamente" com a rede de
  volta mostra o formulário (captura `rede-falha-disponibilidade-1440.png`).

## Defeitos

Nenhum defeito funcional encontrado nos AC verificáveis localmente.

Falso alarme investigado: a primeira captura do painel após o cadastro saiu em branco. A
reprodução ([saidas/ui_dash.txt](saidas/ui_dash.txt)) mostra o corpo vazio em t≈0 e o painel
completo em ~1 s, **igual ao fluxo de login** (comparação `comparacao-painel-apos-login-1440.png`).
Era a captura antes da renderização; a captura vazia foi descartada.

## Observações (não bloqueiam; decidir em revisão)

- **O1 — IP no access log do uvicorn.** O access log padrão registra o peer
  (`127.0.0.1:porta - "POST /api/auth/signup"`, 105 ocorrências). Localmente o peer **é** a
  origem do limite. Em Stage, o peer é o salto do Render e o IP do visitante chega por
  `x-bestprice-client-ip`, que não é logado. Então o IP do visitante não deve aparecer no
  log da aplicação em Stage. Isso é inferência pelo plano e pelo `start-stage.sh` (sem
  `--proxy-headers`), não verificado em Stage. A borda do Render/Cloudflare mantém os próprios
  logs, fora do alcance da aplicação.
- **O2 — e-mail no log do PostgreSQL.** Cada `409` gera no log do servidor
  `DETAIL: Key (email)=(ana@exemplo.com) already exists.` Não é senha nem IP (AC10 atendido),
  mas é dado pessoal no log do banco do ambiente.
- **O3 — anúncio de erros de campo (AC13/F9).** Os `<p class="field-error">` não têm
  `role="alert"` nem `aria-live`. O anúncio depende do foco no primeiro campo inválido +
  `aria-describedby`; erros de outros campos só são lidos quando o campo recebe foco. Validar
  com leitor de tela real em F9.
- **O4 — layout provisório.** Há um espaço grande entre o campo de senha e a dica "Use pelo
  menos 12 caracteres." (`ac05-ac06-erros-locais-1440.png`, `ac09-limite-390.png`). É
  esperado até D1/F8.
- **O5 — banco fora do ar.** `POST /api/auth/signup` responde `500 text/plain`, sem o
  envelope `{"error":…}`, igual ao login (preexistente). A UI trata como falha genérica.

## Pendências

- **AC13:** bloqueado por D1 (Figma) → F8/F9.
- **I3 (Stage):** não executável aqui. Inclui a promoção com o interruptor desligado e a
  origem real atrás do Pages (`API_PROXY_SECRET`/`TRUSTED_PROXY_SECRET`, 6 envios de um IP e
  1 de outro).
- **Compose:** não executado (Docker desligado); substituído pelos três serviços reais locais
  descritos acima.
- O padrão de 60 min do AC09 foi exercitado só com a janela configurada em 1 min.
- Nenhum resultado de CI, Project ou release foi observado ou é afirmado aqui.
- `verification.md`, `tasks.md` e `docs/` não foram editados (fora do escopo deste QA).

---

# Rodada 2 — HEAD `e5efe96`

Delta desde `e71cf29`:
- backend, correções da revisão R1: regra de e-mail sem `\s`/`strip()`, NUL, JSON aninhado, purge fora do caminho da requisição, segredos distintos, `hide_parameters`;
- frontend: correções R-1 a R-3 e região `role="status"`;
- F8–F10: layout aprovado em D1 e Playwright.

Saídas em [saidas-r2/](saidas-r2/) e capturas em [capturas-r2/](capturas-r2/).

## Ambiente

Mesmo cluster de QA da rodada 1 (127.0.0.1:55449), religado, com um **banco novo** `bestprice_qa2`
(`alembic upgrade head` → `20261106signup (head)`) e `bestprice_qa_test` recriado para o pytest.

- API uvicorn em 8048 (`--log-level debug`), primeiro com `SIGNUP_ENABLED=true`, 5 tentativas, janela de 1 min e `SIGNUP_SOURCE_HASH_SECRET` de teste; depois com `SIGNUP_ENABLED=false` (AC14).
- SPA Vite em 5148 e Chromium headless.
- Ao final: API, Vite e PostgreSQL parados; `git status` mostra só `qa/` não rastreado.

## Gates (ponta `e5efe96`)

Saída: [saidas-r2/r2-gates.txt](saidas-r2/r2-gates.txt).

| Comando | Resultado |
|---|---|
| `uv run ruff check .` | All checks passed! |
| `uv run pytest -q -p no:cacheprovider -rs` com `TEST_DATABASE_URL` (PostgreSQL real) | **446 passed, 2 skipped** (só `test_stage_start.py`, POSIX) |
| `npm run lint` | exit 0 |
| `npm test -- --run` | **Test Files 38 passed, Tests 530 passed** |
| `npm run build` | `✓ built in 1.17s` |
| `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5148 npx playwright test tests/visual/signup.spec.ts` | **24 passed, 48 skipped** (os quadros rodam só no projeto `viewport-1280`), sem diferença contra as baselines |

## (a) Correções do delta

| Verificação | Comando | Observado | Situação |
|---|---|---|---|
| NUL no e-mail | `curl -i POST /api/auth/signup` com `{"email":"marcanul\u0000x@exemplo.com",…}` | `422 email_invalid` | aprovado |
| U+001C | `"marcafs\u001cx@exemplo.com"` | `422 email_invalid` | aprovado |
| BOM no início | `"﻿marcabom@exemplo.com"` | `422 email_invalid` | aprovado |
| NBSP no início | `" marcanbsp@exemplo.com"` | `422 email_invalid` (não é mais removido pelo `strip`) | aprovado |
| `a@b..com` | `"marcadot@b..com"` | `422 email_invalid` | aprovado |
| Sem 500 e sem dado no log | access log + varredura | 5 × 422 e o 6º 429; 0 respostas 5xx. Marcadores do e-mail e das senhas: 0 no uvicorn e 0 no PostgreSQL. Nenhum `Traceback` ou `RecursionError` ([r2-logs.txt](saidas-r2/r2-logs.txt)) | aprovado |
| JSON aninhado no campo | 100 000 níveis em `email` (200 045 bytes) | `422 json_required` | aprovado |
| JSON aninhado no corpo | 1 000 000 níveis (2 000 000 bytes) | `422 json_required` | aprovado |
| Segredos iguais, cadastro ligado | `SIGNUP_ENABLED=true TRUSTED_PROXY_SECRET=S SIGNUP_SOURCE_HASH_SECRET=S uvicorn …` | `RuntimeError: TRUSTED_PROXY_SECRET e SIGNUP_SOURCE_HASH_SECRET devem ser diferentes`, "Application startup failed", exit 3 | aprovado |
| Segredos iguais, cadastro desligado | o mesmo com `SIGNUP_ENABLED=false` | mesma recusa, exit 3; o valor do segredo aparece 0 vezes na saída bruta com traceback | aprovado |

Saídas: [r2-emails-invalidos.txt](saidas-r2/r2-emails-invalidos.txt),
[r2-lote2.txt](saidas-r2/r2-lote2.txt) e [r2-segredos-iguais.txt](saidas-r2/r2-segredos-iguais.txt).
Os 5 envios inválidos contaram para o limite: 5 tentativas na tabela e o 6º envio deu 429.

## (b) Regressão

| AC | Observado | Situação |
|---|---|---|
| AC02 | `" Rita@Exemplo.com "` → `201`, cookie `HttpOnly; Max-Age=86400; Path=/api; SameSite=lax`, `/me` com o cookie → a conta `rita@exemplo.com` | aprovado |
| AC07 | `RITA@exemplo.com` → `409` com `fields[email]`, 0 cookies, `password_hash` idêntico (`scrypt$`); login com a senha do duplicado → `401`, com a original → `200` | aprovado |
| AC09 | 5 envios (422, 422, 201, 409, 422) e o 6º → `429`, `Retry-After: 55`; após o prazo (16:58:31) → `201`. A tabela tinha 10 linhas no 429: as vencidas não são mais apagadas no caminho da requisição (item 5 da revisão). Esperado; a contagem respeita a janela | aprovado |
| AC14 | Desligado: GET `{"enabled":false}` + `no-store`; POST válido e POST com NUL → `404 signup_unavailable`; tentativas 21/21 e usuários 3/3 antes/depois; landing e login sem "Criar conta"; `/cadastro?returnTo=/app/assistant` → `/login?returnTo=%2Fapp%2Fassistant`; CLI cria `ops@exemplo.com`; login pela UI → `/app/assistant` ([r2-ac14.txt](saidas-r2/r2-ac14.txt)) | aprovado |

## (c) AC13 — UI real contra os PNGs aprovados (`evidence/`)

Roteiro: [saidas-r2/ui_r2.cjs](saidas-r2/ui_r2.cjs). Saídas:
[r2-ui-desktop.txt](saidas-r2/r2-ui-desktop.txt) e [r2-ui-mobile.txt](saidas-r2/r2-ui-mobile.txt).

- Viewports iguais aos quadros: 1440 × 1040 e 390 × 899; menu da landing em 390 × 844.
- API real para os 409 e 429.
- Simulados no navegador: o atraso de 2,5 s para capturar "enviando", a falha de rede e o 429 de 15 min usado para medir o botão.
- Comparação a olho, lado a lado, sem diff de pixels (as fontes são diferentes).

| Estado | Captura real | Quadro Figma | Resultado |
|---|---|---|---|
| Padrão | `r2-cadastro-padrao-{desktop,mobile}.png` | `0048-figma-cadastro-{desktop,mobile}.png` | Mesma composição, ordem, rótulos, ícone de olho, dica, aviso e links |
| Foco (Confirmar senha) | `r2-cadastro-foco-*` | `…-foco-*` | Anel rosa no campo, como no quadro |
| Enviando | `r2-cadastro-enviando-*` | `…-enviando-*` | "Criando conta…", `aria-busy=true`, `aria-disabled=true`, valores esmaecidos. O botão fica cinza contornado em vez de verde a 45% (diferença declarada) |
| Erros de campo | `r2-cadastro-erros-campos-*` | `…-erros-campos-*` | Ícone "!", texto e borda vermelhos, e o erro da senha no lugar da dica. Diferem o texto do erro de e-mail (declarado) e o anel de foco no e-mail focado |
| E-mail já cadastrado | `r2-cadastro-email-ja-cadastrado-*` | `…-erros-e-mail-ja-cadastrado-*` | Mensagem e "Entrar" sublinhado no campo; senhas vazias (declarada); o e-mail focado mostra o anel de foco no lugar da borda vermelha |
| Limite | `r2-cadastro-limite-*` e `r2-cadastro-limite-15min-mouse-fora-mobile.png` | `…-erros-limite-de-tentativas-*` | Alerta com o fundo e a borda do quadro, entre o aviso e o botão. Com a janela do QA o texto diz "1 minuto"; com 900 s, "15 minutos", igual ao quadro |
| Falha de rede | `r2-cadastro-falha-de-rede-*` | `…-erros-falha-de-rede-*` | Alerta "Não foi possível criar a conta agora. Tente novamente." |
| Login com Criar conta | `r2-login-{desktop,mobile}.png` | `0048-figma-login-*` | "Ainda não tem conta? Criar conta" abaixo de Entrar; link sublinhado, alvo de 79 × 46 |
| Landing desktop | `r2-landing-desktop.png` | `0048-figma-landing-desktop.png` | "Criar conta" contornado, 128 × 44, à esquerda de "Entrar" (x = 966 contra x = 1106); os demais itens divergem desde antes (declarado) |
| Menu móvel aberto | `r2-landing-menu-aberto-mobile.png` | `0048-figma-landing-menu-aberto-mobile.png` | "Criar conta" contornado, 350 × 44, abaixo de "Entrar"; os demais itens divergem desde antes (declarado) |

**Diferenças já declaradas em `frontend-evidence.md` (F8–F10), confirmadas:**
- fonte do sistema;
- posição vertical mais alta: marca em y ≈ 160 no desktop e ≈ 50–95 no mobile, contra 180 e 130 nos quadros;
- texto "Informe um e-mail válido, como nome@exemplo.com.";
- "enviando" sem opacidade;
- senhas limpas após recusa do servidor;
- links do texto sublinhados;
- itens da landing ("Como funciona" e "Comparador", "Entrar" como texto, "Começar com IA");
- na landing desktop, a ordem do Tab é Entrar → Criar conta, enquanto a ordem visual é Criar conta → Entrar.

**Outras diferenças observadas (não declaradas, menores):**
- **V1:** nos estados de recusa do servidor (409, 429, rede), o foco vai para um campo: e-mail no 409, senha no 429 e na falha de rede. O anel rosa toma o lugar visual da borda vermelha de inválido; os quadros mostram o estado sem foco. É consequência da regra de foco de F6, não uma regressão.
- **V2:** a marca mostra o sobrescrito "AI" ("BestPrice AI"), e os quadros da landing mostram "IA". Já existia antes e fica fora do escopo da 0048.
- **V3 (não é defeito):** algumas capturas feitas após um envio mostram o botão "Criar conta" verde-claro. A medição ([r2-botao-estado.txt](saidas-r2/r2-botao-estado.txt)) mostra que é a transição de 0,15 s na saída do estado "enviando": `rgb(115,252,90)` logo após a resposta e `rgb(57,255,20)` em repouso. Em repouso, a cor é a do quadro.

**Acessibilidade (funcional, em 1440 e 390):**
- Teclado: o Tab percorre e-mail → senha → Mostrar senha → confirmação → Mostrar confirmação → Criar conta → Entrar → Voltar para o início. Os campos têm `outline` sólido de 2 px e os botões e links, de 3 px; as alturas ficam entre 44 e 50 px.
- Anúncio dos erros (`role="status"`):
  - validação local: "3 campos precisam de correção: E-mail, Senha e Confirmar senha.", com foco no e-mail;
  - 409: "1 campo precisa de correção: E-mail.";
  - 429: a região fica vazia e o anúncio vem do `role="alert"`.
- A senha inválida usa `aria-describedby=signup-password-error`, e a dica sai do DOM.
- axe (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`) sem nenhuma violação, inclusive de contraste:
  - cadastro padrão e com erros de campo, nos temas claro e escuro;
  - 409 e limite;
  - login;
  - landing desktop e menu móvel aberto.
- Sem rolagem horizontal.
- Limite: não houve teste com leitor de tela real (NVDA ou VoiceOver); o anúncio foi verificado pelo DOM e pelos papéis ARIA.

**Situação do AC13:** aprovado no comportamento, no teclado, no foco, no anúncio e na
acessibilidade automatizada. A interface segue os quadros, exceto pelas diferenças declaradas e por
V1/V2. O aceite dessas diferenças pela responsável pelo design não aparece registrado na
aprovação do Figma.

## Resultado da rodada 2

| Item | Resultado |
|---|---|
| (a) e-mails com NUL, U+001C, BOM, NBSP e `a@b..com` → 422, sem 500 e sem dado no log | aprovado |
| (a) JSON profundo → 422 `json_required` | aprovado |
| (a) API não sobe com segredos iguais (ligado e desligado) | aprovado |
| AC02, AC07, AC09 e AC14 (regressão) | aprovado |
| AC13 | aprovado no funcional e na acessibilidade automatizada; diferenças visuais declaradas e V1/V2 dependem do aceite do design; leitor de tela real pendente |

**Defeitos:** nenhum defeito funcional encontrado.

**Limites:**
- AC09 testado só com janela de 1 min.
- Sem leitor de tela real.
- Comparação visual a olho, sem diff de pixels.
- I3 (Stage) continua pendente.
- O Compose não foi usado: Docker desligado, substituído pelos três serviços reais locais.
- Nenhum resultado de CI, Project ou release é afirmado.
