---
description: Convenções para React, TypeScript e Vite.
---

# Frontend

Use componentes funcionais React e TypeScript estrito. Mantenha chamadas HTTP em módulo tipado, com fetch relativo a /api; o proxy Vite e o servidor da SPA resolvem o destino em seus ambientes. Trate carregamento, resposta válida, erro HTTP e falha de rede como estados distintos quando isso mudar a experiência. Só exiba sucesso quando o contrato da API for validado. Evite any; valide valores vindos da rede como unknown.

Prefira HTML semântico, texto de erro acessível e testes orientados ao comportamento visível usando Testing Library. Rode npm run lint, npm test -- --run e npm run build.

## Identidade visual BestPrice

O Figma é a fonte principal de referência visual do BestPrice IA: interfaces web e
mobile, componentes, tokens, protótipos e layouts responsivos. Siga
Figma → Codex → Implementação → Validação visual, descrito em
`docs/apps/frontend.md`. Evolua tela por tela, preservando arquitetura,
funcionalidades, identidade, contratos e acessibilidade.

Antes de implementar, identifique o arquivo/frame, node-id, rota, estado e
viewport. Priorize o MCP oficial do Figma quando disponível e autorizado;
consulte screenshot, estrutura, componentes, propriedades, variantes e tokens.
Mapeie o design para os componentes locais antes de criar componentes novos.
Reutilize a biblioteca em `frontend/src/components/ui/`, `Brand`, componentes
das features e tokens da SPA; mantenha código modular e regras responsivas.

Consulte também `designsystem/{README,agent-guidelines,brand-spec}.md`, a logo
original `designsystem/logo-bestprice.png` e a skill `frontend-design`.
Os HTMLs `designsystem/index.html` e `login.html` são referências locais
preservadas, sem precedência sobre o Figma aprovado. Sugestões de skills não
substituem esse design. Preserve a logo sem redesenho ou distorção; divergências
de identidade ou detalhe essencial exigem esclarecimento, sem redesign implícito.
Registre extensões de tokens/componentes em `designsystem/README.md`, com motivo,
superfícies afetadas e referência Figma, antes de adotá-las.

Se o MCP estiver indisponível, sem autorização ou limitado por cota, use
exportações Figma identificadas por origem/frame, data, dimensões e limites.
Não afirme paridade com alterações remotas posteriores. Não crie bridges,
servidores intermediários ou automações Playwright para manipular ferramentas
de design sem autorização específica; Paper/Paper Bridge foram descontinuados.
Os testes visuais existentes da aplicação continuam válidos. Compare o resultado
com a referência aprovada nos viewports e estados relevantes; baselines exigem
revisão explícita. Dados ilustrativos de design não viram dados reais do produto.
