# 0041 — Evidência da etapa de design

Data: 29/10/2026. Situação: **proposta no Figma entregue para validação; aplicação não alterada**.

## Quadros entregues

Arquivo existente: BestPrice IA, `LZVtUEAycEzfbwL0H5YL3r`.

| Quadro | Página | Dimensões | Link | Prévia |
| --- | --- | --- | --- | --- |
| Monitoramento desktop | 01 · BestPrice IA — Desktop | 1440 × 1040 | [151:11](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=151-11) | [desktop.png](design/desktop.png) |
| Monitoramento mobile | 02 · BestPrice IA — Mobile | 390 × 1920 | [152:312](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=152-312) | [mobile.png](design/mobile.png) |
| Estados e recuperação | 00 · BestPrice IA — Design system | 1440 × 900 | [152:535](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=152-535) | [states.png](design/states.png) |

Os quadros principais se chamam `0041 · Monitoramento · Desktop` e
`0041 · Monitoramento · Mobile`. Foram criados a partir de cópias das telas atuais,
preservando os quadros anteriores de Monitoramento e as outras páginas.

## Conferência visual e estrutural

- Header, sidebar, marca oficial e acesso à conta foram preservados das telas
  padronizadas na 0040. A navegação inferior mobile foi conferida com seus quatro
  destinos e rótulos completos, sem sobrepor a lista.
- O robô original foi copiado do asset já existente no arquivo e redimensionado
  proporcionalmente para 80 × 80 no card de orientação. Não houve geração de outro
  personagem nem substituição da marca.
- As propostas apresentam quatro indicadores: 5 anúncios monitorados, 2 em queda
  contra o preço anterior, 3 alertas ativos e 1 sem estoque. Os cinco itens da lista
  e o resumo de situações são coerentes: duas quedas, uma alta, um estável e um sem
  estoque. Os preços e horários são explicitamente ilustrativos.
- O gráfico identifica Notebook Inspiron 15, período de 30 dias, preços em reais,
  datas e último registro de R$ 2.879,00. A linha em degraus representa leituras
  conhecidas e a ação Ver registros de preço está visível. O estado vazio inclui
  orientação de que o gráfico aparece após o primeiro preço válido.
- Desktop usa tabela com loja, preço, variação, alerta, última leitura e situação.
  Mobile usa cinco cartões empilhados com os dados principais, busca, filtros e
  Adicionar anúncio. Mercado Livre Brasil é a única fonte representada.
- Ilustrações pequenas de produtos são vetoriais e genéricas, sem alegação de
  fotos de anúncios reais. O produto sem estoque preserva o último preço conhecido
  com esse rótulo, sem convertê-lo em zero.
- O quadro auxiliar contém carregamento sem números fabricados, vazio com entrada
  somente por URL, erro com Tentar novamente e fonte indisponível com dados salvos
  datados e adição indisponível.
- Textos, superfícies, ícones, indicadores e gráficos foram importados como camadas
  nativas editáveis, organizadas em grupos de propósito. A inspeção do título do
  quadro de estados, nó `152:537`, confirmou painel Texto, família Inter e tamanho
  28. Logo e robô permanecem assets de imagem, sem interface achatada em screenshot.
- O primeiro desenho do anel foi ajustado para setores vetoriais contínuos após a
  conferência revelar diferenças na importação do tracejado SVG. A exportação final
  confirmou os quatro setores e as contagens correspondentes.

## Prévias e verificações locais

As três exportações PNG foram obtidas pela interface do Figma, copiadas para esta
spec e abertas para inspeção visual. As dimensões foram conferidas com Pillow.
A referência fornecida foi copiada sem edição para
[monitoring-inspiration.png](references/monitoring-inspiration.png).

Foi conferida a codificação UTF-8 e a ausência de espaços finais nos documentos.
O contraste de pares de texto selecionados foi calculado localmente; isso não
equivale a uma auditoria completa de acessibilidade do arquivo ou da aplicação.
Resultados: texto principal/branco 16,83:1; secundário/branco 6,07:1;
branco/rosa 5,85:1; queda/fundo verde claro 5,00:1; aviso/fundo amarelo 7,37:1.

## Limites e pendências

- As telas são propostas estáticas para revisão. Busca, filtros, períodos, ação de
  adicionar, detalhes, alertas e recuperação não foram conectados a interações ou
  dados reais. Não houve consulta operacional de preços nem validação de integração.
- A tipografia Inter acompanha a importação disponível no Figma e as telas atuais;
  sua equivalência às famílias da SPA e a vinculação integral a variáveis/componentes
  publicados devem ser tratadas no planejamento, se a proposta for aprovada.
- Botões visíveis de ação e filtros foram desenhados com altura 44 px. Regiões de
  toque de links textuais, foco, teclado, leitores de tela, contraste dos limites de
  controles e adaptação executável a 320/768/1280 px permanecem para validação; AC09
  não é dado como integralmente comprovado.
- Não houve alteração de código da aplicação, dependências, contrato, banco,
  autenticação ou deploy. Lint, testes e build da aplicação não foram executados,
  pois esta entrega contém somente design, referência, documentação e prévias.
- O MCP oficial criou uma sessão para a tarefa e recusou a leitura seguinte por
  cota Starter. A edição foi feita pela interface pública autorizada do Figma, sem
  API privada, bridge ou alteração das permissões do navegador.
- A consulta ao GitHub não encontrou Issue 0041. A revisão automática recusou
  `gh issue create` porque a publicação do resumo da spec e do link do projeto no
  GitHub precisava de aprovação desse conteúdo específico. O texto está preparado
  em [issue.md](issue.md). Após a autorização explícita da pessoa responsável,
  o comando foi executado com sucesso e criou a
  [Issue #221](https://github.com/SamiaLuvanice/bestprice/issues/221), com esse
  conteúdo e o link do Figma. A sincronização com Project não foi comprovada.
- A spec segue em rascunho, aguardando validação da pessoa responsável. Não houve
  plano de implementação, worktree de código, commit, PR, merge ou implantação.

## Aceite desta etapa

AC01–AC08 e AC10 têm evidência visual/documental nesta entrega. AC09 tem conferência
parcial, com as pendências acima. A aprovação visual da pessoa responsável e toda
verificação funcional de eventual implementação são etapas posteriores.
