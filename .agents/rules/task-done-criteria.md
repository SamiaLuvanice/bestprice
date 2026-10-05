---
description: Critério para considerar uma tarefa pronta.
alwaysApply: true
---

# Tarefa pronta

Uma tarefa só está pronta quando **todos** os itens abaixo valem, com evidência (comando + resultado):

1. **Critérios de aceite** da spec demonstrados (`/verify`), quando houver spec.
2. **Backend:** testes passam (`./mvnw test` ou `./gradlew test`).
3. **Frontend:** `ng build` compila sem erro e `ng test` passa (se houver testes).
4. **Testes novos** cobrem o comportamento novo e o caminho de erro principal.
5. **Revisão feita** — pelo agent `arch-reviewer` ou por você mesmo relendo o diff com a
   regra `architecture.md` ao lado.
6. **Fluxo ponta a ponta** conferido localmente quando a mudança atravessa backend e frontend
   (subir os dois e exercitar a tela ou um `curl`).

Quem implementa diz "implementação entregue; falta revisar" — "pronta" só depois dos itens acima.
Item pulado deve ser **dito explicitamente**, nunca omitido.
