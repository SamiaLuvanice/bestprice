# Plano de implementação — 0040

Issue: [#225](https://github.com/SamiaLuvanice/bestprice/issues/225).

Em 31/10/2026 a pessoa responsável solicitou implementar a proposta existente e
autorizou usar as exportações locais e a interface do Figma após o bloqueio de cota
do MCP. A referência mais recente é o Assistente da 0043, com três destinos.

## Escopo e direção visual

Reutilizar Brand, Button, AccountMenu, ícones Lucide, tokens e API tipada existentes.
Sidebar branca de 240 px, header de 80 px, superfície clara, rosa de ação
`--primary` (#c7005e), texto `--foreground` (#1d1d1f), secundário
`--muted-foreground` (#626267), fundos rosa e verde suaves junto ao robô original.
Preservar a tipografia oficial da SPA. No desktop, a escrita e o robô ocupam a
coluna principal e conversas recentes a coluna direita; mobile empilha as seções.
O robô é o único destaque ilustrativo. Não copiar as conversas demonstrativas.

Os avisos reais de privacidade, retenção e cotas precisam de mais espaço que o
protótipo estático. Mantê-los legíveis, disponíveis antes de enviar e no fluxo da
página. Campo e envio continuam acessíveis sem posicionamento fixo sobre teclado.

## Contrato existente (sem mudanças)

- GET `/api/research?kind=conversation&q=&offset=0&limit=4`: resumos próprios,
  válidos e ordenados por updated_at decrescente pelo servidor; 200 com items e
  next_offset; 401 encerra sessão; 503/erro de rede exibe nova tentativa só na lista.
- GET `/api/ai/conversations/:id`: conversa própria e mensagens; 404 informa
  indisponibilidade, sem mostrar boas-vindas como se fosse conversa nova.
- POST `/api/ai/chat`: conversation_id, request_id, message; preservar validação,
  idempotência, cotas, timeout e texto em falha; atualizar lista após sucesso.
- GET `/api/ai/capabilities`: preservar habilitação explícita e limites existentes.

## Arquivos e responsabilidades

- AssistantPage: boas-vindas, conversa e formulário; preservar estado existente.
- RecentConversations: carga isolada, quatro entradas, retry, vazio e links.
- ResearchArea/research.css: shell compartilhado, IA elevada e três destinos.
  Comparador permanece acessível por suas rotas; não apagar dados, API ou páginas.
  Monitoramento mantém conteúdo e controles próprios, sem duplicar headers.
- assistant.css: composição responsiva específica, sem afetar landing/login.
- Asset original local em frontend/src/assets/research; nenhum URL temporário.

## Verificação

TDD pela interface para listagem, falha isolada, retomada, atualização, troca de
conversa e privacidade. Rodar lint, Vitest e build completos. Playwright confere
320/390/768/1280 px, estados inicial/conversa/vazio/erro, geometria do robô,
overflow, teclado e acessibilidade. IA e listagem controladas nos testes não
comprovam disponibilidade do fornecedor ou integração operacional com banco.
Revisão documentada, evidências reais, agente doc-sync-onboarding por último.
PR para develop, sem merge automático.

## Riscos

Lista não deve apagar nem bloquear rascunho; resultados de requisições desmontadas
não podem vazar entre sessões. Um envio novo muda a URL e remonta a página; a
listagem deve recarregar nessa montagem e em envios posteriores. A navegação segue
o design atual sem ampliar esta tarefa para remover o comparador do produto.
