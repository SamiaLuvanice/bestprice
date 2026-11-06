# Tarefas — 0048

Legenda: **[B]** backend · **[F]** frontend · **[D]** design · **[I]** integração/coordenação.
Cada tarefa de comportamento registra o Red (motivo esperado da falha) e o Green, com
comando e contagem, em `backend-evidence.md` ou `frontend-evidence.md`.

## Preparação

- [x] Spec `pronta` (com AC14), Issue #252, worktree a partir de `origin/develop` `66fb0c5`.
- [x] Plano com contrato fixado ([plan.md](plan.md)).
- [x] P1 — Decisões do responsável (06/11/2026): segredo do proxy aceito; origem só como HMAC;
      e-mail `nome@domínio.tld` em toda criação de conta, sem mudar o login; 429 não conta;
      `/cadastro` desligado → `/login`. Spec e plano atualizados.

## Design (bloqueia só o visual do frontend)

- [x] D1 — Criar no Figma os quadros do [brief](design/figma-brief.md): Criar conta
      desktop 1440 e mobile 390, variantes de erro, ajuste "Criar conta" em `02 · Entrar` e
      na landing. Exportar PNG nativo para `evidence/` e registrar os node-ids em
      `verification.md`. **Aceite: aprovação do responsável registrada.** Sem D1 não começam
      F8–F10, e o AC13 fica pendente.

## Backend — pode rodar em paralelo com F1–F7

- [x] B0 — Confirmar na documentação da Cloudflare (Context7 ou docs oficiais) que a Pages
      Function recebe `CF-Connecting-IP` com o IP do visitante, não forjável pelo cliente.
      Registrar a referência em `backend-evidence.md`. Se não se confirmar, parar e reabrir a
      decisão 3 do plano.
- [x] B1 — Red/Green `test_account_rules.py`: `normalize_email`, as violações por campo e a
      ordem (`email_too_long` antes do strip com 321 caracteres contando espaços,
      `email_required`, `email_invalid` para `a@b`, `a@b.`, `a b@c.com`, `a@@b.com` e espaço
      Unicode, aceito `ana@exemplo.com.br`; `password_too_short` 11/12,
      `password_too_long` 1024/1025, code points). Red esperado: `ModuleNotFoundError
      app.auth.accounts`.
- [x] B2 — Red/Green `add_account`: cria com e-mail normalizado e hash `scrypt$`. Duplicado
      em outra caixa → `EmailAlreadyRegistered`, sem alterar o hash existente. Regra violada
      → `AccountRuleError` com as violações. Sem commit interno.
- [x] B3 — Red/Green CLI (`test_user_provision.py`): e-mail com 321 caracteres
      só por espaços → recusa; `a@b` → recusa; senha de 1025 → recusa; e-mail do cadastro →
      recusa. O fluxo válido continua funcionando (AC12). O login passa a usar as constantes e
      o `normalize_email` compartilhados sem aplicar o formato; um teste prova que uma conta
      `a@b` gravada direto no banco ainda entra. `test_auth_http.py` continua verde.
- [x] B4 — Red/Green configuração (`settings.py`): padrões `false`/5/60, valores inválidos →
      `RuntimeError`, ligado em `stage` sem `TRUSTED_PROXY_SECRET` → falha no `lifespan`,
      ligado sem `SIGNUP_SOURCE_HASH_SECRET` (qualquer ambiente) → falha, segredo curto →
      falha, desligado sem segredos → inicia.
- [x] B5 — Red/Green `test_signup_source.py`: segredo correto + IP válido → chave do
      cabeçalho; segredo ausente, errado ou IP inválido → `request.client.host`; IPv6 →
      `/64`; IPv4 mapeado → IPv4. A chave final é o HMAC-SHA256 hexadecimal (64 caracteres)
      com `SIGNUP_SOURCE_HASH_SECRET`: determinística, muda com o segredo e não contém o IP.
- [x] B6 — Migração `20261106_signup_attempts.py` (timestamptz, índices, RLS) + modelo +
      `alembic/env.py`. Adicionar `signup_attempts` em `PUBLIC_TABLES` do teste RLS. Conferir
      upgrade e downgrade em PostgreSQL de teste.
- [x] B7 — Red/Green `test_signup_limit_integration.py` (PostgreSQL, relógio fixo): 5 envios
      passam; o 6º → 429 com `retry_after_seconds` = tempo até o mais antigo sair da janela;
      o 429 não insere; depois de `now + retry` volta a passar (AC09). A configuração 2/10 min
      é respeitada. O purge apaga só as linhas vencidas. Dois envios simultâneos com limite 1
      → um passa e o outro recebe 429.
- [x] B8 — Red/Green `test_signup_http.py` (SQLite + dublê de limitador + relógio fixo):
      - desligado: GET `{"enabled": false}`; POST → 404 `signup_unavailable`, sem usuário e sem
        tentativa registrada (AC14);
      - ligado: GET `{"enabled": true}` com `Cache-Control: no-store`;
      - 201 + cookie igual ao do login (`HttpOnly`, `SameSite=Lax`, `Path=/api`, `Secure` em
        stage). `GET /me` com o cookie retorna a conta; logout e novo login funcionam
        (AC02/AC03/AC04);
      - 422 por campo com códigos estáveis, os dois campos de uma vez, e
        `text/plain`/JSON malformado → `json_required` (AC05/AC06);
      - 409 `email_already_registered` com `fields[email]`, sem `Set-Cookie`, com o hash
        antigo intacto (AC07);
      - 429 com o cabeçalho `Retry-After`; todo envio que passou do interruptor conta,
        inclusive 422 e 409 (AC09).
- [x] B9 — Red/Green `test_signup_concurrency_integration.py`: dois cadastros simultâneos do
      mesmo e-mail (barreira, sessões independentes) → 1 usuário, um 201 e um 409, nenhum 500
      (AC08).
- [x] B10 — Red/Green sigilo (AC10): os cenários 201/422/409/429 com `caplog` em DEBUG.
      A senha não aparece em logs, respostas, `users` ou `signup_attempts`. Em PostgreSQL,
      depois de envios com IPv4 e IPv6 conhecidos, nenhuma linha de `signup_attempts` contém o
      IP, o prefixo `/64` ou o SHA-256 sem segredo deles, e `source_hash` é igual ao HMAC
      esperado. O IP também não aparece nos logs.
- [x] B11 — Red/Green isolamento (AC11): a conta nova vê painel, monitoramentos,
      notificações e conversas vazios enquanto outra conta tem dados.
- [x] B12 — Purge no `cleanup.purge_database`. `.env.example`, `docker-compose.yml` (backend)
      e `render.yaml` (`SIGNUP_ENABLED: "false"`; `TRUSTED_PROXY_SECRET` e
      `SIGNUP_SOURCE_HASH_SECRET` com `sync: false`).
- [x] B13 — `ruff check` + `pytest` completo com `TEST_DATABASE_URL`, com contagem e sem
      pular as integrações novas; radon nas funções novas (`complexity.md`).

## Frontend — comportamento (paralelo ao backend, depois do contrato)

- [x] F1 — Red/Green `api.test.ts`: `ApiFailure.fields` (válido, ausente, malformado →
      `[]`); `signupStatus` aceita só `{enabled: boolean}`; `signup` aceita só 201 +
      `UserResponse`, e 200 ou corpo inválido → `invalid_response`; 409/422/429/404/rede.
- [x] F2 — Red/Green `auth/accountRules.test.ts`: as mesmas tabelas de B1 (code points com
      emoji, 320/321 contando espaços, 11/12 e 1024/1025, confirmação diferente, `a@b`
      recusado). `LoginForm` importa `EMAIL_PATTERN` sem mudar de comportamento: o
      `LoginForm.test.tsx` atual continua verde sem editar expectativas.
- [x] F3 — Red/Green `useSignupAvailability`: estados `loading`, `enabled`, `disabled` e
      `error`, com nova tentativa.
- [x] F4 — Red/Green `LoginForm`/`LandingPage`/`App`: com o cadastro ligado, "Criar conta"
      aparece no login e na landing; desligado ou com erro, não aparece (AC14). O link do
      login preserva o `returnTo` válido e descarta o inválido.
- [x] F5 — Red/Green rotas: `/cadastro` com sessão → `/app/dashboard`; desligado →
      `/login` preservando o `returnTo`; ligado → formulário; título "Criar conta ·
      BestPrice".
- [x] F6 — Red/Green `SignupForm` (estrutura provisória com as classes do login):
      - rótulos visíveis, dica de senha e aviso de privacidade antes do botão;
      - erros locais por campo com `aria-invalid`/`aria-describedby` e foco no primeiro
        inválido, sem enviar;
      - sucesso → destino `returnTo` ou `/app/dashboard`, sem novo login (AC02);
      - 422 do servidor no campo certo; 409 no campo e-mail com link "Entrar"; 429 com "N
        minutos"; 404 e falha de rede no alerta;
      - o e-mail é preservado e as senhas são limpas após o erro do servidor; "Criando
        conta…" com `aria-busy`, sem duplo envio;
      - teclado: Tab percorre os campos, alternâncias de senha e botão, e Enter envia.
- [x] F7 — Red/Green proxy (`pagesProxy.test.ts`): remove `x-bestprice-*` vindos do
      cliente; com `API_PROXY_SECRET`, injeta o segredo e o `cf-connecting-ip`; sem ele, não
      injeta; o segredo não volta na resposta.

## Frontend — visual (bloqueado por D1)

- [x] F8 — Implementar o layout aprovado em D1 (CSS e tokens existentes; extensões em
      `designsystem/README.md` antes do uso) no cadastro, login e landing.
- [x] F9 — Playwright `tests/visual/signup.spec.ts`: padrão, erros e limite em 1440 e 390 px,
      comparados com os PNGs de D1. Teclado e leitor de tela (anúncio de erro) conferidos (AC13).
      Anúncio verificado por DOM, ARIA e testes; sem leitor de tela real.
- [x] F10 — `npm run lint`, `npm test -- --run` e `npm run build` verdes, com contagem.

## Integração ponta a ponta

- [x] I1 — Compose local com `SIGNUP_ENABLED=false`: sem links, `/cadastro` → login, POST
      → 404, CLI e login funcionando (AC14).
- [x] I2 — Compose com `SIGNUP_ENABLED=true` e `SIGNUP_RATE_LIMIT_ATTEMPTS=5` (com `SIGNUP_SOURCE_HASH_SECRET` local de teste): cadastro pelo
      navegador → painel vazio; logout/login; `returnTo` a partir de "Começar com IA";
      duplicado; erros; o 6º envio → 429 com espera; consulta `psql` a `users`/`signup_attempts`
      sem senha nem IP em claro (AC02–AC07, AC09–AC11). Pela CLI, criar e recusar o e-mail do cadastro (AC12).
      Capturas e saídas em `verification.md`.
      I1/I2 feitos pelo QA local sem Compose (Docker desligado), com API, SPA e PostgreSQL
      reais; AC09 só com janela de 1 min. Ver [qa/qa-report.md](qa/qa-report.md) e
      [verification.md](verification.md).
- [ ] I3 — Stage: só a promoção com o interruptor desligado (health, links ausentes, POST 404).
      Ligar o interruptor e validar a origem real atrás do Pages fica como **pendência
      explícita**, com o roteiro em `verification.md`: configurar `API_PROXY_SECRET` no Pages
      e `TRUSTED_PROXY_SECRET` + `SIGNUP_SOURCE_HASH_SECRET` no Render, fazer 6 envios de um
      IP e 1 de outro.

## Revisão, QA e entrega

- [x] R1 — Revisão independente (`arch-reviewer`) do diff com `architecture.md`, `security.md`
      e o contrato deste plano; incorporar os achados na mesma branch.
      Três rodadas (`e71cf29`, `e5efe96`, `1a58be9` → aprovar); ajuste final em `c95a5d2`.
- [x] Q1 — QA (`qa`) percorrendo AC01–AC14 com evidência; AC13 só depois de F9.
- [ ] G1 — `quality-gates` completo (backend e frontend) na ponta final; `verification.md` e
      `docs/PROGRESS.md` atualizados com os resultados reais.
- [x] S1 — `doc-sync-onboarding` por último: `docs/apps/backend.md` (rotas e "não há cadastro
      público"), `frontend.md`, `infraestrutura.md` (variáveis, segredo do proxy, não
      ativar `--proxy-headers`), `database.md`, `architecture.md`, `index.md`,
      `product-context.md`, `AGENTS.md`/`CLAUDE.md` conferidos.
- [ ] PR para `develop` com `Closes #252`; CI verde; spec `implementada` só depois da revisão,
      do AC13 e da integração.

## Paralelismo

Os conjuntos de arquivos estão em [plan.md](plan.md#arquivos-e-responsáveis-paralelismo).

- Rodam em paralelo: B0–B13 e F1–F7 (sem arquivo comum; o contrato é este plano).
- D1 roda em paralelo com tudo, mas bloqueia F8–F10 e Q1/AC13.
- I1/I2 dependem de B13 e F7 (I2 visual completo depende de F8).
- R1 → Q1 → G1 → S1 em sequência, ao final.
