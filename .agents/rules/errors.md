---
description: Erros REST em FastAPI e mensagens seguras para o cliente.
---

# Erros da API

Defina status e formato de erro no contrato antes de implementar. FastAPI valida entrada com Pydantic; documente o formato de 422 quando o endpoint aceitar entrada. Erros de domínio podem usar HTTPException ou handler central quando houver repetição. Nunca retorne stack trace, SQL, host, senha ou detalhes internos.

O health desta base é excepcionalmente fechado: sucesso 200 com status/database ok; falha do banco 503 com status/database unavailable. Registre a exceção no servidor e devolva apenas o contrato seguro. Na interface, traduza 503 e falha de rede em mensagem compreensível; falha de rede não é resposta HTTP.
