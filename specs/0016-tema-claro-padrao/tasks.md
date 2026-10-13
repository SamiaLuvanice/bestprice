# Tarefas — Spec 0016

- [x] **T01** — Remover o bloco `@media (prefers-color-scheme: dark)` de `frontend/src/styles.css`,
  mantendo `:root` com `color-scheme: light` e os tokens claros. Verificação: inspeção do
  arquivo sem o bloco e `color-scheme: light` presente.
- [x] **T02** — Atualizar `docs/apps/frontend.md` (descrição do tema e linha da tabela de
  `styles.css`) para "tema claro fixo". Verificação: não há mais menção a
  `prefers-color-scheme` descrevendo o app.
- [x] **T03** — Rodar em `frontend/`: `npm run lint`, `npm test -- --run` e `npm run build`.
  Verificação: todos verdes, contagem de testes mantida.
- [ ] **T04** — Evidência visual com preferência de cor em escuro: app renderiza claro na
  entrada e na área autenticada. Evidência determinística registrada em
  `specs/0016-tema-claro-padrao/verification.md`; capturas em navegador pendentes (QA).
- [x] **T05** — Registrar a spec em `docs/PROGRESS.md` e executar doc-sync-onboarding.
  Verificação: linha da 0016 presente e documentos conferidos.
- [x] **T06** — Commit, push e PR para `develop` com `Closes #52`. Verificação: PR aberta,
  CI acionado.
