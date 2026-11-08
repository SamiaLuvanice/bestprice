# Verificação da spec 0050

Registro do papel `qa` (tarefa I2 de [tasks.md](tasks.md)) em 08/11/2026. Worktree
`.worktrees/feature-0050-issue-275-landing-publica-nova`, branch
`feature/0050-issue-275-landing-publica-nova`, base `origin/develop` `6b68796`. Os gates rodaram
sobre o código de `aed336f`; a ponta atual `822ff1b` só acrescenta documentação
(`designsystem/README.md`, `docs/apps/frontend.md`), então o código verificado é o mesmo.

Ambiente: Windows 11 sem SF Pro instalada, Node 22.18.0, Playwright 1.64.1 com Chromium headless,
servidor Vite da própria worktree em `127.0.0.1:5173`. Não havia backend nem PostgreSQL rodando,
e o Docker estava parado.

Este registro não afirma resultado de CI, PR, revisão independente, Project nem release. Nada disso
foi executado ou consultado aqui.

## Simulação × serviços reais

| Camada | Como foi verificada | Real ou simulada |
|---|---|---|
| Landing, Entrar, Criar conta e monitoramento | Vitest (jsdom) e Playwright no Chromium | **API simulada** por `page.route('**/api/**')` em todos os testes da landing |
| Fluxo manual no Chrome | Vite real, **sem backend**: `/api/auth/me` e `/api/auth/signup` responderam **502** pelo proxy | Falha de rede real na UI, sem API |
| `/api/health` 200/503 | `tests/test_health.py` (2 testes com banco simulado, ambos passaram); `tests/test_health_integration.py` foi pulado | **Só simulação.** Não houve chamada a PostgreSQL real nem `curl -i` em API rodando |
| Backend como um todo | `pytest` sem `TEST_DATABASE_URL` | 59 testes de integração pulados |

**Os três serviços reais (API, UI e PostgreSQL) não foram verificados juntos nesta QA.** A
spec não muda o backend nem o contrato, e a landing só consulta `/api/auth/me` e
`/api/auth/signup`. Mesmo assim, o fluxo hero → Entrar → monitoramento com login real contra
PostgreSQL continua **pendente**; ver "Pendências".

## Gates

| # | Comando (diretório) | Resultado observado | Situação |
|---|---|---|---|
| G1 | `npm run lint` (`frontend/`) | `eslint .`, saída 0, nenhum problema | Verde |
| G2 | `npm test -- --run` (`frontend/`) | **58 arquivos; 777 passed (777)**; 77,6 s; saída 0 | Verde, contagem positiva |
| G3 | `npm run build:check` (`frontend/`) | build ok em 2,18 s; "Sem vestígios do catálogo em dist (5 marcadores conferidos)"; "Fontes conforme em dist: Geist Mono latin/latin-ext 400–600, sem base64"; saída 0. Aviso do Vite: chunk acima de 500 kB (`index-*.js` 524,26 kB, gzip 157,70 kB) | Verde, com aviso |
| G4 | `npx playwright test --reporter=line` (`frontend/`, completo) | **307 passed, 434 skipped, 0 failed** (741), 6,3 min; saída 0 | Verde, contagem positiva |
| G5 | `npx playwright test` só nas specs `landing`, `landing-metrics`, `public-pages`, `signup`, `brand`, `interaction`, `review-corrections` e `redesign`, com `--reporter=json` | **201 expected, 139 skipped, 0 unexpected, 0 flaky**; 4,1 min | Verde |
| G6 | `uv sync --locked --extra dev` e depois `uv run ruff check .` (`backend/`) | "All checks passed!" O primeiro `uv run ruff` falhou com "Failed to spawn: ruff" porque o extra `dev` ainda não estava instalado na worktree | Verde |
| G7 | `uv run pytest -q` (`backend/`, sanidade) | **407 passed, 61 skipped**, 1 aviso, 34,9 s | Verde, com limite |

Os 434 pulos do G4 são esperados:

- a maior parte dos testes da landing roda só em `viewport-1280` (`onlyOn1280`) e ajusta a largura
  por conta própria;
- `evidence-0050` e `evidence-0049` exigem variável de ambiente;
- o menu mobile só roda onde o botão existe.

No G5, cada teste de `landing.spec.ts` e `landing-metrics.spec.ts` passou no projeto em que é
executado. O detalhe está na matriz abaixo.

No G7, os pulos são 46 + 11 + 2 por falta de `TEST_DATABASE_URL` (integração PostgreSQL e
evidência da 0034) e 2 por script POSIX que só roda na imagem Linux. O comando foi
`LC_ALL=C uv run pytest -q -rs`.

## Matriz AC01–AC17

As referências são a arquivos de `frontend/`, salvo indicação. "PW" quer dizer Playwright (G4/G5)
e "VT" quer dizer Vitest (G2).

| AC | Evidência | Situação |
|---|---|---|
| AC01 Seções e textos | VT `src/landing/LandingPage.content.test.tsx:58` (ordem das seções e textos dos dois quadros contra o snapshot), `:73` (selo ajustado), `:80` (respostas da FAQ), `:91` (menu 239:856), `:100` (título da aba, marca sem "AI", um único h1). PW `tests/visual/landing-metrics.spec.ts:29` (cada texto visível com tamanho, entrelinha e peso do Figma em 1440 e 390 px). Conferência independente da QA no Chromium: **332/332 textos visíveis** na seção certa, mais a ordem visível das seções igual à dos quadros (lista no Anexo A) | **Demonstrado** |
| AC02 Fidelidade visual | 21 pares em `evidence/figma/` × `evidence/app/`. A QA recapturou as 18 seções pelo mesmo procedimento: **0 px de diferença** em relação às capturas versionadas, ou seja, as evidências refletem o código atual. Tabela por seção abaixo | **Demonstrado** depois das correções pós-QA: A1 corrigido e P1–P8 alinhados ao Figma (seção "Correções após a QA"); as divergências que restam estão aprovadas |
| AC03 Ações | VT `src/landing/LandingPage.test.tsx:53/64/71` (5 combinações de sessão × cadastro) e `src/App.landing.test.tsx:19/25/31` (o `App` repassa os estados). PW `tests/visual/landing.spec.ts:96` (7 colunas: cadastro ligado, desligado, carregando e com falha; sessão em verificação e com falha; com sessão), `:118` (âncoras), `:127` (Entrar concluído → `/app/dashboard`), `:140/:170` (monitorar concluído → monitoramento). VT `src/App.test.tsx` (com sessão, `/login` e `/cadastro` respeitam o `returnTo` seguro) | **Demonstrado** (API simulada) |
| AC04 Link levado pelo login | PW `landing.spec.ts:140` (link aparado; recarregar Criar conta; trocar para Entrar; voltar e avançar; recarregar Entrar; concluir Entrar → `/app/monitoring` com o valor e o foco; nenhum POST `/api/tracked-products`), `:170` (concluir Criar conta). VT `src/App.test.tsx:374`, `src/dashboard/pendingLink.test.tsx:32–97` | **Demonstrado** (API simulada) |
| AC05 Link com sessão | PW `landing.spec.ts:185` (valor, foco, sem POST, link fora da URL e das requisições) | **Demonstrado** (API simulada) |
| AC06 Campo vazio | VT `LandingPage.test.tsx` `it.each` vazio e só espaços (`aria-invalid`, descrição acessível, rota inalterada). PW `landing.spec.ts:223`. Manual no Chrome: com o campo vazio, `aria-invalid=true`, `aria-describedby` → "Informe o link completo de um anúncio do Mercado Livre Brasil." e a URL continuou `/` | **Demonstrado** |
| AC07 Vida do link | PW `landing.spec.ts:79` (`expectNoLink`: URL e corpo de cada requisição) aplicado em todos os passos de `:140/:170/:185/:203`. `:203` (outra aba sem o link; novo envio substitui o anterior), `:185` (uso único: recarregar o monitoramento deixa o campo vazio e o armazenamento sem a chave). PW `:462` (a landing só chama `/api/auth/me` e `/api/auth/signup`). VT `src/navigation/pendingTrackLink.test.ts:10–31` (só `sessionStorage`; armazenamento indisponível). Manual no Chrome: depois do envio, URL `/login?returnTo=%2Fapp%2Fmonitoring`, link só no `sessionStorage`, `localStorage` sem a chave | **Demonstrado**, com o limite L1 |
| AC08 Movimento | Tabela AC08 abaixo. PW `landing.spec.ts:236` (`--progress` de `.lp-steps` e `.lp-demo__chart` sobe e desce com a rolagem), `:258` (duração, atraso e curva calculados), `:291` (assistente). VT `LandingPage.motion.test.tsx:16/32`. Medidas extras da QA no Chromium | **Demonstrado** para os valores que as notas definem. Os valores que as notas não definem usam um token, registrado na tabela |
| AC09 Movimento reduzido | PW `landing.spec.ts:305` (conversa `done`, cenas mostradas, `--progress` = 1, **0 animações em execução** em 5 posições de rolagem). VT `LandingPage.motion.test.tsx:49/59`. QA: com movimento reduzido, a frase do companheiro fica com `animation-name: none` e `transition-duration: 0s` (troca por corte), e `scroll-behavior: auto` | **Demonstrado** |
| AC10 Companheiro | PW `landing.spec.ts:333` em 768, 1280 e 1440 px (frase por seção, oculto no hero e no CTA, sem cobrir `input` nem botões, `aria-hidden`, fora do Tab em 40 passos), `:370` em 320 e 390 px (oculto). VT `LandingPage.motion.test.tsx:79–111`. Manual no Chrome em 1359 px: problema e como-funciona → "Tô de olho"; demonstração e por-que → "Achei uma queda"; assistente e perguntas → "Pode deixar"; começar → oculto | **Demonstrado** |
| AC11 FAQ | PW `landing.spec.ts:382` (5 perguntas; Enter e Espaço alternam `aria-expanded`). VT `LandingPage.motion.test.tsx:113`. Manual no Chrome: o clique em "Como fico sabendo que o preço caiu?" abriu a resposta e fechou a anterior | **Demonstrado** |
| AC12 Menu mobile | PW `landing.spec.ts:398` em 320, 390 e 768 px (itens do quadro, foco preso em 9 Tabs, fecha com Esc, com o botão e com a âncora, e devolve o foco). PW `interaction.spec.ts` (mesmo fluxo). VT `LandingPage.motion.test.tsx:132–168`, `LandingPage.content.test.tsx:91` | **Demonstrado** |
| AC13 Acessibilidade | PW `landing.spec.ts:428` em 320, 390, 768 e 1280 px: axe com `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` e `wcag22aa` **sem violações** (página e menu aberto); nenhum alvo `a`, `button` ou `input` visível abaixo de 44 × 44; `scrollWidth ≤ innerWidth`; só um "Robô…" anunciado como imagem, com `alt` "Robô do BestPrice vigiando o preço de um anúncio". Teclado: `:333` (Tab), `:382`, `:398`, `:511` ("Pular para o conteúdo" visível ao focar) | **Demonstrado** depois das correções pós-QA: percurso só com Tab do início ao fim em 390 e 1280 px, com `:focus-visible`, anel desenhado e elemento na viewport (seção "Correções após a QA") |
| AC14 Afirmações | Tabela AC14 abaixo | **Demonstrado** |
| AC15 Carregamento estável | PW `landing.spec.ts:462` em 1440 e 390 px: título, campo e ação com `opacity: 1` e `visibility: visible` logo depois do `commit`; o campo aceita digitação; **CLS ≤ 0,1** da carga até o fim da rolagem; nenhuma requisição fora de `127.0.0.1`/`localhost`. `:291`: resposta do assistente em menos de 2 s depois de ficar visível | **Demonstrado** (veja a nota sobre fontes no fluxo manual) |
| AC16 Regressão visual | `git diff --stat origin/develop...HEAD -- frontend/tests/visual/__screenshots__` → **exatamente 10 arquivos**, todos aprovados pela responsável: `viewport-{320,390,768,1280}/public-pages.spec.ts/landing-{light,dark}.png` e `viewport-1280/signup.spec.ts/landing-{header-desktop,menu-mobile}.png`. Nenhuma outra referência mudou. G4 passou com essas referências | **Demonstrado** |
| AC17 Comportamento preservado | G2 com 777 e G4 com 307 testes, ambos com contagem positiva e sem falhas. Fora da landing, testes alterados (diff conferido): `routes.test.tsx` e `research.test.tsx` (título da landing); `public-pages`, `brand`, `interaction`, `signup` e `review-corrections` (landing nova); `assistant.spec.ts` (troca a leitura imediata do robô por `expect.poll`, só estabilidade); `App.test.tsx` (com sessão, `/login` e `/cadastro` passam a seguir o `returnTo` seguro, decisão 3 do plano). Login, cadastro e "não encontrada" sem outra mudança de asserção | **Demonstrado**, com a observação O1 |

## AC02 — Fidelidade por seção

Os pares estão em `evidence/figma/<nome>.png` × `evidence/app/<nome>.png`. Altura em px,
medida no PNG; no app, é a altura do elemento da seção.

| Seção | Figma × app | Altura Figma | Altura app | Δ | Divergências observadas |
|---|---|---|---|---|---|
| 01 Hero · desktop | `desktop-01-hero` | 900 | 902 | +2 | Aprovadas: logo 34 px, título sem fade, cabeçalho não fixo, selo "Só o link, nada para preencher", fonte substituta, robô em WebP. A quebra do lead muda por causa da fonte (FS) |
| 02 Problema · desktop | `desktop-02-problema` | 907 | 907 | 0 | Aprovadas: amarelo das abas → token de atenção, FS. **P1** no cartão "O momento passa" |
| 03 Como funciona · desktop | `desktop-03-como-funciona` | 946 | 921 | −25 | FS. **P2** no traço verde |
| 04 Demonstração · desktop | `desktop-04-demonstracao` | 1064 | 1058 | −6 | FS. Sem divergência estrutural |
| 05 Por que · desktop | `desktop-05-por-que` | 844 | 838 | −6 | FS (o título quebra em 3 linhas em vez de 4) |
| 06 Assistente · desktop | `desktop-06-assistente` | 1820 | 1784 | −36 | FS. **P3** nos ícones dos destaques e **P4** no avatar da conversa |
| 07 Perguntas · desktop | `desktop-07-perguntas` | 792 | 772 | −20 | FS. **P5** no ícone de abrir e fechar |
| 08 CTA final · desktop | `desktop-08-cta-final` | 852 | 851 | −1 | FS. **P6** nos anéis "Escaneando" e nas órbitas |
| 09 Rodapé · desktop | `desktop-09-rodape` | 143 | 146 | +3 | Aprovada: `#424245` → `--muted-foreground` |
| Página inteira · desktop | `desktop-pagina-inteira` | 8268 | 8173 | −95 | Soma das diferenças acima |
| 01 Hero · mobile | `mobile-01-hero` | 1317 | 1297 | −20 | As mesmas aprovadas do desktop |
| 02 Problema · mobile | `mobile-02-problema` | 630 | 595 | −35 | FS (o título quebra em 3 linhas em vez de 4) |
| 03 Como funciona · mobile | `mobile-03-como-funciona` | 1722 | 1670 | −52 | FS |
| 04 Demonstração · mobile | `mobile-04-demonstracao` | 820 | 834 | +14 | **A1 (defeito)**: o selo "menor preço" é cortado pela borda do painel |
| 05 Por que · mobile | `mobile-05-por-que` | 878 | 838 | −40 | FS |
| 06 Assistente · mobile | `mobile-06-assistente` | 1416 | 1392 | −24 | FS. **P4** no avatar |
| 07 Perguntas · mobile | `mobile-07-perguntas` | 816 | 870 | +54 | No Figma, as perguntas longas **transbordam** o quadro de 390 px. No app elas quebram linha (limite técnico: o texto precisa caber) |
| 08 CTA final · mobile | `mobile-08-cta-final` | 622 | 620 | −2 | **P7** na largura dos botões. **P6** nos anéis |
| 09 Rodapé · mobile | `mobile-09-rodape` | 277 | 298 | +21 | Links do quadro mobile (Como funciona, Assistente, Entrar); a altura muda por causa da quebra |
| 10 Barra fixa · mobile | `mobile-10-barra-fixa` | 100 (recorte com margem) | 64 | — | O app mede só a barra (358 × 64, igual ao nó 239:523). Sem divergência visual |
| Menu aberto · mobile | `mobile-menu-aberto` | 844 | 844 | 0 | **P8** no tamanho dos itens. A barra fixa aparece sob a sobreposição |
| Página inteira · mobile | — | 8497 (quadro) | 8408 | −89 | Não há recorte `figma/mobile-pagina-inteira.png`, só `app/` |

FS = fonte substituta dos títulos largos (sem SF Pro Expanded no Windows), já aceita na 0049.
Ela também explica a maior parte das diferenças de altura, por mudar as quebras de linha.

### Divergências pendentes de aprovação

A responsável aprovou em 08/11/2026: logo 34 px, título sem fade, cabeçalho não fixo, `#424245` →
`--muted-foreground`, amarelo das abas → token de atenção, fonte substituta, robô em WebP 480 px
e o selo ajustado. As divergências abaixo **não** estão nessa lista.

| Id | Seção | Figma | App (medido ou observado) | Categoria proposta |
|---|---|---|---|---|
| P1 | Problema, cartão "O momento passa" (desktop) | O cartão "Quinta, quando você viu" passa da borda direita, e o preço "R$ 1.849,00" é maior | O cartão cabe dentro do quadro, com preços menores | A definir pela responsável |
| P2 | Como funciona (desktop) | Três traços curtos separados, um por passo | No estado final (movimento reduzido ou `--progress` = 1), um traço verde contínuo atravessa os três passos | Comportamento (estado final da animação da nota 238:757) |
| P3 | Assistente, destaques (desktop) | Ícone dentro de um quadrado branco com borda | Ícone solto de 16 × 16, sem borda e sem fundo (`border 0`, fundo transparente). No mobile, o quadrado aparece | A definir |
| P4 | Assistente, avatar do robô na conversa | Robô com anel rosa, bem visível | Disco escuro com o robô menor | A definir |
| P5 | Perguntas, ícone + e − (desktop) | Círculo visivelmente maior | Círculo de 32 × 32 px. O alvo de toque continua sendo a linha inteira | A definir |
| P6 | CTA final e robô "Escaneando" | Dois anéis verdes tracejados, com traço grosso | Anéis tracejados mais finos, órbitas cinza adicionais e um ponto rosa | A definir |
| P7 | CTA final (390 px) | Botões com largura total (358 px, nó "Botão" 358 × 52 e 358 × 54) | Botões de **237 px**, centralizados | A definir. Provável ajuste de layout |
| P8 | Menu aberto (390 px) | Itens grandes em fonte larga; painel de cerca de 600 px de altura | Itens com 21 px, peso 700, "SF Pro Text"; painel de 366 × 490 | Em parte FS. O tamanho precisa de confirmação |

## AC08 — Movimento: nota × `motion.ts` × obtido

O valor "obtido" é o `getComputedStyle` no Chromium (PW `landing.spec.ts:258` e medidas extras da QA).

| Animação | Nota do Figma | `frontend/src/landing/motion.ts` | Obtido |
|---|---|---|---|
| Título do hero | 238:745: sobe 12 px com fade, 400 ms, ease-out | `heroEnterMs` 400, `heroEnterOffsetPx` 12, `ease-out` | `lp-lift` 0.4s, atraso 0s, ease-out. **Sem fade** (divergência aprovada, AC15) |
| Cartão do hero | 238:745: entra 120 ms depois | `heroCardDelayMs` 120 | 0.4s, atraso 0.12s, ease-out |
| Robô do hero | 238:745: entra por último | `heroRobotDelayMs` 240 (120 depois do cartão) | 0.4s, atraso 0.24s |
| Flutuação do robô | 238:745: 4 px, 3 s, ease-in-out | `robotFloatMs` 3000, `robotFloatPx` 4 | `lp-float` 3s, ease-in-out, em execução |
| Feixe de leitura | 238:745: opacidade 0,35 ↔ 0,6 (sem período definido) | `beamPulseMs` 3000 (o mesmo da flutuação), 0,35 a 0,6 | `lp-beam` 3s, em execução |
| Linha do gráfico do hero | 238:745: desenha da esquerda para a direita em 900 ms | `heroChartDrawMs` 900 | `lp-draw` 0.9s |
| Aviso "Chegou no seu preço-alvo" | 238:745: desliza de baixo 1,2 s depois do carregamento | `heroToastDelayMs` 1200 | `lp-toast`, atraso 1.2s |
| Robô "Encontrou" ao receber o ponteiro | 238:745 | `Hero.tsx`: `onPointerEnter` e `onPointerLeave` | QA: `data-state` vai de `scanning` a `found` no hover, com 1 selo "menor preço", e volta a `scanning` quando o ponteiro sai |
| Cenas do Problema | 238:752: em sequência, stagger de 80 ms (duração não definida) | `sceneStaggerMs` 80, `sceneEnterMs` 400 (token `--motion-enter`) | QA: transições de 0.4s ease-out com atrasos 0s, 0.08s e 0.16s |
| Seta de "Deixa comigo." | 238:752: rola suavemente até Como funciona | `Problem.tsx:93` `href="#como-funciona"` | QA: `href` `#como-funciona`, `scroll-behavior: smooth` (`auto` com movimento reduzido) |
| Traço 01 → 03 | 238:757: acompanha a rolagem | `useScrollProgress` (`--progress`) | PW `:236`: as leituras sobem em 0,1, 0,5 e 0,9 e descem de volta em 0,5 e 0,1 |
| Detalhes dos passos | 238:757 | stagger 2× e 4× | QA: checks com atrasos 0s, 0.16s e 0.32s |
| Poses por passo | 238:757: ler, vigiar, avisar | `neutral`, `scanning`, `alert` | QA: `data-state` igual a `neutral`, `scanning`, `alert` |
| Gráfico em degraus da Demonstração | 238:762: desenha com a rolagem, em degraus | `useScrollProgress` | PW `:236` nos dois sentidos |
| Robô pousando no último ponto | 238:762 | opacidade `clamp((progress − 0,85) × 8)` | QA: progresso 0,2 → opacidade 0; 1,0 → 1; de volta a 0,2 → 0 |
| FAQ abre e fecha | 238:767: Smart Animate 250 ms | `faqToggleMs` 250 | animação do conteúdo aberto com 0.25s |
| Órbitas do CTA final | 238:771: 60 s por volta | `orbitTurnMs` 60000 | `lp-orbit` 60s, linear, em execução |
| Robô "Escaneando" no CTA | 238:771 | `FinalCta.tsx:13` `state="scanning"` | QA: `data-state` igual a `scanning` |
| Assistente | 238:776: "Preparando uma resposta…" e a resposta 1,2 s depois | `assistantReplyDelayMs` 1200 | VT: `typing` até 1199 ms e `done` em 1200 ms. PW `:291`: `done` em menos de 2 s. Manual no Chrome: `idle` → `typing` → `done` |
| Companheiro, troca de frase | 238:771 | `lp-fade` com `--motion-base` (token; a nota não define tempo) | Troca observada no Chrome. Com movimento reduzido, `animation: none` |

## AC14 — Afirmações × evidência

| Afirmação na landing (`frontend/src/landing/content.ts`) | Evidência |
|---|---|
| Fonte oficial, sem scraping (`:81–82`, FAQ `:124`) | `docs/product-context.md:109`: "Toda obtenção de dados do Mercado Livre passa pelo cliente oficial… nem scraping". `backend/app/marketplace/client.py:48–70`: `/items/{id}` e `/items/{id}/sale_price` com `Bearer` |
| Consultas automáticas e periódicas | `docs/product-context.md:113–115` (agendador). `backend/app/monitoring/settings.py:30` (`MONITOR_CHECK_INTERVAL_SECONDS`, padrão 3600) e `worker.py:116` |
| Registro de preço e de disponibilidade | `client.py:93–100` (`available`, `unavailable`, `unknown` a partir de `status` e `available_quantity`). `backend/app/products/models.py:71–73` (`availability`, `last_confirmed_availability`) |
| Aviso no sino quando o preço fica igual ou abaixo do alvo (FAQ `:132`) | `backend/app/products/alerts.py:37` (`current_price <= target_price` → `target_reached`), `:75` (só não avisa se o preço for maior que o alvo), `:82` (`Notification`). `docs/product-context.md` "Alertas e notificações" (`current_price <= target_price`). Sino: `frontend/src/dashboard/AppHeader.tsx:25` e `NotificationBell.tsx` |
| Preço de uma unidade, sem frete, cupom ou benefício pessoal (FAQ `:124`, Demonstração) | `client.py:68` (`context=channel_marketplace`, `quantity=1`) e `_ensure_shared_price_conditions`. `docs/product-context.md:107` |
| Só Mercado Livre Brasil (FAQ `:140`) | `docs/product-context.md:5` e `:107` (site MLB, BRL). `client.py` só fala com a API MLB |
| Conversas por 90 dias (`:115–116`) | `backend/app/research/settings.py:6` `RETENTION_DAYS = 90`; `repository.py:33` filtra `expires_at > now`. `docs/product-context.md:17` |
| Limite de 2.000 caracteres (assistente) | `backend/app/research/settings.py:7` `MAX_MESSAGE_CHARS = 2000`; `schemas.py:18` `max_length=2000`; `routes.py:57` |

A validação externa com anúncios de terceiros (Issue #127) continua pendente, como a spec registra.
A landing não promete prazo nem disponibilidade operacional.

## Fluxo manual no Chrome (`http://127.0.0.1:5173/`, aba própria, fechada ao fim)

1. A landing carregou com o título da aba "BestPrice · Pare de dar F5 no preço.".
2. A rolagem até o fim levou o companheiro por oculto → "Tô de olho" → "Achei uma queda" → "Pode
   deixar" → oculto. Em 1359 px, `scrollWidth` 1344 ≤ `innerWidth`.
   - Numa primeira rolagem rápida, logo depois da carga, a conversa ficou em `idle`. **Isso não se
     repetiu**: recarregando e rolando em passos de 300 px a cada 120 ms, ela passou por
     `idle` → `typing` em 4800 px → `done`.
3. Na FAQ, "Como fico sabendo que o preço caiu?" abriu com a resposta do sino.
4. Hero com o campo vazio: mensagem associada e URL `/`.
5. Hero com o link de exemplo (com espaços nas pontas) e Enter:
   - URL `http://127.0.0.1:5173/login?returnTo=%2Fapp%2Fmonitoring`, sem o link;
   - `sessionStorage` com o link aparado; `localStorage` sem a chave.
6. **Falha de rede real na UI:** sem backend, `/api/auth/me` e `/api/auth/signup` responderam **502**
   pelo proxy do Vite.
   - A tela mostrou "Não foi possível concluir a operação. Tente novamente." com "Tentar novamente".
   - O link continuou no `sessionStorage` depois de recarregar.
   - Não houve login real. A chave foi removida antes de fechar a aba.
7. No Network apareceu uma requisição a `fonts.googleapis.com` (Inter e Lato). Ela vem de uma
   extensão do Chrome instalada no perfil (recursos `chrome-extension://…` na mesma carga).
   `grep -rn "googleapis\|Lato" frontend/index.html frontend/src` não encontrou nada. O PW `:462`,
   sem extensões, confirma a ausência de fonte externa.

## Achados da QA

**A1 — Selo "menor preço" cortado na Demonstração em 390 px (defeito visual, AC02).**

Passos para reproduzir:

1. Abra `/` em 390 × 844, com ou sem movimento reduzido.
2. Role até `.lp-demo__chart`.
3. Observe o robô pousado e o selo "↓ menor preço".

Esperado: o selo inteiro dentro do painel, como no quadro 239:330 (`evidence/figma/mobile-04-demonstracao.png`).

Obtido: o selo termina em x = 386 px, e o painel `.lp-demo__panel`, que recorta o conteúdo
(`overflow` diferente de `visible`), termina em x = 374 px. Isso corta **12 px** do selo, e o texto
fica como "menor preç". Está visível em `evidence/app/mobile-04-demonstracao.png`.

Medido pela QA no Chromium com `getBoundingClientRect`, igual nos dois modos de movimento. Em
1440 px o selo cabe. Não foi corrigido (fora do papel de QA).

**O1 — Mudança de comportamento em `/login` e `/cadastro` com sessão (observação, não defeito).**

Com sessão confirmada, as duas rotas passaram a seguir o `returnTo` seguro. Antes iam sempre a
`/app/dashboard`; por exemplo, `/cadastro?returnTo=%2Fapp%2Fassistant` agora leva a
`/app/assistant`. É a decisão 3 do plano e está coberta por `App.test.tsx`, inclusive com recusa
de `//evil.example` e `https://evil.example`.

O AC17 diz que login e cadastro "continuam como hoje, exceto por receberem o link do hero". A
responsável deve confirmar que essa extensão está dentro do combinado.

**O2 — Título "Página não encontrada · BestPrice" em `/login` sem API (pré-existente, fora da 0050).**

Com `/api/auth/me` falhando (502), a aba de `/login` fica com o título "Página não encontrada ·
BestPrice", embora mostre o alerta de falha. A causa está em `frontend/src/App.tsx:56–60`: o
efeito de título não trata `sessionState` `unavailable`. Esse trecho **não** aparece no diff da
0050. Registrado para uma Issue separada, se a responsável quiser.

## Correções após a QA (08/11/2026)

| Item | Resultado | Evidência |
|---|---|---|
| A1 — selo "menor preço" cortado em 390 px | **Corrigido.** O selo fica preso à direita do robô e cresce para a esquerda | PW `landing.spec.ts` "A1 — selo … inteiro dentro do painel". **Red:** em 320 px, o selo terminava em `right` 315,6 e o painel em 304. **Green:** 320, 390, 768, 1280 e 1440 px. Commit `9576264` / `fac2694` |
| P1 — cartão "O momento passa" | **Alinhado ao Figma** (nó 238:400: posições 28,30 e 110,100; padding 16/20, gap 6, raio 18) | `fac2694`; captura `evidence/app/desktop-02-problema.png` |
| P2 — traço de Como funciona | **Alinhado:** três traços curtos (nó 238:442) se preenchem com a rolagem | `fac2694`; o teste de `--progress` nos dois sentidos continua passando |
| P3 — ícones dos destaques do Assistente | **Alinhado:** quadrado branco de 44 px no desktop (238:682) e de 40 px no mobile (239:468) | `fac2694` |
| P4 — avatar do robô na conversa | **Alinhado** ao nó 238:659 | `fac2694` |
| P5 — ícone da FAQ | **Alinhado:** círculo de 36 px com ícone de 18 px (237:232, 237:240) | `fac2694` |
| P6 — anéis "Escaneando" e órbitas do CTA | **Alinhados:** anéis em SVG com tracejado 6/8 (237:39) e órbitas de 480, 760 e 1080 px (238:723). As órbitas ficam ocultas abaixo de 768 px, como no quadro mobile | `fac2694` |
| P7 — botões do CTA em 390 px | **Alinhados:** 358 px de largura (239:508) | `fac2694` |
| P8 — menu mobile | **Alinhado:** painel de 358 × 588, links de 59 px em 24/30 (239:906). O botão de fechar mantém o alvo de 44 px | `fac2694` |
| AC13 — foco visível | **Coberto:** percurso só com Tab do início ao fim em 390 e 1280 px (`:focus-visible`, anel desenhado, elemento na viewport) e fluxo "campo do hero → Monitorar preço" só com teclado. Nenhuma mudança de código foi necessária | PW `landing.spec.ts`, `9576264` |
| O1 — `returnTo` com sessão | Comportamento da spec ("se a sessão existir, Entrar e Criar conta já levam ao destino final"), decisão 3 do plano, coberto por teste | `App.test.tsx` |

**Referências visuais (AC16), 2ª aprovação:** as correções acima mudaram 9 referências já
aprovadas: `public-pages` landing-{light,dark} em 320, 390, 768 e 1280 px (2% a 3% dos pixels) e
`signup` `landing-menu-mobile.png` (menu de 358 × 588). A responsável aprovou de novo em
08/11/2026, e elas foram regravadas com `--update-snapshots` restrito a esses testes (`326779c`).
O `git status` mostrou só esses 9 PNGs. No total do diff contra `origin/develop`, continuam
exatamente as 10 referências da landing.

**Gates finais (ponta `326779c`):**

| Comando | Resultado |
|---|---|
| `npm run lint` | sem erros |
| `npm test -- --run` | **777 passed** |
| `npm run build:check` | build ok; sem catálogo em `dist`; fontes locais |
| `npx playwright test` completo | **312 passed, 449 skipped, 0 failed** (6,3 min) |
| `uv run ruff check .` / `uv run pytest -q` | All checks passed / **407 passed, 61 skipped** (registro da QA; o backend não mudou desde então) |

## Limites

- **L1:** duplicar a aba no Chrome copia o `sessionStorage`, então a cópia recebe o link uma vez.
  O AC07 foi testado com "outra aba" como página nova do mesmo contexto.
- Não houve teste em WebKit/Safari nem em Firefox; só Chromium.
- Sem SF Pro (Expanded) no Windows, os títulos usam a fonte substituta. As comparações de AC02
  refletem isso.
- O backend rodou sem PostgreSQL real: 59 testes de integração pulados, `/api/health` 200/503 só
  com banco simulado (`tests/test_health.py`: 2 testes, ambos passaram) e nenhum fluxo com os três
  serviços reais.
- Os testes da landing simulam a API. Login e cadastro não rodaram contra o backend real.
- Visualmente, só a QA comparou as divergências P1–P8. Nenhuma tem medida do Figma além das citadas.

## Pendências

1. Fluxo ponta a ponta com API, UI e PostgreSQL reais. Não foi executado: a mudança é só de
   frontend e não toca API nem banco (critério 6 de `task-done-criteria.md`), e os testes da
   landing usam a API simulada. Fica registrado como limite.
2. A PR para `develop` e o CI (I4) entram no registro da PR.
3. O2 (título "Página não encontrada" em `/login` com a API fora do ar) é anterior à 0050 e fica
   fora desta spec, para uma issue separada.

## Anexo A — Textos do Figma conferidos item a item (AC01)

Script da QA (fora do repositório), Chromium em 1440 × 900 e 390 × 844 com movimento reduzido e
API simulada. Para cada nó do snapshot `designsystem/landing/figma-landing-texts-2026-11.json`
(selo trocado pelo texto de `approvedChanges`), o script procura o texto no `innerText` visível
dos elementos `[data-figma-desktop|mobile="<nó>"]` e nos placeholders.

A comparação ignora maiúsculas e minúsculas, porque os sobretítulos ("O jeito antigo", "Como
funciona"…) ficam em caixa alta por CSS, como no Figma. Numa primeira rodada sensível a caixa,
22 itens não casaram, todos sobretítulos e rótulos em caixa alta.

Resultado: 332/332 textos visíveis encontrados.

### desktop (1440 px)

Ordem visível das seções: 238:295 → 238:353 → 238:422 → 238:485 → 238:575 → 238:618 → 238:712 → 238:722 → 238:736 — igual ao quadro

- **01 · Hero** (238:295): [x] BestPrice · [x] Como funciona · [x] Demonstração · [x] Assistente · [x] Perguntas · [x] Entrar · [x] Começar a monitorar · [x] Monitorando anúncios do Mercado Livre · [x] Pare de dar F5 no preço. · [x] O BestPrice acompanha por você — e avisa na hora certa. · [x] Cole o link de um anúncio do Mercado Livre uma única vez. O BestPrice consulta o preço automaticamente, guarda o histórico e te avisa quando ele chega ao valor que você quer pagar. · [x] Cole o link do anúncio do Mercado Livre · [x] Monitorar preço · [x] Um link por produto. Você não precisa preencher mais nada. · [x] API oficial do Mercado Livre · [x] Só o link, nada para preencher *(ajuste aprovado; Figma: "Só o link, nenhum cadastro")* · [x] Histórico desde o 1º registro · [x] Smartphone Exemplo · [x] MLB4012345678 · [x] 5,1% · [x] R$ 1.849,00 · [x] R$ 1.949,00 · [x] Última consulta · há 12 min · [x] Alvo R$ 1.900 · [x] Tô de olho nesse aqui. · [x] Chegou no seu preço-alvo · [x] Smartphone Exemplo · R$ 1.849,00 · [x] Consultas recentes · [x] há 3 h · [x] R$ 1.949,00 · [x] sem mudança · [x] há 1 h · [x] R$ 1.949,00 · [x] sem mudança · [x] há 12 min · [x] R$ 1.849,00 · [x] ↓ R$ 100,00
- **02 · Problema → virada** (238:353): [x] O jeito antigo · [x] Acompanhar preço na mão é um trabalho que nunca termina. · [x] Smartphone Exemplo 128… · [x] × · [x] Smartphone Exemplo 128… · [x] × · [x] Fone Bluetooth X… · [x] × · [x] Smartphone Exemplo 128… · [x] × · [x] 12 abas abertas · [x] As abas se acumulam · [x] Você abre o mesmo anúncio todo dia só para ver se algo mudou. · [x] Ontem estava mais barato? · [x] Esse desconto é de verdade? · [x] A memória não ajuda · [x] Sem histórico, fica difícil saber se o preço caiu ou só voltou ao normal. · [x] Terça, 10:42 · [x] R$ 1.849,00 · [x] Quinta, quando você viu · [x] R$ 2.049,00 · [x] 10,8% · [x] O momento passa · [x] Quando você finalmente confere, a queda já pode ter acabado. · [x] Deixa comigo. · [x] Eu confiro o preço por você. Você só aparece na hora de decidir.
- **03 · Como funciona** (238:422): [x] Como funciona · [x] Você cola o link. O robô cuida do resto. · [x] Um passo é seu. Os outros acontecem em segundo plano, todos os dias. · [x] mercadolivre.com.br/…/MLB4012345678 · [x] título ✓ imagem ✓ preço ✓ · [x] 01 · [x] você · [x] Cole o link do anúncio · [x] Copie o endereço no Mercado Livre e cole no BestPrice. Título, imagem e preço chegam sozinhos — nada para preencher. · [x] ↓ mudança registrada · [x] 02 · [x] automático · [x] O BestPrice acompanha · [x] Consultas automáticas e periódicas registram cada mudança de preço e de disponibilidade. Mesmo enquanto você dorme. · [x] Preço-alvo atingido · [x] R$ 1.849,00 ≤ alvo R$ 1.900,00 · [x] 03 · [x] automático · [x] Você decide na hora certa · [x] Defina um preço-alvo. Quando o anúncio chegar lá, o aviso aparece no seu BestPrice.
- **04 · Demonstração** (238:485): [x] Demonstração · [x] Um anúncio. Todo o histórico. Nenhuma planilha. · [x] É assim que um produto aparece depois que o BestPrice começa a acompanhar. · [x] Smartphone Exemplo 128 GB · [x] MLB4012345678 · [x] Disponível · [x] Preço atual · [x] R$ 1.849,00 · [x] 5,1% vs. anterior · [x] no seu alvo · [x] Anterior · [x] R$ 1.949,00 · [x] Menor registrado · [x] R$ 1.849,00 · [x] Maior registrado · [x] R$ 2.199,00 · [x] Seu preço-alvo · [x] R$ 1.900,00 · [x] Última consulta · [x] há 12 min · [x] Última mudança · [x] hoje, 10:42 · [x] Ver anúncio no Mercado Livre · [x] Histórico de preço · [x] Desde o 1º registro · [x] alvo R$ 1.900 · [x] menor preço · [x] Menor preço desde o 1º registro · [x] hoje, 10:42 · R$ 1.849,00 · [x] ago · [x] set · [x] out · [x] nov · [x] hoje, 10:42 · [x] R$ 1.949 → R$ 1.849 · [x] seg, 08:15 · [x] R$ 1.999 → R$ 1.949 · [x] qui, 21:03 · [x] R$ 2.189 → R$ 2.099 · [x] Dados ilustrativos. O BestPrice considera o preço de uma unidade, sem frete, cupom ou benefício pessoal.
- **05 · Por que BestPrice** (238:575): [x] Por que BestPrice · [x] Menos tempo vigiando. Mais certeza na compra. · [x] Não compro nada por você. Só aviso na hora certa. · [x] Seu tempo de volta · [x] Nada de abrir o mesmo anúncio todos os dias. As consultas acontecem sem você precisar lembrar. · [x] Desconto com contexto · [x] Compare o preço de hoje com o menor e o maior já registrados e veja se a oferta é boa de verdade. · [x] Dados da fonte oficial · [x] Os preços vêm da API oficial do Mercado Livre. Sem scraping e sem leitura de páginas. · [x] Aviso só quando importa · [x] Você define o preço-alvo. O BestPrice só chama sua atenção quando ele é atingido.
- **06 · BestPrice IA — Assistente de compras** (238:618): [x] BestPrice IA · Assistente de compras · [x] Não sabe o que comprar? Comece por uma conversa. · [x] Conte como vai usar, o que é importante e quanto quer gastar. O robô ajuda a organizar as opções e, quando a pesquisa na web está disponível, traz referências de preço com as fontes. · [x] Nova conversa · [x] Buscar pelo título · [x] Conversas recentes · [x] Notebook para estudar e trabalhar · [x] Atualizada agora · [x] Fone para academia até R$ 300 · [x] Atualizada há 2 dias · [x] Air fryer para 2 pessoas · [x] Atualizada há 5 dias · [x] Presente de aniversário — gamer · [x] Atualizada há 2 semanas · [x] Guardadas por até 90 dias da criação. · [x] Notebook para estudar e trabalhar · [x] Assistente BestPrice IA · [x] Quero um notebook para estudar e trabalhar, até R$ 4.000. O que devo priorizar? · [x] Para estudar e trabalhar, priorize nesta ordem: 16 GB de RAM, SSD de 512 GB e boa autonomia de bateria. Tela Full HD e um teclado confortável fazem diferença no dia a dia. · [x] Na web, encontrei modelos nessa faixa entre R$ 3.599 e R$ 3.999. · [x] Fontes da pesquisa na web · [x] 1 · [x] loja-a.com.br · [x] 2 · [x] loja-b.com.br · [x] 3 · [x] revista-tech.com · [x] Sugestões de pesquisa do Google: · [x] notebook 16gb ssd 512gb · [x] Não verificado · [x] Pesquisado em hoje, 14:32 · [x] Ex.: um notebook para estudar e trabalhar… · [x] Processado pelo Google. Não inclua dados pessoais ou confidenciais. Até 2.000 caracteres. · [x] Pergunte do seu jeito · [x] Uso, prioridades e orçamento. Você não precisa chegar sabendo o modelo ideal. · [x] Preços da web, com fontes · [x] Quando a pesquisa está disponível, cada referência mostra de onde veio e quando foi consultada. · [x] Retome de onde parou · [x] Conversas salvas por até 90 dias, com busca pelo título no histórico. · [x] menor preço · [x] Decidiu qual anúncio? Agora é comigo. · [x] Cole o link do Mercado Livre e eu acompanho o preço até chegar no seu alvo. · [x] Monitorar um anúncio · [x] Respostas da IA não são verificadas e dependem de disponibilidade e limites de uso. Preços da web são referência: não criam monitoramento nem alerta. A decisão é sempre sua.
- **07 · Perguntas** (238:712): [x] Perguntas frequentes · [x] O que você precisa saber antes de colar o primeiro link. · [x] De onde vêm os preços? · [x] Da API oficial do Mercado Livre, consultada pelo BestPrice. Não lemos páginas da loja nem usamos scraping. O preço considerado é o de uma unidade, sem frete, cupom ou benefício pessoal. · [x] Preciso preencher os dados do produto? · [x] Como fico sabendo que o preço caiu? · [x] O BestPrice compra por mim? · [x] Funciona com outras lojas?
- **08 · CTA final** (238:722): [x] Cole o primeiro link. O resto é com o robô. · [x] Comece com um único link. Depois disso, quem confere é ele. · [x] Começar a monitorar · [x] Já tenho conta
- **09 · Rodapé** (238:736): [x] BestPrice · [x] Monitoramento automático de preços do Mercado Livre Brasil. · [x] Como funciona · [x] Assistente · [x] Perguntas · [x] Entrar

### mobile (390 px)

Ordem visível das seções: 239:181 → 239:229 → 239:269 → 239:330 → 239:377 → 239:419 → 239:499 → 239:508 → 239:516 → 239:523 — igual ao quadro

- **01 · Hero** (239:181): [x] BestPrice · [x] Entrar · [x] Monitorando o Mercado Livre · [x] Pare de dar F5 no preço. · [x] O BestPrice acompanha por você — e avisa na hora certa. · [x] Cole o link de um anúncio do Mercado Livre uma única vez. O BestPrice consulta o preço automaticamente, guarda o histórico e te avisa quando ele chega ao valor que você quer pagar. · [x] Cole o link do anúncio · [x] Monitorar preço · [x] Um link por produto. Você não precisa preencher mais nada. · [x] API oficial do Mercado Livre · [x] Só o link, nada para preencher *(ajuste aprovado; Figma: "Só o link, nenhum cadastro")* · [x] Histórico desde o 1º registro · [x] Smartphone Exemplo · [x] MLB4012345678 · [x] 5,1% · [x] R$ 1.849,00 · [x] R$ 1.949,00 · [x] Última consulta · há 12 min · [x] Alvo R$ 1.900 · [x] Tô de olho nesse aqui. · [x] Chegou no seu preço-alvo · [x] R$ 1.849,00
- **02 · Problema → virada** (239:229): [x] O jeito antigo · [x] Acompanhar preço na mão é um trabalho que nunca termina. · [x] 12 abas abertas · [x] As abas se acumulam · [x] Você abre o mesmo anúncio todo dia só para ver se algo mudou. · [x] Ontem estava mais barato? · [x] A memória não ajuda · [x] Sem histórico, fica difícil saber se o preço caiu ou só voltou ao normal. · [x] R$ 1.849 → R$ 2.049 · [x] O momento passa · [x] Quando você finalmente confere, a queda já pode ter acabado. · [x] Deixa comigo. · [x] Eu confiro o preço. Você só decide.
- **03 · Como funciona** (239:269): [x] Como funciona · [x] Você cola o link. O robô cuida do resto. · [x] Um passo é seu. Os outros acontecem em segundo plano. · [x] mercadolivre.com.br/…/MLB4012345678 · [x] título ✓ imagem ✓ preço ✓ · [x] 01 · [x] você · [x] Cole o link do anúncio · [x] Copie o endereço no Mercado Livre e cole no BestPrice. Título, imagem e preço chegam sozinhos — nada para preencher. · [x] ↓ mudança registrada · [x] 02 · [x] automático · [x] O BestPrice acompanha · [x] Consultas automáticas e periódicas registram cada mudança de preço e de disponibilidade. Mesmo enquanto você dorme. · [x] Preço-alvo atingido · [x] R$ 1.849,00 ≤ alvo R$ 1.900,00 · [x] 03 · [x] automático · [x] Você decide na hora certa · [x] Defina um preço-alvo. Quando o anúncio chegar lá, o aviso aparece no seu BestPrice.
- **04 · Demonstração** (239:330): [x] Demonstração · [x] Um anúncio. Todo o histórico. Nenhuma planilha. · [x] Smartphone Exemplo 128 GB · [x] MLB4012345678 · Disponível · [x] R$ 1.849,00 · [x] 5,1% · [x] no seu alvo · [x] menor preço · [x] Menor preço registrado · [x] hoje, 10:42 · [x] Anterior · [x] R$ 1.949,00 · [x] Menor registrado · [x] R$ 1.849,00 · [x] Maior registrado · [x] R$ 2.199,00 · [x] Seu preço-alvo · [x] R$ 1.900,00 · [x] Dados ilustrativos. Preço de uma unidade, sem frete, cupom ou benefício pessoal.
- **05 · Por que BestPrice** (239:377): [x] Por que BestPrice · [x] Menos tempo vigiando. Mais certeza na compra. · [x] Seu tempo de volta · [x] Nada de abrir o mesmo anúncio todos os dias. · [x] Desconto com contexto · [x] Compare o preço de hoje com o menor e o maior já registrados. · [x] Dados da fonte oficial · [x] Preços da API oficial do Mercado Livre. Sem scraping. · [x] Aviso só quando importa · [x] O aviso aparece quando seu preço-alvo é atingido. · [x] Não compro nada por você. Só aviso na hora certa.
- **06 · BestPrice IA — Assistente de compras** (239:419): [x] BestPrice IA · [x] Não sabe o que comprar? Comece por uma conversa. · [x] Conte como vai usar, o que é importante e quanto quer gastar. O robô ajuda a organizar as opções, com fontes quando pesquisa na web. · [x] Notebook para estudar · [x] 3 conversas recentes · ver histórico · [x] Notebook para estudar e trabalhar, até R$ 4.000. O que priorizar? · [x] Priorize 16 GB de RAM, SSD de 512 GB e boa bateria. Na web, achei modelos entre R$ 3.599 e R$ 3.999. · [x] loja-a.com.br · [x] loja-b.com.br · [x] +1 · [x] Não verificado · [x] hoje, 14:32 · [x] Pergunte o que precisa… · [x] Processado pelo Google. Não inclua dados pessoais ou confidenciais. · [x] Pergunte do seu jeito · [x] Uso, prioridades e orçamento. · [x] Preços da web, com fontes · [x] Cada referência mostra de onde veio e quando. · [x] Retome de onde parou · [x] Conversas salvas por até 90 dias. · [x] menor preço · [x] Decidiu qual anúncio? Agora é comigo. · [x] Monitorar um anúncio · [x] Respostas da IA não são verificadas e dependem de disponibilidade e limites de uso.
- **07 · Perguntas** (239:499): [x] Perguntas frequentes · [x] Antes de colar o primeiro link. · [x] De onde vêm os preços? · [x] Da API oficial do Mercado Livre, consultada pelo BestPrice. Não lemos páginas da loja nem usamos scraping. O preço considerado é o de uma unidade, sem frete, cupom ou benefício pessoal. · [x] Preciso preencher os dados do produto? · [x] Como fico sabendo que o preço caiu? · [x] O BestPrice compra por mim? · [x] Funciona com outras lojas?
- **08 · CTA final** (239:508): [x] Cole o primeiro link. O resto é com o robô. · [x] Comece com um único link. Depois disso, quem confere é ele. · [x] Começar a monitorar · [x] Já tenho conta
- **09 · Rodapé** (239:516): [x] BestPrice · [x] Monitoramento automático de preços do Mercado Livre Brasil. · [x] Como funciona · [x] Assistente · [x] Entrar
- **Barra fixa — CTA mobile** (239:523): [x] Pronto para parar de conferir? · [x] Começar
- **Menu aberto** (239:856): [x] BestPrice · [x] Como funciona · [x] Demonstração · [x] Assistente · [x] Perguntas · [x] Começar a monitorar · [x] Entrar · [x] Cole um link e eu confiro por você.
