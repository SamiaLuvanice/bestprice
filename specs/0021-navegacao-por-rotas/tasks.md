# Tarefas — 0021

Issue [#93](https://github.com/SamiaLuvanice/bestprice/issues/93).
Executar na worktree da feature. Cada tarefa de comportamento segue Red → Green →
Refactor, com comandos e resultados reais em `verification.md`.

## Preparação

- [x] **T01 — coordenação:** confirmar spec pronta, Issue aberta, base origin/develop,
  branch vinculada, worktree e hooks. Evidência: `verification.md`.
- [x] **T02 — coordenação/frontend:** registrar contrato existente, arquitetura de
  navegação, paginação completa de alertas, arquivos e riscos no plano.
- [x] **T03 — arch-reviewer:** revisar independentemente plano e rastreabilidade dos
  21 critérios; resolver achados antes de iniciar código.

## Implementação frontend, em sequência

- [x] **T04 — rotas e sessão (AC01–AC06, AC14–AC16, AC19):** adicionar dependência
  compatível e lockfile; rotas, guard, retorno seguro persistente na URL e limpeza
  da sessão. Provar login direto/retorno/recarga, sessão indisponível, expiração,
  logout e destinos maliciosos com testes de comportamento.
- [x] **T05 — layout e páginas (AC07–AC09, AC17):** decompor AccountArea e separar
  Início/Produtos sem perder ações, estados, paginação e cadastro por URL; links
  reais, seção ativa, títulos e foco. Antes de compor as telas, ler `designsystem/`
  conforme `frontend.md` e aplicar `frontend-design`. Provar sucesso/erro/duplicidade e navegação.
- [x] **T06 — detalhe por URL (AC10, AC13, AC20–AC21):** extrair conteúdo do modal,
  consultar ID diretamente, manter histórico/alertas/refresh, confirmação de parada,
  estados ausente/inativo/rede e ação para Produtos. Provar acesso direto, respostas
  invertidas A/B, cancelamento, falha e sucesso com mensagem/foco.
- [x] **T07 — alertas e notificações (AC11–AC12):** grupo completo de alertas
  ativos/pausados com paginação de monitoramentos e estados independentes; links de
  notificações no sino e na página sem leitura automática. Provar páginas sem alertas,
  item além da primeira página, retry e histórico de monitoramento interrompido.
- [ ] **T08 — regressão e acessibilidade (AC05, AC15, AC17–AC18):** adaptar a suíte
  existente à navegação mantendo cobertura de domínio e foco; conferir responsividade,
  título de aba, teclado, novas abas e histórico real. Conferir logout com bfcache.

## Validação e entrega

- [x] **T09 — frontend/QA:** rodar lint, testes e build na worktree; registrar versões,
  comandos, contagens positivas e falhas resolvidas; executar gates aplicáveis do
  repositório sem compartilhar banco/volume com outras tarefas.
- [x] **T10 — QA:** registrar AC01–AC21 em matriz com resultados e pendências por critério; separar
  API simulada, Compose real e dependência Mercado Livre. Conferir health 200/503
  com PostgreSQL; registrar comandos reais e a falha de rede da UI como pendência.
  Health 200/503/200 e inspeção local executados; falha de rede da UI e cenários
  não observados individualmente permanecem explícitos em `verification.md`.
- [x] **T11 — arch-reviewer:** revisar diff e evidências independentemente; devolver
  achados ao frontend e confirmar correções. Reexecutar somente gates afetados.
- [x] **T12 — doc-sync-onboarding:** após último código/gates/revisão, sincronizar
  onboarding e docs afetados, conferir AGENTS.md/CLAUDE.md/docs e registrar resultado.
  Se código mudar depois, repetir esta tarefa como última etapa.
- [ ] **T13 — coordenação:** preparar commits com Refs #93 e PR para develop com
  Closes #93, plano, evidências e limites; conferir CI e revisão, sem bypass.
- [ ] **T14 — QA/coordenação (AC06):** no fluxo separado de promoção, verificar as
  cinco rotas e recargas no SHA implantado em stage. Preview não vale como stage.
  Manter AC06 parcial até essa comprovação, sem antecipar status implementada.
- [ ] **T15 — coordenação:** após integração em develop e todos os critérios
  comprovados, atualizar status/evidências e aplicar task-cleanup aos recursos
  exclusivos, preservando volumes e recursos ainda necessários à verificação.

Não há tarefa de implementação backend: o contrato atual atende a esta spec. Se
surgir impedimento concreto, revisar plano e escopo antes de alterar a API.
