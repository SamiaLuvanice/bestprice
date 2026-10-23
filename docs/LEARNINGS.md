# Aprendizados

As decisões ativas ficam em `.agents/`, no [contexto do produto](product-context.md), `README.md` e nas specs em `specs/`.

## 2026-10-23 — Distinguir anúncio selecionado do ID do catálogo

**Contexto:** um link de produto do Mercado Livre identificava o catálogo no
caminho `/p/MLB…` e repetia o ID da publicação selecionada em
`pdp_filters=item_id:MLB…|item_id:MLB…`. O parser aceitava somente links diretos,
embora o filtro identificasse sem ambiguidade um anúncio.

**Princípio:** use o ID explícito da publicação selecionada, nunca o ID do
catálogo por coincidência de prefixo. Aceite repetições iguais como uma seleção;
recuse IDs conflitantes e dados malformados antes de qualquer chamada externa.
Continue analisando a URL localmente e consulte somente o host oficial fixo pelo
ID validado.

**Anti-pattern:** extrair o primeiro `MLB…` de uma URL de catálogo ou requisitar a
URL recebida para descobrir qual anúncio ela representa.

**Referências:** [Issue #180](https://github.com/SamiaLuvanice/bestprice/issues/180),
[spec 0031](../specs/0031-link-catalogo-publicacao/spec.md) e
`backend/app/marketplace/url.py`.

## 2026-10-22 — Conferir o ativo original antes de corrigir seu enquadramento

**Contexto:** na revisão da spec 0030, o banner panorâmico de 1600 × 548 px
era recortado por altura fixa e `cover`; o fundo branco aparente da logo vinha
do CSS, embora o PNG original tivesse alpha. A orientação de revisão também
reposicionou a marca do login para a coluna do formulário.

**Princípio:** compare as dimensões e a transparência do ativo com as regras do
contêiner antes de editar a imagem. Preserve a proporção quando a composição
inteira importa, adapte texto e arte à largura disponível e distinga recorte CSS
dos limites que já existem no arquivo. Ao mover uma marca informativa, preserve
uma única instância acessível e trate a fotografia de apoio como decorativa.

**Anti-pattern:** recriar pixels ausentes do arquivo original, editar um PNG para
corrigir fundo aplicado por CSS, ou manter uma marca sobreposta redundante após
mudar sua localização.

**Referências:** [PR #175](https://github.com/SamiaLuvanice/bestprice/pull/175),
[AC11 da spec 0030](../specs/0030-experiencia-visual-consistente/spec.md),
`frontend/src/LoginForm.tsx` e `frontend/src/landing/LandingPage.css`.

## 2026-10-22 — Recolher menus sem perder o caminho do foco

**Contexto:** a auditoria da spec 0030 demonstrou que o menu móvel público não
fechava com Escape nem ao mover o foco para o conteúdo. Os dois caminhos tiveram
falhas de regressão reproduzidas antes da correção. No teste de senha, o controle
existente já tinha nome estável “Mostrar senha” e estado em `aria-pressed`.

**Princípio:** Escape deve recolher a navegação expandida e devolver foco ao
gatilho. Ao sair da região do menu por Tab, recolha-o preservando o novo destino
do foco; considere a região inteira ao tratar `blur`, para não fechar entre seus
controles. Verifique estado pelos atributos semânticos e preserve controles com
nome estável e `aria-pressed` quando esse é o contrato acessível existente.

**Anti-pattern:** esconder um elemento ainda focado, devolver foco ao gatilho
quando a pessoa já avançou ao conteúdo, ou alterar o nome do controle para atender
a uma assertiva que presumiu outro contrato.

**Referências:** [Issue #174](https://github.com/SamiaLuvanice/bestprice/issues/174),
[verificação 0030](../specs/0030-experiencia-visual-consistente/verification.md),
`frontend/src/landing/LandingPage.tsx`, `frontend/src/landing/LandingPage.test.tsx`
e `frontend/tests/visual/interaction.spec.ts`.

## 2026-10-22 — Compartilhar a marca e observar cada transição

**Contexto:** na spec 0029, as telas repetiam a mesma logo com fontes, pesos e
composições diferentes; o login estreito empilhava ícone e nome e os estados de
sessão exibiam só o ícone. A intermitência relatada não foi reproduzida.

**Princípio:** centralize a apresentação visual e acessível de uma marca usada
em várias superfícies. Em regressões de persistência, registre a observação
imediatamente após cada transição relevante, para que um estado posterior não
oculte uma falha temporária. Distinga correções comprovadas dos limites da
reprodução; capturas de viewport móvel não demonstram comportamento em aparelho
real ou em outro motor de navegador.

**Anti-pattern:** duplicar o conjunto de marca por tela, anunciar ícone e nome
separadamente, ou verificar apenas o estado final após várias navegações e
declarar resolvida uma falha intermitente não reproduzida.

**Referências:** [Issue #167](https://github.com/SamiaLuvanice/bestprice/issues/167),
[verificação 0029](../specs/0029-identidade-bestprice-consistente/verification.md),
`frontend/src/components/Brand.tsx` e `frontend/tests/visual/brand.spec.ts`.

## 2026-10-21 — Validar a composição de componentes com o CSS existente

**Contexto:** a migração visual da spec 0027 adicionou Tailwind v4 e componentes
oficiais shadcn/ui a uma SPA com CSS global. A auditoria encontrou texto rosa em
CTA verde, o wrapper de Table recortou um menu absoluto e `display: none` retirou
o e-mail do nome acessível da conta. Uma execução simultânea de ESLint e Playwright
falhou quando o diretório de resultados foi recriado.

**Princípio:** conferir o estilo computado e os estados abertos depois de integrar
componentes, incluindo contraste, foco e nome acessível. CSS global fora de layers
pode prevalecer sobre utilities; ações verdes precisam conservar texto preto.
`overflow-x: auto` também limita o overflow vertical: menus absolutos devem ficar
em um ancestral sem esse recorte ou usar portal. Texto oculto que identifica um
controle usa ocultação visual, preservando a árvore acessível. Diretórios gerados
por QA precisam ser ignorados também pelo lint, além do Git.

**Anti-pattern:** considerar o componente isolado como garantia de acessibilidade
na aplicação; verificar apenas menus fechados; esconder informação acessível com
`display: none`; incluir `test-results/` e `playwright-report/` na varredura de fontes.

**Referências:** [Issue #153](https://github.com/SamiaLuvanice/bestprice/issues/153),
[verificação 0027](../specs/0027-redesign-figma-shadcn/verification.md),
`frontend/src/components/ui/table.tsx`, `frontend/src/styles.css`,
`frontend/src/landing/LandingPage.css` e `frontend/eslint.config.js`.

## 2026-10-16 — O par literal stage ↔ develop é o único caminho isento do PR policy

**Contexto:** três PRs de sincronização/promoção (#87, #108 e #110) foram encerradas
sem merge. O conteúdo estava correto, mas o cabeçalho era uma branch auxiliar
(`chore/sync-*`, `chore/promocao-*`), que a política de PR trata pela regra genérica
de naming e reprovava. A PR #112, com head literal `stage` e base `develop`, passou
direto na política e integrou o histórico em minutos.

**Princípio:** sincronização reversa sem divergência usa a própria branch `stage` como
head da PR; a isenção de Issue, `Closes` e rodapés vale só para o par literal
`stage` → `develop` / `develop` → `stage`. Branch temporária é recurso de recuperação
quando há divergência, não o caminho padrão. Como o check obrigatório é avaliado pelo
nome no SHA, um run antigo de `push` falho no mesmo SHA da PR continua bloqueando o
merge: resolva com `gh run rerun <id> --failed` antes de criar outra branch.

**Anti-pattern:** criar branch auxiliar e Issue nova para uma sync sem divergência,
contornando a regra que já isenta o fluxo, e tentar reabrir a PR com outro nome de
branch em vez de ler a política (`.github/scripts/policy.cjs`).

**Referências:** `.github/scripts/policy.cjs`, `.github/workflows/ci.yml`,
PRs [#87](https://github.com/SamiaLuvanice/bestprice/pull/87),
[#108](https://github.com/SamiaLuvanice/bestprice/pull/108),
[#110](https://github.com/SamiaLuvanice/bestprice/pull/110) e
[#112](https://github.com/SamiaLuvanice/bestprice/pull/112),
`docs/github-workflow.md`.

## 2026-10-14 — Testar o comando de entrada no contrato do provedor

**Contexto:** o primeiro deploy da API da spec 0018 no Render falhou antes da
migration. O `dockerCommand` continha `sh -c` e uma expressão com `&&`; o log
mostrou que a expressão inteira foi tratada como um comando inexistente. Os
testes locais do Compose e o CI não exercitavam esse ponto de entrada do Render.

**Princípio:** quando o provedor recebe um comando Docker próprio, use um
executável explícito na imagem para sequências de inicialização. Verifique que o
Blueprint aponta para ele, que a imagem o contém e que uma falha na migration
impede a subida do servidor. Confirme o resultado nos logs do deploy real.

**Anti-pattern:** colocar uma expressão de shell complexa diretamente em
`dockerCommand` e considerar o start validado apenas porque o Compose local ou
o build passou.

**Referências:** Issue #60, PR #62 (`3e18697`), `render.yaml`,
`backend/Dockerfile`, `backend/start-stage.sh`,
`backend/tests/test_stage_start.py` e
`specs/0018-backend-stage-render-supabase/verification.md`.

## 2026-10-13 — Medir contraste do vidro no pior fundo

**Contexto:** no QA da spec 0015, o rosa escuro passava sobre a cor base do menu,
mas caía para 4,07:1 quando a transparência do vidro era composta sobre branco.

**Princípio:** calcular o contraste do texto sobre o pior fundo possível atrás de
uma superfície translúcida, inclusive sem `backdrop-filter`. A base escura ajustada
compõe `#262628` no pior caso e mantém 4,66:1 para o rosa.

**Anti-pattern:** medir somente os tokens opacos e assumir que o vidro herda o
mesmo contraste em qualquer sobreposição.

**Referências:** spec 0015 AC03, `frontend/src/styles.css` e
`designsystem/README.md`.

## 2026-10-13 — Fixar inventário e precedência antes do redesign

**Contexto:** a revisão documental da spec 0015 encontrou um plano que adiava a lista
de arquivos para a implementação e citava referências com tokens diferentes sem
definir qual prevalecia.

**Princípio:** inspecionar e fixar a revisão base, as superfícies, os estados e os arquivos
no plano. Definir a precedência das referências e registrar adaptações ao design system.
Manter requisitos responsivos e funcionais das specs anteriores explicitamente.

**Anti-pattern:** definir o aceite pelo que restar na interface ao final da implementação,
ou combinar tokens conflitantes de protótipos sem uma decisão documentada.

**Referências:** spec 0015, tarefas T01/T02, `.agents/rules/frontend.md` e
`specs/0015-redesign-design-system-oficial/verification.md`.

## 2026-10-09 — Serializar a decisão antes da notificação

**Contexto:** duas sessões PostgreSQL avaliavam o mesmo alerta como ainda não
notificado. A restrição única impedia a segunda linha, mas uma transação
terminava com `IntegrityError`. Edições concorrentes de alvos diferentes
também perdiam uma revisão. Interromper um vínculo ao mesmo tempo que o alerta
era habilitado podia deixar o vínculo inativo com o alerta habilitado.

**Princípio:** bloqueie a linha que guarda o estado da decisão antes de lê-lo
ou alterá-lo, e recarregue valores após esperar a trava. Mantenha a restrição
única como proteção final, não como fluxo normal de concorrência. Quando a
decisão depende da atividade do vínculo, trave e releia esse vínculo antes de
editar ou interromper o alerta.

**Anti-pattern:** depender apenas da unicidade da notificação, travar o alerta
somente depois de calcular uma nova revisão ou consultar o vínculo sem trava
antes de uma alteração que depende de `active`.

**Referências:** `backend/app/products/alerts.py`,
`backend/app/products/routes.py`,
`backend/tests/test_alert_concurrency_integration.py` e AC-021.

## 2026-10-09 — Levar falhas anteriores ao HTTP pela regra de tentativa

**Contexto:** a obtenção do token da conta operadora podia falhar antes da
requisição ao anúncio. A rota devolvia o erro, mas não atualizava a última
tentativa da publicação. Após `not_found`, uma falha transitória também
reduzia a próxima janela para cerca de uma hora.

**Princípio:** erros da fronteira de integração devem atravessar a mesma regra
transacional de estado, inclusive quando ocorrem ao preparar credenciais.
Regras de intervalo ligadas ao estado persistido precisam sobreviver a falhas
posteriores que não confirmam mudança desse estado.

**Anti-pattern:** converter erro da integração em erro HTTP antes do serviço de
domínio registrar a tentativa; calcular backoff isolado sem considerar o
estado `not_found` ainda vigente.

**Referências:** `backend/app/products/routes.py`,
`backend/app/products/service.py`, `backend/tests/test_product_lifecycle.py`
e `backend/tests/test_refresh_http.py`.

## 2026-10-09 — Testar a ordem de desempate com entradas invertidas

**Contexto:** oportunidades de mesma queda percentual herdavam a ordem dos
vínculos, embora a spec exigisse priorizar a mudança mais recente.

**Princípio:** para verificar ordenação, construa um caso em que a ordem de
entrada e a ordem esperada divergem. Normalize instantes UTC antes de comparar
e use um identificador estável como último desempate.

**Anti-pattern:** testar só a chave principal de ordenação ou aceitar a ordem
incidental da consulta anterior.

**Referências:** `backend/app/products/routes.py`,
`backend/tests/test_dashboard_metrics.py` e AC-020 da spec 0013.

## 2026-10-09 — Compartilhar a janela de atualidade entre leitura e decisão

**Contexto:** na spec 0013, cartões usavam `MONITOR_FRESHNESS_SECONDS`, mas
alertas ainda tinham uma hora fixa. Um preço de 11 minutos era mostrado como
`stale` com janela de 10 minutos e mesmo assim gerava notificação.

**Princípio:** todas as decisões que dependem de preço atual devem usar a mesma
janela operacional. Teste o limite pela resposta HTTP e pelo efeito persistido.

**Anti-pattern:** atualizar apenas a exibição de `stale` ao tornar o frescor
configurável, deixando alertas ou indicadores com uma constante antiga.

**Referências:** `backend/app/products/service.py`,
`backend/app/products/alerts.py`, `backend/tests/test_alert_http.py` e AC-010.

## 2026-10-09 — Resolver estados locais antes de inicializar a integração

**Contexto:** na spec 0013, a dependência FastAPI obtinha um token externo antes
de validar a URL ou procurar um vínculo existente. Com a integração desligada,
o cadastro retornava 503 até para URL inválida, duplicação ou retomada.

**Princípio:** em operações com fonte externa, conclua as decisões locais que
independem dela antes de inicializar credenciais ou fazer HTTP. Teste o
contrato também com a integração indisponível.

**Anti-pattern:** usar uma dependência com efeito externo antecipado quando a
rota ainda pode responder por validação ou estado persistido.

**Referências:** `specs/0013-monitoramento-mercado-livre-brasil/spec.md`
(AC-022), `backend/app/products/routes.py` e `backend/tests/test_tracking_http.py`.

## 2026-10-07 — Distinguir visão de produto de funcionalidades entregues

**Contexto:** o responsável definiu o BestPrice como produto real de monitoramento automático da Amazon por URL; o checkout ainda contém apenas a base de comunicação entre frontend, API e banco.

**Princípio:** preservar o fluxo de entrada apenas por URL nas futuras specs e registrar a visão de produção em uma referência de produto. Documentação técnica deve distinguir explicitamente capacidades existentes, requisitos futuros e decisões pendentes.

**Anti-pattern:** tratar a base atual como produto pronto, exigir cadastro manual de dados obtidos pela integração ou documentar ORM, autenticação e deploy como existentes antes de implementá-los.

**Referências:** [contexto do produto](product-context.md), [arquitetura](architecture.md) e [regra de workspace](../.agents/rules/workspace.md).

## 2026-10-07 — Manter o índice alinhado aos documentos ativos

**Contexto:** uma revisão encontrou links de onboarding para documentos que não
fazem parte da documentação atual do projeto.

**Princípio:** confira se cada destino existe no checkout e atualize o índice na
mesma mudança que remove ou substitui um documento.

**Anti-pattern:** deixar links para materiais retirados ou fora do escopo atual.

**Referências:** `docs/index.md` e a revisão da documentação de onboarding.

## 2026-10-06 — Separar CI de automações com permissão de escrita

CI de PR usa permissões de leitura e nenhum secret. A sincronização do Project
usa somente metadados atuais e código da branch padrão; publicação ocorre na
`main` após os gates. Project e deploy só devem ser considerados ativos quando
há evidência de execução real.

## 2026-10-06 — Validar a base depois da migração de stack

Ao trocar a stack, a configuração ativa precisa apontar para FastAPI, React e
PostgreSQL em todos os pontos: regras, skills, gates, documentação, Compose e
workflows. As instruções e os links publicados devem corresponder aos arquivos
e ferramentas que fazem parte do projeto naquele momento.

## 2026-10-13 — Confirmar custo no workspace, além do plano do serviço

**Contexto:** a spec 0018 exige stage sem cobrança. A documentação do Render informa
que serviços web `free` ainda podem gerar cobrança por banda de saída e minutos de
build excedentes quando o workspace tem forma de pagamento.

**Princípio:** para afirmar custo zero, confira também a configuração de cobrança do
workspace e o tratamento de cada cota; registre o resultado observado no painel.

**Anti-pattern:** concluir que `plan: free` sozinho impede qualquer cobrança.

**Referências:** Issue #60, `render.yaml`,
[limites do Render Free](https://render.com/docs/free).
