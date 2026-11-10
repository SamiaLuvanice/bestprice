# Verificação da spec 0051

Registro do agente `frontend` (tarefas T1–T6 de [tasks.md](tasks.md)) em 10/11/2026. Worktree
`.worktrees/feature-0051-issue-287-seo-tecnico-landing`, branch
`feature/0051-issue-287-seo-tecnico-landing`, base `0c611cc` (docs sobre `origin/develop` `4da00c3`).

Ambiente: Windows 11, Node 22.18.0, Playwright 1.64.1 (Chromium headless), servidor Vite da
própria worktree em `127.0.0.1:5173` iniciado pelo Playwright (porta conferida livre antes),
sem backend nem PostgreSQL. `npm ci` rodado em `frontend/` antes de tudo.

As seções de T1–T6 não afirmam resultado de CI, PR, preview do Cloudflare Pages, Lighthouse
nem revisão independente. Esses resultados estão em "Borda no preview do PR (T7) e QA (T8)".

## TDD por tarefa

Comandos rodados em `frontend/`. Red conta só quando a falha é de asserção pelo motivo esperado.

| Tarefa | Red (comando · resultado) | Green (comando · resultado) |
|---|---|---|
| T1 — título (AC05) | `npx vitest run src/landing/LandingPage.content.test.tsx` · **1 failed, 5 passed (6)**: `expected 'BestPrice · Pare de dar F5 no preço.' to be 'Monitor de preços do Mercado Livre · BestPrice'` | mesmo comando após mudar `pageTitle` em `content.ts` · **6 passed (6)** |
| T2 — metadados por rota (AC06) | `npx vitest run src/seo/pageMeta.test.tsx` com `pageMeta.ts` só com assinaturas sem comportamento · **17 failed, 1 passed (18)**; falhas de asserção como `expected { canonical: null, description: '' } to deeply equal …` e `expected null to be 'https://bestprice-stage.pages.dev/login'`. O que passou é a guarda negativa "página não encontrada não declara canonical" | mesmo comando após implementar `pageMeta.ts` e chamar `usePageMeta` no `AppRoutes` · **18 passed (18)** |
| T3 — arquivos estáticos (AC01, AC02, AC04, AC07, AC10) | `npx vitest run src/seo/staticSeo.test.ts` sem os arquivos em `public/` · **13 failed, 9 passed (22)**. Passaram as guardas já satisfeitas: sem canonical/`og:url` no `index.html`, as 6 rotas liberadas (robots ausente libera tudo), nenhum `immutable` fora de `/assets/*` e a leitura das rotas do `App.tsx` | mesmo comando após criar `robots.txt`, `sitemap.xml`, `_headers`, `_redirects` e as tags do `index.html` · **22 passed (22)** |
| T4 — `404.html` no build (AC03) | `npx vitest run scripts/not-found-page.test.ts` com plugin sem efeito · **1 failed, 1 passed (2)**: `expected false to be true` em `existsSync(dist/404.html)` | mesmo comando após implementar o plugin · **2 passed (2)**; depois `npm run build`: `cmp dist/index.html dist/404.html` sem diferença |

Tentativas descartadas como Red (registradas por transparência):

- T2: a primeira execução tinha o teste de `/cadastro` procurando o heading "Criar conta"; o
  heading real é "Criar sua conta". Corrigido o teste antes do Green; a contagem acima é a da
  execução corrigida.
- T4: a primeira versão importava o plugin de `vite.config.ts`; no ambiente jsdom do Vitest isso
  falhou com `TypeError: The URL must be of scheme file` (erro de ambiente, não Red). O plugin foi
  para `scripts/not-found-page.mjs` (ver "Desvios do plano").

## Gates (T6)

| # | Comando (`frontend/`) | Resultado observado | Situação |
|---|---|---|---|
| G1 | `npm run lint` | `eslint .`, saída 0, nenhum problema | Verde |
| G2 | `npm test -- --run` | **61 arquivos; 819 passed (819)**; 93,7 s; saída 0 | Verde, contagem positiva |
| G3 | `npm run build:check` (após `rm -rf dist`) | build ok em 1,25 s; "Sem vestígios do catálogo em dist (5 marcadores conferidos)"; "Fontes conforme em dist: Geist Mono latin/latin-ext 400–600, sem base64"; saída 0. Aviso preexistente do Vite de chunk acima de 500 kB | Verde, com aviso |
| G4 | `npm run test:visual` (suíte completa) | **307 passed, 449 skipped, 5 failed** (8,5 min); saída diferente de 0 | **Vermelho — preexistente**, ver abaixo |
| G5 | `cmp dist/index.html dist/404.html` e `ls dist` | iguais (1.742 bytes cada); `dist/` contém `robots.txt`, `sitemap.xml`, `_redirects`, `_headers`, `_routes.json`, `favicon.png`, `apple-touch-icon.png`, `og-image.png`, `index.html`, `404.html` e `assets/` | Verde |

### Falhas da regressão visual (G4)

Falharam `public-pages.spec.ts` › "landing pública" (tema claro e escuro) em 390 e 320 px, e
`landing.spec.ts` › "A1 — selo 'menor preço' da Demonstração inteiro dentro do painel" (1280 px,
timeout de 30 s). Nenhuma baseline foi alterada.

Investigação:

1. Reexecução isolada na branch: `npx playwright test tests/visual/public-pages.spec.ts
   tests/visual/landing.spec.ts --reporter=line` · **59 passed, 100 skipped, 5 failed** — as mesmas 5.
2. Mesmo comando na base `0c611cc`, sem nenhuma mudança desta spec (worktree temporária
   `.worktrees/tmp-baseline-0051`, já removida) · **55 passed, 100 skipped, 9 failed**: as mesmas 5
   e ainda "landing pública" em 768 e 1280 px, com diffs de 9.210 a 22.357 pixels, e o A1 com
   `page.goto: Test timeout of 30000ms exceeded`.
3. Na branch, os diffs da landing são de **10 px (390) e 12 px (320)**, todos pixels isolados no
   antisserrilhamento dos arcos tracejados (órbitas) em volta do robô do CTA final
   (y ≈ 7.430–7.500 em 390 px; y ≈ 7.820–7.890 em 320 px), comparando a baseline, o `actual` e o
   `diff` de `test-results/`. Nenhuma diferença de conteúdo.

Conclusão: falhas preexistentes e instáveis nesta máquina, também presentes sem as mudanças da
spec. As mudanças da 0051 não alteram nada visível (só `<head>`, arquivos estáticos e o título
da aba). AC11 fica **pendente** até a suíte visual passar inteira — no preview/CI ou após a
correção dessa instabilidade em tarefa própria.

## Arquivos gerados (T5)

Gerados por `node scripts/generate-brand-assets.mjs` (em `frontend/`), a partir de
`scripts/assets/favicon-source.png` (arte atual do ícone, 1254 × 1254, 491.539 bytes, movida de
`public/favicon.png`), `src/assets/research/assistant-robot-480.webp` e dos tokens `--background`,
`--foreground`, `--accent` e `--font-display` lidos de `src/styles.css`.

| Arquivo | Dimensões | Bytes | Limite | Situação |
|---|---|---|---|---|
| `public/favicon.png` | 48 × 48 | 1.621 | ≤ 16 KiB (16.384) | Dentro |
| `public/apple-touch-icon.png` | 180 × 180 (fundo branco `--background`) | 5.298 | ≤ 16 KiB (16.384) | Dentro |
| `public/og-image.png` | 1200 × 630 | 48.565 | ≤ 300 KB | Dentro |

O ícone servido cai de 491.539 bytes (≈ 480 KiB) para 1.621 bytes, ≈ 478 KiB a menos que a
linha de base de 757 KiB (estimativa por tamanho de arquivo; a medição com Lighthouse no preview
segue pendente).

A imagem de compartilhamento contém o logotipo (arte do ícone), o robô do assistente, fundo em
degradê de `--background` para `--accent` e um único texto, "Monitor de preços do Mercado Livre",
em `--foreground` com a pilha `--font-display`.

### Evidências para aprovação da responsável

- [`evidence/icon-comparison.png`](evidence/icon-comparison.png) (50.118 bytes): ícone atual
  (arte de 1254 px reduzida) e novo (`favicon.png` 48 px em 16/32 px; `apple-touch-icon.png` em
  180 px) lado a lado; 16 e 32 px ampliados 4× sem suavização.
- [`evidence/og-image.png`](evidence/og-image.png) (48.565 bytes): cópia da imagem de
  compartilhamento.

**Aprovação da responsável (AC08, AC09): pendente.**

## Correção da T7: destino das reescritas (`_redirects`)

**Red de borda** (preview `https://812bc030.bestprice-stage.pages.dev`, commit `582bf44`, `curl`
feito pela coordenação e repassado a este registro):

- `/login`, `/cadastro`, `/produtos`, `/alertas` e `/app` → **308** com `Location: /`: o Pages
  normaliza o destino `/index.html` para `/` e redireciona em vez de reescrever.
- `/login/`, `/cadastro/`, `/produtos/`, `/produtos/abc123`, `/alertas/`, `/app/` e
  `/app/dashboard` → **404** com o `404.html`.
- Corretos, sem mudança: `/` 200; `/pagina-que-nao-existe` e `/assets/naoexiste.js` 404;
  `robots.txt` `text/plain`; `sitemap.xml` `application/xml`; cache imutável em `/assets/*` e
  `max-age=0` no HTML e no favicon.

Aplicada a alternativa prevista no plan.md (Riscos): destino `/` em todas as reescritas.

| Etapa | Comando (`frontend/`) · resultado |
|---|---|
| Red | teste "só tem reescritas 200 para /, nunca redirecionamentos" atualizado; `npx vitest run src/seo/staticSeo.test.ts` · **1 failed, 21 passed (22)**: `expected [ …(12) ] to deeply equal []` (as 12 regras ainda apontavam para `/index.html`) |
| Green | `public/_redirects` com destino `/`; mesmo comando · **22 passed (22)** |
| Lint | `npm run lint` · saída 0 |
| Testes | `npm test -- --run` · **61 arquivos; 819 passed (819)**; 68,5 s; saída 0 |

Verificação do novo preview: ver "Borda no preview do PR (T7)" abaixo.

## Correções da revisão

Achados da revisão independente e da QA, corrigidos em 10/11/2026 na mesma worktree. Comandos em
`frontend/`. Onde o achado é uma proteção que o código atual já cumpre, o Red foi demonstrado por
mutação temporária (revertida em seguida, `git status` limpo antes do commit).

| Item | Red | Green |
|---|---|---|
| B1 — teste instável (`pageMeta.test.tsx`, canonical de `/cadastro` lido logo após `findByRole`) | Relatado pela revisão: **2 falhas em 8** com `expected null to be 'https://bestprice-stage.pages.dev/cadastro'` (o efeito passivo do `usePageMeta` podia rodar depois do `findBy*`). Aqui, antes da correção, 10 execuções isoladas deram 10 verdes: a falha não reproduziu sem carga | Asserções de canonical/descrição depois de `findBy*` dentro de `await waitFor(...)` (casos de `/login` e `/cadastro`). `npx vitest run src/seo/pageMeta.test.tsx` **20 vezes seguidas: 20 verdes, 0 falhas** (18 testes cada) |
| R1 — `Disallow: /app` bloqueava `/apple-touch-icon.png` | `robotsAllows` do teste passou a tratar `*` e `$` (RFC 9309); casos liberados ganharam `/apple-touch-icon.png`, `/favicon.png`, `/sitemap.xml` (além de `/og-image.png`); bloqueados mantêm `/app`, `/app/`, `/app/dashboard`. `npx vitest run src/seo/staticSeo.test.ts` · **1 failed, 24 passed (25)**: "libera /apple-touch-icon.png", `expected false to be true` | `robots.txt` com `Disallow: /app$` e `Disallow: /app/` · **25 passed (25)** |
| R3 — cruzamento `_redirects` × rotas frágil | Testes novos: nº de `<Route` no `App.tsx` igual ao nº de paths literais extraídos (aspas simples ou duplas); nenhum `<Route`/`<Routes` em outro arquivo de `src/` fora dos testes. Mutação: `/alertas` como `path={'/alertas'}` e um `src/TmpExtraRoutes.tsx` com `<Routes>` · falharam "extrai um path literal de cada <Route>" (`to have a length of 9 but got 8`), "não declara <Route> nem <Routes> fora do App.tsx" (`expected [ 'src/TmpExtraRoutes.tsx' ] to deeply equal []`) e "encontra as rotas". O teste antigo "cobre cada rota" passava nessa mutação — era o furo apontado | Mutações revertidas · **27 passed (27)** |
| O1 — plugin copiava sem checar o `index.html` | Teste "sem dist/index.html o plugin não copia nada nem interrompe o build" · **1 failed, 2 passed (3)**: `ENOENT: no such file or directory, copyfile '…\dist\index.html' -> '…\dist\404.html'` | `closeBundle` só copia se `index.html` existir · **3 passed (3)** |
| O2 — `process.cwd()` e `read()` tolerante | Mutação: `public/sitemap.xml` renomeado · o teste do sitemap passou a falhar com `ENOENT … public\sitemap.xml` (antes, `read()` devolvia `''`) | Raiz por `import.meta.dirname` e `read()` sem fallback · **27 passed (27)**. `new URL('../../', import.meta.url)` + `fileURLToPath` não serve: no jsdom o `URL` global não é o do Node e o Node recusa com "The URL must be of scheme file" (mesmo com `.href`); `import.meta.dirname` é o valor do arquivo, conferido numa sonda temporária |
| O3 — "não encontrada sem canonical" passava por vacuidade | Substituído por "o App remove o canonical ao navegar de /login para uma rota desconhecida" (canonical de Entrar presente, `pushState` + `popstate`, página não encontrada, canonical ausente e descrição da landing). Mutação: remoção do canonical desligada no `usePageMeta` · **2 failed, 16 passed (18)**, incluindo o teste novo (`expected 'https://bestprice-stage.pages.dev/log…' to be null`) | Mutação revertida (sem diff em `pageMeta.ts`) · **18 passed (18)** |

`_headers` não mudou: a revisão perguntou se o 404 de `/assets/*` herdava o cache imutável; no
preview ele responde `Cache-Control: no-store` (evidência da coordenação).

### Gates após as correções

| Comando (`frontend/`) | Resultado observado |
|---|---|
| `npm run lint` | `eslint .`, saída 0 |
| `npm test -- --run` | **61 arquivos; 825 passed (825)**; 103,6 s; saída 0 |
| `npm run build:check` (após `rm -rf dist`) | build ok em 1,47 s; "Sem vestígios do catálogo em dist (5 marcadores conferidos)"; "Fontes conforme em dist: Geist Mono latin/latin-ext 400–600, sem base64"; saída 0; `dist/404.html` igual a `dist/index.html`; `dist/robots.txt` com `/app$` e `/app/` |

A suíte visual não foi reexecutada nesta rodada (as mudanças não alteram nada visível).

## Borda no preview do PR (T7) e QA (T8)

Registro da coordenação e da QA independente em 10/11/2026, com `curl` no preview do Cloudflare
Pages do [PR #288](https://github.com/SamiaLuvanice/bestprice/pull/288). Previews respondem
`x-robots-tag: noindex`, o que é esperado e não reprova a spec.

**Preview `2277705a` (commit `4884eed`, destino `/`):**

| Requisição | Resultado |
|---|---|
| `/`, `/login`, `/login/`, `/cadastro`, `/cadastro/`, `/produtos`, `/produtos/`, `/produtos/abc123`, `/alertas`, `/alertas/`, `/app`, `/app/`, `/app/dashboard` | **200**, 1742 B (o mesmo HTML), sem redirecionamento |
| `/pagina-que-nao-existe`, `/assets/naoexiste.js` | **404**, com `Cache-Control: no-store` |
| HTML (`/`, `/login`) | `Cache-Control: public, max-age=0, must-revalidate` |
| `/assets/index-*.js` e `.css` | `Cache-Control: public, max-age=31536000, immutable` |
| `favicon.png` (1621 B), `apple-touch-icon.png` (5298 B), `og-image.png` (48 565 B, 1200 × 630), `robots.txt`, `sitemap.xml` | 200, com `max-age=0, must-revalidate`, sem `immutable` |
| `robots.txt` / `sitemap.xml` | `text/plain` / `application/xml`, com o conteúdo do AC01/AC02 |

**Preview `741639b9` (commit `e48f61a`, após as correções da revisão):** `robots.txt` com
`Disallow: /app$` e `Disallow: /app/`. `/login`, `/app`, `/app/dashboard` e `/produtos/x`
respondem 200, `/apple-touch-icon.png` 200 e `/nao-existe` 404. CI do PR #288 verde (CI, PR
policy, Automation, Backend, Frontend, Cloudflare Pages).

**QA no navegador (Playwright, preview `2277705a`).** A API do preview respondeu `429` (desafio do
Cloudflare na origem Render) durante todo o teste. Isso exercitou o caminho "verificação falha".
Os estados "pendente", "abortada" e "visitante" foram simulados interceptando `/api/*`.

- AC05: título de `/` é "Monitor de preços do Mercado Livre · BestPrice" e o H1 é "Pare de dar
  F5 no preço." em todos os modos.
- AC06: `/` e `/login` têm canonical autorreferente e as descrições da tabela "Textos" nos quatro
  modos. `/cadastro` com o cadastro desligado leva a Entrar; com o cadastro ligado (simulado), tem
  canonical próprio. `/app/dashboard`, `/produtos` e a página não encontrada não têm canonical.
- AC07: o HTML bruto de `/`, `/login`, `/app/dashboard` e `/produtos/abc123` é idêntico, sem
  canonical nem `og:url`, com todas as tags `og:*`/`twitter:*` exigidas. **Limite:** a URL
  declarada em `og:image` (`https://bestprice-stage.pages.dev/og-image.png`) só serve a imagem
  depois da promoção para o stage.
- AC09: Lighthouse 12.8.2 mobile `total-byte-weight` = **279,7 KiB** (linha de base 757 KiB,
  queda de cerca de 477 KiB).
- AC11 (parcial): Lighthouse com **Acessibilidade 100**. A única falha de SEO é `is-crawlable`,
  causada pelo `noindex` do preview.

**Achados anteriores à 0051 (fora de escopo):**

- `/login` mostra o título "Página não encontrada · BestPrice" enquanto a sessão está carregando
  ou indisponível.
- Com a API inacessível, uma rota desconhecida mostra o erro global em vez da página "não
  encontrada". O status 404 e o título continuam corretos.

## Desvios do plano

- **Reescritas do `_redirects` com destino `/`** em vez de `/index.html` (alternativa já prevista
  no plano), pela evidência de borda acima.

- **Plugin do `404.html` em módulo próprio.** O plano previa o plugin dentro do `vite.config.ts`.
  Ele continua registrado ali, mas a lógica fica em `frontend/scripts/not-found-page.mjs` (com
  `not-found-page.d.mts` para o `tsc -b` e `not-found-page.test.ts`), porque importar o
  `vite.config.ts` no Vitest falha no jsdom. Mesmo padrão de `scripts/check-no-catalog.mjs`.
- **Teste do `404.html` sem ler o `dist/` real.** O teste roda os ganchos do plugin num `dist`
  temporário, para não depender de build prévio no `npm test`; o `dist/` real foi conferido à mão
  (G5).
- **Testes de `App` para metadados** ficaram em `src/seo/pageMeta.test.tsx`, junto dos testes de
  `pageMetaFor`/`usePageMeta`.
- **Logotipo da imagem de compartilhamento** usa `scripts/assets/favicon-source.png` (mesma arte de
  `src/assets/logo-bestprice.png`, em 1254 px), porque a versão de 128 px ficaria borrada no
  tamanho usado.
- O `<title>` estático do `index.html` continua "BestPrice"; `og:title` usa o título da landing.
- **`robots.txt` bloqueia `/app$` e `/app/`** em vez de `/app` (tabela "Arquivos" do plano), para
  não bloquear `/apple-touch-icon.png` (revisão, R1).

## Pendências

- AC11: suíte visual completa verde (falhas preexistentes acima).
- AC08/AC09: aprovação da responsável das evidências em `evidence/`.
- T10 (pós-promoção em stage): `curl -i` de `robots.txt`, `sitemap.xml`, de uma rota inexistente e
  de `og-image.png`, e Lighthouse 12 mobile com SEO 100.
- T7, T8 e T9 concluídas (seção "Borda no preview do PR" e commits de documentação).
