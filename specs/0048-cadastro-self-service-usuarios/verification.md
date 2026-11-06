# Verificação da spec 0048

Registro da coordenação em 06/11/2026. Worktree
`.worktrees/feature-0048-issue-252-cadastro-self-service`, branch
`feature/0048-issue-252-cadastro-self-service`, base `origin/develop` `66fb0c5`, ponta de código
avaliada **`c95a5d2`** (com push). [Issue #252](https://github.com/SamiaLuvanice/bestprice/issues/252).

Fontes: [backend-evidence.md](backend-evidence.md) (B0–B13, R1, R2, R3),
[frontend-evidence.md](frontend-evidence.md) (F1–F7, correções R-1 a R-3, F8–F10, R2),
[qa/qa-report.md](qa/qa-report.md) (rodadas 1 e 2) e
[design/figma-frames.md](design/figma-frames.md). Este registro não afirma resultado de CI, PR,
Project, release nem Stage, porque nenhum deles foi observado.

## Fronteiras da evidência

| Camada | Real | Simulado | Limite |
|---|---|---|---|
| pytest | Código, PostgreSQL 18 descartável (127.0.0.1:55448), migrações, relógio injetado | Dublê do limitador e SQLite em `test_signup_http.py` | Integrações PostgreSQL do limitador, concorrência e sigilo rodaram (sem skip) |
| QA ponta a ponta | API uvicorn (8048), SPA Vite (5148), PostgreSQL 18 descartável (55449), Chromium headless, CLI `app.auth.provision.main()` | Falha de rede e atraso de 2,5 s via `page.route`; na CLI só `getpass` lê do stdin | **Compose não rodou** (Docker desligado); usados os três serviços reais locais. AC09 só com janela de 1 min |
| Vitest/Playwright | Render, jsdom, Chromium, axe | Respostas HTTP por `fakeApi`/`page.route` | Comparação com os PNGs do Figma a olho, sem diff de pixels (fontes diferentes) |

## Matriz de aceite

| AC | Situação | Evidência | Onde |
|---|---|---|---|
| AC01 — Acesso ao cadastro | aprovado | "Criar conta" na landing e no login; clique → `/cadastro` ("Criar conta · BestPrice"); com sessão → `/app/dashboard`. Testes F4/F5 | QA r1 (`saidas/ui_on.txt`, `capturas/ac01-*`); frontend-evidence F4, F5 |
| AC02 — Cadastro bem-sucedido | aprovado | `201` + `Set-Cookie` igual ao do login, `/me` 200 sem login, painel vazio; `returnTo` de "Começar com IA" → `/app/assistant`. Regressão r2 em `e5efe96` | QA r1 (`saidas/ac02-ac03-ac07.txt`, `capturas/ac02-*`), QA r2 (b); B8 |
| AC03 — Login posterior | aprovado | logout 204, `/me` 401, login 200; login pela UI da conta criada no cadastro | QA r1 (`saidas/ui_dash.txt`); B8 |
| AC04 — E-mail normalizado | aprovado | `" Ana@Exemplo.com "` gravado `ana@exemplo.com`; login com minúsculas 200; `ANA@exemplo.com` → 409 | QA r1 (`saidas/loteA.txt`); B1, B2 |
| AC05 — E-mail inválido | aprovado | `a@b`, vazio, 321 caracteres → 422 por campo, sem conta; UI com `aria-invalid`/`aria-describedby`. R2: NUL, U+001C, BOM, NBSP, `a@b..com` → 422, sem 500 | QA r1, QA r2 (a) (`saidas-r2/r2-emails-invalidos.txt`); B1, R1 1a/1c, R2 1 |
| AC06 — Senha inválida | aprovado | 422 `password_too_short`/`password_too_long`, dois campos de uma vez; UI por campo; recusa do servidor em campo nos testes de F6 | QA r1; B8; frontend-evidence F6 |
| AC07 — E-mail já cadastrado | aprovado | 409 com `fields[email]`, sem `Set-Cookie`, `password_hash` inalterado, link "Entrar" | QA r1 (`capturas/ac07-duplicado-1440.png`), QA r2 (b); B8 |
| AC08 — Envios simultâneos | aprovado | Corrida determinística com barreira: 1 usuário, um 201 e um 409, nenhum 500 (`test_signup_concurrency_integration.py`, 2 passed em PostgreSQL). Três rodadas com `curl` paralelo: sempre 201 + 409 | B9; QA r1 (`saidas/ac08-concorrencia.txt`) |
| AC09 — Limite de tentativas | aprovado | 5 envios (qualquer resultado) e o 6º → `429`, `Retry-After`; 429 não conta; após o prazo → 201. Padrão 5/60 min e 2/10 min com relógio fixo em PostgreSQL | B7, B8; QA r1 (`saidas/ac09-recuperacao.txt`), QA r2 (b) |
| AC10 — Sigilo | aprovado (com limite O2) | `source_hash` = HMAC-SHA256 com segredo, sem IP, prefixo `/64` nem SHA-256 sem segredo; senhas `scrypt$`; 0 ocorrências de senhas, segredo e hash nos logs do uvicorn e do PostgreSQL; `hide_parameters`; erro inesperado do banco sem e-mail/senha no traceback | B10, R1 1b/7; QA r1 (`saidas/ac10-*`), QA r2 (`saidas-r2/r2-logs.txt`) |
| AC11 — Isolamento | aprovado | Conta nova vê painel, monitoramentos, notificações e conversas vazios; recursos de outra conta → 404 | B11; QA r1 (`saidas/ac11-isolamento.txt`) |
| AC12 — Operação preservada | aprovado | CLI cria conta; recusa `a@b`, 331 caracteres com espaços, senha 1025/11, confirmação diferente, surrogate e e-mail do cadastro; login de conta `a@b` gravada direto no banco continua funcionando | B3, R2 1; QA r1 (`saidas/ac12-cli.txt`) |
| AC13 — Interface acessível e fiel ao Figma | aprovado (diferenças aceitas) | Quadros aprovados (ver Design); F8 + `signup.spec.ts` 24 passed; teclado, foco ≥ 2 px, alvos ≥ 44 px, sem rolagem horizontal em 320/390/768/1280, axe WCAG 2.2 AA sem violações nos temas claro e escuro; região `role="status"` com resumo e reanúncio; aviso de privacidade antes do envio. Diferenças visuais aceitas pela responsável em 06/11/2026 | frontend-evidence F8–F10, R-2, R2; QA r2 (c) (`capturas-r2/`) |
| AC14 — Cadastro desligado | aprovado | GET `{"enabled":false}` + `no-store`; POST → 404 `signup_unavailable`, 0 usuários e 0 tentativas; sem links; `/cadastro` → `/login` preservando `returnTo`; CLI e login funcionam. Falha rápida sem `SIGNUP_SOURCE_HASH_SECRET` e com segredos iguais | B4, B8, R1 6; F4, F5; QA r1 (`saidas/ui_off.txt`), QA r2 (`saidas-r2/r2-ac14.txt`, `r2-segredos-iguais.txt`) |

Itens que dependem de Stage (origem real atrás do Pages) estão em Pendências; nenhum AC foi
marcado com base nessa validação.

## Gates finais

Backend, em `backend/`, na ponta `c95a5d2` (backend-evidence, R3):

| Comando | Resultado |
|---|---|
| `uv run ruff check .` | All checks passed! |
| `TEST_DATABASE_URL=postgresql://bestprice:***@127.0.0.1:55448/bestprice_test uv run pytest -q -p no:cacheprovider -rs` | **456 passed, 2 skipped** em 51,97 s (baseline 302 passed). Skips: `test_stage_start.py` (script POSIX) |
| `uv run pytest -q -p no:cacheprovider tests/test_signup_settings.py` | 23 passed |
| `DATABASE_URL=… uv run alembic check` (ponta `a88db49`) | No new upgrade operations detected |
| `complexity_report.py backend/app --changed origin/develop` (ponta `a88db49`) | 191 blocos, média 2,79 (A); nenhum bloco ≥ D; os 3 blocos C são testes |

Frontend, em `frontend/`, após a rodada 2 da revisão (`4babb6c`–`96b05ca`); nenhum arquivo do
frontend mudou depois disso (`git diff --stat 96b05ca c95a5d2` só mostra o teste do backend e
`specs/`):

| Comando | Resultado |
|---|---|
| `npm run lint` | saída 0 |
| `npm test -- --run` | **Test Files 38 passed (38), Tests 531 passed (531)** (baseline 413) |
| `npm run build` | `✓ built in 1.29s`, saída 0 |
| `npx playwright test tests/visual/signup.spec.ts` | **24 passed**, 48 skipped (os quadros rodam só em `viewport-1280`) |
| `npx playwright test` (suíte visual inteira, F10) | 203 passed, **19 failed**, 54 skipped. As 19 falhas são pré-existentes (ver Revisão) |

QA r2 em `e5efe96` repetiu os gates: ruff ok, pytest 446 passed / 2 skipped com PostgreSQL real,
lint ok, Vitest 530, build ok, `signup.spec.ts` 24 passed (`qa/saidas-r2/r2-gates.txt`).

Instabilidade conhecida: em uma execução do Vitest durante R-3, `App.test.tsx` "preserva preço
desconhecido…" falhou por tempo (Issue #247, fora do diff); a execução seguinte passou 529/529.

## Revisão independente

`arch-reviewer`, em três rodadas:

| Rodada | SHA | Veredito | Achados → correção |
|---|---|---|---|
| R1 | `e71cf29` | aprovar com ajustes | NUL no e-mail → 500 e log com hash; JSON profundo → 500; equivalência das regras Python×TS; DELETE global no caminho da requisição; segredos iguais; teste de sigilo. Corrigidos em `b228cdf`, `b86fc2d`, `e85d66e`, `a269dfb`, `f1a0b23`, `52319ac` (backend) e `cb1ca7d` (R-1), `f50aa44` (R-2) e `e7dc0e2` (R-3) (frontend) |
| R2 | `e5efe96` | aprovar com ajustes | Surrogate → 500; retenção do HMAC sem prazo com o Render hibernando; ordem de Tab da landing; reanúncio da região `status`; topo do cadastro no mobile; teste visual instável. Corrigidos em `e9a7dfd`, `a88db49`, `4babb6c`, `cd07d4b`, `96b05ca` |
| R3 | `1a58be9` | **aprovar** | Sugestão: isolar a limpeza da partida nos testes de `lifespan`. Aplicada em `c95a5d2` (456 passed, 2 skipped com PostgreSQL real, 51,97 s) |

- Equivalência das regras de e-mail Python × TypeScript verificada pelo revisor em todos os
  1.112.063 code points não-surrogate, em três posições: diff vazio.
- O revisor confirmou por `git archive` de `origin/develop` que as 19 falhas Playwright
  (`brand.spec.ts` 8, `public-pages.spec.ts` 8, `redesign.spec.ts` 3) já existem em develop.

## Design (Figma)

Arquivo [BestPrice IA](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA); quadros
aprovados pela responsável em 06/11/2026; PNGs em [evidence/](evidence/).

| Tela | node-ids |
|---|---|
| 02 · Entrar (ajustado) | `59:44` desktop, `59:602` mobile |
| 01 · Landing desktop (ajustado) | `16:2` (cabeçalho `160:1868`, "Criar conta" `222:2`/`222:3`) |
| 01 · Landing · Menu aberto · Mobile | `224:2` |
| 02b · Criar conta · Desktop | padrão `220:347`, foco `220:382`, enviando `220:421`, erros de campo `220:459`, e-mail já cadastrado `220:505`, limite `220:546`, falha de rede `220:588` |
| 02b · Criar conta · Mobile | padrão `220:871`, foco `220:900`, enviando `220:933`, erros de campo `220:965`, e-mail já cadastrado `220:1005`, limite `220:1040`, falha de rede `220:1076` |

Diferenças aceitas pela responsável em 06/11/2026 (AC13): fonte do sistema; texto completo do erro
de e-mail ("…, como nome@exemplo.com."); estado "enviando" sem 45% de opacidade (contraste); senhas
limpas após recusa do servidor; links no texto sublinhados (axe `link-in-text-block`); ordem
"Criar conta, Entrar" também no menu móvel (desvio do quadro `224:2`); anel de foco substituindo a
borda vermelha após 409/429/rede (V1). V2 ("AI" × "IA" na marca) é pré-existente, fora da 0048.

## Decisões do responsável

- Não liberar em Stage até a leitura do Mercado Livre funcionar: interruptor `SIGNUP_ENABLED`
  desligado por padrão (`render.yaml` `"false"`).
- Segredo do proxy aceito (`API_PROXY_SECRET` no Pages, `TRUSTED_PROXY_SECRET` no Render).
- Origem guardada só como HMAC (`SIGNUP_SOURCE_HASH_SECRET`), apagada após a janela.
- E-mail `nome@domínio.tld` em toda criação de conta (cadastro e CLI), sem mudar o login.
- Recusa pelo limite (429) não conta como tentativa.
- `/cadastro` com o interruptor desligado → `/login`.

## Limites conhecidos

- **O2:** o PostgreSQL registra o e-mail em `DETAIL: Key (email)=(…) already exists.` a cada 409
  (mensagem do servidor; `hide_parameters` não cobre).
- **O5:** com o banco fora do ar, `POST /api/auth/signup` responde `500 text/plain`, igual ao
  login (pré-existente).
- NBSP no fim do e-mail: o cadastro recusa, o login aceita (`trim()`), para manter a regra
  idêntica ao backend.
- Sem teste com leitor de tela real; anúncio verificado pelo DOM, papéis ARIA e testes.
- AC09 exercitado em tempo real só com janela de 1 min; o padrão de 60 min está coberto com relógio
  fixo.
- Compose não rodou (Docker desligado); usados os serviços reais locais.
- B0 baseado na documentação oficial da Cloudflare mais uma declaração não oficial da equipe sobre a
  imutabilidade do `cf-connecting-ip`; a prova real fica para I3.
- O1: o access log do uvicorn registra o peer; em Stage o peer é o salto do Render (inferência,
  não verificado em Stage).

## Pendências explícitas

- **I3 — Stage:** exige criar `API_PROXY_SECRET` no Pages, `TRUSTED_PROXY_SECRET` e
  `SIGNUP_SOURCE_HASH_SECRET` no Render e ligar `SIGNUP_ENABLED`, só depois de a leitura do Mercado
  Livre funcionar. Roteiro: health, 6 envios de um IP (6º → 429) e 1 de outro IP (aceito).
- CI e merge do PR para `develop` (`Closes #252`). Spec segue `pronta` até o merge.
- `doc-sync-onboarding` final (S1).
- Issue nova sugerida para as 19 falhas visuais pré-existentes (`brand.spec.ts`,
  `public-pages.spec.ts`, `redesign.spec.ts`).
- Instabilidade da Issue #247 (`App.test.tsx`) apareceu em uma rodada do frontend.
