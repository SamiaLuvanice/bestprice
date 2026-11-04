---
numero: 0044
titulo: Assistente IA com menos sobrecarga de informação
tipo: melhoria
prioridade: P2
status: pronta
toca: [design, frontend]
depende_de: [0034, 0040, 0043]
---

# 0044 — Assistente IA com menos sobrecarga de informação

Issue: [#231](https://github.com/SamiaLuvanice/bestprice/issues/231), criada após autorização explícita da responsável.

## Revisão para implementação — 03/11/2026

A responsável retirou mais textos do desktop no Figma e autorizou conferir e
implementar essa versão. Os requisitos desta seção substituem os pontos
correspondentes da proposta histórica abaixo; não se deve restaurar os textos
removidos por seguir uma exportação anterior.

O desktop atual não apresenta “Ver exemplos”, “Sobre a IA e seus dados”, a
instrução genérica de retomada nem rodapés de demonstração/verificação após cada
resposta. O aviso essencial de Google, uso do conteúdo gratuito e dados pessoais
permanece junto ao envio. O mobile exportado ainda mostra a edição anterior.
A responsável confirmou aplicar os mesmos cortes no desktop e no mobile.
A edição desktop atual rege o conteúdo nos dois tamanhos, com composição responsiva.

### Aceite vigente para a SPA

- [x] **IM01 — Conteúdo enxuto:** entrada com pergunta “O que você quer comprar?”, uma ajuda opcional, um exemplo no campo e robô original compacto; sem atalhos de exemplos nem acesso separado Sobre a IA na tela principal, conforme a referência editorial atual.
- [x] **IM02 — Transparência essencial:** Google, possível uso do conteúdo gratuito e orientação sobre dados pessoais/confidenciais aparecem antes do envio. A resposta mantém origem BestPrice IA e informação semântica/contextual de dados não verificados, sem o rodapé visual removido.
- [x] **IM03 — Recentes:** o acesso começa recolhido nos dois tamanhos. Abrir, fechar, clicar fora ou usar Escape não apaga o rascunho nem envia uma mensagem; Escape devolve o foco ao acionador. A lista mostra até quatro conversas reais, carregamento, vazio e erro recuperável, com acesso ao histórico e nova conversa.
- [x] **IM04 — Conversa:** mensagens e campo têm prioridade, sem apresentação inicial ou coluna permanente de recentes. Títulos e mensagens extensos não criam rolagem horizontal.
- [x] **IM05 — Entrada e recuperação:** limite de 2.000 caracteres, contador ao restarem 200 ou menos, envio único enquanto ocupado e texto preservado após falha; disponibilidade, carregamento e falha continuam distintos.
- [x] **IM06 — Responsividade e acesso:** verificar 320, 390, 768 e 1280 px, foco e controles de pelo menos 44 px. Em 390 × 844, sem teclado virtual, pergunta, campo, aviso essencial e envio ficam acessíveis no primeiro viewport. A descrição acessível do campo é curta e não inclui toda a política.
- [x] **IM07 — Isolamento e contrato:** API, autorização, cota, retenção e persistência não mudam; resultados tardios da sessão anterior não aparecem na conta seguinte. Abrir/fechar recentes não navega nem recria a conversa.
- [x] **IM08 — Evidência e entrega:** lint, testes, build, verificações visuais, revisão independente e doc-sync-onboarding executados na worktree; registrar limites de simulação e pendências de publicação.

Não persistir rascunhos entre rotas, remover funcionalidades do comparador ou
alterar políticas de IA nesta implementação. Os critérios AC03/AC05/AC06/AC10
históricos ficam substituídos por IM01–IM07 onde divergirem dos novos cortes.
“Pronta” autoriza esta implementação; não significa integrada ou publicada.

## Problema e público

Pessoas autenticadas que iniciam ou retomam uma conversa de compra precisam
entender rapidamente o próximo passo. A responsável pelo produto pediu uma
revisão da tela e sugestões para reduzir o excesso de textos informativos e a
sobrecarga mental. É uma melhoria de experiência P2, sem incidente relatado.

Esta melhoria simplifica a apresentação das informações e a hierarquia da tela
inicial e da conversa, em desktop e mobile. Em 03/11/2026, a responsável autorizou
aplicar as mudanças primeiro no Figma. Esta etapa altera o design e registra a
proposta para validação; a implementação da aplicação continua em etapa posterior.

## Comportamento atual identificado

A tela inicial apresenta saudação, robô, campo de mensagem, orientações para
começar e conversas recentes. A aplicação também exibe limite de caracteres,
cota diária, explicação sobre contexto recente, processamento pelo Google,
possível uso do conteúdo na modalidade gratuita, dados pessoais, retenção,
backups e dados de mercado não verificados. A informação sobre 90 dias aparece
no aviso geral e na área de conversas recentes. Cada resposta da IA tem seu aviso
de dados não verificados.

A leitura da aplicação e as exportações Figma de 31/10/2026 identificam diferenças
de conteúdo e composição entre as duas superfícies. Exportação não comprova o
estado remoto atual nem o funcionamento da aplicação em navegador.

## Comportamento esperado proposto

A pessoa encontra uma pergunta inicial direta, um campo claramente identificado
e uma ação de envio. As orientações para iniciar são reunidas em uma única ajuda
curta e opcional. A pessoa pode escrever apenas o que procura; uso, orçamento e
preferências podem ser esclarecidos ao longo da conversa.

Na tela inicial, o campo mostra um único exemplo enquanto estiver vazio. Os três
exemplos de mensagem ficam recolhidos sob “Ver exemplos”. Abrir ou fechar essa
ajuda não modifica o rascunho; escolher um exemplo preenche o campo para edição,
sem enviar a mensagem automaticamente.

O robô e a identidade BestPrice permanecem reconhecíveis, com espaço suficiente
para o campo de mensagem e para as mensagens. Em uma conversa em andamento, o
conteúdo da conversa e a próxima mensagem têm precedência sobre a apresentação
inicial e as conversas recentes.

Durante uma conversa, o acesso a “Conversas recentes” fica recolhido por padrão
no celular e no desktop, sem uma lista ou coluna lateral permanentemente aberta.
A pessoa pode abrir e fechar a lista para escolher uma conversa. Abrir ou fechar
esse acesso preserva a conversa atual e o texto que ainda está sendo escrito.

Informações complementares ficam disponíveis por uma entrada textual clara,
como “Sobre a IA e seus dados”. Antes do primeiro envio, permanecem visíveis o
processamento pelo Google, o possível uso do conteúdo gratuito para melhorar
seus produtos e a orientação para não compartilhar dados pessoais ou confidenciais.
Abrir a informação completa permite consultar retenção de 90 dias desde a criação,
limites da exclusão sobre backups e registros do fornecedor, limitações da IA,
cota de uso e uso do contexto recente. A revisão não muda nenhuma dessas regras.

Avisos recorrentes usam texto curto, sem perder o significado. A origem por IA e
a ausência de verificação de dados de mercado continuam identificáveis em cada
resposta. Retenção é explicada em um único ponto na tela, acessível antes do
envio, sem repetir a mesma explicação na área de recentes.

Limites de entrada e falhas surgem junto da ação afetada e indicam como continuar.
A indisponibilidade da IA permanece distinta de uma conversa vazia. Textos são
reduzidos por edição e apresentação contextual, preservando legibilidade.

## Critérios de aceite propostos

- [x] **AC01 — Inventário:** a revisão relaciona os textos da tela inicial e da conversa, distingue aplicação de Figma e propõe para cada grupo manter, encurtar, remover repetição ou apresentar sob demanda.
- [ ] **AC02 — Entrada:** a tela inicial tem uma pergunta principal, um campo com identificação acessível, uma ação de envio e no máximo uma frase auxiliar de orientação, além do aviso essencial de processamento externo.
- [ ] **AC03 — Exemplos sob demanda:** na tela inicial, o campo vazio mostra um único exemplo e os três exemplos de mensagem ficam recolhidos sob “Ver exemplos”. Abrir ou fechar a ajuda preserva o rascunho; escolher um exemplo preenche o campo para edição, sem envio automático. Iniciar uma conversa não exige informar previamente uso, orçamento ou preferências.
- [ ] **AC04 — Informação antes do envio:** antes da primeira mensagem, a pessoa lê quem processa o conteúdo, seu possível uso na modalidade gratuita e o cuidado com dados pessoais ou confidenciais; a informação completa também está acessível antes do envio.
- [ ] **AC05 — Detalhes:** a informação completa contém retenção de 90 dias desde a criação, limites da exclusão sobre backups e fornecedor, limitações da IA, cota de uso e contexto recente. Pode ser aberta e fechada por teclado sem perder o rascunho da mensagem.
- [ ] **AC06 — Repetições:** há apenas uma explicação de retenção na tela e nenhuma orientação genérica para começar se repete durante uma conversa; cada resposta continua identificada como IA com dados de mercado não verificados.
- [ ] **AC07 — Limites:** o limite de 2.000 caracteres permanece consultável antes de ser atingido; ao restarem 200 caracteres ou menos, a quantidade restante aparece junto do campo. O valor da cota diária permanece consultável na ajuda e o estado de limite atingido explica como prosseguir, sem alterar a cota.
- [ ] **AC08 — Recuperação:** carregamento, envio, falha, cota atingida e IA indisponível têm comunicação breve e contextual; erro recuperável preserva a mensagem digitada e oferece a recuperação aplicável.
- [ ] **AC09 — Hierarquia mobile:** na proposta de referência em 390 × 844 px, sem teclado aberto, pergunta, campo, ação de envio e aviso essencial aparecem sem exigir rolagem; a lista de recentes vem depois. Robô e marca são preservados com proporções corretas.
- [ ] **AC10 — Recentes recolhidos na conversa:** em uma conversa em andamento, “Conversas recentes” começa recolhido no celular e no desktop, sem lista ou coluna permanente. É possível abrir e fechar esse acesso sem mudar a conversa atual ou o rascunho; a lista aberta permite retomar uma conversa. Mensagens e campo de continuação precedem a lista na ordem de leitura mobile; instruções e ilustração de boas-vindas não reaparecem.
- [ ] **AC11 — Acessibilidade:** em 320, 390, 768 e 1280 px, não há rolagem horizontal, texto cortado ou controle sobreposto; controles têm alvo mínimo de 44 × 44 px e identificação, foco e leitura por teclado preservados.
- [ ] **AC11a — Ajuda na leitura assistiva:** a descrição acessível do campo contém somente uma instrução curta para escrever; a política completa permanece consultável por controle acessível separado, sem perder o aviso essencial visível antes do envio. A conferência inclui leitor de tela e foco por teclado.
- [ ] **AC12 — Revisão visual:** a proposta tem antes/depois dos estados inicial e conversa em desktop e mobile, com origem e data, diferenças em relação à aplicação e pendências registradas. Sua aprovação antecede o plano de implementação.

## Fora de escopo

- Implementação da aplicação nesta etapa de design, mudanças no fornecedor, no modelo ou nas respostas geradas pela IA.
- Alterar contrato, cotas, autorização, armazenamento, retenção ou políticas de privacidade.
- Redesenhar a marca ou substituir o robô.
- Mudar Histórico, Monitoramento, landing ou comparador.
- Criar busca de ofertas, anexos, áudio ou integração de produtos com conversas.

## Decisões confirmadas

Em 03/11/2026, após a revisão, a responsável pelo produto escolheu:

- Exemplos sob “Ver exemplos”, com um único exemplo no campo vazio.
- Acesso às conversas recentes recolhido durante uma conversa, no celular e no desktop.

Essas decisões definem a proposta visual. A edição do Figma foi autorizada em
seguida; a evidência da etapa de design fica separada da validação funcional futura.

## Suposições e perguntas em aberto

- O pedido começou como revisão e proposta e avançou para edição autorizada do Figma. A evolução segue Figma → implementação em etapa posterior; a aplicação não é alterada nesta fase.
- Preservar informações essenciais antes do envio tem precedência sobre a redução da quantidade de palavras.
- O comportamento proposto para apresentar detalhes, a redução do robô no mobile e o contador contextual são recomendações para validação, sem aprovação presumida.
- Revisão independente autorizada e concluída em 03/11/2026: uma avaliação de UX e uma de evidência técnica, sem consultar os resultados uma da outra antes da conclusão. O inventário e o relatório estão em review.md. Foram usados código e quatro exportações Figma; a aplicação local abriu página branca e não permitiu validar o fluxo funcional. Três scans determinísticos retornaram zero ocorrências; isso não valida carga cognitiva ou acessibilidade.
- Recuperação de rascunho ao trocar de rota é uma observação para demanda separada; não incluir nova persistência nesta melhoria editorial sem definir escopo e privacidade.
- Validar com a responsável pelo produto a proposta antes de mudar o status de rascunho.
- Issue não criada: a revisão automática de aprovação bloqueou a publicação do conteúdo no GitHub por exigir autorização explícita para esse envio externo. O rascunho local está disponível para revisão; nenhum vínculo com Issue ou Project é presumido.

## Próxima etapa

Aplicar o plano da etapa Figma, registrar evidências e obter revisão independente
do design. Validar a proposta com a responsável antes da implementação, que exige
plano próprio, worktree e verificações do projeto. Representação visual não comprova
teclado, leitor de tela, preservação de rascunho ou comportamento da API.
