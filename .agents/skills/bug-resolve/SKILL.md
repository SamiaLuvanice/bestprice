---
name: bug-resolve
description: Reproduzir falha, escrever teste de regressão, corrigir causa raiz e verificar.
---

# Resolver bug

Reproduza e guarde traceback, log ou resposta real. Delimite em qual camada a falha nasce (dados, serviço, proxy ou interface), usando as fontes de evidência das regras do perfil. Escreva teste que falha pelo sintoma, corrija a causa e rode os portões da parte tocada (`node .agents/scripts/gates.mjs --scope <escopo>`). Para API, compare status e corpo com o contrato. Para UI, confira Console/Network e estado visível. Registre observado e inferido separadamente. Capture aprendizado novo na skill learnings.
