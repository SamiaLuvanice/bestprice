# Plano — 0044, etapa Figma

## Publicação para revisão — 04/11/2026

Issue [#231](https://github.com/SamiaLuvanice/bestprice/issues/231) aberta e
base origin/develop reconferida em `9d3b482`. A continuidade da orquestração foi
solicitada pela responsável. A branch local passa a
`feature/0044-issue-231-assistente-simples`; a worktree conserva o caminho
`.worktrees/codex-0044-assistente-simples` para preservar as evidências existentes.
Os bloqueios de publicação descritos no histórico abaixo foram resolvidos.
Publicar o PR para develop com Closes #231 e acompanhar CI; merge é etapa posterior.

## Implementação autorizada após novos cortes no Figma — 03/11/2026

Esta seção passa a reger a implementação solicitada. O plano de design abaixo é
histórico e não limita a autorização atual de alterar a SPA.

Base: origin/develop `9d3b482a924d14fa8ff9f33cfb1fdac4a5044acb`, após fetch.
Worktree: `.worktrees/codex-0044-assistente-simples`, branch local
`codex/0044-assistente-simples`. A revisão automática rejeitou novamente a criação
da Issue, mesmo com escopo resumido e destino confirmado; a branch usa o prefixo
local codex enquanto aguarda autorização de publicação e número da Issue. Não
inventar vínculo nem publicar por um caminho alternativo. Antes do PR, vincular
Issue e ajustar o nome da branch conforme a convenção do projeto, se autorizado.

### Referência atual e reconciliação editorial

MCP get_design_context continuou bloqueado pela cota. Os quatro quadros foram
inspecionados e exportados pela interface em 03/11/2026, entre 11:03 e 11:06
(America/Sao_Paulo), para figma-current/. Desktop inicial 132:27 e conversa
133:169 perderam Ver exemplos, Sobre a IA e seus dados e rodapés explicativos.
A conversa perdeu a frase de dados não verificados e o rótulo de demonstração.
Google, uso gratuito, dados pessoais e limite de caracteres permanecem visíveis.
O mobile exportado 132:361/132:468 ainda conserva os controles anteriores.
A responsável confirmou aplicar os mesmos cortes no desktop e no mobile.
A implementação segue essa decisão editorial em todos os tamanhos.

### Contrato e componentes

Não há alteração de backend, persistência, DTO ou contrato REST. Permanecem GET
/api/ai/capabilities, GET /api/ai/conversations/:id, POST /api/ai/chat e GET
/api/research?kind=conversation&offset=0&limit=4, com validação tipada existente,
autorização, idempotência, estados HTTP/rede e revisão da lista após envio.

Reutilizar Button, Brand, tokens existentes e useDisclosure de lib/focus.ts para
recentes: botão com estado expandido e região nomeada, Escape retorna foco,
fechamento não navega nem desmonta AssistantPage. Manter a busca dos quatro
recentes independente do envio e preservar resultados tardios por sessão.
Não criar wrappers de biblioteca, dependências novas ou persistência de rascunhos.

AssistantPage passa a ter uma coluna de tarefa. A apresentação inicial usa
pergunta, ajuda opcional, robô original menor e exemplo no campo. O compositor
contém aviso essencial curto e limite de entrada, com contador contextual aos
200 caracteres restantes. A conversa prioriza mensagens e o campo; a origem IA
continua identificada pelo autor BestPrice IA e pela descrição semântica da resposta,
sem o rodapé visual removido. A informação de não verificação permanece também
no título contextual do autor, preservando a ressalva sem reintroduzir o parágrafo.
AIInformation compartilhado não será reduzido globalmente; seus demais consumidores
conservam os detalhes atuais. Contas, Histórico e navegação preservam seus contratos.

Arquivos esperados: features/research/AssistantPage.tsx, RecentConversations.tsx,
assistant.css; testes assistant.test.tsx/research.test.tsx quando afetados e
tests/visual/assistant.spec.ts. Extrair no mesmo módulo uma peça de apresentação
somente se tornar o componente mais claro, sem criar abstrações especulativas.

### Sequência, evidência e limites

1. TDD de recentes recolhidos, abertura/fechamento, foco e rascunho sem POST;
   confirmar Red por ausência do comportamento, implementar e confirmar Green.
2. TDD de compositor enxuto, limite/contador e preservação dos fluxos de envio;
   atualizar testes obsoletos de sugestões/saudação para o novo conteúdo aprovado.
3. Implementar CSS responsivo com componentes/assets/tokens existentes, sem nova
   cor, sem substituir imagens da tela por uma captura e sem alterar shell global.
4. Lint, suíte Vitest completa, build e Playwright do Assistente em 320, 390, 768 e
   1280, mais evidência 390 × 844. Não atualizar baselines de outras telas.
   Visual usa API controlada; não chamar IA real ou dados privados de contas.
5. Revisão independente de arquitetura e QA; corrigir achados e repetir apenas
   gates afetados. Registrar comandos/resultados em verification.md.
6. Executar doc-sync-onboarding por último, conferindo AGENTS.md, CLAUDE.md e docs/.
   Se código mudar depois, repetir a sincronização. Preparar handoff local e PR
   quando a publicação estiver explicitamente autorizada; não integrar automaticamente.

Riscos: divergência de copy desktop/mobile, tratamento de foco, layout com texto
longo e teclado virtual. Não afirmar backend/IA reais, deploy ou paridade com
alterações Figma posteriores à nova exportação.

Data: 03/11/2026. Escopo autorizado: aplicar primeiro as mudanças no Figma.
Este plano não autoriza implementação da aplicação. A spec permanece `rascunho`
até a validação da proposta; entrega de design não equivale a comportamento entregue.

## Contexto e limites do fluxo

- Spec e revisão editorial existentes: `spec.md` e `review.md` desta pasta.
- Arquivo de design: [BestPrice IA](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=132-27).
- O MCP oficial permitiu a inspeção inicial nesta sessão e depois atingiu o
  limite de cota. A edição foi concluída pela interface do Figma, com importação
  de SVGs contendo texto e vetores editáveis e preservação dos assets originais.
  Não houve criação de bridge. A fonte Inter foi conferida na interface.
- A Issue ainda não foi publicada: houve rejeição da revisão automática de
  aprovação por falta de autorização explícita para o envio ao GitHub. Não
  presumir vínculo com Issue, PR ou Project.
- `refs/remotes/origin/develop` foi identificado no SHA
  `9d3b482a924d14fa8ff9f33cfb1fdac4a5044acb`. Não houve `fetch` nesta etapa; esse
  registro não comprova que o remoto permaneça nessa ponta.
- Não foi criada worktree de código: esta fase altera design e documentação.
  Antes da futura implementação, confirmar Issue, executar `fetch` e criar a
  worktree a partir de `origin/develop` conforme as regras do projeto.

## Superfícies e preservação

| Página | Quadro existente | Estado | Dimensões anteriores |
|---|---|---|---|
| Desktop `6:83` | `132:27` | Inicial | 1440 × 960 |
| Desktop `6:83` | `133:169` | Conversa | 1440 × 960 |
| Mobile `6:521` | `132:361` | Inicial | 390 × 1190 |
| Mobile `6:521` | `132:468` | Conversa | 390 × 1320 |

Na proposta final, os quatro IDs foram preservados; desktop permanece em
1440 × 960 px e os dois quadros mobile passam a 390 × 844 px. O quadro auxiliar
`184:200`, na página Mobile `6:521`, mede 1440 × 1280 px e reúne conteúdo sob
demanda e estados de referência. Sua largura representa uma prancha de revisão,
não um viewport de aplicação mobile.

Preservar os IDs dos quatro quadros e o shell de navegação. Registrar o estado
atual em capturas antes da primeira alteração. Guardar uma cópia identificada
dos quadros anteriores ou versão nomeada quando a ferramenta permitir; registrar
qual mecanismo foi realmente usado. Não substituir a tela por uma imagem.
Texto permanece editável e as instâncias existentes continuam vinculadas sempre
que a estrutura permitir.

Evidência preservada nesta execução: quatro exportações atuais em `before/`.
Foram confirmadas no histórico as versões “Antes da 0044 — Assistente com menos
sobrecarga”, “0044 — Assistente com menos sobrecarga” e “0044 — Revisão visual final”.
A versão anterior tem duas entradas de mesmo título, preservadas. As exportações
antes continuam disponíveis como evidência local, sem depender exclusivamente do
histórico remoto. O resultado tem cinco capturas em `after/`, incluindo
a prancha de estados. Texto/vetores editáveis importados não comprovam, por si,
vínculo integral de todos os controles a componentes ou tokens do arquivo.

Reutilizar logo original, robô, cores, tipografia, tokens e componentes existentes.
Não redesenhar marca, mexer em Histórico/Monitoramento ou criar uma nova família
visual. Fazer a descoberta dos componentes, variáveis e estilos antes de construir
controles adicionais. Novas extensões exigem justificativa e registro próprio;
preferir composição com o que o arquivo já oferece.

## Decisões de composição

1. **Entrada com uma tarefa principal.** Uma pergunta curta, campo identificado e
   envio evidente. O campo vazio tem um exemplo. Os três exemplos adicionais
   começam recolhidos sob “Ver exemplos”; desenhar também o estado aberto.
2. **Apresentação compacta.** Reduzir o espaço reservado ao robô, preservando sua
   proporção. No mobile de referência, pergunta, campo, envio e aviso essencial
   devem caber em 390 × 844 px sem teclado aberto. Não adotar compositor fixo sem
   uma avaliação futura do teclado virtual.
3. **Conversa em primeiro plano.** Durante uma conversa, recentes começam
   recolhidos no desktop e no celular. Não manter coluna ou lista permanente.
   Desenhar o acesso identificado e seu estado aberto; abertura e fechamento
   representam preservação da conversa e do rascunho, sem produzir envio.
4. **Transparência distribuída.** Manter visíveis junto ao envio: processamento
   pelo Google, possível uso do conteúdo na modalidade gratuita e cuidado com
   dados pessoais/confidenciais. “Sobre a IA e seus dados” abre os detalhes de
   retenção, backups/fornecedor, limitações, cota e contexto recente. Não repetir
   a explicação dos 90 dias no painel de recentes.
5. **Resposta identificada.** Manter identificação de IA e ausência de verificação
   dos dados de mercado em cada resposta; editar a redação sem alterar os fatos.
   Padronizar IA e conversas. Não converter “20 análises” em “20 mensagens” sem
   confirmar a unidade real da cota.
6. **Estados consultáveis.** Representar exemplos abertos, recentes abertos e
   detalhes da IA abertos em quadros auxiliares ou overlays nomeados e ligados à
   origem. Representar limite de entrada próximo ao fim e estados de erro/envio/
   indisponibilidade sem modificar as regras de negócio existentes.

Estados abertos podem ser quadros auxiliares para revisão. Caso sejam conectados
em protótipo, registrar exatamente quais interações foram ligadas e conferidas.
Não alegar preservação real de rascunho, operação de teclado ou leitor de tela com
base apenas em uma imagem ou ligação estática.

Nesta execução, os estados abertos e de operação foram representados estaticamente
na prancha `184:200`. Não foi validado protótipo funcional. A preservação de rascunho,
a seleção de exemplo, a retomada de conversa, o foco e a leitura assistiva continuam
requisitos da implementação futura, não comportamentos entregues pelo Figma.

## Contrato e camadas

Nenhum contrato REST, endpoint, DTO, regra de autorização, fornecedor, cota,
persistência ou prazo de retenção muda nesta etapa. Backend e frontend executáveis
não são alterados. Portanto, não há contrato novo a negociar nem TDD de aplicação
a executar neste plano de design. A futura implementação terá plano e testes de
comportamento próprios, guiados pelo Figma aprovado.

Alterações locais desta fase ficam na pasta da spec para plano, tarefas,
evidências antes/depois e verificação. `docs/PROGRESS.md` pode receber somente o
estado real da entrega de design pelo responsável pelo fechamento da tarefa.

## Validação e evidência

- Exportar os quatro quadros antes/depois com arquivo, node-id, dimensões e data.
- Exportar os estados auxiliares abertos, com nomes e IDs registrados.
- Conferir a árvore: textos editáveis, componentes preservados, nenhum painel
  de recentes permanentemente aberto na conversa e exemplos recolhidos na entrada.
- Inspecionar as capturas: hierarquia, cortes, sobreposições, margens, marca/robô,
  controle com alvo de ao menos 44 × 44 px e contraste da redação alterada.
- Conferir o primeiro viewport mobile de 390 × 844 px. Captura longa não comprova
  esse critério. Os demais tamanhos e fluxo com teclado virtual permanecem para
  validação executável, salvo se houver quadros adicionais e evidência específica.
- Pedir revisão independente da composição e correção de eventuais achados antes
  do handoff. O revisor deve inspecionar a versão final, não apenas a versão antiga.
- Registrar em `verification.md` evidência visual e limites por critério de aceite.
  Não marcar AC funcional concluído apenas por sua representação no Figma.

## Riscos e alternativas

Recolher tudo indiscriminadamente reduziria a transparência antes do envio; por
isso os três fatos essenciais ficam visíveis. Apagar exemplos ou o acesso aos
recentes reduziria capacidade; a decisão é recolher e preservar acesso. Redesenhar
o shell ou substituir o robô teria custo de identidade sem atender à demanda;
o plano preserva ambos. Rasterizar a tela impediria edição futura; a edição usa
camadas e componentes nativos.

Os maiores riscos são mudança remota concorrente, dependência de componentes
compartilhados e confundir protótipo com comportamento implementado. Inspecionar
antes de mutar, limitar a edição aos alvos e registrar o que foi realmente validado.

## Revisão da spec para esta fase

Não há bloqueio de produto para preparar a proposta Figma: as duas decisões de
layout relevantes foram respondidas. Ajustar os trechos do intake que ainda dizem
que esta etapa não altera o arquivo de design, pois a nova autorização permite
essa edição. AC03, AC05, AC07, AC08, AC10, AC11 e AC11a incluem comportamento
executável ou acessibilidade funcional: separar cobertura visual de validação
funcional pendente. Não marcar a spec `pronta` ou `implementada` por este plano.

## Revisão independente de escopo após a edição

As capturas finais e a prancha de estados preservam as decisões de produto:
exemplos sob “Ver exemplos”, um exemplo no campo, recentes recolhidos e aviso
essencial Google/modalidade gratuita/dados pessoais junto ao envio. A prancha
mantém 90 dias desde a criação, ausência de renovação pela edição, limpeza horária
com API em execução e limites sobre backups/registros do fornecedor. A cota continua
em 20 análises, sem renomeação indevida para mensagens. Não foi identificado novo
contrato, nova fonte de dados, promessa de verificação de mercado ou mudança de
política nessa representação.

`git diff --stat -- frontend backend`, `git diff --name-only -- frontend backend`
e `git status --short -- frontend backend` não mostraram alteração nessas pastas
nesta conferência. Isso confirma o limite do trabalho observado, sem declarar o
workspace inteiro limpo: alterações anteriores em outras pastas permanecem fora
desta revisão. A QA visual separada avalia legibilidade e composição; este parecer
é de escopo e não a substitui.

Parecer: escopo de design aceito. Versões nomeadas confirmadas no fechamento;
permanecem pendentes a rastreabilidade de componentes/tokens e validação funcional
posterior. Não há base para marcar AC funcionais ou a spec como implementados.

## Handoff

Entregar links dos quatro quadros atualizados, capturas e estados abertos,
resultado da revisão independente e pendências. A próxima decisão é a aprovação
visual para planejar a implementação; não realizar mudanças na aplicação nesta
entrega. Gates de lint/testes/build e doc-sync-onboarding não se aplicam enquanto
não houver alteração de código; continuam obrigatórios na etapa correspondente.
