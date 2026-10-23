# Tarefas — 0031

- [x] **T01 — Registrar escopo e contrato.** Spec, plano e issue descrevem a
  resolução do ID do anúncio em páginas de catálogo sem confundir catálogo e
  publicação.
- [x] **T02 — Red: cobrir o link realista e erros.** Adicionar teste de regressão
  para `/p/MLB…` com `pdp_filters`, incluindo IDs repetidos e distintos; executar
  e registrar falha pelo motivo esperado.
- [x] **T03 — Green: implementar parsing local estrito.** Extrair o ID da
  publicação, rejeitar dados ambíguos/inválidos e preservar allowlist e parser
  direto de anúncio.
- [x] **T04 — Revisar e verificar.** Testes direcionados, gates aplicáveis e
  revisão documentada contra `docs/architecture.md` e regras de segurança; ver
  `verification.md`. Revisão independente antes do merge ainda pendente.
- [x] **T05 — Sincronizar onboarding.** `doc-sync-onboarding` executado após a
  última alteração de código: README, guia backend, aprendizados, progresso e
  verificação atualizados; `AGENTS.md`, `CLAUDE.md` e índice de docs conferidos,
  sem necessidade de mudança.
- [ ] **T06 — Entregar para revisão.** Atualizar verificação e progresso, publicar
  a branch e preparar PR para `develop`, sem fazer merge.
