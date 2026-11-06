# Sincronização da documentação — 0048

Agente `doc-sync-onboarding`, executado em 06/11/2026 sobre `06c3363` (última alteração de
código: `c95a5d2`). Referência: `git diff origin/develop...HEAD -- backend frontend .env.example
docker-compose.yml render.yaml designsystem`, `plan.md`, `verification.md` e
`design/figma-frames.md`. Os fatos foram conferidos no código (`app/auth/accounts.py`,
`limiter.py`, `settings.py`, `routes.py`, `provision.py`, `app/db.py`, `app/research/cleanup.py`,
a migration `20261106_signup_attempts.py`, `App.tsx`, `SignupForm.tsx`, `accountRules.ts`,
`useSignupAvailability.ts`, `LoginForm.tsx`, `LandingPage.tsx` e `functions/api/[[path]].ts`).
Nenhum comando de verificação foi executado nesta etapa; os números citados vêm de
`verification.md`.

## Alterados

| Documento | Motivo |
|---|---|
| `docs/apps/backend.md` | Removido "Não há cadastro público". Rotas `GET/POST /api/auth/signup` na tabela; seção nova com regra única de conta, CLI alinhada, ordem de avaliação e códigos, limitador PostgreSQL com origem assinada e HMAC, purge, variáveis e falha rápida no `lifespan`; `hide_parameters` no engine e o limite O2 |
| `docs/apps/frontend.md` | Landing e lista de rotas sem "não há cadastro"/"conta provisionada"; rota `/cadastro`; seção nova com disponibilidade, links condicionados, `accountRules.ts`, `SignupForm`, node-ids do Figma e verificação; rodapé omitido em `/cadastro`; rotas consumidas e proxy Pages assinando a origem |
| `docs/apps/infraestrutura.md` | Seção nova: variáveis no Compose e Blueprint, `API_PROXY_SECRET`/`TRUSTED_PROXY_SECRET`/`SIGNUP_SOURCE_HASH_SECRET`, segredos distintos, não ativar `--proxy-headers`, roteiro I3 para ligar em Stage, migration ainda não aplicada em Stage |
| `docs/database.md` | Tabela `signup_attempts` (`CHAR(64)`, `timestamptz`, índices, RLS, retenção curta), migration `20261106signup` e origem das contas |
| `docs/architecture.md` | Variáveis do cadastro e dos segredos na tabela de configuração; parágrafo do fluxo SPA → API → `signup_attempts` e da origem pela Pages Function |
| `docs/product-context.md` | "contas já provisionadas" passa a citar o cadastro self-service, desligado por padrão até a integração do Mercado Livre funcionar |
| `docs/index.md` | Frase sobre criação de contas reflete o cadastro self-service |

## Conferidos sem mudança

| Documento | Por quê |
|---|---|
| `AGENTS.md`, `CLAUDE.md` | A spec não muda instruções, regras, fluxo do harness nem referências de onboarding |
| `README.md` | O setup local continua criando a conta pela CLI; com o cadastro desligado por padrão, "entrar com conta provisionada" segue correto |
| `docs/github-workflow.md`, `docs/harness-setup.md` | Sem mudança de CI, workflows, proteção de branches ou configuração de ferramentas |
| `docs/PROGRESS.md` | Já atualizado na verificação da 0048 |
| `designsystem/README.md` | Já atualizado pelo frontend na mesma branch (extensões da 0048) |

## Não verificado

Links e âncoras locais foram conferidos por busca nos títulos; os documentos não foram
renderizados. Nenhum comportamento em Stage foi observado.
