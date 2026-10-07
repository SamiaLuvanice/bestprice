---
description: Estrutura simples de FastAPI, React e PostgreSQL.
---

# Arquitetura

A direção do BestPrice é um monólito modular, conforme [contexto do produto](../../docs/product-context.md). Toda obtenção de dados da Amazon deve passar por `AmazonProvider`, com retorno normalizado e mecanismo substituível. Produtos e consultas são compartilhados entre monitoramentos; vínculos, alertas e notificações exigem autorização por usuário. Diferencie última consulta de última alteração de preço e trate duplicidade e concorrência nas specs. Não introduza microserviços sem necessidade comprovada.

Organize backend/app por responsabilidade observável: configuração, rotas, serviços e acesso a dados quando existirem. A rota valida entrada e traduz saída HTTP; regras de negócio ficam em funções ou serviços testáveis; SQL fica em módulo de persistência. Não crie camadas vazias nem ORM para um health check. Dependências externas entram por parâmetros ou Depends do FastAPI para permitir testes focados.

No frontend/src, separe componentes da chamada HTTP. O módulo de API tipa e valida a resposta na fronteira; o componente apresenta estados de carregamento, sucesso e erro. Use caminho relativo /api em desenvolvimento e produção. O servidor de produção da SPA faz proxy para o backend. Escolha estrutura por feature quando surgirem funcionalidades.
