---
numero: 0050
titulo: Landing pública nova conforme o Figma
tipo: feature
prioridade: P2
status: pronta
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

"Com sessão" significa sessão já confirmada no momento do clique. Enquanto a sessão está
sendo verificada, ou se a verificação falhou, a ação segue como "sem sessão"; se a sessão
existir, Entrar e Criar conta já levam ao destino final, como hoje. "Cadastro ligado"
significa verificação do cadastro concluída e ligada; carregando ou com falha, vale a
coluna do cadastro desligado.

| Ação | Sem sessão, cadastro ligado | Sem sessão, cadastro desligado | Depois de concluir Entrar ou Criar conta | Com sessão |
|---|---|---|---|---|
| "Começar a monitorar", "Começar", "Monitorar um anúncio" | Criar conta | Entrar | Monitoramento | Monitoramento |
| "Entrar", "Já tenho conta" | Entrar | Entrar | Destino padrão atual após Entrar | Destino padrão atual após Entrar |
| "Monitorar preço" com link (campo do hero) | Criar conta | Entrar | Monitoramento com o link | Monitoramento com o link |
| Âncoras do cabeçalho, do menu e do rodapé | Rolagem até a seção | Igual | — | Igual |

O rodapé tem os links do quadro: Como funciona, Assistente, Perguntas (âncoras) e Entrar.

A landing atual tem entradas que o Figma não traz: "Começar com IA" (assistente), "Abrir
comparador" e "Criar conta" no cabeçalho. Elas saem de propósito. O assistente e o
comparador continuam acessíveis na área logada, e Criar conta continua a um clique, por
"Começar a monitorar" e pelo link de Entrar.

### Campo de link do hero

- O visitante cola o link de um anúncio e envia com "Monitorar preço".
- O valor é aparado nas pontas. **Campo vazio ou só com espaços:** a landing mostra uma
  mensagem junto ao campo, associada a ele, e não sai da página.
- **Com link:** o destino é o da tabela. No monitoramento, o campo de acompanhar aparece
  preenchido com o link, com o foco nele, e nada foi enviado; a pessoa confirma com a ação
  atual do formulário.
- **Vida do link:** ele fica guardado só na aba em que foi enviado, até ser usado uma vez
  no monitoramento ou até a aba fechar. Recarregar Entrar ou Criar conta, voltar pelo
  navegador ou trocar entre as duas páginas não o perde. Outra aba não o recebe. Um novo
  envio no hero substitui o anterior. Depois de usado, um novo acesso ao monitoramento
  abre com o campo vazio.
- O link nunca vai no endereço da página nem no histórico do navegador, nunca é enviado ao
  servidor antes da confirmação no monitoramento, e nenhum acompanhamento é criado sem
  essa confirmação. Toda validação do link continua sendo a do monitoramento, com as
  mensagens atuais.

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
  a seção e some no hero e no CTA final. Existe a partir de 768 px; no mobile, o quadro
  239:180 não o tem e a barra fixa ocupa a base da tela. As frases da nota 238:771 ficam
  assim:

  | Seção visível | Frase |
  |---|---|
  | Problema → virada, Como funciona | Tô de olho |
  | Demonstração, Por que BestPrice | Achei uma queda |
  | Assistente, Perguntas | Pode deixar |

  A frase é decorativa: não é anunciada a leitores de tela e o mini-robô não recebe foco.

Os tempos, os atrasos e as curvas são os das notas do Figma. Quando o sistema pede
movimento reduzido, todas as animações viram cortes simples: o conteúdo aparece já no
estado final (a conversa do assistente já completa, o gráfico já desenhado), a flutuação,
as órbitas e os pulsos param, e a frase do companheiro troca por corte.

O título do hero, o campo de link e as ações nunca esperam animação para ficar visíveis e
utilizáveis. O conteúdo narrativo que entra com atraso (cenas, aviso do hero, resposta do
assistente) fica completo em até 2 s depois de chegar à área visível.

### Linguagem visual

- Mantém a da spec 0049: verde de ação com texto preto na ação principal, rosa para
  leitura, links e foco, e títulos largos quando a fonte existe no aparelho.
- O assistente usa o rosa como cor de leitura, e o monitoramento usa o verde, como nas
  notas do Figma.
- As faixas escuras usam os valores "Noite" do design system. O produto continua com tema
  claro fixo (spec 0016).
- O robô e a marca usam a arte original do Figma, sem redesenho. O robô é o componente
  "Robô BestPrice" (237:35), com os estados Neutro, Escaneando, Alerta e Encontrou: os
  quatro usam a mesma arte original, a mesma que o assistente já usa, e mudam só os
  elementos ao redor (brilho, anéis, feixe, pulso e selos).
- A marca aparece como "BestPrice", conforme o quadro, no lugar de "BestPrice AI".
- O título da aba do navegador passa a ser "BestPrice · Pare de dar F5 no preço.".

### Ajuste de texto aprovado

O selo do hero "Só o link, nenhum cadastro" pode ser lido como "não precisa de conta", e
monitorar exige conta. Ele passa a ser **"Só o link, nada para preencher"**, nas versões
desktop e mobile. Divergência aprovada pela responsável em 08/11/2026; o Figma deve ser
atualizado depois.

## Critérios de aceite

- [ ] **AC01 — Seções e textos:** dada a landing em 1440 px e em 390 px, quando o conteúdo é comparado com os quadros 238:294 e 239:180, então as seções aparecem na ordem do Figma e cada texto é igual ao do quadro, exceto o selo da seção "Ajuste de texto aprovado". A marca é "BestPrice" e o título da aba é o desta spec. A verificação traz a lista de textos marcada item a item.
- [ ] **AC02 — Fidelidade visual:** para cada seção, a verificação traz a captura da implementação ao lado do recorte do quadro, em 1440 px e 390 px, mais o menu aberto do mobile. A comparação confere ordem e hierarquia, componentes, tokens de cor, de texto e de espaço e o conteúdo. Divergência só com motivo, categoria (fonte substituta, limite técnico ou comportamento preservado) e aprovação explícita da responsável.
- [ ] **AC03 — Ações:** para cada linha e coluna da tabela "Para onde cada ação leva" (sem sessão com cadastro ligado; sem sessão com cadastro desligado, carregando e com falha; sessão em verificação e com falha na verificação; depois de concluir Entrar e Criar conta; com sessão), quando a ação é acionada, então o destino é o da tabela.
- [ ] **AC04 — Link levado pelo login:** dado um visitante sem sessão, quando ele envia um link no hero e conclui Entrar, então chega ao monitoramento com o mesmo link (aparado) no campo, com o foco nele, e nenhum acompanhamento foi criado. O mesmo vale ao concluir Criar conta com o cadastro ligado, ao recarregar Entrar ou Criar conta, ao voltar pelo navegador e ao trocar entre as duas páginas no caminho.
- [ ] **AC05 — Link com sessão:** dada uma pessoa com sessão, quando ela envia um link no hero, então chega ao monitoramento com o link no campo, com o foco nele, e nenhum acompanhamento foi criado.
- [ ] **AC06 — Campo vazio:** dado o campo de link vazio ou só com espaços, quando "Monitorar preço" é acionado, então uma mensagem aparece junto ao campo, associada a ele para leitores de tela, e a página não muda.
- [ ] **AC07 — Vida do link:** dado um link enviado no hero, então: ele não aparece no endereço da página nem no histórico do navegador em nenhum passo; ele não aparece em nenhuma requisição ao servidor antes da confirmação no monitoramento; outra aba não o recebe; depois de usado, um novo acesso ao monitoramento abre com o campo vazio; um novo envio no hero substitui o anterior. A landing não faz requisição de preço, anúncio ou assistente.
- [ ] **AC08 — Movimento:** dada a landing, quando cada animação da seção "Movimento" é observada, então ela começa no gatilho descrito e sua duração, atraso e curva declarados são iguais aos da nota do Figma. Nas animações ligadas à rolagem, o progresso acompanha a posição da rolagem nos dois sentidos. A verificação lista cada animação com o valor esperado e o obtido.
- [ ] **AC09 — Movimento reduzido:** dado o sistema com movimento reduzido, quando a landing é usada do início ao fim, então nenhuma transição contínua roda, todo conteúdo aparece já no estado final (conversa do assistente completa, gráficos desenhados) e a frase do companheiro troca por corte.
- [ ] **AC10 — Companheiro de rolagem:** dada a rolagem da landing em 768, 1280 e 1440 px, quando cada seção ocupa a área visível, então o mini-robô mostra a frase da tabela da seção "Movimento", fica oculto no hero e no CTA final, não cobre o campo de link nem as ações, não é anunciado a leitores de tela e não recebe foco do teclado. Em 320 e 390 px ele não aparece.
- [ ] **AC11 — Perguntas frequentes:** dadas as cinco perguntas, quando cada uma é acionada por clique ou teclado, então ela abre e fecha, e o estado aberto é anunciado aos leitores de tela.
- [ ] **AC12 — Menu mobile:** dado o mobile, quando o menu é aberto, então ele mostra os itens do quadro 239:856, prende o foco enquanto aberto, fecha com Esc, com o botão de fechar e ao escolher uma âncora, e devolve o foco ao botão que o abriu.
- [ ] **AC13 — Acessibilidade:** dada a landing em 320, 390, 768 e 1280 px, quando é verificada, então: não há violação WCAG 2.2 AA na verificação automatizada; todo alvo interativo tem pelo menos 44 × 44 px; o foco é visível e a página funciona só com o teclado; não há rolagem lateral; o robô do hero tem texto alternativo que descreve o robô vigiando o preço, e as demais aparições do robô, as órbitas, os gráficos ilustrativos e o mini-robô não são anunciados como imagem.
- [ ] **AC14 — Afirmações verdadeiras:** dadas as afirmações da landing sobre o produto (fonte oficial sem scraping, consultas automáticas, registro de preço e disponibilidade, aviso no sino quando o preço fica igual ou abaixo do alvo, preço de uma unidade sem frete, só Mercado Livre Brasil, conversas por 90 dias, limite de 2.000 caracteres), quando cada uma é conferida com o comportamento atual, então todas são verdadeiras. A verificação aponta a evidência de cada uma. Uma afirmação falsa volta ao Figma antes da implementação.
- [ ] **AC15 — Carregamento estável:** dada a landing em 1440 px e em 390 px, quando ela carrega, então o título, o campo de link e as ações do hero ficam visíveis e utilizáveis sem esperar animação; o deslocamento acumulado de layout, medido do carregamento até o fim de uma rolagem completa, fica em até 0,1; o conteúdo narrativo atrasado fica completo em até 2 s depois de chegar à área visível; e nenhuma fonte é buscada em serviço externo.
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

Decisões tomadas na revisão da spec (08/11/2026), registradas para o `/plan`:

- **Selo do hero:** ajustado para "Só o link, nada para preencher" (seção "Ajuste de texto
  aprovado").
- **Título da aba e marca:** o Figma não define o título; ele usa a mensagem do hero. A
  marca segue o quadro ("BestPrice").
- **Assistente sem pesquisa na web:** a nota cita um estado alternativo. A landing mostra
  só a versão com fontes, porque o conteúdo é ilustrativo e o aviso abaixo da conversa já
  diz que as respostas dependem de disponibilidade.
- **Poses do robô:** as poses das notas (ler, vigiar, avisar, encontrou, escaneando) são os
  quatro estados do componente 237:35; "ler" corresponde a Neutro, "vigiar" a Escaneando e
  "avisar" a Alerta.
- **Sessão e cadastro indeterminados:** enquanto a sessão ou o cadastro estão sendo
  verificados, ou se a verificação falhou, as ações seguem como sem sessão e com cadastro
  desligado. É o caminho que nunca bloqueia o visitante.
- **Mini-robô no mobile:** fora, porque o quadro mobile não o tem.
- **Afirmações e operação:** as afirmações do AC14 foram conferidas em 08/11/2026 com
  `docs/product-context.md` e o código (alerta com preço igual ou abaixo do alvo,
  disponibilidade registrada pela API oficial, preço de uma unidade sem frete, 90 dias,
  2.000 caracteres). Elas descrevem o comportamento do produto. A validação externa com
  anúncios de terceiros (Issue #127) segue pendente; a landing não promete prazo nem
  disponibilidade operacional.
- **Pessoa com sessão na landing:** o Figma não define um cabeçalho para quem está logado.
  Ficam os mesmos textos, com os destinos da coluna "Com sessão".
- **Fatiamento:** o `/plan` pode dividir a entrega em mais de uma PR, por exemplo conteúdo e
  ações primeiro, movimento depois. Cada PR mantém os critérios já atingidos.
