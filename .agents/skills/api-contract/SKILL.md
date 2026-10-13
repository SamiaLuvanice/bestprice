---
name: api-contract
description: Definir e evoluir contrato REST entre FastAPI e React antes de alterar endpoint ou cliente.
---

# Contrato REST

Registre em plan.md método, rota, entrada, resposta, status, erros e autenticação. Modelos Pydantic e tipos TypeScript devem corresponder ao JSON publicado. Teste contrato HTTP e comportamento da interface para sucesso e erro. Em breaking change, atualize ambos na mesma spec. Para health, use exatamente os dois corpos 200/503 do plano 0007 e nenhum detalhe interno.
