# Plano — Spec 0015

## Escopo e contrato

Base inspecionada: `ab7ff8e07eb7cfd0aa935790b11e74ae74c22781` de develop. O
inventário foi fixado antes da implementação e orientou o redesign nesta branch.
A spec registra requisitos revisados; a evidência de execução está em
`verification.md`. Revalidar mudanças na base em futuras alterações deste escopo.

Preservar `frontend/src/api.ts`, endpoints, DTOs, mensagens, paginação e estados de domínio
existentes de 0011–0013. Não há backend, migration ou novo contrato REST nesta entrega.
Pendências das specs dependentes, inclusive acesso real ao Mercado Livre, continuam
pendentes. Histórico atual é lista paginada; não adicionar gráfico/filtros do protótipo.
O login atual não oferece mostrar senha; acrescentar esse fluxo fica fora do redesign.

## Decisões visuais

1. `designsystem/logo-bestprice.png` é a marca oficial: copiar sem modificar bytes para
   `frontend/src/assets/logo-bestprice.png` e importar na aplicação. Imagem inteira,
   proporcional, sem filtros de cor, com nome acessível BestPrice uma única vez. Usar
   superfície de apoio quando necessário para leitura nos dois temas.
2. `designsystem/index.html` governa identidade e tokens. `designsystem/login.html` orienta
   composição; divergências seguem index (por exemplo, raio grande de 18 px, não os 24 px
   do login). A imagem da área do usuário é referência secundária de organização. Dados
   e controles ilustrativos não viram requisitos funcionais.
3. Evoluir os tokens existentes em `frontend/src/styles.css`. Verde de ação `#39ff14`
   com texto preto, rosa de leitura `#c7005e` no claro e `#ff3ea5` no escuro; bases
   branca/preta e superfícies cinza da referência. Preservar cores semânticas de erro,
   aviso, alta/queda com texto ou ícone. Ajustes para contraste são extensões documentadas
   em `designsystem/README.md`, com motivo e superfícies afetadas.
4. Hierarquia tipográfica e espaçamento 4/8 seguem a referência; cápsulas nas ações e
   raios de conteúdo coerentes. Usar fontes disponíveis no sistema com fallback sans-serif;
   não distribuir SF Pro nem copiar integralmente CSS/JS de origem não esclarecida.
5. Tema via `prefers-color-scheme`, claro como fallback, acompanhando alterações do sistema
   com a página aberta. Decisão adotada no intake: o seletor e o armazenamento do protótipo
   continuam demonstrativos; não adicionar seletor ou persistência à SPA.
6. Vidro limitado a cabeçalho, menus e diálogos, com superfície sólida legível como base;
   blur apenas onde suportado. Medir contraste sobre o fundo composto. Informações
   financeiras mantêm leitura direta. Movimento respeita preferência reduzida.
7. Produtos continuam empilhados em telas estreitas, sem scroll horizontal interno,
   conforme 0012. Nenhuma superfície inventariada exige exceção de overflow horizontal.

## Inventário e arquivos

Caminhos relativos a `frontend/src/`. Os componentes citados existem na base acima.
Estilos e composição compartilhados foram alterados em arquivos separados pelos
implementadores; o inventário abaixo permanece a referência para a revisão.

| Superfície | Arquivos a alterar conforme necessidade visual | Estados a preservar |
|---|---|---|
| Entrada/sessão | `App.tsx`, `styles.css` | Carregando sessão, indisponível/repetir, login, envio ocupado e erro, hero visitante |
| Marca/navegação | `dashboard/AppHeader.tsx`, `dashboard/AccountMenu.tsx`, `dashboard/Icons.tsx` | Seção atual, conta aberta/fechada, sair ocupado e erro no cabeçalho |
| Cadastro por URL | `dashboard/HeroTrackForm.tsx` | Inicial, envio, sucesso, erro/prazo, produto já monitorado |
| Painel | `dashboard/AccountArea.tsx`, `dashboard/SummaryIndicators.tsx`, `dashboard/OpportunityList.tsx`, `dashboard/RecentUpdatesTimeline.tsx`, `dashboard/Skeletons.tsx` | Esqueletos, resumo, sem produtos/oportunidades/eventos, falha de carga/repetir |
| Produtos/menu da linha | `dashboard/TrackedProductsTable.tsx`, `dashboard/TrackedProductRow.tsx`, `dashboard/RowActionsMenu.tsx`, `dashboard/ProductImage.tsx` | Paginação e erro, refresh ocupado/erro, sem imagem/preço, desatualizado, indisponibilidade |
| Detalhe/histórico/alerta | `dashboard/ProductDetailDialog.tsx` | Histórico vazio/listado/paginado, ações ocupadas/erro; criar/editar/ativar/pausar/excluir alerta |
| Notificações | `dashboard/NotificationBell.tsx`, `dashboard/AlertsSection.tsx` | Sino aberto/fechado, carga, vazio, lista, erro/repetir, marcar lida e paginação |
| Confirmação de interrupção | `dashboard/ConfirmStopDialog.tsx`, `dashboard/StopTrackingConfirm.tsx`, composição em `dashboard/AccountArea.tsx` | Pela linha e dentro do detalhe, com/sem alerta ativo, envio, cancelar, erro no local de origem |

A abertura do detalhe não tem diálogo com esqueleto próprio; falha de abertura aparece
na área autenticada. Evidenciar onde o estado existe sem inventar um novo para a matriz.
Novo arquivo: `frontend/src/assets/logo-bestprice.png`. Nenhuma dependência nova prevista.
Preservar hooks de dados, utilitários de dinheiro/datas e cliente HTTP; se for necessário
alterá-los, revisar o plano antes de prosseguir.

## Documentação e responsabilidades

- `.agents/rules/frontend.md` e `workspace.md`: identidade permanente, skill frontend-design,
  precedência das referências e destino das extensões.
- `designsystem/README.md`: hierarquia das referências e registro de extensões.
- `docs/apps/frontend.md`: atualizar após implementação real; conferir `AGENTS.md` e
  `CLAUDE.md` e sincronizar projeções com `.agents/sync.ps1`.
- `tasks.md`, `verification.md` e `docs/PROGRESS.md`: andamento e resultados reais.
- Revisão independente: arch-reviewer; aceite documental/visual: QA. Depois da última
  mudança de código e da revisão, doc-sync-onboarding encerra a sincronização.

## Sequência e evidências

1. Confirmar inventário/contrato e revisar proposta visual com frontend-design.
2. Para comportamento alterado, teste com falha esperada antes e sucesso depois. Para CSS
   e marca, evidência visual e suíte existente; evitar testes que espelhem classes/CSS.
3. Aplicar tokens/ativo e superfícies inventariadas, mantendo mensagens e foco.
4. Em `frontend/`: `npm run lint`, `npm test -- --run` (contagem positiva) e `npm run build`.
   Proteger fluxos com testes existentes de App, header, hero, products, detail, bell,
   alerts, stop-tracking e states; acrescentar somente regressões comportamentais relevantes.
5. Matriz: cada superfície acima em claro/escuro × 320/768/1280 px. Estados de carregamento,
   erro e ações ocupadas existentes também em claro/escuro × 320/1280 px; incluir vazios e
   condições de dados listadas. Registrar N/A justificado para estados sem implementação
   própria (ex.: menu da linha não consulta dados ao abrir).
6. Cada registro contém superfície, estado, tema, viewport, cenário reproduzível, origem
   dos dados (API real/fixture isolada), caminho da captura e resultado. Fixtures não são
   incorporadas à aplicação como modo de demonstração. Capturas ficam em artefatos locais
   ignorados pelo Git; registrar sua localização e limites de disponibilidade na evidência.
7. Percorrer teclado, Tab/Shift+Tab, Escape e retorno de foco; conferir nomes, mensagens,
   contraste, alvos de 44 px, movimento reduzido e fallback sem blur. Medir overflow do
   documento e tabela mobile. Análise automatizada de acessibilidade complementa inspeção
   manual, sem substituir teclado, contraste de vidro ou revisão visual.
8. Exercitar sessão → painel → detalhe → ação com API/banco locais no que estiver disponível.
   Identificar simulações e limitações de credenciais Mercado Livre separadamente; não
   afirmar integração externa não observada.
9. Corrigir achados de arch-reviewer/QA e repetir evidências afetadas; sincronizar onboarding
   após a última alteração de código. Handoff por PR para develop, CI e revisão independente.
   Documentação isolada não comprova os critérios visuais nem conclui o redesign da Issue.

## Riscos

CSS global pode afetar todas as superfícies; verificar cada estado listado. Paleta de
referência não garante contraste sobre qualquer fundo: documentar ajustes necessários.
A experiência de tema automático é decisão de escopo; alterar para seleção manual exige
revisão explícita. As pendências externas de 0011–0013 não são resolvidas pelo redesign.
