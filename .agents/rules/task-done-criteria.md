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
5. **Revisão independente por outra sessão/agente (nunca pelo implementador):**
   - **`arch-reviewer` (subagente):** revisão de arquitetura (camadas, dependências, ports/adapters, erros, nomenclatura).
   - **Revisor da faixa (`backend`/`frontend`/`fullstack`):** sessão despachada pelo orquestrador na abertura da PR (skills da faixa + `pr-review-merge`).
6. **Merge e Fechamento:**
   - Aprovado o review, o merge em `develop` é feito pelo revisor/orquestrador (`merge_apos_review: automatico`).
   - O **QA** valida e fecha a tarefa definitivamente com evidência dos critérios de aceite.

Quem implementa entrega a PR e declara "implementação entregue; aguarda revisão e merge". O fechamento final da tarefa cabe ao QA.
Item pulado deve ser **dito explicitamente**, nunca omitido.
