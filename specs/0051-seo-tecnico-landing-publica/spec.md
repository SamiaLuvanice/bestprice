---
numero: 0051
titulo: SEO técnico das páginas públicas
tipo: melhoria
prioridade: P2
status: pronta
toca: [frontend, docs]
depende_de: [0048, 0050]
issue: https://github.com/SamiaLuvanice/bestprice/issues/287
---

# 0051 — SEO técnico das páginas públicas

Issue: [#287](https://github.com/SamiaLuvanice/bestprice/issues/287).

## Problema e público

Quem procura no Google uma forma de acompanhar preços no Mercado Livre deveria encontrar
a landing do BestPrice, e quem recebe o link por mensagem deveria ver uma prévia
reconhecível. Hoje os buscadores encontram um site que responde "existe" para qualquer
endereço e não recebem nenhuma orientação sobre o que indexar.

Auditoria de SEO em [stage](https://bestprice-stage.pages.dev) em 10/11/2026 (skill
`seo-audit`, `curl` e Lighthouse 12 local, perfil mobile), sem acesso ao Search Console:

- Qualquer URL responde `200 text/html` com a mesma página de 662 B, inclusive
  `/robots.txt`, `/sitemap.xml`, `/pagina-que-nao-existe` e `/assets/naoexiste.js`.
  O Lighthouse reprova "robots.txt is not valid" (SEO 92). Páginas inexistentes viram
  "soft 404" e as áreas autenticadas ficam expostas ao rastreamento como cópias da mesma
  casca.
- O ícone do site (`/favicon.png`) transfere 480 KiB, quase dois terços dos 757 KiB
  transferidos pela landing.
- Os arquivos versionados por hash (`/assets/*`) são servidos com
  `Cache-Control: public, max-age=0, must-revalidate`, forçando revalidação a cada visita.
- Não há endereço canônico, metadados de compartilhamento (Open Graph/Twitter) nem
  descrição própria para Entrar e Criar conta.
- O título da landing é "BestPrice · Pare de dar F5 no preço.", sem o termo que as pessoas
  buscam.

Melhoria P2: não bloqueia uso, mas o stage é hoje o único ambiente público e a vitrine do
produto. Afeta visitantes anônimos, buscadores e quem compartilha o link.

## Decisões da responsável pelo produto (10/11/2026)

- As páginas públicas do stage devem ser indexáveis até haver domínio de produção; as
  áreas autenticadas não devem ser rastreadas.
- O título da landing passa a ser **"Monitor de preços do Mercado Livre · BestPrice"**.
- O H1 "Pare de dar F5 no preço.", o conteúdo e o visual da landing não mudam.

## Comportamento esperado

Buscadores encontram em `/robots.txt` regras válidas que liberam as páginas públicas e os
recursos necessários para renderizá-las, deixam de rastrear as áreas autenticadas e
indicam o sitemap. O sitemap lista apenas as páginas públicas que existem de fato no
ambiente. Endereços que não pertencem ao site respondem como inexistentes, enquanto a
pessoa continua vendo a página "não encontrada" atual; rotas existentes, incluindo acesso
direto e recarga em rotas profundas da área logada, continuam abrindo como hoje.

Depois de carregada no navegador, cada página pública declara seu próprio endereço
canônico e sua descrição, mesmo enquanto a sessão é verificada ou quando essa verificação
falha. A resposta inicial do servidor, igual para todas as rotas, carrega apenas
informações do produto válidas para qualquer página — nunca o endereço canônico ou o
endereço de outra página. Assim, o link compartilhado em mensageiros e redes sociais
exibe título, descrição e imagem da marca. O ícone do site mantém a aparência atual com
peso de ícone, e os arquivos versionados passam a ser reaproveitados do cache do
navegador entre visitas.

### Textos

| Página | Descrição (meta description) | Caracteres |
|---|---|---|
| Landing `/` | Monitore preços de produtos do Mercado Livre com a BestPrice. Acompanhe históricos, receba alertas de queda de preço e encontre o melhor momento para comprar. | 158 |
| Entrar `/login` | Entre na sua conta BestPrice para ver seus anúncios do Mercado Livre monitorados, o histórico de preços e os alertas de queda. | 126 |
| Criar conta `/cadastro` | Crie sua conta no BestPrice e comece a monitorar preços de anúncios do Mercado Livre colando apenas o link do produto. | 118 |

A descrição da landing é a atual. Os metadados de compartilhamento usam o título e a
descrição da landing. Todas as afirmações valem para o comportamento atual do produto.

## Critérios de aceite

URLs absolutas usam a origem pública `https://bestprice-stage.pages.dev` em qualquer
ambiente.

- [x] **AC01 — robots.txt válido:** `GET /robots.txt` responde 200 com `text/plain`; não bloqueia `/`, `/login`, `/cadastro`, `/assets/` nem `/api/`; bloqueia o rastreamento de `/app` (com e sem subrota), `/produtos` e `/alertas`; declara o sitemap por URL absoluta. O Lighthouse não reprova "robots.txt is not valid".
- [x] **AC02 — Sitemap:** `GET /sitemap.xml` responde 200 com XML válido do protocolo sitemaps.org contendo exatamente as URLs absolutas de `/` e `/login`. `/cadastro` não entra enquanto o cadastro estiver desligado por padrão (spec 0048).
- [x] **AC03 — 404 real:** uma rota desconhecida (ex.: `/pagina-que-nao-existe`) e um arquivo inexistente (ex.: `/assets/naoexiste.js`) respondem com status 404; no navegador, a rota desconhecida continua mostrando a página "não encontrada" atual, com o título "Página não encontrada · BestPrice".
- [x] **AC04 — Rotas preservadas:** acesso direto e recarga em `/`, `/login`, `/cadastro`, `/produtos`, `/produtos/<id>`, `/alertas`, `/app` e `/app/<subrota>` respondem 200 e mantêm o comportamento atual no navegador, incluindo redirecionamentos de sessão e o envio de `/cadastro` para Entrar quando o cadastro está desligado. As mesmas rotas com barra final nunca respondem 404 e mantêm o comportamento atual no navegador. `/api/*` continua atendido pelo backend.
- [x] **AC05 — Título da landing:** o título de `/` no navegador é "Monitor de preços do Mercado Livre · BestPrice"; o H1 continua "Pare de dar F5 no preço." e nenhum outro texto visível muda.
- [x] **AC06 — Canonical e descrições após carregar:** no navegador, `/` e `/login` — e `/cadastro` quando o cadastro está ligado — têm canonical autorreferente com URL absoluta e a descrição da tabela "Textos". Isso vale também enquanto a sessão é verificada e quando a verificação falha. Áreas autenticadas e a página "não encontrada" não declaram canonical.
- [x] **AC07 — Resposta inicial neutra:** a resposta HTML do servidor, sem executar JavaScript, é igual para todas as rotas e não contém canonical nem `og:url`. Ela contém `og:title`, `og:description`, `og:type` (`website`), `og:locale` (`pt_BR`), `og:site_name`, `og:image` com URL absoluta, `twitter:card` `summary_large_image` e a descrição da landing.
- [x] **AC08 — Imagem de compartilhamento:** a imagem tem 1200 × 630 px, no máximo 300 KB, e é composta só por elementos existentes da marca (logotipo, robô e cores do design system), com no máximo o título aprovado como texto. A responsável aprova a imagem, registrada em verification.md.
- [x] **AC09 — Ícone leve:** cada arquivo de ícone servido tem no máximo 16 KiB; há ícone de 180 × 180 px para atalho em iOS; verification.md mostra o ícone atual e o novo lado a lado em 16, 32 e 180 px com aprovação da responsável. O total transferido pela landing cai ao menos 400 KiB em relação à linha de base de 757 KiB.
- [x] **AC10 — Cache:** arquivos em `/assets/` respondem com `Cache-Control` contendo `max-age=31536000` e `immutable`. O HTML responde com revalidação (`max-age=0` ou `no-cache`). Arquivos sem hash no nome (ícones, imagem de compartilhamento, robots e sitemap) não recebem `immutable`.
- [ ] **AC11 — Sem regressão:** lint, testes e build do frontend verdes com contagem positiva; toda a suíte de regressão visual sem diferença; Lighthouse da landing mantém Acessibilidade 100.

## Verificação por ambiente

O servidor de desenvolvimento não reproduz status, cabeçalhos nem arquivos estáticos da
borda. Por isso:

- **Local:** AC05, AC06, a página "não encontrada" do AC03, o comportamento no navegador
  do AC04 e AC11, com testes automatizados.
- **Preview do PR no Cloudflare Pages:** AC01–AC04, AC07, AC09 e AC10, com `curl -i`, e
  peso transferido e Acessibilidade com Lighthouse 12 mobile. Previews podem responder com
  `X-Robots-Tag: noindex`; isso é esperado ali e não reprova a spec.
- **Stage após a promoção:** `curl -i` de `/robots.txt`, `/sitemap.xml` e de uma rota
  inexistente, mais o Lighthouse 12 mobile com SEO 100. Isso fica registrado como
  verificação pós-promoção em verification.md. Até lá, a spec não registra SEO 100 como
  comprovado.

## Perguntas em aberto e suposições

- **Suposição:** `robots.txt` evita o rastreamento, mas não garante que uma URL bloqueada
  nunca apareça no Google, sem conteúdo, se houver links externos para ela. É um limite
  aceito: as áreas autenticadas não têm links públicos e não exibem conteúdo sem sessão.
- **Suposição:** o Google executa JavaScript ao indexar, então o canonical e a descrição
  aplicados no navegador são considerados. Mensageiros não executam JavaScript, por isso a
  prévia depende só da resposta inicial do AC07, que é igual para qualquer link do site.
- **Suposição:** HTML estático por rota conta como pré-renderização e fica fora de escopo.
- **Em aberto (spec futura):** incluir `/cadastro` no sitemap quando o cadastro for ligado
  em definitivo.

## Fora de escopo

Pré-renderização ou renderização no servidor, inclusive HTML estático por rota, divisão
do bundle e redução do LCP (6,0 s no celular em laboratório), que terão spec própria.
Também ficam de fora:

- páginas de privacidade e termos;
- dados estruturados (JSON-LD);
- cadastro no Search Console e domínio de produção;
- conteúdo novo na landing e mudanças visuais nas telas;
- backend, contrato da API e banco;
- mudanças de autenticação ou de rotas além do status HTTP de endereços inexistentes.
