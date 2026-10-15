# Tarefas — 0022

Issue [#101](https://github.com/SamiaLuvanice/bestprice/issues/101).
Executar na worktree da feature. Cada tarefa de comportamento segue Red → Green →
Refactor, com comandos e resultados reais em `verification.md`.

## Preparação

- [x] **T01 — coordenação:** confirmar spec pronta, Issue aberta, base origin/develop,
  branch vinculada, worktree e hooks. Evidência: `verification.md`.
- [x] **T02 — spec-reviewer:** revisar a spec independentemente; resolvidos os achados
  (prazo distinguido entre espera por conexão e abertura de conexão nova, reuso com
  resultado observável, idade desde a abertura e caminho de erro). Status `pronta`.
- [ ] **T03 — backend:** registrar contrato preservado, camadas, decisões e riscos no
  plano (`plan.md`/`tasks.md`). Sem código nesta etapa.
- [ ] **T04 — arch-reviewer:** revisar independentemente plano e rastreabilidade dos
  sete critérios; resolver achados antes de iniciar código.

## Implementação backend, em sequência

- [ ] **T05 — configuração do engine (AC01, AC02, AC03, AC04):** expor as constantes
  (`POOL_RECYCLE_SECONDS`, `POOL_TIMEOUT_SECONDS`, `CONNECT_TIMEOUT_SECONDS`) e aplicar
  `pool_recycle`, `pool_use_lifo`, `pool_timeout` e `connect_args={"connect_timeout":...}`
  em `create_database_engine()`, mantendo `pool_pre_ping`. Provar por teste unitário de
  configuração (Red → Green), sem tocar banco.
- [ ] **T06 — comportamento com PostgreSQL real (AC01, AC02):** provar reciclo por
  idade (PID novo após o limite) e reuso sem crescimento (mesmo PID; nenhuma conexão
  nova além do conjunto) usando `TEST_DATABASE_URL`.
- [ ] **T07 — prazos (AC03, AC04, AC05):** provar que a espera por conexão
  (`pool_timeout`) e a abertura de conexão nova (`connect_timeout`) falham dentro do
  prazo, e que a requisição termina rápido sem expor detalhes internos.

## Validação e entrega

- [ ] **T08 — backend/QA:** rodar `ruff check` e `pytest` na worktree com PostgreSQL
  isolado; registrar versões, comandos e contagens positivas; confirmar health 200/503
  no Compose isolado (AC06) e ausência de migration (AC07).
- [ ] **T09 — QA:** validar AC01–AC07 em matriz com resultado por critério e comando
  real; separar teste unitário, integração PostgreSQL e Compose.
- [ ] **T10 — arch-reviewer:** revisar diff e evidências independentemente; devolver
  achados ao backend e confirmar correções. Reexecutar somente gates afetados.
- [ ] **T11 — doc-sync-onboarding:** após último código/gates/revisão, sincronizar
  `docs/database.md` e demais docs afetados, conferir `AGENTS.md`/`CLAUDE.md`/`docs` e
  registrar resultado. Se o código mudar depois, repetir como última etapa.
- [ ] **T12 — coordenação:** preparar commits com `Refs #101` e PR para `develop` com
  `Closes #101`, plano e evidências; conferir CI, sem bypass.
- [ ] **T13 — coordenação:** após integração em `develop` e critérios comprovados,
  atualizar status/evidências e aplicar `task-cleanup` aos recursos exclusivos,
  preservando volumes e recursos ainda necessários à verificação.

Não há tarefa de implementação frontend nem de migration. Promoção a `stage` é fluxo
separado e não faz parte desta entrega.
