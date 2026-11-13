# Progresso das specs

## 0058 — Harness agnóstico e verificável

**13/11/2026 — implementação entregue; aguarda revisão.** [Issue #322](https://github.com/SamiaLuvanice/bestprice/issues/322),
branch `feature/0058-issue-322-harness-agnostico`. Núcleo Node em `.agents/scripts/` (sync,
diagnose, gates, docs-impact, commit-msg) configurado por `harness.yaml` 0.4.0; hook
`commit-msg` e gitleaks; jobs CI `Commit policy` e `Secrets`; núcleo separado do perfil e
doc-sync condicional em regra única. Testes do harness 15/15, automações 50/50, actionlint
limpo, diagnóstico válido. Ver [verificação](../specs/0058-harness-agnostico/verification.md).

## 0057 — Limite de tentativas repetidas de login

**13/11/2026 — spec `implementada`.** A PR #315 foi integrada em `develop` (`df39589`). A
[Issue #128](https://github.com/SamiaLuvanice/bestprice/issues/128) limita falhas de
login em `login_failures` (migração `20261113loginfail`): 10 por origem + e-mail e 50
por origem em 15 minutos, ajustáveis por `LOGIN_RATE_LIMIT_*`. Acima do limite, a API
responde 429 `login_rate_limited` com `Retry-After`, antes de qualquer outra checagem e
mesmo com a senha correta, e a tela mostra "Muitas tentativas de login. Tente novamente
em N minutos.", mantendo o e-mail e apagando a senha. Toda falha de credencial custa um
scrypt, inclusive para e-mail sem conta, e o login passa a exigir JSON. Em
stage/production, a API não inicia sem `TRUSTED_PROXY_SECRET` e
`SIGNUP_SOURCE_HASH_SECRET`, mesmo com o cadastro desligado.

Backend: Ruff aprovado e pytest com PostgreSQL 17 descartável **547 passed, 2 skipped**
(80 `test_login_*`). Frontend: lint, `build:check` e Vitest 838/838. QA local com API,
SPA e PostgreSQL reais (sem Compose) aprovou AC01–AC17; AC10–AC12 só por teste. A
revisão independente foi feita (R1).

Promovida para Stage pela PR #318 (`0c80a94`), com segredos preenchidos no Render e no
Pages, migration aplicada, Blueprint sincronizado e health 200. A origem real atrás do
Pages foi verificada: falhas pelo Pages e direto no Render gravaram `source_hash`
distintos. Limites padrão confirmados pela responsável. O Figma ganhou os quadros do
estado de limite no login, desktop `291:514` e mobile `292:442`, com o mesmo alerta do
formulário. Ver
[verificação da spec 0057](../specs/0057-limite-tentativas-login/verification.md).

## 0056 — Monitoramento com textos enxutos

**12/11/2026 — spec `pronta`.** A
[Issue #311](https://github.com/SamiaLuvanice/bestprice/issues/311) remove quatro
frases do formulário e da lista. A busca no arquivo BestPrice IA pelo Chrome
retornou zero resultados para as frases. Passaram 826 testes Vitest com limite
de 30 segundos por teste, quatro verificações visuais em desktop e mobile,
50 testes Node, lint e `build:check`. Revisão e integração em `develop` estão pendentes.
[Verificação da spec 0056](../specs/0056-monitoramento-com-textos-enxutos/verification.md).

## 0055 — Teste estável de detalhe com preço desconhecido

**11/11/2026 — spec `pronta`.** O teste da
[Issue #247](https://github.com/SamiaLuvanice/bestprice/issues/247) aguarda as
atualizações do React e a importação do gráfico antes de verificar o detalhe.
A reprodução controlada falhou antes da correção e passou depois. Passaram
cinco rodadas completas com 826 testes Vitest cada, lint, `build:check` e
50 testes Node. A revisão do PR e a integração em `develop` estão pendentes.
[Verificação da spec 0055](../specs/0055-teste-preco-desconhecido-estavel/verification.md).

## 0054 — Teste estável de troca de conta

**11/11/2026 — spec `pronta`.** O teste de isolamento de rascunhos da
[Issue #296](https://github.com/SamiaLuvanice/bestprice/issues/296) agora
preenche as credenciais sem depender do foco. Passaram lint, build,
826 testes Vitest e 50 testes Node. Revisão e integração em `develop` estão pendentes.
[Verificação da spec 0054](../specs/0054-teste-troca-conta-estavel/verification.md).

## 0053 — Rotas durante a consulta de sessão

**11/11/2026 — spec `pronta`.** A [Issue #290](https://github.com/SamiaLuvanice/bestprice/issues/290)
tem correção local. O login conserva seu título durante a consulta de sessão e
o 404 público aparece mesmo com a API pendente ou indisponível. Passaram lint,
build, 826 testes Vitest e 50 testes Node. Revisão e integração estão pendentes.
[Verificação da spec 0053](../specs/0053-rotas-durante-consulta-sessao/verification.md).

## 0052 — Suíte visual estável para a landing pública

**10/11/2026 — spec `pronta`.** Implementação local da
[Issue #289](https://github.com/SamiaLuvanice/bestprice/issues/289) na branch
`feature/0052-issue-289-suite-visual-estavel`, com base em `d1da76e`.
A revisão e a integração em `develop` estão pendentes.

As capturas da landing simulam o cadastro desabilitado e aceitam até 12 pixels
divergentes em 320 e 390 px. O cenário A1 valida os limites do selo “menor preço”
em cinco larguras com uma única navegação. A suíte visual completa passou
em execução isolada, com **312 aprovados**, 449 exclusões por projeto e zero
falhas. Lint, build, **825 testes Vitest** e **50 testes Node** passaram.
[Verificação da spec 0052](../specs/0052-suite-visual-estavel/verification.md).

## 0051 — SEO técnico das páginas públicas

**10/11/2026: spec `implementada`.** [Issue #287](https://github.com/SamiaLuvanice/bestprice/issues/287) fechada;
PR [#288](https://github.com/SamiaLuvanice/bestprice/pull/288) integrada em `develop` (`0f0d154`) com CI verde,
depois da revisão independente e da QA. Conclusão registrada pela
[Issue #291](https://github.com/SamiaLuvanice/bestprice/issues/291).
Branch `feature/0051-issue-287-seo-tecnico-landing`, base origin/develop `4da00c3`.

O que entrou (só frontend, configuração estática do Cloudflare Pages e documentação):
- `robots.txt` (bloqueia `/app$`, `/app/`, `/produtos` e `/alertas`) e `sitemap.xml` com `/`
  e `/login`;
- 404 real no Pages: `404.html` gerado no build e reescritas 200 com destino `/` em
  `_redirects` (o destino `/index.html` virava 308 no preview); o Nginx local segue com 200;
- cache imutável em `/assets/*` (`_headers`);
- `index.html` com Open Graph/Twitter neutros, sem canonical nem `og:url`; canonical e
  descrição por rota no navegador (`src/seo/pageMeta.ts`), independentes da sessão;
- título da landing "Monitor de preços do Mercado Livre · BestPrice";
- `favicon.png` de 480 KiB para 1.621 bytes, `apple-touch-icon.png` e `og-image.png` gerados
  por `scripts/generate-brand-assets.mjs` (`sharp` como devDependency).

Após as correções da revisão: lint verde, Vitest **825/825** em 61 arquivos e
`npm run build:check` verde, com `dist/404.html` igual a `dist/index.html`. Detalhes, Red/Green
e desvios do plano na [verificação da 0051](../specs/0051-seo-tecnico-landing-publica/verification.md).

Na entrega da 0051, a responsável aceitou o merge com cinco falhas preexistentes
no AC11. A estabilização da suíte visual foi encaminhada à
[Issue #289](https://github.com/SamiaLuvanice/bestprice/issues/289) e validada
localmente na [spec 0052](../specs/0052-suite-visual-estavel/verification.md).

Imagem de compartilhamento e ícone aprovados pela responsável (AC08/AC09). Achados da QA
anteriores à spec na [Issue #290](https://github.com/SamiaLuvanice/bestprice/issues/290).
Borda conferida no preview do PR: rotas da SPA com e sem barra final em 200, inexistentes em
404, cache imutável só em `/assets/*`. Na QA, Acessibilidade 100 e peso de 757 para 280 KiB.
Promovida para stage pelo [PR #293](https://github.com/SamiaLuvanice/bestprice/pull/293) (`a59e912`). Em stage,
o 404 real, `robots.txt`, `sitemap.xml` e `og-image.png` foram conferidos. O Lighthouse mobile deu
SEO **100** (antes 92), Acessibilidade 100, LCP 3,9 s (antes 6,0 s) e 279 KiB. Registro da T10 pela
[Issue #294](https://github.com/SamiaLuvanice/bestprice/issues/294).

## 0050 — Landing pública nova conforme o Figma

**08/11/2026: spec `implementada`.** [Issue #275](https://github.com/SamiaLuvanice/bestprice/issues/275) fechada;
PR [#276](https://github.com/SamiaLuvanice/bestprice/pull/276) integrada em `develop` (`4d8c51b`) com CI verde,
depois da revisão independente e da QA. Conclusão registrada pela
[Issue #277](https://github.com/SamiaLuvanice/bestprice/issues/277).

O que entrou:
- A landing em `/` segue os quadros 238:294, 239:180 e 239:856 do Figma, com o robô como
  narrador. São nove seções, mais a barra fixa no mobile, o menu em Sheet, a FAQ em acordeão
  e o mini-robô de rolagem a partir de 768 px.
- O link colado no hero passa por Entrar ou Criar conta e chega ao monitoramento já
  preenchido. Ele fica só na aba (`sessionStorage`), nunca vai na URL e nada é criado sem
  confirmação.
- Movimento conforme as notas do Figma, sem biblioteca nova. Com movimento reduzido, tudo
  aparece no estado final.
- Snapshots de textos e medidas do Figma, conferidos por hash e cobertos por testes. Robô em
  WebP de 22 KB.
- Saíram da landing de propósito "Começar com IA", "Abrir comparador" e "Criar conta" no
  cabeçalho.
- Com sessão, `/login` e `/cadastro` respeitam o `returnTo` seguro.

Divergências do Figma aprovadas pela responsável em 08/11/2026 (logo de 34 px, título do hero
sem fade, cabeçalho não fixo, textos por token, selo "Só o link, nada para preencher") e as
referências visuais da landing regravadas com aprovação estão registradas na
[verificação da 0050](../specs/0050-landing-publica-nova/verification.md).

## 0049 — Design system 2026 no código

**07/11/2026: spec `implementada`.** [Issue #267](https://github.com/SamiaLuvanice/bestprice/issues/267) fechada;
PR [#268](https://github.com/SamiaLuvanice/bestprice/pull/268) integrada em `develop` (`45920b4`) com CI verde,
depois da revisão independente aprovada. A Issue #222 (0042) foi fechada manualmente: a ação principal
passa a ser o verde, com texto preto. Worktree e branches local e remota da feature removidas.
A variável `color/brand-strong` (#a0004c) foi criada no Figma e entrou no snapshot de tokens pela
[Issue #271](https://github.com/SamiaLuvanice/bestprice/issues/271); não resta divergência de token entre Figma e código.

O que entrou:
- tokens do Figma 2026 (cores, superfícies escuras fixas, status, raios, espaços, elevação, foco e
  movimento), conferidos contra o snapshot versionado;
- 22 estilos de texto;
- Geist Mono empacotada (OFL 1.1, só latin e latin-ext);
- biblioteca da seção 2 completa em `src/components/ui/`;
- catálogo `/dev/design-system`, só em desenvolvimento;
- gráfico em degraus com ponto atual e alvo do alerta ativo;
- barra lateral escura;
- telas da lista A aproximadas dos quadros, com as divergências aprovadas em 07/11/2026;
- referências visuais (F26) atualizadas com aprovação.

Comportamento, rotas, API e textos visíveis das telas não mudaram; os rótulos dos componentes do registry (paginação, sheet e barra lateral) foram traduzidos. Os detalhes e as contagens estão em
[verificação da 0049](../specs/0049-design-system-2026-no-codigo/verification.md).

Doc-sync de onboarding executado em 07/11/2026: README, arquitetura, infraestrutura, fluxo GitHub,
guias de design e skill quality-gates passam a citar `npm run build:check`, Geist Mono, `sonner`,
catálogo e a regra da ação principal verde.

Pendências: revisão independente final, PR para develop (`Closes #267`, `Closes #222`) e CI.

## 0048 — Cadastro self-service de usuários

**06/11/2026: implementada.** [PR #253](https://github.com/SamiaLuvanice/bestprice/pull/253)
integrada em develop (`fa31fc9`) com CI verde; spec `implementada`. Cadastro **desligado por padrão** (`SIGNUP_ENABLED=false`);
validação em Stage pendente até a leitura do Mercado Livre funcionar.

Registro da entrega: [Issue #252](https://github.com/SamiaLuvanice/bestprice/issues/252),
branch/worktree `feature/0048-issue-252-cadastro-self-service`, base origin/develop `66fb0c5`,
ponta `c95a5d2`. "Criar conta" no login e na landing leva a `/cadastro` (e-mail, senha e
confirmação, com aviso de privacidade). A conta é criada com as mesmas regras do login e da CLI
(e-mail `nome@domínio.tld` até 320 caracteres, senha de 12 a 1024), a sessão começa na hora e o
`returnTo` é respeitado. `POST /api/auth/signup` responde 201/422/409/429; com o interruptor
desligado, `GET` informa `enabled:false`, o `POST` dá 404 e `/cadastro` leva ao login. O limite
padrão é 5 envios por origem a cada 60 min, em `signup_attempts` (migração `20261106signup`),
com a origem só como HMAC (`SIGNUP_SOURCE_HASH_SECRET`) e aceita do proxy do Pages por segredo
(`API_PROXY_SECRET`/`TRUSTED_PROXY_SECRET`). A CLI passa a aplicar as mesmas regras.

Backend: Ruff aprovado e pytest com PostgreSQL 18 descartável **456 passed, 2 skipped**
(baseline 302); complexidade sem bloco ≥ D. Frontend: lint e build aprovados, Vitest 531/531 em
38 arquivos e Playwright `signup.spec.ts` 24 passed; a suíte visual inteira tem 19 falhas
pré-existentes em develop. QA local (API, SPA e PostgreSQL reais, sem Compose) aprovou AC01–AC14;
AC13 com diferenças visuais aceitas pela responsável em 06/11/2026, quadros Figma aprovados.
Revisão independente em três rodadas: a última (`1a58be9`) aprovou, e o ajuste sugerido entrou em
`c95a5d2`.

Pendências: I3 em Stage (criar os segredos no Pages e no Render e ligar o interruptor); CI e merge
do PR; doc-sync final; Issue para as 19 falhas visuais pré-existentes; Issue #247 apareceu em uma
rodada. Limites: e-mail no log do PostgreSQL a cada 409 (O2), sem teste com leitor de tela real,
AC09 em tempo real só com janela de 1 min. Ver [spec](../specs/0048-cadastro-self-service-usuarios/spec.md)
e [verificação](../specs/0048-cadastro-self-service-usuarios/verification.md).

## 0047 — Chat pesquisa preços na web com Gemini

**04/11/2026: spec implementada; [PR #246](https://github.com/SamiaLuvanice/bestprice/pull/246) integrada em develop no commit `c569bc6`.**
O CI do PR passou: Quality backend, frontend e automações, além da política de PR. A limpeza
removeu a branch local e a remota, o registro da worktree e o container de teste
`bestprice-0047-testdb`. O volume anônimo desse container foi preservado. Parte da pasta
`.worktrees/feature-0047-issue-245-chat-pesquisa-precos-web` ficou no disco, porque o Windows
recusou apagá-la (`Invalid argument`); ela não está mais registrada como worktree.
A instabilidade herdada de `App.test.tsx` segue na
[Issue #247](https://github.com/SamiaLuvanice/bestprice/issues/247). Ainda faltam a promoção
para stage e a validação com a conta Gemini real.

Registro da entrega: [Issue #245](https://github.com/SamiaLuvanice/bestprice/issues/245),
branch/worktree `feature/0047-issue-245-chat-pesquisa-precos-web`, base
origin/develop `eb7d657`. O chat livre pode usar o grounding com Google Search do
Gemini, opt-in por `AI_WEB_SEARCH_ENABLED=true` além de `AI_ENABLED` e chave; todo
o Assistente passa a `gemini-2.5-flash-lite` e a comparação continua sem busca.
`Message.grounding` (`null`/`searched`/`unavailable`) e `capabilities.web_search`
entram no contrato; a migration `20261104grounding` cria
`research_messages.grounding` JSONB nullable. Qualquer falha da busca gera uma
nova tentativa sem busca, com orçamento total de 50 s e log seguro. A UI mostra
"Não verificado", data, fontes e sugestões do Google em iframe com sandbox, além
do aviso de retenção de 30 dias pelo Google quando a busca está ativa.

Backend: Ruff aprovado e pytest completo com PostgreSQL 17 descartável
**302 passed, 2 skipped** após a última correção (log do fallback); complexidade
sem bloco ≥ D. Frontend: lint/build aprovados; Vitest 413/413 em 35 arquivos nas
três execuções após as correções, mas a QA em `c336a1d` registrou falha em 3 de 5
execuções completas por `App.test.tsx` (teste de dashboard fora do diff, idêntico
a develop). Playwright `grounding.spec.ts` 2/2 e jornada SPA/API/PostgreSQL com
transporte Gemini simulado 40/40 (busca ligada) e 12/12 (desligada). Revisão
independente aprovou após corrigir I1–I4, S1, S2, o `null` JSONB e N1.
Doc-sync-onboarding final executado: contexto do produto, README, arquitetura,
banco e guias backend/frontend/infraestrutura sincronizados; AGENTS.md e
CLAUDE.md conferidos sem edição.

Pendências: chamada real com grounding no free tier da conta operadora, HTML real
de `renderedContent` e adequação da altura fixa de 72 px do iframe, qualidade em
português do novo modelo; instabilidade de `App.test.tsx` herdada de develop;
riscos S3 (type guards que mutam), S4 (fonte rejeitada só pelo cliente invalida a
conversa), S5 (validade das URIs de redirecionamento do Google em 90 dias) e S6
(uma unidade de cota local pode gerar duas requisições ao Google). O primeiro
doc-sync apontou que o pior caso do chat com busca (50 s) excedia os 35 s de
leitura do `nginx.conf`; a correção `6599759` elevou chat/analyze para 60 s
(`nginx -t` válido em `nginx:1.27-alpine`; backend falso de 45 s: 504 aos 35 s
antes, 200 aos 45 s depois). Os dados simulados de teste passaram a
`gemini-2.5-flash-lite` (`95b2a2d`; lint, Vitest 413/413 em 35 arquivos e build
aprovados). O doc-sync foi repetido após essas mudanças. Ver [spec](../specs/0047-chat-pesquisa-precos-web-gemini/spec.md),
[verificação](../specs/0047-chat-pesquisa-precos-web-gemini/verification.md),
[revisão](../specs/0047-chat-pesquisa-precos-web-gemini/review.md) e
[doc-sync](../specs/0047-chat-pesquisa-precos-web-gemini/doc-sync.md).

## 0046 — Login de stage sem rodapé

**04/11/2026: spec implementada; [PR #240](https://github.com/SamiaLuvanice/bestprice/pull/240) integrada em develop no commit `b331588`.**
Spec `implementada`, [Issue #239](https://github.com/SamiaLuvanice/bestprice/issues/239) fechada pela integração.
Base origin/develop `72689fe`, branch `feature/0046-issue-239-login-stage-sem-rodape`.
Login aprovado de stage preservado, com retirada somente do rodapé dessa rota e
da reserva de 72 px, inclusive durante carga/erro de sessão. O matcher do roteador
cobre também /login/ e /LOGIN. Formulário, fontes, assets e autenticação preservados.
Figma desktop/mobile atualizado pelo Chrome e exportado em 04/11; Arimo é apenas
equivalência no desenho e não muda as fontes da aplicação.

TDD Red/Green registrado; lint/build aprovados, Vitest **397/397** em 35 arquivos,
direcionados **66/66**, Node **50/50** e Playwright pertinente final **28/28**.
QA independente aceitou o layout/estados e revisão independente aprovou a correção
do P2 de variantes da rota e a renovação das oito baselines de login.

A suíte visual global não está verde: 67 passaram, 12 falharam e 117 não rodaram
após max-failures=12. Quatro eram snapshots antigos de login, renovados e
revalidados; oito falhas de landing/marca foram reproduzidas na base 72689fe,
com capturas atuais de landing byte-idênticas entre base e feature. Outras
telas e baselines não foram alteradas para encobrir essa dívida anterior.

Doc-sync-onboarding final concluído após código, gates, revisão e QA: guia
frontend e aprendizado do matcher sincronizados; AGENTS.md/CLAUDE.md conferidos
sem edição. Commit de código `9f49eab` publicado com hooks aprovados e
Refs #239. O [CI final](https://github.com/SamiaLuvanice/bestprice/actions/runs/41880936096)
passou em `441c177`, incluindo backend, frontend, automações, política e agregador;
Cloudflare Pages publicou o preview. Worktree e branches exclusivas da feature
removidas sem força após os checks de limpeza; nenhum Compose/volume foi criado.
Checkout local atualizado e rascunho inicial preservado na pasta de artefatos.
Registro de conclusão: Issue #241. A promoção de develop para stage foi
solicitada em 04/11 e ainda depende da PR e da validação do ambiente publicado.
Sem alteração REST ou backend/banco; sem release ou tag nesta etapa.
Ver [spec e evidências](../specs/0046-login-stage-sem-rodape/verification.md).

## 0045 — Histórico de conversas conforme Figma

**04/11/2026: implementação entregue; aguarda revisão no [PR #236](https://github.com/SamiaLuvanice/bestprice/pull/236) para develop.**
Spec `pronta`, [Issue #235](https://github.com/SamiaLuvanice/bestprice/issues/235),
branch/worktree `feature/0045-issue-235-historico-conversas`, base
origin/develop `cbda78c`. Histórico com conversas reais, busca única por título,
cards responsivos, Continuar, data local, paginação e exclusão confirmada no
desktop/mobile. Diálogo compartilhado com foco inicial em Cancelar e retorno ao
acionador ou título após sucesso. Sem alterar API, banco ou comparações salvas.

Lint/build aprovados; Vitest **390/390** em 35 arquivos e **9/9** afetados finais;
Playwright **20/20** finais, incluindo teclado, axe e overflow em
320/390/768/1280 px e capturas 1440×1040/390×844; Node **50/50**; detector
local sem ocorrências. Revisão independente e QA visual sem achados bloqueantes
após corrigir contraste do vazio e ciclo de foco do diálogo. Doc-sync final
concluído: frontend, arquitetura e contexto do produto sincronizados;
AGENTS.md/CLAUDE.md conferidos sem alteração. Ver
[verificação e capturas](../specs/0045-historico-conversas-conforme-figma/verification.md).

Referências Figma exportadas de 31/10/2026, frames 59:204 e 59:716; MCP limitado
pela cota Starter. Validação com API controlada, sem backend/banco reais, leitor
de tela ou teclado virtual reais. Commit `dffa5cf` publicado com hooks aprovados;
PR aberto, sem conflitos na consulta inicial. Política de PR e automações aprovadas;
[CI 41839093282](https://github.com/SamiaLuvanice/bestprice/actions/runs/41839093282)
em execução na consulta inicial. Conferir checks do SHA atual antes de integrar.
Sem merge ou promoção de release; Project não presumido.

## 0044 — Assistente IA com menos sobrecarga

**Atualização de 04/11/2026: implementação entregue; aguarda revisão no [PR #232](https://github.com/SamiaLuvanice/bestprice/pull/232) para develop.**
Spec `pronta`, na worktree `.worktrees/codex-0044-assistente-simples`, branch
local `feature/0044-issue-231-assistente-simples`, baseada em origin/develop `9d3b482`.
A responsável confirmou os mesmos cortes editoriais do Figma desktop no mobile.
A entrada tem pergunta direta, exemplo no campo e robô compacto; recentes ficam
recolhidos nos dois tamanhos, sem apagar o rascunho ou enviar ao abrir/fechar.
Aviso essencial do Google junto ao envio e contador contextual aos últimos 200
caracteres. Backend, API, política e dependências preservados.

Lint/build aprovados; Vitest 381/381 em 34 arquivos com dois workers; Playwright
32/32 nos quatro viewports, incluindo captura 390 × 844; detector local sem
ocorrências nos três arquivos de UI; automações Node 50/50. Revisão independente
e QA aceitas sem achados de produto P0–P2 pendentes. A lacuna das capturas de
estados foi corrigida e reinspecionada. Doc-sync-onboarding executado por último:
guias de frontend/arquitetura e contexto do produto sincronizados; AGENTS.md e
CLAUDE.md conferidos sem necessidade de edição. Ver
[verificação](../specs/0044-assistente-com-menos-sobrecarga/verification.md).

Validação de UI com API controlada; sem ensaio de teclado virtual ou leitor de
tela reais e sem geração externa. Após autorização explícita da responsável,
foi criada a [Issue #231](https://github.com/SamiaLuvanice/bestprice/issues/231),
confirmada aberta. O bloqueio anterior da criação da Issue foi resolvido.
Continuidade da orquestração solicitada em 04/11; branch ajustada à convenção e
base reconferida sem avanço. Commit `58d49f2` publicado com Refs #231 e hooks
aprovados. PR #232 aberto com Closes #231; [CI 41830207670](https://github.com/SamiaLuvanice/bestprice/actions/runs/41830207670)
aprovado em `f9674b1` (backend, frontend, automações, política e agregador).
Conferir o check do SHA atual antes de integrar. Integração pendente. Não houve limpeza da worktree
porque a implementação continua em revisão.

## 0040 — Assistente IA com robô e conversas recentes

**Atualização de 02/11/2026: implementação entregue; aguarda revisão no [PR #226](https://github.com/SamiaLuvanice/bestprice/pull/226), em rascunho para develop.**
Spec `pronta`, [Issue #225](https://github.com/SamiaLuvanice/bestprice/issues/225),
branch/worktree `feature/0040-issue-225-assistente-ia`, base `a9e76e3` de
`origin/develop`. O Assistente usa o robô original, escrita em destaque e quatro
conversas recentes pela API existente, com falhas independentes do chat. O shell
de `/app/*` segue os três destinos do Figma atual; comparador e dashboard mantêm
suas rotas e dados. Monitoramento interno usa header único e subnavegação no fluxo.

Lint/build finais aprovados (2.661 módulos); 375 testes Vitest da suíte completa
antes dos ajustes finais e 47 afetados aprovados depois, incluindo primeiro envio
e resposta tardia da sessão anterior. Playwright: 32/32 nos quatro viewports,
mais 4/4 finais de navegação; automações Node 50/50. Revisão independente aceitou
as correções dos dois P2 encontrados, sem outros bloqueios. Doc-sync executado
após código, gates e revisão, concluído na retomada de 02/11/2026 sem alteração
adicional de código. Evidências e capturas na
[verificação](../specs/0040-assistente-ia-com-robo/verification.md).
Teclado virtual real e fluxo com backend/banco/IA reais permanecem pendentes;
PR publicado e CI iniciado; a primeira consulta encontrou checks em execução.
Merge, deploy e sincronização com Project não são inferidos.

## 0039 — Figma oficial e retirada da Paper Bridge

**Atualização de 29/10/2026: spec implementada.**
[PR #212](https://github.com/SamiaLuvanice/bestprice/pull/212) integrada em
develop às 08:30:19 (America/Sao_Paulo), merge `2edd206`; Issue #211 encerrada.
CI final da correção que preserva o MCP Paper aprovado no SHA `d70341d`
([40740028251](https://github.com/SamiaLuvanice/bestprice/actions/runs/40740028251)),
com nova validação após marcar a PR pronta também verde
([40865690216](https://github.com/SamiaLuvanice/bestprice/actions/runs/40865690216)).
Revisão independente, QA e doc-sync já registrados; sem bypass ou autoaprovação.
O MCP Paper permanece para uso eventual e Figma continua como padrão.
O registro de conclusão segue pela
[Issue #213](https://github.com/SamiaLuvanice/bestprice/issues/213).

Limpeza da implementação concluída após comprovar ancestralidade: worktree e
branches local/remota da 0039 removidas. Resíduos de junctions Windows foram
inventariados por QA e retirados apenas após reconferência de caminhos/arquivos;
outras worktrees, alterações alheias do checkout principal e volumes preservados.
Doc-sync final repetido na worktree documental, com AGENTS.md/CLAUDE.md
conferidos sem edição e sem mudança de código/configuração. O registro da
Issue #213 foi publicado na [PR #214](https://github.com/SamiaLuvanice/bestprice/pull/214);
CI e integração são acompanhados no handoff. Sua worktree será limpa somente
após essa integração.

Os parágrafos abaixo preservam o histórico da entrega de 28/10, anterior à
integração. O checkout principal contém alterações locais de outro trabalho e
será preservado; a limpeza é restrita aos recursos criados por esta tarefa.

28/10/2026: spec `pronta`, execução na branch/worktree
`feature/0039-issue-211-fluxo-design-figma`, base `origin/develop` em
`3f230793e6699f16e8443ecad045dc1d13ba3304`;
[Issue #211](https://github.com/SamiaLuvanice/bestprice/issues/211).
Escopo aprovado: retirar o tooling e os gates exclusivos da Paper Bridge, preservar
o MCP oficial do Paper para uso eventual e todos os demais servidores, conforme
correção posterior do usuário, e padronizar Figma → Codex → Implementação →
Validação visual nos guias existentes. Nenhuma alteração de interface,
funcionalidade, estilo, runtime ou asset da aplicação é prevista.

A direção de canvas no Paper da tarefa 0038 foi substituída por esta decisão.
Sua worktree, código pendente, arquivos locais e Issue #210 foram preservados;
esta entrega não migra ou recria seus designs. A preservação do MCP não reativa
a Bridge nem o canvas planejado da 0038; Figma permanece a referência principal.
Plugins/aplicativos e configurações globais do cliente não foram alterados.

Retirada concluída na worktree: 46 arquivos exclusivos e três etapas CI removidos;
quatro configurações MCP comparadas após a correção, todas semanticamente
idênticas à base, com Paper preservado para uso eventual. Aplicação,
assets, testes visuais, checkout principal e trabalhos locais anteriores
preservados. Gates locais: **50/50 testes Node**, zero falhas/skips; sete hooks
de conteúdo verdes; diff-check e complexidade sem Python alterado aprovados.
Comparação YAML confirmou os demais gates intactos. Spec-reviewer,
arch-reviewer e QA independentes sem bloqueios; QA aprovou AC01–AC07.
Após a correção MCP, QA e arch-reviewer aprovaram o ajuste; pre-commit passou
nos hooks aplicáveis (YAML sem arquivos aplicáveis) e diff-check passou.

Doc-sync-onboarding final repetido após a correção, gates e revisões: guias, links e cercas
conferidos; AGENTS.md e CLAUDE.md não exigiram edição porque encaminham para as
regras canônicas já atualizadas. Ver [verificação](../specs/0039-fluxo-design-figma/verification.md)
e [doc-sync](../specs/0039-fluxo-design-figma/doc-sync.md), além da
[spec](../specs/0039-fluxo-design-figma/spec.md) e do
[plano](../specs/0039-fluxo-design-figma/plan.md).
Implementação entregue; aguarda revisão na
[PR draft #212](https://github.com/SamiaLuvanice/bestprice/pull/212), para develop.
[CI anterior 40738187782](https://github.com/SamiaLuvanice/bestprice/actions/runs/40738187782)
aprovado em `c0d7577`, antes da correção MCP. O CI inicial em `374da45` registrou
**241 pytest**, **368 Vitest em 33 arquivos**, **50 Node**, Ruff, ESLint, build e
actionlint verdes. Esses resultados não validam o estado corrigido atual, cujo
novo CI ainda será acompanhado pelo coordenador. Os gates completos rodaram
no CI, não localmente. Sem consulta/autenticação atual do Figma, merge, release ou
implantação manual; checks automáticos de preview não representam promoção.

## Histórico de Paper — specs 0035–0037, descontinuado pela 0039

Os registros abaixo preservam as evidências e pendências da época. Referências
a comandos, gates e trabalhos futuros do Paper não constituem fluxo ativo nem
exigem retomada; consulte o [fluxo Figma](apps/frontend.md#fluxo-oficial-de-design--figma).

Spec 0037 `pronta`, implementação entregue no [PR draft #206](https://github.com/SamiaLuvanice/bestprice/pull/206); aguarda revisão e
ensaio remoto de geração autorizado. [Issue #205](https://github.com/SamiaLuvanice/bestprice/issues/205),
branch/worktree `feature/0037-issue-205-paper-images`, base `origin/develop`
`7eb470f`. O módulo `image` inspeciona Create image/Create SVG, prepara pedidos
com confirmação específica de 15 minutos e importa/reutiliza SVG/PNG/JPG/WebP
pelo seletor público Place image. Cópias e manifesto local de origem/utilização
registram hashes, IDs e estados; resultado incerto bloqueia nova tentativa.
Inspeção e preparo Grok/16:9 foram exercitados no Paper sem geração; o ensaio de
importação/reutilização confirmou seis assets locais no documento de teste.
**26/26** testes Bridge, **9/9** focados em imagens, **50/50** automações, sintaxe,
actionlint e diff sem erros. Revisão independente sem bloqueios após correções
de conferência pré-submit e bloqueio de Variety pack. O job Automation passa a
testar imagens em Chromium local, sem sessão Paper/créditos; CI remoto pendente.
Doc-sync final concluído em 28/10/2026; AGENTS.md/CLAUDE.md conferidos sem edição.
AC4 permanece pendente: nenhuma geração remota foi autorizada ou iniciada,
e download por exportação pública ainda não foi validado. Sem alteração do
documento BestPrice IA, merge ou deploy. Ver [verificação](../specs/0037-paper-bridge-images/verification.md)
e [doc-sync](../specs/0037-paper-bridge-images/doc-sync.md).

Spec 0036 `pronta`, implementação entregue para revisão no [PR #204](https://github.com/SamiaLuvanice/bestprice/pull/204)
em rascunho para develop, no branch/worktree
`feature/0036-issue-203-paper-html-sync`, baseada em `origin/develop` (`b4fd94f`);
[Issue #203](https://github.com/SamiaLuvanice/bestprice/issues/203). A Paper Bridge
agora gera a tela real `/app/dashboard` em HTML/CSS inline e importa pelo
clipboard público/Playwright no documento `BestPrice Bridge Test`, sem MCP do
Paper ou endpoints privados. Dashboard desktop/tablet/mobile é gerado dos estilos,
componentes, textos e logo reais; a importação live foi confirmada em desktop e
mobile, com texto editado/restaurado. A repetição desktop reutilizou o mesmo ID;
manifesto bloqueia conflito e estado pendente, e versão nova é aditiva. Gates:
**17/17** testes Node (incluindo três viewports), `npm run check` e contrato CLI
verdes; os checks de CI da PR ainda estão pendentes. Paper ficou minimizado antes
de nova tentativa final; a ferramenta recusou-a sem falso sucesso. Importação
tablet, outras rotas e responsividade viva no canvas seguem pendentes. Ver
[README histórico da bridge](https://github.com/SamiaLuvanice/bestprice/blob/3f230793e6699f16e8443ecad045dc1d13ba3304/tools/paper-bridge/README.md) e
[verification.md](../specs/0036-paper-bridge-html-first/verification.md).

Spec 0035 `pronta`, implementação entregue para revisão no
[PR #202](https://github.com/SamiaLuvanice/bestprice/pull/202) em rascunho para develop:
[Issue #201](https://github.com/SamiaLuvanice/bestprice/issues/201),
branch/worktree `feature/0035-issue-201-paper-bridge-local`, base
`origin/develop` (`b0e674e`). Paper Bridge local com CLI/API Node por
Playwright/CDP, limitada ao documento `BestPrice Bridge Test`: frame, nome,
W/H/X/Y, preenchimento por tokens reais, textos, reparenting, composição de frame
com textos, screenshots e validação por propriedades/DOM. Revisão independente
aprovou após quatro correções. Gates finais: **11/11** testes da ferramenta,
checagem de sintaxe e **50/50** testes das automações da raiz. Uma execução live
completa comprovou **11 operações** entre 19:49:40 e 19:50:18 UTC; a repetição
após pequenos ajustes finais não concluiu porque a sessão não expôs a aba
autorizada. Scripts experimentais preservados com hashes idênticos. Doc-sync
executado ao final; PR/CI/integração ainda não presumidos. Componentes completos,
HTML, novos documentos, retângulos próprios e responsividade automática seguem
pendentes. Ver [verification.md](../specs/0035-paper-bridge-local/verification.md).

## Histórico das demais specs

Spec 0034 `pronta`, implementação local revisada: [Issue #195](https://github.com/SamiaLuvanice/bestprice/issues/195),
branch/worktree `feature/0034-issue-195-assistencia-compras-ai`, base `origin/develop`
(`de31eb7`). Direção A aprovada; assistência, comparação manual de 2–3 produtos e
histórico privado, com monitoramento preservado e gate MLB desligado. Retenção local
de 90 dias; IA opt-in, modelo fixado e desativado por padrão. Backend final:
**239 passed, 2 skipped POSIX no Windows, 1 warning** (82,39 s); **46 focados**
HTTP/provider simulado/PostgreSQL/RLS. Ruff verde; módulo novo 64 blocos, média
A/2,34, máximo B/10; gate global passou com dívidas legadas idênticas à base.
Frontend: **366/366** suíte completa e **18/18** afetados finais, lint/build
aprovados (2.658 módulos). Revisão independente aprovou RB01/RB02 e RF01–RF06
após correções; QA aprovada. SPA/API/PostgreSQL reais no schema final passaram
**4/4 jornadas**, **6/6 erros** e **38/38 matriz** em quatro larguras/oito rotas;
somente a geração externa foi fixture, com rede Google bloqueada. SQL confirmou
NUMERIC(18,2) e RLS nas seis tabelas novas. Health real 200→503→200 no banco
descartável. Rodada visual ampla anterior: 129/132 antes da correção da marca;
8/8 afetados depois, oito baselines landing revisados/atualizados e confirmação
8/8 sem update; baselines login/404 preservados. Doc-sync final concluído em
27/10/2026, com AGENTS.md/CLAUDE.md conferidos. Commit `5d84083` publicado com hooks
aprovados; [PR #196](https://github.com/SamiaLuvanice/bestprice/pull/196) aberta em
draft para develop, com Closes #195 e evidências. O resultado autoritativo do CI
fica nos [checks da PR](https://github.com/SamiaLuvanice/bestprice/pull/196/checks).
AC10/AC15/AC19 dependem de configuração gratuita e avaliação real do modelo, sem
chave/custo/chamada nesta etapa; AC30 tem o handoff registrado.
Sem merge, deploy ou alegação de atualização do Project. Ver [plano](../specs/0034-assistencia-compras-bestprice-ai/plan.md),
[verificação](../specs/0034-assistencia-compras-bestprice-ai/verification.md) e
[doc-sync](../specs/0034-assistencia-compras-bestprice-ai/doc-sync.md).

Spec 0030 `implementada`: [PR #175](https://github.com/SamiaLuvanice/bestprice/pull/175)
integrada em `develop` em 22/10/2026 às 19:37:03 UTC, merge `5219077`, contendo
HEAD `d9f010e`; Issue #174 fechada. Checks remotos verdes (CI, Frontend,
Backend, Automation, PR policy, Pages e resolve/sync). QA independente aceitou
AC01–AC11 sem bloqueios, conferindo código, documentos, capturas e resultados
das rodadas de 128 e 40 casos, sem repetir suítes aprovadas. Os 128 casos
pertencem à rodada anterior à correção; os 40 afetados confirmam AC11. Lint/build
(2.653 módulos) e 350 testes Vitest em 31 arquivos passaram após os ajustes.
Galeria e evidências preservadas no checkout principal em
`frontend/playwright-report/spec-0030-delivery/comparison.html`, fora das worktrees.
A [Issue #176](https://github.com/SamiaLuvanice/bestprice/issues/176) acompanha o
encerramento documental por PR. Limpeza das duas worktrees aguarda essa integração;
nenhuma promoção de release/stage ou validação de API real foi feita.

Spec 0033 `pronta`, em implementação: [Issue #184](https://github.com/SamiaLuvanice/bestprice/issues/184), branch/worktree `feature/0033-issue-184-diagnostico-403-mercado-livre`, base `origin/develop` (`f364e7c`). Diagnóstico seguro de HTTP 403 identifica `item` ou `sale_price` no relatório da sonda, preservando `integration_access_denied`; sem incluir corpo upstream ou ampliar permissões OAuth. Testes focados **48/48**, suíte backend **166 passed, 31 skipped**, Ruff e complexidade verdes. Revisão independente sem achados; execução Stage com a mudança, CI e merge ainda pendentes; gate permanece desligado. Ver [spec 0033](../specs/0033-diagnostico-403-mercado-livre/spec.md) e [verification](../specs/0033-diagnostico-403-mercado-livre/verification.md).

| Spec | Refinamento e plano | Implementação | Revisão | Verificação |
|---|---|---|---|---|
| 0037-paper-bridge-images (histórico descontinuado) | Spec `pronta`; plano/tarefas; [Issue #205](https://github.com/SamiaLuvanice/bestprice/issues/205), base `7eb470f` | CLI/API `image inspect/generate/import/validate`, confirmação específica, manifesto/reutilização; preparo real sem submit; Variety pack bloqueado | Revisão independente sem bloqueios após correções; doc-sync final concluído; [PR draft #206](https://github.com/SamiaLuvanice/bestprice/pull/206) para develop | **26/26** Bridge, **9/9** focados, **50/50** automações, sintaxe/actionlint/diff verdes; live dos quatro formatos com seis assets validados. AC4/geração remota pendente e CI remoto em execução; [verification](../specs/0037-paper-bridge-images/verification.md) |
| 0036-paper-bridge-html-first (histórico descontinuado) | Spec `pronta`, plano e tarefas; [Issue #203](https://github.com/SamiaLuvanice/bestprice/issues/203); base `origin/develop` (`b4fd94f`) | CLI `sync` gera HTML inline do dashboard real e importa via clipboard público/Playwright; desktop/mobile editáveis, manifesto local e versões aditivas; desktop repetido reutiliza ID. Outras rotas e tablet live pendentes | Revisão documentada do diff e limites em `verification.md`; [PR #204](https://github.com/SamiaLuvanice/bestprice/pull/204) aberta em rascunho | **17/17** testes Node, sintaxe e CLI help verdes; geração desktop/tablet/mobile; live desktop v2 (140 nós) e mobile v1 (123 nós), edição/restauração e screenshots; nova tentativa live recusada com Paper minimizado. Checks de CI da PR pendentes; ver [verification.md](../specs/0036-paper-bridge-html-first/verification.md) |
| 0032-sonda-mercado-livre-github-actions | Spec `pronta`, plano e tarefas; [Issue #182](https://github.com/SamiaLuvanice/bestprice/issues/182); base `origin/develop` (`396f0ac`) | Workflow manual implementado; environment GitHub `stage-validation` criado, restrito a `develop` e abastecido com quatro secrets Stage/OAuth; valores não exibidos | Revisão local de segurança, PR e revisão independente pendentes | `workflow_dispatch` ainda indisponível até integração em `develop`; sonda não executada e Stage permanece com gate `false`; ver [verification.md](../specs/0032-sonda-mercado-livre-github-actions/verification.md) |
| 0031-link-catalogo-publicacao | Spec `implementada`; [Issue #180](https://github.com/SamiaLuvanice/bestprice/issues/180) fechada; PR [#181](https://github.com/SamiaLuvanice/bestprice/pull/181) integrada em `develop` (`2275a69`) em 06/11/2026, após merge com `d105eb8`; worktree e branch local removidas | Parser aceita página `/slug/p/MLB…` quando `pdp_filters` identifica publicação única; ID de catálogo nunca substitui o ID publicado; repetição igual aceita, IDs conflitantes rejeitados; seleção igual ao ID do catálogo é recusada. Não altera OAuth nem o gate Stage. `doc-sync-onboarding` executado; README, guia backend, aprendizado e verificação atualizados | Revisão independente (06/11/2026): aprovar com ressalvas; P2 corrigida e casos AC03 na rota incluídos; CI da PR verde (8 checks) | Red esperado: 2 falhas/24 passavam; testes focados finais 28/28; Ruff verde; backend **168 passed, 31 skipped** na entrega original; após merge com develop e ajuste da revisão, testes focados **32/32** e backend **407 passed, 61 skipped** (sem PostgreSQL de teste e script POSIX no Windows); complexidade CC19 rank C; diff check limpo. Stage continuou com 503 `integration_not_configured`; Shell/One-off Jobs não disponíveis no plano Free. API real e integração ativa pendentes. Ver [verification.md](../specs/0031-link-catalogo-publicacao/verification.md). |
| 0030-experiencia-visual-consistente | Spec `implementada`, auditoria P0–P3, plano e tarefas; [Issue #174](https://github.com/SamiaLuvanice/bestprice/issues/174); worktree/branch `feature/0030-issue-174-experiencia-visual`, base `origin/develop` em `e484cd3` | Tokens de ritmo/movimento, superfícies e foco comuns, hero em duas colunas no desktop, indicadores verticais, hierarquia de detalhe/listas/login/landing/404; menu público fecha com Escape e saída de foco. Sem mudança de backend, API, banco, regras ou dependências. Doc-sync-onboarding executado como última etapa após gates/revisão | Revisão independente sem achados concretos de regressão ou bloqueios; 24 baselines públicas revisadas antes de regenerar. QA independente aceitou AC01–AC11; PR #175 integrada em develop (`5219077`), Issue #174 fechada | Lint e build verdes; **350/350 Vitest** em 31 arquivos; **128/128 Playwright** na rodada anterior e **40/40** afetados após AC11; confirmação sem atualizar baselines, quatro larguras e API simulada. Detector `[]`; automações Node da raiz passaram; complexidade sem Python alterado. Figma inspecionado no Chrome e exportações locais (conector sem autenticação); Spartan observado. CI remoto verde no HEAD d9f010e. Sem validação de API real, dispositivo físico ou deploy. Ver [verification.md](../specs/0030-experiencia-visual-consistente/verification.md). |
| 0029-identidade-bestprice-consistente | Spec `pronta`; T01–T10 concluídas; [Issue #167](https://github.com/SamiaLuvanice/bestprice/issues/167); branch/worktree `feature/0029-issue-167-identidade-bestprice-consistente`, base `origin/develop` em `2df3129`; T11 (PR, CI e integração) pendente | `Brand` compartilhado em landing, login, conta, rota não encontrada e sessão em carga/erro; fonte display, peso 600 e tracking `-.011em`; login móvel horizontal; nome acessível único; projeto Playwright de 390 px. Doc-sync-onboarding concluído após a última alteração de código | Revisão independente final aprovada após remoção do bypass de diagnóstico; QA móvel independente: 18/18 casos e 76 observações, sem violações axe. Todas as 24 baselines públicas aprovadas (12 móveis pela QA; 12 maiores pelo coordenador) | Red esperado demonstrado; frontend lint/build verdes, 348/348 Vitest em 31 arquivos, 36/36 marca/axe e 84/84 pública/redesign sem atualização de snapshots. Intermitência da logo não reproduzida; Chromium com API simulada, sem aparelho real/Safari. Backend e seus gates fora do escopo local; artefatos ignorados são apenas locais. Ver [verification.md](../specs/0029-identidade-bestprice-consistente/verification.md). |
| 0028-ajustes-auditoria-redesign | Spec `implementada`, plano e tarefas; [Issue #157](https://github.com/SamiaLuvanice/bestprice/issues/157); worktree/branch `feature/0028-issue-157-ajustes-auditoria-redesign`, base `origin/develop` em `fb71646` | Ajustes da auditoria pós-0027 só no frontend: preço-alvo em pt-BR normalizado no cliente (contrato `target_price` inalterado); artes em WebP (maior 70.734 B) e órfãos removidos; tokens sem ambiguidade (`--primary` rosa, `--action` verde, `text-muted` = texto secundário); Produtos abre na lista com “Adicionar anúncio” e linha móvel compacta; detalhe com controles de alerta de função única, metadados recolhidos e eixo em R$; Início vazio sem indicadores; sessão em verificação sem campo de link; `asyncUtilTimeout` 3 → 6 s. Doc-sync-onboarding concluído; [PR #158](https://github.com/SamiaLuvanice/bestprice/pull/158) integrada em `develop` (merge `4a0505a`), 10 checks remotos verdes | Revisão independente aprovada após corrigir dois P2 e quatro P3; QA independente com 13 aceitos e 2 parciais (AC04 e AC05), ambos corrigidos depois e revisados | Gates do implementador em `37cac54`: frontend lint limpo, **348/348** Vitest em 31 arquivos, build e **63/63** Playwright visual/axe (WCAG 2.2 AA em 320/768/1280 px). Revisor e QA reproduziram lint e Vitest; QA também build e 57/57 visual na ponta anterior. Backend não alterado (Ruff/pytest não executados). Sem leitor de tela, conta real ou CI remoto. Ver [verification.md](../specs/0028-ajustes-auditoria-redesign/verification.md). Ajuste visual pós-integração em 22/10: cantos de 18 px na arte do hero; lint, build, Vitest 348/348 e hooks passaram; revisão/QA sem achados; Playwright sem captura. Em handoff na [PR #165](https://github.com/SamiaLuvanice/bestprice/pull/165), vinculada à [Issue #164](https://github.com/SamiaLuvanice/bestprice/issues/164), branch `fix/issue-164-arredonda-foto-hero`; sem merge até o momento. |
| 0027-redesign-figma-shadcn | Spec `pronta`, plano e tarefas; [Issue #153](https://github.com/SamiaLuvanice/bestprice/issues/153); worktree/branch `feature/0027-issue-153-redesign-figma-shadcn`, base `origin/develop` em `4855704` | Redesign das telas públicas/autenticadas com componentes oficiais shadcn/ui e Tailwind v4; Recharts/shadcn Chart lazy com histórico real, tooltip exato e tabela textual; recuperação de rota por sessão; sem mudança de API/backend/banco. Doc-sync-onboarding concluído; [PR #154](https://github.com/SamiaLuvanice/bestprice/pull/154) entregue como rascunho para `develop`, sem merge | Código e 18 baselines aprovados em revisão independente após corrigir menu recortado, nome acessível da conta, alvos de toque e fidelidade de login/rota inexistente | Frontend lint sem avisos, **299/299** Vitest em 29 arquivos, build e detector `[]`; **48/48** Playwright, incluindo 30 auditorias axe de rotas/estados em 320/768/1280 px, overflow, toque e menu aberto. Hooks e `git diff --check` passaram. Referência SVG local: conector Figma repetiu autenticação. Sem login real ou deploy; CI remoto em acompanhamento. Ver [verification.md](../specs/0027-redesign-figma-shadcn/verification.md). |
| 0026-validacao-operacional-mercado-livre | Spec `rascunho`, plano e tarefas; [Issue #127](https://github.com/SamiaLuvanice/bestprice/issues/127); branch/worktree `feature/0026-issue-127-validacao-api-mercado-livre` | Sonda de leitura real, gerador OAuth authorization-code e callback Stage com state assinado, persistência cifrada, redação de query no access log e categorias seguras de falha; token_type aceita `bearer` e `Bearer`; integração permanece desativada | PRs #140 (`a856c2f`) e #142 (`f196d4f`) integradas em `develop`; promoção #143 (`2eb6dc7`) integrada em `stage`; PR #144 integrada em `develop`, checks verdes; revisão independente aprovada sem achados | Ruff e complexidade passaram; backend **162 passed, 31 skipped, 1 warning** (sem `TEST_DATABASE_URL`); Node **50/50** (execução anterior); `git diff --check` passou. Render Stage Live/health 200. Quarta autorização OAuth concluída; contagem/validade confirmam uma credencial cifrada, sem ler tokens. Renovação real e consulta de anúncios não foram executadas; último valor conhecido da flag Stage: `false` (não relido após a sincronização #144). AC01 parcial; AC02 pendente; AC03–AC04 parciais; AC05–AC06 demonstrados. Ver [verification.md](../specs/0026-validacao-operacional-mercado-livre/verification.md). |
| 0025-harness-design-tooling | Spec `pronta`, sem plano de tarefas separado (escopo pequeno); [Issue #121](https://github.com/SamiaLuvanice/bestprice/issues/121); worktree `feature-0025-issue-121-harness-design-tooling` sobre `origin/develop` | Skills `ui-ux-pro-max`, `huashu-design` e `impeccable` instaladas em `.agents/skills/` via CLI `skills` (lock versionado, perfil ativo em `.agents/modules.yaml`); guidelines próprias em `designsystem/agent-guidelines.md`, `brand-spec.md` e `prototypes/`; regras de frontend/workspace exigem a leitura das guidelines; suíte Playwright de regressão visual em `frontend/tests/visual/` (viewports 320/768/1280, emulação de esquema claro/escuro, baselines iniciais) e script `npm run test:visual`; doc-sync executado | Revisão independente não registrada no GitHub; merge por SamiaLuvanice | Playwright visual **18/18** (baseline gerada + reexecução limpa); frontend lint, **293/293** Vitest e build verdes; backend Ruff verde e pytest **129 passed, 31 skipped** (Postgres indisponível localmente); Node **50/50**; `git diff --check` limpo. [PR #122](https://github.com/SamiaLuvanice/bestprice/pull/122) integrada em `develop` (merge `289ab8d`). Ver [verification.md](../specs/0025-harness-design-tooling/verification.md). |
| 0024-landing-page-publica | Spec `pronta`, plano e tarefas; [Issue #111](https://github.com/SamiaLuvanice/bestprice/issues/111); branch `feature/0024-issue-111-landing-page` rebaseada sem conflito sobre `origin/develop` (`cbb61c3`) e publicada em `a61f9ee` | Landing pública para visitante em `/`, inclusive durante carga/falha da sessão; painel preservado para sessão válida. Hero, benefícios, etapas, sete categorias, banner, menu móvel e aviso local para cadastro indisponível; nove WebP e meta description; sem API/backend/DB | Revisão independente: dois P2 de contraste e âncora corrigidos e rechecados; P3 do título descartado após conferência dos efeitos e teste. QA independente revalidou 5/5. [PR #115](https://github.com/SamiaLuvanice/bestprice/pull/115) aberta para `develop`, sem conflitos e pronta para merge; integração pendente | Red com 3 falhas esperadas e Green 3/3; `npm ci` (261 pacotes, 0 vulnerabilidades), lint, 293/293 testes em 27 arquivos após a última edição do teste de menu por Enter e build verdes; teste direcionado 5/5. Node 50/50 e `git diff --check` verdes. IAB sem overflow em 375/430/768/1024/1440 px; visual desktop 1440 e mobile 390 conferido. CI [run 38974873433](https://github.com/SamiaLuvanice/bestprice/actions/runs/38974873433): dez checks verdes, incluindo CI obrigatório, PR policy, Automation, Backend, Frontend e Project sync; Cloudflare Pages publicou o preview, sem validação de `stage`. Teclado real, axe, login/API/backend/DB locais e actionlint local não executados. Ver [verification.md](../specs/0024-landing-page-publica/verification.md). |
| 0023-login-com-imagem-lateral | Spec `pronta`; Issue [#106](https://github.com/SamiaLuvanice/bestprice/issues/106); plano e tarefas na worktree `feature-0023-issue-106-login-com-imagem-lateral` | Login em duas metades acima de 840 px, com a imagem fornecida à esquerda e formulário à direita; até 840 px, arte oculta e marca compacta. Mantidos apenas o login atual, seus estados e a API; sem cadastro, recuperação de senha ou Google. PR [#107](https://github.com/SamiaLuvanice/bestprice/pull/107) aberta para `develop`, ainda sem merge. | Revisão independente concluída após os ajustes de código; sincronização de onboarding nesta etapa final. | Frontend lint e build verdes, **288/288 testes**; backend Ruff verde, **158 passed, 2 skipped** com PostgreSQL descartável; Node **50/50**. QA em navegador a 320, 768 e 1280 × 640 px comprovou composição, controles na primeira dobra, estados de erro e foco; health da API HTTP 200. No SHA `380b8b7`, CI / CI, Frontend, Backend, Automation e PR policy verdes; Cloudflare Pages ainda em andamento na consulta, com comentário de deploy informando sucesso. Login bem-sucedido com conta real e comparação visual da área autenticada não foram exercitados. Ver [verification.md](../specs/0023-login-com-imagem-lateral/verification.md). |
| 0021-navegacao-por-rotas | Spec `pronta`; Issue [#93](https://github.com/SamiaLuvanice/bestprice/issues/93); plano e tarefas na worktree `feature-0021-issue-93-navegacao-por-rotas` | Cinco rotas React (`/login`, `/`, `/produtos`, `/produtos/:id`, `/alertas`), guard e retorno seguro ao login, detalhe por URL, alertas configurados paginados e links para produtos; sem alteração de API ou banco nesta spec. | Revisão independente do plano e do código; achados P2 sobre histórico e parada corrigidos e reaprovados; cobertura de regressão restaurada e revisada | Após incorporar `origin/develop` (`33346ed`), gates locais: frontend 288/288 testes em 26 arquivos, lint e build; backend 158 passed/2 skipped, 1 warning e Ruff; Node 50/50. Docker Desktop estava parado na primeira tentativa e foi recuperado antes dos gates. No primeiro CI da PR [#105](https://github.com/SamiaLuvanice/bestprice/pull/105), 1 de 288 testes frontend falhou por corrida de foco; após ajustar apenas a espera do teste, `npm test -- --run` passou localmente com 288/288 e lint passou. CI remoto no SHA `3c548ab`: Frontend, Backend, Automation, PR policy, CI agregado, sync/resolve e Cloudflare Pages verdes. Compose e navegador locais verificaram fallback, sessão, detalhe, alertas, foco, responsividade e parada real. QA adicional no IAB confirmou Enter no link de detalhe, nova aba direta, título/foco e proteção após logout; Ctrl+clique e bfcache não foram demonstrados. Ver [verification.md](../specs/0021-navegacao-por-rotas/verification.md). AC06 permanece parcial até abrir e recarregar as rotas na revisão implantada em `stage`; outros cenários não observados individualmente seguem discriminados na matriz. |
| 0018-backend-stage-render-supabase | Spec `implementada` após verificação de stage; Issue [#60](https://github.com/SamiaLuvanice/bestprice/issues/60); plano e tarefas T01–T12 registrados | #61, #66 e #68 integradas em `develop`; #62, #67 e #69 promoveram `stage`; #69 (`0b5aea4`) aplicou migration RLS `20261014rls` no Supabase e publicou Render API e Cloudflare Pages, ambos saudáveis | Revisões independentes da preparação e migration RLS sem achado bloqueante; QA público conferiu health, proxy, cookie, falha/recuperação do banco e ação de rollback do Render com deploy anterior do mesmo commit | CI #68: 154 testes backend com PostgreSQL. CI stage #69 verde às 16:42:07 UTC; deploy Render iniciou 16:42:09 UTC, Live e log Alembic para `20261014rls`. Supabase 10/10 RLS e 0 políticas; health direto/proxy 200. Banco pausado: API 503 seguro, Render health 503 e borda depois 502; restore recuperou health 200. Ação de rollback Render reimplantou deploy anterior do mesmo commit #67 antes da migration; reversão entre versões e rollback Pages não testados. #67 não é alvo compatível após #69. [verification.md](../specs/0018-backend-stage-render-supabase/verification.md) |
| 0017-redesign-pagina-login | Spec `implementada` (AC01–AC09), plano e tarefas T01–T12 registrados; Issue [#56](https://github.com/SamiaLuvanice/bestprice/issues/56) alinhada à spec; `spec-reviewer`: 1ª rodada reprovada (card com dados fictícios, controles sem efeito, validação indefinida), 2ª aprovada com ressalvas menores aplicadas | Entrada redesenhada com o novo `LoginForm` (coluna visual decorativa sem dados, vidro com fallback sólido, brilhos ambientes, "Mostrar senha", envio único e foco em Senha após falha); `App.tsx` passa a delegar os campos; ordem `-webkit-backdrop-filter` → `backdrop-filter` corrigida também nas superfícies da 0015 (o lightningcss descartava a forma sem prefixo); extensões em `designsystem/README.md`; código verificado em `49869a0`. PR [#57](https://github.com/SamiaLuvanice/bestprice/pull/57) integrada em `develop` (merge `793b880`); registro na Issue [#58](https://github.com/SamiaLuvanice/bestprice/issues/58) | `arch-reviewer`: 1ª rodada aprovada com ressalvas (`overflow: clip` sem fallback, `!important`, card sólido), 2ª **aprovada** com dois pontos cosméticos aceitos como limites; sem revisão humana registrada no GitHub; merge por SamiaLuvanice | Red → Green registrado; frontend lint verde, **253 testes** (23 arquivos, 3 execuções) e build verdes; intermitência do teste de foco corrigida (`App.test.tsx` ×8 sem falhas); QA em Chrome headless + axe sobre Compose isolado: AC01–AC09 aceitos no reteste, 0 violações axe em 320/1280 px e sem regressão na área autenticada a 1280 px; CI remoto da PR #57 verde (CI, Frontend, Backend, Automation, PR policy, resolve, sync). Ver [verification.md](../specs/0017-redesign-pagina-login/verification.md) |
| 0016-tema-claro-padrao | Spec `implementada` e plano/tarefas registrados; Issue [#52](https://github.com/SamiaLuvanice/bestprice/issues/52); registro na Issue [#54](https://github.com/SamiaLuvanice/bestprice/issues/54) | Tema claro fixo: removido o bloco `@media (prefers-color-scheme: dark)` de `frontend/src/styles.css`; `docs/apps/frontend.md` atualizado. PR [#53](https://github.com/SamiaLuvanice/bestprice/pull/53) integrada em `develop` (merge `f414674`) | Sem revisão independente registrada no GitHub; merge por SamiaLuvanice | Lint, **242 testes** e build verdes; CSS compilado sem `prefers-color-scheme` e com `color-scheme: light`; capturas em navegador pendentes (QA). Ver [verification.md](../specs/0016-tema-claro-padrao/verification.md) |
| 0015-redesign-design-system-oficial | Issue [#48](https://github.com/SamiaLuvanice/bestprice/issues/48); spec `implementada` (PR #49 integrado em `develop` em `0600cb3`; registro na Issue [#50](https://github.com/SamiaLuvanice/bestprice/issues/50)); plano com base `ab7ff8e` e tarefas T01–T12 | Redesign local da entrada e área autenticada: logo oficial, tokens verde/rosa, temas automáticos, vidro com fallback sólido e layout responsivo; regras da identidade e extensões documentadas. T01–T12; PR [#49](https://github.com/SamiaLuvanice/bestprice/pull/49) integrado — ajuste pós-review removeu `border-radius` da logo (AC02) | Spec-reviewer no intake; arch-reviewer e QA revalidados 13/10, inclusive o ajuste da logo: aprovado/aceito com ressalvas; correção AC02 da logo aplicada; contraste do vidro e artefatos TEMP como limites | Frontend lint, 242 testes e build verdes (reconfirmados); CI remoto verde no SHA final `9cb135e`; Chromium + axe: 170 capturas; QA pós-ajuste da logo: 12 cenários de logo (entrada/painel × claro/escuro × 320/768/1280) sem corte nem overflow, matriz completa não re-rodada; smoke health 200. Ver [verification.md](../specs/0015-redesign-design-system-oficial/verification.md) |
| 0014-project-ready-automatico | Spec (status `implementada`; aprovada com ressalvas pelo `spec-reviewer` na 2ª rodada), plano e tarefas registrados; Issue [#39](https://github.com/SamiaLuvanice/bestprice/issues/39); branch `feature/0014-issue-39-project-ready-automatico` | Project sync leva a Issue aberta sem responsável a Ready quando a spec está `pronta` na branch `feature/<spec>-issue-<n>-<slug>`: novo `.github/scripts/spec-status.cjs`, estado Ready em `project-state.cjs`, gatilho `push` em `feature/**` com filtro `specs/*/spec.md` e job `resolve` com concorrência por Issue em `project.yml`; `docs/github-workflow.md` e `docs/apps/infraestrutura.md` atualizados; PR [#42](https://github.com/SamiaLuvanice/bestprice/pull/42) integrado em `develop` (`6dc4b8c`) | `arch-reviewer` aprovado após 2 rodadas; QA aceito com ressalvas (critérios 8, 9 e 13 parciais ou por inspeção) | `node --test .github/scripts/*.test.cjs` **43 passed** e actionlint 1.7.12 verde; V04 executada no Project real com a Issue temporária #43: `rascunho`→Backlog, `pronta`→Ready, atribuir→In progress, remover→Ready, concorrência serializada em `project-43` com resultado final Ready; ver [verification.md](../specs/0014-project-ready-automatico/verification.md) |
| 0013-monitoramento-mercado-livre-brasil | Spec (status `rascunho`), plano e tarefas registrados; Issue [#34](https://github.com/SamiaLuvanice/bestprice/issues/34); branch `feature/0013-issue-34-monitoramento-mercado-livre`; PR [#35](https://github.com/SamiaLuvanice/bestprice/pull/35) integrado em `develop` (merge `513ef78`) | Fluxo MLB implementado: URL validada localmente, OAuth da conta operadora cifrado, cadastro e atualização com `Retry-After`/backoff/`not_found` de 24 h, trava advisory por publicação, worker isolado, alertas, notificações e dashboard. Em 11/10: AC-016 recusa variações ambíguas, preço divergente do `amount`/`regular_amount` e restrições de comprador como `unsupported_price_context`; dashboard mostra anterior, mínimo, máximo, variação e horários; layout mobile, contraste e diálogo acessível corrigidos (`fefb7bd`…`990ea3b`) | Revisão independente: rodadas de 09/10 aprovadas para PR; em 11/10, `5addb49..6e04908` e `6e04908..4b17304` aprovadas com ressalvas, todas as ressalvas importantes corrigidas em `6468647`, `8aad763` e `990ea3b`; PR #35 integrado em `develop` | Backend Ruff verde e pytest **149 passed** (PostgreSQL 17 isolado); frontend lint, **29 testes** e build verdes; inspeção Chromium + axe sem violações em desktop e mobile. 20 dos 22 ACs demonstrados (dublês e fixtures sintéticas onde indicado); AC-002 e AC-013 bloqueados por falta de credenciais reais do Mercado Livre, assim como o ciclo real do worker e as premissas de AC-016; ver [verification.md](../specs/0013-monitoramento-mercado-livre-brasil/verification.md) |
| 0010-onboarding-e-harness-da-stack-atual | Spec revisada; plano e tarefas registrados; Issue [#29](https://github.com/SamiaLuvanice/bestprice/issues/29) | Documentação, catálogo e limpeza no commit `4497793` da branch da feature | Revisão independente e QA documental sem achado bloqueante; PR [#30](https://github.com/SamiaLuvanice/bestprice/pull/30) aberta para `develop` | Gates locais e CI #37645230540 no SHA `8162835` passaram; integração PostgreSQL 18 executada; Docker/Compose pendente; ver [verification.md](../specs/0010-onboarding-e-harness-da-stack-atual/verification.md) |
| 0012-area-usuario-monitoramento | Spec somente de interface para o Mercado Livre sobre o contrato da 0013 (status `rascunho`, AC01–AC29), revisada em duas rodadas de `spec-reviewer`; plano e tarefas registrados; Issue [#33](https://github.com/SamiaLuvanice/bestprice/issues/33) | Implementada em `feature/0012-issue-33-area-usuario-monitoramento` (HEAD `384dcb6`), só frontend: cabeçalho com sino e conta, hero, indicadores, oportunidades, tabela “Seus produtos” com menu, Atualizar agora e parar com confirmação, detalhe, atualizações recentes e seção Alertas; `backend/` sem alteração; PR a abrir | `arch-reviewer` em 3 rodadas (I1–I2/M1–M10, N1–N5, N3/B/C/D, todos corrigidos); parecer final de `bad8dbe..384dcb6` aprovado sem achado bloqueante nem importante | Frontend lint, **241 testes** (22 arquivos) e build verdes; QA no navegador em 4 rodadas (Chromium + axe, Compose isolado, 320/360/768/1280 px, sem violações). **28 de 29 ACs demonstrados**; AC04 parcial: “Atualizar agora” com sucesso depende de credencial real do Mercado Livre (como AC-002/AC-013 da 0013); ver [verification.md](../specs/0012-area-usuario-monitoramento/verification.md) |
| 0009-skills-compativeis-com-a-stack | Spec/plano/tarefas registrados; Issue [#23](https://github.com/SamiaLuvanice/bestprice/issues/23) | Guias locais curados e integrados | Revisão documental sem bloqueios; PR [#25](https://github.com/SamiaLuvanice/bestprice/pull/25) integrada em `develop`; GitHub não registra aprovação humana | Último CI remoto verde; estrutura das três skills válida e adaptadores sincronizados; ver [verification.md](../specs/0009-skills-compativeis-com-a-stack/verification.md) |
| 0008-project-sync-by-branch | Spec/plano/tarefas registrados; Issue [#17](https://github.com/SamiaLuvanice/bestprice/issues/17) | Status do Project alinhado à branch-base e à taxonomia configurada | PR [#18](https://github.com/SamiaLuvanice/bestprice/pull/18) integrada em `develop` | CI remoto verde; workflow real sincronizou Issue #17 para `Develop`; ver [verification.md](../specs/0008-project-sync-by-branch/verification.md) |
| 0007-reinicio-fastapi-react-postgresql | Spec/plano/tarefas registrados; Issue [#15](https://github.com/SamiaLuvanice/bestprice/issues/15) | API FastAPI, SPA React, Compose e harness implementados | PR [#16](https://github.com/SamiaLuvanice/bestprice/pull/16) integrada em `develop` | Ver implementação em [verification.md](../specs/0007-reinicio-fastapi-react-postgresql/verification.md) |
| 0019-releases-por-tag-sem-main | Spec `implementada`; Issue [#77](https://github.com/SamiaLuvanice/bestprice/issues/77) e [#94](https://github.com/SamiaLuvanice/bestprice/issues/94); plano e tarefas T01–T12 registrados | Workflow por tag SemVer, políticas de PR/Project sem main, ruleset e docs atualizados; PR [#78](https://github.com/SamiaLuvanice/bestprice/pull/78) integrada em `develop` e promovida para `stage` via [#79](https://github.com/SamiaLuvanice/bestprice/pull/79) | arch-reviewer e QA aprovaram após correções documentais; spec-reviewer sem bloqueios | 50/50 testes Node; CI remoto verde. Tag de release `v0.1.0` executada com sucesso (Run [38765816883](https://github.com/SamiaLuvanice/bestprice/actions/runs/38765816883)), publicando backend e frontend no GHCR e criando GitHub Release com digests. Rulesets ativos (`integration-branches` e `delivery-tags`), default branch é `develop`, e branch remota `main` removida após confirmação explícita. Ver [verification.md](../specs/0019-releases-por-tag-sem-main/verification.md) |
| 0020-login-sem-bloco-superior | Spec `implementada`; Issue [#75](https://github.com/SamiaLuvanice/bestprice/issues/75); plano e tarefas registrados (renumerada de 0019) | Login direto sem cabeçalho e hero, validação própria no envio, botão ocupado com foco, logo e textos novos; só frontend; PR pendente | arch-reviewer sem bloqueio; achado de CSS corrigido | Frontend: lint limpo, 277/277 testes, build verde. QA no navegador (Chrome headless, API simulada, #83): todos os AC medidos e aprovados após corrigir o contraste de "Entrando…" (2,7→5,57:1); AC05 sem diferença de layout (0 diferenças em 9 combinações), aceito por valores após emenda do critério; PRs #82 e #84 integradas. Ver [verification.md](../specs/0020-login-sem-bloco-superior/verification.md) |
| 0022-conexao-resiliente-ao-banco | Spec `implementada` (AC01–AC07); Issue [#101](https://github.com/SamiaLuvanice/bestprice/issues/101); plano e tarefas T01–T13; `spec-reviewer` retornou achados e `arch-reviewer` do plano aprovou com ressalvas, ambas incorporadas | `backend/app/db.py` passa a expor `engine_kwargs()` e configura o pool de domínio com `pool_recycle=300 s`, `pool_use_lifo`, `pool_timeout=10 s` e `connect_timeout=5 s`, mantendo `pool_pre_ping`; health e Alembic seguem com conexão própria. Novos `tests/test_db_engine.py` (config) e `tests/test_db_engine_integration.py`; PR [#102](https://github.com/SamiaLuvanice/bestprice/pull/102) | `arch-reviewer` do diff **aprovado** sem bloqueadores (só notas menores); QA e CI verdes | `ruff` limpo; suíte backend **158 passed, 2 skipped** (POSIX) com PostgreSQL 17 isolado, head `20261014rls`; 6 testes da feature verdes com Red→Green registrado; health HTTP 200/503; CI da PR #102 verde; ver [verification.md](../specs/0022-conexao-resiliente-ao-banco/verification.md) |
