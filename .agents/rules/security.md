---
description: Segurança básica para FastAPI, React e PostgreSQL.
---

# Segurança

Configuração sensível vem de variáveis de ambiente. .env é local e ignorado; .env.example só contém valores fictícios. Não registre DATABASE_URL, senha ou stack trace na resposta. Valide entrada com Pydantic. SQL usa parâmetros, nunca concatenação de entrada. Backend impõe autorização quando surgir; ocultar botão no React não autoriza acesso.

O proxy relativo /api evita origem cruzada na base. Se CORS se tornar necessário, permita apenas origens explícitas e teste credenciais separadamente. Não adicione autenticação nesta spec sem requisito. Mantenha dependências atualizadas e leia alertas de segurança de pip/npm.
