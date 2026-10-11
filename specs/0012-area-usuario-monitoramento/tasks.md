# Tarefas — 0012

Plano: [plan.md](plan.md). Ordem obrigatória: contrato/cliente → utilitários → estado →
componentes (TDD por AC) → integração → navegador → gates → revisão → documentação.
Comportamento novo segue Red → Green → Refactor; registre o Red (motivo esperado) e o Green
em `verification.md`. Comandos rodam em
`.worktrees/feature-0012-issue-33-area-usuario-monitoramento/frontend`. Nenhum endpoint ou
arquivo de `backend/` é alterado. Marque `[x]` só com evidência registrada.

## Preparação e contrato

- [x] **T01 — Linha de base e contrato confirmado.** Rodar `npm ci`, `npm run lint`,
  `npm test -- --run` (esperado: 29 passed) e `npm run build` antes de qualquer mudança;
  registrar em `verification.md`. Conferir de novo a tabela de contrato do plano contra
  `backend/app/products/routes.py` e `schemas.py`. *Pronto quando:* linha de base registrada
  e nenhuma divergência de contrato. — AC: todos (pré-condição).
- [x] **T02 — Cliente `api.ts` (Red/Green em `src/api.test.ts`).** `track` devolve
  `outcome` por 201/200; `unreadNotifications()` chama
  `/api/notifications?unread_only=true&limit=100`; mensagens de rede e de corpo instável da
  spec; validação decimal dos campos monetários e de `Notification.tracked_product_id`;
  `invalid_response` preservado. *Pronto quando:* testes de 201, 200, outro 2xx, rede, corpo
  sem `error`, decimal inválido e URL de não lidas passam. — AC07, AC08, AC04.
- [x] **T03 — Infra de teste e migração consciente da 0013.** Criar `src/test/fakeApi.ts`
  (fixtures do contrato, roteador com padrão para `me`, `dashboard`, `notifications` e não
  lidas vazias; promessas adiadas). Adicionar `@testing-library/user-event` como
  `devDependency` (D6) e `test.env.TZ = 'America/Sao_Paulo'` no Vitest. Passar `App.test.tsx`
  a usar o helper. Para cada teste da 0013 cujo texto/fluxo a 0012 muda, migrar a asserção
  para o novo comportamento e listar em `verification.md` (teste, texto antigo → novo, AC
  que o justifica). *Pronto quando:* os 29 testes continuam executando e passando contra o
  código atual após a troca de helper (antes das mudanças de UI). — regressão 0013.

## Utilitários puros

- [x] **T04 — `lib/decimal.ts` (tabela em `decimal.test.ts`).** `parseDecimal`,
  `compareDecimal` (−1/0/1/null), `isDecimal`; casos `"99.90"`<`"100.00"`,
  `"100.10"`>`"100.09"`, `"1079.00"`=`"1079.0"`, `"abc"`→null, sinais, zeros à esquerda,
  `"-0.00"`=`"0"`. Sem `Number`/`parseFloat` (conferido por leitura do diff). Ajustar
  `tsconfig` para `ES2023` se necessário para T05 e conferir com `npm run build`. — AC20.
- [x] **T05 — `lib/format.ts` (`format.test.ts`).** `formatRelative` com as 7 linhas da
  tabela AC26 (`timeZone` explícito) + bordas (59 s, 60 min, 24 h, virada de dia);
  `retryHint` 0/1/30/59/60/90; `formatMoney` a partir de string (`"1079.00"` → “R$ 1.079,00”,
  inválido → null); `formatPercentage` com sinal e direção; nenhuma saída “R$ 0,00”/“0%”
  para ausente. — AC13, AC16, AC26, AC08.

## Estado

- [x] **T06 — `trackedList` reducer e `useDashboard` (`trackedList.test.ts`).** Reducer:
  `load`, `append` sem repetir IDs, `replace`, `remove`, `upsert` no topo, `mergeFromDashboard`
  (atualiza só IDs existentes). Hook do painel com número de sequência que descarta resposta
  antiga e guarda `receivedAt` via `clock`. *Pronto quando:* testes do reducer e um teste de
  duas cargas fora de ordem passam. — AC16, AC17, AC18, AC24.
- [x] **T07 — `lib/focus.ts`.** Extrair `useModalFocus` do detalhe (sem mudar comportamento:
  os testes de foco do diálogo da 0013 continuam verdes) e criar `useDisclosure`
  (Enter/Espaço nativos, Tab/Shift+Tab nas extremidades fecham, Esc devolve foco, setas
  inertes, clique fora). *Pronto quando:* testes de foco da 0013 verdes e teste de
  `useDisclosure` com user-event verde. — AC03, AC19.

## Componentes (TDD por AC, renderizando `<App clock={...}/>` com `fakeApi`)

- [x] **T08 — Cabeçalho, navegação e menu da conta (`header.test.tsx`).** Marca, Início,
  Produtos, Alertas, sino, menu com e-mail; navegação foca/rola as seções e alterna
  `aria-current`; Sair 204 → entrada; Sair 500/rede → mensagem no cabeçalho com área mantida;
  teclado do menu da conta. — AC01, AC02, AC03.
- [x] **T09 — Sino (`bell.test.tsx`).** Contador “3” e nome “Notificações, 3 não lidas”; 0
  sem contador; 100 itens ou `next_cursor` → “99+”; painel com 5 de 7 e “Ver todas as
  notificações” → seção Alertas; vazio; falha → “Notificações indisponíveis” + “Tentar
  novamente”; marcar a 2ª de 3 → foco no seguinte; última → foco no título do painel; item
  aparece lido na seção; API passa de 3 para 1 → exibe “1”; teclado do painel. — AC03, AC04,
  AC05.
- [x] **T10 — Hero e envio (`hero.test.tsx`).** Textos exatos, placeholder, dica, nota de
  preços, sem card/gráfico/estrelas; “Localizando produto...” com só “Monitorar preço”
  desabilitado; 201 → mensagem, campo limpo, produto no topo da lista; 200 → “Você voltou a
  monitorar este produto.”; entrada sem `https://` chega à API e 400 aparece anunciado com
  texto preservado; 404/409/502/503; `already_tracked` → “Ver produto” abre o detalhe do ID;
  429 + 90 s → “Tente novamente em 2 minutos.”; rede; corpo instável; nenhum leva à entrada.
  — AC06, AC07, AC08.
- [x] **T11 — Indicadores e oportunidades (`overview.test.tsx`).** Quatro indicadores com
  valores e textos complementares exatos, sem deltas; cards com imagem ou marcador neutro,
  título, anterior riscado, atual, selo com seta e percentual, menor preço “desde o primeiro
  registro no BestPrice”, “Preço observado:” relativo, ordem da API, ativar abre detalhe, sem
  “Ver todos”; vazio com produtos → texto AC11. — AC09, AC10, AC11.
- [x] **T12 — `AccountArea` e esqueletos.** Montar a página na ordem hero, indicadores,
  oportunidades, produtos, atualizações, alertas; esqueletos `aria-hidden` com um status
  “Carregando seu painel…” e região `aria-busy`; nenhum número/zero/texto de vazio antes da
  resposta. *Pronto quando:* teste de esqueleto em `states.test.tsx` verde. — AC24.
- [x] **T13 — Tabela “Seus produtos” (`products.test.tsx`).** Colunas principais e linha
  secundária (anterior, maior, Última consulta, Última alteração relativas, selo “Alerta em
  R$ 99,90” só com alerta ativo); ausentes como “Preço indisponível”/“Desconhecido”/
  “Desconhecida”; variação com sinal, seta e “vs. preço anterior”; disponibilidade;
  `not_found` com “último preço conhecido”; `stale` desatualizado; aviso de tentativa não
  `ok`; ordem em texto; “Carregar mais” sem repetir IDs e oculto sem cursor. — AC12, AC13,
  AC14, AC17.
- [x] **T14 — Menu de ações da linha (`products.test.tsx`).** “Ver detalhes” abre o detalhe
  0013; menu com “Atualizar agora”, “Ver anúncio no Mercado Livre” (nova aba, externo,
  `rel` seguro) e “Parar de monitorar”; teclado do menu. — AC03, AC15.
- [x] **T15 — Atualizar agora pela linha (`products.test.tsx`).** Só a linha ocupada (outra
  linha acionável durante a promessa pendente); 200 `ok` → “Consulta concluída.”; 200
  `not_found`; 429 + 30 s; 502/503 → mensagem mantida e linha recarregada por
  `GET /tracked-products/{id}`; foco no botão do menu; 409/404 → só o item sai, mensagem na
  região da seção e foco no título (ou campo de link + anúncio global se era o único); com
  página 2 carregada, demais itens permanecem e indicadores e contador são recalculados;
  401 → entrada. — AC16, AC04.
- [x] **T16 — Parar de monitorar pela linha (`stop-tracking.test.tsx`).** Diálogo com título
  do produto; frase do alerta só com alerta ativo; Cancelar/Esc/clique fora sem requisição e
  foco no botão do menu; confirmar remove só o item (página 2 preservada), recalcula
  indicadores, mensagem e foco conforme convenção; falha 5xx/rede mantém item, erro na
  linha, foco no menu; 404 segue convenção de removido (D10). — AC18.
- [x] **T17 — Detalhe: confirmação no próprio diálogo e link externo
  (`stop-tracking.test.tsx`).** Um único diálogo; foco na confirmação; Cancelar/Esc/clique
  fora voltam ao detalhe com foco em “Parar de monitorar”; confirmar fecha e aplica AC18;
  falha volta com erro anunciado; rótulo “Ver anúncio no Mercado Livre”; após criar/editar/
  ativar alerta e “Atualizar agora” no detalhe, linha, indicadores e contador recalculados.
  Testes de detalhe da 0013 (histórico, alerta, foco) continuam verdes. — AC19, AC15, AC04.
- [x] **T18 — Atualizações recentes (`timeline.test.tsx`).** Textos da tabela da spec com
  título carregado; queda/alta por `compareDecimal` (`"99.90"`→`"100.00"` alta,
  `"100.10"`→`"100.09"` queda); iguais (`"1079.00"`→`"1079.0"`) e `"abc"` → “teve o preço
  alterado.” sem valores, sem seta, sem “R$”; disponibilidade; produto não carregado → “Um
  produto monitorado” + “Ver produto”; tempo relativo; vazio AC21; sem “Ver todas”. — AC20,
  AC21.
- [x] **T19 — Seção Alertas (`alerts.test.tsx`).** Produto, preço observado, alvo,
  `created_at` relativo, lida/não lida; marcar move foco ao seguinte ou ao título, recalcula o
  sino e tira o item do painel; “Carregar mais” sem repetir; vazio “Nenhuma notificação por
  enquanto.”; erro com “Tentar novamente”. — AC22, AC05.

## Integração

- [x] **T20 — Estados gerais (`states.test.tsx`).** Vazio: dois textos, hero em destaque,
  três seções ocultas, Produtos foca o campo, Alertas visível (com e sem notificações);
  respostas do painel fora de ordem mantêm a mais recente; falha 500/rede no painel e nas
  notificações com “Tentar novamente” só na região e hero utilizável; 401 em qualquer chamada
  → entrada; relógio fixo produz textos da tabela AC26 e avançar o relógio sem nova resposta
  não muda o texto. — AC23, AC24, AC25, AC26.
- [x] **T21 — Estilos responsivos, acessibilidade e conteúdo.** Tokens em `:root` (D7), foco
  visível, alvos de 44 px, `prefers-reduced-motion`, empilhamento < 960 px sem rolagem
  horizontal, ordem do DOM = ordem mobile; `content.test.ts` varre `src/` (exceto testes e
  `test/`) por “Amazon”, “prime”, “amazon.com”, estrelas/avaliações e confirma render vazio
  sem produto. — AC12, AC27, AC28, AC29.

## Navegador

- [x] **T22 — Inspeção Playwright + axe (D9), fora do repositório.** Script no scratchpad;
  `npm run dev` + Compose local. API real: entrada, painel vazio, cadastro com integração
  desligada (503), sair. Fixtures interceptadas: populado com 2 páginas, `not_found`,
  `stale`, sem preço, 99+, erros. Em 360/768/1280: `document.documentElement.scrollWidth <=
  clientWidth`; ordem em 360; percurso só por teclado com foco visível (navegação, sino,
  conta, envio, cards, menu da linha, diálogos, carregar mais); axe WCAG 2.1 AA sem violações
  em 360 e 1280; busca por termos proibidos no DOM e em `dist/`. Registrar versões, comandos,
  capturas descritas e limites (só Chromium; sem leitor de tela). — AC12, AC23, AC27, AC28,
  AC29.
  Evidência: quatro rodadas no Chromium (`6d9e259`, `2f2f348`, `bad8dbe`, `384dcb6`) com
  Compose isolado `-p qa0012` e fixtures sintéticas em banco real (só os erros simulados
  por `page.route`), 320/360/768/1280 px; axe 0 violações, sem rolagem horizontal, 58
  paradas de Tab; ver “Verificação final (/verify)” em `verification.md`.

## Gates, revisão e documentação

- [x] **T23 — Quality gates.** `npm run lint` (0 erros), `npm test -- --run` (contagem > 29,
  sem skip), `npm run build` (concluído; conferir tamanho do bundle vs. linha de base). Backend
  sem mudança: confirmar `git diff --stat origin/develop -- backend/` vazio. Registrar saídas
  reais em `verification.md`. — todos.
  Evidência: HEAD `384dcb6`: lint ok; 22 arquivos, 241 passed; build com JS 280,66 kB; diff
  de `backend/` vazio.
- [x] **T24 — Revisão independente (`arch-reviewer`).** Diff revisado contra
  `architecture.md`, `frontend.md`, `security.md`, `datetime-pipeline.md` (nenhum `Number`
  em decisão monetária) e a spec; achados corrigidos na mesma branch com novo ciclo de
  T23. — todos.
  Evidência: 3 rodadas de `arch-reviewer` (I1–I2/M1–M10, N1–N5, N3/B/C/D) corrigidas; parecer
  final de `bad8dbe..384dcb6` aprovado sem achado bloqueante nem importante.
- [x] **T25 — Evidência e progresso.** `verification.md` com cada AC demonstrado (teste ou
  navegador) ou pendência explícita; lista de testes 0013 migrados; atualizar
  `docs/PROGRESS.md`. — todos.
  Evidência: “Verificação final (/verify)” em `verification.md` (28 ACs demonstrados, AC04
  parcial com pendência) e `docs/PROGRESS.md` atualizado.
- [x] **T26 — `doc-sync-onboarding` (última etapa após código).** Sincronizar
  `docs/apps/frontend.md` (nova estrutura, contador por `unread_only`, confirmação, regras de
  tempo relativo, inspeção) e conferir `AGENTS.md`, `CLAUDE.md` e `docs/`. Repetir se houver
  novo código. — todos.
  Evidência: `5157dd5` atualiza `docs/apps/frontend.md` e `README.md`; `AGENTS.md`, `CLAUDE.md`
  e demais documentos de `docs/` conferidos sem mudança necessária.
- [ ] **T27 — PR para `develop`.** Commits `feat(frontend)`/`test(frontend)`/`docs(specs)` com
  `Refs #33`, sem atribuição a ferramentas; PR com `Closes #33`, resumo, como verificar,
  resultados e pendências. Spec só vira `implementada` após revisão e integração. — handoff.
