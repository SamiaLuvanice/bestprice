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

## QA no navegador (issue #83)

Método e limites: Google Chrome instalado em modo headless via `playwright-core`
(nenhuma ferramenta de navegador estava disponível na sessão), viewport de 640 px de altura,
zoom 100%. `/api/auth/me` e `/api/auth/login` simulados por interceptação de rota, sem
backend nem PostgreSQL. Valores vêm de propriedades computadas e de pixels de capturas, não
do DevTools manual. Capturas e scripts ficaram no scratchpad da sessão (não versionados).

| AC | Valor medido | Situação |
|---|---|---|
| AC03 | Botão "Entrar" termina em 462,9 / 469,3 / 486,9 px (320 / 768 / 1280) no estado limpo; com alerta ou validação, alerta e primeira mensagem inteiros na janela; `scrollWidth` = `clientWidth` | Passa |
| AC05 | Base `b431134` × mudança em loading, 503 e conexão recusada, 320/768/1280 px: 0 retângulos e 0 pixels diferentes em 9 de 9 combinações | Passa pelo critério emendado em 15/10/2026 (comparação por valores; capturas dispensadas) |
| AC06 | Outline 2 px `rgb(199,0,94)` com recuo de 2 px; contraste do anel 5,45–5,85:1 | Passa |
| AC08 | Ocupado: fundo `rgb(245,245,247)`, texto `rgb(98,98,103)`, borda interna, cursor `progress`; `aria-busy`/`aria-disabled`; foco mantido; 1 requisição com 3 Enter/cliques; foco na senha após falha | Passa |
| AC10 | Subtítulo 5,82–6,07; rótulos ≥ 15,6; h1 ≥ 16,2; mensagens ≥ 6,92; alerta 6,79; "Entrar" 15,49. **"Entrando…": 2,68–2,71:1 (falhou) → 5,57–5,67:1 após remover `opacity: .65`** (commit `786f627`) | Passa após correção |
| AC11 | ≤ 840 px: `backdrop-filter: none`, glows `display:none`; 841/1280 px: `blur(24px) saturate(1.8)` e glows visíveis | Passa |
| AC12 | Uma única `img alt="BestPrice"` visível em 320, 768, 840, 841 e 1280 px | Passa |
| AC14 | Logo reduzida 32×32 px, proporção 1:1, `object-fit: contain` | Passa |
| AC16 | Tab: e-mail, senha, "Mostrar senha", "Entrar"; alvos 238–441×50 e 44×44 px; `reduce` leva as transições a ~0 | Passa |

Após a correção do contraste: `npm run lint` limpo, `npm test -- --run` 24 arquivos e 277
testes passando, `npm run build` verde. A correção é só de CSS e não tem teste automatizado
(o jsdom não avalia CSS); a prova é a remedição acima.

## Pendências

- Fluxo ponta a ponta contra o backend local não executado (API simulada).
- Medição fora do DevTools manual, em um único navegador (Chrome headless); sem scrollbar
  clássica nem dispositivo físico.
- Achados baixos do `arch-reviewer` não aplicados: foco síncrono antes de `aria-describedby`
  (anúncio por leitor de tela), filete de sombra interna em ≤ 840 px.
- A distinção do botão ocupado em relação ao fundo do card é sutil (apoia-se em borda,
  texto e cursor); a spec não exige contraste da borda.
