# Verificação — 0062

Worktree `.worktrees/feature-0062-issue-344-api-acordada-pelo-navegador`, branch
`feature/0062-issue-344-api-acordada-pelo-navegador`, 26/11/2026.

## TDD

- Red: `npx vitest run src/auth/apiWaker.test.ts src/auth/wakeRetry.test.ts src/App.apiWaker.test.tsx`
  → `apiWaker.test.ts` e `App.apiWaker.test.tsx` falharam por `Failed to resolve import "./apiWaker"`
  (módulo inexistente); em `wakeRetry.test.ts`, os 2 testes de abertura de janela falharam com
  `expected "vi.fn()" to be called once, but got 0 times` (opção `onWindowOpen` ainda ignorada).
  `Tests 2 failed | 24 passed (26)`.
- Green: o mesmo comando → `Test Files 3 passed (3)`, `Tests 40 passed (40)`.

## Portões

`node .agents/scripts/gates.mjs --scope frontend`:

```
✔ frontend:install
✔ frontend:lint
✔ frontend:test
✔ frontend:build
```

`npx vitest run` (frontend): `Test Files 65 passed (65)`, `Tests 910 passed (910)`.

Depois da revisão (3 testes novos): `gates.mjs --scope frontend` verde de novo e
`npx vitest run` → `Test Files 65 passed (65)`, `Tests 913 passed (913)`.

## Bundle

- `VITE_API_ORIGIN=https://bestprice-stage-api.onrender.com npx vite build` → a origem aparece
  em `dist/assets/index-*.js`.
- `npx vite build` sem a variável → nenhum `onrender.com` em `dist/assets/*.js` (AC05).

## Critérios de aceite

| AC | Evidência |
|---|---|
| AC01 | `apiWaker.test.ts` (URL e opções do GET); `wakeRetry.test.ts` (abertura por falha e por demora de 5 s); `App.apiWaker.test.tsx` (`/login` com `429` do Render aciona o despertador) |
| AC02 | `wakeRetry.test.ts` (uma chamada por janela, nova após `retry()`, inclusive com requisição em voo, e ao voltar a uma tela do escopo); `apiWaker.test.ts` (pedido em voo não duplica); `App.apiWaker.test.tsx` (30 s de novas tentativas sem nova chamada) |
| AC03 | `apiWaker.test.ts`: `credentials: 'omit'`, `mode: 'no-cors'` (resposta opaca, não lida), sem corpo nem cabeçalhos, URL fixa `/api/health` |
| AC04 | `apiWaker.test.ts`: rejeição e exceção síncrona não vazam; a suíte completa roda sem erro não tratado |
| AC05 | `apiWaker.test.ts` (origem ausente, vazia, http, com caminho, usuário, query ou fragmento, inválida → sem `fetch`); bundle sem a variável |
| AC06 | `wakeRetry.test.ts` e `App.apiWaker.test.tsx`: API respondendo não aciona |
| AC07 | **Pendente:** só verificável em Stage após criar `VITE_API_ORIGIN` no Pages, promover e esperar a API hibernar |

## Revisão independente

Agente `arch-reviewer` sobre o diff staged: **sem bloqueantes**. Tratados:

- documentação ausente e `verification.md` fora do índice → corrigidos (seção abaixo);
- testes de `onWindowOpen` na reativação por `active` e em `retry()` com requisição em voo,
  e origem com fragmento → acrescentados;
- exposição de IP/User-Agent à origem `*.onrender.com` e aborto aos 60 s → registrados como
  riscos em `docs/apps/infraestrutura.md`.

Não tratado (sugestão): teste da `App` com o despertador real provando um único `fetch` para
as janelas quase simultâneas de sessão e cadastro; o dedupe tem cobertura unitária.

## Documentação

`node .agents/scripts/docs-impact.mjs` apontou `docs/apps/frontend.md`; o agente
`doc-sync-onboarding` atualizou `docs/apps/frontend.md`, `docs/apps/infraestrutura.md` e
`docs/architecture.md` (variável `VITE_API_ORIGIN`). `AGENTS.md`/`CLAUDE.md` sem impacto.

## Limites

- O pedido real do navegador (no-cors contra o Render) não foi conferido num navegador local;
  a forma do pedido é coberta por testes unitários e o efeito, por AC07 em Stage.
- Passo operacional pendente: criar `VITE_API_ORIGIN` no Cloudflare Pages com o valor de
  `API_ORIGIN` antes da promoção.
