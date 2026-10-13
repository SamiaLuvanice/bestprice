---
name: fastapi-persistence
description: Implementar consulta ou persistência PostgreSQL na API FastAPI.
---

# Persistência PostgreSQL

Para a base 0007, psycopg abre conexão curta, executa SELECT 1 com timeout e fecha recursos. Não invente tabela ou migração para health. Em features futuras, defina esquema e migrações na spec/plan; use parâmetros SQL e transação quando a regra exigir atomicidade. Teste integração com PostgreSQL real e falhas. Nunca use dados do volume pessoal como fixture.
