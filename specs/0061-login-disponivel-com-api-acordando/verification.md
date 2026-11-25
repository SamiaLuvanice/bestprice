# Verificação — 0061

Branch `feature/0061-issue-336-login-disponivel-com-api-acordando`, worktree
`.worktrees/feature-0061-issue-336-login-disponivel-com-api-acordando`. Ambiente: Windows 11,
Node com `npm ci` na worktree (403 pacotes), Vitest 5, timers falsos
(`vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })`) para 5 s, atrasos e
janela (AC15). Comandos executados em `frontend/`.

## F1 — `wakeRetry.ts` (AC12, AC15)

- **Red** (`npx vitest run src/auth/wakeRetry.test.ts`, com esqueleto que só exporta as
  assinaturas): `Tests 15 failed | 3 passed (18)`. Motivos: `isUnavailable` devolvia sempre
  `false` (`expected false to be true` nos 6 casos de indisponibilidade) e o hook ficava em
  `loading` sem chamar o `fetcher` (`expected 'loading' to be 'settled'/'waking'`,
  `expected "vi.fn()" to be called … but got 0 times`). Os 3 que passaram são os casos
  `false` da tabela (401, 403 e 429 com envelope), triviais com o esqueleto.
- **Green:** `Tests 18 passed (18)`; `npx eslint` sem avisos. Commit `d466071`.
- **Ajuste posterior (Red → Green):** o teste de interface AC09/AC11 mostrou o erro aos 56 s
  (depois da 6ª tentativa), antes do fim da janela. O teste unitário passou a exigir `waking`
  até 60 s e `exhausted` só então; implementação ajustada, `Tests 18 passed (18)`.
  Commit `e91f11f`.

## F2 — Login (AC01–AC07, AC14) e `LoginForm` com `notice`

- **Red** (`npx vitest run src/App.wake.test.tsx src/LoginForm.test.tsx`, código anterior):
  `Tests 10 failed | 31 passed (41)`. Motivos: `Unable to find a label with the text of:
  E-mail` (formulário não aparece com a sessão indisponível: AC01, AC03–AC06), link "Criar
  conta" ausente após a nova tentativa do cadastro (AC07) e `Unable to find … role "status"`
  (prop `notice` ignorada). Passaram já no código anterior, como guarda de regressão: erro
  definitivo 4xx mantém o erro atual e AC14 (401 rápido sem aviso, sessão válida segue).
- **Green:** `Tests 41 passed (41)` nos dois arquivos.
- **Mudanças intencionais em testes existentes:** `App.test.tsx` "mantém o login sem rodapé
  durante a sessão pendente, HTTP 503/falha de rede e recuperação" (agora formulário + aviso e
  nova tentativa automática em vez de "Tentar novamente") e `seo/pageMeta.test.tsx` "o App em
  /login declara canonical e descrição com a sessão HTTP 503/falha de rede" (espera o título
  do login em vez do botão). Comentários nos testes citam a 0061.

## F3 — Cadastro (AC08, AC09)

- **Red** (testes de `App.wake.test.tsx` rodados com `App.tsx` e `useSignupAvailability.ts`
  do commit `d466071`, restaurados em seguida): os 4 casos de cadastro falharam
  (`Unable to find … /^Carregando…$/` com aviso, destino não alcançado, `expected '/cadastro'
  to be '/login'`, erro mostrado antes do fim da janela).
- **Green:** `Tests 22 passed (22)` em `App.wake.test.tsx`.
- **Mudanças intencionais:** `App.test.tsx` "mostra carregando enquanto consulta o cadastro e
  espera a API sem clique quando falha" (antes: alerta imediato com "Tentar novamente", 0048/
  AC14) e `auth/useSignupAvailability.test.ts` (503, rede e corpo inválido agora ficam em
  `loading` com `waking` e repetem sozinhos; novo caso de erro definitivo 404 com envelope
  mantém `error` e `retry()`).

## F4 — Áreas logadas e navegação (AC10, AC11, AC13)

- **Red** (mesma execução contra o código de `d466071`): `Tests 10 failed | 2 passed | 10
  skipped (22)` no filtro `-t "Áreas logadas|Navegação|Criar conta"`. Falharam AC07–AC11 e a
  continuidade da janela login → cadastro e landing → login. Passaram (guarda de regressão,
  comportamento que já existia): rota inexistente sem novas tentativas e revalidação por
  `pageshow` persistido.
- **Green:** `Tests 22 passed (22)` em `App.wake.test.tsx`.
- **Mudanças intencionais:** `App.test.tsx` "mantém a marca sem formulário de link…" (503 →
  espera com aviso; erro e "Tentar novamente" aos 60 s), "recupera falha de rede na verificação
  sem concluir logout" (nova tentativa automática) e `navigation/routes.test.tsx` "erro
  temporário da sessão mantém a URL e tenta novamente sozinho".

## Suíte completa

`npx vitest run`: `Test Files 63 passed (63)`, `Tests 880 passed (880)`.

## F5 — Portões do frontend

`node .agents/scripts/gates.mjs --scope frontend` (código do commit `df637c1`, exit 0):

```
Resumo dos portões:
  ✔ frontend:install       102.7s
  ✔ frontend:lint          6.8s
  ✔ frontend:test          92.1s
  ✔ frontend:build         15.0s
```

O `build:check` também conferiu "Sem vestígios do catálogo em dist (5 marcadores conferidos)" e
"Fontes conforme em dist". O resumo do `gates.mjs` não imprime a contagem de testes; a
contagem positiva vem da execução direta da suíte sobre o mesmo código (880 testes, acima).
O aviso de chunk acima de 500 kB do Vite já existia e não muda nesta spec.

## Limites e pendências

- Sem execução em navegador real nem contra a API hibernada de Stage; o fluxo local com API
  indisponível/lenta fica para a QA (R2).
- O aviso não tem quadro Figma (decisão da spec); validação visual posterior, se desejada.
- Revisão independente (R1), `docs-impact`/`doc-sync-onboarding` (R3, inclui
  `docs/apps/frontend.md`) e PR (R4) não executados por este agente.
