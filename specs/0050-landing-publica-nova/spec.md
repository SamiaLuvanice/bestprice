---
numero: 0050
titulo: Landing pública nova conforme o Figma
tipo: feature
prioridade: P2
status: rascunho
toca: [frontend, docs]
depende_de: [0016, 0048, 0049]
issue: https://github.com/SamiaLuvanice/bestprice/issues/275
---

# 0050 — Landing pública nova conforme o Figma

Issue: https://github.com/SamiaLuvanice/bestprice/issues/275

## Problema

A página pública inicial (`/`) é o primeiro contato de quem chega ao BestPrice. Hoje ela
apresenta o produto como um assistente de comparação ("Compre com mais clareza"), com uma
foto genérica e uma seção sobre o comparador. A proposta central do produto não aparece:
**cole o link de um anúncio do Mercado Livre uma vez, e o acompanhamento passa a ser
automático** (`docs/product-context.md`).

O Figma aprovado tem uma landing nova, centrada no monitoramento, com o robô do BestPrice
como narrador. A spec 0049 levou o design system às telas internas e deixou essa landing
para uma spec separada. Por isso, quem visita a landing vê uma linguagem e uma promessa
diferentes das telas internas.

O problema afeta:

- **Visitantes:** não entendem em segundos o que o produto faz nem que basta um link.
- **O produto:** a primeira impressão destoa do restante, já redesenhado.

## Referência

Arquivo Figma [BestPrice IA](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=6-83),
consultado em 08/11/2026:

| Quadro | Página | Identificador | Tamanho |
|---|---|---|---|
| 01 · Landing · Desktop | 01 · BestPrice IA — Desktop | 238:294 | 1440 × 8268 |
| 01 · Landing · Mobile | 02 · BestPrice IA — Mobile | 239:180 | 390 × 8497 |
| 01 · Landing · Menu aberto · Mobile | 02 · BestPrice IA — Mobile | 239:856 | 390 × 844 |
| Notas de interação (Hero, Problema → virada, Como funciona, Demonstração, Benefícios e FAQ, CTA final, Assistente IA) | 01 · BestPrice IA — Desktop | 238:745, 238:752, 238:757, 238:762, 238:767, 238:771, 238:776 | — |

Os textos, a ordem das seções, a hierarquia e os componentes vêm desses quadros. Os
tokens e componentes são os do design system da spec 0049.

## Comportamento esperado

### Estrutura

A landing em `/` passa a ter, nesta ordem, as seções dos quadros:

1. **Cabeçalho:** marca e âncoras para Como funciona, Demonstração, Assistente e Perguntas;
   "Entrar" e "Começar a monitorar". No mobile, as âncoras e as ações ficam num menu que
   abre sobre a página, como no quadro "Menu aberto".
2. **Hero, com o robô vigiando:** título "Pare de dar F5 no preço.", campo de link com
   "Monitorar preço", selos de confiança e o cartão ilustrativo de um anúncio com gráfico,
   preço-alvo, consultas recentes e o aviso "Chegou no seu preço-alvo".
3. **Problema → virada:** as cenas do "jeito antigo" (abas acumuladas, memória que não
   ajuda, momento que passa) e a faixa escura "Deixa comigo.".
4. **Como funciona:** os três passos (cole o link; o BestPrice acompanha; você decide na
   hora certa).
5. **Demonstração:** um produto acompanhado, com preço atual, anterior, menor e maior
   registrados, preço-alvo, horários e o histórico em degraus, marcado como dados
   ilustrativos.
6. **Por que BestPrice:** os quatro benefícios, em lista com divisores.
7. **BestPrice IA — Assistente de compras:** uma conversa ilustrativa com fontes da pesquisa
   na web, conversas recentes e os avisos do assistente, seguida da faixa escura "Decidiu
   qual anúncio? Agora é comigo." com "Monitorar um anúncio".
8. **Perguntas frequentes:** as cinco perguntas, que abrem e fecham.
9. **CTA final:** "Cole o primeiro link. O resto é com o robô.", com "Começar a monitorar"
   e "Já tenho conta".
10. **Rodapé:** marca, descrição e links.

No mobile, a landing segue o quadro mobile, inclusive a barra fixa "Pronto para parar de
conferir?" com "Começar".

Todo dado de anúncio, preço, conversa e horário mostrado na landing é ilustrativo e fixo,
como no Figma. A landing não consulta preços, anúncios nem o assistente.

### Para onde cada ação leva

| Ação | Visitante sem sessão | Pessoa com sessão |
|---|---|---|
| "Começar a monitorar", "Começar", "Monitorar um anúncio" | Criar conta, se o cadastro estiver ligado; senão, Entrar | Monitoramento |
| "Entrar", "Já tenho conta" | Entrar | Área logada |
| Âncoras do cabeçalho, do menu e do rodapé | Rolagem até a seção | Igual |

### Campo de link do hero

- O visitante cola o link de um anúncio e envia com "Monitorar preço".
- **Campo vazio:** a landing mostra uma mensagem junto ao campo e não sai da página.
- **Com sessão:** a pessoa vai ao monitoramento com o link já preenchido no campo de
  acompanhar, pronta para confirmar.
- **Sem sessão:** a pessoa vai para Criar conta (cadastro ligado) ou Entrar (cadastro
  desligado). Ao concluir, chega ao monitoramento com o link já preenchido, pronta para
  confirmar. Trocar entre Entrar e Criar conta no caminho não perde o link.
- O link não é enviado ao servidor antes da confirmação no monitoramento, e nenhum
  acompanhamento é criado sem essa confirmação. Toda validação do link continua sendo a
  do monitoramento, com as mensagens atuais.

### Movimento

As animações e microinterações das notas do Figma fazem parte da landing:

- **Hero:** entrada do título, do cartão e do robô em sequência; flutuação contínua do robô;
  feixe de leitura pulsando; linha do gráfico se desenhando até o ponto verde; o aviso
  "Chegou no seu preço-alvo" entrando depois do carregamento; o robô passa ao estado
  "Encontrou", com o selo "menor preço", ao receber o ponteiro.
- **Problema → virada:** cenas entram em sequência ao chegar à área visível; a seta da
  faixa "Deixa comigo." rola suavemente até Como funciona.
- **Como funciona:** um traço verde percorre os números 01 → 02 → 03 conforme a rolagem; os
  detalhes de cada passo aparecem; o robô assume uma pose por passo (ler, vigiar, avisar).
- **Demonstração:** o gráfico em degraus se desenha conforme a rolagem e o robô pousa no
  último ponto, com a dica do menor preço registrado. O gráfico usa degraus, não curva.
- **Assistente:** ao chegar à área visível, a mensagem da pessoa aparece, o robô mostra
  "Preparando uma resposta…" e, em seguida, a resposta entra com as fontes.
- **Perguntas:** cada pergunta abre e fecha com transição.
- **CTA final:** órbitas girando devagar e o robô em "Escaneando".
- **Companheiro de rolagem:** um mini-robô no canto inferior direito troca a frase conforme
  a seção ("Tô de olho", "Achei uma queda", "Pode deixar") e some no hero e no CTA final.

Os tempos e as curvas são os das notas do Figma. Quando o sistema pede movimento reduzido,
todas as animações viram cortes simples, e a flutuação, as órbitas e o desenho contínuo
param. Nenhuma animação esconde ou atrasa a leitura do conteúdo ou o uso do campo de link.

### Linguagem visual

- Mantém a da spec 0049: verde de ação com texto preto na ação principal, rosa para
  leitura, links e foco, e títulos largos quando a fonte existe no aparelho.
- O assistente usa o rosa como cor de leitura, e o monitoramento usa o verde, como nas
  notas do Figma.
- As faixas escuras usam os valores "Noite" do design system. O produto continua com tema
  claro fixo (spec 0016).
- O robô e a marca usam a arte original do Figma, sem redesenho.

## Critérios de aceite

- [ ] **AC01 — Seções e textos:** dada a landing em 1440 px e em 390 px, quando o conteúdo é comparado com os quadros 238:294 e 239:180, então as seções aparecem na ordem do Figma e cada texto é igual ao do quadro. A verificação traz a lista de textos marcada item a item.
- [ ] **AC02 — Fidelidade visual:** para cada seção, a verificação traz a captura da implementação ao lado do recorte do quadro, em 1440 px e 390 px, mais o menu aberto do mobile. A comparação confere ordem e hierarquia, componentes, tokens de cor, de texto e de espaço e o conteúdo. Divergência só com motivo, categoria (fonte substituta, limite técnico ou comportamento preservado) e aprovação explícita da responsável.
- [ ] **AC03 — Ações:** dado um visitante sem sessão, com o cadastro ligado e depois desligado, e dada uma pessoa com sessão, quando cada ação da tabela "Para onde cada ação leva" é acionada, então o destino é o da tabela.
- [ ] **AC04 — Link levado pelo login:** dado um visitante sem sessão, quando ele envia um link no hero e conclui Entrar, então chega ao monitoramento com o mesmo link preenchido, e nenhum acompanhamento foi criado. O mesmo vale ao concluir Criar conta com o cadastro ligado e ao trocar entre Entrar e Criar conta no caminho.
- [ ] **AC05 — Link com sessão:** dada uma pessoa com sessão, quando ela envia um link no hero, então chega ao monitoramento com o link preenchido, pronta para confirmar, e nenhum acompanhamento foi criado.
- [ ] **AC06 — Campo vazio:** dado o campo de link vazio, quando "Monitorar preço" é acionado, então uma mensagem aparece junto ao campo, associada a ele para leitores de tela, e a página não muda.
- [ ] **AC07 — Sem envio antecipado:** dado o fluxo do AC04, quando as requisições de rede são inspecionadas, então o link não aparece em nenhuma requisição ao servidor antes da confirmação no monitoramento. A landing não faz requisição de preço, anúncio ou assistente.
- [ ] **AC08 — Movimento:** dada a landing, quando cada animação da seção "Movimento" é observada, então ela acontece no gatilho descrito e com o tempo das notas do Figma. A verificação lista cada animação com o tempo esperado e o obtido.
- [ ] **AC09 — Movimento reduzido:** dado o sistema com movimento reduzido, quando a landing é usada do início ao fim, então nenhuma transição contínua roda, todo conteúdo aparece já no estado final e o companheiro de rolagem fica parado.
- [ ] **AC10 — Companheiro de rolagem:** dada a rolagem da landing, quando cada seção ocupa a área visível, então o mini-robô mostra a frase da seção, fica oculto no hero e no CTA final, não cobre o campo de link, as ações nem a barra fixa do mobile e não recebe foco do teclado.
- [ ] **AC11 — Perguntas frequentes:** dadas as cinco perguntas, quando cada uma é acionada por clique ou teclado, então ela abre e fecha, e o estado aberto é anunciado aos leitores de tela.
- [ ] **AC12 — Menu mobile:** dado o mobile, quando o menu é aberto, então ele mostra os itens do quadro 239:856, prende o foco enquanto aberto, fecha com Esc, com o botão de fechar e ao escolher uma âncora, e devolve o foco ao botão que o abriu.
- [ ] **AC13 — Acessibilidade:** dada a landing em 320, 390, 768 e 1280 px, quando é verificada, então: não há violação WCAG 2.2 AA na verificação automatizada; todo alvo interativo tem pelo menos 44 × 44 px; o foco é visível e a página funciona só com o teclado; não há rolagem lateral; as artes decorativas não são anunciadas e o robô informativo tem texto alternativo.
- [ ] **AC14 — Afirmações verdadeiras:** dadas as afirmações da landing sobre o produto (fonte oficial sem scraping, consultas automáticas, registro de preço e disponibilidade, aviso no sino quando o preço fica igual ou abaixo do alvo, preço de uma unidade sem frete, só Mercado Livre Brasil, conversas por 90 dias, limite de 2.000 caracteres), quando cada uma é conferida com o comportamento atual, então todas são verdadeiras. A verificação aponta a evidência de cada uma.
- [ ] **AC15 — Carregamento estável:** dada a landing em 1440 px e em 390 px, quando ela carrega, então o título e o campo de link do hero ficam visíveis e utilizáveis sem esperar animação, o deslocamento acumulado de layout fica em até 0,1 e nenhuma fonte é buscada em serviço externo.
- [ ] **AC16 — Regressão visual revisada:** dada a suíte de regressão visual, quando as referências da landing são atualizadas, então cada diferença foi apresentada e aprovada explicitamente, sem atualização em massa sem revisão, e as demais telas não mudam.
- [ ] **AC17 — Comportamento preservado:** dadas as suítes do frontend, quando são executadas, então passam com contagem positiva, e só mudam as asserções da landing antiga. Login, cadastro, monitoramento e a página "não encontrada" continuam como hoje, exceto por receberem o link do hero.

## Fora de escopo

- Prévia do anúncio na landing antes do login ("Reconhecido" com título, imagem e preço),
  que exigiria consulta pública ao Mercado Livre.
- Qualquer mudança de backend, contrato da API, regra de monitoramento ou de alerta.
- Criar o acompanhamento sem a confirmação da pessoa no monitoramento.
- Conversa real com o assistente na landing.
- Textos, seções ou artes fora dos quadros do Figma; edições no Figma.
- Tema escuro alternável ou automático.
- Mudanças nas telas internas, salvo receber o link do hero no monitoramento.
- Métricas, rastreamento de visitantes ou testes A/B.

## Perguntas em aberto

- **"Só o link, nenhum cadastro":** o selo do hero vem do Figma, mas o visitante precisa de
  conta para monitorar. Suposição: o selo quer dizer "nenhum cadastro de dados do produto".
  Manter o texto do Figma pode ser lido como "não precisa de conta". **Decisão da
  responsável antes do `/plan`:** manter, ou ajustar o texto no Figma.
- **Título da aba do navegador:** o Figma não define. Suposição: passa a refletir a
  mensagem do hero, sem texto novo além do título "Pare de dar F5 no preço.".
- **Assistente sem pesquisa na web:** a nota cita um estado alternativo. Suposição: a
  landing mostra só a versão com fontes, porque o conteúdo é ilustrativo e o aviso abaixo
  da conversa já diz que as respostas dependem de disponibilidade.
- **Poses do robô:** suposição de que o Figma tem a arte de cada pose citada nas notas
  (vigiando, encontrou, ler, vigiar, avisar, escaneando, preparando a resposta). Uma pose
  sem arte volta ao Figma antes da implementação.
- **Pessoa com sessão na landing:** o Figma não define um cabeçalho para quem está logado.
  Suposição: os mesmos textos, com os destinos da coluna "Pessoa com sessão".
- **Fatiamento:** o `/plan` pode dividir a entrega em mais de uma PR, por exemplo conteúdo e
  ações primeiro, movimento depois. Cada PR mantém os critérios já atingidos.
