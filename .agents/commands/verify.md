---
description: Verifica critérios de aceite e portões de uma spec
argument-hint: <numero-da-spec>
---

Leia specs/$ARGUMENTS-*/spec.md e plan.md. Para cada critério de aceite, execute demonstração e registre observado, comando e limite em verification.md. Rode `node .agents/scripts/gates.mjs` (todos os portões de harness.yaml, incluindo as automações do harness) e as checagens do perfil listadas na skill quality-gates — no backend, integração com PostgreSQL real e o relatório de complexidade `python .agents/skills/cyclomatic-complexity/scripts/complexity_report.py --changed origin/develop` (rank >= D bloqueia; registre a saída). Confirme contagem de testes positiva. Se a mudança cruza API, interface e banco, exercite o fluxo com os serviços reais. Revise arquitetura, erros seguros, segredos e datas/dinheiro. Portão vermelho ou critério não demonstrado permanece pendente. Por último, sincronize a documentação conforme `.agents/rules/task-done-criteria.md`.
