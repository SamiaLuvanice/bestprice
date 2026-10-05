---
name: po-intake
description: Transformar uma demanda em uma spec verificável em specs/. Use quando o usuário relata uma feature, melhoria ou bug e é preciso esclarecer o pedido antes de implementar.
---

# Intake de demanda

Antes de criar uma spec, esclareça: quem é afetado, comportamento atual e esperado, escopo,
severidade, partes tocadas (backend/frontend) e dependências.

Crie `specs/NNNN-<slug>/spec.md` com critérios de aceite verificáveis. O número é sequencial,
não é reutilizado, e o texto de produto fica separado das decisões de implementação (`plan.md`).

O arquivo local em `specs/` é a fonte de verdade — não há board externo no fluxo.
Detalhes de numeração, prioridade e cabeçalho: [reference.md](reference.md).
