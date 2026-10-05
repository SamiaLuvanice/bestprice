---
description: Executa as tarefas de uma spec, camada por camada
argument-hint: <numero-da-spec>
---

Implemente a spec **$ARGUMENTS**.

1. Leia `specs/$ARGUMENTS-*/spec.md`, `plan.md` e `tasks.md`.
2. Leia `.agents/rules/architecture.md`, `java-spring.md`, `errors.md`, `testing.md` e `naming.md`
   (e `frontend.md` se tocar o Angular).

Execute as tarefas **na ordem do `tasks.md`**. A ordem evita retrabalho.

Regras de execução:

- Uma tarefa por vez. Marque `[x]` em `tasks.md` ao concluir cada uma.
- Em mudanças de comportamento, aplique TDD (skill `tdd` — Red → Green → Refactor) por fatia
  vertical, escrevendo primeiro o teste que falha pela razão esperada.
- Se a spec toca a API: contrato primeiro, depois backend, depois frontend.
- Rode o build/teste da parte tocada ao terminar cada camada, não acumule.
- Backend: skills `spring-boot-feature` e `tdd`. Frontend: skills `angular-developer` e `tdd`.

Se durante a implementação o plano se mostrar errado, **pare**. Atualize `plan.md`
explicando o que mudou e por quê, e siga. Não implemente contra um plano que você já
sabe estar errado, e não conserte o plano em silêncio.

Ao terminar todas as tarefas, rode os portões (`quality-gates`) e sugira o agent `arch-reviewer`.
