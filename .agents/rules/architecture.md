---
description: Estrutura simples de FastAPI, React e PostgreSQL.
---

# Arquitetura

Organize backend/app por responsabilidade observável: configuração, rotas, serviços e acesso a dados quando existirem. A rota valida entrada e traduz saída HTTP; regras de negócio ficam em funções ou serviços testáveis; SQL fica em módulo de persistência. Não crie camadas vazias nem ORM para um health check. Dependências externas entram por parâmetros ou Depends do FastAPI para permitir testes focados.

No frontend/src, separe componentes da chamada HTTP. O módulo de API tipa e valida a resposta na fronteira; o componente apresenta estados de carregamento, sucesso e erro. Use caminho relativo /api em desenvolvimento e produção. O servidor de produção da SPA faz proxy para o backend. Escolha estrutura por feature quando surgirem funcionalidades.
