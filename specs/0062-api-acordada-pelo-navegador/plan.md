# Plano — 0062

Só frontend. O contrato REST não muda e o backend não muda: o pedido direto usa o
`GET /api/health` que a API já expõe publicamente. Nenhuma migration.

## Decisões caras de reverter

- **Configuração no build:** variável `VITE_API_ORIGIN` (ex.:
  `https://bestprice-stage-api.onrender.com`), lida por `import.meta.env` no build do Vite.
  No Cloudflare Pages as variáveis do projeto valem no build e na Function; o valor é o mesmo
  de `API_ORIGIN` (usado pelo proxy). Sem a variável (Compose, Vitest, Playwright), o
  despertador é um no-op (AC05). A origem é validada com as mesmas regras do proxy: só
  `https:`, sem usuário/senha, caminho `/`, sem query nem fragmento; valor inválido também
  vira no-op.
- **Módulo único:** `frontend/src/auth/apiWaker.ts` exporta `createApiWaker(origin, fetchImpl)`
  (testável) e `wakeApiOrigin` (instância com `import.meta.env.VITE_API_ORIGIN` e o `fetch`
  global).
- **Pedido "cego" (AC03/AC04):** `fetch(origin + '/api/health', { method: 'GET',
  mode: 'no-cors', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer',
  signal })`. `no-cors` dispensa CORS na API (resposta opaca, nunca lida); `credentials:
  'omit'` não envia cookies; sem corpo, sem cabeçalhos próprios, URL fixa. Rejeição e
  exceção síncrona são engolidas. O sinal aborta em 60 s (`WAKE_TIMEOUT_MS`): a essa altura o
  pedido já chegou ao Render.
- **Um pedido por janela (AC01/AC02):** `useWakeRetry` ganha a opção `onWindowOpen`, chamada
  só na transição `none → open` da janela (primeira indisponibilidade observada com `active`).
  Novas tentativas dentro da janela não passam por essa transição; `retry()`, reentrada numa
  tela do escopo (AC13 da 0061) e o fim da janela a reabrem.
- **Duas consultas, um pedido:** sessão e cadastro têm janelas próprias (0061, S5) que abrem
  com milissegundos de diferença. O despertador ignora uma chamada enquanto o pedido anterior
  ainda estiver em voo, para a mesma indisponibilidade não gerar dois pedidos. Uma nova
  janela depois que o pedido terminou faz um novo pedido.
- **Ligação:** `useSessionCheck` e `useSignupAvailability` passam
  `onWindowOpen: wakeApiOrigin`. O caminho comum (API respondendo em < 5 s) nunca abre
  janela, então não há pedido (AC06).

## Segurança

- Nada novo fica exposto: a origem `*.onrender.com` já é pública e acessível sem o proxy;
  cadastro e login já tratam acesso direto (0048, 0057). O health não exige autenticação e não
  devolve dados de pessoas.
- Não há CSP hoje (`frontend/public/_headers`, `nginx.conf`); se for criada, `connect-src`
  precisa incluir a origem da API (registrado em `docs/apps/infraestrutura.md`).

## Testes

- `frontend/src/auth/apiWaker.test.ts`: URL e opções do pedido (AC01, AC03); origem ausente
  ou inválida não chama `fetch` (AC05); rejeição e exceção síncrona não vazam (AC04);
  chamadas com pedido em voo são ignoradas e um novo pedido acontece depois que ele termina;
  aborto aos 60 s com timers falsos.
- `frontend/src/auth/wakeRetry.test.ts`: `onWindowOpen` uma vez por janela, de novo após
  `retry()`, nunca no sucesso direto nem com `active` falso (AC01, AC02, AC06).
- `frontend/src/App.apiWaker.test.tsx`: `/login` pela `App` com o módulo do despertador simulado —
  API indisponível chama o despertador (sessão e cadastro), API respondendo não chama
  (AC01, AC06).
- AC07 só se comprova em Stage após a promoção e a configuração da variável.

## Arquivos

Novos: `frontend/src/auth/apiWaker.ts`, `apiWaker.test.ts`, `frontend/src/App.apiWaker.test.tsx`.
Alterados: `frontend/src/auth/wakeRetry.ts`, `wakeRetry.test.ts`, `useSessionCheck.ts`,
`useSignupAvailability.ts`. Documentação: `docs/apps/infraestrutura.md` e
`docs/apps/frontend.md` (variável e comportamento), conforme `docs-impact`.

## Passo operacional (fora do código)

Criar `VITE_API_ORIGIN` no Cloudflare Pages (ambiente de produção do projeto de Stage) com o
mesmo valor de `API_ORIGIN` e refazer o build. Sem isso o bundle publicado não faz o pedido.
