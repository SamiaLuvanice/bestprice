# Plano — 0051

Spec: [spec.md](spec.md) · Issue [#287](https://github.com/SamiaLuvanice/bestprice/issues/287) ·
branch `feature/0051-issue-287-seo-tecnico-landing` (base `origin/develop` `4da00c3`).

## Escopo técnico

Mudança só de frontend, de configuração estática do Cloudflare Pages e de documentação.

- **Sem mudança de contrato REST.** Nenhum endpoint novo. O estado do cadastro vem do
  `useSignupAvailability` que o `App` já usa (spec 0048).
- **Onde o Pages é configurado:** projeto com raiz `frontend/`, comando
  `npm ci && npm run build` e saída `dist` (`docs/apps/infraestrutura.md`). Tudo que está em
  `frontend/public/` é copiado para a raiz de `dist`. A Pages Function de `/api/*` e o
  `_routes.json` continuam iguais.
- **Nginx local** (`frontend/nginx.conf`, imagem Docker) segue com `try_files` para
  `index.html`. O 404 real vale para o Pages, que é o ambiente público. O Nginx não muda e
  essa diferença fica documentada.

## Decisões caras de reverter

1. **404 real com `404.html` e reescritas explícitas de SPA.**
   - No Pages, se não houver `404.html` na saída, toda rota sem arquivo recebe `index.html`
     com 200 (modo SPA, a causa do soft 404). Com um `404.html` na raiz, rotas sem
     arquivo recebem esse arquivo com status 404.
   - O `404.html` vai ser uma cópia do `dist/index.html` gerado. Assim, o navegador carrega
     a SPA e mostra a `NotFoundPage` atual (AC03), mas o status HTTP é 404. A cópia é feita
     por um plugin do `vite.config.ts` no fim do build (`closeBundle`), para não depender
     de passo manual.
   - As rotas legítimas da SPA passam a ser listadas em `frontend/public/_redirects` como
     reescritas 200 para `/index.html`: `/login`, `/cadastro`, `/produtos`, `/produtos/*`,
     `/alertas`, `/app` e `/app/*`, com as variantes de barra final. `/` é atendido pelo
     próprio `index.html`.
   - **Custo:** toda rota nova da SPA precisa entrar no `_redirects`. Um teste
     (Tarefa 3) cruza as rotas do `App.tsx` com o `_redirects` para falhar se alguém
     esquecer.
   - **Risco:** o comportamento do Pages com reescrita para `/index.html` e com barra final
     só é observável no preview. Se `/index.html` causar redirecionamento 308, o destino
     da reescrita passa a ser `/`. Isso é validado no preview antes da revisão.
   - Descartado: Pages Function para decidir o status. Ela consumiria a cota de Functions
     do plano Free em toda navegação e somaria latência.
2. **Metadados por rota aplicados no navegador, sem HTML por rota.**
   - O `index.html` estático leva só metadados válidos para qualquer página: `og:*`,
     `twitter:*` e a descrição da landing. Não leva canonical nem `og:url` (AC07).
   - O módulo novo `src/seo/pageMeta.ts` define, por caminho, o canonical e a descrição da
     tabela "Textos" da spec. Ele exporta a função pura `pageMetaFor(pathname, signupEnabled)`
     e o hook `usePageMeta`. O hook cria ou atualiza `<link rel="canonical">` e
     `<meta name="description">` e remove o canonical fora das páginas públicas.
   - O hook é chamado no `AppRoutes` dependendo só de `location.pathname` e do estado do
     cadastro, nunca de `sessionState`. Por isso o metadado está presente enquanto a sessão
     carrega e quando ela falha (AC06).
   - `/cadastro` só recebe canonical quando o cadastro está `enabled`.
   - Origem fixa `PUBLIC_ORIGIN = 'https://bestprice-stage.pages.dev'` (decisão da spec),
     numa constante única no módulo. Quando houver domínio de produção, muda só ali, no
     `index.html`, no `robots.txt` e no `sitemap.xml`.
3. **Ícones e imagem de compartilhamento gerados por script versionado.**
   - O script `frontend/scripts/generate-brand-assets.mjs` é rodado manualmente, e as saídas
     ficam versionadas em `frontend/public/`. Ele não faz parte do build.
   - **Ícones:** a partir de `public/favicon.png` (1254 × 1254, a arte atual), gera
     `favicon.png` de 48 × 48 (múltiplo de 48, como recomenda o Google) e
     `apple-touch-icon.png` de 180 × 180, ambos PNG com paleta otimizada. A arte original
     de alta resolução sai de `public/` e fica como fonte em `frontend/scripts/assets/`, para
     não ser publicada.
   - **Imagem de compartilhamento:** `og-image.png` de 1200 × 630, renderizada pelo
     Playwright, que já é dependência, a partir de um HTML no próprio script. O HTML usa as
     fontes e os tokens de `src/styles.css`, o logotipo de `src/assets/logo-bestprice.png`
     e o robô de `src/assets/research/assistant-robot-480.webp`. O único texto é
     "Monitor de preços do Mercado Livre".
   - **Compressão:** `sharp` entra como devDependency, só para reduzir a paleta dos PNGs.
     Sem ele, um PNG de 180 px com essa arte tende a passar dos 16 KiB.
   - Nome do ícone mantido (`/favicon.png`). Como não tem hash, recebe a revalidação
     padrão do Pages (AC10), e a troca chega aos visitantes.
4. **Cache só para `/assets/*`.** `frontend/public/_headers` define
   `Cache-Control: public, max-age=31536000, immutable` para `/assets/*`. Todo o resto
   mantém o padrão do Pages (`public, max-age=0, must-revalidate`), observado em stage.

## Arquivos

| Arquivo | Mudança |
|---|---|
| `frontend/public/robots.txt` | novo: `Allow: /`; `Disallow: /app`, `/produtos`, `/alertas`; `Sitemap:` absoluto |
| `frontend/public/sitemap.xml` | novo: `/` e `/login` |
| `frontend/public/_redirects` | novo: reescritas 200 das rotas da SPA |
| `frontend/public/_headers` | novo: cache imutável em `/assets/*` |
| `frontend/public/favicon.png`, `apple-touch-icon.png`, `og-image.png` | gerados pelo script |
| `frontend/scripts/generate-brand-assets.mjs`, `frontend/scripts/assets/favicon-source.png` | script e arte-fonte |
| `frontend/vite.config.ts` | plugin que copia `index.html` para `404.html` no build |
| `frontend/index.html` | `og:*`, `twitter:*`, `apple-touch-icon`; sem canonical |
| `frontend/src/seo/pageMeta.ts` (+ teste) | metadados por rota |
| `frontend/src/App.tsx` | chamada de `usePageMeta` no `AppRoutes` |
| `frontend/src/landing/content.ts` | `pageTitle` novo |
| `frontend/src/landing/LandingPage.content.test.tsx` | título esperado novo |
| `frontend/src/seo/staticSeo.test.ts` | testes de `index.html`, `robots.txt`, `sitemap.xml`, `_headers` e `_redirects` |
| `docs/apps/frontend.md`, `docs/apps/infraestrutura.md` | SEO, `_redirects`, `_headers`, `404.html`, diferença com o Nginx |

## Testes

- **Unitários (Vitest):**
  - `pageMetaFor` para `/`, `/login`, `/cadastro` (ligado e desligado), áreas autenticadas
    e rota desconhecida;
  - `usePageMeta` no DOM: cria, atualiza e remove o canonical;
  - `App` em `/login` com `api.me` pendente e com `api.me` falhando: o canonical e a
    descrição de Entrar estão presentes (AC06).
- **Estáticos (Vitest lendo arquivos):**
  - `index.html` tem as tags `og` e `twitter` exigidas e não tem canonical nem `og:url`
    (AC07);
  - `robots.txt` (AC01), `sitemap.xml` (AC02), `_headers` (AC10) e `_redirects`, este
    cruzado com as rotas declaradas no `App.tsx` (AC04);
  - o plugin gera `dist/404.html` igual a `dist/index.html`, conferido por um teste que lê
    o `dist` após o build, como o `check-no-catalog`.
- **Título:** atualização do `LandingPage.content.test.tsx` (AC05). Precisa falhar em Red
  antes de mudar o `content.ts`.
- **Visual:** a suíte Playwright inteira, sem baseline nova (AC11).
- **Borda (preview do PR):** `curl -i` em todas as rotas do AC04 com e sem barra final,
  numa rota e num asset inexistentes, `robots.txt`, `sitemap.xml`, um asset com hash, o
  HTML e o `og-image.png`. Lighthouse 12 mobile para peso e Acessibilidade.

## Riscos

- **Reescrita do `_redirects` divergir do esperado no preview.** Mitigação: validar no
  preview antes da revisão. Alternativa: destino `/`.
- **Rotas novas sem reescrita viram 404.** Mitigação: o teste de cruzamento da Tarefa 3.
- **Preview com `X-Robots-Tag: noindex`.** O SEO 100 fica para a verificação no stage
  após a promoção, conforme a spec.
- **Aprovação visual** do ícone e da imagem pela responsável antes do PR sair do rascunho.
