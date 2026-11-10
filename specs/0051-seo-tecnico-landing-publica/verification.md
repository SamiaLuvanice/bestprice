# Verificação da spec 0051

Registro do agente `frontend` (tarefas T1–T6 de [tasks.md](tasks.md)) em 10/11/2026. Worktree
`.worktrees/feature-0051-issue-287-seo-tecnico-landing`, branch
`feature/0051-issue-287-seo-tecnico-landing`, base `0c611cc` (docs sobre `origin/develop` `4da00c3`).

Ambiente: Windows 11, Node 22.18.0, Playwright 1.64.1 (Chromium headless), servidor Vite da
própria worktree em `127.0.0.1:5173` iniciado pelo Playwright (porta conferida livre antes),
sem backend nem PostgreSQL. `npm ci` rodado em `frontend/` antes de tudo.

Este registro não afirma resultado de CI, PR, preview do Cloudflare Pages, Lighthouse nem
revisão independente: nada disso foi executado aqui (ver "Pendências").

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

## Desvios do plano

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

## Pendências

- AC11: suíte visual completa verde (falhas preexistentes acima).
- AC08/AC09: aprovação da responsável das evidências em `evidence/`.
- T7 (preview do PR): `curl -i` de AC01–AC04, AC07, AC09 e AC10; Lighthouse 12 mobile para peso
  transferido e Acessibilidade 100; comportamento real do `_redirects` com destino `/index.html` e
  barra final.
- T8 (revisão e QA), T9 (documentação e `doc-sync-onboarding`), T10 (pós-promoção em stage).
