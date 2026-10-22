# Auditoria visual e relatório de decisões — 0030

Data: 22/10/2026. Base: `e484cd3` (`origin/develop`). Issue: [#174](https://github.com/SamiaLuvanice/bestprice/issues/174).

Encerramento: [PR #175](https://github.com/SamiaLuvanice/bestprice/pull/175)
integrada em `develop` em 22/10/2026 às 19:37:03 UTC, merge `5219077`;
Issue #174 fechada. QA independente aceitou AC01–AC11 sem bloqueios após conferir
código, documentação, capturas e os resultados das rodadas de 128 e 40 casos,
sem repetir as suítes aprovadas. Isso não amplia os limites de validação abaixo.
A galeria e as evidências foram preservadas no checkout principal em
`frontend/playwright-report/spec-0030-delivery/comparison.html`, fora das
worktrees; a limpeza aguarda integração do encerramento documental da Issue #176.

## Inventário real

| Superfície | Componentes e estados inspecionados | Tratamento |
|---|---|---|
| `/` pública | LandingPage; navegação desktop/menu móvel; CTAs; imagens ilustrativas | Título neutro, ritmo de seções, sequência discreta, superfície de alerta consistente; correção Escape/saída de foco |
| `/login` | LoginForm; e-mail, senha, visibilidade, validação, credenciais inválidas, envio | Coluna de leitura mais contida, título proporcional e campos sem sombra redundante; foto e controles preservados |
| `/` autenticada | AccountArea; HeroTrackForm, SummaryIndicators, OpportunityList, RecentUpdatesTimeline | Entrada em duas colunas no desktop; números acima dos rótulos; divisores suaves; lista sem contêiner extra |
| `/produtos` | TrackedProductsTable/Row, RowActionsMenu; expansão de formulário, paginação, flags de consulta | Cabeçalhos mais legíveis, números tabulares, hover da linha; linha compacta móvel preservada |
| `/produtos/:id` | ProductDetailDialog, TargetForm, PriceHistoryChart; preço ausente, título longo, consulta, alerta, interrupção | Identificador técnico após título, preço e subtítulos proporcionais, painel de alerta com superfície coerente; gráfico/tabela e ações preservados |
| `/alertas` | ConfiguredAlerts, AlertsSection; ativo/pausado, lida/não lida, erro, paginação | Hierarquia e espaçamento comuns; estado de leitura com texto e superfície; controles comuns |
| rota desconhecida | NotFoundPage; recuperação pública/autenticada | Título com escala consistente; ações com padrões comuns; curva original preservada |
| Transversal | AppHeader, Brand, AccountMenu, NotificationBell, ConfirmStopDialog | Seleção de navegação, hover, foco de botões, margem de rolagem, espaço para safe area no rodapé móvel |
| Estados | Sessão pendente/indisponível; dashboard vazio/erro/carregando; feedback de formulário/linha; imagens e histórico ausentes | Sem esconder mensagens, falsificar sucesso ou preencher dados; shimmer estático com movimento reduzido; bordas e tipografia comuns |

Não há rotas de cadastro, recuperação de senha, perfil ou configurações. Não foram criadas.

## Achados priorizados

| Prioridade | Evidência anterior | Decisão implementada |
|---|---|---|
| P0 | Nenhum bloqueio crítico demonstrado na amostra inicial. 15 verificações Playwright passaram em desktop e casos móveis específicos. | Não atribuir criticidade sem reprodução. |
| P1 | Menu público não respondia a Escape e permanecia aberto ao mover foco ao conteúdo. Dois testes novos falharam precisamente nesses caminhos. | Fechar com Escape e devolver foco ao gatilho; fechar ao sair do cabeçalho. Sete testes da landing passaram após correção. |
| P1 | Hover de navegação/conta/sino usava o mesmo branco do fundo; foco do Button combinava regras globais e ring utilitário. | Hover com superfície neutra, seleção rosa clara e anel de foco explícito. |
| P2 | Painel em desktop empilhava introdução ampla, formulário de largura inteira e resumo; indicadores alternavam alinhamento em linha/coluna por largura. | Introdução ao lado da entrada em desktop; empilhamento em tablet/mobile; número/rótulo organizados verticalmente. |
| P2 | Título de detalhe precedido por identificador em caixa alta/rosa; preço com até 62 px, subtítulos de 27 px e cabeçalhos de tabela de 12 px. | Nome do anúncio primeiro; identificador secundário; escala moderada de preço/subtítulos; tabela em 13 px e números tabulares. |
| P2 | Borda e superfície competiam no formulário e painel de alerta; vazios tinham caixa pontilhada adicional. | Superfície única para os formulários; vazio integrado com divisor simples; bordas suaves nas listas. |
| P2 | Landing destacava frase inteira em rosa e números do processo em 42 px; login com campos largos e título de até 43 px. | Ação verde como destaque principal, rosa em acentos/foco; sequência menor; formulário de login mais contido com título até 38 px. |
| P3 | `transition-all` no componente de botão; tempos sem token; proteção de scroll focava apenas títulos e não reservava safe area na página. | Transições só de cor/borda com tokens; scroll-padding superior/inferior; reserva móvel com safe area; movimento reduzido sem transição ou shimmer. |

## Comparação das referências

**Sistema atual:** as specs 0027–0029 já implementam as rotas, shadcn/ui, gráfico lazy e estados robustos. O trabalho reutiliza seus componentes e mantém todos os handlers de API. O sistema oficial governa logo, fonte SF Pro/Helvetica, tema claro e paleta. A pesquisa local ui-ux-pro-max sugeriu outro tema/fontes/vidro, que não foram adotados por conflitarem com a identidade solicitada; a orientação específica de foco e rolagem foi aplicada.

**Figma:** [arquivo fornecido](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice?node-id=6-83). O conector falhou com autenticação/UNAUTHORIZED; o Chrome abriu o arquivo. Foram observadas a página desktop com oito quadros, a página mobile com sete quadros e a composição ampliada de Início desktop. As exportações locais de 21/10/2026 complementam a análise de landing, login, produtos, detalhe, alertas e estados. São referências de composição, não dados para a conta. Permanecem as artes originais, gráfico escuro, linhas de produtos e navegação curta. A divisão do hero no desktop e os indicadores verticais são adaptações à leitura da aplicação real, não cópia literal do protótipo. Não foi feita auditoria programática de todas as propriedades do arquivo remoto.

**Spartan AI:** [referência externa](https://spartanai.framer.website/), consultada por web e observada no Chrome. Inspira contraste de hierarquia, ritmo entre capítulos e clareza de ação. Não foram importados seus ativos, conteúdo, métricas, estrutura comercial, gradientes ou animações.

## Design system e arquitetura

Correção de revisão (AC11 / PR #175): o banner final agora mostra o arquivo
original de 1600 × 548 px na proporção natural, sem altura fixa ou `cover`.
O limite já existente na arte permanece, sem inventar pixels do telefone. Texto
ocupa a área livre à esquerda no desktop e se empilha com a arte até 959 px.
O rodapé público usa o novo token `--color-footer-bg: #000`, texto branco e link
verde em toda a largura. A marca única do login fica acima do formulário na
coluna direita do desktop e permanece no móvel; o PNG não foi editado, seu fundo
CSS é transparente e `LoginVisual` é decorativo. A instrução de revisão
substitui a posição anterior da marca na fotografia. Os três sintomas tiveram
Red demonstrado; 40 casos afetados passaram na confirmação final. A rodada de
128 casos pertence à implementação anterior à correção.

Nenhuma dependência ou fonte nova. Além do token preto do rodapé adicionado na revisão, a paleta permanece. Tokens de espaçamento 48/64 px e movimento 160 ms/curva de saída foram registrados antes de uso. A largura comum, logo Brand, alvos de 44 px e limites semânticos permanecem. Estilos foram alterados nas regras existentes, sem folha adicional de overrides. Duas divisões no formulário separam introdução e entrada sem duplicar lógica. O campo permanece com estado local; o gráfico continua importado sob demanda. Não se afirma ganho de desempenho sem medição comparativa.

## Arquivos alterados

- `frontend/src/styles.css`: tokens, layout, navegação, foco, listas, preço, login, 404 e movimento reduzido.
- `frontend/src/components/ui/button.tsx`: transição limitada a cores.
- `frontend/src/LoginForm.tsx` e `LoginForm.test.tsx`: marca única no formulário e fotografia decorativa, com testes acessíveis atualizados.
- `frontend/tests/visual/review-corrections.spec.ts`: proporção do banner, rodapé preto e localização/transparência da marca em quatro larguras.
- `frontend/src/dashboard/HeroTrackForm.tsx`: agrupamento de introdução e formulário.
- `frontend/src/dashboard/ProductDetailDialog.tsx`: identificador secundário após título.
- `frontend/src/landing/LandingPage.tsx`, `LandingPage.css` e `LandingPage.test.tsx`: menu acessível, composição e regressões.
- `frontend/tests/visual/interaction.spec.ts`: teclado, saída de foco e movimento reduzido no navegador.
- `frontend/tests/visual/__screenshots__/viewport-{320,390,768,1280}/public-pages.spec.ts/`: 24 capturas revisadas de landing/login/404 com preferência light/dark.
- `designsystem/README.md`, `docs/apps/frontend.md`, `docs/PROGRESS.md`, `docs/LEARNINGS.md` e documentos da spec 0030: decisões, auditoria, evidências, comportamento visual e aprendizado de navegação por foco.

## Limites de validação

Os testes de navegador usam API simulada e Chrome desktop com viewports emulados. Não comprovam dispositivo físico, leitor de tela, Safari/Firefox nem integração real Mercado Livre. A disponibilidade operacional da API continua na Issue #127. Revisão independente e aceite final concluídos sem bloqueios; integração em develop confirmada na PR #175. Este encerramento não promove release ou stage.
