# Tarefas — 0051

Worktree `.worktrees/feature-0051-issue-287-seo-tecnico-landing`. Agente: `frontend`
(`.agents/agents/frontend.md`). TDD: cada teste novo falha pelo motivo esperado antes da
implementação; registre Red e Green em verification.md.

- [ ] **T1 — Título (AC05).** Red: `LandingPage.content.test.tsx` espera "Monitor de preços do Mercado Livre · BestPrice". Green: `pageTitle` em `content.ts`.
- [ ] **T2 — Metadados por rota (AC06).** Red: testes de `pageMetaFor`, `usePageMeta` e `App` em `/login` com sessão pendente e com falha. Green: `src/seo/pageMeta.ts` e chamada no `AppRoutes`.
- [ ] **T3 — Arquivos estáticos (AC01, AC02, AC04, AC07, AC10).** Red: `staticSeo.test.ts` cobre `index.html`, `robots.txt`, `sitemap.xml`, `_headers` e `_redirects` cruzado com as rotas do `App.tsx`. Green: os arquivos em `public/` e as tags em `index.html`.
- [ ] **T4 — 404.html no build (AC03).** Red: verificação do `dist` sem `404.html`. Green: plugin no `vite.config.ts`, conferido após `npm run build`.
- [ ] **T5 — Ícones e imagem (AC08, AC09).** Script `generate-brand-assets.mjs` com `sharp` (devDependency); arte-fonte movida para `scripts/assets/`; gerar `favicon.png` 48 px, `apple-touch-icon.png` 180 px e `og-image.png` 1200 × 630; conferir os tamanhos (≤ 16 KiB por ícone, ≤ 300 KB a imagem); evidência lado a lado em `evidence/` para aprovação.
- [ ] **T6 — Gates.** `npm run lint`, `npm test`, `npm run build` e `npm run test:visual` em `frontend/`, com contagens.
- [ ] **T7 — Preview do PR.** Comandos `curl -i` e Lighthouse 12 mobile da seção "Verificação por ambiente"; ajustar o `_redirects` se o preview divergir.
- [ ] **T8 — Revisão e QA.** `arch-reviewer` no diff; QA dos AC no preview.
- [ ] **T9 — Documentação.** `docs/apps/frontend.md`, `docs/apps/infraestrutura.md`, verification.md, `docs/PROGRESS.md`; `doc-sync-onboarding` por último.
- [ ] **T10 — Pós-promoção (pendência).** Em stage, `curl -i` de `robots.txt`, `sitemap.xml` e rota inexistente, mais Lighthouse 12 mobile com SEO 100.
