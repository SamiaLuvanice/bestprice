---
description: Convenções para React, TypeScript e Vite.
---

# Frontend

Use componentes funcionais React e TypeScript estrito. Mantenha chamadas HTTP em módulo tipado, com fetch relativo a /api; o proxy Vite e o servidor da SPA resolvem o destino em seus ambientes. Trate carregamento, resposta válida, erro HTTP e falha de rede como estados distintos quando isso mudar a experiência. Só exiba sucesso quando o contrato da API for validado. Evite any; valide valores vindos da rede como unknown.

Prefira HTML semântico, texto de erro acessível e testes orientados ao comportamento visível usando Testing Library. Rode npm run lint, npm test -- --run e npm run build.
