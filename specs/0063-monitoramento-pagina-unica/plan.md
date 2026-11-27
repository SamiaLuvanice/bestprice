# Plano — 0063 Monitoramento em página única

## Contrato

Sem mudança de API. A página usa somente `GET /api/dashboard` (resumo, primeira página
de produtos e atualizações recentes), `GET /api/tracked-products` (paginação) e os
endpoints já usados por detalhe, alertas e notificações (`frontend/src/api.ts`).

## Camadas e arquivos

Somente `frontend/`.

| Arquivo | Mudança |
|---|---|
| `src/dashboard/monitoringPaths.tsx` (novo) | Contexto com os caminhos da área: legado (`/produtos`, `/produtos/:id`, `/alertas`) e embutido (`/app/monitoring`, `/app/monitoring/:id`, `/app/monitoring/alerts`). |
| `src/dashboard/AccountArea.tsx` | Seção `monitoring` no modo embutido: título "Monitoramento de preços", link "Ver alertas", sino, indicadores, lista "Produtos monitorados", atualizações recentes; sem `AppHeader` no modo embutido; checagens de `pathname` e navegações usam o contexto. |
| `src/features/research/ResearchArea.tsx` | `/app/monitoring/overview` redireciona (replace) para `/app/monitoring`. |
| `src/dashboard/SummaryIndicators.tsx` | Variante em cartões com ícone (`variant="cards"`), mantendo rótulos e notas. |
| `src/dashboard/TrackedProductsTable.tsx` | Título, nível de cabeçalho e quantidade configuráveis; sem cabeçalho de tabela com lista vazia. |
| `src/dashboard/productColumns.ts`, `TrackedProductRow.tsx`, `labels.ts` | Colunas: Produto, Último preço, Variação, Menor preço, Situação, Última leitura, Ações; função pura `productSituation`. |
| `HeroTrackForm`, `NotificationBell`, `AlertsSection`, `ConfiguredAlerts`, `RecentUpdatesTimeline`, `OpportunityList`, `ProductDetailDialog` | Links pelos caminhos do contexto. |
| `src/styles.css` / `features/research/research.css` | Cartões de indicador, cabeçalho da página e rótulos de situação com tokens existentes. |
| Testes (`src/dashboard/monitoring.test.tsx` novo; ajustes em header/overview/hero/states/timeline/App/research/routes/primaryAction) | TDD dos critérios. |
| `tests/visual/monitoring-overflow.spec.ts` | Continua cobrindo overflow; acrescentar axe e 320/390 px na página única. |

## Decisões

- **Contexto de caminhos em vez de prop por componente.** Nove componentes montam links
  para o produto ou alertas; uma prop atravessaria a árvore inteira. O contexto tem um
  padrão legado, então as rotas fora da barra lateral não mudam (AC13). Alternativa
  descartada: reescrever URLs só no modo embutido por regex, que já gerou as checagens
  quebradas de `window.location.pathname === '/produtos/:id'` no modo embutido.
- **Tabela compartilhada.** As colunas novas valem também em `/produtos` (mesmo componente);
  o comportamento da rota legada é preservado, só os rótulos das colunas mudam. Manter duas
  tabelas duplicaria código sem ganho para quem usa.
- **Situação derivada no cliente**, só de campos do próprio produto, em ordem:
  `availability === 'unavailable'` → Indisponível; `current_price === null` → Sem preço;
  `percentage_change` desconhecida → Sem variação conhecida; senão a direção de
  `formatPercentage` (a mesma da pílula de variação, sem `number`) → Em queda / Em alta /
  Sem alteração. A disponibilidade passa à linha secundária (Disponível / Indisponível / Não confirmada).
- **Sem `AppHeader` no modo embutido**: a barra lateral já é a navegação; o sino passa ao
  cabeçalho da página única. Alertas e detalhe embutidos ganham link de volta.
- **Boas oportunidades** sai do produto: a antiga visão geral era o único lugar em que aparecia
  (`/` é a landing), e o redirecionamento a substitui. Componente e esqueleto removidos.

## Riscos

- Muitos testes existentes usam `/app/monitoring/overview` e textos da Início ("Seu painel
  de preços", "Boas oportunidades"); serão atualizados para a página única, sem perder os
  cenários de estado (carga, erro, preservação de dados).
- Foco: o `h1` da página única recebe o foco ao abrir, como nas demais rotas.
- Figma: quadros 0041/06 divergem nos elementos fora de escopo; registrar em verificação.
