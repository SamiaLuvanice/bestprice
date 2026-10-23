# Tarefas — 0032

- [x] **T01 — Definir escopo e segurança.** Issue #182, spec e plano registram o
  runner sem custo, branch `develop`, environment de segredos e gate manual.
- [x] **T02 — Implementar o workflow manual.** Exigir três IDs MLB, ref `develop`,
  environment restrito e injeção dos secrets somente no passo de validação.
- [x] **T03 — Configurar o environment de Stage.** Criar `stage-validation`,
  restringir a `develop` e cadastrar os quatro secrets autorizados, sem expô-los.
- [ ] **T04 — Executar e confirmar resultados.** Rodar a sonda real contra o banco
  Stage, identificar IDs que correspondam aos três cenários e registrar o JSON
  sanitizado; deixar o gate desligado até todos os critérios aplicáveis passarem.
- [x] **T05 — Sincronizar onboarding.** Guias operacionais e progresso atualizados;
  `AGENTS.md`, `CLAUDE.md` e o catálogo `docs/index.md` conferidos.
- [ ] **T06 — Entregar.** Gates, revisão, PR para `develop` com `Closes #182` e
  evidência operacional; não fazer merge sem revisão independente.
