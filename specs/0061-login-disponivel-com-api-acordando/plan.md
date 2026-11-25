# Plano — 0061

Só frontend. O contrato REST não muda: `GET /api/auth/me` (200 `User`, 401
`unauthenticated`) e `GET /api/auth/signup` (200 `{enabled}`) continuam iguais. A
mudança é como a SPA reage a falha ou demora dessas duas consultas.

## Classificação das respostas (vale para as duas consultas)

| Resultado | Classe | Efeito |
|---|---|---|
| 200 válido | decidida | encerra a janela |
| `401` (`/auth/me`) | decidida (sem sessão) | encerra a janela |
| `ApiFailure` com `code` vindo do envelope da API (≠ `api_error`, `network_error`, `invalid_response`) e status ≠ 401 | API acordada, erro real | encerra a janela; mostra o erro atual (sem novas tentativas) |
| `network_error`, `api_error` (corpo sem envelope, como o `429` do Render), `invalid_response`, `5xx` sem envelope | indisponível | aviso + novas tentativas |
| sem resposta após 5 s | indisponível (demora) | aviso; a mesma requisição continua; não abre outra em paralelo |

Observação: o `503 database_unavailable` da própria API vem com envelope, mas também é
transitório. **Decisão:** `5xx` conta como indisponível mesmo com envelope; só `4xx` com
envelope encerra a janela como erro real.

## Decisões caras de reverter

- **Motor único de novas tentativas:** `frontend/src/auth/wakeRetry.ts` exporta as
  constantes (`SLOW_AFTER_MS = 5_000`, `WINDOW_MS = 60_000`, `MAX_RETRIES = 6`,
  `RETRY_DELAYS_MS = [2_000, 4_000, 8_000, 12_000, 15_000, 15_000]`), a função pura
  `isUnavailable(failure: unknown): boolean` (tabela acima) e um hook genérico
  `useWakeRetry<T>(fetcher, { active, clock })`. Estados: `loading` (pendente < 5 s),
  `waking` (indisponível, janela em curso), `exhausted` (janela terminou sem decisão),
  `settled` (com valor ou erro definitivo). Expõe `retry()` (nova janela), `settle(value)`
  (decisão externa, ex.: login) e `markAwake()`. Os atrasos somam 56 s; uma tentativa cujo
  início passaria de `WINDOW_MS` desde a primeira indisponibilidade não acontece (relógio
  injetado; nos testes, `vi.useFakeTimers()` controla `setTimeout` e `Date`).
- **Sessão:** a lógica de `api.me()` sai de `App.tsx` para
  `frontend/src/auth/useSessionCheck.ts`, sobre `useWakeRetry`. Estados vistos por
  `App`: `loading | waking | unavailable | guest | ready` (+ `user`, `error`). O
  `pageshow` com `persisted` chama `retry()` (AC13). `login`, `signedUp`, `endSession` e
  `loggedOut` passam por `settle(...)`, para que uma verificação atrasada não desfaça o
  resultado (AC05).
- **Cadastro:** `useSignupAvailability(active)` passa a usar `useWakeRetry`. Expõe
  `availability: loading | enabled | disabled | error` e `waking: boolean`. `retry()`
  inicia nova janela (AC09).
- **`active`:** verdadeiro só nas telas do escopo (`/login`, `/cadastro`, `/app`,
  `/app/*`, `/produtos`, `/produtos/:id`, `/alertas`), calculado em `App.tsx` com
  `matchPath`. Com `active` falso, nenhuma nova tentativa é agendada (o timer pendente é
  cancelado); a requisição em voo ainda pode decidir o estado. Ao voltar a ficar ativo
  com estado `waking`/`exhausted`, começa nova janela (AC13). Navegar entre telas do
  escopo não muda `active`, então a janela continua.
- **Aviso:** componente `frontend/src/auth/ServerWakingNotice.tsx` com o `Alert` de
  variante `default` (`role="status"`) de `components/ui/alert.tsx` e o texto da spec.
  `LoginForm` recebe a prop opcional `notice?: ReactNode`, renderizada abaixo do
  subtítulo e acima do erro. Sem quadro Figma (decisão da spec); registrar em
  `docs/apps/frontend.md`.

## Renderização por rota (`App.tsx`)

| Sessão | `/login` | `/cadastro` | áreas logadas |
|---|---|---|---|
| `loading` | "Carregando sua conta…" (como hoje) | idem | idem |
| `waking` | formulário + aviso | ver cadastro abaixo | "Carregando sua conta…" + aviso |
| `unavailable` (janela terminou) | formulário + aviso | ver cadastro abaixo | erro atual + "Tentar novamente" (`retry()`) |
| `guest` | formulário (sem aviso) | cadastro como hoje | `Navigate` ao login com `returnTo` |
| `ready` | `Navigate` ao destino | `Navigate` ao destino | área |

Cadastro com sessão `waking`/`unavailable`: `enabled` → formulário; `disabled` →
`Navigate` ao login; `loading` → "Carregando…" + aviso quando `waking`; `error` → erro
atual com "Tentar novamente".

Login: `login()` chama `session.markAwake()` quando a falha não é indisponibilidade
(ex.: `401 invalid_credentials`, `429 login_rate_limited`) e `settle(user)` no sucesso.
As mensagens de erro do envio não mudam.

## Testes

- `frontend/src/auth/wakeRetry.test.ts`: `isUnavailable` (tabela) e o hook com timers
  falsos: demora de 5 s, atrasos, máximo de 6, corte em 60 s, `active` falso cancela,
  reativar abre janela, `settle` ignora resposta atrasada (AC12, AC15).
- `frontend/src/App.test.tsx` e `navigation/routes.test.tsx`: AC01–AC11, AC13, AC14 pela
  interface com `fakeApi`. Os testes atuais que esperam "Tentar novamente" logo após
  `503`/falha de rede no login mudam de propósito (agora o formulário aparece);
  documentar a mudança no teste.
- `auth/useSignupAvailability.test.ts`: novas tentativas e `retry()`.
- `LoginForm.test.tsx`: `notice` renderizado como status, foco inicial inalterado.
- Snapshots Playwright do login (`frontend/tests/`) não mudam no caminho comum; se o
  estado com aviso ganhar snapshot, a baseline exige revisão explícita.

## Arquivos

Novos: `frontend/src/auth/wakeRetry.ts`, `wakeRetry.test.ts`, `useSessionCheck.ts`,
`ServerWakingNotice.tsx`. Alterados: `frontend/src/App.tsx`, `LoginForm.tsx`,
`auth/useSignupAvailability.ts` e os testes citados. Documentação:
`docs/apps/frontend.md` (seção de login/sessão), conforme `docs-impact`.

## Riscos

- `App.tsx` concentra rotas e sessão; extrair a sessão reduz o arquivo, mas os testes de
  rota existentes precisam continuar verdes sem alteração fora dos casos de falha.
- Timers falsos com `fetch` simulado: avançar timers dentro de `act` e aguardar as
  promessas pendentes, para evitar testes intermitentes.

## Desvios registrados na implementação (agente frontend, 25/11/2026)

- **Sem relógio injetado em `useWakeRetry`:** a demora de 5 s, os atrasos e a janela de 60 s
  são medidos só por `setTimeout` (um timer de janela aberto na primeira indisponibilidade).
  Isso basta para AC12/AC15: nos testes, `vi.useFakeTimers({ toFake: ['setTimeout',
  'clearTimeout', 'Date'] })` controla todo o tempo, sem `clock` extra na API do hook.
- **Esgotamento só no fim da janela:** depois da 6ª nova tentativa (aos ~56 s) o estado
  continua `waking` até completar 60 s; só então vira `exhausted`. Motivo: AC06, AC09 e AC11
  falam em "fim da janela", não em "fim das tentativas".
- **Sem `markAwake()`:** no login, uma falha que não é indisponibilidade (ex.: `401
  invalid_credentials`, `429 login_rate_limited`) chama `settle(null)`: a API acordou e a
  pessoa está sem sessão. Um único método (`settle`) cobre login, cadastro, logout e AC05.
- **Estado `failed` em `useSessionCheck`:** separa "janela esgotada" (`unavailable`) de "API
  acordada com erro definitivo" (4xx com envelope, exceto 401). Em `/login`, `unavailable`
  mantém o formulário com aviso (AC06), enquanto `failed` mostra o erro atual com "Tentar
  novamente", como pede a definição de indisponibilidade da spec.
- **`active` do cadastro só em `/login` e `/cadastro`:** o interruptor só aparece nessas telas;
  repeti-lo nas áreas logadas seria carga sem efeito visível. A sessão usa o escopo completo.
- **"Tentar novamente" do cadastro (AC09):** além de `signup.retry()`, reabre a janela da
  sessão quando ela também estiver esgotada, para a sessão não ficar sem nova verificação.
- **Falha fora de `ApiFailure`:** `isUnavailable` a trata como indisponibilidade (repetir dentro
  dos limites de AC12 é mais seguro que prender a pessoa num erro).
