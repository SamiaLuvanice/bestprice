# BestPrice AI — auditoria e preparação do redesign no Paper

Data: 27/10/2026, America/Sao_Paulo. Ferramenta: Codex, inspeção do repositório e MCP.
Escopo: design e documentação; frontend e backend não foram alterados.
Referências relacionadas: specs 0015, 0027, 0028, 0030 e 0034; este documento não altera seus status nem autoriza implementação.

## Estado da entrega

Auditoria de identidade, inventário de rotas e preparação de handoff realizados.
**O redesign completo não foi criado e não está pronto para aprovação visual.**

O MCP do Paper respondeu a `get_basic_info`. O arquivo ativo é
[BestPriceIA](https://app.paper.design/file/01M5QGGQ263CSRSWKR4G7FSXDR/p-1-0).
Possui seis artboards existentes: três direções de dashboard desktop 1440 × 960 e
suas três versões mobile 390 px. Esses quadros são anteriores a esta auditoria.
Não foram criados, alterados ou revisados visualmente nesta sessão.

Ao consultar a seleção, o Paper retornou:

> Weekly MCP limit reached. It resets in 3 days.

A conexão está válida, mas a cota impede prosseguir com o trabalho de canvas nesta
sessão. Nenhum arquivo novo, página ou layout foi criado. Não foi possível testar
a edição, obter capturas para revisão ou entregar o documento solicitado
**BestPrice AI — Complete Product Experience**. `finish_working_on_nodes` retornou OK.
O limite é do serviço Paper, não uma solicitação de permissão do sistema local.
Não houve tentativa de contornar a cota ou alterar o plano da conta.

Configuração encontrada: `.agents/mcp.json`, servidor `paper`, endpoint
`http://127.0.0.1:29979/mcp`. Ferramentas expostas incluem criação de arquivo,
páginas, artboards, tokens, HTML editável, estilos, duplicação, capturas e exportação.
Disponibilidade no catálogo não comprova execução de uma operação de escrita.

## Fontes e precedência

1. Pedido atual: preservar identidade, criar no Paper, consultar Figma somente como referência e não implementar.
2. `designsystem/index.html`: identidade oficial.
3. `designsystem/brand-spec.md`, `agent-guidelines.md` e `.agents/rules/frontend.md`.
4. `designsystem/README.md`: decisões e extensões já documentadas.
5. `frontend/src/styles.css`, `components/Brand.tsx`, telas e roteamento atuais.
6. Export local anterior: `designsystem/prototypes/2026-10-21-bestprice-figma/`.
7. Três imagens anexadas: somente composição, escala, profundidade e linguagem de interação.

O README registra que a direção A, **Conversa em primeiro plano**, foi escolhida em
26/10/2026. Isso é evidência de uma decisão anterior documentada, não uma nova
aprovação do redesign completo. A regra de três direções da skill huashu-design
dispensa nova seleção em iterações de uma direção já escolhida no mesmo projeto.
Preservar essa base; os estudos B/C existentes não autorizam trocar a direção.

## Identidade auditada

| Papel | Referência oficial | Código atual | Aplicação no redesign |
|---|---|---|---|
| Fundo | `--bg: #FFFFFF` | `--background: #FFFFFF` | Base clara |
| Superfície | `--surface: #F5F5F7` | `--card`, `--muted`, `--color-surface` | Painéis e agrupamentos |
| Superfície elevada | `#FBFBFD` | `--color-surface-raised` | Variação neutra existente |
| Texto | `--fg: #1D1D1F` | `--foreground`, `--color-text` | Títulos e corpo |
| Texto de apoio | `--fg-2: #424245` | Varia por componente | Hierarquia secundária |
| Texto secundário | `--muted: #6E6E73` | `--muted-foreground: #626267` | Diferença documentada; preferir a aplicação para componentes reaproveitados |
| Borda | `--border: #D2D2D7` | `--border`, `--color-border` | Separadores |
| Borda suave | `#E8E8ED` | `--color-border-soft` | Divisões discretas |
| Borda de campo | Metadados `#86868B` | `--input: #86868B` | Contorno de controles; não confundir com borda suave |
| Ação principal | `--accent: #39FF14` | `--action`, `--color-action` | Botão com texto preto |
| Hover de ação | Mistura do verde com branco | `--action-hover: #65FF48` | Usar variante já implementada |
| Links/foco | `--accent-ink: #C7005E` | `--primary`, `--ring`, `--color-brand` | Rosa legível no claro |
| Superfície rosa | Derivada do rosa | `--accent: #FCE9F2` | Navegação selecionada |
| Rosa no escuro | `#FF3EA5` | Extensão documentada | Apenas superfícies escuras apropriadas |
| Queda de preço | `--success: #16A34A`, tinta derivada | `--color-down: #146C38` | Cor semântica de leitura, acompanhada de texto |
| Alerta | `--warn: #EAB308`, tinta derivada | `--color-amber: #925400` | Não usar amarelo claro como texto |
| Erro | `--danger: #DC2626`, tinta derivada | `--destructive: #B42318`, texto `#A61B1B` | Preservar papéis distintos |
| Capítulo/rodapé | `#000000` | `--color-footer-bg` | Uso pontual; aplicação permanece clara |
| Gráfico | Extensão anterior | `#18171B`, grade `#49474F`, rótulos `#D2D2D7` | Histórico de preços |

**Atenção à nomenclatura:** `--accent` no catálogo significa verde de ação;
`--accent` no tema shadcn atual significa superfície rosa. O tema usa `--primary`
para rosa e `--action` para verde. Mapear por função, nunca somente pelo nome.
O verde vivo não é uma paleta nova extraída das referências: ele já é oficial.
Não recolorir a logo para fazê-la coincidir com um único token sólido.

O Paper existente expõe as mesmas cores centrais: branco, superfície, tinta, borda,
rosa e verde. Usa `--color-muted: #6E6E73`, enquanto a SPA usa `#626267`.
A harmonização desse tom precisa ficar explícita no handoff; não trocar valores
silenciosamente no arquivo antigo.

### Conferência com o design anterior

Arquivo de referência:
[Figma BestPrice](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice).
Uma busca MCP por variáveis de cor BestPrice e estilo tipográfico não retornou
resultados. Isso não demonstra ausência de tokens no arquivo e não equivale a uma
auditoria visual ou leitura completa do Figma.

No export local `00-sistema-visual.svg`, foram encontrados `#FFFFFF`, `#F5F5F7`,
`#1D1D1F`, `#6E6E73`, `#D2D2D7`, `#39FF14`, `#C7005E`, além de tintas semânticas
como `#146C38` e `#925400`. As cores centrais desse export coincidem com o catálogo.
**Paridade com a versão atual ao vivo do Figma permanece não verificada.** Se a
consulta futura revelar divergência, apresentar os valores ao usuário antes de
adotar uma paleta final diferente da identidade estabelecida.

### Tipografia, logo e forma

- Display: SF Pro Display, fallback do sistema/Helvetica Neue/Arial/sans-serif.
- Corpo: SF Pro Text, fallback do sistema/Helvetica Neue/Arial/sans-serif.
- Catálogo: 12, 14, 17, 21, 28, 40, 56 e 80 px; corpo 17 px, entrelinha 1,47.
- Direção A documentada: título desktop 48/54 px, mobile 34/39 px; ações 48 px.
- Paper atual: família exibida como System Sans-Serif; token de corpo aponta para Arial.
- Confirmar as famílias e pesos disponíveis pelo MCP antes de escrever estilos tipográficos; Arial já faz parte do fallback autorizado.
- Não aplicar Inter Tight, Plus Jakarta Sans ou outra substituição tipográfica.
- Espaçamento: múltiplos de 4 px; valores oficiais 4/8/12/16/20/24/32/48 e extensão de 64 px.
- Raios: 8/12/18 px e pílula 980 px. Elevação discreta; vidro sempre com base sólida.
- Logo original `designsystem/logo-bestprice.png` inspecionada visualmente: símbolo verde/rosa, sem redesenho, recorte ou distorção.
- `Brand` usa imagem original e wordmark BestPrice. O sufixo AI é adjacente, não uma alteração do arquivo da marca.

## Direção visual para retomada

Registro editorial claro: grande pergunta de compra e composição assimétrica na
landing; conversa como centro da área autenticada. As imagens anexadas orientam
o contraste de escala, cards arredondados, espaço e profundidade, preservando a
paleta BestPrice. O assistente deve ter personalidade por composição e conteúdo,
sem copiar robôs, orbes, paleta roxa ou telas das referências.

Base: branco `#FFFFFF`, superfície `#F5F5F7`, tinta `#1D1D1F`, borda `#D2D2D7`,
ação `#39FF14`/preto, leitura e foco `#C7005E`. Hero até 80 px no desktop, títulos
de aplicação 48/54 px e 34/39 px mobile, corpo 17 px. Escala espacial de 4 px.
Usar a tipografia atual e a direção A já documentada.

O catálogo ui-ux-pro-max retornou padrão Hero + Features + CTA e Glassmorphism.
Sua sugestão genérica de azul/laranja e Plus Jakarta Sans foi descartada por
conflitar com a identidade fornecida. Vidro fica restrito a uma aplicação sutil
com contraste e fallback; não define o conjunto da interface.

## Inventário de rotas solicitado

Todas as telas abaixo precisam de layout em 1440, 768 e 390 px. São **42 layouts
base planejados**, sem contar variantes e rotas adicionais. Nenhum foi criado
nesta sessão. O inventário é resultado de inspeção estática, sem validação no browser.

| Rota | Situação no código | Conteúdo e estados a representar |
|---|---|---|
| `/` | Landing por retorno antecipado em AppRoutes | Header, hero, demo identificada, benefícios, processo, comparador, categorias, recursos, CTA e footer |
| `/como-funciona` | Nova; atual é âncora `/#como-funciona` | Jornada completa e limites da IA; propor página sem perder a âncora |
| `/login` | Existente | Formulário, validação, envio, credenciais inválidas, indisponibilidade e retorno ao destino |
| `/register` | Nova | Cadastro proposto; sucesso, erros e política de senha dependem de contrato futuro |
| `/forgot-password` | Nova | Recuperação proposta; mensagem neutra, envio, erro e confirmação; contrato futuro |
| `/app/dashboard` | Existente | Pergunta principal, categorias, pesquisas recentes, comparações e status do monitoramento |
| `/app/assistant` | Existente | Nova conversa, sugestões, informações antes do envio e IA indisponível |
| `/app/assistant/:id` | Existente por correspondência de rota | Conversa, recomendações não verificadas, loading, erro, limite e expiração |
| `/app/compare` | Existente | Vazio e inclusão de até três produtos com informações fornecidas pela pessoa |
| `/app/compare/:id` | Existente por correspondência de rota | Tabela, lacunas, prós/contras, análise, salvar e erro/conflito |
| `/app/history` | Existente | Busca, filtros, tipos, resultados, vazio, erro e confirmação de exclusão |
| `/app/monitoring` | Existente, reutiliza AccountArea | Produtos, cadastro por URL Mercado Livre, ausência de integração e consulta com dados disponíveis |
| `/app/monitoring/:id` | Existente, com segmentos especiais abaixo | Detalhe, preço/histórico quando disponível, gráfico, alertas e falhas |
| `/app/settings` | Nova; hoje cai em página não encontrada interna | Perfil, preferências, tema, notificações, segurança e informações da IA; controles propostos |

### Rotas e casos adicionais encontrados

| Rota/caso | Evidência atual | Incorporação proposta |
|---|---|---|
| `/app` | Redireciona autenticado ao dashboard | Anotar no fluxo; reutilizar layout de destino |
| `/produtos` | AccountArea legado | Quadro de compatibilidade usando a mesma lista de monitoramento |
| `/produtos/:id` | Detalhe legado | Mesmo componente de detalhe com destinos legados preservados até uma futura decisão de migração |
| `/alertas` | Alertas legados | Tela própria de alertas no conjunto de monitoramento |
| `/app/monitoring/overview` | Tratado por AccountArea como visão geral | Quadro de visão geral e documentação do segmento reservado |
| `/app/monitoring/alerts` | Tratado por AccountArea como alertas | Quadro de alertas; segmento reservado, não ID de produto |
| `*` e caminhos `/app/*` desconhecidos | Fallbacks existentes | 404 pública/autenticada com retorno adequado |
| Verificação da sessão | Estado transversal fora da landing | Carregando, indisponível, tentar novamente e sessão expirada |

Os segmentos `overview` e `alerts` chegam à AccountArea pela expressão que aceita
um segmento após `/app/monitoring`; documentar sua precedência em relação ao ID.
Não criar redirecionamentos nem mudar o router nesta etapa.

## Organização do documento a criar

Documento desejado: **BestPrice AI — Complete Product Experience**. Preservar o
arquivo antigo; criar um novo documento quando a cota permitir. Reutilizar
fundamentos e direção A sem apagar os estudos anteriores.

| Área | Entrega planejada |
|---|---|
| 00 — Identidade visual existente | Auditoria, swatches, logo original, tipografia, fontes e divergências |
| 01 — Design System | Tokens nativos, biblioteca visual, variantes, estados e regras de tamanho |
| 02 — Landing Page | Landing completa e como funciona, com imagens e demonstração identificada |
| 03 — Autenticação | Login e propostas de cadastro/recuperação |
| 04 — Dashboard | Direção A ampliada com pesquisas e atalhos |
| 05 — Assistente IA | Inicial, conversa, recomendações, loading e erros |
| 06 — Comparador | Vazio, inclusão, três produtos, tabela e análise |
| 07 — Histórico | Conversas/comparações, busca, filtros e exclusão |
| 08 — Monitoramento | Lista, visão geral, detalhe, alertas e integração indisponível |
| 09 — Configurações | Perfil, preferências, tema, notificações e segurança propostos |
| 10 — Responsividade | Matriz 1440/768/390 e comportamentos compartilhados |
| 11 — Fluxos e interações | Destinos, estados, teclado, retorno e movimento |
| 12 — Developer Handoff | Correspondência React, valores, contratos pendentes e checklist |

## Handoff de componentes

| Elemento do design | Reuso no repositório | Orientação |
|---|---|---|
| Marca | `components/Brand.tsx` | Preservar imagem, proporção e nome acessível |
| Buttons | `components/ui/button.tsx` | Principal verde; link rosa; ocupado mantém foco |
| Inputs | `components/ui/input.tsx` | Label visível, dica e erro associados |
| Cards/badges | `components/ui/card.tsx`, `badge.tsx` | Evitar um card para cada linha de informação |
| Tables/charts | `components/ui/table.tsx`, `chart.tsx` | Tabela acessível equivalente e legenda; dados ausentes explícitos |
| Skeleton/separadores | `components/ui/skeleton.tsx`, `separator.tsx` | Respeitar movimento reduzido |
| Sidebar/topbar/mobile nav | ResearchLayout em `ResearchArea.tsx` | Extrair conceitualmente AppSidebar/AppTopbar, sem implementação agora |
| DashboardWelcome/AIQuickPrompt | DashboardPage em `ResearchArea.tsx` | Pergunta principal, orçamento/uso opcionais e atalhos editáveis |
| Chat e recomendações | `features/research/AssistantPage.tsx`, `common.tsx` | Planejar ChatHeader, MessageList, Composer e estados reutilizando o fluxo existente |
| Comparador | `features/research/ComparisonPage.tsx` | Até três produtos; informação ausente não vira especificação presumida |
| Histórico | `features/research/HistoryPage.tsx` | Manter busca, exclusão, expiração e tipos |
| Monitoramento | `dashboard/AccountArea.tsx` e componentes de dashboard | Reusar cadastro, produtos, detalhe, gráfico e alertas existentes |
| Login | `LoginForm.tsx` | Preservar contrato e retorno seguro ao destino |
| Dialogs/dropdowns | `dashboard/ConfirmStopDialog.tsx`, `AccountMenu.tsx` | Consultar padrões atuais de foco antes de planejar abstração compartilhada |
| Selects/textareas/tabs/tooltips/toasts | Sem arquivo dedicado correspondente em `components/ui/` | Biblioteca visual planejada; não presumir instalação ou contrato de componentes novos |
| Settings/register/recovery | Sem tela correspondente atual | Propostas de produto; não representar como recursos já operacionais |

Paper oferece HTML editável e clonagem de nós. Isso não comprova componentes
vinculados com propagação automática de variantes: verificar suporte antes de
prometer uma biblioteca com esse comportamento. Documentar o que for apenas
amostra/clonagem. Interações runtime não foram verificadas nesta sessão.

## Estados, responsividade e movimento planejados

- Desktop 1440: sidebar de referência 248 px, topbar 88 px; conteúdo com padding 48 × 56 px e intervalos 32 px, conforme direção A.
- Tablet 768: recolher sidebar em menu, reorganizar colunas e manter compositor amplo. É uma especificação proposta a validar visualmente.
- Mobile 390: padding 20 px, título 34/39 px; quatro destinos principais e menu para os demais; alvo mínimo 44 × 44 px, preferencialmente 48 px.
- Não reduzir o desktop proporcionalmente. Comparação vira leitura por critério/produto e pode oferecer rolagem horizontal sinalizada, preservando cabeçalhos e equivalência acessível.
- Prever nome longo, conteúdo extenso, ampliação de texto e largura mínima de 320 px em futura verificação.
- Representar loading, vazio após resposta válida, falha de rede, erro HTTP, integração não configurada, sessão expirada, limite da IA, conflito de edição, conteúdo expirado e confirmação de exclusão.
- Links/foco rosa; não codificar estados somente por cor. Foco não pode ficar coberto pelo compositor ou navegação.
- Movimento do catálogo: 150/220 ms; extensão atual documenta 160 ms para a duração curta. Mapear ao token real na implementação futura, sem literais conflitantes.
- Hover: mudança de cor/borda; pressão discreta; expansão com foco preservado; transição de rota não bloqueia leitura ou teclado.
- Loading da IA deve comunicar estado por texto, sem percentuais ou progresso inventado. Reduzir ou desativar shimmer/transições sob `prefers-reduced-motion`.
- Se o Paper não executar navegação/movimento, usar quadros antes/depois e anotações de gatilho, duração, destino e foco. Não anunciar protótipo funcional sem teste.

## Conteúdo e ativos

A landing terá as dez seções exigidas no pedido. A demonstração será identificada
como exemplo e não será apresentada como pesquisa real ou consulta a preços atuais.
Preparar notebook, smartphone, headphone e monitor com imagem apropriada ao contexto,
registrando origem, autorização/licença e tratamento. Nenhuma imagem nova de produto
foi obtida ou licenciada nesta auditoria. As artes locais existentes não equivalem
a um novo conjunto de fotos de produto com licença verificada.

Não inventar usuários, avaliações, parceiros, economia obtida, preço, estoque ou
características. O produto atual não faz busca autônoma de ofertas nem verificação
automática das informações da comparação. O conteúdo da IA é não verificado;
preservar os avisos e informações de processamento antes do envio. O histórico
atual tem retenção de 90 dias da criação; não comunicar armazenamento indefinido.
Monitoramento continua exclusivo do Mercado Livre nesta fase; não desenhar
integrações com outros marketplaces como disponíveis.

## Próximos passos e critérios ainda pendentes

1. Restabelecer a cota MCP do Paper e verificar leitura/escrita/captura.
2. Completar consulta ao design anterior ao vivo; resolver divergências se houver.
3. Criar documento e áreas acima, confirmar fontes, criar tokens e biblioteca editável.
4. Produzir landing completa, aplicação e autenticação na direção A preservada.
5. Completar 42 layouts base, rotas adicionais e variantes de estado.
6. Obter e registrar imagens de produto adequadas; compor sem alterar a marca.
7. Revisar cada seção por screenshot: ritmo, tipografia, contraste, alinhamento, corte e repetição; corrigir antes de avançar.
8. Revisar matriz de cobertura, anotações de fluxo, componentes e handoff final.
9. Apresentar o documento Paper ao usuário para aprovação antes de implementar.

Sem mudanças de código: testes de aplicação, build, TDD, PR e agente de
doc-sync-onboarding não se aplicam a esta entrega documental. Nenhum resultado
visual, aprovação, teste de acessibilidade ou recurso novo é declarado como concluído.
As alterações preexistentes no harness foram preservadas.
