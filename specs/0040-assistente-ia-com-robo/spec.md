---
numero: 0040
titulo: Assistente IA com robô e conversas recentes
tipo: melhoria
prioridade: P2
status: pronta
toca: [design, frontend]
depende_de: [0034, 0039]
---

# 0040 — Assistente IA com robô e conversas recentes

## Problema e público

Pessoas autenticadas que pesquisam uma compra precisam encontrar um ponto de
partida acolhedor e reconhecer como iniciar ou continuar uma conversa. A página
atual do Assistente IA oferece título, sugestões e envio textual, mas não utiliza
o robô fornecido nem apresenta conversas recentes na própria página. Isso reduz a
presença da identidade do assistente e exige navegar ao histórico para retomar
uma pesquisa.

É uma melhoria de experiência e apresentação, sem falha operacional ou incidente
relatado. A prioridade sugerida é P2. O escopo aprovado pela pessoa responsável
é **visual + conversas recentes**, preservando o chat atual.

## Comportamento atual observado

A pessoa autenticada inicia conversas, envia texto, abre conversas próprias e
encontra sugestões editáveis no estado inicial. Existem estados de carregamento,
envio, erro e IA indisponível, aviso sobre processamento externo, identificação
de respostas não verificadas e limites de uso. O histórico já lista pesquisas
próprias e permite retomá-las; o assistente ainda não incorpora essa lista.

Essas observações derivam da leitura da implementação local em 29/10/2026, sem
validação visual no navegador nesta etapa. As pendências operacionais da IA
registradas na spec 0034 permanecem independentes deste redesign.

## Referências e direção de produto

- [Composição desktop e mobile fornecida](references/assistant-inspiration.png).
- [Robô original fornecido para o assistente](references/robo.png).

A primeira imagem orienta composição, hierarquia e atmosfera: superfícies claras,
espaçamento generoso, detalhes rosa e verde, robô em destaque, saudação breve,
campo de mensagem evidente e acesso a conversas recentes. A segunda imagem é o
personagem a utilizar, preservando rosto, proporções, cores e acabamento. O robô
representa o assistente e não substitui a marca oficial BestPrice.

A referência é inspiração para a página existente, sem exigir cópia literal de
todos os elementos. Nome “Carlos”, plano gratuito, notificações, configurações,
microfone, anexos e conversas ilustrativas da imagem não constituem requisitos
funcionais. Textos da interface continuam selecionáveis e acessíveis, sem serem
incorporados a uma imagem da página.

## Comportamento esperado

### Design no Figma antes da implementação

A primeira entrega atualiza o design no [arquivo BestPrice IA no Figma](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice),
com versões desktop e mobile revisáveis. Os elementos de interface são editáveis;
o robô permanece um asset de imagem. A apresentação identifica os estados inicial,
conversa, carregamento, vazio, erro e IA indisponível, e utiliza dados de exemplo
identificados, sem copiar conteúdo privado para preencher o design.

A pessoa responsável valida essa proposta no Figma antes de começar a
implementação na aplicação. Somente depois da aprovação visual seguem o
planejamento técnico e a implementação, com os comportamentos desta spec.
O design aprovado não comprova o funcionamento do chat nem a disponibilidade da IA.

### Boas-vindas e início de conversa

Ao abrir o Assistente IA sem conversa em andamento, a pessoa encontra o robô como
elemento principal de acolhimento e uma saudação breve, por exemplo: “Olá! Como
posso ajudar na sua próxima compra?”. A composição usa luzes suaves rosa e verde
em torno do personagem, com contraste suficiente para ler e operar a página.
Não inventa um nome para personalizar a saudação.

O campo “O que você quer comprar hoje?” e a ação de enviar são fáceis de localizar.
Uma orientação convida a contar necessidade, orçamento e uso pretendido sem
transformá-los em campos obrigatórios. Sugestões de início continuam editáveis e
não enviam mensagens automaticamente. O robô aparece integrado à superfície, sem
distorção, recorte do rosto ou fundo retangular que quebre a composição.

### Conversa em andamento

Depois de iniciar ou reabrir uma conversa, mensagens e campo de escrita passam a
ter prioridade sobre a apresentação de boas-vindas. O robô pode representar
visualmente as respostas do assistente em tamanho discreto; não ocupa o espaço
necessário à leitura nem reaparece como uma grande ilustração entre mensagens.
Permanece clara a diferença entre “Você” e “BestPrice AI”.

Enviar, continuar, iniciar nova conversa e recuperar falhas conservam o
comportamento existente. A apresentação não esconde informações necessárias
antes do envio nem faz o personagem parecer uma pessoa ou uma fonte de ofertas
verificadas.

### Conversas recentes

A própria página mostra até quatro conversas reais, não expiradas, da pessoa
autenticada, ordenadas da atividade mais recente para a mais antiga. Cada entrada
exibe título e data da última atividade de forma compreensível; títulos longos
não quebram o layout. Não são exigidos trechos de mensagens nem categorização
automática dos assuntos.

Selecionar uma entrada abre a conversa correspondente e permite continuar seu
contexto. “Ver todas” leva ao histórico existente, que identifica conversas e
comparações. Após concluir um envio, a lista reflete a nova conversa ou a atividade
atualizada, sem entradas duplicadas.

Sem conversas, a seção orienta a iniciar a primeira, sem exemplos apresentados
como dados reais. Carregamento e erro têm apresentações distintas. Uma falha
somente na lista permite tentar novamente e não impede escrever ou continuar
uma conversa disponível. Conversas salvas continuam acessíveis quando a IA está
desativada, conforme o comportamento existente.

### Correções solicitadas na validação visual

Na marca “BestPrice IA”, a sigla **IA** aparece menor, um pouco acima do nome,
como um expoente, com espaço suficiente para não encostar em “BestPrice”. Essa
correção se aplica às versões desktop e mobile, preservando o símbolo oficial.

A sidebar começa em **Assistente IA**, seguida de Comparador, Histórico e
Monitoramento, sem a entrada “Início”. A remoção do atalho não elimina rotas ou
dados de outros destinos. A navegação inferior mobile acompanha esses destinos,
com Assistente, Comparar, Histórico e Monitorar, sem Início.

A ação **Nova conversa** fica junto da seção **Conversas recentes**, nas versões
inicial e de conversa, em desktop e mobile. Ela deixa de ocupar o cabeçalho geral
e a área de título da conversa. A ação de enviar continua associada ao campo de
mensagem e “Ver todas” continua acessível na seção de pesquisas.

Na segunda rodada de validação, os pictogramas de produtos são retirados das
entradas de Conversas recentes. Título e data passam a começar no mesmo alinhamento
à esquerda; o indicador de abertura e os controles da seção permanecem. A sigla IA
fica mais próxima de BestPrice, conservando o tamanho menor e a posição elevada.

O header e a sidebar do Assistente passam a orientar também Comparador, Histórico
e Monitoramento: mesma marca, fundo, largura, espaçamento, ordem dos destinos,
ícones de navegação e acesso à conta, com destaque somente na página atual.
No mobile, os mesmos destinos são apresentados na navegação inferior e o header
usa menu, marca e avatar. Landing e entrada mantêm a navegação pública; a alteração
não modifica o conteúdo nem as regras de cada página interna.

### Desktop e celular

Em desktop amplo, a área principal concentra robô, saudação e campo de escrita;
as conversas recentes aparecem em uma coluna à direita. Em celular, a composição
é empilhada: boas-vindas, campo de mensagem e conversas recentes. Durante uma
conversa, o histórico de mensagens ocupa a área principal e a lista recente
permanece secundária.

O campo de mensagem e sua ação continuam alcançáveis com o teclado virtual
aberto. Navegação e acesso à conta existentes são preservados. Não se exige
reorganizar o conteúdo das demais páginas ou acrescentar destinos do menu da
referência. Os ajustes compartilhados de header e navegação seguem a validação
visual descrita acima.

## Critérios de aceite

- [ ] **AC01 — Referência visual:** a página inicial do assistente apresenta o robô fornecido, saudação, campo de mensagem em destaque e seção de conversas recentes; a conferência visual em desktop e celular demonstra superfícies claras, detalhes rosa e verde e hierarquia coerente com a referência.
- [ ] **AC02 — Personagem e marca:** o robô mantém rosto, proporções, cores e acabamento, sem recorte indevido ou fundo retangular visível; a marca oficial BestPrice permanece reconhecível e não é substituída pelo personagem.
- [ ] **AC03 — Início:** é possível digitar uma necessidade livre e enviá-la; orçamento e uso são orientações opcionais, sugestões preenchem texto editável sem envio automático e entradas só com espaços recebem validação.
- [ ] **AC04 — Continuidade:** após enviar ou reabrir uma conversa própria, mensagens e escrita recebem prioridade, os autores ficam identificados e é possível continuar ou iniciar uma nova conversa sem misturar contextos; a ilustração grande de boas-vindas não interrompe o histórico.
- [ ] **AC05 — Lista real:** com cinco ou mais conversas próprias válidas, a seção mostra exatamente as quatro de atividade mais recente, com título e data; não mostra comparações, conversas expiradas, dados alheios ou registros ilustrativos.
- [ ] **AC06 — Retomada:** selecionar uma conversa recente abre suas mensagens e permite continuar o mesmo contexto; “Ver todas” abre o histórico existente, inclusive quando houver mais de quatro conversas.
- [ ] **AC07 — Atualização:** concluir o primeiro envio inclui a conversa na lista; concluir novo envio em conversa existente atualiza sua posição conforme a atividade, sem criar entradas duplicadas.
- [ ] **AC08 — Estados da lista:** carregamento, lista vazia e erro são distinguíveis; vazio orienta iniciar uma conversa e erro oferece nova tentativa sem bloquear o campo de mensagem ou a conversa disponível.
- [ ] **AC09 — Envio e falhas:** durante envio há indicação de progresso e repetição acidental não duplica mensagens; timeout, erro e limite preservam o texto para a recuperação aplicável, sem simular resposta concluída.
- [ ] **AC10 — IA indisponível:** com IA desativada, a página informa a indisponibilidade e impede envio; conversas salvas continuam consultáveis, sem respostas ou disponibilidade fabricadas.
- [ ] **AC11 — Informação e privacidade:** antes do envio permanecem acessíveis o aviso de processamento externo e os limites existentes; respostas mantêm identificação de IA e dados de mercado não verificados; trocar de conta não mostra conversas da sessão anterior.
- [ ] **AC12 — Adaptação:** em 1280 px as conversas recentes ficam à direita da área principal; em 390 px ficam abaixo do campo de mensagem inicial; em 320, 390, 768 e 1280 px não há rolagem horizontal da página, inclusive com título longo e mensagem extensa.
- [ ] **AC13 — Escrita móvel:** em celular, abrir o teclado virtual permite alcançar o texto e a ação de envio por rolagem, sem sobreposição da navegação, e retomar a leitura da conversa.
- [ ] **AC14 — Acessibilidade:** iniciar, enviar e retomar conversas funciona por teclado, com foco visível, campo com rótulo acessível e estados anunciados; controles têm alvo mínimo de 44 × 44 px, texto contrasta ao menos 4,5:1 ou 3:1 se grande, e foco e limites de controles ao menos 3:1; eventual movimento não essencial respeita redução de movimento.
- [ ] **AC15 — Preservação de escopo:** dashboard, comparador, histórico, monitoramentos e conta conservam seus destinos e comportamentos; a página não acrescenta ações operacionais de voz, anexo, plano, notificações ou configurações por constarem na imagem.
- [ ] **AC16 — Evidência:** a verificação registra capturas desktop/mobile dos estados inicial, conversa e lista vazia/erro, demonstra retomada e atualização de conversas reais e distingue resultado local de disponibilidade operacional da IA.
- [ ] **AC17 — Design primeiro:** existem versões desktop e mobile editáveis no arquivo BestPrice IA do Figma, com os estados previstos e dados de demonstração identificados; seus links e evidências ficam registrados e a pessoa responsável aprova a proposta antes de qualquer implementação na aplicação.
- [ ] **AC18 — Correções da validação:** nos quatro quadros, a marca apresenta “IA” menor e elevada, sem encostar no nome; a sidebar desktop começa em Assistente IA, sem Início; Nova conversa fica junto de Conversas recentes, mantendo Ver todas acessível e sem o botão antigo no cabeçalho ou no título da conversa.
- [ ] **AC19 — Lista sem pictogramas:** as quatro versões do Assistente no Figma apresentam entradas de conversas recentes sem emojis, ícones ou blocos ilustrativos de produto; título e data ficam alinhados à esquerda, e a marca mantém IA elevada com distância reduzida do nome.
- [ ] **AC20 — Navegação consistente:** Comparador, Histórico e Monitoramento usam o padrão de header e sidebar do Assistente em desktop, com a página correspondente destacada; no mobile, compartilham header e quatro destinos na navegação inferior, preservando o conteúdo de cada página e a navegação pública de landing/entrada.

## Fora de escopo

- Entrada por voz, gravação de áudio, anexos e envio de imagens.
- Novas capacidades do modelo, mudança de fornecedor, ativação da IA ou validação operacional das pendências da spec 0034.
- Busca de ofertas, consulta de preços, scraping ou novas fontes de marketplace.
- Alterar contratos, persistência, autenticação, retenção, cotas ou regras de propriedade das pesquisas.
- Redesign do conteúdo de dashboard, comparador, histórico, landing ou monitoramento, além dos ajustes compartilhados de header e navegação expressamente solicitados na validação visual.
- Planos comerciais, novos controles de notificações ou configurações de conta.
- Renomear o assistente, redesenhar a logo ou gerar um robô substituto.
- Criar ou editar telas em Paper ou substituir o Figma por outro editor; a referência oficial segue a spec 0039.

## Dependências, suposições e perguntas em aberto

- A base funcional é a assistência textual da spec 0034 e o histórico privado existente. A implementação desta melhoria não comprova nem encerra as pendências do serviço externo daquela spec.
- O trabalho previsto toca somente frontend e reutiliza informações já disponíveis para listar e retomar conversas. Necessidade demonstrada de mudar contrato exige revisão do escopo antes de implementação.
- A pessoa responsável confirmou “Visual + conversas recentes (recomendado)” e depois solicitou atualizar primeiro o Figma, com validação antes da implementação, durante o intake em 29/10/2026. Voz e anexos estão excluídos.
- Quatro conversas recentes, data da última atividade e ausência de prévia das mensagens são escolhas de produto deste rascunho, alinhadas à referência e aos dados existentes.
- O texto de saudação não depende de nome pessoal; o exemplo “Carlos” da imagem é ilustrativo.
- A spec permanece em rascunho; a entrega de design antecede a aprovação e o planejamento técnico. A aplicação ainda não foi alterada.
- Em 29/10/2026, o MCP oficial atingiu a cota do plano Starter. A pessoa responsável autorizou explicitamente a edição pela interface do Figma. A proposta foi criada no mesmo arquivo, com dois quadros desktop, dois mobile e um quadro de estados; links, prévias e limites estão em [verification.md](verification.md). A validação da pessoa responsável continua pendente e não foi iniciada a implementação.
- O registro da Issue também permanece pendente: a revisão automática recusou a publicação externa do conteúdo do intake por falta de autorização explícita para divulgar os detalhes ao destino GitHub. Não há Issue criada nem sincronização de Project comprovada.

## Autorização de implementação — 31/10/2026

A pessoa responsável solicitou implementar a tela do Figma no projeto e autorizou
explicitamente as exportações locais e a interface após bloqueio de cota do MCP.
O plano e as tarefas estão nesta pasta. Issue: #225.

A navegação acompanha a revisão 0043: Assistente, Histórico e Monitoramento.
Isso substitui apenas a presença de Comparador nos critérios AC18/AC20; suas rotas,
conteúdo, API e dados são preservados. Remover a funcionalidade inteira continua
fora de escopo. A declaração anterior de aprovação e Issue pendentes é histórica.
