---
description: Convenções para React, TypeScript e Vite.
---

# Frontend

Use componentes funcionais React e TypeScript estrito. Mantenha chamadas HTTP em módulo tipado, com fetch relativo a /api; o proxy Vite e o servidor da SPA resolvem o destino em seus ambientes. Trate carregamento, resposta válida, erro HTTP e falha de rede como estados distintos quando isso mudar a experiência. Só exiba sucesso quando o contrato da API for validado. Evite any; valide valores vindos da rede como unknown.

Prefira HTML semântico, texto de erro acessível e testes orientados ao comportamento visível usando Testing Library. Rode npm run lint, npm test -- --run e npm run build.

## Identidade visual BestPrice

Antes de criar uma tela ou alterar visualmente uma existente, consulte o design system em
`designsystem/index.html`, a referência de entrada em `designsystem/login.html`, a logo
original `designsystem/logo-bestprice.png`, as observações de uso em
`designsystem/README.md` e as regras automatizáveis de
`designsystem/agent-guidelines.md` (toque 44 × 44 px, HTML semântico, contraste
AA/AAA e busca nas skills de design). Preserve a logo sem redesenhá-la ou distorcê-la. Aplique a skill
`frontend-design` ao trabalho de interface; a identidade da referência prevalece sobre
preferências visuais genéricas da skill. Em divergências entre referências, `index.html`
governa a identidade; `login.html` orienta somente composição. Preserve os requisitos de
acessibilidade e os contratos funcionais das specs. Registre extensões de tokens,
componentes ou regras em `designsystem/README.md`, com motivo e superfícies afetadas,
antes de adotá-las em novas superfícies. Não trate produtos, preços ou indicadores
ilustrativos do protótipo como dados reais nem os adicione ao produto.
