---
description: Critérios de conclusão de uma tarefa.
alwaysApply: true
---

# Tarefa pronta

Uma tarefa de spec só está pronta com:
1. Cada critério de aceite demonstrado em /verify.
2. Backend: lint e pytest verdes, com contagem de testes positiva.
3. Frontend: lint, teste e build verdes, com contagem positiva se houver testes.
4. Testes de comportamento cobrem sucesso e erro principal.
5. Revisão independente ou revisão documentada do diff com architecture.md.
6. Fluxo local ponta a ponta conferido quando a mudança atravessa API, UI e banco.
7. Para qualquer alteração de código, agente `doc-sync-onboarding` executado por último e documentação sincronizada; `AGENTS.md`, `CLAUDE.md` e `docs/` conferidos.

Registre comandos e resultados reais. Item não executado é pendência explícita. Implementação entregue aguarda revisão até cumprir o handoff.
