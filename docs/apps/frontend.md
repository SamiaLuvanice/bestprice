# Módulo frontend

## Identidade visual atual — specs 0015, 0027, 0028 e 0029

A marca compacta da entrada e a área autenticada usam a mesma logo oficial,
copiada de
`designsystem/logo-bestprice.png` para `frontend/src/assets/logo-bestprice.png`.
O favicon do navegador também usa essa logo; sua cópia está em
`frontend/public/favicon.png` e é declarada em `frontend/index.html`.
A classe `.brand-logo` exibe a imagem inteira (`object-fit: contain`, sem
`border-radius` nem outro recorte), com superfície de apoio
`--color-logo-surface`. Desde a spec 0029, `frontend/src/components/Brand.tsx`
compartilha ícone e nome entre landing, login, conta, rota não encontrada e estados
de carregamento/erro de sessão. O nome visual usa `--font-display` (`SF Pro Display`,
`SF Pro Icons`, `Helvetica Neue`, Helvetica, Arial, sans-serif), peso 600 e
`letter-spacing: -.011em`, sem quebra de linha. A imagem preserva dimensões
quadradas, sem encolher. Na apresentação autônoma, o contêiner tem `role="img"` e
nome acessível “BestPrice”; ícone e texto internos são decorativos. Dentro dos
links “BestPrice — Início”, o componente inteiro é decorativo e o link fornece o
nome. Na arte do login desktop, o contêiner da ilustração anuncia a marca uma vez
e fornece sua descrição breve.
`designsystem/index.html` orienta os tokens. A spec 0027 aplica a composição
aprovada no Figma às telas públicas e autenticadas, usando os quadros editáveis em
`designsystem/prototypes/2026-10-21-bestprice-figma/`. A referência local foi usada
porque o conector Figma repetiu autenticação; alterações posteriores no serviço
não foram conferidas. As extensões aplicadas estão registradas em
[`designsystem/README.md`](../../designsystem/README.md). A partir da spec 0025,
criar ou alterar HTML/CSS também exige ler
[`designsystem/agent-guidelines.md`](../../designsystem/agent-guidelines.md), que
publica as regras automatizáveis obrigatórias (toque de 44 × 44 px, HTML semântico,
contraste AA/AAA, tokens de cor, `prefers-reduced-motion` e ausência de rolagem
horizontal) e os comandos das skills de design instaladas (`ui-ux-pro-max`,
`huashu-design` e `impeccable`); a identidade de `index.html` continua prevalecendo
sobre sugestões dessas ferramentas.

`frontend/src/styles.css` define superfícies, texto, ações, estados semânticos e
foco no tema claro fixo. A aparência não segue a preferência de cor do sistema
operacional (`prefers-color-scheme`); a SPA não oferece seletor nem grava uma
preferência de tema. A ação principal usa verde com texto preto; o rosa marca
links e destaques. Desde a 0028, os nomes não se repetem com significados
diferentes: no tema shadcn, `--primary` é o rosa da marca (`bg-primary`,
`text-primary`) e `--action` é o verde das ações (`bg-action`, variante `default`
do `Button`); no CSS próprio, `--color-brand` deriva de `--primary`; `text-muted`
produz o texto secundário (`--muted-foreground`), enquanto `bg-muted` continua a
superfície discreta. A tabela completa está em
[Tokens da aplicação](../../designsystem/README.md#tokens-da-aplicação-spec-0028);
`src/tokens.test.ts` protege esse contrato. O cabeçalho e a página de detalhe têm superfícies sólidas;
menus e confirmações preservam a base sólida legível, com `backdrop-filter` como
melhoria progressiva dentro de `@supports`. Nessas regras, `-webkit-backdrop-filter` vem **antes** de
`backdrop-filter`: na ordem inversa, o lightningcss usado pelo build do Vite
reduzia o par só à forma prefixada, que o Chrome não aplica, e o vidro ficava sem
desfoque (defeito presente desde a 0015 e corrigido na 0017). A tipografia usa fontes do sistema e
alternativas sans-serif, sem distribuir a fonte citada no protótipo. Os estados de
carga, erro, sucesso e foco seguem os mesmos fluxos funcionais descritos abaixo.
Em telas estreitas, a lista de produtos continua empilhada e sem rolagem horizontal.
O layout reduz movimento não essencial quando `prefers-reduced-motion` está ativo.

O catálogo e as ilustrações públicas contêm dados demonstrativos identificados
como exemplo. Produtos, preços e métricas da conta continuam vindo apenas da API.
A composição da 0027 usa conteúdo de até 1248 px, oportunidades em linhas e
navegação inferior da conta até 700 px. Os quatro indicadores existentes foram
preservados; desde a 0028 o Início sem produtos mostra só o convite do campo de
link, sem indicadores zerados, e Produtos abre na lista, com o campo de link
recolhido na ação compacta “Adicionar anúncio”. A verificação visual da spec 0015 (à época, com tema automático) foi feita em
Chromium nas larguras de 320, 768 e 1280 px, nos dois temas, com fixtures sintéticas
e um smoke local com API e
PostgreSQL isolados. Os resultados e limites estão em
[`verification.md`](../../specs/0015-redesign-design-system-oficial/verification.md).

## Tela de entrada — specs 0017, 0020, 0023 e 0027

Na rota `/login`, sem sessão, `App.tsx` renderiza `LoginForm` (`frontend/src/LoginForm.tsx`) direto,
sem o cabeçalho (masthead) nem o hero com o campo de link (spec 0020, que revoga o
trecho da 0017 que os mantinha acima do login); só o rodapé acompanha. A composição
em duas metades da 0023 foi atualizada pela 0027 com a arte e a marca do redesign,
mantendo os controles e a autenticação existentes:

- **Composição:** `.login-shell` e `.login-card` ocupam a largura disponível. Acima
  de 840 px, o card divide a tela em duas metades, com arte à esquerda e formulário
  sobre branco à direita. A marca oficial e o texto BestPrice ficam sobre a área
  clara da arte, conforme a referência aprovada; o formulário permanece separado.
- **Coluna visual:** `.login-visual` usa `frontend/src/assets/redesign/login-left.webp`
  como fundo com `cover` e enquadramento pelo topo. A arte é ilustração estática,
  sem vínculo com anúncios ou com a conta. O elemento tem `role="img"` e descrição
  breve; sua marca visual interna é decorativa para tecnologias assistivas.
  Até 840 px, a coluna é ocultada e a marca compacta, com logo e texto BestPrice,
  aparece antes do título. A marca compacta tem nome acessível “BestPrice” e, desde
  a 0029, mantém ícone e nome lado a lado também no móvel.
- **Formulário:** título “Entrar na sua conta” (`h1`, a única da tela), subtítulo,
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
A verificação histórica da imagem anterior está na
[`verification.md` da 0023](../../specs/0023-login-com-imagem-lateral/verification.md).
A composição atual e seus estados em 320, 768 e 1280 px estão na
[verificação da 0027](../../specs/0027-redesign-figma-shadcn/verification.md).
A consistência da marca em 320, 390, 768 e 1280 px está na
[verificação da 0029](../../specs/0029-identidade-bestprice-consistente/verification.md).

## Landing pública — specs 0024 e 0027

Em `/`, enquanto a sessão está pendente, depois de um 401 ou se a consulta de
sessão falhar, `App.tsx` mostra `LandingPage`. Com sessão válida, a mesma URL mostra
o painel. A landing é estática: não busca anúncios, preços, categorias ou métricas
na API. A 0027 substitui a composição da 0024 pelo redesign aprovado: hero “O preço
muda. Você fica sabendo.”, três passos, prévia ilustrativa do acompanhamento,
seção de alertas, banner final e rodapé. Todos os CTAs de entrada levam a `/login`;
nenhum deles promete cadastro público. Os sete cartões de categoria e o aviso
local de cadastro pertencem à composição anterior.

As artes fornecidas e as prévias ficam em `frontend/src/assets/redesign/`, todas em
WebP desde a 0028: `hero-person.webp`, `footer-phone.webp`, `login-left.webp`,
`price-preview.webp` e `dashboard-preview.webp` (as prévias eram SVG e foram
rasterizadas para deixar as capturas determinísticas). Nenhuma passa de 300 KB; o
hero tem `fetchPriority="high"` e dimensões declaradas (1120 × 682). A pasta
`assets/landing/` e `assets/imagem-lateral.png`, sem uso, foram removidas. As prévias de preço e painel são identificadas como
exemplos, sem representar ofertas reais ou dados da pessoa. Textos, links e
controles da página são elementos React; as prévias são apenas ilustrações.
Na hero, a arte da pessoa usa cantos de 18 px, em harmonia com o banner e as
outras superfícies arredondadas da landing; a prévia de preço sobreposta mantém
seu próprio raio.

O cabeçalho leva às âncoras `#inicio`, `#como-funciona`, `#funcionalidades` e
`#alertas`. O menu estreito usa botão com `aria-expanded`; a página mantém link
para pular ao conteúdo, foco nos controles e movimento reduzido. A ação principal
usa verde com texto preto. A [verificação da 0024](../../specs/0024-landing-page-publica/verification.md)
conserva a evidência histórica; os baselines atuais estão na
[verificação da 0027](../../specs/0027-redesign-figma-shadcn/verification.md).

## Componentes e histórico visual — spec 0027

O frontend usa Tailwind CSS v4 pelo plugin `@tailwindcss/vite` e código local dos
componentes oficiais shadcn/ui em `frontend/src/components/ui/`: Button, Input,
Card, Badge, Table, Skeleton, Separator e Chart. `frontend/components.json` define
o estilo `new-york`, os aliases `@/` e os tokens em `src/styles.css`.
`src/lib/utils.ts` combina classes com `clsx` e `tailwind-merge`; Radix e Lucide
compõem os primitivos e ícones. Os tokens shadcn são mapeados à identidade
BestPrice. A variante `.dark` é explícita e não responde ao esquema do sistema;
a aplicação continua com tema claro fixo.

No detalhe, `ProductDetailDialog` carrega `PriceHistoryChart` por `lazy`/`Suspense`.
Recharts e Chart do shadcn ficam em um chunk separado. O gráfico usa somente
registros BRL válidos já carregados, ordenados do mais antigo ao mais recente,
com linha em degraus e pontos sem animação. O tooltip e “Ver registros de preço”
mostram a string decimal original formatada; a conversão para `number` serve
somente às coordenadas do desenho, sem decidir regras ou métricas monetárias. O eixo
vertical usa `formatAxisPrice` (0028): marcas em reais com `R$`, inteiras sem
centavos e as demais com duas casas, sem notação compacta (“mil”); o valor exato
continua no tooltip e na tabela.
Sem registros válidos, há orientação de vazio. Enquanto existe `next_cursor`,
o texto informa cobertura parcial e “Carregar mais preços” amplia o período.
Não há filtros de data nem extrapolação de preços intermediários.

A Table mantém overflow visível para os menus de linha; em telas estreitas a
lista é empilhada por CSS. E-mail oculto visualmente no botão da conta continua
na árvore acessível. Menus e confirmação mantêm os controles de foco existentes.

## Rotas e fluxo atual — specs 0021, 0024 e 0027

A SPA usa `react-router-dom` e mantém o contrato REST da spec 0013. `App.tsx` consulta `GET /api/auth/me` ao abrir ou restaurar a página pelo histórico. Um 401 identifica visitante. Falha de rede ou indisponibilidade mostra a landing em `/`; nas demais rotas, preserva o estado de erro com “Tentar novamente”, sem encerrar a sessão. A conta precisa ser provisionada no backend antes do login; não há cadastro público.

| URL | Conteúdo e acesso |
|---|---|
| `/login` | Entrada pública; uma sessão válida segue para Início. |
| `/` | Landing pública para visitante, inclusive durante carga/falha da sessão; com sessão válida, Início autenticado com formulário por link, resumo, oportunidades e atualizações recentes. |
| `/produtos` | Lista autenticada de monitoramentos sob o título único “Seus produtos”, paginação e ação “Adicionar anúncio” que expande o formulário por link (aberto quando não há produtos). |
| `/produtos/:id` | Página autenticada do monitoramento próprio, com histórico, alerta e ações. |
| `/alertas` | Alertas configurados e notificações recebidas, em grupos distintos. |

O visitante que abre uma rota protegida vai a `/login?returnTo=...`; depois de entrar, retorna à rota interna solicitada. O destino fica na URL durante uma recarga do login e `safeReturnTo` aceita somente `/`, `/produtos`, `/alertas` e um caminho de detalhe de produto, sem consulta ou fragmento. Entrada direta em `/login` leva ao Início. Logout leva a `/login`; o navegador revalida a sessão ao restaurar uma página pelo histórico. Caminho não reconhecido mostra `NotFoundPage`, com marca, título “Este endereço saiu do radar.”, curva decorativa e CTA verde: “Ir para Início” com sessão ou “Entrar” para visitante. “Voltar uma página” usa o histórico do navegador. Cada tela atualiza o título da aba e foca seu título principal; a navegação marca a seção ativa, incluindo Produtos no detalhe.

O cabeçalho autenticado oferece links Início/Produtos/Alertas, sino e menu da conta. Em Início ou Produtos, o mesmo formulário recebe o link do anúncio; o preço desejado continua opcional no detalhe. Em Produtos com lista, o formulário fica recolhido: “Adicionar anúncio” usa `aria-expanded`/`aria-controls`, foca o campo ao abrir e, ao recolher, limpa erro e sucesso do último envio. Enquanto a sessão é verificada (ou a verificação falha fora de `/`), a tela mostra só marca, status e “Tentar novamente”, sem campo de link (0028/AC14). O sucesso de cadastro mantém a rota, distingue 201 (“Produto adicionado ao monitoramento.”) de 200 (“Você voltou a monitorar este produto.”) e oferece “Ver produto”. Sem monitoramentos, o formulário ganha destaque e orienta o primeiro cadastro. A lista de Produtos conserva preço, variação, disponibilidade, horários, paginação e ações de linha; abaixo de 960 px a linha fica compacta (imagem, título, preço, pílula de variação e seta) e a linha inteira abre o detalhe, onde ficam disponibilidade, horários, “Atualizar agora” e “Parar de monitorar”. O rótulo “vs. preço anterior” fica fora da pílula. Lista, oportunidades, atualizações e notificações levam por link a `/produtos/:id`; o detalhe consulta esse ID diretamente, preserva histórico paginado, alerta (criar, editar, pausar, excluir), atualização e link externo. No alerta, cada controle tem uma única função: salvar o alvo, pausar/retomar e excluir (`outline`); “Parar de monitorar” usa a variante `destructive`. Pausar ou retomar preserva o rascunho do campo. Os metadados da consulta ficam recolhidos em “Detalhes da consulta” (`<details>`), sem repetir “sem frete”.

O preço-alvo aceita o formato brasileiro (spec 0028): `src/lib/targetPrice.ts` normaliza `99,90`, `99.90`, `1.899,90`, `1899,9` e o prefixo `R$` para o decimal do contrato (`"99.90"`), só com texto, sem `number`. Valor inválido, zero, acima de 16 dígitos inteiros ou com milhar iniciado por zero (`0.500`) não chama a API: o campo recebe `aria-invalid` e a mensagem “Informe um valor em reais, como 99,90.” em `role="alert"`. O campo de edição mostra o alvo atual com vírgula. O contrato REST `target_price` e o backend não mudaram. Monitoramento interrompido aberto por URL informa seu estado e não oferece atualização, configuração de alerta ou parada.

Em Alertas, `ConfiguredAlerts` percorre páginas de monitoramentos para alcançar alertas ativos e pausados, inclusive além da primeira página; a consulta prossegue por páginas sem alertas até encontrar um ou esgotar a lista. O grupo de notificações mantém o histórico recebido, paginação e leitura explícita. Cada grupo tem seus próprios estados de carga, erro com retry e vazio. Abrir o produto não marca a notificação como lida. “Carregar mais” nas listas e no histórico usa `next_cursor` e evita IDs duplicados.

| Arquivo | Responsabilidade |
|---|---|
| `frontend/src/App.tsx` | `BrowserRouter`, rotas, consulta e revalidação de sessão, login, retorno seguro e títulos; recebe o relógio injetável (`clock`) |
| `frontend/src/landing/LandingPage.tsx`, `LandingPage.css` | Landing pública da 0027, âncoras, menu móvel e CTAs para login |
| `frontend/src/assets/redesign/` | Artes fornecidas e prévias em WebP identificadas como ilustração |
| `frontend/src/LoginForm.tsx` | Entrada da 0027: arte e marca, validação própria, “Mostrar senha”, envio único e foco em Senha após falha |
| `frontend/src/NotFoundPage.tsx` | Recuperação de rota inexistente, CTA por sessão e ação de voltar |
| `frontend/src/components/ui/`, `frontend/src/lib/utils.ts`, `frontend/components.json` | Componentes oficiais shadcn/ui, combinação de classes e configuração de geração |
| `frontend/src/navigation/returnTo.ts` | Allowlist de destinos internos após login ou expiração de sessão |
| `frontend/src/dashboard/AccountArea.tsx` | Orquestra as telas autenticadas, dados, ações e foco; componentes de apresentação não chamam `fetch` |
| `frontend/src/dashboard/AppHeader.tsx`, `AccountMenu.tsx` | Cabeçalho, links de rota, seção ativa e menu da conta |
| `frontend/src/dashboard/NotificationBell.tsx`, `useNotifications.ts` | Sino com contador e painel das não lidas; notificações da rota Alertas; marcar como lida |
| `frontend/src/dashboard/HeroTrackForm.tsx` | Campo de link em Início e Produtos (sem validação nativa de URL), sucesso, erro e link “Ver produto” no sucesso ou 409 `already_tracked` |
| `frontend/src/dashboard/SummaryIndicators.tsx`, `OpportunityList.tsx` | Indicadores existentes e linhas de oportunidades na ordem da API |
| `frontend/src/dashboard/TrackedProductsTable.tsx`, `TrackedProductRow.tsx`, `RowActionsMenu.tsx` | Tabela “Seus produtos” (empilhada por CSS em telas estreitas), linha e menu de ações |
| `frontend/src/dashboard/ConfirmStopDialog.tsx`, `StopTrackingConfirm.tsx` | Confirmação de “Parar de monitorar” pela linha e conteúdo compartilhado com o detalhe |
| `frontend/src/dashboard/ProductDetailDialog.tsx` | Página de detalhe: imagem, preço, contexto, histórico, alerta e carregamento lazy do gráfico |
| `frontend/src/dashboard/PriceHistoryChart.tsx` | Recharts/shadcn Chart, tooltip, tabela textual e cobertura parcial |
| `frontend/src/dashboard/ConfiguredAlerts.tsx` | Grupo de alertas configurados, com paginação completa de monitoramentos |
| `frontend/src/dashboard/RecentUpdatesTimeline.tsx`, `AlertsSection.tsx` | Linha do tempo de `recent_updates` e grupo de notificações com estado de leitura |
| `frontend/src/dashboard/trackedList.ts`, `useDashboard.ts` | Reducer da lista “Seus produtos” e carga do painel com descarte de respostas antigas |
| `frontend/src/dashboard/RelativeTime.tsx`, `Skeletons.tsx` | Tempo relativo e esqueletos do carregamento inicial |
| `frontend/src/dashboard/ExternalListingLink.tsx`, `ProductImage.tsx`, `labels.ts`, `Icons.tsx` | Link do anúncio, imagem ou marcador neutro, rótulos de estados da API e ícones |
| `frontend/src/lib/decimal.ts` | Validação e comparação de decimais como texto, sem converter para `number` |
| `frontend/src/lib/format.ts` | Dinheiro (BRL), percentual com direção, tempo relativo, instante absoluto e rótulo do eixo do gráfico (`formatAxisPrice`) via `Intl` |
| `frontend/src/lib/targetPrice.ts` | Normalização do preço-alvo digitado em pt-BR para o decimal do contrato e mensagem de erro local |
| `frontend/src/lib/focus.ts` | `useModalFocus` para confirmação e `useDisclosure` para sino, conta e menu da linha |
| `frontend/src/lib/url.ts` | `safeHttpsUrl`: só `https` vira `href`/`src` (bloqueia `javascript:`, `data:` e `http:`) |
| `frontend/src/api.ts` | Cliente HTTP relativo a `/api`, cookie da sessão, validação das respostas (dinheiro e percentuais como strings decimais) e erros `ApiFailure` com `status`, `code`, `trackedProductId` e `retryAfterSeconds` |
| `frontend/src/styles.css` | Tokens da identidade BestPrice no tema claro fixo e apresentação responsiva; `src/tokens.test.ts` recusa nomes repetidos com significados diferentes |
| `frontend/src/assets/logo-bestprice.png` | Cópia da logo oficial usada na entrada e no cabeçalho autenticado, reduzida sem perda a 128 × 128 na 0028 (o original segue em `designsystem/`) |
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

Em `frontend/`: `npm ci`, `npm run lint`, `npm test -- --run` e `npm run build`. Vitest roda em jsdom com `TZ=America/Sao_Paulo` fixo, `testTimeout` de 15 s e `asyncUtilTimeout` de 6 s (`vite.config.ts` e `src/test-setup.ts`; aumentado de 3 s na 0028 após falhas intermitentes sob carga, descritas na [verificação da 0028](../../specs/0028-ajustes-auditoria-redesign/verification.md)); as interações usam `@testing-library/user-event`. Os testes ficam ao lado do código (`src/**/*.test.ts(x)`). `src/test/fakeApi.ts` substitui `fetch` por um roteador com fixtures no formato exato do contrato; rota não prevista é registrada e o `afterEach` global de `src/test-setup.ts` reprova o teste. `src/test/productsHarness.tsx` renderiza a `App` com rota inicial e relógio fixo. `src/content.test.tsx` impede citações a Amazon, prime, estrelas/avaliações e preços fixos no código TypeScript/CSS da interface. Dados de exemplo de listas ficam nas fixtures; as artes públicas são ilustrações estáticas identificadas. Os resultados da navegação por URL estão na [verificação da spec 0021](../../specs/0021-navegacao-por-rotas/verification.md).

A regressão visual (specs 0025, 0027, 0028 e 0029) roda por Playwright com `npm run test:visual`.
`frontend/playwright.config.ts` sobe o Vite em `http://127.0.0.1:5173` e define os
projetos `viewport-320`, `viewport-390`, `viewport-768` e `viewport-1280`;
`frontend/tests/visual/public-pages.spec.ts` captura landing, login e página não
encontrada, com `GET /api/auth/me` interceptado em 401 para um estado de visitante
determinístico, sem backend, e com o esquema de cor claro/escuro emulado pelo
Playwright (a SPA permanece no tema claro fixo descrito acima). Os baselines ficam em
`frontend/tests/visual/__screenshots__/` e mudam só por revisão explícita
(`--update-snapshots`, com o diff mostrado); o Vitest exclui `tests/visual/**`.
A suíte é local: não roda no CI e os baselines dependem das fontes da máquina.
A evidência inicial está na [verificação da spec 0025](../../specs/0025-harness-design-tooling/verification.md).

`redesign.spec.ts` acrescentou inicialmente 30 cenários: dez rotas/estados em três viewports,
com fixtures de API interceptadas, axe (`@axe-core/playwright`, tags WCAG A/AA),
ausência de overflow e controles de pelo menos 44 px. Também verifica nome acessível
da conta e o menu de produto aberto por hit test, além de salvar capturas em
`test-results/`. A 0028 acrescentou a sonda de cores dos tokens (3), a imagem do
detalhe com título longo (6), a linha compacta de Produtos (3) e o alinhamento dos
vazios em Alertas (3); à época, com os 18 snapshots públicos, eram 63 casos.
Com o projeto de 390 px da 0029, a matriz pública/redesign soma 84 casos, dos quais
24 são snapshots públicos. `brand.spec.ts` cobre mais 36 casos de identidade,
geometria, nome acessível e axe: nove rotas/estados nas quatro larguras. Em 320 e
390 px, registra observações também após recarga, navegação, retorno e troca de
aba, conforme o cenário. As APIs são simuladas pelo Playwright. Para usar outra
porta local, defina `PLAYWRIGHT_BASE_URL`; para um Chromium existente, use
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Esses overrides não alteram o proxy da API.
`test-results/` e `playwright-report/` são ignorados por Git e ESLint; capturas e
JSON nesses diretórios são evidências apenas locais, não artefatos versionados.

Na 0027, lint/build, 299 testes Vitest e 48 verificações Playwright passaram;
os 18 baselines foram aprovados em revisão explícita. A auditoria é local, sem
leitor de tela ou dispositivo real, e não substitui teste contra uma conta real.
Método, falhas corrigidas e limites estão na
[verificação da 0027](../../specs/0027-redesign-figma-shadcn/verification.md).
Na 0028, lint, 348 testes Vitest, build e 63 verificações Playwright passaram; as
12 capturas de landing e login foram regeneradas e conferidas contra os quadros
aprovados ([verificação da 0028](../../specs/0028-ajustes-auditoria-redesign/verification.md)).
Na 0029, lint/build, 348 testes Vitest, 36 casos de marca/axe e os 84 casos da
matriz pública/redesign passaram. A QA independente reexecutou os 18 casos móveis
do teste final e conferiu 76 observações; as 24 baselines públicas foram aprovadas.
O desaparecimento intermitente da logo não foi reproduzido. A evidência cobre
Chromium com viewport móvel e API simulada, sem aparelho real ou Safari; não
confirma causa nem resolução de falha exclusiva desses dispositivos. Backend e
banco não foram alterados nem tiveram seus gates locais executados nesta spec.
A inspeção manual anterior sobre Compose está preservada na
[evidência da 0012](../../specs/0012-area-usuario-monitoramento/verification.md).
