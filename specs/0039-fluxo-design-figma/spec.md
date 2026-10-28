---
numero: 0039
titulo: Figma como referência oficial de design
tipo: melhoria
prioridade: P2
status: pronta
toca: [tooling, design, docs]
depende_de: [0027, 0035, 0036, 0037]
issue: https://github.com/SamiaLuvanice/bestprice/issues/211
---

# 0039 — Figma como referência oficial de design

## Problema e público

Quem mantém o BestPrice IA precisa de um fluxo de design simples e confiável.
A integração Paper/Paper Bridge não atingiu a qualidade esperada e mantém
automações e instruções que competem com o Figma e a identidade já estabelecida.
O escopo de retirada foi apresentado e aprovado em 28/10/2026.

## Comportamento esperado

O Figma é a fonte principal de referência visual para web/mobile, componentes,
tokens, protótipos e evolução gradual das telas. O fluxo oficial é
Figma → Codex → Implementação → Validação visual. O Codex interpreta o design,
reutiliza componentes da stack atual e implementa com fidelidade, responsividade
e consistência, preservando contratos funcionais e acessibilidade.

A consulta usa preferencialmente o MCP oficial do Figma quando disponível e
autorizado. Sem acesso, autorização ou cota, utiliza exportações identificadas
do Figma e registra seus limites, sem criar bridges ou automações alternativas
sem autorização específica. Designs existentes não são reconstruídos nesta etapa.

## Critérios de aceite

- AC01: A integração executável Paper/Paper Bridge e suas verificações exclusivas deixam de participar do checkout entregue e do CI.
- AC02: A configuração MCP do projeto e suas projeções deixam de configurar Paper, preservando os demais servidores.
- AC03: Regras ativas e documentação existente indicam Figma como referência visual principal e o fluxo completo até a validação visual.
- AC04: O fluxo documenta identificação de frames/estados, organização desktop/mobile, consulta de componentes/propriedades/tokens, reutilização da biblioteca existente e comparação visual responsiva.
- AC05: O procedimento alternativo usa exportações Figma com origem/data/limites e exige autorização para bridges ou automações de ferramentas de design.
- AC06: Código, funcionalidades, estilos, dependências de runtime, assets e testes visuais da aplicação permanecem intactos; trabalhos locais anteriores não são apagados.
- AC07: Histórico e evidências anteriores são preservados, identificados como descontinuados quando necessário; a direção Paper da tarefa 0038 é registrada como substituída sem alterar sua worktree pendente.
- AC08: QA, revisão independente, verificações aplicáveis e sincronização final do onboarding apresentam resultados reais e limites.

## Fora de escopo

Novas interfaces, redesign, alterações no backend/frontend/banco, mudanças de
API, migração ou criação de telas no Figma, novas automações de ferramentas de
design, instalação/desinstalação global de aplicativos ou plugins, exclusão de
worktrees/trabalhos locais anteriores, merge, release e deploy.

## Perguntas em aberto

Nenhuma para a limpeza aprovada. A autorização e o conteúdo atual do arquivo
Figma serão verificados na próxima tarefa que realmente consultar ou alterar designs.
