---
numero: 0041
titulo: Monitoramento de preços com visão clara
tipo: melhoria
prioridade: P2
status: rascunho
toca: [design]
depende_de: [0013, 0039, 0040]
issue: https://github.com/SamiaLuvanice/bestprice/issues/221
---

# 0041 — Monitoramento de preços com visão clara

## Problema e público

Pessoas autenticadas que acompanham anúncios precisam reconhecer rapidamente o
estado dos produtos, alterações de preço e alertas. O quadro atual de Monitoramento
no Figma apresenta principalmente indisponibilidade da fonte e lista vazia; não
mostra uma visão completa de acompanhamento quando há dados disponíveis.

A pessoa responsável pediu um redesign no Figma inspirado na imagem fornecida.
É uma melhoria visual P2, sem incidente operacional relatado. Esta etapa entrega
design revisável, sem autorizar implementação da aplicação, alterações de contrato
ou ativação da integração.

## Base observada

A aplicação local tem lista de anúncios acompanhados, disponibilidade, último
preço conhecido, variação contra o preço anterior, mínimo, máximo, horários,
alerta de preço e histórico de leituras. Há tratamento separado para carregamento,
erro e falha de atualização que preserva dados já carregados. A operação externa
do Mercado Livre tem pendências próprias; a proposta visual não as encerra.

O design atual de Monitoramento usa o header e a navegação compartilhada definidos
na validação da 0040. Essa estrutura e a marca oficial devem ser preservadas.

## Comportamento esperado do design

O mesmo arquivo BestPrice IA do Figma recebe propostas desktop e mobile editáveis,
com a [imagem fornecida](references/monitoring-inspiration.png) como inspiração de
hierarquia: título e orientação, card com o robô, indicadores, evolução de preço,
resumo dos produtos e lista pesquisável. O estado principal usa exemplos claramente
identificados como demonstração; nenhum preço ou total representa dado operacional.

### Visão geral e navegação

Mantêm-se a sidebar de quatro destinos no desktop e a navegação inferior mobile,
sem Início ou Configurações acrescentados pela referência. A marca mantém IA menor,
elevada e próxima de BestPrice, com o símbolo oficial intacto. O robô já fornecido
aparece em tamanho discreto no aviso de integração, sem substituir a marca.

Os indicadores mostram produtos monitorados, produtos com queda na comparação com
o preço anterior, alertas ativos e produtos sem estoque. A base da queda fica
explícita; não se atribui janela de sete dias sem definir essa métrica. Os exemplos
são coerentes com a quantidade e os estados da lista.

### Evolução e produtos

O gráfico identifica qual anúncio está sendo observado e apresenta datas, preços
em reais e período selecionado. Não soma ou mistura preços de produtos diferentes.
Seu formato representa leituras registradas; não sugere observações inexistentes.
Uma alternativa de consulta textual aos registros fica visível. O resumo ao lado
organiza os estados dos produtos, sem pressupor categorização automática ausente.

A seção de produtos apresenta busca, filtros de estado e ação Adicionar anúncio.
No desktop, a leitura é tabular; no celular, os mesmos dados essenciais aparecem
em itens empilhados, com preço, variação, horário e situação identificados.
Produto sem preço utiliza ausência explícita, nunca zero. A única loja da proposta
é Mercado Livre Brasil; a presença de Amazon na referência não amplia o marketplace.

Adicionar anúncio solicita apenas a URL do anúncio. Nome, preço, foto e identificação
não se tornam campos manuais. As ações de detalhes e alerta têm rótulos claros.
O design dos controles de busca/filtros/período é uma proposta para validação, sem
comprovar suporte executável ou criar novos contratos nesta etapa.

### Estados e recuperação

A proposta documenta carregamento, lista vazia, erro de carregamento e fonte
indisponível com dados salvos. A indisponibilidade impede apresentar preços como
atuais, preserva os registros conhecidos e informa suas datas. Falha de consulta
não se converte em queda, estoque esgotado ou preço zero. A lista vazia oferece o
primeiro acompanhamento por link quando a integração estiver disponível.

Os elementos têm alvos de interação de 44 × 44 px, contraste legível e informação
de estado por texto além de cor. A composição mobile preserva leitura e ações sem
rolagem horizontal de página. O design continua com texto, formas e gráficos
editáveis; apenas a logo e o robô são imagens.

## Critérios de aceite

Nesta etapa só de design, `[x]` indica evidência visual/documental em
[verification.md](verification.md); a spec segue `rascunho` até a validação da
pessoa responsável.

- [x] **AC01 — Propostas:** há quadros desktop e mobile editáveis no arquivo BestPrice IA, com links e prévias registrados para validação antes de implementação.
- [x] **AC02 — Identidade:** header, navegação, marca com IA elevada e robô preservam a direção da 0040 e o material oficial fornecido; as demais páginas não são redesenhadas.
- [x] **AC03 — Hierarquia:** título, aviso com robô, quatro indicadores, evolução de preço, resumo de estados e lista de produtos são identificáveis nas duas propostas.
- [x] **AC04 — Coerência:** exemplos são identificados como demonstração; totais dos indicadores, estados e lista são consistentes e nenhum exemplo é apresentado como preço real atual.
- [x] **AC05 — Gráfico:** o gráfico nomeia um produto, mostra unidade monetária e período e oferece acesso textual aos registros; ausência de histórico tem estado explícito.
- [x] **AC06 — Lista:** a proposta mostra busca, filtros, adição por URL, preço, variação com base explícita, disponibilidade, data e ações; somente Mercado Livre Brasil é representado.
- [x] **AC07 — Recuperação:** os estados de carregamento, vazio, erro e fonte indisponível com dados salvos são distintos e apresentam uma ação ou orientação apropriada, sem simular atualização.
- [x] **AC08 — Mobile:** a proposta de 390 px usa itens empilhados, preserva os dados essenciais e mantém header e navegação inferior sem sobrepor o conteúdo.
- [ ] **AC09 — Legibilidade:** ações têm alvos mínimos de 44 × 44 px e estados usam rótulos além de cor; o gráfico e o conteúdo não dependem somente de imagens rasterizadas.
- [x] **AC10 — Escopo:** não há alteração de código, contrato, integração, banco ou implantação; limitações de validação funcional e de publicação da Issue ficam registradas.

## Fora de escopo

- Implementar a página na aplicação ou alterar API, banco, agendamento e métricas.
- Habilitar integração, scraping, outros marketplaces, cobrança ou notificações novas.
- Copiar nomes pessoais, planos, números e fotos da referência como dados de usuário.
- Redesenhar a marca, substituir o robô ou acrescentar configurações por constarem na imagem.
- Garantir atualização de preços, comportamento de busca/filtros ou funcionamento do protótipo a partir de telas estáticas.

## Suposições e pendências

- O escopo desta solicitação é somente Figma, em desktop e mobile, mantendo o
  processo de validação visual antes de código estabelecido pela pessoa responsável.
- A imagem orienta composição e densidade; as regras do produto prevalecem sobre
  os exemplos nela presentes. A prioridade sugerida é P2.
- O arquivo de destino é o BestPrice IA (`LZVtUEAycEzfbwL0H5YL3r`), o mesmo da 0040.
  A edição pela interface do Figma segue a autorização da pessoa responsável dada
  antes desta etapa (29/10/2026); o MCP está sem cota.
- A confirmação da proposta e eventual escopo de implementação permanecem pendentes.
- As propostas e suas prévias estão relacionadas em [verification.md](verification.md).
  A spec continua em rascunho para validação visual, sem implementação iniciada.
- Issue registrada: [#221](https://github.com/SamiaLuvanice/bestprice/issues/221),
  após autorização explícita para publicar o conteúdo de [issue.md](issue.md),
  incluindo o link do Figma. A sincronização com Project não foi comprovada.
