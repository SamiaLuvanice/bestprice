# Tarefas — 0018 Backend de stage no Render

- [x] T01 — Confirmar Issue e acesso às contas; criar projetos Supabase, Render e
  Cloudflare Pages na região disponível mais próxima compatível.
- [x] T01a — Confirmar planos gratuitos nos três painéis, remover add-ons pagos e
  bloquear excedentes cobrados antes de publicar qualquer serviço.
- [x] T02 — Criar worktree e branch da Issue a partir de `origin/develop`.
- [x] T03 — Testar cookie em `APP_ENV=stage` falhando pelo motivo esperado; corrigir
  a política e obter teste verde.
- [x] T04 — Adicionar Blueprint sem segredos, com build e start compatíveis com
  Render free; corrigir e validar o comando Docker após a falha do primeiro deploy.
- [x] T05 — Adicionar Pages Function para proxy `/api/*`, `_routes.json` e
  documentar configuração de build/branch; validar proxy localmente.
- [x] T06 — Executar lint e pytest do backend, incluindo integração PostgreSQL
  isolada quando disponível; registrar contagens reais.
- [x] T07 — Revisar diff, segurança e arquitetura; executar doc-sync-onboarding
  como última etapa após qualquer alteração de código.
- [x] T08 — Abrir PR para `develop`, obter revisão e CI verde; promover por PR
  para `stage`.
- [x] T09 — Configurar projeto Supabase e segredos no Render, sincronizar Blueprint
  e validar logs, migrations, health e cookie no endereço HTTPS. O primeiro deploy
  falhou; a correção #67 chegou a Live, com health e cookie conferidos.
- [x] T10 — Registrar resultados, limites e procedimento de reversão; concluir
  somente quando cada critério de aceite estiver comprovado.
- [x] T11 — Integrar a migration RLS (`20261014rls`) após CI PostgreSQL e promover
  novamente a `stage`; conferir head, 10/10 tabelas protegidas e health público.
- [x] T12 — Com Auto Sync desligado no Blueprint, comparar horários dos checks e
  do próximo deploy Render; exercitar rollback e falha pública do banco com 503
  e health Render antes de marcar a spec como `implementada`. A ação de rollback
  reimplantou deploy anterior do mesmo commit; troca entre versões e rollback
  Pages não foram exercitados.
