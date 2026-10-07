---
description: Verifica critérios de aceite e portões de uma spec
argument-hint: <numero-da-spec>
---

Leia specs/$ARGUMENTS-*/spec.md e plan.md. Para cada critério de aceite, execute demonstração e registre observado, comando e limite em verification.md. Rode, em backend: ruff check . e pytest -q (incluindo integração PostgreSQL). Rode, em frontend: npm run lint, npm test -- --run e npm run build. Rode testes das automações Node e actionlint quando disponíveis. Confirme contagem de testes positiva. Se a mudança cruza as três partes, exercite Compose, GET /api/health 200/503 e a tela. Revise arquitetura, erros seguros, segredos e datas/dinheiro. Gate vermelho ou critério não demonstrado permanece pendente. Se houve alteração de código, acione o agente `.agents/agents/doc-sync-onboarding.md` depois das verificações e da revisão, como última etapa antes de concluir.
