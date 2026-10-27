---
numero: 0035
titulo: Paper Bridge local para o BestPrice
tipo: feature
prioridade: P2
status: pronta
toca: [tooling, design]
depende_de: []
issue: https://github.com/SamiaLuvanice/bestprice/issues/201
---

# 0035 — Paper Bridge local

## Problema

Quem desenvolve o BestPrice precisa criar e atualizar interfaces no Paper Desktop
para Windows. Hoje há experimentos locais de conexão, inspeção e criação de frame,
mas não uma ferramenta repetível, verificável e integrada à identidade do produto.

## Comportamento esperado

Comandos locais operam exclusivamente o documento autorizado `BestPrice Bridge Test`
pela interface do aplicativo. Repetir a criação de um elemento identificado atualiza
o existente. Cada resultado informa sucesso e comprovação separadamente; falhas
parciais e capacidades indisponíveis permanecem explícitas. O fundo e as cores de
texto usam os tokens reais da aplicação. A SPA e a API do produto não são alteradas.

## Critérios de aceite

- [ ] AC01: conectar localmente e identificar inequivocamente o documento de teste; recusar outros documentos e destinos de rede.
- [ ] AC02: reaproveitar o frame experimental, renomear para `BestPrice IA - Dashboard`, aplicar 1440 × 900, X/Y zero e o fundo do design system, relendo as propriedades.
- [ ] AC03: criar frame quando ausente e atualizar quando presente sem duplicar; recusar nomes ambíguos.
- [ ] AC04: inserir `BestPrice IA` no frame em 80/64, tamanho 48, peso 700, cor primária, e demonstrar conteúdo, propriedades e parentesco disponíveis.
- [ ] AC05: executar status, inspeção, frame, texto, screenshot e validação pelo terminal com resultados estruturados e código de saída coerente.
- [ ] AC06: registrar screenshots antes/depois, observações e falhas sem credenciais; impedir comandos simultâneos da bridge sobre o canvas.
- [ ] AC07: extrair cores, tipografia, espaços, raios, sombras, componentes, rotas e breakpoints reais, declarando limitações de conversão.
- [ ] AC08: disponibilizar composição incremental e repetível a partir de elementos suportados; capacidades sem evidência são reportadas como pendentes.
- [ ] AC09: preservar experimentos existentes e fornecer testes automatizados, guia de execução e relatório de evidências e evolução.

## Fora de escopo

MCP oficial do Paper, endpoints privados, credenciais do aplicativo, alterações de
arquivos internos, remoção de camadas, documentos reais, assinatura/cotas e servidor
exposto na rede. Não há promessa de reprodução integral de componentes React por
desenho manual nem de importação HTML sem suporte observado na interface.

## Perguntas e suposições

A demanda fornece público, estado atual, resultado, escopo e dependências: não há
pergunta de produto bloqueante. A composição completa e a criação de documentos
dependem de suporte legítimo observável e serão explicitamente pendentes se ausente.
