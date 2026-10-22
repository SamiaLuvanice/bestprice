---
numero: 0030
titulo: Experiência visual consistente do BestPrice
tipo: melhoria
prioridade: P2
status: pronta
toca: [frontend]
depende_de: [0027, 0028, 0029]
issue: https://github.com/SamiaLuvanice/bestprice/issues/174
---

# Problema e público

Pessoas que acompanham anúncios do Mercado Livre precisam reconhecer ações, ler preços e transitar entre páginas com clareza. A interface atual já preserva identidade e fluxos, mas tem hierarquia irregular, feedback de interação discreto demais e diferenças de densidade entre superfícies.

# Resultado esperado

Evoluir a aplicação existente com superfícies neutras, ações primárias verdes e acentos rosas equilibrados. Preservar a marca, dados reais, navegação e todos os comandos existentes. A experiência deve funcionar por toque e teclado, de celulares estreitos a desktop.

# Escopo

Landing, login, início autenticado, produtos, detalhe, alertas, página não encontrada, sessão, menus, confirmação, formulários e estados carregando/erro/vazio/sucesso. Referências: sistema atual, protótipo BestPrice e Spartan AI. Ausência de acesso remoto não impede análise das exportações locais, mas deve ser explicitada.

# Critérios de aceite

- AC01: auditoria identifica rotas e estados reais, evidência e prioridades P0–P3; não inventa páginas.
- AC02: toda superfície existente usa identidade, escala tipográfica, espaçamentos, bordas e estados interativos coerentes; a logo mantém proporção.
- AC03: campo de link e ações primárias são reconhecíveis; números e preços têm leitura alinhada; informações de consulta e alerta continuam acessíveis.
- AC04: não há rolagem horizontal da página em 320, 390, 768 e 1280 px; controles têm área mínima de 44 × 44 px.
- AC05: navegação por teclado mantém foco visível e recuperável; menu móvel público fecha com Escape e ao sair da região, sem esconder foco.
- AC06: contraste AA, rótulos visíveis, landmarks e mensagens acessíveis são preservados; movimento reduzido não anima componentes.
- AC07: login, navegação, monitoramento, atualização, paginação, alertas e interrupção de acompanhamento mantêm comportamento, contratos e dados.
- AC08: carregamento, falha, sucesso, vazio e falta de preço mantêm informação e recuperação disponíveis.
- AC09: lint, testes, build e auditoria de navegador são executados e registrados com contagens, falhas e limites; comparação antes/depois cobre todas as rotas.
- AC10: decisões das três referências, arquivos afetados e pendências constam no relatório e documentação.
- AC11 (correção de revisão): o banner final preserva a proporção da arte sem recortes adicionais do telefone; o rodapé público é preto com texto claro; a marca do login aparece apenas na coluna do formulário à direita no desktop, com fundo transparente, permanecendo visível no mobile.

# Fora de escopo

Backend, banco, API, contratos, regras monetárias, novas rotas funcionais, cadastro, recuperação de senha, planos comerciais, integrações adicionais e novas dependências.

# Decisões e dependências

O briefing já define público, identidade, escopo e restrições; cobertura equilibrada das telas é a premissa adotada. O conector Figma retornou UNAUTHORIZED, mas o arquivo foi aberto e inspecionado visualmente no Chrome; as exportações locais complementam essa análise, sem alegar auditoria programática completa do arquivo remoto. Testes de navegador usam respostas simuladas; integração real Mercado Livre permanece na Issue #127.
