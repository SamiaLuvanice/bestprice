# Verificação — Spec 0017

Base: `0302a64` de `origin/develop` (worktree
`.worktrees/feature-0017-issue-56-redesign-login`, branch
`feature/0017-issue-56-redesign-login`). Código verificado em `49869a0`.
Issue [#56](https://github.com/SamiaLuvanice/bestprice/issues/56).

## Mudança

- `frontend/src/LoginForm.tsx` (novo): entrada em duas colunas, com uma coluna visual
  decorativa (`aria-hidden`, logo `alt=""`, card ilustrativo sem dados) e um painel com
  título "Bem-vindo de volta", e-mail, senha com controle "Mostrar senha" (`aria-pressed`) e
  botão pílula "Entrar"/"Entrando…".
- `frontend/src/App.tsx`: usa `LoginForm` no estado `guest`; `login(email, password)`. Os
  estados `email` e `password` saíram do `App`.
- `frontend/src/styles.css`: casca de vidro com superfície sólida de fallback, brilhos em
  `radial-gradient` dentro de `.login-shell` (`overflow: hidden`), duas colunas acima de
  840 px, movimento reduzido e remoção dos seletores `.login-form` órfãos. Também corrige
  a ordem `-webkit-backdrop-filter` → `backdrop-filter` nas regras `@supports` da 0015
  (ver B1).
- `frontend/src/dashboard/Icons.tsx`: `EyeIcon` e `EyeOffIcon`.
- `designsystem/README.md`: extensões da 0017 registradas.
- Backend, `api.ts` e contratos REST sem alteração
  (`git diff --stat origin/develop...HEAD -- backend` vazio).

## Revisão da spec

`spec-reviewer`: a 1ª rodada reprovou a spec por três motivos: card com dados fictícios
(contrariando `frontend.md`, o README do design system e o AC29 da 0012), controles sem
efeito e validação indefinida. A 2ª rodada aprovou com ressalvas menores, aplicadas em
`87dcf7d`. As decisões tomadas com o usuário estão registradas na spec.

## TDD

- **Red** (`npx vitest run src/LoginForm.test.tsx src/App.test.tsx`): 2 arquivos e 2 testes
  falharam, com 30 testes passando.
  - `LoginForm.test.tsx`: `Failed to resolve import "./LoginForm"`, porque o componente não
    existia.
  - `App.test.tsx`: `Unable to find role="button" and name "Mostrar senha"`; o foco não ia
    para Senha após a falha.
- **Green**: o mesmo comando resultou em 41 testes passando.

## Portões (executados em `frontend/`, HEAD `49869a0`)

| Comando | Resultado |
|---|---|
| `npm run lint` | verde, sem avisos |
| `npm test -- --run` | **253 passed** em 23 arquivos, em 3 execuções seguidas (eram 242; 11 novos) |
| `npm run build` | `tsc -b && vite build` verde |
| `npx vitest run src/App.test.tsx` ×8 | 0 falhas, após a correção de intermitência (ver abaixo) |

**Intermitência corrigida:** antes de `49869a0`, o teste de integração do foco falhou 2
vezes em 5 execuções. O foco é aplicado em `useEffect` passivo, e a asserção era síncrona
logo após o `waitFor` do alerta. A asserção passou a ser `await waitFor(... toHaveFocus())`.
O teste continua falhando se o foco não acontecer.

## QA no navegador

**Ambiente:**
- Compose isolado `bestprice-qa0017`, com db, backend e frontend reais, nas portas
  5197/8097/5497 e volume próprio, removido no fim com `down -v --rmi local`.
- Chrome 155 headless, playwright-core 1.64 e axe-core 4.14.
- Conta local criada com `python -m app.auth.provision`.
- Para abrir o detalhe, foi inserido um produto sintético no banco isolado.
- `/api/health`: 200 com o banco no ar e 503 com o banco parado.

**1ª rodada (`149e3b8`):** AC02–AC09 aceitos e AC01 parcial, por dois defeitos:

- **B1:** o lightningcss (Vite 8) reduzia `backdrop-filter:X;-webkit-backdrop-filter:X` a só
  `-webkit-backdrop-filter`, que o Chrome não aplica. O vidro ficava sem desfoque. O defeito
  existia desde a 0015 (cabeçalho, menus e diálogos).
- **B2:** `overflow: clip` cortava os brilhos em retângulo. O `arch-reviewer` também
  apontou que `clip` não tem fallback (Safari anterior ao 16 geraria rolagem horizontal).

**Reteste (`49869a0`):** tudo aceito.

| AC | Resultado | Evidência |
|---|---|---|
| AC01 | Aceito | 1280 px em duas colunas (511 + 511 px). `backdropFilter` = `blur(24px) saturate(1.8)` em `.login-card` e `.login-illustration`. O CSS servido contém `backdrop-filter` sem prefixo. Com `@supports` desligado (simulado), o fundo fica sólido a `.96`, legível. |
| AC02 | Aceito | Coluna com `aria-hidden="true"` e fora do `ariaSnapshot`. Único `h1` é o do hero. Sem dígitos nem "BestPrice". Logo 1254×1254 renderizada em 88×88 (proporção 1,0), sem pixel da arte cortado. |
| AC03 | Aceito | `type="email"`, `autocomplete` e `required`. A validação nativa dispara ("Preencha este campo.", "Inclua um @…"). |
| AC04 | Aceito | Nome fixo "Mostrar senha". `aria-pressed` alterna false → true → false. `type` alterna password/text. O ícone alterna e o valor é preservado. Espaço aciona o controle. Ao enviar, a senha volta a ficar oculta. |
| AC05 | Aceito | Raio de 980 px. `#39ff14` com texto `#000` (15,49:1). Hover `#65ff48`. Desabilitado com opacidade .65. Foco com contorno de 3 px `#c7005e`. Com a requisição segurada por 2 s: "Entrando…" desabilitado. Segundo clique e Enter durante o envio geram **um único** `POST /api/auth/login`. |
| AC06 | Aceito | Campos vazios ou inválidos: 0 POST e foco no primeiro campo inválido. Um único `role="alert"` com campos preservados e foco em Senha nos casos de 401 real, 504 (backend parado) e `ERR_CONNECTION_REFUSED` (frontend parado). |
| AC07 | Aceito | `scrollWidth == clientWidth` em 320, 768 e 1280 px, com desfoque e no modo sólido. Coluna visual com `display: none` em 320 e 768 px. Nada cortado. Todos os controles com pelo menos 44×44 px. |
| AC08 | Aceito | Contraste com desfoque real: menor texto 5,75:1 (subtítulo, 320 px); borda do input ≥ 3,48:1; foco ≥ 5,62:1. Modo sólido: texto ≥ 5,87:1. axe WCAG 2.1 A/AA com 0 violações em 320 e 1280 px, nos dois modos. Os inconclusivos de `color-contrast` sobre vidro foram medidos por pixel. Teclado com `:focus-visible` em todos. Com `reduce`: `transform: none` no `:active` e transições desprezíveis. |
| AC09 | Aceito | O formulário de monitoramento por link aparece antes do login. Login válido: 200 → `/api/dashboard` 200, painel aberto. Ao recarregar, a sessão se mantém. Logout 204. |

**Regressão da 0015, área autenticada em 1280 px:** com o desfoque agora real, o axe não
apontou violações no painel, no menu da conta, no sino, no menu da linha, no diálogo de
detalhe e na confirmação de parada. Os inconclusivos foram medidos por pixel: o menor valor
foi 5,04:1.

## Revisão independente

`arch-reviewer`:
- **1ª rodada** (`87dcf7d..149e3b8`): aprovado com ressalvas. Pontos: `overflow: clip` sem
  fallback, `!important` evitável no movimento reduzido e card ilustrativo sólido.
- **2ª rodada** (`149e3b8..49869a0`): **aprovado**. Restaram dois pontos cosméticos,
  aceitos como limites.

## Limites e pendências

- Navegador único (Chrome headless), sem leitor de tela, sem outros navegadores e sem
  dispositivo físico. O modo sem `backdrop-filter` foi simulado.
- O jsdom não executa a validação interativa. O bloqueio do envio e o foco no primeiro
  campo inválido foram comprovados só no navegador; os testes cobrem `checkValidity()`.
- O aviso de sessão encerrada sem mover o foco foi coberto por teste unitário, não no
  navegador.
- **Cosmético:** entre cerca de 1056 e 1103 px de viewport, com barra de rolagem visível, o
  card pode ficar até cerca de 15 px mais estreito que o hero (`100vw` no `clamp`).
- **Cosmético:** abaixo de cerca de 552 px, a cauda lateral da sombra do card (8%) é
  recortada.
- A área autenticada não foi re-medida em 320 px após a correção B1.
- CI remoto e revisão humana do PR estão pendentes.
