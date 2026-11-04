# Tarefas — 0044, etapa Figma

## Implementação da SPA autorizada — 03/11/2026

- [x] I01 — Conferir Figma atual, fetch/base e criar worktree isolada; registrar bloqueio de publicação da Issue.
- [x] I02 — Revisar a spec conforme os novos cortes e a decisão desktop/mobile.
- [x] I03 — TDD de recentes recolhidos, foco e rascunho preservado, sem envio acidental.
- [x] I04 — Implementar composição e textos atuais com assets e tokens existentes.
- [x] I05 — Cobrir contador, envio, erro, sessão e atualização dos recentes; preservar contrato.
- [x] I06 — Executar lint, testes, build e verificações visuais/responsivas afetadas.
- [x] I07 — Obter revisão independente e QA, corrigindo achados.
- [x] I08 — Executar doc-sync-onboarding após a última alteração de código e os gates/revisão.
- [x] I09 — Registrar evidências e preparar handoff/PR sem presumir publicação, merge ou deploy.

O restante deste documento preserva o checklist da etapa anterior de design.

Data: 03/11/2026. Escopo: design primeiro; aplicação não alterada.
As caixas só devem ser marcadas com evidência real em `verification.md`.

## Situação observada após a edição

Quatro quadros foram atualizados preservando os IDs, com mobile em 390 × 844 px;
desktop permanece em 1440 × 960 px. O quadro estático `184:200`, na página Mobile,
mede 1440 × 1280 px e reúne exemplos, recentes, detalhes da IA e estados de operação.
Existem quatro capturas atuais em `before/` e cinco finais em `after/`.

O MCP atingiu a cota após a inspeção inicial. O resultado foi composto pela
interface do Figma com SVGs de texto/vetores editáveis e assets originais
preservados; Inter foi conferida na interface. Não há alegação de protótipo
funcional, vínculo integral a tokens ou validação de teclado/leitor de tela.
As caixas marcadas têm evidência consolidada em `verification.md`. D01 e D09
permanecem parciais pela descoberta de componentes/tokens interrompida pela cota;
isso não impede apresentar a proposta estática para validação.

## Checklist

- [ ] **D01 — Confirmar alvos e estrutura.** Inspecionar as quatro telas existentes,
  páginas, componentes, estilos e tokens do arquivo. Registrar IDs e dimensões.
  **Prova:** retorno de inspeção do MCP e lista de alvos.
- [x] **D02 — Preservar o antes.** Capturar as quatro telas e preservar uma cópia
  identificada ou versão nomeada conforme a capacidade disponível.
  **Prova:** capturas antes, mecanismo de recuperação e IDs/origem documentados.
  **Conferido:** quatro exportações atuais preservadas e versões anterior/final
  confirmadas no histórico do Figma, conforme verification.md.
- [x] **D03 — Simplificar a entrada desktop.** Editar `132:27`, com pergunta curta,
  um exemplo no campo e “Ver exemplos” recolhido, preservando shell e identidade.
  **Prova:** captura depois e árvore de camadas editáveis.
- [x] **D04 — Simplificar a entrada mobile.** Editar `132:361`, compactar apresentação
  do robô e manter pergunta, campo, envio e aviso essencial em 390 × 844 px.
  **Prova:** captura do primeiro viewport, sem corte ou sobreposição.
- [x] **D05 — Priorizar a conversa.** Editar `133:169` e `132:468` para recentes
  recolhidos por padrão em desktop e mobile, com acesso identificado.
  **Prova:** capturas das duas conversas, sem lista ou coluna permanente.
- [x] **D06 — Organizar transparência e limites.** Manter Google, modalidade gratuita
  e orientação sobre dados visíveis antes do envio; reunir os detalhes e remover
  retenção duplicada. Preservar identificação de IA nas respostas.
  **Prova:** inventário de textos finais e capturas dos pontos de exibição.
- [x] **D07 — Desenhar estados abertos.** Representar os três exemplos, recentes e
  “Sobre a IA e seus dados” abertos, preservando rascunho e conversa representados.
  **Prova:** IDs e capturas dos auxiliares; registrar eventuais conexões de protótipo.
  **Limite nesta execução:** prancha `184:200` estática, sem interação funcional
  validada; preservar rascunho é requisito para a futura aplicação.
- [x] **D08 — Representar estados de operação.** Conferir envio, erro recuperável,
  limite de entrada e IA indisponível, com redação curta e contextual.
  **Prova:** estados visuais identificados; não alegar execução de API ou IA.
- [ ] **D09 — Validar estrutura e composição.** Conferir textos editáveis, instâncias,
  proporções, alvos de toque, margens e ausência de corte/sobreposição nas capturas.
  **Prova:** retorno estrutural e observação visual da versão final.
- [x] **D10 — Revisar independentemente.** Encaminhar a versão final para revisão,
  corrigir os achados no Figma e repetir apenas as verificações afetadas.
  **Prova:** resultado do revisor e evidência dos ajustes quando houver.
  **Pareceres:** escopo e QA visual final aceitos, incluindo nova conferência dos
  ajustes de retenção e rótulos mobile; qa-review.md registra o delta.
- [x] **D11 — Registrar entrega.** Preencher `verification.md`, atualizar a situação
  real da spec e o progresso do projeto, com links finais, antes/depois e pendências.
  **Prova:** documentação consistente; AC funcionais não comprovados continuam abertos.
- [x] **D12 — Handoff visual.** Entregar a proposta para validação da responsável,
  separando design entregue de futura implementação. Não abrir PR ou publicar
  Issue sem a autorização aplicável; não marcar a spec implementada.
  **Prova:** resposta de entrega com links e próximo passo explícitos.

## Pendências para a futura implementação

Issue autorizada e vinculada, `fetch` e worktree de `origin/develop`, plano de
aplicação, TDD dos comportamentos aprovados, gates de frontend e fluxo funcional
com teclado/leitor de tela, revisão independente, doc-sync-onboarding e PR para
`develop`. Nenhuma dessas etapas é presumida concluída pelo design.
