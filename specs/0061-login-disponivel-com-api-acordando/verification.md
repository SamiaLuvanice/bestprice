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

## QA (R2) — 25/11/2026

Agente QA (`.agents/agents/qa.md`), mesma worktree, código do commit `ffa1080`. Não alterou
código de produção nem testes.

### Portões e contagem de testes

| Comando (raiz da worktree, salvo indicação) | Resultado observado |
|---|---|
| `node .agents/scripts/gates.mjs --scope frontend` (1ª) | install ✔, lint ✔, test ✘, build ✘: `Cannot find module …/node_modules/vitest/suppress-warnings.cjs` e `TS2688` (tipos ausentes). `node_modules` incompleto logo após o `npm ci`; depois os arquivos apareceram. Inferência: outro processo usava a mesma `node_modules` ao mesmo tempo. |
| idem (2ª) | install ✘: `EPERM … unlink …rolldown-binding.win32-x64-msvc.node` (arquivo em uso por outro processo). |
| idem (3ª) | install ✔ 68,8 s, lint ✔, build ✔ (`Sem vestígios do catálogo em dist (5 marcadores conferidos)`, `Fontes conforme em dist`), test ✘: `Tests 6 failed \| 874 passed (880)`, todos `Test timed out in 15000ms` em arquivos fora da 0061 (`dashboard/detail`, `hero`, `products`, `refresh-row`, `navigation/routes`); duração 267 s (contra 92 s na F5). |
| `npx vitest run` nesses 5 arquivos (em `frontend/`) | `Test Files 5 passed (5)`, `Tests 86 passed (86)`. |
| `gates.mjs --scope frontend --only test` (4ª) | ✘ `Tests 4 failed \| 876 passed (880)`, de novo só timeouts de 15 s, em outros testes (catálogo, detalhe, refresh-row). Máquina carregada. |
| `npx vitest run` (suíte completa, `frontend/`) | `Test Files 63 passed (63)`, `Tests 880 passed (880)`, 117,9 s. |
| `gates.mjs --scope frontend --only test` (5ª, sem Vite/servidor da QA em paralelo) | ✔ `Test Files 63 passed (63)`, `Tests 880 passed (880)`, 121,1 s. |
| `npx vitest run src/App.wake.test.tsx src/auth/wakeRetry.test.ts src/auth/useSignupAvailability.test.ts src/LoginForm.test.tsx src/App.test.tsx` | `Test Files 5 passed (5)`, `Tests 129 passed (129)`. |

Situação: lint, build e testes verdes com contagem positiva (880). As falhas intermediárias
foram timeouts sob carga e disputa pela `node_modules`. Cada uma mudou de teste entre execuções
e passou isolada. Nenhuma aponta para a 0061, mas a suíte fica perto do limite de 15 s quando a
máquina está carregada.

### Fluxo local no navegador (simulação, não Render real)

Montagem: `frontend/` com `API_PROXY_TARGET=http://127.0.0.1:8799 npx vite --host 127.0.0.1
--port 5199 --strictPort` (modo dev, com `React.StrictMode`). O proxy aponta para
`qa/fake-render.mjs`, um servidor Node que simula a hibernação do Render. Enquanto "dorme",
responde a todo `/api/*` com `429` `text/plain` "Too Many Requests", sem envelope e com
`x-render-routing: hibernate-rate-limited`. Depois de N s, `/api/auth/me` responde `401` com
envelope (ou `200 User` com `session=user`) e `GET /api/auth/signup` responde `{"enabled":true}`.
O modo lento segura cada resposta por `slowMs`. O roteiro `qa/qa-e2e.mjs` usa o Chromium do
Playwright já instalado em `frontend/` e lê a ordem das requisições pelo evento `request` do
navegador. Saída consolidada em `qa/e2e-results.json` (22 verificações). Os dois servidores foram
encerrados ao final; `netstat` sem portas 5199/8799 em escuta.

| Cenário | Observado | AC |
|---|---|---|
| API rápida, sem sessão | login sem aviso | AC14 ✔ |
| 429 por 12 s, depois 401 (`/login`) | aos 1,7 s: formulário, aviso dentro de `role="status"`, sem "Tentar novamente", foco em `#login-title`, sem link "Criar conta". `/auth/me` em 1,1 s, 3,2 s, 7,2 s e 15,2 s (atrasos de 2, 4 e 8 s); aviso some aos 15,6 s; e-mail e senha digitados preservados; link "Criar conta" aparece sem recarregar; nenhuma chamada nova em mais 10 s | AC01, AC02, AC04, AC07, AC12 ✔ |
| 390 × 844 com aviso | `scrollWidth=390`, sem rolagem horizontal; `qa/login-aviso-390.png` | visual ✔ |
| Envio durante a hibernação, depois login certo (`returnTo=/alertas`) | 1º envio (429 sem envelope): alerta "Não foi possível concluir a operação. Tente novamente." e aviso mantido. Após acordar, login 200 leva a `/alertas`; 8 s depois continua em `/alertas` | AC05 ✔ |
| Sessão válida encontrada numa nova tentativa durante a digitação (`returnTo=/produtos`) | segue a `/produtos` aos 6,4 s | AC03 ✔ |
| `/cadastro` com 429 por 8 s | "Carregando…" + aviso, sem "Tentar novamente"; formulário "Criar sua conta" aos 14,6 s, ainda em `/cadastro` (`qa/cadastro-aviso-desktop.png`) | AC08 ✔ |
| `/alertas` com sessão, 429 por 10 s | "Carregando sua conta…" + aviso (`qa/alertas-aviso-desktop.png`); área "Alertas" aos 14,6 s | AC10 ✔ |
| Modo lento (cada resposta segura 8 s, acorda aos 25 s) | aos 2,5 s só "Carregando sua conta…"; formulário + aviso aos 5,8 s; nunca duas consultas da mesma época em paralelo; aviso some aos 30,9 s | AC01 (demora) ✔, ver obs. 1 |
| Falha de rede no navegador (`route.abort('internetdisconnected')` em `/api/auth/**`) | formulário + aviso; aviso some quando a rede volta | falha de rede ✔ |
| `/login` → `/cadastro` → `/` (SPA) | na landing, 0 chamadas `/api` em 20 s | AC13 ✔ |
| Nunca acorda (`/login`, 76 s) | formulário + aviso, sem "Tentar novamente". `/auth/me` e `/auth/signup` em 1,0 (×2), 3,0, 7,0, 15,0, 27,1, 42,1 e 57,1 s; nenhuma depois de 60 s | AC06 ✔, AC12 ✔ (ver nota) |
| Nunca acorda (`/alertas`) | aos 55 s, sem botão; erro "Não foi possível concluir a operação. Tente novamente." + "Tentar novamente" aos 61,1 s (`qa/alertas-esgotado-desktop.png`); API acordada e clique abrem "Alertas" | AC11 ✔ |

Nota sobre AC12: o roteiro marcou "FAIL" no limite `≤ 7` porque contou 8 consultas. A consulta
extra é a duplicata de montagem do `React.StrictMode` em dev (duas requisições em 1,0 s; a
primeira é descartada pela época). As 6 novas tentativas seguem os atrasos 2/4/8/12/15/15 s e a
última sai aos 57,1 s, dentro da janela. O limite foi respeitado; o falso negativo é do roteiro.

### Matriz AC → evidência

| AC | Teste automatizado (Vitest, timers falsos) | Navegador (simulação) | Situação |
|---|---|---|---|
| AC01 | `App.wake` "AC01/AC02: falha de sessão…", "AC01: sem resposta por 5 s…" | 429 e modo lento | ✔ |
| AC02 | idem (`role="status"`, sem `alert`, foco no título); `LoginForm` "renderiza o aviso recebido…" | `role="status"`, foco `login-title` | ✔ (sem leitor de tela real) |
| AC03 | "AC03: sessão encontrada numa nova tentativa…" | `/produtos` | ✔ |
| AC04 | "AC04: 401 numa nova tentativa…" | aviso some, digitação preservada, tentativas param | ✔ |
| AC05 | três casos "AC05" (401 de credencial, envio indisponível, sucesso não desfeito) | envio indisponível + sucesso | ✔ parcial: o `429 login_rate_limited` com envelope só é coberto indiretamente (`isUnavailable` → `false` na tabela do `wakeRetry.test`) |
| AC06 | "AC06: fim da janela mantém o formulário…" (7 chamadas) | 76 s | ✔ |
| AC07 | "AC07: o link Criar conta aparece…" | link aparece sem recarregar | ✔ |
| AC08 | três casos "AC08" | "Carregando…" + aviso → formulário | ✔ |
| AC09 | "AC09: fim da janela mostra o erro do cadastro…" | não executado (longo; coberto pelo teste) | ✔ por teste; o desvio "reabre também a sessão esgotada" não tem teste |
| AC10 | dois casos "AC10" | `/alertas` | ✔ |
| AC11 | "AC11: fim da janela mostra o erro atual…" | `/alertas`, erro aos 61,1 s, nova janela | ✔ |
| AC12 | `wakeRetry.test` "repete com atrasos crescentes…", "encerra a janela aos 60 s…", "passa a waking após 5 s… sem paralelo" | ritmo 2/4/8/12/15/15 s, nada depois de 60 s | ✔ |
| AC13 | quatro casos "Navegação durante a janela" | landing para as tentativas | ✔ |
| AC14 | "AC14: com a API respondendo rápido…", "AC13/AC14: … pageshow" + `App.test`/`routes.test` existentes | API rápida sem aviso | ✔ (`pageshow` persistido só em jsdom) |
| AC15 | `vi.useFakeTimers({ toFake: ['setTimeout','clearTimeout','Date'] })` em `App.wake.test.tsx` e `wakeRetry.test.ts` | — | ✔ |

### Observações

1. **Duplicata do StrictMode em dev + trava de cache do Chrome (sem impacto em produção).** No
   modo lento, as duas requisições iniciais idênticas (`/api/auth/me`) foram atendidas uma depois
   da outra: o log do servidor falso mostra respostas em +8 s e +16 s. A requisição "viva" esperou
   a descartada, e a 1ª nova tentativa saiu aos 18,4 s em vez de ~10,4 s. Inferência: o Chrome
   serializa GETs idênticos simultâneos. O build de produção não usa StrictMode. O mesmo atraso
   pode acontecer se `retry()` (botão ou `pageshow`) começar com uma requisição antiga ainda em
   voo. Os limites de AC12 continuam respeitados. Severidade baixa.
2. **Espaçamento do aviso no login.** O cartão do aviso fica quase colado ao subtítulo "Acesse
   seus anúncios…" (poucos px), principalmente a 390 px, enquanto o espaço abaixo dele é maior.
   Não há quadro Figma para o aviso (decisão da spec); fica como sugestão para a validação visual
   posterior. Captura `qa/login-aviso-390.png`; as capturas de desktop do login (~470 kB) ficaram
   fora do repositório.
3. **Portões instáveis sob carga.** Duas execuções do portão de testes falharam por timeout de
   15 s em testes fora da 0061, e duas instalações sofreram disputa pela `node_modules` (outro
   processo na mesma worktree). A execução sem concorrência ficou verde. Vale não rodar portões
   em paralelo na mesma worktree.
4. **Console do navegador:** só `Failed to load resource: … 429 (Too Many Requests)`, registrado
   pelo próprio navegador para cada 429 simulado. Nenhum erro de JavaScript da aplicação.

### Limites

- Simulação local, não a API hibernada real de Stage nem o proxy do Cloudflare Pages. A
  verificação contra Render/Pages reais continua pendente (exige promoção a Stage).
- Vite em modo dev (StrictMode), não o `dist/` de produção.
- Sem leitor de tela real para o anúncio educado (AC02), só a semântica `role="status"`.
- AC09 e o voltar pelo histórico (bfcache real) não foram exercitados no navegador; a cobertura
  vem dos testes automatizados.
- Revisão independente (R1), `docs-impact` (R3), PR e CI não são desta etapa; nenhum resultado
  de CI, Project ou release é afirmado aqui.

Veredito da QA: **aprovada**. Todos os AC01–AC15 foram demonstrados, sem bug funcional. As
observações 1–3 não bloqueiam.

## Correções pós-revisão e QA — 25/11/2026

Revisão R1 (aprovada com condições) e QA R2 (aprovada, commit `5ff98b7`). Mudanças de
comportamento em TDD, na mesma worktree.

### Red

- `npx vitest run src/auth/wakeRetry.test.ts` com 4 testes novos: `Tests 4 failed | 18 passed
  (22)`. Motivos: `result.current.markAwake is not a function` (I1, 2 testes: método ainda
  inexistente), `expected "vi.fn()" to be called once, but got 2 times` (S1: `retry()` abria
  requisição paralela) e `expected 'Não foi possível conectar ao BestPric…' to be 'Banco
  indisponível.'` (S2: mensagem da primeira falha).
- `npx vitest run src/App.wake.test.tsx` com 7 testes novos: `Tests 5 failed | 24 passed (29)`.
  Motivos: `expected '/login' to be '/alertas'` (I1: senha errada + `200` tardio descartado),
  `Unable to find … role "status"` (I2: login sem contêiner estável, 2 testes) e `expected [
  <p role="status">, … ] to have a length of 1 but got 2` (I2: dois status concorrentes em
  "Carregando sua conta…" e no cadastro). Passaram já no código anterior, como cobertura nova
  de comportamento existente: AC05 com `429 login_rate_limited` (com envelope) durante a
  janela e o "Tentar novamente" do cadastro reabrindo a sessão esgotada (AC09, desvio).

### Green

- `wakeRetry.test.ts`: `Tests 22 passed (22)`.
- `App.wake.test.tsx`, `LoginForm.test.tsx` e `src/auth`: `Tests 156 passed (156)`.
- Suíte completa `npx vitest run`: primeira execução com `2 failed | 890 passed (892)` no
  teste de login de `App.test.tsx` que exigia ausência de status depois do `401`; ajustado de
  propósito para "status presente e vazio" (I2). Depois: `Test Files 63 passed (63)`, `Tests
  892 passed (892)`.
- `npx tsc -b` e `npm run lint` sem erros nem avisos.

### O que mudou

- I1: `useWakeRetry.markAwake(fallback)`; `useSessionCheck.markAwake()`; o login usa
  `markAwake()` após falha que não é indisponibilidade.
- S1: `retry()` com requisição em voo reinicia só janela e demora de 5 s.
- S2: `lastError` guardado em `markUnavailable` e usado no esgotamento.
- I2: contêiner `role="status"` estável no `LoginForm` (aviso entra depois da montagem); um
  único status nas telas de espera; `ServerWakingNotice` sem `role` próprio.
- S6: `requestAnimationFrame`/`cancelAnimationFrame` falsos em `App.wake.test.tsx`; o foco do
  título é avançado pelo relógio falso.
- QA obs. 2: `.login-notice:not(:empty) { margin-top: var(--space-6) }`, o mesmo respiro do
  erro do login; vazio não ocupa espaço. Sem nova captura visual nesta etapa.
- S3, S4 e S5: só registrados em `plan.md` ("Comportamentos registrados na revisão").

### Portões

`node .agents/scripts/gates.mjs --scope frontend` (commit `9ab04a6`, exit 0):

```
Resumo dos portões:
  ✔ frontend:install       40.9s
  ✔ frontend:lint          10.7s
  ✔ frontend:test          114.8s
  ✔ frontend:build         20.0s
Sem vestígios do catálogo em dist (5 marcadores conferidos).
Fontes conforme em dist: Geist Mono latin/latin-ext 400–600, sem base64.
```

Contagem positiva pela execução direta acima (892 testes).

### Limites

- O espaçamento do aviso não foi revalidado em navegador (sem nova captura a 390 px).
- O anúncio por leitor de tela real não foi testado; os testes conferem a estrutura (status
  estável, texto trocado) em jsdom.

## Sincronização da documentação (R3) — 25/11/2026

Agente `doc-sync-onboarding`, mesma worktree, sobre o código do commit `f9ac0dc`. Não alterou
código.

- `node .agents/scripts/docs-impact.mjs` antes da edição: `revisar docs/apps/frontend.md` (por
  `App.tsx`, `App.wake.test.tsx`, `auth/*` e demais arquivos do diff). Depois:
  `✔ alterado docs/apps/frontend.md`.
- `docs/apps/frontend.md`: nova seção "Sessão com a API acordando — spec 0061" (classificação da
  indisponibilidade, demora de 5 s, janela de 60 s com até 6 tentativas em 2/4/8/12/15/15 s,
  escopo de telas, landing e 404 inalterados, tabela de estados por tela, login durante a
  espera com `markAwake`/`settle`, aviso neutro no `Alert` informativo dentro de contêiner
  `role="status"` estável). Corrigidos os trechos que descreviam "Tentar novamente" logo após
  falha da sessão ou do cadastro (seções da tela de entrada 0046/0053/0057, cadastro 0048,
  rotas 0034 e monitoramento) e registrado que o aviso não tem quadro Figma próprio, por
  decisão da spec, como no limite de login da 0057. Tabela de arquivos com `wakeRetry.ts`,
  `useSessionCheck.ts`, `ServerWakingNotice.tsx` e a prop `notice` do `LoginForm`.
- `docs/PROGRESS.md`: entrada da 0061 com os resultados já registrados acima (892 testes,
  portões no `9ab04a6`, revisão e QA) e as pendências.
- Conferidos sem mudança: `README.md` e `docs/architecture.md` (não descrevem a verificação de
  sessão nem o "Tentar novamente"), `docs/index.md` (nenhum documento novo), `AGENTS.md` e
  `CLAUDE.md` (sem mudança de instruções do harness).
- `git diff --check` sem problemas; âncora `#sessão-com-a-api-acordando--spec-0061` conferida
  contra o título, e caminhos dos links locais existentes. Nenhum portão de código foi
  reexecutado nesta etapa (só documentação).
