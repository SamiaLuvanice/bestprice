# Verificação — Spec 0020

Branch `feature/0020-issue-75-login-sem-bloco-superior`, sobre `origin/develop` (`457daf9`).
Issue [#75](https://github.com/SamiaLuvanice/bestprice/issues/75). Spec renumerada de 0019
para 0020 (o número 0019 pertence a releases por tag). Sem alteração em `backend/` nem em
`frontend/src/api.ts` (`git diff origin/develop --stat -- backend frontend/src/api.ts` vazio).

## Commits

Um por grupo de critérios: `3a89d39` e `5c3246a` (remoção do bloco superior), `0fd1bd1`
(validação, foco e botão ocupado), `6e4a1f2` (logo, textos e efeitos), mais a correção da
logo reduzida (CSS) e a renumeração. Hooks passaram em todos; nenhum `--no-verify`.

## TDD (Red → Green), em `frontend/` com `npm test -- --run src/App.test.tsx src/LoginForm.test.tsx`

| Grupo | Red | Green |
|---|---|---|
| 1 (AC01, AC02, AC04) | 2 falhas: título ainda `h2` (`Unable to find ... role "heading" and name "Bem-vindo de volta"`). Os testes de "primeiro elemento do `main`" e de loading/unavailable já passavam com `3a89d39`. | 45 testes nos dois arquivos |
| 2 (AC07, AC08, AC09, AC15) | 19 falhas de 61 (validação própria, `novalidate`, mensagens, atributos do e-mail, botão ocupado, remoção do alerta do servidor). A causa exata de cada falha não foi lida individualmente. | 61 testes |
| 3 (AC12, AC13, AC14) | 3 falhas de 63 (logo sem nome, título novo ausente, logo reduzida inexistente) | suíte completa verde |

## Gates (último estado, `frontend/`)

| Comando | Resultado |
|---|---|
| `npm run lint` | Sem erros nem avisos. |
| `npm test -- --run` | 24 arquivos, **277 testes passaram**, 0 falhas. |
| `npm run build` | Concluído (`tsc -b` + `vite build`). |

## Critérios comprovados por teste automatizado

AC01, AC02, AC04, AC07, AC09, AC13, AC15 e a parte automatizada de AC08 (`aria-busy`,
`aria-disabled`, foco mantido, clique e envio ignorados), AC12 e AC14 (existência de logo
nomeada "BestPrice" e da logo reduzida). Validação de e-mail revisada manualmente pelo
`arch-reviewer` contra todos os casos aceitos e recusados da spec.

## Revisão independente

`arch-reviewer`: sem bloqueio de código. Achado médio de CSS (logo reduzida esticaria em
coluna flex) corrigido com `align-self: flex-start; object-fit: contain`, gates repetidos
(277/277). Achados baixos não aplicados, registrados como riscos: mensagem de e-mail
vazio não troca de texto ao digitar valor ainda inválido (conforme AC07); `focus()`
síncrono antes de `aria-describedby` aplicado pode afetar anúncio em alguns leitores de
tela; filete de sombra interna residual em ≤ 840 px; contraste de "Entrando…" com
`opacity: .65` não medido.

## Pendências explícitas (QA no navegador dispensado pelo responsável)

Nada abaixo foi medido; os critérios **não** estão comprovados:

- AC03 — sem rolagem vertical/horizontal em 320, 768 e 1280 px com 640 px de altura.
- AC05 — igualdade de layout de loading/unavailable com a base `b431134`.
- AC06 — contraste ≥ 3:1 do anel de foco (`--color-focus` `#c7005e`).
- AC08 — aparência distinta do botão ocupado.
- AC10 — contraste ≥ 4,5:1 contra o ponto mais claro do fundo, acima e abaixo de 840 px.
- AC11 — `backdrop-filter` e brilhos ausentes em ≤ 840 px; comportamento da 0017 em 841 px.
- AC12 (unicidade) e AC14 (altura ≤ 32 px, sem distorção) — apenas uma logo visível por vez.
- AC16 — teclado, `prefers-reduced-motion` e alvo de 44 × 44 px.
- Fluxo ponta a ponta contra o backend local não foi executado.
