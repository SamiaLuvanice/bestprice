# Verificação — 0012

## 2026-10-11 — Revisão documental (sem implementação)

**O que mudou:** `spec.md` foi reescrita como spec somente de interface (`toca: [frontend]`,
`depende_de: [0011, 0013]`, `status: rascunho`) para o painel do usuário sobre o Mercado
Livre Brasil, usando apenas o contrato mínimo da spec 0013 e a referência
`designsystem/area-usuario-monitoramento.png`. Critérios de domínio e backend da versão
anterior (deduplicação, concorrência, consultas periódicas, falhas, `not_found`,
isolamento) foram removidos por já pertencerem à 0013. Elementos visuais sem dado no
contrato (busca/filtro/ordenação, deltas dos indicadores, “Ver todos/todas”, card e
gráfico do hero, nome do usuário) ficaram fora de escopo e as lacunas foram registradas.
`plan.md`, `tasks.md` e `source-evaluation.md` foram apagados.

**Por quê:** a spec 0013 substituiu a premissa Amazon e implementou o domínio (PR #35).
A implementação Amazon não commitada da 0012 foi descartada; o plano, as tarefas, a
avaliação de fonte e o registro de verificação anteriores (de 2026-10-07/08) eram da
premissa Amazon e ficaram obsoletos. Há backup deles fora desta branch.

**O que não houve:** nenhuma alteração de código, teste, build ou execução de gates.
Nenhum critério de aceite foi demonstrado. A implementação só começa após o PR #35 estar
integrado em `develop`, seguida de `/plan`.

## 2026-10-11 — Rodada de revisão da spec (spec-reviewer) — sem implementação

O `spec-reviewer` pediu ajustes; o coordenador decidiu os 18 pontos abaixo e eles foram
aplicados em `spec.md`. Critérios renumerados de AC01–AC23 para AC01–AC29.

- Sem regressão do AC-007 da 0013: cada produto mantém preço anterior, mínimo, máximo,
  variação, última consulta e última alteração (colunas/linha secundária em 1280,
  empilhado em 360) e o selo “Alerta em R$ X” quando houver alerta ativo (AC12).
- “Atualizar agora” e “Parar de monitorar” no menu da linha e no detalhe; estado ocupado
  só na linha; resultado em região anunciada junto da linha; casos 200 (inclusive
  `not_found`), 429 `refresh_not_due`, 409 `tracking_inactive`, 502/503 e recarga após
  falha (novo AC16). Parar pelo detalhe substitui o conteúdo do diálogo; foco definido em
  cada saída (AC18, AC19).
- Texto de confirmação condicional ao alerta ativo (AC18).
- Sino: estado “Notificações indisponíveis”, recálculo pela API após marcar lida, alerta e
  atualizar; sem atualização periódica (declarado fora de escopo); painel com até 5 não
  lidas e “Ver todas as notificações” (AC04, AC05).
- Estado vazio: Produtos leva ao campo de link; Alertas visível se houver notificações (AC23).
- Formato do prazo igual ao `retryHint` atual, com exemplos (AC08, AC16).
- Rótulos “Variação vs. preço anterior” (com data da alteração) e “Preço observado”;
  “Nenhuma oportunidade de queda nas últimas 24 horas.” (AC11).
- Direção queda/alta por comparação decimal exata, como requisito (AC20).
- Notificações exibem `created_at` (AC22).
- Regra de tempo relativo com tabela de exemplos e relógio controlado (AC26).
- `aria-current` no item de navegação ativo (AC02); padrão de teclado para menus e
  painéis (AC03).
- Textos exatos “Desconhecido” (preços) e “Desconhecida” (variação/datas) (AC13).
- Campo sem validação nativa de URL; AC08 demonstra 400 com entrada sem `https://`.
- Mensagem genérica para erro sem corpo estável; falha ao sair mantém a sessão local (AC01, AC08).
- “axe” substituído por “inspeção automatizada de acessibilidade (WCAG 2.1 AA)” (AC28).
- Rótulo único “Ver anúncio no Mercado Livre” no menu e no detalhe (AC15).

Nenhum código, teste ou gate foi executado; nenhum critério demonstrado. Status segue
`rascunho`, aguardando o PR #35 em `develop`.

## 2026-10-11 — Re-revisão da spec (spec-reviewer) — sem implementação

Os 18 achados da rodada anterior foram dados como resolvidos. Ajustes menores decididos
pelo coordenador e aplicados em `spec.md` (numeração AC01–AC29 mantida):

- N1 — Produto removido (parar, 409/404): mensagem em região anunciada de “Seus produtos”
  e foco no título; lista vazia → foco no campo de link e anúncio global (AC16, AC18, AC19).
- N2 — Teclado de menus: Tab/Shift+Tab percorrem, saem nas extremidades e fecham; sem
  setas (convenção e AC03).
- N3 — Recalcular indicadores sem descartar páginas carregadas; cenário com página 2
  (AC16, AC18).
- N4 — Após marcar lida, foco no próximo item ou no título; sino e seção Alertas
  consistentes (AC05, AC22).
- N5 — Seção Alertas sempre exibida, com “Nenhuma notificação por enquanto.” (AC22, AC23).
- N6 — “Última consulta” e “Última alteração” em tempo relativo; coluna Variação sem data,
  com “vs. preço anterior” (AC12).
- C1 — Texto relativo fixado na chegada da resposta da API (convenção e AC26).
- C2 — Clique fora na confirmação do detalhe cancela a confirmação, sem fechar o detalhe (AC19).
- C3 — `price_changed` com valores iguais ou não numéricos: “teve o preço alterado.” sem
  valores nem seta, nunca formatado como R$ (AC20).
- C4 — Prevalece a resposta mais recente do painel (convenção e AC24).
- C5 — AC28: inspeção automatizada WCAG 2.1 AA sem violações; ferramenta definida no plano.
- C6 — Convenções valem para as superfícies novas; o detalhe herdado da 0013 mantém seus
  textos atuais (convenção “Abrangência”).

Nenhum código, teste ou gate foi executado; nenhum critério demonstrado. Status segue
`rascunho`, aguardando o PR #35 em `develop`.

## 2026-10-11 — `/plan 0012` (sem implementação)

Criados `plan.md` e `tasks.md` (T01–T27) na worktree com `develop` atualizado e a 0013
integrada (PR #35). Contrato conferido no código de `backend/app/products/` e
`backend/app/auth/routes.py`: todos os dados usados pela spec existem; nenhum endpoint muda.
Decisões principais: lista “Seus produtos” separada do painel após a primeira carga (merge por
ID), descarte de respostas antigas por sequência, tempo relativo fixado por `receivedAt` com
relógio injetável, comparação decimal própria (sem dependência), contador do sino por
`unread_only=true&limit=100`, `@testing-library/user-event` como única dependência nova (dev),
inspeção Playwright + axe fora do repositório. Os 29 testes atuais da 0013 serão migrados
conscientemente (T03), com cada alteração listada aqui.

Nenhum código, teste ou gate foi executado nesta etapa; nenhum critério demonstrado. Status
da spec segue `rascunho` até a aprovação do plano.

## 2026-10-11 — Implementação — fase 1 (T01–T12)

Papel `frontend`, worktree `.worktrees/feature-0012-issue-33-area-usuario-monitoramento`, branch
`feature/0012-issue-33-area-usuario-monitoramento`. Comandos em `frontend/`, Node 22.18.0,
npm 10.9.3. Vitest rodou no sandbox sem `spawn EPERM`. Nenhum arquivo de `backend/` alterado
(`git diff --stat origin/develop -- backend/` vazio). Commits locais, sem push.

### T01 — Linha de base (antes de qualquer mudança)

| Comando | Resultado |
|---|---|
| `npm ci` | 256 pacotes, 0 vulnerabilidades (aviso de depreciação do eslint 9.39.5) |
| `npm run lint` | sem erros nem avisos |
| `npm test -- --run` | 1 arquivo, **29 passed (29)** |
| `npm run build` | concluído; `index-Qf118TkP.css` 7,00 kB, `index-Buyu6JTz.js` 243,45 kB (gzip 74,97 kB) |

Contrato conferido de novo em `backend/app/products/routes.py`, `schemas.py` e
`auth/routes.py`: `POST /tracked-products` devolve 201/200 (`response.status_code = 201 if
created else 200`), `/notifications` aceita `unread_only` e `limit` (`le=100`), campos
monetários são `Decimal`, notificação traz `tracked_product_id`. Nenhuma divergência da tabela
do plano.

### Red → Green por tarefa

Red observado com módulo/componente ainda sem o comportamento (stubs que compilam, para o Red
não ser falha de importação). Mensagens reais da saída do Vitest.

| Tarefa | Arquivo | Red observado | Green |
|---|---|---|---|
| T02 | `src/api.test.ts` | 12 failed / 2 passed (14): `expected undefined to be 'created'`; `Expected: "Não foi possível conectar ao BestPrice. Tente novamente." Received: "Não foi possível conectar à API."`; `Received: "Não foi possível concluir a operação."`; validação decimal `Error: A chamada deveria ter falhado.`; `TypeError: api.unreadNotifications is not a function` | 14 passed |
| T04 | `src/lib/decimal.test.ts` | stub → 13 failed / 7 passed (20); os 7 que passaram são casos `null` para entrada inválida, que o stub já devolvia | 20 passed |
| T05 | `src/lib/format.test.ts` | stub → 24 failed / 3 passed (27); passaram só os casos de `null` (instante inválido, dinheiro e percentual ausentes) | 27 passed |
| T06 | `src/dashboard/trackedList.test.ts` | 6 failed / 1 passed (7): `expected false to be true`, `expected [] to deeply equal [ 'a', 'b', 'c' ]` (o que passou é “ignora substituição de item não carregado”) | 7 passed |
| T06 | `src/dashboard/useDashboard.test.ts` | 5 failed (5): `Error: estado inesperado: loading`, `expected 'loading' to be 'ready'`, `expected "vi.fn()" to be called 1 times, but got 0 times` | 5 passed |
| T06 (refactor da área) | `trackedList.test.ts`, ação `dashboard` | 1 failed: `expected [] to deeply equal [ 'a' ]` | 8 passed |
| T07 | `src/lib/focus.test.tsx` | 1ª execução: 5 failed / 3 passed — os 3 passavam sem abrir o menu; testes reforçados com asserção de abertura; 2ª: **8 failed (8)** (`aria-expanded` esperado `true`, `Unable to find ... "Primeiro"`) | 8 passed; 29 testes da 0013 (inclusive foco do diálogo) verdes após extrair `useModalFocus` |
| T08 | `src/dashboard/header.test.tsx` | 6 failed: `Unable to find role="heading" and name "Seus produtos"`; após renomear as seções: `Unable to find ... role "navigation" and name "Principal"` e `... role "button" and name /pessoa@example\.com/` | 6 passed |
| T09 | `src/dashboard/bell.test.tsx` | 10 failed: `Unable to find role="button" and name /^Notificações/`; `Unable to find an element with the text: Não lida` | 10 passed |
| T10 | `src/dashboard/hero.test.tsx` | 5 failed / 8 passed (13): `Unable to find ... text: Compre na hora certa.`, `... Localizando produto...`, `... Produto adicionado ao monitoramento.`, `... Você voltou a monitorar este produto.`, `expect(element).not.toHaveAttribute("type", "url")`. Os 8 que passaram cobrem mensagens de erro já entregues pela 0013 (404/409/502/503, 429, rede, corpo instável, Ver produto) e ficam como regressão | 13 passed |
| T11 | `src/dashboard/overview.test.tsx` | 4 failed: `Unable to find ... role "region" and name "Resumo do monitoramento"`, `... text: Produtos monitorados que tiveram redução de preço recentemente.`, `... role "button" and name "Cafeteira elétrica"`, `... text: Nenhuma oportunidade de queda nas últimas 24 horas.` | 4 passed (o teste passou a esperar o fim do “Carregando seu painel…” antes de consultar os dados) |
| T12 | `src/dashboard/states.test.tsx` | 1ª execução falhou por asserção errada do próprio teste (`Found multiple elements with the role "status"`), corrigida; Red válido: `expect(element).toHaveAttribute("aria-busy", "true")` | 1 passed |

T03 não tem Red (infra de teste): após a troca de helper, os 29 testes rodaram e passaram
contra o `api.ts` original (`29 passed (29)`), antes de qualquer mudança de UI.

### Testes da 0013 migrados (T03 e tarefas seguintes)

Troca de helper sem mudar asserção: todos os 29 testes usam `src/test/fakeApi.ts`
(`signedIn = fakeApi`). Quatro testes que montavam roteador próprio com `vi.stubGlobal`
passaram ao dublê com fixtures equivalentes: “mostra anúncio persistido, detalhe e histórico
recebidos da API”, “carrega páginas adicionais de histórico e notificações sem repetir
entradas”, “distingue tentativa falha, leitura válida, preço observado e mudança no detalhe” e
“leva o foco ao título da lista quando o card que abriu o detalhe deixa de existir”.

Asserções alteradas (comportamento mudado pela 0012):

| Teste da 0013 | Antes → depois | Justificativa |
|---|---|---|
| mostra erro com nova tentativa quando a sessão não pode ser verificada por falha de rede | “Não foi possível conectar à API.” → “Não foi possível conectar ao BestPrice. Tente novamente.” | Convenção de erros / AC08 |
| mostra mensagem de rede quando o cadastro não alcança a API | idem | AC08 |
| mostra erro na área de notificações quando elas não carregam | região “Notificações” → “Alertas” | Seção Alertas / AC01 |
| recarrega o vínculo e mostra o erro quando a atualização falha na fonte | região “Produtos monitorados” → “Seus produtos” | Seção “Seus produtos” / AC01 |
| leva o foco ao título da lista quando o card que abriu o detalhe deixa de existir | título “Produtos monitorados” → “Seus produtos” | idem |

Nenhum teste da 0013 foi apagado; os 29 continuam executando. Textos da 0013 ainda presentes
e que a fase 2 migrará: “Você ainda não monitora anúncios.” (AC23), card com “Último preço
conhecido · preço desatualizado” e métricas em `dl` (AC12–AC14), “As mudanças confirmadas
aparecerão aqui.” e “Disponibilidade alterada” (AC20/AC21), “Sem notificações por enquanto.” e
“Aviso … chegou” (AC22), parar sem confirmação no detalhe (AC19).

### Gates ao fim da fase 1

| Comando | Resultado |
|---|---|
| `npm run lint` | sem erros nem avisos |
| `npm test -- --run` | **12 arquivos, 145 passed (145)**, nenhum skip |
| `npm run build` | concluído; `index-CVlEkXLe.css` 17,40 kB (gzip 4,33 kB), `index-CeVvIcIA.js` 265,38 kB (gzip 81,07 kB); +21,9 kB de JS bruto em relação à linha de base |

Contagem por arquivo: `App.test.tsx` 29, `api.test.ts` 14, `lib/decimal.test.ts` 20,
`lib/format.test.ts` 27, `lib/focus.test.tsx` 8, `dashboard/trackedList.test.ts` 8,
`dashboard/useDashboard.test.ts` 5, `dashboard/header.test.tsx` 6, `dashboard/bell.test.tsx` 10,
`dashboard/hero.test.tsx` 13, `dashboard/overview.test.tsx` 4, `dashboard/states.test.tsx` 1.

Leitura do diff: `Number(` só aparece em `lib/format.ts` para o número do dia civil (datas, não
dinheiro); `formatMoney`/`formatPercentage` recebem a string decimal validada; nenhum
`parseFloat`. `@testing-library/user-event` é a única dependência nova (dev).

### Desvios do plano registrados

- T03 foi commitada antes de T02, porque `api.test.ts` usa as fixtures de `src/test/fakeApi.ts`.
- A extração de `AccountArea` (estrutura de T12) foi feita como refactor antes de T08, com os 29
  testes da 0013 verdes; nesse passo entrou a ação `dashboard` do reducer (primeira carga
  inicializa, as seguintes só atualizam), com Red/Green próprio.
- O teste das cargas fora de ordem ficou em `useDashboard.test.ts` (o plano citava
  `trackedList.test.ts`).
- `useModalFocus` cobre o foco preso, Esc e foco que escapa; o retorno do foco ao elemento que
  abriu o detalhe continua na `AccountArea`.
- `useDisclosure`: quando o `focusout` não tem destino (`relatedTarget` nulo — item removido
  após uma ação, janela sem foco), a decisão de fechar espera o foco assentar; clique fora é
  tratado por `mousedown` no document.
- `RelativeTime` é parada de Tab (`tabIndex=0`, risco já previsto no plano): no painel do sino a
  primeira parada é o instante da notificação e depois “Marcar como lida”. Avaliar no navegador
  (T22).
- A entrada (0011) reutiliza o mesmo hero; a mensagem de 401/erro de login passou do hero para o
  painel de entrada, e a tentativa de monitorar sem sessão aparece junto ao campo.
- Falha de “Marcar como lida” aparece no próprio painel (a spec não define); falha de recarga do
  painel depois da primeira carga mantém os dados sem mensagem — revisar em T20 (AC25).
- `price` do histórico não ganhou validação decimal (fora da lista do plano).

### Observações e pendências

- Instabilidade observada uma vez: “fecha o diálogo com Esc e devolve o foco a Ver detalhes”
  falhou numa execução completa (1197 ms) logo após T08 e passou em 3 execuções isoladas do
  arquivo e 3 execuções completas seguidas. Não reproduzida depois; investigar se voltar.
- A varredura do AC29 (T21) precisa usar limite de palavra para “prime”: `grep -i prime` casa
  com “primeiro/primeira” em textos legítimos.
- Fase 2: T13–T27 (tabela “Seus produtos”, menu da linha, Atualizar agora pela linha, parar com
  confirmação, detalhe, linha do tempo, seção Alertas, estados gerais, responsividade,
  inspeção em navegador, revisão, documentação e PR). O recálculo do contador após
  criar/editar/ativar alerta e “Atualizar agora” já está ligado no código, mas os testes do
  AC04 para esses gatilhos ficam em T15/T17.
- Nenhum critério de aceite foi dado como demonstrado de ponta a ponta nesta fase; não houve
  inspeção em navegador.

## 2026-10-11 — Implementação — fase 2 (T13–T21)

Mesmo papel, worktree e branch da fase 1; commits locais, sem push. Nenhum arquivo de
`backend/` alterado (`git diff --stat origin/develop -- backend/` vazio). Vitest rodou no
sandbox. O card de produto, a linha do tempo e a seção Alertas antigos foram removidos.

### Red → Green por tarefa

| Tarefa | Arquivo | Red observado | Green |
|---|---|---|---|
| T13 | `dashboard/products.test.tsx` (tabela) | 8 failed (8): `Unable to find ... text: Todos os produtos que você está monitorando.`, `... role "rowgroup" and name "Fone sem fio"` (6), `... role "button" and name "Carregar mais produtos"`. Na 1ª implementação, 2 falhas restantes: erro do próprio teste (instante de 1 min esperado como “Agora”, corrigido para 30 s) e nome acessível `"Carregar maisprodutos"` (o espaço dentro do `sr-only` era descartado; corrigido com `{' '}` fora do span, também em “Ver detalhes de …”) | 8 passed |
| T20 antecipado (AC23) | `dashboard/states.test.tsx` (estado vazio) | 1 failed: `Unable to find an element with the text: Você ainda não está acompanhando nenhum produto.` | passou; implementado junto de T13 porque a tabela deixou de mostrar o texto de vazio antigo |
| T14 | `dashboard/products.test.tsx` (ações) | 3 failed: `Unable to find ... role "link" and name "Ver anúncio no Mercado Livre (abre em nova aba)"`, `... role "button" and name "Ações de Fone sem fio"` (2) | 3 passed |
| T15 | `dashboard/refresh-row.test.tsx` | 11 failed (11): `toHaveAttribute("aria-busy", "true")`, `toHaveTextContent()`, `Unable to find ... text: Última tentativa: Falha temporária na consulta`, `not.toBeInTheDocument()`, `toHaveFocus()`, `Unable to find role="button" and name "Entrar"`. Depois da implementação, 4 falhas eram do dublê (o painel recarregado devolvia o produto antigo e o merge desfazia a linha); o teste passou a usar um servidor com estado, como a API real | 11 passed |
| T16 | `dashboard/stop-tracking.test.tsx` | 9 failed: `Unable to find ... role "alertdialog" and name "Parar de monitorar “Fone sem fio”?"` (8) e `... "Carregar mais produtos"` (fixture sem cursor, corrigida) | 9 passed |
| T17 | `dashboard/detail.test.tsx` | 6 failed / 5 passed (11): `Unable to find ... role "dialog"`, `... data-testid="detail-backdrop"`. Os 5 que passaram: falha ao parar (o fluxo antigo já mostrava o erro no detalhe) e os 4 testes do AC04 (recálculo do sino após criar, editar, pausar alerta e Atualizar agora no detalhe), já ligado na fase 1 — sem Red, ficam como evidência | 11 passed |
| T18 | `dashboard/timeline.test.tsx` | 3 failed: `TypeError: Cannot read properties of null (reading 'textContent')` (sem `<p>` por evento) e `Unable to find ... text: As mudanças confirmadas de preço e disponibilidade aparecerão aqui.` | 3 passed |
| T19 | `dashboard/alerts.test.tsx` | 7 failed (7): `Unable to find ... text: Fone sem fio`, `... role="button" and name "Marcar como lida: Cafeteira elétrica"`, `... text: Nenhuma notificação por enquanto.`, `... role "button" and name "Tentar novamente"` | 7 passed |
| T20 | `dashboard/useDashboard.test.ts` | 1 failed: `expected undefined to be 'Serviço temporariamente indisponível.'` (sem `refreshError`) | 6 passed |
| T20 | `dashboard/states.test.tsx` (integração) | 1 failed / 12 passed: `Unable to find role="alert"` na falha de recarga após a primeira carga. Os 12 que passaram (respostas fora de ordem, falha 500/rede do painel e das notificações por região, 401 em painel/notificações/não lidas, tabela do AC26 e “Ontem, HH:mm”) cobrem comportamento construído em T06, T09, T12 e T19 (Reds registrados lá) e ficam como evidência de integração | 13 passed |
| T21 | `content.test.tsx` | Guarda sobre código existente, sem Red natural; validada injetando `// Amazon` em `dashboard/labels.ts`: `expected [ 'dashboard\labels.ts: Amazon' ] to deeply equal []`; arquivo restaurado com `git checkout` | 3 passed |

### Testes da 0013 migrados nesta fase (`src/App.test.tsx`, continua com 29)

| Teste | Antes → depois | AC |
|---|---|---|
| vários (bloqueio da integração, rede na sessão, 401, 429, rede no cadastro) | espera por “Você ainda não monitora anúncios.” → “Você ainda não está acompanhando nenhum produto.” | AC23 |
| todos que abrem o detalhe | botão `name: 'Ver detalhes'` → `/^Ver detalhes/` (nome único “Ver detalhes de <título>”) | AC28 (nomes únicos por linha) |
| distingue tentativa falha… | “Último preço conhecido · preço desatualizado” no card → “Preço desatualizado” na linha | AC14 |
| mostra no card do dashboard preço anterior, mínimo, máximo… | card `article`/`dl` → grupo de linhas da tabela: célula Menor preço, Variação, detalhes Preço anterior, Maior preço, Última consulta/alteração | AC12 |
| identifica como desconhecidas no card as métricas ausentes… | idem, com “Desconhecido/Desconhecida” por célula e detalhe | AC13 |
| exibe atualização recente válida de disponibilidade sem moeda | painel sem produtos → com o produto carregado (sem produtos a linha do tempo fica oculta); “Disponibilidade alterada” → “Fone sem fio ficou indisponível.” | AC20, AC23 |
| rejeita atualização recente com valor fora do contrato | ausência de “As mudanças confirmadas aparecerão aqui.” → do novo texto de vazio | AC21 |
| carrega páginas adicionais de histórico e notificações… | “Aviso notice-1 chegou …” → título “Aviso notice-1” na região Alertas | AC22 |
| mostra erro na área de notificações… | ausência de “Sem notificações por enquanto.” → “Nenhuma notificação por enquanto.” | AC22 |
| leva o foco ao título da lista quando o card que abriu o detalhe deixa de existir | 1 → 2 produtos (com 1 a seção some e o foco vai ao campo, AC19) e confirmação dentro do diálogo antes do DELETE | AC19 |

Os testes de foco do diálogo da 0013 (abrir, Esc, fechar, Tab preso, foco no body,
fechar durante Atualizar agora) continuam sem mudança de asserção e verdes com o
`ProductDetailDialog`.

### Instabilidade “fecha o diálogo com Esc e devolve o foco a Ver detalhes”

Causa provável: o `waitFor` do Testing Library espera 1 s por padrão, e a falha da fase 1
ocorreu com 1197 ms durante a suíte completa em paralelo. Na fase 2 houve o mesmo padrão em
outro teste (“mostra Localizando produto…” estourou 5 s com `user.type` caractere a
caractere). Correções: `asyncUtilTimeout` de 3 s em `src/test-setup.ts`, `testTimeout` de
15 s em `vite.config.ts` e `user.paste` no lugar de `user.type` para o link no hero. Depois
disso, 2 execuções completas durante T15 e 3 execuções finais seguidas passaram sem falha.

### Gates ao fim da fase 2

| Comando | Resultado |
|---|---|
| `npm run lint` | sem erros nem avisos |
| `npm test -- --run` (1ª) | 19 arquivos, **213 passed (213)**, 23,63 s |
| `npm test -- --run` (2ª) | 19 arquivos, **213 passed (213)**, 22,65 s |
| `npm test -- --run` (3ª) | 19 arquivos, **213 passed (213)**, 25,65 s |
| `npm run build` | concluído; `index-HRzyVAXH.css` 21,88 kB (gzip 4,98 kB), `index-Cqu394CO.js` 278,60 kB (gzip 84,54 kB) |

Contagem por arquivo: `App.test.tsx` 29, `api.test.ts` 14, `content.test.tsx` 3,
`dashboard/alerts.test.tsx` 7, `bell.test.tsx` 10, `detail.test.tsx` 11, `header.test.tsx` 6,
`hero.test.tsx` 13, `overview.test.tsx` 4, `products.test.tsx` 11, `refresh-row.test.tsx` 11,
`states.test.tsx` 13, `stop-tracking.test.tsx` 9, `timeline.test.tsx` 3, `trackedList.test.ts` 8,
`useDashboard.test.ts` 6, `lib/decimal.test.ts` 20, `lib/focus.test.tsx` 8, `lib/format.test.ts` 27.

`Number(` continua só no número do dia civil em `lib/format.ts`; queda/alta da linha do tempo
usa `compareDecimal`. Commits sem atribuição a ferramentas (`git log --format=%B
origin/develop..HEAD`).

### Desvios do plano registrados

- AC23 (estado vazio) foi implementado junto de T13, antes de T20.
- O teste de “Atualizar agora” pela linha ficou em `refresh-row.test.tsx` e o detalhe em
  `detail.test.tsx` (o plano citava `products.test.tsx` e `stop-tracking.test.tsx`), para
  manter arquivos menores; o apoio comum está em `src/test/productsHarness.tsx`.
- Falha do painel antes da primeira carga mostra a mensagem e “Tentar novamente” na região
  do resumo e oculta oportunidades, produtos e atualizações (não há dados para elas); depois
  da primeira carga, a falha de recarga mantém os dados e mostra a mensagem na mesma região.
- Na seção Alertas, “item seguinte” é o próximo ainda não lido (os lidos continuam na lista);
  sem nenhum, o foco vai ao título.
- `availability_changed` para valor diferente de `available`/`unavailable` mostra “teve a
  disponibilidade alterada.” (a spec só define os dois casos).
- Selo “Último preço conhecido”/“Preço desatualizado” só aparece quando há preço atual.
- Limites de espera dos testes ampliados (3 s / 15 s), descrito acima.
- O layout mantém uma coluna em todas as larguras (ordem do DOM = ordem mobile); a tabela é
  empilhada abaixo de 960 px.

### Pendências para a fase 3

- T22: inspeção em navegador (Playwright + axe) em 360/768/1280 px — sem rolagem horizontal,
  ordem em 360, percurso só por teclado com foco visível e WCAG 2.1 AA; os estilos desta fase
  não foram vistos renderizados. AC12 (em 360 px), AC27 e AC28 dependem dela.
- Avaliar no navegador as paradas de Tab extras dos instantes relativos (`<time tabIndex=0>`).
- T23–T27: gates finais, revisão independente, `docs/PROGRESS.md`, `doc-sync-onboarding` e PR.

## 2026-10-11 — Correções da revisão (arch-reviewer) e da QA em navegador

Mesma worktree e branch; commits locais, sem push; `backend/` sem alteração.

### Achados, Red e correção

| Achado | Teste | Red observado | Correção (commit) |
|---|---|---|---|
| I2 — rota não prevista virava falha de rede silenciosa | `afterEach` global em `src/test-setup.ts` com `takeUnexpectedCalls()` | Suíte inteira continuou verde (nenhum teste usava rota não prevista); guarda validada com teste temporário: `rotas não previstas no dublê da API: expected [ Array(1) ] … "GET /api/tracked-products?cursor=x"`, removido em seguida | `d413475` |
| I1 — 404/409 `tracking_inactive` nas ações do detalhe | `detail.test.tsx` “produto parado em outra aba” (Atualizar agora 409, Criar alerta 409, Pausar 404, Excluir 404) e `trackedList.test.ts` (`replace` com `active=false`) | 5 failed: `expect(element).not.toBeInTheDocument()` (detalhe continuava aberto) e reducer mantinha o item | `failInDetail` fecha o detalhe e aplica `removeTracked`; reducer remove vínculo inativo — `471c3fa` |
| M3 — sinal em zero | `format.test.ts` | `expected '-R$ 0,00' to be 'R$ 0,00'`; `expected { text: '0,00%', direction: 'down' } …` | `2aaeefa` |
| M9 — só https | `lib/url.test.ts`, `dashboard/links.test.tsx` (`javascript:`) | stub de `safeHttpsUrl` → `expected null to be 'https://…'`; link e `<img>` criados com `javascript:` | `2a846f8` |
| M2 — card de oportunidade | `overview.test.tsx` | `expected <span class="drop-badge">…</span> to be null` | `8a69123` |
| M6 — sequência em `reloadAll` | `useNotifications.test.ts` | `expected [ 'antiga' ] to deeply equal [ 'nova' ]` | `63ffc4f` |
| M5 — sequência em `open` | `detail.test.tsx` “aberturas concorrentes” | `Unable to find … role "dialog" and name "Detalhes de Cafeteira elétrica"` | `96e7058` |
| M4 — foco pendente do sino | `bell.test.tsx` | foco foi para um item do painel ao reabrir (`toHaveFocus` no sino falhou) | `45068aa` |
| M8 — linha removida durante a requisição | `refresh-row.test.tsx` | produto retomado herdou `Consulta concluída.` (`Expected /^$/ Received: Consulta concluída.`) | `63d4f56` |
| M7 — lista vazia com cursor | `products.test.tsx` | `Unable to find role="rowgroup" and name "Cafeteira elétrica"` | decisão: carregar a próxima página automaticamente (falha para e mostra a mensagem com “Carregar mais”) — `98c9f82` |
| M1 — desempenho | sem Red (refatoração sem mudança de comportamento; suíte verde) | — | valor do campo dentro do `HeroTrackForm`; `Intl.DateTimeFormat` em cache por fuso — `a98a429` |
| Instabilidade do Esc no detalhe | `App.test.tsx` existente | Falhou 2 vezes seguidas em suíte completa (3696 ms e 3998 ms) e passou isolado; causa: listener de teclado do diálogo registrado em `useEffect`, depois de o diálogo já estar no DOM | `useModalFocus` e foco inicial em `useLayoutEffect` — `df92ce3` |
| M10 — `<time tabIndex=0>` | `bell.test.tsx` (percurso de teclado) | `expect(element).not.toHaveAttribute("tabindex")` | `5b4165e` |
| QA — `aria-busy` na linha | `refresh-row.test.tsx` | `expect(element).not.toHaveAttribute("aria-busy")` | `data-busy` no grupo + região `aria-live="polite"` da linha — `5b4165e` |
| QA — status de carregamento dentro de `aria-busy` | `states.test.tsx` | `expected <section …> to be null` | status movido para fora das regiões ocupadas — `5b4165e` |
| QA — “Anúncio não localizado” repetido | `products.test.tsx` | `expected [ …(2) ] to have a length of 1 but got 2` | `5b4165e` |
| Q1, Q2, Q3 e ajustes visuais | CSS, sem teste automatizado (jsdom não aplica estilos); `getByRole('link', { name: 'Produtos' })` já coberto em `header.test.tsx` | — | `b6edcc2`: rótulos da navegação em `sr-only` (em vez de `display:none`); itens lidos sem `opacity` (texto `#5f6b82` sobre branco ≈ 5,6:1); painel do sino `position: fixed` com 16 px de margem abaixo de 768 px e painéis da conta/linha com `min(280px, 100vw − 32px)`; “Ver detalhes” e ⋮ lado a lado na pilha; `scroll-margin-top` em h1 e títulos focáveis; remoção da dica visual duplicada do instante |

Observação: uma execução em laço durante a investigação ficou ~50 minutos parada (durações de
137 000 ms a 2 994 791 ms e 12 falhas por timeout em cascata); foi travamento da máquina, não do
código, e não é usada como evidência.

### Gates

| Comando | Resultado |
|---|---|
| `npm run lint` | sem erros nem avisos |
| `npm test -- --run` (1ª) | 22 arquivos, **231 passed (231)**, 28,09 s |
| `npm test -- --run` (2ª) | 22 arquivos, **231 passed (231)**, 29,71 s |
| `npm run build` | concluído; `index-DpxtzwN2.css` 22,04 kB (gzip 5,03 kB), `index-D4FLj_3_.js` 279,62 kB (gzip 84,88 kB) |

### Pendências

- Reinspeção em navegador (QA) de Q1–Q3, das ações lado a lado a 360 px, do `scroll-margin-top`
  e do percurso de Tab sem os instantes; a geometria dos painéis em 320/360 px não foi medida aqui.
- Coluna lateral de “Atualizações recentes” em 1280 px: fora do escopo (sem AC).
