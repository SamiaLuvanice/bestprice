---
description: Convenções para FastAPI, Python e PostgreSQL.
---

# Backend

Use Python 3.13 e as dependências declaradas em backend/pyproject.toml. Ative ambiente virtual local. Tipos explícitos nas fronteiras, Pydantic para payloads, configuração por variável de ambiente e logs sem segredos. API assíncrona não deve chamar psycopg síncrono no event loop: escolha rota síncrona para consulta curta ou driver assíncrono.

Use parâmetros SQL e prazo de conexão. Feche conexão e cursor com context managers. Não adicione tabela, ORM ou migração sem requisito de persistência. A rota /api/health consulta SELECT 1 e devolve 200 somente quando o banco responde; em falha conhecida, registra contexto interno e devolve o JSON seguro de 503 definido no contrato.
