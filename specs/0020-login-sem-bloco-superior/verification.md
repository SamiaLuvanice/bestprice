# Verificação — Spec 0020

Base: `b431134` de `origin/develop` (worktree
`.worktrees/feature-0020-issue-75-login-sem-bloco-superior`, branch
`feature/0020-issue-75-login-sem-bloco-superior`).
Issue [#75](https://github.com/SamiaLuvanice/bestprice/issues/75).

## Mudança

- `frontend/src/App.tsx`: novo ramo para o estado `guest` que renderiza apenas
  `LoginForm` (sem o `header.masthead` e sem `HeroTrackForm`). Os estados `loading` e
  `unavailable` continuam com o cabeçalho de marca e o hero, como antes. Backend, `api.ts`
  e contratos REST sem alteração.
- `frontend/src/App.test.tsx`: dois testes novos para o AC01 (ausência do cabeçalho e do
  formulário de link no estado de visitante), um teste para o AC03 (cabeçalho e hero
  preservados em `loading`/`unavailable`) e realocação do teste da logo para o estado de
  carregamento; o teste de login com falha deixou de exigir o campo de link.

## TDD

Comandos executados em `frontend/`. Para o Red, apenas `frontend/src/App.tsx` foi revertido
ao estado anterior (`git stash push -- frontend/src/App.tsx`); os testes novos
permaneceram na árvore, de modo que a falha corresponde à ausência do comportamento.

- **Red** (`npx vitest run src/App.test.tsx`): **2 testes falharam**, 32 passaram
  (34 no arquivo). Falharam pelo motivo esperado:
  - `não mostra o cabeçalho de marca ao visitante` — `expected document not to contain
    element, found <header class="masthead">…`; o visitante ainda via o cabeçalho.
  - `não mostra o formulário de monitoramento por link ao visitante` — `expected document
    not to contain element, found <h1 id="page-title">… Acompanhe o preço. Compre na hora
    certa.`; o hero ainda precedia o login.
- **Green** (`npx vitest run src/App.test.tsx`, com a implementação restaurada): **34
  testes passaram**.
- **Green (suíte completa)** (`npm test -- --run`): **257 passed** em 24 arquivos (eram
  256; +1 pela divisão do AC01 em dois testes).

## Portões (executados em `frontend/`)

| Comando | Resultado |
|---|---|
| `npm run lint` | verde, sem avisos |
| `npm test -- --run` | **257 passed** em 24 arquivos |
| `npm run build` | `tsc -b && vite build` verde |

## Limites e pendências

- **AC02** (sem rolagem vertical em 320/768/1280 px a 640 px de altura e sem rolagem
  horizontal) e **AC05** (contraste, área de toque ≥ 44 × 44 px e `prefers-reduced-motion`)
  não são exercidos pelo jsdom; dependem de QA no navegador, ainda não executado.
- **AC03** está comprovado por teste (cabeçalho e hero presentes em `loading`/`unavailable`);
  a ausência de regressão de layout nos dois estados ainda depende de QA no navegador.
- Nenhuma revisão independente (`arch-reviewer`) registrada até aqui.
- Sem commits ou PR; trabalho apenas na worktree.
