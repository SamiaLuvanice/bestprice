---
description: Gera plan.md e tasks.md a partir de uma spec existente
argument-hint: <numero-da-spec>
---

Monte o plano de implementação da spec **$ARGUMENTS**.

1. Leia `specs/$ARGUMENTS-*/spec.md` por inteiro.
2. Leia `.agents/rules/architecture.md` e a skill `spring-boot-feature`.
3. Se a spec toca a API, leia a skill `api-contract`.

Produza dois arquivos no diretório da spec.

**`plan.md`** — o **como**:

- contrato da API, se houver: rotas, métodos, DTOs de entrada e saída, status e erros
- classes do backend na ordem entity → repository → DTO → service → controller
- o que muda no Angular: models, service, componentes, rotas
- arquivos novos e alterados, com caminho
- decisões de desenho: o que foi escolhido, a alternativa descartada, e por quê
- riscos e o que pode dar errado

**`tasks.md`** — passos verificáveis:

- cada tarefa é executável e tem um critério de conclusão explícito
- na ordem: contrato → backend (com testes) → frontend (com testes)
- teste junto de cada camada, nunca num bloco no fim
- a última tarefa é sempre rodar os portões (`quality-gates`)

Uma tarefa que não pode ser verificada está mal escrita. Reescreva-a.

Não escreva código ainda. Ao terminar, mostre os dois arquivos e aponte a decisão mais
cara do plano — a que seria mais trabalhosa de reverter depois.
