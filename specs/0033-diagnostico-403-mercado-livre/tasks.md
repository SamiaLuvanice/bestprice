# Tarefas — 0033

- [x] **T01 — Delimitar o diagnóstico seguro.** Issue #184, spec e plano limitam
  a saída a `item` ou `sale_price`; sem leitura ou registro do corpo upstream.
- [x] **T02 — Testar o 403 por recurso.** Escrever testes que falham quando o
  recurso negado não chega à sonda, cobrindo ambos endpoints e sanitização.
- [x] **T03 — Propagar enumeração segura.** Manter `integration_access_denied`
  e acrescentar `blocked_resource` apenas para os valores conhecidos.
- [x] **T04 — Rodar portões locais.** Ruff, testes backend, complexidade e
  verificação documentada; gate de banco real indisponível nesta sessão.
- [x] **T05 — Sincronizar onboarding.** Validar guias técnicos/progresso
  afetados; conferir AGENTS.md, CLAUDE.md e índice de docs com doc-sync.
- [ ] **T06 — Entregar.** PR para `develop` com `Closes #184`; aguardar revisão
  independente e checks antes de integrar.
