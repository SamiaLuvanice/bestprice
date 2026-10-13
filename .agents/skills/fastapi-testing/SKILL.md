---
name: fastapi-testing
description: Testar contrato HTTP FastAPI e integração real com PostgreSQL usando pytest.
---

# Testes FastAPI

Use TestClient para status, headers e JSON; injete um dublê apenas na fronteira do banco em testes rápidos. Execute pelo menos um teste com PostgreSQL real para SELECT 1 e falha controlada de conexão/consulta. Use TEST_DATABASE_URL isolada. Não transforme ausência de banco em skip silencioso do gate obrigatório. Confirme que o teste novo falhou por comportamento antes de passar.
