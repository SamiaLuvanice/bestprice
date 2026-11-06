# Evidência do frontend — 0048 (F1–F7)

Worktree `.worktrees/feature-0048-issue-252-cadastro-self-service`, branch
`feature/0048-issue-252-cadastro-self-service`, a partir de `d1acd81`. Comandos rodados em
`frontend/` (Windows, Git Bash, Node com `npm ci`). Contagens copiadas da saída do Vitest.

Visual bloqueado por D1: o formulário usa só a estrutura e as classes existentes do login
(`login-shell`, `login-card`, `login-field`…), sem CSS, tokens ou baseline visual novos. Os
textos vêm do plano e do brief `design/figma-brief.md` (provisórios até o Figma aprovado).

## Linha de base

- `npx vitest run` → `Test Files 35 passed (35)`, `Tests 413 passed (413)`.

## F1 — cliente HTTP (`api.ts`)

- Red: `npx vitest run src/api.test.ts` → 17 falhas, todas por `TypeError: api.signup is not a
  function` / `api.signupStatus is not a function` (comportamento inexistente). O dublê
  `fakeApi.apiError` passou a aceitar `fields` antes, para o Red não ser erro de tipo.
- Green: mesmo comando → `Tests 31 passed (31)`.
- Cobertura: `ApiFailure.fields` válido, ausente, fora de lista e com item malformado (→ `[]`);
  `signupStatus` aceita só `{enabled: boolean}`; `signup` aceita só `201` + `UserResponse`
  (200, corpo sem e-mail e corpo nulo → `invalid_response`); 409 com `fields`, 429 com
  `retry_after_seconds`, 404 `signup_unavailable` e falha de rede.

## F2 — regra de conta (`auth/accountRules.ts`)

- Primeira execução: `npx vitest run src/auth/accountRules.test.ts` → `Failed to resolve import
  "./accountRules"` (sem testes). Não conta como Red de comportamento; criei um esqueleto que
  exporta a expressão atual e funções sem regra.
- Red: mesmo comando → `Tests 22 failed | 7 passed (29)`, todas as falhas por asserção
  (`expected undefined to be 'A senha precisa ter pelo menos 12 car…'`, `expected null to be
  'Informe seu e-mail.'`, `expected {} to deeply equal { …(3) }`). Os 7 que passaram são casos
  de aceitação, verdadeiros também sem regra.
- Green: mesmo comando → `Tests 29 passed (29)`.
- Refactor: `LoginForm.tsx` importa `EMAIL_PATTERN` de `accountRules.ts` (constante local
  removida). `npx vitest run src/LoginForm.test.tsx src/auth` → `Test Files 2 passed`, `Tests 55
  passed (55)`; `LoginForm.test.tsx` não foi editado (`git diff` vazio).
- Tabela comum com B1: 320/321 contando espaços das pontas, 321 só de espaços (limite antes de
  vazio), code points com emoji no e-mail e na senha, 11/12 e 1024/1025, `a@b`, `a@b.`,
  `a b@c.com`, `a@@b.com`, espaço Unicode (U+00A0, U+2003), domínio acentuado aceito,
  confirmação diferente e mensagens pelos `code` estáveis do servidor.
- Limite conhecido: `\s` e `trim()` do JavaScript e `\s`/`strip()` do Python divergem em
  caracteres raros (U+001C–U+001F, U+FEFF). Fora da tabela comum; o servidor decide.

## F3 — disponibilidade (`auth/useSignupAvailability.ts`)

- Red (esqueleto que sempre devolve `loading`): `npx vitest run
  src/auth/useSignupAvailability.test.ts` → `Tests 5 failed | 1 passed (6)`, todas por
  `AssertionError: expected 'loading' to be 'enabled' | 'disabled' | 'error'`. O que passou é o
  de desmontagem (continua `loading`, verdadeiro também sem implementação).
- Green: mesmo comando → `Tests 6 passed (6)`.
- Cobertura: `loading` → `enabled`; `disabled`; `error` com HTTP 503, falha de rede e corpo
  inválido, e `retry` volta a `loading` e consulta de novo; resposta após desmontar ignorada.
