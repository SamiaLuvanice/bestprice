---
numero: 0045
titulo: Histórico de conversas conforme Figma
tipo: melhoria
prioridade: P2
status: pronta
toca: [frontend]
depende_de: [0034, 0042, 0043, 0044]
---

# 0045 — Histórico de conversas conforme Figma

Issue: [#235](https://github.com/SamiaLuvanice/bestprice/issues/235).

## Problema e público

Quem deseja retomar uma conversa encontra um histórico misto de pesquisas, com
filtro de tipo e linhas pouco próximas do design aprovado. A responsável pediu
implementar as melhorias feitas no Figma para essa tela. Melhoria P2, sem
incidente operacional, destinada a pessoas autenticadas com conversas salvas.

## Resultado esperado

A tela apresenta “Suas conversas”, descrição curta, busca única pelo título e
cards com título, data real da última atualização e ação “Continuar”. O desktop
organiza conteúdo e ações horizontalmente; no mobile as ações ficam abaixo do
título. O histórico lista apenas conversas e conserva paginação e exclusão com
confirmação, inclusive em telas estreitas. Comparações salvas não são apagadas.

Referência: [BestPrice IA](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=59-204),
frames desktop 59:204 (1440×1040) e mobile 59:716 (390×844), exportações
identificadas de 31/10/2026 da spec 0043, após harmonização da 0042.

## Critérios de aceite

- [x] **AC01 — Composição:** título, descrição, busca única, cards e Continuar seguem a referência desktop/mobile; exemplos do Figma não são inseridos na conta.
- [x] **AC02 — Conversas:** a consulta seleciona apenas conversas; não há filtro de tipo ou menção a comparações na tela. Continuar abre a conversa correspondente.
- [x] **AC03 — Busca e páginas:** buscar pelo título com Enter ou acionador acessível reinicia a primeira página, mantém o termo na paginação e permite limpar a busca; respostas de consultas anteriores não substituem a atual.
- [x] **AC04 — Exclusão:** Excluir identifica a conversa e exige confirmação. Cancelar preserva o registro; falha permite tentar novamente; sucesso recarrega a primeira página da mesma busca. Exclusão permanece disponível em mobile.
- [x] **AC05 — Estados:** carregamento, histórico vazio, busca sem resultado, erro recuperável e sessão expirada são tratados; permanece informado o prazo de 90 dias da criação.
- [x] **AC06 — Acessibilidade:** teclado, nomes acessíveis, foco visível e alvos de pelo menos 44×44 px; títulos longos e viewports 320/390/768/1280/1440 px não causam overflow horizontal.
- [x] **AC07 — Entrega:** lint, testes e build frontend aprovados; comparação visual com origem e limites, revisão do diff e doc-sync final registrados.

## Fora de escopo

Remover rotas, API, persistência ou dados do comparador; alterar Assistente,
Monitoramento, shell compartilhado, regras de retenção, integrações ou deploy.
Busca no conteúdo de mensagens, agrupamento por datas e filtros novos.

## Suposições e limites

O pedido autoriza implementar a direção existente da tela. O MCP retornou limite
Starter em 04/11/2026; usa-se o fallback de exportações identificado permitido por
frontend.md. Não se declara paridade com alterações remotas posteriores.
“Palavra-chave” significa título, conforme contrato existente. Datas e exclusão
em mobile preservam comportamento útil existente, mesmo sem esses detalhes no
quadro estático. O aviso demonstrativo do Figma dá lugar ao prazo real de guarda.
