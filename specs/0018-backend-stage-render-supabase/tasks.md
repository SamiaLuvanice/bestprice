# Tarefas — 0018 Backend de stage no Render

- [ ] T01 — Confirmar Issue e acesso às contas; criar projetos Supabase, Render e
  Cloudflare Pages na região disponível mais próxima compatível.
- [ ] T01a — Confirmar planos gratuitos nos três painéis, remover add-ons pagos e
  bloquear excedentes cobrados antes de publicar qualquer serviço.
- [x] T02 — Criar worktree e branch da Issue a partir de `origin/develop`.
- [x] T03 — Testar cookie em `APP_ENV=stage` falhando pelo motivo esperado; corrigir
  a política e obter teste verde.
- [ ] T04 — Adicionar Blueprint sem segredos, com build e start compatíveis com
  Render free; validar o YAML e o comando Docker.
- [x] T05 — Adicionar Pages Function para proxy `/api/*`, `_routes.json` e
  documentar configuração de build/branch; validar proxy localmente.
- [x] T06 — Executar lint e pytest do backend, incluindo integração PostgreSQL
  isolada quando disponível; registrar contagens reais.
- [ ] T07 — Revisar diff, segurança e arquitetura; executar doc-sync-onboarding
  como última etapa após qualquer alteração de código.
- [ ] T08 — Abrir PR para `develop`, obter revisão e CI verde; promover por PR
  para `stage`.
- [ ] T09 — Configurar projeto Supabase e segredos no Render, sincronizar Blueprint
  e validar logs, migrations, health e cookie no endereço HTTPS.
- [ ] T10 — Registrar resultados, limites e procedimento de reversão; concluir
  somente quando cada critério de aceite estiver comprovado.
