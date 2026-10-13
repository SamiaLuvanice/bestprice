# Plano técnico — 0012

Spec: [spec.md](spec.md) · Issue #33 · Branch `feature/0012-issue-33-area-usuario-monitoramento`
(worktree `.worktrees/feature-0012-issue-33-area-usuario-monitoramento`, já com `develop`
atualizado e a spec 0013 integrada pelo PR #35).

## Estado de partida

- A spec é **somente de interface**: nenhuma rota, campo, migração ou regra de domínio muda.
  O plano foi conferido contra o código de `backend/app/products/{routes,schemas,service,alerts}.py`,
  `backend/app/auth/routes.py` e `backend/app/errors.py` desta branch.
- O frontend da 0013 é um único `frontend/src/App.tsx` (≈540 linhas) com estado global de
  `busy` (um envio desabilita quase todos os botões), lista de blocos simples e o diálogo de
  detalhe com foco preso. `frontend/src/App.test.tsx` tem **29 testes** que passam hoje.
- Dependências atuais: React 19, Vite 8, Vitest 5, Testing Library (`react`, `dom`,
  `jest-dom`), jsdom 27. Não há `@testing-library/user-event`. `playwright` aparece em
  `node_modules` como pacote *extraneous* (instalado à parte na QA da 0013, fora do
  `package.json`).
- Design: `designsystem/area-usuario-monitoramento.png` é a referência visual da spec.
  `designsystem/README.md` informa que os tokens de `designsystem/index.html` têm autoria e
  origem ainda não esclarecidas (“tokens Apple … verbatim”) e acento verde neon, diferente
  da referência PNG e da aplicação atual (azul `#3155db`). Ver decisão D7.

## Contrato REST consumido (sem alterações no backend)

Todas as chamadas usam caminho relativo `/api`, `credentials: 'same-origin'` (cookie de
sessão da 0011). Erros seguem o corpo de `backend/app/errors.py`:
`{"error": {"code", "message", "fields", "tracked_product_id", "retry_after_seconds"}}`.
Somente `401` (`unauthenticated`) encerra a sessão local. Dinheiro e percentuais chegam
como **strings decimais** (Pydantic `Decimal`; escala 2 nos preços e `quantize(0.01)` no
percentual); instantes chegam em ISO 8601 UTC com `Z` (`UtcDateTime`).

| Uso na UI | Método e rota | Parâmetros | Campos usados | Sucesso | Erros tratados |
|---|---|---|---|---|---|
| Sessão e e-mail no menu da conta (AC01) | `GET /api/auth/me` | — | `email` | 200 `UserResponse` | 401 → entrada (0011); 5xx/rede → “Tentar novamente” (comportamento 0011 mantido) |
| Entrada (0011, sem mudança visual) | `POST /api/auth/login` | `{email, password}` | `email` | 200 | 401 `invalid_credentials` (mensagem da API, não é fim de sessão) |
| Sair (AC01) | `POST /api/auth/logout` | — | — | 204 | 500/rede → mensagem no cabeçalho, sessão local mantida |
| Painel: indicadores, oportunidades, 1ª página de produtos, atualizações (AC09–AC14, AC17, AC20–AC21, AC23–AC25) | `GET /api/dashboard` | — | `summary.{tracked_count, price_drop_count, active_alert_count, target_reached_count}`, `opportunities[]` (≤5, ordem da API), `tracked_products.{items[≤20], next_cursor}`, `recent_updates[]` (≤20, `observed_at` desc) | 200 | 401; 5xx/rede → erro na região com “Tentar novamente” |
| Carregar mais produtos (AC17) | `GET /api/tracked-products` | `cursor` | `items`, `next_cursor` | 200 | 401; 422 `validation_error` (cursor inválido) e 5xx/rede → mensagem na seção |
| Monitorar (AC07, AC08) | `POST /api/tracked-products` | `{url}` | `TrackedProductResponse` + **status HTTP** | **201** novo, **200** retomada | 400 (códigos do parser de URL), 404 `product_not_found`, 409 `already_tracked` (+`tracked_product_id`), 429 `refresh_not_due`/`integration_rate_limited` (+`retry_after_seconds`), 502 `integration_invalid_response`/`unsupported_price_context`, 503 `integration_*`, rede, corpo instável |
| Detalhe, “Ver produto”, recarga de linha após 502/503 (AC08, AC15, AC16, AC20) | `GET /api/tracked-products/{id}` | — | `TrackedProductResponse` | 200 | 401; 404 `resource_not_found` |
| Histórico no detalhe (herdado) | `GET /api/tracked-products/{id}/history` | `cursor` | `items[].{id, price, captured_at}`, `next_cursor` | 200 | 401; 404 |
| Atualizar agora (AC16) | `POST /api/tracked-products/{id}/refresh` | — | `TrackedProductResponse` (`last_attempt_status`, `lookup_status`) | 200 (inclusive `lookup_status=not_found`) | 429 `refresh_not_due`/`integration_rate_limited` (+prazo), 409 `tracking_inactive`, 404 `resource_not_found`, 502/503 `integration_*`, rede |
| Parar de monitorar (AC18, AC19) | `DELETE /api/tracked-products/{id}` | — | — | 204 (o backend também pausa o alerta) | 404; 5xx/rede |
| Alerta no detalhe (herdado; recálculo AC04) | `POST`/`PATCH`/`DELETE /api/tracked-products/{id}/alert` | `{target_price}` / `{target_price?, enabled?}` | `PriceAlertResponse.{id, target_price, enabled, condition}` | 201 / 200 / 204 | 409 `tracking_inactive`/`alert_already_exists`, 422 `validation_error`, 404 |
| Contador e painel do sino (AC04, AC05) | `GET /api/notifications` | **`unread_only=true&limit=100`** | `items[].{id, tracked_product_id, product_title, observed_price, target_price, created_at, read_at}`, `next_cursor` | 200 (ordem `created_at` desc) | 401; 5xx/rede → “Notificações indisponíveis” + “Tentar novamente” |
| Seção Alertas (AC22, AC23) | `GET /api/notifications` | `cursor` (limite padrão 20) | mesmos campos | 200 | 401; 5xx/rede → erro na seção com “Tentar novamente” |
| Marcar como lida (AC05, AC22) | `PATCH /api/notifications/{id}` | `{read: true}` | `NotificationResponse` com `read_at` | 200 (idempotente) | 401; 404 |

### Confirmação dos dados exigidos pela spec

- **Variação “vs. preço anterior”, mínimo/máximo, preço anterior**: `ProductResponse.previous_price`,
  `min_price`, `max_price`, `percentage_change` (calculados sobre o histórico completo em
  `tracked_response`). Existem.
- **Preço observado / Última consulta / Última alteração**: `last_price_observed_at`,
  `last_attempt_at`, `price_changed_at`. Existem.
- **Estados**: `availability` ∈ {`available`, `unavailable`, `unknown`}; `lookup_status`
  (`located`/`not_found`); `last_attempt_status` ∈ {`ok`, `missing_price`, `not_found`,
  `rate_limited`, `auth_required`, `access_denied`, `invalid_response`,
  `unsupported_price_context`, `temporary_error`} — todos já têm rótulo em `attemptResult` da
  0013; `stale` booleano. Existem.
- **Selo “Alerta em R$ X”**: alerta ativo = `alert !== null && alert.enabled` (mesma regra de
  `active_alert_count` no backend). Existe.
- **Frase “O alerta deste produto será pausado.”**: mesma condição; o `DELETE` desativa o
  alerta no backend. Existe.
- **Contador de não lidas**: não há contagem no contrato (lacuna 2). Derivado de
  `GET /notifications?unread_only=true&limit=100`: `items.length`; se `items.length > 99` ou
  `next_cursor !== null` → “99+”. `limit=100` é o máximo aceito (`le=100`). As 5 primeiras
  dessa mesma resposta alimentam o painel (já em `created_at` desc), sem segunda requisição.
- **Eventos sem título/imagem** (lacuna 1): título e imagem vêm do item carregado com o mesmo
  `tracked_product_id` (lista de produtos ou oportunidades); senão “Um produto monitorado” +
  “Ver produto” (`GET /tracked-products/{id}`).
- **Nome da pessoa** (lacuna 5): só `email`. **Busca/filtro/ordenação**: inexistentes
  (fora de escopo).
- `recent_updates[].previous_value/current_value` são `str` livres (preço como `str(Decimal)`
  ou disponibilidade); por isso a direção usa comparação decimal na UI e tolera valor
  não numérico (AC20).

### O que muda no cliente `frontend/src/api.ts`

1. `track(url)` passa a devolver `{ tracked, outcome: 'created' | 'resumed' }`, a partir do
   status (201 → `created`, 200 → `resumed`; outro 2xx → `invalid_response`). Novo helper
   `requestWithStatus` reaproveita validação e tradução de erro.
2. Novo `unreadNotifications()` → `GET /notifications?unread_only=true&limit=100`, mesmo
   validador de página de notificações. `notifications(cursor?)` mantém a URL atual.
3. Mensagens locais alinhadas à spec: rede → **“Não foi possível conectar ao BestPrice.
   Tente novamente.”** (`code: network_error`, `status: 0`); erro sem corpo estável (corpo sem
   `error.code` e `error.message` string) → **“Não foi possível concluir a operação. Tente
   novamente.”** (`code: api_error`). Resposta 2xx que não valida mantém
   `invalid_response` / “A API respondeu com dados inválidos.” (comportamento 0013 testado).
4. Validadores endurecidos na fronteira: campos monetários de produto, alerta e notificação
   (`current_price`, `previous_price`, `min_price`, `max_price`, `absolute_change`,
   `percentage_change`, `target_price`, `observed_price`) precisam casar com o formato
   decimal simples `^-?\d+(\.\d+)?$` (o backend serializa `NUMERIC` em notação simples);
   `Notification.tracked_product_id` passa a ser validado. `recent_updates` continua com
   valores livres.
5. Não há merge nem descarte de respostas no `api.ts`: ele permanece um cliente sem estado.
   Merge de páginas (D3) e descarte de respostas antigas do painel (D4) ficam em módulos
   de estado do frontend, testáveis sem rede.

## Arquitetura do frontend

### Estrutura de arquivos

```
frontend/src/
  main.tsx                      (sem mudança)
  App.tsx                       portão de sessão (0011): carregando / indisponível / entrada / área
  api.ts                        cliente tipado (alterações acima)
  lib/
    decimal.ts                  parseDecimal + compareDecimal (sem float) + isDecimal
    format.ts                   formatMoney, formatPercentage, retryHint, formatRelative, formatAbsolute
    focus.ts                    seletor de focáveis, useModalFocus (extraído do detalhe 0013), useDisclosure
  dashboard/
    AccountArea.tsx             orquestra estado e ações da área autenticada
    useDashboard.ts             carga do painel com descarte de respostas antigas + receivedAt
    useNotifications.ts         não lidas (sino) e página da seção Alertas
    trackedList.ts              reducer puro da lista de produtos (load, append, replace, remove, upsert)
    labels.ts                   rótulos de disponibilidade e resultado da consulta (movidos da 0013)
    AppHeader.tsx               marca, navegação com aria-current, sino, menu da conta, erro de saída
    NotificationBell.tsx        botão + painel (até 5 não lidas)
    AccountMenu.tsx             e-mail + Sair
    HeroTrackForm.tsx           hero, formulário, “Localizando produto...”, resultado, “Ver produto”, estado vazio
    SummaryIndicators.tsx       4 indicadores
    OpportunityList.tsx         cards de oportunidade
    TrackedProductsTable.tsx    tabela/lista empilhada, região anunciada, “Carregar mais”
    TrackedProductRow.tsx       linha principal + linha secundária + região da linha
    RowActionsMenu.tsx          menu da linha (disclosure)
    StopTrackingConfirm.tsx     conteúdo da confirmação (usado no diálogo da linha e no detalhe)
    ProductDetailDialog.tsx     detalhe 0013 (histórico, alerta, atualizar) + modo confirmação
    RecentUpdatesTimeline.tsx   linha do tempo
    AlertsSection.tsx           notificações paginadas
    RelativeTime.tsx            <time> com texto relativo fixado e instante completo acessível
    Skeletons.tsx               esqueletos aria-hidden + status “Carregando…”
    Icons.tsx                   SVG inline próprios, aria-hidden
    LiveRegion.tsx              região anunciada persistente (status/alert)
  test/
    fakeApi.ts                  fixtures do contrato, roteador de fetch, promessas adiadas
  styles.css                    tokens em :root + estilos por seção
```

`App.tsx` continua dono da sessão (0011): `me`, entrada, “Tentar novamente” e o retorno à
entrada em 401. Ele passa `user`, `onUnauthenticated(message)` e um `clock` opcional para
`AccountArea`. O componente de apresentação não chama `fetch`; só `AccountArea` e os hooks
usam `api`.

### Estado e fluxo de dados

- **`Received<T> = { data: T; receivedAt: Date }`**: toda resposta que traz instantes é
  guardada com o instante de chegada obtido de `clock()` (padrão `() => new Date()`,
  injetável por prop em `App`). `RelativeTime` formata `formatRelative(iso, receivedAt)`.
  Assim o texto fica fixado quando a resposta chega e não muda sozinho (AC26), sem timers e
  sem contexto global. Cada item da lista de produtos guarda seu próprio `receivedAt`, pois
  uma linha atualizada chega numa resposta diferente das demais.
- **Painel (`useDashboard`)**: guarda `summary`, `opportunities`, `recent_updates` da última
  resposta válida. Um contador de sequência (`useRef`) numera cada carga; resposta com número
  menor que o último disparado é descartada (AC24). Estados: `loading` (esqueletos), `ready`,
  `error` (mensagem + “Tentar novamente” na região).
- **Lista “Seus produtos” (`trackedList` reducer)**: inicializada apenas pela **primeira**
  carga do painel (e por “Tentar novamente” após falha inicial). Cargas seguintes do painel,
  feitas para recalcular indicadores, **não substituem** a lista: só atualizam por `id` os
  itens que já existem (dados mais novos), sem inserir nem remover. Ações alteram a lista por
  `replace` (refresh 200, recarga após 502/503, alerta alterado no detalhe), `remove`
  (parar, 409/404) ou `upsert` no topo (201/200 do cadastro, sem duplicar). “Carregar mais”
  faz `append` sem repetir IDs. Isso cumpre “páginas carregadas permanecem” (AC16, AC18).
- **Notificações (`useNotifications`)**: `unread` (resposta de `unread_only=true&limit=100`,
  com sequência para descartar respostas antigas) alimenta contador e painel; `all` (páginas
  da seção Alertas). Marcar como lida: `PATCH`, substitui o item em `all` pelo retorno (lido)
  e recarrega `unread`. Após criar/editar/ativar alerta e “Atualizar agora”: recarrega
  `unread` e faz merge da 1ª página de `all` (itens novos entram no topo; existentes são
  substituídos; páginas carregadas permanecem).
- **Ocupado por operação, não global**: `submitting` (só o botão do hero), `busyRowIds`
  (somente a linha em “Atualizar agora”), `detailBusy` (ações do detalhe), `loadingMore`
  por lista. Substitui o `busy` único da 0013.
- **Foco e anúncios**: regiões `role="status"` persistentes — global (página), da seção
  “Seus produtos” e de cada linha; erros junto ao campo em `role="alert"`. Títulos de seção e
  do painel do sino com `tabIndex={-1}` para receber foco programático. Um helper
  `focusAfterRemoval(listEmpty)` aplica a convenção de produto removido.
- **401 em qualquer chamada**: `onUnauthenticated` limpa o estado e mostra a entrada.

### Padrões de interação

- **Menus/painéis (linha, sino, conta)**: padrão *disclosure* (`button` com `aria-expanded` e
  `aria-controls`; painel com links/botões nativos logo depois do botão no DOM), **sem**
  `role="menu"` — `menu` implica navegação por setas, que a spec exclui. `useDisclosure`:
  Enter/Espaço abrem pelo comportamento nativo do botão; Tab no último item ou Shift+Tab no
  primeiro fecham deixando o foco seguir; Esc fecha e devolve o foco ao botão; `focusout`
  para fora do conjunto e clique fora fecham. Só um aberto por vez.
- **Diálogos**: `role="dialog"`/`aria-modal` próprios (jsdom não implementa
  `HTMLDialogElement.showModal`), com `useModalFocus` extraído do detalhe da 0013 (foco
  inicial, Tab preso, Esc, retorno de foco). A confirmação da linha usa
  `role="alertdialog"` com foco inicial em “Cancelar”. No detalhe, a confirmação é um
  **modo** do mesmo diálogo (AC19): conteúdo substituído, foco em “Cancelar”; Esc/clique no
  fundo/Cancelar voltam ao conteúdo com foco em “Parar de monitorar”.
- **Navegação**: `<nav aria-label="Principal">` com links `#inicio`, `#seus-produtos`,
  `#alertas`. O clique evita o salto padrão, marca o item com `aria-current="location"`
  (área de página única), rola (`scrollIntoView` quando disponível) e foca o título da
  seção; Produtos foca o campo de link no estado vazio.
- **Linha de produto**: um `<tbody>` por produto com duas `<tr>` (principal e secundária).
  Abaixo de 960 px a tabela é empilhada por CSS mantendo `role` explícito
  (`table/rowgroup/row/cell/columnheader`) para não perder a semântica e cada célula mostra
  o rótulo da coluna. Linha ocupada: `aria-busy="true"`, texto “Atualizando…” e ações
  desabilitadas só nela.
- **Card de oportunidade**: o título é um `button` (nome = título) esticado por CSS sobre o
  card; heading não fica dentro de botão.
- **Rótulos únicos por linha**: “Ver detalhes” e o botão do menu ganham sufixo acessível com
  o título (“Ver detalhes de Fone sem fio”, “Ações de Fone sem fio”); o texto visível está
  contido no nome (WCAG 2.5.3). “Carregar mais” idem (“Carregar mais produtos”, “Carregar
  mais notificações”).
- **`RelativeTime`**: `<time dateTime={iso} tabIndex={0} title={absoluto}>` com o instante
  completo também em texto `sr-only` e exibido em dica visual no `:focus-visible`/`:hover`.
- **Link externo**: “Ver anúncio no Mercado Livre”, `target="_blank"`,
  `rel="noopener noreferrer"`, ícone e texto `sr-only` “(abre em nova aba)”, no menu da linha
  e no detalhe.
- **Hero**: `input type="text" inputMode="url" autoComplete="url" required` (sem validação
  nativa de URL, AC08), descrito pela dica e pelo erro (`aria-describedby`,
  `aria-invalid`). Ilustração SVG abstrata `aria-hidden`.

### Utilitários (puros, testados isoladamente)

- `lib/decimal.ts`: `parseDecimal(s)` aceita só `^-?\d+(\.\d+)?$`, normaliza sinal, zeros à
  esquerda e à direita; `compareDecimal(a, b): -1 | 0 | 1 | null` (null para não numérico)
  compara sinal, comprimento da parte inteira, dígitos e fração preenchida — nenhuma
  conversão para `number`. `"1079.00"` = `"1079.0"`; `"99.90"` < `"100.00"`;
  `"100.10"` > `"100.09"`.
- `lib/format.ts`:
  - `formatMoney(s)` → `Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'})`
    recebendo a **string decimal validada** (Intl.NumberFormat v3 formata strings como decimal
    exato; sem `Number()`), `null` para inválido. Os rótulos de ausência ficam no chamador.
  - `formatPercentage(s)` com `signDisplay: 'exceptZero'` e direção por `compareDecimal(s, '0')`.
  - `retryHint(seconds)` (texto da spec; já existe na 0013, movido).
  - `formatRelative(iso, now, timeZone?)`: regras da spec; dia civil calculado com
    `Intl.DateTimeFormat(..., {timeZone}).formatToParts`; futuro → “Agora”; absoluto
    `dd/mm/aaaa, HH:mm` montado a partir das partes (não depende do separador do ICU).

## Decisões

- **D1 — Decomposição em `dashboard/` + `lib/`, sem roteador nem biblioteca de estado.**
  Página única com âncoras; `useReducer`/hooks bastam. Alternativa descartada: React Router
  (spec exclui rotas próprias) e Redux/Zustand (estado local à área, sem compartilhamento
  entre páginas).
- **D2 — Comparação decimal própria, sem `decimal.js`/`big.js`.** A UI só precisa comparar e
  validar; aritmética monetária continua no backend. ~30 linhas testadas por tabela vs.
  ~30 kB de dependência no bundle. `decimal.js` presente em `node_modules` é transitivo do
  jsdom e não pode ser usado em produção sem virar dependência direta.
- **D3 — Lista de produtos separada do painel após a primeira carga** (merge por `id`, sem
  substituição). Alternativa descartada: recarregar a 1ª página do painel e descartar as
  demais (viola AC16/AC18) ou recarregar todas as páginas (N requisições, cursor pode
  mudar).
- **D4 — Descarte de resposta antiga por número de sequência** em vez de `AbortController`:
  determinístico em teste e cobre também respostas que já chegaram ao parser. Pode ser
  combinado com abort depois, sem mudar comportamento.
- **D5 — Tempo relativo fixado por `receivedAt` + relógio injetável por prop.** Evita
  timers, satisfaz “não se atualiza sozinho” e torna AC26 testável com `clock` fixo e
  `TZ=America/Sao_Paulo` (`test.env` do Vitest) — sem `vi.useFakeTimers` interferindo nas
  promessas do Testing Library.
- **D6 — `@testing-library/user-event` como `devDependency` (única dependência nova).**
  AC03/AC28 exigem Enter/Espaço ativando botão e Tab movendo foco; `fireEvent` não emula
  isso e simular manualmente testaria a própria simulação. Sem impacto no bundle. Os 29
  testes atuais podem continuar com `fireEvent`.
- **D7 — Visual segue a referência PNG e a paleta atual da aplicação**, convertida em custom
  properties em `:root` de `styles.css`. Do design system adotamos apenas convenções
  genéricas citadas em `designsystem/index.html` (anel de foco visível de 4 px, alvos de
  44 px, status com ícone **e** texto, `prefers-reduced-motion`, escala de espaçamento 4/8),
  **sem copiar** tokens ou trechos cuja origem o `designsystem/README.md` diz estar pendente.
  Ícones SVG inline próprios no estilo contorno (traço 1,75), sem `lucide-react`.
- **D8 — Padrão *disclosure* em vez de `role="menu"`** (coerente com “sem setas”).
- **D9 — Inspeção em navegador fora do repositório.** Script Playwright + `@axe-core/playwright`
  (tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) executado do scratchpad com `npx`,
  contra `npm run dev`: (a) API local real via Compose para entrada, painel vazio (AC23,
  AC29), cadastro com integração desligada (503) e sair; (b) `page.route('/api/**')` com
  fixtures do contrato para estados populados, erros e 99+ em 360, 768 e 1280 px (AC12,
  AC27, AC28). Versões, comandos e resultados vão para `verification.md`. Motivo: mesma
  abordagem aceita na 0013, sem baixar navegadores na CI nem acrescentar dependências.
  Alternativa descartada por ora: suíte E2E versionada (ver “Para depois”).
- **D10 — 404 no `DELETE` segue a convenção de produto removido** (o vínculo não existe para
  a pessoa); demais falhas (5xx, rede) mantêm o produto (AC18). Registrado como
  interpretação da spec para revisão.

## Decisões caras de reverter

1. **Separar a lista “Seus produtos” do painel após a primeira carga (D3).** Toda ação passa
   a editar a lista localmente com as respostas da API; voltar a “recarregar tudo” muda AC16
   e AC18 e a forma de todos os testes de ação.
2. **Modelo de tempo `receivedAt` + `clock` injetado (D5).** Atravessa todos os componentes
   que mostram instantes; trocar por timer/contexto exige reescrever AC26 e fixtures.
3. **Contador do sino derivado de `unread_only=true&limit=100` (lacuna 2).** Se a API
   ganhar contagem, o cliente muda numa função, mas o “99+” e o painel de 5 dependem dessa
   resposta única.
4. **Estrutura `dashboard/` + `lib/` e testes por área.** Reorganizar de novo custa a
   migração de testes duas vezes.
5. **Tabela semântica com empilhamento por CSS e `role` explícito.** Trocar por lista de
   cards muda nomes acessíveis e consultas de teste (`getByRole('row'/'cell')`).
6. **Mensagens de rede/erro genérico em `api.ts`.** Textos visíveis em toda a aplicação,
   inclusive na verificação de sessão da 0011.

## Riscos e mitigação

- **Regressão da 0013.** Os 29 testes de `App.test.tsx` cobrem detalhe, foco do diálogo,
  histórico paginado, alertas, 401, 503 e métricas. Textos que a 0012 muda (“Você ainda não
  monitora anúncios.”, “Produtos monitorados” como título, “Carregar mais notificações”,
  “Não foi possível conectar à API.”, “Nenhuma queda recente…”, “Alvos atingidos”, parar sem
  confirmação, título da seção ao remover) são **migrados conscientemente** na tarefa T03:
  cada teste alterado fica listado em `verification.md` com o motivo (AC da 0012 que o
  substitui). Nenhum teste é apagado sem que o comportamento correspondente da 0013 continue
  coberto. A contagem final deve ser ≥ 29 + novos.
- **Rotas exatas nos mocks.** O `signedIn` atual lança erro para URL inesperada; a nova
  chamada `?unread_only=true&limit=100` quebraria todos os testes. Mitigação: `test/fakeApi.ts`
  com rota padrão para não lidas vazia, criado antes de qualquer mudança no `App`.
- **`Intl.NumberFormat` com string.** Suportado em Node 22 e navegadores atuais (Chrome 106+,
  Firefox 116+, Safari 15.4+). Tipos: `tsconfig` passa a incluir `ES2023` (ou
  `ES2023.Intl`) para aceitar `StringNumericLiteral`; conferir no build (T04). Fallback, se o
  build recusar: formatar a string manualmente (separadores pt-BR) — sem `Number`.
- **Endurecer validadores monetários** pode transformar em “dados inválidos” uma resposta
  hoje aceita. O backend usa `NUMERIC` com escala e `quantize`, que serializam em notação
  simples; teste de contrato com valores reais de fixture e inspeção contra a API local
  confirmam.
- **Foco em jsdom.** `scrollIntoView` não existe no jsdom (chamada protegida); foco e
  `aria-current` são testados; rolagem real fica para a inspeção no navegador.
- **Paradas de Tab extras** por `<time tabIndex=0>` (exigência “acessível ao foco”).
  Verificar na inspeção se a navegação continua razoável; alternativa a decidir com a
  usuária se não for.
- **Largura de 768 px.** Sete colunas não cabem com folga; o empilhamento abaixo de 960 px
  evita rolagem horizontal (AC27), verificado no navegador.
- **Tempo de fixtures em fuso.** `TZ` no `test.env` do Vitest; `formatRelative` recebe
  `timeZone` explícito nos testes unitários para não depender do ambiente.
- **Sem dados reais da integração.** O Mercado Livre continua desligado localmente; estados
  populados no navegador vêm de fixtures interceptadas (limite registrado em
  `verification.md`).

## Para depois (fora desta entrega)

- Suíte E2E versionada (Playwright + axe) na CI, com navegador em cache — exige decisão de
  custo de CI.
- Contagem de não lidas, título/imagem em `recent_updates`, busca/filtro/ordenação, deltas
  de indicadores e nome de exibição: lacunas de contrato da spec, cada uma com spec própria.
- Atualização periódica (sino, painel, tempos relativos).
- Gráfico de histórico no detalhe.
- Revisão dos tokens de `designsystem/index.html` após esclarecer autoria.

## Estratégia de testes

Vitest + Testing Library + `user-event` (D6), `fetch` simulado por `test/fakeApi.ts` com
fixtures no formato exato do contrato (strings decimais, ISO `Z`), promessas adiadas para
ordem de chegada e `clock` fixo. Cada comportamento novo segue Red → Green → Refactor
(skill `tdd`), com Red registrado pelo motivo esperado.

| Arquivo de teste | Escopo |
|---|---|
| `src/lib/decimal.test.ts` | tabela de `compareDecimal`/`parseDecimal` (AC20) |
| `src/lib/format.test.ts` | tabela AC26 com `timeZone: 'America/Sao_Paulo'`; `retryHint` 0/1/30/59/60/90; dinheiro e percentual com sinal; ausentes (AC13) |
| `src/api.test.ts` | 201/200 de `track`, URL de não lidas, mensagens de rede e corpo instável, validação decimal |
| `src/dashboard/trackedList.test.ts` | append sem duplicar, replace, remove, upsert, merge do painel sem perder páginas |
| `src/dashboard/header.test.tsx` | AC01, AC02, AC03 (menu da conta) |
| `src/dashboard/bell.test.tsx` | AC03 (sino), AC04, AC05 |
| `src/dashboard/hero.test.tsx` | AC06, AC07, AC08 |
| `src/dashboard/overview.test.tsx` | AC09, AC10, AC11 |
| `src/dashboard/products.test.tsx` | AC03 (linha), AC12–AC17 |
| `src/dashboard/stop-tracking.test.tsx` | AC18, AC19 |
| `src/dashboard/timeline.test.tsx` | AC20, AC21 |
| `src/dashboard/alerts.test.tsx` | AC22 |
| `src/dashboard/states.test.tsx` | AC23, AC24, AC25, AC26 (integração com relógio) |
| `src/dashboard/content.test.ts(x)` | AC29: varredura de `src/**` (exceto testes e `test/`) por “Amazon”, “prime”, “amazon.com”, estrela/avaliação; render com lista vazia sem produto |
| `src/App.test.tsx` | regressões da 0013, migradas |

Inspeção no navegador (D9): AC12 (360/1280), AC27 (360/768/1280, `scrollWidth <=
clientWidth` e ordem do DOM/visual em 360), AC28 (percurso só por teclado com foco visível +
axe WCAG 2.1 AA em 360 e 1280 nos estados vazio, populado, menu aberto, sino aberto,
diálogos e erros), AC29 (DOM e bundle `dist/` sem termos proibidos; API real com lista
vazia).

## Mapa AC → tarefa → teste

| AC | Tarefas | Evidência |
|---|---|---|
| AC01 | T08 | `header.test.tsx` (seções, sair 204, sair 500/rede) |
| AC02 | T08 | `header.test.tsx` (`aria-current`) |
| AC03 | T07, T08, T09, T14 | `header.test.tsx`, `bell.test.tsx`, `products.test.tsx` (user-event) + navegador |
| AC04 | T09, T15, T17 | `bell.test.tsx` (3, 0, 99+, 3→1 após marcar; recálculo após alerta e atualizar) |
| AC05 | T09, T19 | `bell.test.tsx` (7→5, vazio, falha, foco, reflexo na seção) |
| AC06 | T10 | `hero.test.tsx` |
| AC07 | T02, T10 | `api.test.ts`, `hero.test.tsx` (201/200, só botão desabilitado) |
| AC08 | T02, T10 | `hero.test.tsx` (400 sem https, 404/409/429/502/503, rede, corpo instável) |
| AC09 | T11 | `overview.test.tsx` |
| AC10 | T11 | `overview.test.tsx` |
| AC11 | T11 | `overview.test.tsx` |
| AC12 | T13, T21, T22 | `products.test.tsx` + navegador 360/1280 |
| AC13 | T05, T13 | `format.test.ts`, `products.test.tsx` |
| AC14 | T13 | `products.test.tsx` |
| AC15 | T14, T17 | `products.test.tsx`, `stop-tracking.test.tsx`/`App.test.tsx` (detalhe) |
| AC16 | T06, T15 | `products.test.tsx` (busy só na linha, 200 ok/not_found, 429, 502/503 + recarga, 409/404, página 2) |
| AC17 | T06, T13 | `products.test.tsx`, `trackedList.test.ts` |
| AC18 | T16 | `stop-tracking.test.tsx` |
| AC19 | T17 | `stop-tracking.test.tsx` |
| AC20 | T04, T18 | `decimal.test.ts`, `timeline.test.tsx` |
| AC21 | T18 | `timeline.test.tsx` |
| AC22 | T19 | `alerts.test.tsx` |
| AC23 | T20 | `states.test.tsx` + navegador (API real vazia) |
| AC24 | T06, T12, T20 | `states.test.tsx` (esqueleto; respostas fora de ordem) |
| AC25 | T20 | `states.test.tsx` |
| AC26 | T05, T20 | `format.test.ts` (tabela), `states.test.tsx` (relógio avança sem mudar) |
| AC27 | T21, T22 | navegador 360/768/1280 |
| AC28 | T21, T22 | testes de teclado + navegador (axe) |
| AC29 | T21, T22 | `content.test.ts`, navegador/bundle |
