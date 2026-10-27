---
numero: 0036
titulo: Sincronização HTML-first de telas no Paper
tipo: feature
prioridade: P1
status: pronta
toca: [tooling, design]
depende_de: [0035]
issue: https://github.com/SamiaLuvanice/bestprice/issues/203
---

# 0036 — Sincronização HTML-first

## Problema e público

Quem desenvolve o BestPrice precisa transferir telas inteiras ao Paper como
camadas editáveis. A bridge atual compõe somente frames e textos individuais.

## Comportamento esperado

Um comando sincroniza o dashboard a partir da implementação e identidade reais,
prepara a apresentação para a importação pública de HTML, importa uma estrutura
inteira e comprova conteúdo e editabilidade antes de registrar sucesso.
O manifesto local identifica documento, tela, variante, versão, camadas e estado.
Repetições sem mudança não duplicam; diferenças ou alterações manuais nunca
substituem automaticamente uma tela existente.

## Aceite

- [x] AC01: importação HTML automatizada por controles públicos cria múltiplas camadas; edição de texto comprova editabilidade.
- [x] AC02: comando sync --screen dashboard gera, prepara, importa, valida e registra sincronização real; erros retornam JSON sem falso sucesso.
- [x] AC03: dashboard deriva de componentes, estilos, imagens, fontes e rota reais, com geração desktop/tablet/mobile.
- [x] AC04: estilos inline resolvidos preservam identidade, com relatório das conversões observadas.
- [x] AC05: manifesto persiste hash de versão e IDs; repetição sem mudança reutiliza; mudança/conflito requer nova versão explícita, sem apagar/substituir.
- [x] AC06: screenshots de referência/antes/depois e relatórios registram hierarquia, conteúdo, geometria e imagem local.
- [x] AC07: primitives da 0035 permanecem disponíveis como correção e alternativa visual.
- [x] AC08: sem MCP, endpoints privados, leitura de credenciais, modificações internas ou alterações em documentos reais; lock serializa operações.

## Limites

Somente BestPrice Bridge Test está autorizado. Não reproduzir dados privados
da conta: a referência gerada usa sessão e estado vazio de demonstração.
Não há promessa de responsividade executável no canvas: cada variante é uma
captura editável da aplicação no viewport correspondente.
