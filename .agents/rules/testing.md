---
description: Testes de comportamento para FastAPI, PostgreSQL e React.
---

# Testes

Backend: pytest; TestClient para contrato HTTP, dublê na fronteira do banco para teste rápido e teste de integração com PostgreSQL real para comprovar conexão e falha controlada. Use TEST_DATABASE_URL para isolar banco de teste. Não conte um teste que foi pulado como evidência. Frontend: Vitest e Testing Library para estados visíveis da UI; simule 200, 503 e rejeição de fetch. Testes não devem depender de ordem, relógio real, credenciais ou rede externa.

Antes da implementação de comportamento, confirme Red por motivo esperado. Em seguida Green e Refactor. Teste a fronteira pública; evite espelhar detalhes internos.
