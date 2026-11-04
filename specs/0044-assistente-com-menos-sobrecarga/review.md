Method: dual-agent (A: /root/ux_review · B: /root/technical_review).

# Revisão do Assistente IA — 0044

Este relatório registra a avaliação anterior à edição autorizada do Figma.
As escolhas e o design posterior estão em spec.md e verification.md; a nota abaixo
não foi recalculada após as mudanças.

Data: 03/11/2026, America/Sao_Paulo. Modo: Operate.
Alvo: frontend/src/features/research/AssistantPage.tsx.
Escopo: revisão e propostas; nenhuma implementação ou alteração no Figma.

## Conclusão

A principal melhoria é organizar a informação por momento de uso. A identidade do
BestPrice funciona; o campo de mensagem precisa ganhar prioridade sobre apresentação,
avisos complementares e histórico. Preservar a transparência necessária antes do envio.

A avaliação heurística é 25/40, aceitável segundo o guia da skill. É julgamento
profissional sobre fonte e referências, sem teste com usuários, não medida de carga
cognitiva. A tarefa exige pensar sobre uma compra; a interface pode conduzir uso,
orçamento e preferências em sequência.

## Evidência e diferenças entre superfícies

A leitura incluiu AssistantPage.tsx, common.tsx, RecentConversations.tsx, assistant.css,
research.css e ResearchArea.tsx. Ambos os avaliadores inspecionaram as quatro
exportações Inicial/Conversa em desktop/mobile existentes em
specs/0043-figma-sem-comparador/after/{desktop,mobile}/.
A origem documentada é o Figma BestPrice IA, arquivo LZVtUEAycEzfbwL0H5YL3r:
132:27 (inicial desktop 1440 × 960), 132:361 (inicial mobile 390 × 1190),
133:169 (conversa desktop 1440 × 960), 132:468 (conversa mobile 390 × 1320).
A verificação da 0043 registra exportação em 31/10/2026; timestamps locais
de 02/11/2026 não substituem essa proveniência. Nenhuma leitura remota atual foi feita.

As exports têm aviso Google curto. A fonte atual acrescenta dois parágrafos completos,
cota/contexto e três sugestões. As imagens permitem avaliar a composição de referência,
não demonstrar a renderização de todos os textos atuais.

As abas próprias de A e B em localhost:5173/app/assistant mostraram documento branco,
AXWebArea BestPrice. B confirmou readyState complete, body.innerText vazio e logs
error/warn vazios em 390 × 844 e 1280 × 900. Isso limita a revisão, sem diagnosticar causa.
A tentativa HTTP pelo shell de B falhou por permissão de socket; isso não comprova
servidor parado. Não houve chamada à IA ou alteração de dados.
Leitor de tela, teclado virtual, zoom, contraste e breakpoints funcionais não foram
validados. As conclusões de comportamento na fonte são explicitamente estáticas.

## Heurísticas Nielsen

| Heurística | Nota /4 | Observação |
|---|---:|---|
| Visibilidade do estado | 3 | Fonte prevê carregamento, envio, erro e indisponibilidade; falta feedback específico da consulta inicial de disponibilidade. |
| Linguagem familiar | 3 | Compra, uso e orçamento são familiares; análises/contexto e promessa de encontrar exigem interpretação. |
| Controle e liberdade | 2 | Há saída pelo histórico/nova conversa; não foi identificada recuperação de rascunho após troca de rota. |
| Consistência | 3 | Identidade e controles coerentes; variam IA/AI, pesquisa/conversa e análise/mensagem. |
| Prevenção de erros | 2 | Limites e trava ajudam; avisos essenciais seguem o formulário na ordem da fonte. |
| Reconhecimento | 3 | Recentes e exemplos ajudam a começar; conversa corrente não é identificada na lista local. |
| Flexibilidade e eficiência | 2 | Sugestões e retomada reduzem digitação; interrupção/rascunho pouco atendidos. |
| Minimalismo | 2 | Hero alto e explicações permanentes competem com a conversa. |
| Recuperação de erros | 3 | Falha de envio conserva o texto; recuperação nem sempre tem ação explícita. |
| Ajuda contextual | 2 | Há transparência, mas informações operacionais e de privacidade estão acumuladas. |
| **Total** | **25/40** | **Avaliação heurística; não teste com pessoas ou auditoria de conformidade.** |

## Identidade e aspectos que funcionam

Robô original, magenta/verde e balão acolhedor dão identidade própria. O espaço de
conversa ainda usa padrões genéricos; tornar concreta a ajuda na escolha, sem prometer
busca de ofertas ou dados de mercado verificados, dá especificidade ao produto.

A distinção entre mensagem da pessoa e resposta é clara nas exports. Títulos recentes
e sugestões editáveis favorecem reconhecimento. A fonte já tem labels, nome acessível
no envio, estados de carregamento/erro e preservação do texto após falha. Simplificação
deve preservar esses recursos.

## Prioridades

### P 1 — Separar aviso essencial de informação complementar

O formulário vem antes do bloco Google, cota/contexto e política completa
(AssistantPage.tsx:82–87; common.tsx:7–8). A retenção reaparece nos recentes
(RecentConversations.tsx:35). No desktop exportado o aviso Google fica perto da borda
inferior. A hierarquia pode simultaneamente cansar e tornar o essencial fácil de ignorar.

Manter Google, possível uso do conteúdo gratuito e cuidado com dados pessoais visíveis
junto ao envio. Apresentar retenção, backups, contexto e cota por entrada textual clara.
Não esconder os três fatos essenciais apenas em Saiba mais. Remover a repetição dos 90 dias.
Comandos sugeridos: $impeccable clarify e $impeccable distill.
P 1 aqui significa importância da revisão heurística; a demanda de produto permanece P 2,
sem incidente de produção demonstrado.

### P 2 — Compactar a chegada no celular

Na export mobile inicial o campo começa aproximadamente em y 450. A fonte reserva
358 px para a apresentação mobile e 490 px desktop (assistant.css). Isso afasta a tarefa
do começo da tela. Compactar o robô e a saudação preservando a identidade; aproximar
pergunta, campo e envio. Testar com teclado virtual antes de propor compositor fixo.
Comandos: $impeccable adapt e $impeccable layout.

### P 2 — Reduzir recentes durante a conversa

RecentConversations é renderizado em todos os estados (AssistantPage.tsx:89).
Há até quatro conversas, Ver todas e Nova conversa (RecentConversations.tsx:29–35).
Oferecer acesso compacto ou painel recolhível na conversa, mantendo a retomada disponível.
Na chegada sem histórico, Nova conversa pode ser redundante.
Comando: $impeccable distill.

### P 2 — Unificar vocabulário e propósito

Vamos encontrar pode sugerir busca de ofertas inexistente. IA/AI, pesquisa/conversa
e análises/mensagens variam no fluxo (AssistantPage.tsx:73,77,87; common.tsx:8).
Preferir IA e conversas consistentemente. Confirmar a unidade da cota antes de renomear
20 análises; não presumir 20 mensagens. Uma pergunta principal e uma orientação opcional
bastam para começar.
Comando: $impeccable clarify.

### P 2 — Encurtar a descrição acessível do campo

aria-describedby referencia assistant-message-hint e assistant-data-info
(AssistantPage.tsx:83). O segundo contém todo o bloco de política/cota/contexto.
B contou 72 palavras/467 caracteres de descrição estática associada ao campo, além de
label e placeholder. Isso é um risco de carga auditiva, não falha reproduzida com leitor.

Usar descrição curta de tarefa e oferecer detalhes por controle acessível separado.
Manter o aviso essencial visível antes do envio. Verificar foco, nome do controle e
leitor de tela na futura implementação.
Comando: $impeccable harden.

## Inventário editorial

| Grupo atual | Aplicação atual / referência | Proposta |
|---|---|---|
| Olá + Vamos encontrar... | Fonte e exportações, com pequenas diferenças | Uma pergunta principal, sem prometer busca de ofertas. |
| Sua mensagem + placeholder | Fonte; rótulo de limite condensado nas exports | Manter label acessível e exemplo curto, sem duplicar a pergunta. |
| Conte seu uso, orçamento... | Fonte; orientação similar na export mobile | Uma ajuda opcional; não exigir preenchimento de todos os critérios. |
| Três sugestões | Fonte, ausentes nas exports consultadas | Manter exemplos editáveis apenas na chegada ou disponibilizá-los sob demanda; validar direção. |
| Até 2.000 caracteres | Fonte e exports | Limite consultável; contador contextual próximo do limite como proposta. |
|20 análises/dia + contexto recente | Fonte, não demonstrados integralmente nas exports | Detalhes sob demanda; confirmar unidade da cota. |
| Google + modalidade gratuita + dados pessoais | Fonte e exports com texto diferente | Aviso essencial visível, junto ao envio, com os três fatos preservados. |
|90 dias + backups + registros do fornecedor | Fonte; retenção no painel desktop exportado | Uma única explicação completa consultável antes do envio. |
| IA pode errar/dados não verificados | Aviso global na fonte + aviso em cada resposta | Preservar identificação local de cada resposta; retirar duplicação global desnecessária. |
| Retome de onde parou... | Fonte de conversa; texto ilustrativo nas exports | Remover instrução genérica após a conversa começar. |
| Conversas recentes/Ver todas/Nova conversa | Fonte e exports | Acesso secundário durante conversa; lista e rótulos preservados. |
| Volte quando quiser +90 dias | Fonte e export desktop | Remover chamada redundante; reunir retenção no único ponto de detalhes. |
| Estado vazio de recentes em duas frases | Fonte | Encurtar, evitando repetir a orientação principal de iniciar. |
| Carregamento/envio/erro/indisponibilidade | Fonte e referências de estado distintas | Manter estado contextual e ação recuperável; não trocar por vazio/sucesso. |
| Dados de demonstração/conversa ilustrativa | Exports de design | Manter em material ilustrativo, sem transpor como dados reais. |

## Copy candidata

| Local | Texto |
|---|---|
| Pergunta principal | O que você quer comprar? |
| Ajuda opcional | Se quiser, diga seu orçamento e como pretende usar. |
| Exemplo no campo | Ex.: notebook para estudar, até R$ 3.500 |
| Aviso essencial | O Google processa suas mensagens. Na modalidade gratuita, o conteúdo pode ser usado para melhorar seus produtos. Não envie dados pessoais ou confidenciais. |
| Acesso aos detalhes | Sobre a IA e seus dados |
| Identificação local | Resposta de IA. Preços, estoque e especificações não verificados. |
| Retenção nos detalhes | As conversas ficam disponíveis por 90 dias desde a criação; editar não renova o prazo. Depois, o acesso é bloqueado e a limpeza do banco ativo ocorre a cada hora, com a API em execução. Isso não apaga backups nem registros do Google. |

Não apresentar um prazo de exclusão física instantânea aos 90 dias.
A redação final depende da proposta visual e da conferência dos fatos existentes.

## Sobrecarga, personas e jornada

Há quatro caminhos de entrada na fonte (digitação livre + três exemplos), até seis
destinos de retomada/administração e três destinos de navegação, em grupos distintos.
Não somar todos como se fossem decisões simultâneas nem tratar quatro itens como limite
universal de memória. A questão é a hierarquia entre conversar, ler políticas e retomar.

Jordan, primeira visita: pode entender encontrar como pesquisa de ofertas e interpretar
uso/orçamento como requisitos antes de começar. Um propósito concreto e exemplo bastam.
Casey, mobile distraído: atravessa apresentação extensa e tem histórico longo após o
compositor; interrupção pode descartar rascunho. Validar teclado e troca de contexto.
Sam, leitura assistiva: descrição extensa pode ser repetida no foco; a fonte tem labels,
status e alertas, mas precisa de ensaio real. Não se afirma falha ou conformidade WCAG.

Jornada provável, ainda hipotética: acolhimento pelo robô → hesitação sobre quanto contar
→ esforço adicional ao encontrar muitos avisos → acompanhamento na resposta → segurança
para retomar, com ambiguidade de prazo. Distribuir a informação de acordo com cada
momento evita acrescentar nova etapa obrigatória.

## Observações fora da simplificação imediata

O rascunho é estado local e a rota remonta o componente por location.key
(ResearchArea.tsx:135). Não foi identificada restauração ao trocar de rota.
É candidato a demanda separada com decisão explícita de privacidade; falha de envio
já preserva texto. Não incluir persistência de rascunho silenciosamente nesta spec.

Data de atualização não renova expiração desde criação. Mostrar expiração quando
relevante pode evitar interpretação equivocada. O componente AIInformation é
compartilhado; uma futura mudança precisa conferir os outros consumidores.

## Conferência determinística

B executou individualmente:
- impeccable.cmd detect --json frontend/src/features/research/AssistantPage.tsx
- impeccable.cmd detect --json frontend/src/features/research/common.tsx
- impeccable.cmd detect --json frontend/src/features/research/RecentConversations.tsx

Os três retornaram[], exit 0: zero findings, regras/localizações/falsos positivos nenhum.
O scan não contradiz as observações editoriais: não mede carga cognitiva, adequação
do vocabulário, contraste calculado ou experiência de leitor de tela.

## Decisões confirmadas após a revisão — 03/11/2026

A responsável pelo produto escolheu os exemplos sob “Ver exemplos”, com um único
exemplo no campo vazio. A ajuda começa recolhida; abrir ou fechar não modifica
o rascunho, e a seleção de um exemplo permite editá-lo antes do envio.

Durante uma conversa, o acesso aos recentes começa recolhido no celular e no
desktop. Não há lista nem coluna permanentemente aberta. Abrir ou fechar o acesso
preserva a conversa e o rascunho atuais; a lista aberta permite retomar uma conversa.

Sequência recomendada para a proposta: $impeccable distill para reduzir informação
permanente e aplicar essas escolhas; $impeccable clarify para editar os textos;
$impeccable adapt para compactar a chegada mobile; $impeccable harden para conferir
abertura, fechamento, foco e leitura assistiva; $impeccable polish ao final.
A prioridade de reduzir textos e sobrecarga já foi definida. Não houve nova avaliação
heurística nem alteração da nota; o snapshot original registra a revisão anterior
a essas escolhas. No encerramento desta revisão, aplicação e Figma ainda não haviam
sido alterados. Depois, a responsável autorizou executar a etapa de design no Figma;
o resultado dessa fase está em verification.md e a aplicação permanece sem alterações.

## Situação do intake

Spec 0044 continua rascunho. Inventário/revisão produzidos; comportamento proposto não
implementado e critérios funcionais/visuais restantes não demonstrados.
Issue não publicada: autorização externa pendente após rejeição de revisão automática.
A autorização de subagentes foi concedida em 03/11/2026 e não autoriza publicação.
Nenhum gate de aplicação foi executado, pois não há alteração de código.
