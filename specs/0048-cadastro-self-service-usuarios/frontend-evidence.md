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
