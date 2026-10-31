---
numero: 0043
titulo: Figma sem comparador, centrado em assistente, conversas e monitoramento
tipo: melhoria
prioridade: P2
status: rascunho
toca: [design]
depende_de: [0040, 0041, 0042]
issue: https://github.com/SamiaLuvanice/bestprice/issues/223
---

# 0043 — Figma sem comparador, centrado em assistente, conversas e monitoramento

## Problema e público

A pessoa responsável pelo produto redefiniu a proposta principal do BestPrice:
conversar com o assistente de IA para escolher bem um produto, guardar o histórico
dessas conversas e monitorar o preço de produtos informados por link. O comparador
manual de 2–3 produtos deixou de fazer sentido nesta fase.

O arquivo [BestPrice IA no Figma](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=59-204)
ainda apresenta o Comparador como destino de navegação, quadro próprio, tipo de
pesquisa no Histórico e conteúdo da landing. Quem revisa o design recebe, assim, uma
proposta de produto que não corresponde mais à direção atual.

O público é a pessoa responsável pelo produto e quem mantém o design. É melhoria
P2, sem incidente operacional. Nesta primeira etapa, apenas o Figma muda.

## Situação atual

- A navegação interna (header, sidebar e mobile) tem quatro destinos: Assistente,
  Comparar, Histórico e Monitorar (padrão consolidado na 0042).
- Há quadros desktop e mobile do Comparador.
- O Histórico apresenta conversas e comparações, com filtro de tipo e rótulo
  "Comparação" nos itens.
- A landing, a prévia da aplicação na landing, os fundamentos e a biblioteca de
  componentes podem citar ou mostrar a comparação.
- A aplicação ainda tem a tela do comparador e o histórico misto. Ela não muda
  nesta spec.

## O que conta como comparador

"Comparador" é a funcionalidade de comparação manual: destino de navegação, tela,
tipo de item no Histórico, chamada para ação e atalho ou sugestão que leve a ela.
O assistente pode continuar pesando opções dentro da conversa ("comparei os dois
modelos"). O monitoramento pode continuar comparando com o preço anterior. Essas
ocorrências não são removidas.

## Comportamento esperado do design

1. Os quadros do Comparador (59:153 desktop e 59:681 mobile, mais qualquer outro
   que o inventário encontrar) são removidos do arquivo, por decisão da pessoa
   responsável. Antes da edição, salva-se uma versão nomeada no histórico do Figma.
2. A navegação interna passa a ter três destinos com ícone e rótulo: Assistente,
   Histórico e Monitoramento. Os rótulos atuais de cada formato são mantidos:
   "Assistente IA" e "Monitoramento" no desktop, "Assistente" e "Monitorar" no
   mobile. Na barra mobile, os três destinos se distribuem por igual.
3. O Histórico mostra só conversas salvas. Não há filtro de tipo, item ou texto
   sobre comparações. Os elementos existentes (busca, ação de continuar em cada
   item e exemplos) permanecem, com textos ajustados. Novos estados do Histórico
   não são desenhados nesta spec.
4. A landing e sua prévia comunicam a proposta: conversar com a IA para escolher,
   retomar conversas e monitorar o preço por link. Não há promessa nem exemplo de
   comparador.
5. Fundamentos, biblioteca e estados auxiliares deixam de exibir o destino Comparar
   e componentes exclusivos da comparação.
6. Assistente e Monitoramento conservam a direção das specs 0040, 0041 e 0042. Isso
   inclui a marca, o rosa das ações principais e as margens. Ajustam-se apenas
   referências ao comparador, conforme definido acima.

## Critérios de aceite

- [ ] **AC01 — Inventário:** antes da edição, a evidência lista cada quadro, camada e componente em que "Compar" aparece no texto visível ou no nome da camada/componente, com ID, nome, tipo de ocorrência e destino. Uma versão nomeada do arquivo é salva antes da primeira alteração.
- [ ] **AC02 — Remoção:** nenhum quadro do Comparador permanece. A nova busca por "Compar" (textos e nomes de camadas e componentes) só encontra ocorrências permitidas pela seção "O que conta como comparador", cada uma listada com justificativa.
- [ ] **AC03 — Navegação:** os quadros 59:204, 59:716, 59:254, 59:752, 151:11, 152:312, 132:27, 132:361, 133:169 e 132:468, a biblioteca 6:805 e o componente mestre Navegação/Mobile 6:931 exibem exatamente três destinos (Assistente, Histórico e Monitoramento, com os rótulos atuais de cada formato), com ícone, rótulo completo e destaque só no destino corrente. O componente mestre mantém seu ID.
- [ ] **AC04 — Histórico:** 59:204 e 59:716 mostram só conversas, sem filtro de tipo nem item "Comparação". A busca, a ação de continuar em cada item e os exemplos permanecem.
- [ ] **AC05 — Landing:** o conteúdo público e a prévia apresentam assistente, histórico de conversas e monitoramento por link, sem mencionar comparador.
- [ ] **AC06 — Consistência:** as exportações dos quadros alterados não têm sobreposição, corte ou lacuna. Mantêm o rosa `#c7005e` nas ações principais, header de 80 px, sidebar de 240 px, margens de 32 px no desktop e 16–20 px no mobile, e controles de ao menos 44 px.
- [ ] **AC07 — Evidência:** quadros alterados têm exportação antes e depois. Quadros apagados têm exportação antes e prova de ausência pela árvore de camadas ou pela busca. A conferência da árvore de camadas dos quadros alterados está registrada em `verification.md`, com os textos ainda como camadas de texto, sem rasterizar a página.
- [ ] **AC08 — Escopo:** o diff da branch altera só `specs/0043-*`.

## Fora de escopo

- Remover o comparador da aplicação, de rotas, da API ou do banco, incluindo as
  comparações já salvas. Isso fica para uma spec futura.
- Atualizar `docs/product-context.md`, `docs/apps/frontend.md`, `designsystem/` e a
  decisão da spec 0034. Isso fica para a mesma spec futura.
- Desenhar novos estados do Histórico (vazio, carregamento e erro) ou o aviso de
  prazo de guarda.
- Vincular produtos monitorados a conversas ou criar novos recursos.
- Redesenhar marca, robô, Assistente ou Monitoramento além da retirada do comparador.

## Suposições e pendências

- "Produtos linkados" significa produtos acompanhados a partir do link do anúncio,
  como no monitoramento atual. Vincular conversas a produtos não faz parte desta spec.
- A edição usa o mesmo acesso ao Figma das specs 0041 e 0042. Os limites do MCP no
  plano Starter continuam valendo.
- A remoção dos quadros foi escolhida pela pessoa responsável em 31/10/2026, em vez
  do arquivamento.
- Issue [#223](https://github.com/SamiaLuvanice/bestprice/issues/223) criada em 31/10/2026, sem vínculo comprovado com GitHub Project.
