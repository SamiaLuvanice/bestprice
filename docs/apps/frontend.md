# Módulo frontend

## Fluxo oficial de design — Figma

O Figma é a ferramenta oficial de UI/UX e a referência visual principal do
BestPrice IA para interfaces web/mobile, componentes reutilizáveis, tokens,
protótipos, layouts responsivos e evolução da experiência. O fluxo é
**Figma → Codex → Implementação → Validação visual**. O redesign avança tela por
tela, preservando arquitetura, funcionalidades e identidade visual existentes.

A referência já registrada é o [arquivo Figma BestPrice](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice).
A [exportação de 21/10/2026](../../designsystem/prototypes/2026-10-21-bestprice-figma/README.md)
registra as páginas **00 · Design system**, **01 · Telas desktop** e
**02 · Telas mobile**. Preserve essa organização como convenção e agrupe telas por
fluxo, com estados e variantes identificados. A exportação é histórica e não
comprova a estrutura nem o conteúdo atual do arquivo remoto; esta padronização
não criou ou reorganizou frames no Figma.

1. **Referenciar.** Em cada tarefa, registre o link do arquivo e frame com
   `node-id`, nome da tela, rota existente, estado e viewport/dimensões. Relacione
   as versões desktop/mobile da mesma tela e indique os estados necessários
   (carga, vazio, erro, sucesso, foco e sobreposições, quando existirem).
2. **Consultar.** Priorize o MCP oficial do Figma quando disponível e autorizado.
   Consulte frame e screenshot, hierarquia, auto layout, dimensões, constraints,
   propriedades, variantes de componentes, variáveis e estilos/tokens. Verifique
   acesso ao arquivo na tarefa; a disponibilidade do conector não comprova
   autenticação, leitura ou fidelidade atual. A configuração do servidor e a
   autorização por cliente estão no [setup do harness](../harness-setup.md).
3. **Mapear e implementar.** Antes de criar componentes, confira os equivalentes
   em `frontend/src/components/`, `components/ui/`, `dashboard/` e
   `features/research/`, incluindo `Brand`, `Button`, campos, cards e gráficos.
   Reutilize composição e variantes existentes, adaptando a referência à stack
   React/TypeScript atual. Mapeie os tokens Figma aos tokens semânticos de
   `frontend/src/styles.css`; registre extensões em `designsystem/README.md`.
   Preserve contratos, estados reais, acessibilidade e logo oficial. Divergências
   de identidade ou de comportamento devem ser registradas e resolvidas antes
   de uma alteração visual; não autorizam reconstrução ou redesign implícito.
4. **Validar visualmente.** Compare a implementação com o frame/export aprovado
   no mesmo viewport e estado: tipografia, cor, espaçamento, alinhamento,
   componentes, conteúdo e assets. Confira desktop/mobile e larguras
   intermediárias, inclusive 320, 390, 768 e 1280 px, overflow, toque, teclado,
   contraste e movimento reduzido. Use os testes visuais existentes da aplicação
   e registre diferenças e limites; novas baselines exigem revisão da referência.

**MCP indisponível, sem autorização ou com limite:** use referências exportadas do
Figma (PNG/SVG/PDF e informações de tokens/componentes quando necessárias).
Registre arquivo de origem, link/node-id quando conhecido, data da exportação,
estado, dimensões/escala e detalhes não verificáveis. Identifique capturas antigas
como tal. Se faltar informação essencial, solicite a referência exportada ou o
detalhe antes de implementar a parte dependente; não invente variantes, valores
ou comportamento. Bridges e automações alternativas, inclusive Playwright para
manipular ferramentas de design, exigem autorização específica do usuário.

O HTML em `designsystem/` e os assets locais são referências preservadas da
identidade existente e apoio ao fallback. O Figma é a referência visual
principal; sugestões genéricas de skills não a substituem. A Paper Bridge
foi descontinuada pela spec 0039; o MCP oficial do Paper permanece configurado
para uso eventual quando necessário. Ele não substitui a referência Figma nem
reativa a Bridge ou constitui fallback automático para limites do Figma.
O Playwright existente do frontend permanece
restrito à verificação da aplicação.

## Identidade visual atual — specs 0015, 0027, 0028, 0029 e 0030

A marca compacta da entrada e a área autenticada usam a mesma logo oficial,
copiada de
`designsystem/logo-bestprice.png` para `frontend/src/assets/logo-bestprice.png`.
O favicon do navegador também usa essa logo. Desde a spec 0051, `frontend/public/favicon.png`
é uma versão de 48 × 48 px e `frontend/public/apple-touch-icon.png` (180 × 180 px, fundo
branco) atende atalhos no iOS; ambos são declarados em `frontend/index.html` e gerados a
partir da arte original, guardada fora de `public/` (ver
[SEO técnico](#seo-técnico-das-páginas-públicas--spec-0051)).
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
nome. Desde a correção de revisão da 0030, o login mostra uma única marca
acessível na coluna do formulário, em todas as larguras. O ícone tem fundo CSS
transparente, preservando o alpha do PNG original; a fotografia é decorativa.
`designsystem/index.html` preserva a referência local anterior de tokens; a
precedência atual é definida no fluxo Figma acima. A spec 0027 aplica a composição
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
`huashu-design`, `impeccable` e `shadcn`); suas sugestões respeitam a referência Figma
aprovada, a identidade preservada e os requisitos funcionais/de acessibilidade.
Para auditar SEO das páginas públicas (landing, `/login` e `/cadastro`), use a skill
`seo-audit`: ela só diagnostica e recomenda, e as correções seguem o fluxo de spec.
`frontend/index.html` traz só metadados neutros, iguais para todas as rotas; o canonical
e a descrição de cada página pública são aplicados no navegador por
`frontend/src/seo/pageMeta.ts`, e os títulos por tela via `document.title`. Por isso a
auditoria usa o HTML renderizado (ver
[SEO técnico](#seo-técnico-das-páginas-públicas--spec-0051)).

`frontend/src/styles.css` define superfícies, texto, ações, estados semânticos e
foco no tema claro fixo. A aparência não segue a preferência de cor do sistema
operacional (`prefers-color-scheme`); a SPA não oferece seletor nem grava uma
preferência de tema. A ação principal padrão usa verde com texto preto; o rosa marca
links e destaques e, na tela do Assistente da 0040, também o envio aprovado no Figma.
Desde a 0028, os nomes não se repetem com significados
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

A spec 0030 consolida a apresentação sem mudar rotas, contratos ou ações. Os tokens
`--space-12` (48 px), `--space-16` (64 px), `--motion-fast` (160 ms) e `--ease-out`
organizam ritmo e feedback. Navegação ativa usa superfície rosa clara; hover e
foco visível distinguem os controles. Preços e contagens usam números tabulares.
Acima de 1100 px, a introdução do painel fica ao lado do formulário; em larguras
menores, os grupos se empilham. Indicadores mostram número acima do rótulo,
listas usam divisores suaves e o detalhe apresenta título antes do identificador.
Login tem coluna de formulário mais contida; a landing e a rota não encontrada
usam títulos proporcionais ao conteúdo. As artes, o gráfico e os estados reais
permanecem. A página reserva espaço para a navegação móvel e safe area; o modo de
movimento reduzido desativa animações e transições, inclusive shimmer.

A [auditoria da 0030](../../specs/0030-experiencia-visual-consistente/audit.md)
registra decisões do sistema existente, Figma e Spartan AI. O conector Figma
retornou `UNAUTHORIZED`, mas o arquivo foi inspecionado visualmente no Chrome,
complementado pelas exportações locais. A
[verificação](../../specs/0030-experiencia-visual-consistente/verification.md)
registra 350 testes Vitest e a rodada anterior de 128 casos Playwright em 320,
390, 768 e 1280 px. Após a correção de revisão de landing/login, lint, build e
350 testes Vitest passaram novamente, assim como 40 casos Playwright afetados,
sem atualizar baselines na confirmação. Os testes usam API simulada e não comprovam integração Mercado Livre real,
dispositivo físico, leitor de tela manual ou outros motores de navegador.

As prévias históricas de monitoramento contêm dados demonstrativos identificados
como exemplo; a landing atual (0050) não apresenta catálogo de ofertas. Produtos, preços e métricas da conta continuam vindo apenas da API.
A composição da 0027 usa conteúdo de até 1248 px, oportunidades em linhas e
navegação inferior da conta até 700 px. Os quatro indicadores existentes foram
preservados; desde a 0028 o Início sem produtos mostra só o convite do campo de
link, sem indicadores zerados, e Produtos abre na lista, com o campo de link
recolhido na ação compacta “Adicionar anúncio”. A verificação visual da spec 0015 (à época, com tema automático) foi feita em
Chromium nas larguras de 320, 768 e 1280 px, nos dois temas, com fixtures sintéticas
e um smoke local com API e
PostgreSQL isolados. Os resultados e limites estão em
[`verification.md`](../../specs/0015-redesign-design-system-oficial/verification.md).

## Tela de entrada — specs 0017, 0020, 0023, 0027 e 0046

Na rota `/login`, sem sessão, `App.tsx` renderiza `LoginForm` (`frontend/src/LoginForm.tsx`) direto,
sem o cabeçalho (masthead), o hero com o campo de link (spec 0020) ou o rodapé
(spec 0046). A composição
em duas metades da 0023 foi atualizada pela 0027 com a arte e a marca do redesign,
mantendo os controles e a autenticação existentes:

- **Composição:** `.login-shell` e `.login-card` ocupam a largura disponível. A
  superfície tem altura mínima `100svh`, sem reservar os antigos 72 px do rodapé;
  o conteúdo pode crescer e rolar verticalmente quando necessário. Acima
  de 840 px, o card divide a tela em duas metades, com arte à esquerda e formulário
  sobre branco à direita. Na correção de revisão da 0030, a marca oficial e o
  texto BestPrice passaram para a coluna do formulário, acima do título,
  sem sobreposição à fotografia e sem fundo branco adicional no ícone.
- **Coluna visual:** `.login-visual` usa `frontend/src/assets/redesign/login-left.webp`
  como fundo com `cover` e enquadramento pelo topo. A arte é ilustração estática,
  sem vínculo com anúncios ou com a conta. O elemento é decorativo (`aria-hidden`).
  Até 840 px, a coluna é ocultada. A marca permanece antes do título no formulário
  em todas as larguras. Tem nome acessível “BestPrice” e, desde
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

A implementação local da [spec 0046](../../specs/0046-login-stage-sem-rodape/spec.md)
preserva o login aprovado em stage e retira somente seu rodapé. A composição do
rodapé em `App.tsx` usa `matchPath('/login', location.pathname)`, o mesmo padrão
do roteador; isso inclui `/login/`, `/LOGIN` e a entrada com `returnTo`. A ausência
vale também durante carga, HTTP 503, falha de rede e recuperação da sessão.
Desde a [spec 0053](../../specs/0053-rotas-durante-consulta-sessao/spec.md), a
aba mostra “Entrar · BestPrice” durante toda a consulta e sua recuperação.
Landing, páginas autenticadas e rota inexistente conservam seus rodapés; desde a
spec 0048, `matchPath('/cadastro', …)` também omite o rodapé do cadastro.
A orientação sobre o link do Mercado Livre e “Voltar para o início” fazem parte
do formulário e permanecem visíveis.

Os quadros Figma de login desktop `59:44` (1440×1040) e mobile `59:602` (390×844)
foram atualizados pelo Chrome, com autorização expressa, e exportados em
04/11/2026. A implementação mantém as fontes do sistema da SPA; Arimo é apenas
a equivalência disponível no desenho e não foi importada no código. Referências,
QA com API controlada, revisão dos oito snapshots de login e limites estão na
[verificação da 0046](../../specs/0046-login-stage-sem-rodape/verification.md).
Essa validação local não comprova integração nem publicação em stage.

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

## Landing pública — spec 0050

`/` apresenta `LandingPage` em qualquer estado de sessão, inclusive autenticada.
Desde a [spec 0050](../../specs/0050-landing-publica-nova/spec.md), a landing segue os
quadros do Figma "01 · Landing · Desktop" (238:294), "Mobile" (239:180) e "Menu aberto"
(239:856). Ela é centrada no monitoramento, com o robô do BestPrice como narrador:

- **Seções, nesta ordem:** Hero ("Pare de dar F5 no preço."), Problema → virada, Como
  funciona, Demonstração, Por que BestPrice, Assistente, Perguntas, CTA final e rodapé.
  No mobile, há também a barra fixa "Pronto para parar de conferir?".
- **Dados:** todo dado de anúncio, preço e conversa é ilustrativo e fixo, e os valores
  "R$" ficam só em `landing/content.ts`. `content.test.tsx` libera apenas uma lista fechada
  desses valores. A landing não consulta preços, anúncios nem o assistente.
- **Destinos:** a tabela fica em `landing/destinations.ts`.
  - "Começar a monitorar", "Começar", "Monitorar um anúncio" e o envio com link levam a
    `/cadastro?returnTo=/app/monitoring` se o cadastro estiver ligado, ou a
    `/login?returnTo=/app/monitoring` se não estiver.
  - Com sessão confirmada, essas ações levam direto a `/app/monitoring`.
  - "Entrar" e "Já tenho conta" levam a `/login`, ou a `/app/dashboard` com sessão.
  - Sessão ou cadastro ainda em verificação, ou com falha, valem como "sem sessão" e
    "cadastro desligado". O `App` passa `authenticated` e `signupAvailable`.
- **Link do hero:** o formulário vem logo após o subtítulo em desktop e mobile.
  `navigation/pendingTrackLink.ts` guarda o link aparado em
  `sessionStorage`, só naquela aba e nunca na URL. O `AccountArea` consome o link uma vez
  na seção de produtos e o `HeroTrackForm` abre preenchido e com foco (`initialValue`),
  sem enviar nada.
  - Sair da conta descarta o link.
  - `/login` e `/cadastro` com sessão já confirmada respeitam o `returnTo` seguro.
  - Limite: duplicar a aba copia o `sessionStorage`.
- **Robô:** `landing/BestPriceRobot.tsx` reproduz o componente "Robô BestPrice" (237:35)
  nos estados neutral, scanning, alert e found. A arte é a mesma do assistente, em WebP
  de 480 px (`assets/research/assistant-robot-480.webp`). Só o robô do hero tem texto
  alternativo.
- **Movimento:** `landing/motion.ts` concentra os tempos das notas do Figma, com os hooks
  `useInView`, `useScrollProgress` (rAF e `--progress`) e `usePrefersReducedMotion`. Não
  há biblioteca de animação. Com movimento reduzido, tudo aparece no estado final.
  - O mini-robô (`ScrollCompanion`) aparece só a partir de 768 px, com `aria-hidden`.
  - O título, o campo e as ações do hero nunca esperam animação.
- **Fidelidade:** `designsystem/landing/figma-landing-texts-2026-11.json` e
  `figma-landing-metrics-2026-11.json` são snapshots históricos do Figma, conferidos por hash.
  - O parágrafo “Cole o link de um anúncio do Mercado Livre uma única vez.” foi removido da
    SPA e dos heróis desktop (238:295) e mobile (239:181) no Figma. Os testes de conteúdo e
    tipografia consideram essa alteração ao comparar com os snapshots.
  - `LandingPage.content.test.tsx` compara os textos com o snapshot e verifica a ausência do parágrafo.
  - `tests/visual/landing-metrics.spec.ts` compara tamanho, entrelinha e peso calculados.
  - `tests/visual/landing.spec.ts` cobre destinos, link, movimento, acessibilidade e CLS.
  - Divergências aprovadas: logo com 34 px, título sem fade, cabeçalho não fixo e cor de
    texto por token. O selo passou a "Só o link, nada para preencher". O registro está em
    `designsystem/README.md`.

Saíram de propósito "Começar com IA", "Abrir comparador" e "Criar conta" no cabeçalho.
O assistente e o comparador seguem na área logada.

Histórico: a landing da spec 0034 ("Compre com mais clareza.") foi substituída pela 0050.
A [verificação 0034](../../specs/0034-assistencia-compras-bestprice-ai/verification.md)
separa a rodada visual ampla anterior (129/132) dos oito casos afetados aprovados
após correção da marca. Somente oito baselines landing foram revisados e
atualizados, com confirmação posterior 8/8 sem update; login e 404 não tiveram
baselines alterados. A matriz ampliada de UI passou 38/38 em quatro larguras e
oito rotas, com axe, overflow, alvo de toque e teclado. Não comprova dispositivo
físico, leitor de tela ou disponibilidade do provider externo.

## SEO técnico das páginas públicas — spec 0051

A [spec 0051](../../specs/0051-seo-tecnico-landing-publica/spec.md) orienta buscadores e
prévias de link sem mudar o visual nem os textos visíveis. URLs absolutas usam a origem
pública `https://bestprice-stage.pages.dev` em qualquer ambiente.

- **`PUBLIC_ORIGIN`.** A origem fica na constante `PUBLIC_ORIGIN` de
  `src/seo/pageMeta.ts`. Ao trocar de domínio, mude-a ali e também em `index.html`
  (`og:image`), `public/robots.txt` e `public/sitemap.xml`.
- **`index.html` neutro.** A resposta inicial é a mesma para todas as rotas, então leva só
  metadados válidos para qualquer página: a descrição da landing, `og:type` `website`,
  `og:locale` `pt_BR`, `og:site_name`, `og:title` ("Monitor de preços do Mercado Livre ·
  BestPrice"), `og:description`, `og:image` absoluto (1200 × 630, com `alt`),
  `twitter:card` `summary_large_image` e o `apple-touch-icon`. **Não tem canonical nem
  `og:url`**, para não declarar o endereço de outra página. O `<title>` estático continua
  "BestPrice". Mensageiros não executam JavaScript, então a prévia de qualquer link do site
  usa esses metadados.
- **Metadados por rota (`src/seo/pageMeta.ts`).** `pageMetaFor(pathname, signupEnabled)`
  devolve canonical e descrição; `usePageMeta`, chamado no `AppRoutes` de `App.tsx`, cria
  ou atualiza `<link rel="canonical">` e `<meta name="description">` no `<head>`.
  - `/` e `/login` têm canonical autorreferente e descrição própria; `/cadastro` só quando
    o cadastro está `enabled` (desligado, ele leva ao login, spec 0048).
  - Áreas autenticadas e a página "não encontrada" ficam sem canonical (o hook remove o
    existente) e com a descrição da landing.
  - O hook depende só do caminho e do estado do cadastro, nunca da sessão: os metadados
    aparecem enquanto a sessão é verificada e quando a verificação falha.
- **Título da landing.** `pageTitle` em `src/landing/content.ts` passou a ser "Monitor de
  preços do Mercado Livre · BestPrice"; o H1 continua "Pare de dar F5 no preço.".
- **`public/robots.txt`.** Libera `/` e bloqueia `/app$`, `/app/`, `/produtos` e
  `/alertas`, com `Sitemap:` absoluto. `/app$` e `/app/` substituem `/app` porque a regra
  casa por prefixo e bloquearia `/apple-touch-icon.png`.
- **`public/sitemap.xml`.** Lista só `/` e `/login`. `/cadastro` entra quando o cadastro for
  ligado em definitivo (spec futura).
- **404 real e reescritas.** No Cloudflare Pages, o `404.html` gerado no build e as
  reescritas de `public/_redirects` fazem rota desconhecida responder 404 e rota da SPA 200;
  **toda rota nova em `App.tsx` precisa entrar no `_redirects`**. Detalhes e a diferença
  com o Nginx local estão em
  [infraestrutura](infraestrutura.md#rotas-da-spa-e-404-no-cloudflare-pages--spec-0051).
- **Ícones e imagem de compartilhamento.** `public/favicon.png` (48 × 48),
  `public/apple-touch-icon.png` (180 × 180) e `public/og-image.png` (1200 × 630) são gerados
  por `node scripts/generate-brand-assets.mjs` (em `frontend/`), **rodado manualmente** e
  fora do build; as saídas ficam versionadas. A arte-fonte do ícone (1254 × 1254) fica em
  `scripts/assets/favicon-source.png`, fora de `public/` para não ser publicada. A imagem de
  compartilhamento é renderizada pelo Playwright com o robô do assistente e os tokens e a
  fonte de `src/styles.css`, com o único texto "Monitor de preços do Mercado Livre". `sharp`
  é devDependency só para reduzir a paleta dos PNGs. O script aceita
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, como a suíte visual.
- **Testes.** `src/seo/pageMeta.test.tsx` cobre `pageMetaFor`, `usePageMeta` e o `App` com
  sessão pendente e com falha; `src/seo/staticSeo.test.ts` lê `index.html`, `robots.txt`,
  `sitemap.xml`, `_headers` e `_redirects` (este cruzado com as rotas do `App.tsx`);
  `scripts/not-found-page.test.ts` exercita o plugin do `404.html` num `dist` temporário.

Status, cabeçalhos e arquivos estáticos da borda não são reproduzidos pelo Vite; a
conferência deles no preview e em stage, a aprovação da imagem e do ícone e o SEO 100 no
Lighthouse estão como pendências na
[verificação da 0051](../../specs/0051-seo-tecnico-landing-publica/verification.md).

## Cadastro self-service — spec 0048

`useSignupAvailability` (`src/auth/`) consulta `GET /api/auth/signup` uma vez por
carregamento do `App` e devolve `loading`, `enabled`, `disabled` ou `error`. O
interruptor é decidido pela API, não por variável `VITE_*`, para ligar ou desligar
sem novo build do Pages. Só `enabled` mostra “Ainda não tem conta? Criar conta”
abaixo do botão do login e, desde a 0050, faz os CTAs de monitoramento da landing
levarem a `/cadastro` (o link “Criar conta” do cabeçalho da landing saiu na 0050). O
link do login leva o `returnTo` quando ele é
um destino interno válido. Em `/cadastro`, `loading` mostra “Carregando…” e `error`
mostra alerta com “Tentar novamente”; `disabled` redireciona a `/login` sem
formulário. `/cadastro` não tem rodapé, como o login, e tem o título “Criar conta ·
BestPrice”.

`src/auth/accountRules.ts` espelha `backend/app/auth/accounts.py`: limites de 320
caracteres no e-mail e 12–1024 na senha, contados em code points, a mesma classe de
caracteres proibidos em `EMAIL_PATTERN` e a mesma ordem de mensagens. O
`LoginForm` importa essa expressão e mantém o comportamento (senha só não vazia).
`SignupForm` tem e-mail, senha e confirmação com mostrar/ocultar, dica de 12
caracteres por `aria-describedby`, aviso de privacidade antes do botão e validação
própria no envio (`noValidate`), com foco no primeiro campo inválido. A confirmação
diferente é verificada só na interface. Respostas do servidor viram mensagens por
campo (`422` pelo `code`; `409` no e-mail com link “Entrar”) ou alerta `role="alert"`
(`429` com “Tente novamente em N minutos”, `404` de cadastro indisponível e falha de
rede/5xx). Durante o envio, o botão mostra “Criando conta…” com `aria-busy`; uma
região `role="status"` anuncia o resumo dos erros de campo, inclusive ao repetir
o envio. O e-mail digitado é preservado; senha e
confirmação são limpas após erro do servidor. No sucesso, o fluxo segue o login:
destino de `returnTo` validado por `safeReturnTo` ou `/app/dashboard`. `api.ts`
acrescenta `signupStatus()`, `signup()` e `fields` em `ApiFailure`.

Referência Figma, no [arquivo BestPrice IA](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA),
aprovada pela responsável em 06/11/2026: cadastro desktop `220:347` (1440×1040),
foco `220:382`, enviando `220:421`, erros de campos `220:459`, e-mail já cadastrado
`220:505`, limite `220:546` e falha de rede `220:588`; mobile `220:871` (390×899),
`220:900`, `220:933`, `220:965`, `220:1005`, `220:1040` e `220:1076`. Login ajustado
em `59:44`/`59:602`, landing desktop `16:2` e menu móvel aberto `224:2`. A tabela
completa e os PNGs estão em
[figma-frames.md](../../specs/0048-cadastro-self-service-usuarios/design/figma-frames.md);
as extensões visuais (dica, ícone de erro, atalho entre telas sublinhado por
acessibilidade, botão contornado na landing) estão em `designsystem/README.md`. A
[verificação da 0048](../../specs/0048-cadastro-self-service-usuarios/verification.md)
registra lint, 531 testes Vitest, build, `tests/visual/signup.spec.ts` com 24
cenários aprovados e axe WCAG 2.2 AA sem violações, além das diferenças visuais
aceitas e das 19 falhas visuais pré-existentes em outras suítes. Não houve teste
com leitor de tela real nem verificação em Stage.

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

## Rotas e fluxo atual — spec 0034

A SPA usa `react-router-dom`, o contrato de monitoramento existente e o novo
cliente tipado `features/research/api.ts`. `App.tsx` consulta `GET /api/auth/me`
ao abrir ou restaurar a página pelo histórico. Um 401 identifica visitante. Login,
cadastro e áreas protegidas exibem o estado de carregamento enquanto aguardam a
sessão e oferecem “Tentar novamente” quando a consulta falha. A landing e o 404
público são renderizados desde o início.
A conta é criada pelo cadastro self-service, quando ligado (spec 0048), ou
provisionada no backend antes do login.

| URL | Conteúdo e acesso |
|---|---|
| `/` | Landing pública, inclusive com sessão válida |
| `/login` | Entrada; sessão válida segue para `/app/dashboard` ou retorno conhecido |
| `/cadastro` | Criar conta (0048); com sessão segue para `/app/dashboard`; com o cadastro desligado redireciona a `/login` preservando `returnTo` |
| `/app` | Redireciona para `/app/dashboard` após autenticação |
| `/app/dashboard` | Necessidade de compra, sugestões editáveis e seis pesquisas recentes |
| `/app/assistant`, `/app/assistant/:id` | Nova conversa ou conversa própria salva |
| `/app/compare`, `/app/compare/:id` | Nova comparação manual ou comparação própria salva |
| `/app/history` | Conversas salvas, busca por título, paginação, Continuar e exclusão confirmada (0045) |
| `/app/monitoring` | Lista de monitoramentos e formulário “Adicionar anúncio” |
| `/app/monitoring/overview` | Painel completo de acompanhamento anterior |
| `/app/monitoring/:id` | Detalhe do vínculo próprio, histórico, alerta e ações |
| `/app/monitoring/alerts` | Alertas configurados e notificações |
| `/produtos`, `/produtos/:id`, `/alertas` | Destinos anteriores preservados de lista, detalhe e alertas |

Visitante segue para `/login?returnTo=...` e retorna ao caminho protegido após
entrar. `safeReturnTo` aceita somente caminhos internos conhecidos, incluindo os
novos destinos, sem query/fragmento ou escapes. Entrada direta no login leva ao
dashboard. Logout vai a `/login`; restauração por bfcache revalida a sessão.
`ResearchArea` e `AccountArea` são isoladas pela chave `user.id`; respostas obsoletas
são ignoradas após desmontagem. Quando a rota curinga corresponde ao endereço,
`NotFoundPage` exibe “Este endereço saiu do radar.” mesmo durante a consulta da
sessão ou após uma falha. A página define “Página não encontrada · BestPrice”
na aba e move o foco para seu título. Até a confirmação da sessão, a ação
principal é “Entrar”. A navegação nas áreas internas marca a seção ativa.

## Assistente, comparação e histórico — spec 0034

`features/research/ResearchArea.tsx` organiza dashboard, navegação lateral e
atalhos móveis. O dashboard transporta rascunho por token em estado de navegação;
o texto fica no Map da montagem autenticada, sem persistir conteúdo no histórico
do browser. Categorias apenas preenchem texto editável. A chamada de IA exige
outra ação explícita na tela do assistente, após a informação sobre Google,
possível uso do conteúdo gratuito e dados pessoais/confidenciais. A retenção local
de 90 dias permanece na política e no histórico. A interface consulta capabilities e
mantém envio/análise indisponíveis quando a configuração falta, sem impedir
leitura das pesquisas e salvamento manual.

`AssistantPage` carrega mensagens próprias, mostra carga, vazio, erro recuperável
e envio ocupado com trava contra duplicação. Texto de IA é renderizado como texto,
identificado como não verificado, sem executar HTML/Markdown (o HTML de sugestões
da spec 0047 fica isolado em iframe com sandbox, descrito adiante). Mensagem tem até
2.000 caracteres; conversas longas usam contexto recente limitado. IDs são
`crypto.randomUUID()`: falha de rede reaproveita o request ID dentro de 24 h para
consultar o resultado; falha conhecida permite nova tentativa explícita.

`ComparisonPage` aceita 2–3 produtos com nome, detalhes, preço BRL e link opcional.
Preço ausente continua null; valores pt-BR são normalizados em string, sem float.
Os dados são manuais e não verificados, e os links não são consultados. Salvar é
ação própria sem IA; análise só ocorre após salvar os dados atuais. Edição invalida
a análise anterior. Conflito de versão exige recarga; erro de GET inicial não
permite edição insegura. A tabela usa somente dados fornecidos pela pessoa; a
análise textual não transforma informações ausentes em fatos verificados.

O histórico misto original foi substituído pela apresentação de conversas da
spec 0045, descrita abaixo. A API de pesquisas e as comparações salvas continuam
disponíveis; a retenção de 90 dias desde a criação não se renova por edição.

Gates locais registrados: 366/366 testes da suíte completa e 18/18 afetados finais,
lint e build aprovados (2.658 módulos). Jornadas SPA/API/PostgreSQL reais passaram
4/4 e cenários de erro 6/6 no schema final, com fixture somente na geração externa.
AC10/AC15/AC19 ainda dependem de avaliação operacional do modelo real e de sua
configuração gratuita; a spec continua `pronta`. Ver [evidências](../../specs/0034-assistencia-compras-bestprice-ai/verification.md).

## Histórico de conversas — spec 0045

`HistoryPage` apresenta “Suas conversas” e consulta o cliente tipado existente por
`GET /api/research?kind=conversation&q=<título>&offset=<n>&limit=20`. Não há filtro
de tipo. Buscar com Enter ou pelo botão de ícone aplica o título sem espaços nas
extremidades e volta à primeira página; a paginação preserva o termo. Limpar o
campo e enviar recupera todas as conversas. Respostas de consultas anteriores
são descartadas. O contrato REST e a persistência não mudaram.

Cards mostram título, data real de atualização no fuso local e “Continuar” para
`/app/assistant/:id`. Desktop organiza ações ao lado do conteúdo; mobile as coloca
abaixo, mantendo Excluir acessível. A composição usa `history.css`, `Button`,
`Input`, `Brand` e tokens existentes, com estados de carregamento, primeiro uso,
busca sem resultados e erro com nova tentativa. O prazo de 90 dias da criação
continua visível. A API fornece os dados; exemplos do Figma não preenchem contas.

Excluir abre `DeleteResearchDialog`, compartilhado com as demais pesquisas. O foco
inicial vai a Cancelar; fechar devolve o foco ao acionador conectado, ou ao título
estável da página quando o acionador desaparece. A confirmação envia
`DELETE /api/ai/conversations/:id`; somente sucesso fecha o diálogo e recarrega a
primeira página da mesma busca. Falha conserva o diálogo e permite tentar de novo;
401 usa o tratamento existente de sessão expirada. O conteúdo e o contrato de
exclusão das outras pesquisas foram preservados.

Referência visual: Figma BestPrice IA, frames 59:204 (1440×1040) e 59:716
(390×844), exportações identificadas da spec 0043 de 31/10/2026. O MCP retornou
limite do plano Starter; não foi comprovada paridade com alterações remotas
posteriores. Datas reais, exclusão mobile e aviso de retenção substituem elementos
ilustrativos; bordas de controles preservam o token acessível. A comparação e os
limites estão na [verificação da 0045](../../specs/0045-historico-conversas-conforme-figma/verification.md).
Lint/build aprovados, 390 testes Vitest completos e 9 focados finais, 20 cenários
Playwright com teclado, axe e overflow em quatro viewports; não houve validação
com backend/banco reais, teclado virtual, leitor de tela ou deploy nesta revisão.

## Assistente e navegação compartilhada — specs 0040 e 0044

O Assistente inicial usa o robô original de
`src/assets/research/assistant-robot.png`, com transparência e proporções
preservadas, pergunta “O que você quer comprar?” e campo de mensagem em destaque.
A simplificação da 0044 aplica os cortes editoriais aprovados no desktop também
ao mobile: ajuda opcional curta e um exemplo de orçamento no campo, sem atalhos
de sugestões ou acesso separado Sobre a IA na tela principal. Ao iniciar ou retomar uma
conversa, as mensagens ocupam o espaço principal e o robô aparece apenas como
avatar discreto das respostas. O botão de envio usa a variante `brand` do `Button`,
com `--primary` e `--primary-foreground`; o padrão das outras ações não muda.

`RecentConversations` consulta o contrato existente por
`GET /api/research?kind=conversation&q=&offset=0&limit=4`. A API mantém autorização,
expiração e ordem por atividade. A seção mostra título, data no fuso local e link
para retomar, sem pictogramas ou conteúdo ilustrativo. Nova conversa fica junto
da seção; Ver todas abre o histórico. O primeiro envio e os envios seguintes
recarregam a lista. Carga, vazio e erro com nova tentativa são independentes do
chat; uma falha na lista não apaga nem impede editar o rascunho. Respostas de
requisições desmontadas são descartadas, inclusive ao trocar de conta. O acesso
começa recolhido em desktop e mobile, usando `useDisclosure`: Escape fecha e
devolve foco ao acionador, clique fora ou saída do foco fecha o painel. Abrir e
fechar não navega, não remonta a conversa, não apaga o rascunho e não envia mensagem.

O shell de `/app/*` acompanha os três destinos da referência Figma atual:
Assistente IA, Histórico e Monitoramento. Desktop usa sidebar de 240 px e header
de 80 px; mobile usa menu, marca com IA elevada, conta e três atalhos inferiores.
Dashboard e comparador mantêm páginas, rotas, dados e APIs, embora seus atalhos
tenham saído dessa navegação. A landing e a entrada preservam a composição pública.

Em `/app/monitoring`, `AccountArea` e `AppHeader` recebem `embedded`: o shell
fornece marca e conta uma única vez, enquanto a subnavegação Início/Produtos/Alertas
e o sino permanecem no fluxo, sem disputar o rodapé móvel. Os links dessa
subnavegação usam os caminhos internos de monitoramento. O modo anterior e seus
links `/produtos` e `/alertas` permanecem disponíveis. O foco de título agendado
não toma o foco quando a pessoa já interagiu com outro controle; a saída por Tab
para o botão do menu aplica-se somente ao menu móvel aberto.

`assistant.css` organiza uma coluna de tarefa e um painel de recentes sobreposto,
com altura limitada e rolagem própria. O aviso essencial sobre Google, uso gratuito
e dados pessoais fica dentro do formulário antes do envio. `aria-describedby`
contém só o limite de 2.000 caracteres e, quando restam 200 ou menos, o contador.
A resposta identifica BestPrice IA; dados não verificados ficam no nome acessível
do artigo e no título contextual do autor, sem repetir o rodapé visual removido.
Retenção, cota e contratos não mudam; `AIInformation` compartilhado continua intacto
para comparação. A implementação não ativa o fornecedor de IA.

A [verificação 0040](../../specs/0040-assistente-ia-com-robo/verification.md)
registra 375 testes da suíte completa antes dos ajustes finais, 47 testes afetados
após os ajustes, 32 cenários Playwright e quatro verificações finais de navegação,
lint/build e revisão independente. `tests/visual/assistant.spec.ts` verifica
320/390/768/1280 px, axe nos estados inicial/conversa, geometria do robô,
toque, overflow e navegação. Capturas aprovadas estão na pasta `evidence/` da
spec. As APIs são controladas: teclado virtual em aparelho real, backend/banco
reais e disponibilidade operacional da IA continuam pendentes.

A [verificação 0044](../../specs/0044-assistente-com-menos-sobrecarga/verification.md)
registra a simplificação local: lint/build aprovados, 381 testes Vitest em 34
arquivos com `--maxWorkers=2`, 32 cenários Playwright nos quatro viewports e captura
adicional 390 × 844. Nesse tamanho, aviso e envio aparecem antes da navegação fixa,
sem teclado virtual. Testes cobrem recentes recolhidos, foco, rascunho sem POST,
contador contextual, estados e texto longo. Revisão independente e QA locais
aceitas; publicação, CI remoto e integração em develop ainda pendentes.

## Pesquisa na web no Assistente — spec 0047

`features/research/api.ts` acrescenta `Message.grounding` (`null`, `searched` ou
`unavailable`) e `Capabilities.web_search`. O validador exige, em `searched`,
`searched_at` instantâneo, pelo menos uma fonte com URL `https` (`safeHttpsUrl`) e
HTML de sugestões em string; em `unavailable`, `sources: []`, HTML `null` e
`searched_at` opcional. Mensagens anteriores sem o campo viram `null`, e capabilities
sem `web_search` viram `false`; essa normalização ocorre dentro do type guard, que
muta o objeto recebido (achado S3 da revisão, aceito nesta entrega). Uma fonte que o
backend aceita e `new URL()` rejeita invalida a resposta inteira (S4, risco baixo).

`MessageGrounding.tsx` aparece abaixo de cada resposta do assistente:

| `grounding` | Interface |
|---|---|
| `null` | Nada |
| `unavailable` | Nota "A pesquisa na web está indisponível agora; esta resposta não usou a web." |
| `searched` | Região "Fontes da pesquisa na web" com rótulo **Não verificado**, "Pesquisado em" (`<time>` e `Intl` pt-BR no fuso local), lista de fontes e sugestões do Google |

As fontes abrem com `target="_blank"` e `rel="noopener noreferrer"`, sem handler de
clique, e têm nome acessível "… (abre em nova aba)" e altura mínima de 44 px. Os
termos do Google proíbem alterar as sugestões, então o HTML vai intacto num iframe
`srcDoc` com `sandbox="allow-popups allow-popups-to-escape-sandbox"` (sem scripts,
mesma origem ou formulários), `referrerPolicy="no-referrer"` e `title`. O `srcDoc`
recebe um prefixo fixo `<base target="_blank"><meta name="referrer" content="no-referrer">`
para que os chips abram em nova página sem `Referer`. O iframe tem altura fixa de
72 px. Com `capabilities.web_search`, o aviso essencial do composer acrescenta
`webSearchNotice` (`common.tsx`): a pergunta pode ser pesquisada pelo Google, que
guarda pergunta e resposta por 30 dias. `AIInformation` da comparação não muda.
O estilo em `assistant.css` usa somente tokens existentes; não há frame Figma para o
bloco.

`src/assistant.test.tsx`, `features/research/api.test.ts` e
`tests/visual/grounding.spec.ts` cobrem contrato, estados, prefixo do `srcDoc`,
popup sem `Referer`, foco, teclado, axe (iframe excluído) e overflow em
320/390/768/1280/1440 px, com API simulada. O HTML real de `renderedContent` e a
adequação dos 72 px seguem sem validação; tema escuro não se aplica (tema claro
fixo). A suíte completa registrou intermitência preexistente em `App.test.tsx`,
fora do diff. Ver [evidência frontend](../../specs/0047-chat-pesquisa-precos-web-gemini/frontend-evidence.md)
e [verificação](../../specs/0047-chat-pesquisa-precos-web-gemini/verification.md).

## Monitoramento preservado

O monitoramento oferece links Início/Produtos/Alertas e sino; o acesso à conta fica no cabeçalho próprio das rotas anteriores ou no shell compartilhado de `/app/monitoring` (0040). Em Início ou Produtos, o mesmo formulário recebe o link do anúncio; o preço desejado continua opcional no detalhe. Em Produtos com lista, o formulário fica recolhido: “Adicionar anúncio” usa `aria-expanded`/`aria-controls`, foca o campo ao abrir e, ao recolher, limpa erro e sucesso do último envio. Nas rotas de monitoramento, a consulta de sessão exibe a marca e o estado de carregamento. Em caso de falha, a tela oferece “Tentar novamente”. O formulário exige sessão confirmada (0028/AC14). O sucesso de cadastro mantém a rota, distingue 201 (“Produto adicionado ao monitoramento.”) de 200 (“Você voltou a monitorar este produto.”) e oferece “Ver produto”. Sem monitoramentos, o formulário ganha destaque e orienta o primeiro cadastro. A lista de Produtos conserva preço, variação, disponibilidade, horários, paginação e ações de linha; abaixo de 960 px a linha fica compacta (imagem, título, preço, pílula de variação e seta) e a linha inteira abre o detalhe, onde ficam disponibilidade, horários, “Atualizar agora” e “Parar de monitorar”. O rótulo “vs. preço anterior” fica fora da pílula. Lista, oportunidades, atualizações e notificações levam por link a `/produtos/:id`; o detalhe consulta esse ID diretamente, preserva histórico paginado, alerta (criar, editar, pausar, excluir), atualização e link externo. No alerta, cada controle tem uma única função: salvar o alvo, pausar/retomar e excluir (`outline`); “Parar de monitorar” usa a variante `destructive`. Pausar ou retomar preserva o rascunho do campo. Os metadados da consulta ficam recolhidos em “Detalhes da consulta” (`<details>`), sem repetir “sem frete”.

O preço-alvo aceita o formato brasileiro (spec 0028): `src/lib/targetPrice.ts` normaliza `99,90`, `99.90`, `1.899,90`, `1899,9` e o prefixo `R$` para o decimal do contrato (`"99.90"`), só com texto, sem `number`. Valor inválido, zero, acima de 16 dígitos inteiros ou com milhar iniciado por zero (`0.500`) não chama a API: o campo recebe `aria-invalid` e a mensagem “Informe um valor em reais, como 99,90.” em `role="alert"`. O campo de edição mostra o alvo atual com vírgula. O contrato REST `target_price` e o backend não mudaram. Monitoramento interrompido aberto por URL informa seu estado e não oferece atualização, configuração de alerta ou parada.

Em Alertas, `ConfiguredAlerts` percorre páginas de monitoramentos para alcançar alertas ativos e pausados, inclusive além da primeira página; a consulta prossegue por páginas sem alertas até encontrar um ou esgotar a lista. O grupo de notificações mantém o histórico recebido, paginação e leitura explícita. Cada grupo tem seus próprios estados de carga, erro com retry e vazio. Abrir o produto não marca a notificação como lida. “Carregar mais” nas listas e no histórico usa `next_cursor` e evita IDs duplicados.

| Arquivo | Responsabilidade |
|---|---|
| `frontend/src/App.tsx` | `BrowserRouter`, rotas, consulta e revalidação de sessão, login, retorno seguro e títulos; recebe o relógio injetável (`clock`) |
| `frontend/src/landing/` | Landing pública da 0050: seções, robô, gráfico em degraus, menu móvel (Sheet), mini-robô, barra fixa, destinos e movimento |
| `frontend/src/navigation/pendingTrackLink.ts` | Link do hero guardado na aba até o primeiro uso no monitoramento (0050) |
| `frontend/src/assets/redesign/` | Arte do login (`login-left.webp`); as artes da landing antiga foram removidas na 0050 |
| `frontend/src/LoginForm.tsx` | Entrada da 0027: arte e marca, validação própria, “Mostrar senha”, envio único e foco em Senha após falha |
| `frontend/src/NotFoundPage.tsx` | 404 público, título e foco da página, ação principal por sessão e ação de voltar |
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

O cliente consome `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`, `/api/auth/signup` (GET e POST, spec 0048), `/api/dashboard`, `/api/tracked-products`, seus subrecursos `history`, `refresh` e `alert`, além de `/api/notifications` (todas e `unread_only`). Usa `credentials: 'same-origin'`; Vite e Nginx encaminham `/api` ao FastAPI localmente. Em stage, `frontend/functions/api/[[path]].ts` encaminha `/api/*` à origem HTTPS indicada por `API_ORIGIN` no Cloudflare Pages. A Function preserva método, caminho, consulta, corpo, cookie e resposta da API, inclusive `Set-Cookie`; origem inválida ou falha de rede gera 502 genérico. Desde a spec 0048, a Function remove os cabeçalhos `x-bestprice-*` do pedido do cliente e da resposta da API; com `API_PROXY_SECRET` configurado no Pages, envia `x-bestprice-proxy-secret` e `x-bestprice-client-ip` (copiado de `cf-connecting-ip`) para a API identificar a origem do cadastro, sem devolver o segredo (`pagesProxy.test.ts`). `frontend/public/_routes.json` inclui só `/api/*`, portanto as páginas estáticas não invocam a Function. O build copia esse arquivo para `dist/`. O proxy foi testado localmente e o health público de stage foi verificado na spec 0018; a nova navegação da 0021 ainda não foi verificada em stage. Valores monetários chegam como strings decimais: `Intl.NumberFormat` os formata sem conversão para `number`, e a direção de um evento de preço vem de `compareDecimal`. Resposta fora do contrato vira “A API respondeu com dados inválidos.”; erro sem `code` e `message` vira a mensagem genérica, e falha de rede, “Não foi possível conectar ao BestPrice. Tente novamente.”.

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

## Design system 2026 — spec 0049

- **Tokens e componentes:** os tokens do Figma 2026 ficam em `src/styles.css`, conferidos contra
  `designsystem/tokens/figma-variables-2026-11.json` por `src/tokens.figma.test.ts`. A tabela 1:1 é
  gerada por `node scripts/token-table.mjs`. Os componentes estão em `src/components/ui/`, e a
  correspondência de variantes (Figma `action` → `default`, `default` → `brand`), os status do Badge
  e as divergências aprovadas ficam em `designsystem/README.md`.
- **Catálogo:** `/dev/design-system` abre só no servidor de desenvolvimento (`npm run dev`), por
  `import.meta.env.DEV` e lazy import. Em build de distribuição, o endereço mostra a página "não
  encontrada".
- **`npm run build:check`:** faz o build e roda `scripts/check-no-catalog.mjs` (nenhum vestígio do
  catálogo no `dist/`) e `scripts/check-fonts.mjs` (Geist Mono só em latin e latin-ext 400–600,
  nunca em base64). O CI do frontend usa esse comando no lugar de `npm run build`.
- **Evidência da 0049:** `tests/visual/evidence-0049.spec.ts` regrava as capturas da lista A em
  `specs/0049-design-system-2026-no-codigo/evidence/app/`. É pulado sem a variável; para regravar:
  `EVIDENCE_0049=1 npx playwright test tests/visual/evidence-0049.spec.ts --project=viewport-1440`.
  O projeto `viewport-1440` roda só `catalog.spec.ts` e esse spec.
- **Evidência da 0050:** `tests/visual/evidence-0050.spec.ts` grava as capturas da landing por
  seção (1440 e 390 px) e o menu aberto em `specs/0050-landing-publica-nova/evidence/app/`. É
  pulado sem a variável e fora do projeto `viewport-1280`; para regravar:
  `EVIDENCE_0050=1 npx playwright test tests/visual/evidence-0050.spec.ts --project=viewport-1280`.
- **Outros specs da 0049:**
  - `catalog.spec.ts` captura as seções do catálogo;
  - `ds-measures.spec.ts` mede estilos calculados, cor do destino ativo, contraste 3:1 e axe/44 px
    no comparador;
  - `monitoring-overflow.spec.ts` confere que não há rolagem lateral com a barra lateral entre 1024
    e 1440 px;
  - `assistant-hero.spec.ts` posiciona mascote e halo;
  - `wide-titles.spec.ts` simula títulos expandidos a 320 px.

## Testes e verificação

Em `frontend/`: `npm ci`, `npm run lint`, `npm test -- --run` e `npm run build` (ou `npm run build:check`, usado no CI desde a 0049). Vitest roda em jsdom com `TZ=America/Sao_Paulo` fixo, `testTimeout` de 15 s e `asyncUtilTimeout` de 6 s (`vite.config.ts` e `src/test-setup.ts`; aumentado de 3 s na 0028 após falhas intermitentes sob carga, descritas na [verificação da 0028](../../specs/0028-ajustes-auditoria-redesign/verification.md)); as interações usam `@testing-library/user-event`. Os testes ficam ao lado do código (`src/**/*.test.ts(x)`). `src/test/fakeApi.ts` substitui `fetch` por um roteador com fixtures no formato exato do contrato; rota não prevista é registrada e o `afterEach` global de `src/test-setup.ts` reprova o teste. `src/test/productsHarness.tsx` renderiza a `App` com rota inicial e relógio fixo. `src/content.test.tsx` impede citações a Amazon, prime, estrelas/avaliações e preços fixos no código TypeScript/CSS da interface. Dados de exemplo de listas ficam nas fixtures; as artes públicas são ilustrações estáticas identificadas. Os resultados da navegação por URL estão na [verificação da spec 0021](../../specs/0021-navegacao-por-rotas/verification.md).

A regressão visual (specs 0025, 0027, 0028 e 0029) roda por Playwright com `npm run test:visual`.
`frontend/playwright.config.ts` sobe o Vite em `http://127.0.0.1:5173` e define os
projetos `viewport-320`, `viewport-390`, `viewport-768` e `viewport-1280` (a 0049 acrescentou `viewport-1440`, só para evidência e sem baselines; ver a seção da 0049);
`frontend/tests/visual/public-pages.spec.ts` captura landing, login e página não
encontrada, com `GET /api/auth/me` interceptado em 401 para um estado de visitante
determinístico, sem backend, e com o esquema de cor claro/escuro emulado pelo
Playwright (a SPA permanece no tema claro fixo descrito acima). Os baselines ficam em
`frontend/tests/visual/__screenshots__/` e mudam só por revisão explícita
(`--update-snapshots`, com o diff mostrado); o Vitest exclui `tests/visual/**`.
A suíte é local: não roda no CI e os baselines dependem das fontes da máquina.
A evidência inicial está na [verificação da spec 0025](../../specs/0025-harness-design-tooling/verification.md).

Com a spec 0052, as capturas da landing emulam movimento reduzido e também
simulam `GET /api/auth/signup` com `{ enabled: false }`.
O limite de 12 pixels divergentes vale para as capturas da landing em 320 e
390 px nos dois temas e cobre a variação de rasterização observada nos PNGs
de referência. Em `landing.spec.ts`, o cenário A1 abre a página uma vez,
espera o estado final do robô e mede os quatro limites do selo “menor preço”
no painel da Demonstração em 320, 390, 768, 1280 e 1440 px.

Para reproduzir a rodada completa da 0052, execute `npm run test:visual -- --workers=4`
em `frontend/`, separadamente do Vitest. As exclusões por projeto correspondem
aos cenários que usam larguras específicas. [Verificação da spec 0052](../../specs/0052-suite-visual-estavel/verification.md).

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
