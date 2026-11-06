# Plano — 0045

## Referência e mapeamento

Exportações da spec 0043 em after/desktop/05 · Histórico · Desktop.png e
after/mobile/05 · Histórico · Mobile.png, 31/10/2026, frames 59:204 e 59:716.
Fontes editáveis desktop-history-content.svg/mobile-history-content.svg em design/.
Usar esses arquivos do checkout de base; não alterar specs anteriores.

O shell já apresenta três destinos, marca e header de 80 px (0044). Reutilizá-lo.
Não há nova imagem estática na área do histórico; busca usa Search de lucide já
instalado, marca usa Brand existente. Reutilizar Button e Input oficiais locais.
CSS isolado history.css: margem desktop 32 px, título 30 px, busca de 48 px,
cards de ao menos 128 px com raio 16 px e espaçamento 24 px; mobile com margens
16/20 px, título 24 px, cards empilhados e espaçamento 16 px. Tokens existentes
de superfície, texto, borda, rosa e foco; controles conservam contraste acessível.

## Contrato preservado

GET /api/research?kind=conversation&q=<título>&offset=<n>&limit=20 retorna
ResearchPage {items: ResearchItem[], next_offset: number|null}; usar cliente
validado existente e filtro conversation no servidor, sem filtragem local que
quebraria paginação. Continuar navega para /app/assistant/:id.
DELETE /api/ai/conversations/:id, 204; 401 encerra sessão. Erros HTTP, resposta
inválida e rede seguem ApiFailure/failureText. Sem alteração de contrato/backend.

## Implementação e decisões

HistoryPage.tsx mantém estado de busca/página e guarda de respostas obsoletas;
eliminar estado de tipo e ramo de exclusão de comparação. Buscar por submit
(Enter e botão ícone), para não introduzir debounce ou requisições por tecla.
Datas por Intl com time sem alterar instantes UTC. Item sem link redundante no
título: ação Continuar nomeada pela conversa. Excluir permanece visível mobile,
pois removê-lo tornaria inacessível um comportamento existente. Diálogo existente
reutilizado. Ajuste identificado durante TDD/revisão: common.tsx/DeleteResearchDialog
também precisa gerir foco inicial/retorno. O teste Red confirmou que o hook de
trap existente não faz essas duas ações. Acrescentar ciclo de foco ao diálogo
compartilhado, preservando contrato, conteúdo e exclusão das demais telas; incluir
os testes de integração existentes na regressão. O estado vazio usa outline para
evitar o conflito preexistente entre a cor de links no conteúdo e Button brand.

Estados carregamento/vazio/erro preservados e contextualizados para conversas.
Paginações só aparecem quando necessárias; erro esconde a página anterior.
Aviso de 90 dias sempre disponível abaixo da lista, substituindo o aviso de
exemplos do desenho. Não inserir textos/títulos ilustrativos em produção.

## Verificação e risco

TDD por comportamento em HistoryPage.test.tsx; ajustar testes de integração
existentes cujo contrato de UI mudou. Lint, Vitest completo, build; Playwright
focado com mocks da fronteira HTTP, axe, teclado, viewport e capturas reais.
Capturas novas para revisão, sem atualizar baselines existentes implicitamente.
Revisão documentada de arquitetura, diffs e a11y; agente doc-sync-onboarding final.
Risco conhecido: cota impede conferir edições remotas posteriores a 31/10.
