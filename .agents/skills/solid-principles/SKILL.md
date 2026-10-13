---
name: solid-principles
description: Manter responsabilidades pequenas e dependências testáveis em Python e React.
---

# Responsabilidades e dependências

Rota FastAPI cuida de HTTP, função ou serviço cuida de regra, módulo de persistência cuida de SQL. Um componente React apresenta estado e delega a chamada ao módulo de API. Extraia abstrações só quando houver mais de uma implementação ou teste que precise controlar fronteira externa. Injeção de dependência é útil para banco, relógio e serviços externos. Evite classe, interface ou camada criada apenas para cumprir um padrão.
