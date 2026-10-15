# Plano — 0021 Navegação por rotas

Data: 15/10/2026. Issue: [#93](https://github.com/SamiaLuvanice/bestprice/issues/93).
Base: `origin/develop` em `80b3eae94cd7fa493770657aa5a63ae58e194195`.
Branch: `feature/0021-issue-93-navegacao-por-rotas`.
Worktree: `.worktrees/feature-0021-issue-93-navegacao-por-rotas/`.

## Resultado e limites

Entregar cinco rotas de interface com sessão, histórico do navegador e detalhe
endereçável, reutilizando o domínio existente. Backend, migrations, contratos e
integração Mercado Livre não precisam mudar. Este documento prepara a implementação;
nenhum critério de aceite está demonstrado apenas por existir um plano.

## Decisões

1. Usar React Router em modo declarativo, com `BrowserRouter`, rotas aninhadas e
   links reais. O modo usa History API e atende URLs sem fragmento, histórico e novas
   abas. Não implementar um roteador próprio nem migrar o projeto para framework ou
   renderização no servidor. Confirmar compatibilidade com React/Node na instalação
   e registrar a versão resolvida no lockfile. Referências oficiais consultadas em
   15/10/2026: [instalação](https://reactrouter.com/start/declarative/installation) e
   [BrowserRouter](https://reactrouter.com/api/declarative-routers/BrowserRouter).
2. Sessão fica acima das páginas; dados de domínio pertencem à árvore da sessão
   autenticada e são descartados quando ela termina ou muda de usuário. Manter apenas
   estado compartilhado necessário para lista, resumo e sino. Não adicionar biblioteca
   de cache global nesta mudança. Respostas antigas não podem repovoar sessão encerrada.
3. Guardar retorno em `returnTo` na query do login, para sobreviver a recarga sem
   armazenar credenciais. Aceitar exclusivamente caminhos canônicos `/`, `/produtos`,
   `/alertas` e `/produtos/<id>` com um único segmento; ignorar query/hash do destino.
   Rejeitar esquemas, `//`, barras invertidas, controles, segmentos codificados com
   separadores e `/login`. Usar parser/allowlist central e não fazer decodificações
   repetidas. Identificador bem formado mas inexistente continua sujeito à API.
4. Navegação explícita usa histórico normal; encaminhamentos de sessão, login já
   autenticado e sucesso de login usam substituição da entrada atual para evitar
   voltar a páginas intermediárias. Logout limpa a árvore autenticada e substitui
   a entrada por `/login`; histórico restante continua protegido pelo guard.
5. Extrair o conteúdo do detalhe do invólucro modal. O detalhe usa o parâmetro de
   rota, consulta própria e link explícito para Produtos. O conteúdo da confirmação
   de interrupção continua reutilizado em diálogo acessível. O detalhe não mantém
   trap de foco, backdrop nem botão de fechar próprios de modal.
6. A lista de alertas é uma projeção paginada de monitoramentos ativos com `alert`
   embutido. Não consultar cada alerta individualmente, nem usar só os 20 itens do
   dashboard. Carregar a primeira página e oferecer "Carregar mais alertas" enquanto
   houver cursor. Se uma página não contiver alertas, continuar sequencialmente até
   encontrar itens ou esgotar o cursor. Não declarar vazio antes de esgotar a busca.
   A falha preserva itens/cursor válidos e permite tentar de novo; deduplicar IDs,
   preservar ordem do servidor e descartar respostas de gerações anteriores.

## Estrutura proposta e propriedade de arquivos

| Responsabilidade | Arquivos previstos | Papel |
|---|---|---|
| Router, guard, sessão, retorno, foco e títulos | `frontend/src/main.tsx`, `App.tsx`, novos módulos em `frontend/src/navigation/` | frontend |
| Layout autenticado, dados e ações compartilhados | `frontend/src/dashboard/AccountArea.tsx`, hooks extraídos por responsabilidade em `dashboard/` | frontend |
| Início, Produtos, Alertas, detalhe e página não encontrada | novos componentes de página em `frontend/src/pages/` | frontend |
| Conteúdo reutilizável de detalhe e confirmação | `dashboard/ProductDetailDialog.tsx`, `StopTrackingConfirm.tsx`, `ConfirmStopDialog.tsx` | frontend |
| Links e seção ativa | `AppHeader.tsx`, `NotificationBell.tsx`, `AlertsSection.tsx`, `TrackedProductRow.tsx`, `OpportunityList.tsx`, `RecentUpdatesTimeline.tsx`, `HeroTrackForm.tsx`, `RowActionsMenu.tsx` | frontend |
| Alertas configurados | novo componente e hook em `dashboard/`; tipos e cliente `api.ts` apenas se necessários sem mudar o HTTP | frontend |
| Dependência e estilos das novas composições | `frontend/package.json`, `package-lock.json`, `src/styles.css` | frontend |
| Testes por rota e regressões | `App.test.tsx`, testes de `dashboard/`, novos testes em `navigation/` e `pages/`, helpers em `src/test/` | frontend, depois QA |
| Hospedagem | inspeção de `frontend/nginx.conf`, `public/_routes.json`, `functions/api/[[path]].ts`; alteração só se a verificação revelar necessidade | frontend |
| Evidência e revisão | arquivos desta spec e `docs/PROGRESS.md` | coordenação/QA |
| Documentação final | `docs/apps/frontend.md`, documentos afetados em `docs/`, `AGENTS.md`, `CLAUDE.md`, `designsystem/README.md` se houver extensão visual | doc-sync-onboarding |

Nomes de novos módulos podem ser ajustados sem alterar responsabilidades. Um único
implementador frontend tem posse de `frontend/` para evitar colisões na extração de
AccountArea. Revisão e QA entram após a entrega da fatia; não há tarefa backend.

## Contrato REST preservado

Todos os caminhos abaixo são relativos à mesma origem. Autenticação por cookie
HttpOnly `bestprice_session`, com escopo `/api`; a UI continua usando `credentials:
same-origin`. Nunca copiar sessão para armazenamento web ou URL.

| Método e rota | Entrada | Resposta de sucesso | Erros relevantes |
|---|---|---|---|
| `POST /api/auth/login` | JSON `{email, password}` | 200 `{id, email}` e cookie | 401 credenciais inválidas; 422 validação; falha de rede/servidor |
| `GET /api/auth/me` | Cookie | 200 `{id, email}` | 401 sem sessão; erro/rede não é logout |
| `POST /api/auth/logout` | Cookie quando presente | 204, remove cookie | falha de rede/servidor mantém erro recuperável |
| `GET /api/dashboard` | Cookie | 200 `{summary, opportunities, tracked_products, recent_updates}` | 401; erro/rede |
| `GET /api/tracked-products` | Cookie; `cursor` opcional, `limit` 1–100 (padrão 20) | 200 `{items: TrackedProduct[], next_cursor}` | 401; 422 cursor/limite; erro/rede |
| `POST /api/tracked-products` | Cookie; JSON `{url}` | 201 novo ou 200 reativado, `TrackedProduct` | 409 `already_tracked` com ID; 422 URL/contexto; 429/502/503 integração |
| `GET /api/tracked-products/{id}` | Cookie; UUID do monitoramento | 200 `TrackedProduct`, inclusive `active:false` | 401; 404 ausente/alheio; 422 UUID inválido |
| `DELETE /api/tracked-products/{id}` | Cookie; UUID | 204 | 401; 404; 422; erro/rede |
| `POST /api/tracked-products/{id}/refresh` | Cookie; UUID | 200 `TrackedProduct` | 401; 404; 409 inativo; 422; 429 com espera; 502/503 integração |
| `GET /api/tracked-products/{id}/history` | Cookie; UUID; `cursor`, `limit`, `from`, `to` opcionais | 200 `{items: HistoryEntry[], next_cursor}` | 401; 404; 422; erro/rede |
| `GET /api/tracked-products/{id}/alert` | Cookie; UUID | 200 `PriceAlert` | 401; 404 monitoramento/alerta ausente; 422 |
| `POST /api/tracked-products/{id}/alert` | Cookie; JSON `{target_price: string}` | 201 `PriceAlert` | 401; 404; 409 inativo/duplicado; 422 |
| `PATCH /api/tracked-products/{id}/alert` | Cookie; JSON `{target_price?: string, enabled?: boolean}` | 200 `PriceAlert` | 401; 404; 409 inativo; 422 |
| `DELETE /api/tracked-products/{id}/alert` | Cookie; UUID | 204 | 401; 404; 422 |
| `GET /api/notifications` | Cookie; `cursor`, `limit`, `unread_only` opcionais | 200 `{items: Notification[], next_cursor}` | 401; 422; erro/rede |
| `PATCH /api/notifications/{id}` | Cookie; JSON `{read:true}` | 200 `Notification` | 401; 404; 422 |

Health de integração permanece público em `GET /api/health`: 200
`{"status":"ok","database":"ok"}` ou 503
`{"status":"unavailable","database":"unavailable"}`, sem detalhes internos.

`TrackedProduct` contém `id`, `active`, `active_since`, `product` e `alert` anulável.
O ID de navegação vem de `TrackedProduct.id`, `tracked_product_id` da notificação
ou do evento; nunca de `product.id` nem do identificador MLB. `PriceAlert` contém
`id`, `tracked_product_id`, `target_price`, `currency`, `enabled`, `revision`,
`condition`, `last_notified_at`. `Notification` contém `id`, `tracked_product_id`,
`type`, `product_title`, `observed_price`, `target_price`, `currency`, `observed_at`,
`created_at`, `read_at`. Dinheiro permanece string decimal; instantes são UTC ISO
8601 e formatados para apresentação como já ocorre. Tipos e validadores existentes
em `api.ts` e modelos em `backend/app/products/schemas.py` regem os campos restantes.

Erros de domínio seguem `{error:{code,message,fields,tracked_product_id,
retry_after_seconds}}`; `fields` de validação contém `field`, `code`, `message`.
Falhas não estruturadas ou de rede usam a mensagem segura existente. Um 404 de endpoint
de alerta não comprova ausência do monitoramento: consultar novamente o detalhe para
distinguir alerta removido de monitoramento ausente/alheio e preservar a recuperação
de concorrência entre abas existente. O guard só reage a 401; 403/404/422/5xx não encerram sessão.

## Fluxo e ciclo de vida

- `/login` reutiliza `LoginForm` sem regressão visual/validação da 0020. Durante
  carregamento de sessão, nenhum conteúdo protegido é montado. Falha transitória
  mostra nova tentativa e preserva o destino. Não há chamadas de domínio do visitante.
- Layout autenticado contém cabeçalho, sino, saída e conteúdo da rota. O Início monta
  resumo/oportunidades/atualizações e formulário; Produtos monta formulário/lista;
  Alertas monta grupos independentes; detalhe não depende de uma lista pré-carregada.
  Separar a ativação da consulta de notificações completas em `useNotifications` da
  consulta global de não lidas: o layout não deve carregar histórico de notificações,
  produtos ou detalhes que só a rota correspondente utiliza.
- Menus e títulos derivam da URL, sem `currentSection` concorrente. Links reais
  preservam Ctrl/Cmd+clique e nova aba. Detalhe ativa Produtos. Ao navegar, fechar
  disclosures, atualizar `document.title` e focar o título principal; consultas ou
  atualização de dados na mesma tela não roubam foco. Confirmações mantêm foco modal.
- A mutação de cadastro permanece na origem e oferece link de detalhe no sucesso
  ou duplicidade. Mudança de rota enquanto uma requisição está pendente não pode
  fazer resposta atrasada reabrir página ou sobrescrever outro produto.
  O feedback de sucesso hoje armazena apenas texto: incluir o ID retornado para o
  novo link. A timeline deve oferecer link também nos eventos com produto conhecido,
  não apenas no fallback sem título/imagem.
- Detalhe consulta o ID diretamente. UUID inválido apresenta estado seguro sem
  transformar 422 em erro de sessão; 404 trata ausente/alheio igualmente. `active:false`
  mostra monitoramento interrompido sem carregar ações de atualização/alerta. Anúncio
  Mercado Livre não localizado com monitoramento ativo continua mostrando o estado
  de domínio, diferente de monitoramento inexistente.
- Depois de mutações, invalidar/recarregar dados afetados (resumo, lista, alertas e
  sino), mantendo deduplicação e itens paginados não afetados. Cancelar confirmação
  mantém URL; sucesso de interrupção leva a Produtos com mensagem e foco definidos.
- Logout/401 invalidam requisições pendentes e dados da árvore autenticada. Validar
  sessão ao restaurar documento pelo histórico (`pageshow` persistido) antes de
  reexibir dados; cenário com bfcache exige observação em navegador, não apenas jsdom.

## Hospedagem e validação externa

O nginx já usa `try_files $uri $uri/ /index.html` e proxy separado em `/api/`.
No Pages, preservar `_routes.json` restrito à API e não criar `404.html` na raiz:
o fallback SPA padrão entrega a raiz para caminhos sem asset correspondente, conforme
a [documentação oficial](https://developers.cloudflare.com/pages/configuration/serving-pages/).
A página não encontrada é renderizada pela SPA. Não transformar respostas de API em
HTML nem aplicar redirecionamento global que capture `/api/*`.

Antes da integração, verificar navegação em Vite e no Compose isolado com nginx,
FastAPI e PostgreSQL. Preview Pages pode antecipar evidência de fallback, mas não
substitui AC06 em stage. Após promoção pelo fluxo do projeto, registrar SHA implantado,
abertura direta e recarga das cinco rotas em stage; até lá AC06 fica parcial.
Não declarar spec implementada enquanto faltar essa evidência. Promoção é fluxo
separado: a PR desta implementação tem base develop.

## Validação e riscos

TDD por fatias: testes de comportamento falham pelo motivo esperado antes da mudança,
depois passam com lint e build. Adaptar testes que pressupõem página única para
navegar à rota correta; preservar asserções de domínio, concorrência, foco e erro.
O helper `src/test/productsHarness.tsx` deve aceitar rota inicial; testes de detalhe
devem procurar página e título, reservando `role=dialog` para a confirmação.

| Risco | Demonstração planejada |
|---|---|
| Redirecionamento externo ou loop | Retorno normal, externo, `//`, barras invertidas, codificado, inválido e `/login`; recarga durante login |
| Dados de outra sessão ou resposta atrasada | Logout com fetch pendente, 401 durante ação, novo login com outra conta, detalhe A→B com respostas invertidas |
| Lista de alertas incompleta | 3 páginas de monitoramentos, página intermediária sem alertas, alertas pausados, erro da próxima página e retry, IDs sem duplicação |
| Histórico/novas abas/fallback | Browser real com entrada direta, reload, Ctrl/Cmd+clique, voltar/avançar e retorno a documento restaurado |
| Regressão de domínio | Cadastro duplicado, refresh 429/503, alerta removido em outra aba, interrupção cancelada/falha/sucesso e detalhe inativo |
| Acessibilidade e layout | Teclado, foco após navegação e confirmação, títulos e seção ativa em 320/768/1280 px |
| Dependência externa indisponível | Separar fixtures de integração local e testes simulados de consultas reais ao Mercado Livre; não exigir credenciais reais para validar rotas |

Gates da implementação: frontend lint, Vitest com contagem positiva e build; gates
do repositório conforme quality-gates, incluindo backend com PostgreSQL isolado e
automações/CI. QA registra AC01–AC21 individualmente. Não executar testes de aplicação
apenas para aprovar estes documentos. Revisão independente precede doc-sync-onboarding,
que é a última etapa após alterações de código; repetir se houver correção posterior.
