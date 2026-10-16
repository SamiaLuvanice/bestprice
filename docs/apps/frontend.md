# Módulo frontend

## Identidade visual atual — spec 0015

A marca compacta da entrada e a área autenticada usam a mesma logo oficial,
copiada de
`designsystem/logo-bestprice.png` para `frontend/src/assets/logo-bestprice.png`.
A classe `.brand-logo` exibe a imagem inteira (`object-fit: contain`, sem
`border-radius` nem outro recorte), com superfície de apoio
`--color-logo-surface`. O texto visual “BestPrice” ao lado da imagem fica oculto
para leitores de tela; a imagem fornece o nome acessível.
`designsystem/index.html` orienta os tokens; a composição atual da entrada segue
a referência fornecida na spec 0023. As extensões aplicadas estão registradas em
[`designsystem/README.md`](../../designsystem/README.md).

`frontend/src/styles.css` define superfícies, texto, ações, estados semânticos e
foco no tema claro fixo. A aparência não segue a preferência de cor do sistema
operacional (`prefers-color-scheme`); a SPA não oferece seletor nem grava uma
preferência de tema. A ação principal usa verde com texto preto; o rosa marca
links e destaques. Cabeçalho, menus e diálogos têm base sólida legível, com
`backdrop-filter` como melhoria progressiva dentro de `@supports`. Nessas
regras, `-webkit-backdrop-filter` vem **antes** de
`backdrop-filter`: na ordem inversa, o lightningcss usado pelo build do Vite
reduzia o par só à forma prefixada, que o Chrome não aplica, e o vidro ficava sem
desfoque (defeito presente desde a 0015 e corrigido na 0017). A tipografia usa fontes do sistema e
alternativas sans-serif, sem distribuir a fonte citada no protótipo. Os estados de
carga, erro, sucesso e foco seguem os mesmos fluxos funcionais descritos abaixo.
Em telas estreitas, a lista de produtos continua empilhada e sem rolagem horizontal.
O layout reduz movimento não essencial quando `prefers-reduced-motion` está ativo.

O catálogo contém dados demonstrativos; a SPA continua mostrando apenas dados da
API. A verificação visual da spec 0015 (à época, com tema automático) foi feita em
Chromium nas larguras de 320, 768 e 1280 px, nos dois temas, com fixtures sintéticas
e um smoke local com API e
PostgreSQL isolados. Os resultados e limites estão em
[`verification.md`](../../specs/0015-redesign-design-system-oficial/verification.md).

## Tela de entrada — specs 0017, 0020 e 0023

Na rota `/login`, sem sessão, `App.tsx` renderiza `LoginForm` (`frontend/src/LoginForm.tsx`) direto,
sem o cabeçalho (masthead) nem o hero com o campo de link (spec 0020, que revoga o
trecho da 0017 que os mantinha acima do login); só o rodapé acompanha. A spec 0023
substitui a antiga casca de vidro e a coluna ilustrativa pela imagem fornecida,
mantendo os controles e a autenticação existentes:

- **Composição:** `.login-shell` e `.login-card` ocupam a largura disponível. Acima
  de 840 px, o card divide a tela em duas metades, com arte à esquerda e formulário
  sobre branco à direita. Não há vidro, brilhos nem conteúdo sobreposto à arte.
- **Coluna visual:** `.login-visual` usa `frontend/src/assets/imagem-lateral.png`
  como imagem de fundo com `cover` e enquadramento pelo topo. A marca e a mensagem
  incorporadas à imagem permanecem visíveis; preços, produtos e percentuais nela
  são apenas ilustração estática, sem relação com anúncios ou com a conta. O
  elemento tem `role="img"` e uma descrição breve, sem anunciar valores como dados.
  Até 840 px, a coluna é ocultada e o formulário exibe a logo oficial compacta
  (`.login-brand-compact`, 40 px de altura) antes do título. Nessa faixa, o CSS
  computado não referencia a arte e o inventário do navegador não a listou na
  verificação da spec 0023; não houve medição direta de bytes transferidos.
- **Formulário:** título “Bem-vindo de volta” (`h1`, a única da tela), subtítulo,
  E-mail (`type="email"`, `autocomplete="email"`) e Senha (`autocomplete="current-password"`).
  Cadastro, recuperação de senha, separador “ou” e login com Google não fazem
  parte desta tela.
  O `<form>` usa `noValidate`: a validação é própria e acontece no envio
  (`validateLogin`). O e-mail ignora espaços nas pontas e exige `texto@domínio.ext`; a
  senha só não pode ser vazia. Campo inválido não envia requisição: mostra mensagem em
  texto (`.field-error`) ligada por `aria-describedby`, marca `aria-invalid`, move o foco
  ao primeiro campo inválido e remove o alerta do servidor anterior. A mensagem some
  quando o campo volta a ser válido.
- **Mostrar senha:** botão com nome fixo “Mostrar senha” e `aria-pressed`, que alterna
  o `type` entre `password` e `text` sem perder o valor. Ao enviar, a senha volta a
  ficar oculta.
- **Envio:** botão pílula verde de largura total (`.primary-button.btn-pill`). Durante o
  envio, exibe “Entrando…” com `aria-disabled` e `aria-busy` (sem `disabled`, para não
  perder o foco); um segundo clique ou Enter não gera
  outro `POST /api/auth/login`. `App` controla `busy` e chama `api.login`; os valores
  dos campos ficam no `LoginForm`.
- **Falha e foco:** erro de login ou aviso de sessão encerrada aparece como um único
  `role="alert"`. Depois de uma tentativa que falhou, os campos são preservados e o
  foco vai para Senha; o aviso de sessão exibido na montagem não move o foco. No
  sucesso, o `LoginForm` desmonta e a senha é descartada.
- **Movimento:** com `prefers-reduced-motion: reduce`, o botão não encolhe ao ser
  pressionado.

A verificação (QA em Chrome headless com axe, larguras de 320, 768 e 1280 px, com
desfoque e em modo sólido simulado) e os limites estão em
[`verification.md` da 0017](../../specs/0017-redesign-pagina-login/verification.md); a 0020 está em
[`verification.md`](../../specs/0020-login-sem-bloco-superior/verification.md).
A verificação da composição atual, inclusive em 320, 768 e 1280 × 640 px, está na
[`verification.md` da 0023](../../specs/0023-login-com-imagem-lateral/verification.md).

## Landing pública — spec 0024

Em `/`, enquanto a sessão está pendente, depois de um 401 ou se a consulta de
sessão falhar, `App.tsx` mostra `LandingPage`. Se `GET /api/auth/me` confirmar a
sessão, a mesma URL mostra o painel autenticado. A landing é conteúdo estático:
não busca anúncios, preços, categorias ou métricas na API. A arte do hero e do
banner e as sete imagens de categoria são WebP locais em
`frontend/src/assets/landing/`. O recorte CSS do hero mostra a parte ilustrativa
da imagem, sem repetir o texto que já está incorporado à sua esquerda; os
textos navegáveis e acessíveis são elementos React. Produtos e preços dentro das
artes são ilustrativos, não resultados reais.

A página apresenta marca oficial, proposta de valor, quatro benefícios, quatro
etapas, sete categorias ilustrativas, banner final e rodapé. Links do cabeçalho
levam às seções da própria página. Em telas estreitas, o menu abre e fecha por
botão com `aria-expanded`; há link para pular ao conteúdo, foco visível e redução
de movimento conforme a preferência do sistema. A âncora `#funcionalidades`
tem `scroll-margin-top: 94px` para permanecer visível sob o cabeçalho fixo.
O verde de leitura `#087c1e` mantém contraste calculado de 5,37:1 sobre branco
e 5,11:1 no selo; o botão principal conserva o verde de ação com texto escuro.
As ações “Entrar” levam a
`/login`. “Criar conta gratuita” exibe um aviso local com link para entrar, sem
trocar de rota: o cadastro público ainda não existe. `frontend/index.html`
contém a descrição de busca da aplicação. Consulte a
[verificação da 0024](../../specs/0024-landing-page-publica/verification.md).

## Rotas e fluxo atual — specs 0021 e 0024

A SPA usa `react-router-dom` e mantém o contrato REST da spec 0013. `App.tsx` consulta `GET /api/auth/me` ao abrir ou restaurar a página pelo histórico. Um 401 identifica visitante. Falha de rede ou indisponibilidade mostra a landing em `/`; nas demais rotas, preserva o estado de erro com “Tentar novamente”, sem encerrar a sessão. A conta precisa ser provisionada no backend antes do login; não há cadastro público.

| URL | Conteúdo e acesso |
|---|---|
| `/login` | Entrada pública; uma sessão válida segue para Início. |
| `/` | Landing pública para visitante, inclusive durante carga/falha da sessão; com sessão válida, Início autenticado com formulário por link, resumo, oportunidades e atualizações recentes. |
| `/produtos` | Lista autenticada de monitoramentos, paginação e formulário por link. |
| `/produtos/:id` | Página autenticada do monitoramento próprio, com histórico, alerta e ações. |
| `/alertas` | Alertas configurados e notificações recebidas, em grupos distintos. |

O visitante que abre uma rota protegida vai a `/login?returnTo=...`; depois de entrar, retorna à rota interna solicitada. O destino fica na URL durante uma recarga do login e `safeReturnTo` aceita somente `/`, `/produtos`, `/alertas` e um caminho de detalhe de produto, sem consulta ou fragmento. Entrada direta em `/login` leva ao Início. Logout leva a `/login`; o navegador revalida a sessão ao restaurar uma página pelo histórico. Caminho não reconhecido mostra página não encontrada com link para Início ou login. Cada tela atualiza o título da aba e foca seu título principal; a navegação marca a seção ativa, incluindo Produtos no detalhe.

O cabeçalho autenticado oferece links Início/Produtos/Alertas, sino e menu da conta. Em Início ou Produtos, o mesmo formulário recebe o link do anúncio; o preço desejado continua opcional no detalhe. O sucesso de cadastro mantém a rota, distingue 201 (“Produto adicionado ao monitoramento.”) de 200 (“Você voltou a monitorar este produto.”) e oferece “Ver produto”. Sem monitoramentos, o formulário ganha destaque e orienta o primeiro cadastro. A lista de Produtos conserva preço, variação, disponibilidade, horários, paginação e ações de linha. Lista, oportunidades, atualizações e notificações levam por link a `/produtos/:id`; o detalhe consulta esse ID diretamente, preserva histórico paginado, alerta (criar, editar, pausar, excluir), atualização e link externo. Monitoramento interrompido aberto por URL informa seu estado e não oferece atualização, configuração de alerta ou parada.

Em Alertas, `ConfiguredAlerts` percorre páginas de monitoramentos para alcançar alertas ativos e pausados, inclusive além da primeira página; a consulta prossegue por páginas sem alertas até encontrar um ou esgotar a lista. O grupo de notificações mantém o histórico recebido, paginação e leitura explícita. Cada grupo tem seus próprios estados de carga, erro com retry e vazio. Abrir o produto não marca a notificação como lida. “Carregar mais” nas listas e no histórico usa `next_cursor` e evita IDs duplicados.

| Arquivo | Responsabilidade |
|---|---|
| `frontend/src/App.tsx` | `BrowserRouter`, rotas, consulta e revalidação de sessão, login, retorno seguro e títulos; recebe o relógio injetável (`clock`) |
| `frontend/src/landing/LandingPage.tsx`, `LandingPage.css` | Landing pública, navegação por âncoras, menu móvel, aviso local de cadastro e apresentação responsiva |
| `frontend/src/assets/landing/` | Nove WebP locais: hero, banner e sete categorias ilustrativas |
| `frontend/src/LoginForm.tsx` | Tela de entrada (specs 0017, 0020 e 0023): arte lateral, validação própria no envio, campos, “Mostrar senha”, envio único e foco em Senha após falha |
| `frontend/src/navigation/returnTo.ts` | Allowlist de destinos internos após login ou expiração de sessão |
| `frontend/src/dashboard/AccountArea.tsx` | Orquestra as telas autenticadas, dados, ações e foco; componentes de apresentação não chamam `fetch` |
| `frontend/src/dashboard/AppHeader.tsx`, `AccountMenu.tsx` | Cabeçalho, links de rota, seção ativa e menu da conta |
| `frontend/src/dashboard/NotificationBell.tsx`, `useNotifications.ts` | Sino com contador e painel das não lidas; notificações da rota Alertas; marcar como lida |
| `frontend/src/dashboard/HeroTrackForm.tsx` | Campo de link em Início e Produtos (sem validação nativa de URL), sucesso, erro e link “Ver produto” no sucesso ou 409 `already_tracked` |
| `frontend/src/dashboard/SummaryIndicators.tsx`, `OpportunityList.tsx` | Indicadores do resumo e cards de oportunidades na ordem da API |
| `frontend/src/dashboard/TrackedProductsTable.tsx`, `TrackedProductRow.tsx`, `RowActionsMenu.tsx` | Tabela “Seus produtos” (empilhada por CSS em telas estreitas), linha e menu de ações |
| `frontend/src/dashboard/ConfirmStopDialog.tsx`, `StopTrackingConfirm.tsx` | Confirmação de “Parar de monitorar” pela linha e conteúdo compartilhado com o detalhe |
| `frontend/src/dashboard/ProductDetailDialog.tsx` | Conteúdo da página de detalhe: histórico, estado do monitoramento e alerta |
| `frontend/src/dashboard/ConfiguredAlerts.tsx` | Grupo de alertas configurados, com paginação completa de monitoramentos |
| `frontend/src/dashboard/RecentUpdatesTimeline.tsx`, `AlertsSection.tsx` | Linha do tempo de `recent_updates` e grupo de notificações com estado de leitura |
| `frontend/src/dashboard/trackedList.ts`, `useDashboard.ts` | Reducer da lista “Seus produtos” e carga do painel com descarte de respostas antigas |
| `frontend/src/dashboard/RelativeTime.tsx`, `Skeletons.tsx` | Tempo relativo e esqueletos do carregamento inicial |
| `frontend/src/dashboard/ExternalListingLink.tsx`, `ProductImage.tsx`, `labels.ts`, `Icons.tsx` | Link do anúncio, imagem ou marcador neutro, rótulos de estados da API e ícones |
| `frontend/src/lib/decimal.ts` | Validação e comparação de decimais como texto, sem converter para `number` |
| `frontend/src/lib/format.ts` | Dinheiro (BRL), percentual com direção, tempo relativo e instante absoluto via `Intl` |
| `frontend/src/lib/focus.ts` | `useModalFocus` para confirmação e `useDisclosure` para sino, conta e menu da linha |
| `frontend/src/lib/url.ts` | `safeHttpsUrl`: só `https` vira `href`/`src` (bloqueia `javascript:`, `data:` e `http:`) |
| `frontend/src/api.ts` | Cliente HTTP relativo a `/api`, cookie da sessão, validação das respostas (dinheiro e percentuais como strings decimais) e erros `ApiFailure` com `status`, `code`, `trackedProductId` e `retryAfterSeconds` |
| `frontend/src/styles.css` | Tokens da identidade BestPrice no tema claro fixo e apresentação responsiva |
| `frontend/src/assets/logo-bestprice.png` | Cópia da logo oficial usada na entrada e no cabeçalho autenticado |
| `frontend/src/health.ts` | Cliente legado de `/api/health`, preservado para testes de saúde |

O cliente consome `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`, `/api/dashboard`, `/api/tracked-products`, seus subrecursos `history`, `refresh` e `alert`, além de `/api/notifications` (todas e `unread_only`). Usa `credentials: 'same-origin'`; Vite e Nginx encaminham `/api` ao FastAPI localmente. Em stage, `frontend/functions/api/[[path]].ts` encaminha `/api/*` à origem HTTPS indicada por `API_ORIGIN` no Cloudflare Pages. A Function preserva método, caminho, consulta, corpo, cookie e resposta da API, inclusive `Set-Cookie`; origem inválida ou falha de rede gera 502 genérico. `frontend/public/_routes.json` inclui só `/api/*`, portanto as páginas estáticas não invocam a Function. O build copia esse arquivo para `dist/`. O proxy foi testado localmente e o health público de stage foi verificado na spec 0018; a nova navegação da 0021 ainda não foi verificada em stage. Valores monetários chegam como strings decimais: `Intl.NumberFormat` os formata sem conversão para `number`, e a direção de um evento de preço vem de `compareDecimal`. Resposta fora do contrato vira “A API respondeu com dados inválidos.”; erro sem `code` e `message` vira a mensagem genérica, e falha de rede, “Não foi possível conectar ao BestPrice. Tente novamente.”.

## Notificações e contador

O contrato não tem contagem de não lidas. O sino faz uma única consulta `GET /api/notifications?unread_only=true&limit=100` e deriva o contador da página: até 99 mostra o número; mais de 99 itens ou `next_cursor` presente mostram “99+”; falha não mostra número e o nome acessível passa a “Notificações indisponíveis”. O painel lista as cinco não lidas mais recentes com “Marcar como lida” e “Ver todas as notificações”, que leva a `/alertas`. Tanto o sino quanto o grupo de notificações oferecem link para `/produtos/:id`, sem leitura automática. O grupo pagina `GET /api/notifications` e mostra “Lida”/“Não lida”. O contador é sempre recalculado pela API depois de marcar como lida, de ações de alerta, de “Atualizar agora” e da saída de um produto da lista; nunca é decrementado localmente.

## Parar de monitorar

“Parar de monitorar” sempre pede confirmação em `alertdialog`, seja na linha de Produtos ou na página do detalhe. O texto diz que o histórico é mantido e, com alerta ativo, que o alerta será pausado. Cancelar, Esc ou clique fora não enviam requisição e devolvem o foco ao menu da linha ou ao botão de parar no detalhe. Confirmar envia `DELETE /api/tracked-products/{id}`; no sucesso do detalhe, a aplicação navega a `/produtos`, anuncia “Você parou de monitorar este produto.” e foca o título da lista ou o campo de link se ela ficar vazia. Outra falha mantém a rota de detalhe com erro anunciado e foco na ação de parar.

## Produto removido

Um vínculo deixa de existir para a lista quando uma ação recebe 404, 409 `tracking_inactive` ou um detalhe recarregado com `active=false` (por exemplo, parado em outra aba). Nesses casos a linha sai da lista e, se o detalhe aberto recebeu a resposta, a aplicação volta a `/produtos`; indicadores e contador do sino são recalculados. A mensagem aparece na região de status de “Seus produtos”, com foco no título da seção. Se a lista ficar vazia, a mensagem vai para a região de status global e o foco vai ao campo de link. Abrir diretamente o detalhe de um vínculo próprio já interrompido mantém `/produtos/:id` e mostra “Monitoramento interrompido.”. Exceção: 404 em `/alert` significa alerta não encontrado; o detalhe é recarregado e só deixa a rota se o vínculo também tiver deixado de existir.

## Tempo relativo

`RelativeTime` mostra “Agora” (menos de 1 min), “Há N min”, “Há N h” (menos de 24 h), “Ontem, HH:mm” (dia civil anterior no fuso do navegador) ou “dd/mm/aaaa, HH:mm”. A referência é o instante em que a resposta que trouxe o dado chegou, obtido do relógio injetável; o texto não muda sozinho depois. O instante completo, com segundos, fica no `title` e em texto oculto para leitores de tela; o `<time>` não é parada de Tab. O detalhe mantém os instantes absolutos herdados da 0013.

## Estados e limites

Falhas de operação são mostradas em `role="alert"` com a mensagem específica devolvida pela API. Apenas 401 encerra a sessão local e volta ao login com a mensagem da API; 503 da integração, outros erros e falhas de rede mantêm a pessoa no painel. Quando a resposta traz `retry_after_seconds` (por exemplo, 429), a mensagem acrescenta o prazo em segundos ou minutos; na linha, 429 mantém os dados e outras falhas de “Atualizar agora” recarregam a linha para exibir a tentativa registrada pelo backend. No carregamento inicial, esqueletos ocultos de tecnologias assistivas ocupam as regiões e um único status anuncia “Carregando seu painel…”. Painel e notificações falham por região, com “Tentar novamente”; depois da primeira carga, uma falha de recarga mantém os dados exibidos. Recargas do painel atualizam só os itens já exibidos, sem descartar páginas carregadas, e respostas fora de ordem são descartadas.

O detalhe é uma página com URL e título próprios. A confirmação modal prende o foco com Tab e Shift+Tab, fecha com Esc ou clique no fundo e devolve o foco ao controle que a abriu. Respostas atrasadas do detalhe anterior são descartadas ao trocar de produto. Sino, conta e menu da linha seguem o padrão disclosure, sem navegação por setas: Esc fecha e devolve o foco ao botão; foco ou clique fora fecham.

O card e o detalhe mostram “Preço indisponível” sem preço atual e “Desconhecido”/“Desconhecida” para valores ainda sem dado, em vez de zero. A nota do hero informa que os preços vêm das consultas do BestPrice ao Mercado Livre e podem diferir do checkout; não afirma integração oficial autorizada. Imagens e links do anúncio só são usados com `https`.

Com a integração Mercado Livre desligada, o backend ainda valida a URL, informa duplicação e retoma vínculos interrompidos; uma publicação que exige consulta externa retorna indisponibilidade. A UI ainda não expõe filtros de data no histórico. Limites registrados na [evidência da spec 0012](../../specs/0012-area-usuario-monitoramento/verification.md): “Atualizar agora” com sucesso depende de credencial real; `formatMoney` usa `signDisplay: 'negative'`, que lança `RangeError` em navegadores antigos (Chrome < 106, Firefox < 116, Safari < 15.4).

## Testes e verificação

Em `frontend/`: `npm ci`, `npm run lint`, `npm test -- --run` e `npm run build`. Vitest roda em jsdom com `TZ=America/Sao_Paulo` fixo, `testTimeout` de 15 s e `asyncUtilTimeout` de 3 s (`vite.config.ts` e `src/test-setup.ts`); as interações usam `@testing-library/user-event`. Os testes ficam ao lado do código (`src/**/*.test.ts(x)`). `src/test/fakeApi.ts` substitui `fetch` por um roteador com fixtures no formato exato do contrato; rota não prevista é registrada e o `afterEach` global de `src/test-setup.ts` reprova o teste. `src/test/productsHarness.tsx` renderiza a `App` com rota inicial e relógio fixo. `src/content.test.tsx` impede citações a Amazon, prime, estrelas/avaliações e preços fixos no código da interface; dados de exemplo existem apenas nos testes. Os resultados da navegação por URL estão na [verificação da spec 0021](../../specs/0021-navegacao-por-rotas/verification.md).

A inspeção em navegador (Playwright + axe, WCAG 2.1 AA, larguras de 320 a 1280 px, sobre Compose isolado com fixtures sintéticas) é manual e roda fora do repositório: não há scripts nem dependências dela no código, e ela não faz parte do CI. Só Chromium foi inspecionado, sem leitor de tela nem dispositivo real; método e resultados estão na [evidência da spec 0012](../../specs/0012-area-usuario-monitoramento/verification.md).
