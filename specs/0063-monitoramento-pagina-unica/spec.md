---
numero: 0063
titulo: Monitoramento em página única
tipo: melhoria
prioridade: P2
status: pronta
toca: [frontend]
depende_de: [0041, 0056]
issue: https://github.com/SamiaLuvanice/bestprice/issues/349
---

# 0063 — Monitoramento em página única

## Problema

Quem acompanha anúncios pela área com barra lateral (Assistente IA, Histórico,
Monitoramento) encontra, ao abrir Monitoramento, uma segunda navegação interna
(Início, Produtos, Alertas) com um segundo sino. Os indicadores aparecem como texto
corrido, sem destaque para os números, e a lista vazia ainda mostra o cabeçalho da
tabela sem linhas. Os links para o detalhe de um produto levam a pessoa para fora da
área com barra lateral.

O Figma traz a direção visual: uma página única "Monitoramento de preços" (quadro
0041, nó 151-11) e o estado sem produtos (quadro 06, nó 59-254). O quadro 0041,
porém, inclui elementos que os dados atuais não sustentam (anel de situação, busca,
filtros com contagem, gráfico agregado com períodos e indicador "Sem estoque"). A
análise de 27/11/2026 comparou o Stage e os quadros e escolheu o híbrido: estrutura
e visual do Figma, preenchidos apenas com o que a API já fornece.

## Comportamento esperado

### Página única

Em Monitoramento, a pessoa vê uma única página com o título "Monitoramento de
preços" e a frase "Acompanhe seus anúncios e reconheça o melhor momento de comprar.",
sem a navegação interna Início / Produtos / Alertas. O sino de notificações aparece
uma única vez, junto ao link "Ver alertas". O endereço antigo da visão geral é
substituído pelo endereço da página única, sem deixar entrada extra no histórico.

### Indicadores

Com produtos acompanhados, quatro cartões mostram ícone, número em destaque e rótulo,
fiéis ao resumo existente: produtos monitorados, produtos que baixaram de preço nas
últimas 24 horas, alertas ativos e produtos no preço-alvo. Nenhum indicador sugere
métrica ou janela de tempo diferente da fornecida.

### Produtos monitorados

A seção "Produtos monitorados" mostra, entre parênteses, o total de produtos
acompanhados informado pelo resumo. A ação "Adicionar anúncio" funciona como hoje:
abre o campo do link do anúncio (único dado pedido), com sucesso, erro e "Ver produto"
para duplicado junto ao campo; o link trazido da landing continua aparecendo
pré-preenchido e com foco.

A tabela tem as colunas Produto, Último preço, Variação, Menor preço, Situação,
Última leitura e Ações. A situação é um rótulo em texto (além de cor) derivado dos
dados do próprio produto, nesta ordem: "Indisponível" quando o anúncio está
indisponível; "Sem preço" sem preço atual; "Sem variação conhecida" sem variação
contra o preço anterior; e então "Em queda", "Em alta" ou "Sem alteração". A linha
secundária continua com preço anterior, maior preço, última consulta e última
alteração, e passa a mostrar também a disponibilidade (Disponível, Indisponível ou
Não confirmada). Preço desconhecido nunca vira zero, e os avisos atuais (último preço
conhecido, preço desatualizado, anúncio não localizado, falha da última consulta,
alerta configurado) continuam visíveis. Não há coluna de loja, pois a única fonte é o
Mercado Livre Brasil. No celular, cada produto é um item empilhado com título, último
preço, variação, situação, última leitura e acesso às ações.

### Detalhe dentro da área

Todo link para o detalhe de um produto exibido dentro da área com barra lateral
(lista, atualizações recentes, "Ver produto" após adicionar, sino, página de alertas)
abre o detalhe dentro da área. Do detalhe, "Voltar ao monitoramento" leva à página
única. Depois de parar de acompanhar, a pessoa volta à página única, com foco no
título da lista ou, se ela ficar vazia, no campo de link. Um produto inexistente
mostra o mesmo erro do detalhe atual, com "Voltar ao monitoramento".

### Atualizações recentes e alertas

As atualizações recentes continuam abaixo da lista. A seção "Boas oportunidades" sai
do produto: ela só existia na antiga visão geral (o endereço `/` mostra a landing), e os
produtos em queda já aparecem pela situação e pelo indicador.
A página de alertas continua existindo, acessível pelo link "Ver alertas" e por "Ver
todas as notificações" no sino, com "Voltar ao monitoramento", sem sair da área.

### Estados

"Sem produtos" segue o mesmo critério do vazio atual (lista carregada, nenhum item e
nenhuma página seguinte). Nesse caso a página mostra o título, um cartão "Nenhum
produto acompanhado" com o campo de link e a ação de monitorar aberta, sem indicadores
e sem cabeçalho de tabela. Carregamento sem números fabricados, erro com "Tentar
novamente" e falha de atualização que preserva os dados já exibidos continuam como hoje.

### Rotas fora da barra lateral

As rotas `/produtos` e `/alertas` mantêm a navegação interna e os links atuais; o item
Início dessa navegação leva à página única. Como a tabela é a mesma, elas também recebem
as colunas e a situação novas.

## Critérios de aceite

- [x] **AC01 — Página única:** em `/app/monitoring`, com produtos, há um único `h1` "Monitoramento de preços" seguido da frase de orientação, não há navegação Início / Produtos / Alertas, e o botão de notificações aparece uma vez.
- [x] **AC02 — Endereço antigo:** abrir `/app/monitoring/overview` substitui o endereço por `/app/monitoring` e mostra a página única.
- [x] **AC03 — Indicadores:** com produtos, quatro cartões mostram os valores do resumo com rótulos "Produtos monitorados", "Baixaram de preço" (nas últimas 24h), "Alertas ativos" e "Preço-alvo atingido" (no alvo agora); sem produtos, nenhum cartão aparece.
- [x] **AC04 — Lista:** o título "Produtos monitorados (N)" usa o total do resumo; as colunas são exatamente Produto, Último preço, Variação, Menor preço, Situação, Última leitura e Ações; "Adicionar anúncio" abre um único campo, o do link; o link vindo da landing aparece pré-preenchido.
- [x] **AC05 — Situação:** os rótulos seguem a ordem Indisponível → Sem preço → Sem variação conhecida → Em queda / Em alta / Sem alteração; a disponibilidade aparece na linha secundária.
- [x] **AC06 — Dados preservados:** preço desconhecido nunca aparece como zero; os avisos de último preço conhecido, preço desatualizado, anúncio não localizado, falha da última consulta e alerta configurado continuam visíveis; "Carregar mais" continua funcionando.
- [x] **AC07 — Detalhe na área:** os links de produto da lista, das atualizações recentes, do "Ver produto" após adicionar, do sino e da página de alertas levam a `/app/monitoring/<id>`; o detalhe oferece "Voltar ao monitoramento"; parar de acompanhar volta à página única; id inexistente mostra o erro com "Voltar ao monitoramento"; atualizar agora continua funcionando.
- [x] **AC08 — Alertas:** "Ver alertas" e "Ver todas as notificações" levam a `/app/monitoring/alerts`, que mostra "Voltar ao monitoramento".
- [x] **AC09 — Seções:** "Atualizações recentes" aparece abaixo da lista; "Boas oportunidades" não aparece na página única.
- [x] **AC10 — Vazio:** sem produtos, aparecem o título, o cartão "Nenhum produto acompanhado" com campo de link e "Monitorar preço", sem indicadores e sem cabeçalho de tabela.
- [x] **AC11 — Estados:** carregamento sem números fabricados, erro com "Tentar novamente" e falha de atualização preservando os dados continuam funcionando.
- [x] **AC12 — Responsivo e acessível:** sem rolagem horizontal em 320, 390, 768, 1024, 1280 e 1440 px; itens empilhados no celular com os dados listados acima; ações com alvo de pelo menos 44 × 44 px; sem violações axe WCAG 2.2 AA na página única com produtos, vazia e com erro, em 390 e 1280 px.
- [x] **AC13 — Rotas legadas:** `/produtos` e `/alertas` mantêm navegação interna (Início leva à página única) e links para `/produtos/<id>`; API, banco e contrato não mudam.

## Fora de escopo

- Anel "Visão dos produtos", busca, filtros com contagem, gráfico agregado com
  seleção de período e indicador "Sem estoque" do quadro 0041: dependem de dados ou
  contratos que não existem e exigem spec própria.
- Aviso com o robô sobre a integração: não há informação de disponibilidade da
  integração para a interface decidir quando mostrá-lo.
- Redesenhar o detalhe do produto, a página de alertas ou o sino além dos links e do
  caminho de volta; mudar backend ou contrato.

## Perguntas em aberto

- **Figma:** os quadros 0041 (151-11) e 06 (59-254) são a referência visual das partes
  incluídas; a validação visual registra "fiel ao quadro, exceto os itens fora de
  escopo". Atualizar os quadros para o híbrido fica como pendência registrada em
  verificação, pois o MCP do Figma não está disponível nesta sessão.
- **Decisão:** "Boas oportunidades" sai do produto porque duplica a situação "Em queda" e o
  indicador e só existia na visão geral substituída; as atualizações recentes ficam por não
  terem equivalente.
- **Suposição:** o estado vazio mantém o campo de link (proposta central do produto)
  em vez de só "Ir ao assistente" do quadro 06, pois a interface não sabe se a
  integração está ativa.
