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

Registre comandos e resultados reais. Item não executado é pendência explícita. Implementação entregue aguarda revisão até cumprir o handoff.
