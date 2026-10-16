# Evidências — 0021

## Planejamento em 15/10/2026

- Issue #93 criada no intake e branch vinculada pelo comando `gh issue develop 93
  --repo SamiaLuvanice/bestprice --base develop --name
  feature/0021-issue-93-navegacao-por-rotas` (saída com URL da branch, código 0).
- `git fetch origin` concluído; `git show-ref --verify refs/remotes/origin/develop`
  confirmou `80b3eae94cd7fa493770657aa5a63ae58e194195`.
- `git worktree add .worktrees/feature-0021-issue-93-navegacao-por-rotas --track -b
  feature/0021-issue-93-navegacao-por-rotas origin/feature/0021-issue-93-navegacao-por-rotas`
  criou a worktree na base esperada, código 0.
- `pre-commit install --hook-type pre-commit --hook-type commit-msg` concluiu com
  ambos os hooks instalados, código 0.
- Spec e revisão do intake copiadas para a worktree; originais do checkout principal
  preservados. Os novos documentos de planejamento ficam na worktree.
- Inspeção de rotas, modelos e cliente confirmou que monitoramentos paginados já
  incluem alerta, que detalhe aceita consulta direta por UUID e que respostas têm
  identificação do monitoramento. Não foi identificado contrato novo necessário.
- Agente frontend forneceu análise em leitura; arch-reviewer revisou o plano
  independentemente sem bloqueios, com correção textual do 404 de alerta aplicada.
- `git diff --cached --check` passou, código 0, para os seis arquivos documentais.

## Limites da etapa de planejamento

Na etapa documental, implementação, testes, lint, build e fluxo no navegador ainda
não tinham sido executados. O preenchimento das tarefas de preparação não representou
aceite da implementação. As evidências posteriores constam abaixo. Stage só poderá
demonstrar AC06 quando contiver a revisão implementada.

## Implementação e gates em andamento — 15/10/2026

- O frontend iniciou implementação em `frontend/`: rotas e sessão, detalhe por URL,
  links de navegação e alertas configurados. Teste focalizado de allowlist teve Red
  esperado (3 falhas por rotas ainda não aceitas) e depois Green (16/16).
  `npm run build` passou no estado intermediário, segundo execução do implementador.
- Para preparar integração, foi criado `.env` local ignorado pelo Git, com senha
  aleatória não registrada aqui; `scripts/compose-worktree.ps1 up` iniciou somente
  PostgreSQL 17 da worktree na porta local 35233. `scripts/compose-worktree.ps1 ps`
  mostrou `db` saudável; `bestprice_test` foi criado separado do banco da aplicação.
- `uv sync --locked --extra dev` instalou 34 pacotes na `.venv` da worktree.
  `uv run` encontrou erro de permissão no cache do sandbox; os comandos seguintes
  executaram os binários da `.venv` diretamente.
- Backend: `.venv/Scripts/ruff.exe check .` passou. A primeira tentativa de pytest
  usou, por erro no comando de preparação, uma senha vazia e demorou 52 min:
  25 falhas de conexão, 127 aprovados, 2 ignorados. Isso não constitui falha do
  código; `passwordLength=0` e `psycopg.OperationalError: no password supplied`
  demonstraram a causa. A restrição de rede do sandbox também impediu TCP para a
  porta local; fora dela, `Test-NetConnection` retornou `True`.
- Corrigida a leitura da variável local, uma conexão direta `psycopg` retornou `(1,)`.
  `.venv/Scripts/python.exe -m pytest -q --tb=short` com `TEST_DATABASE_URL` e
  `DATABASE_URL` apontando para `bestprice_test` terminou com **152 passed, 2 skipped,
  1 warning em 44,67 s**. Dois skips incluem ao menos o teste de script POSIX no
  Windows; não são contados como aceites.
- Frontend intermediário: `npm test -- --run` executou **298 testes: 167 passed,
  131 failed** (13 arquivos falharam, 13 passaram). A maior parte dos testes antigos
  renderiza todas as seções na raiz ou espera detalhe modal; há também casos de
  comportamento que exigem correção. Resultado vermelho ainda não é gate final.
- Automação: `node --test .github/scripts/*.test.cjs` passou com **50/50 testes**,
  sem falha nem skip (330,934 ms).
- Após correções de implementação e revisão, a coordenação executou uma primeira
  rodada verde do gate frontend na worktree: `npm test -- --run --maxWorkers=1
  --fileParallelism=false --reporter=dot` terminou com **278/278 testes em 26
  arquivos** (262,30 s); `npm run lint` terminou com código 0; `npm run build`
  terminou com código 0 e 58 módulos transformados. `git diff --check` também
  terminou com código 0. O frontend Compose foi reconstruído com o código de produção.
  O revisor independente reaprovou as correções dos achados P2 sobre histórico
  e parada. Após restaurar quatro coberturas de regressão, execuções completas
  intermediárias tiveram duas falhas de corrida em testes cada (286/288). A espera
  pelo foco inicial foi ajustada no harness de testes, sem mudança de produção.
  O gate definitivo `npm test -- --run --maxWorkers=1 --fileParallelism=false
  --reporter=dot` terminou com **288 passed/288 em 26 arquivos**, código 0,
  em 120,70 s. `npm run lint`, `npm run build` (58 módulos) e `git diff --check`
  também terminaram com código 0 após as últimas alterações dos testes. O revisor
  independente confirmou as quatro coberturas restauradas. Os resultados vermelhos
  intermediários acima não são o gate final.

Este registro distingue tentativas de infraestrutura, estado intermediário da
implementação e gates válidos. A matriz abaixo separa o que foi observado em QA
local dos cenários ainda pendentes.

## QA local em andamento — 15/10/2026

Os comandos abaixo foram executados na worktree. O sandbox bloqueou o pipe Docker
(`Acesso negado`) e conexões TCP para `127.0.0.1` (`soquete ... proibida pelas
permissões de acesso`). As leituras seguintes usaram execução autorizada fora do
sandbox; a primeira tentativa bloqueada não comprova indisponibilidade dos serviços.

- `Invoke-WebRequest http://127.0.0.1:21233/api/health`: HTTP 200,
  `{"status":"ok","database":"ok"}` com PostgreSQL disponível.
- `Invoke-WebRequest` para `/`, `/login`, `/produtos`,
  `/produtos/00000000-0000-0000-0000-000000000000`, `/alertas` e
  `/rota-inexistente` em `http://127.0.0.1:28233`: HTTP 200 em cada caminho.
  Isso comprova o fallback HTTP do Nginx para a SPA; a renderização e os guards
  dependem de observação no navegador.
- `Invoke-WebRequest http://127.0.0.1:28233/api/health`: HTTP 200 via proxy.
  `Invoke-WebRequest http://127.0.0.1:28233/api/tracked-products` sem cookie:
  HTTP 401, em vez de HTML da SPA. O proxy `/api/*` permaneceu separado.
- Com autorização da coordenação após a inspeção no navegador, `docker compose
  --project-name bestprice-feature-0021-issue-93-navegacao-5074bcc1 -f
  docker-compose.yml stop db` interrompeu apenas o banco local. `curl.exe -sS -i
  --max-time 5 http://127.0.0.1:21233/api/health` retornou **HTTP 503** e
  `{"status":"unavailable","database":"unavailable"}`. O bloco `finally`
  executou `docker compose ... start db` (código 0); nova consulta à API
  confirmou **HTTP 200** e `{"status":"ok","database":"ok"}`. A primeira
  tentativa com `Invoke-WebRequest` não capturou o corpo 503 porque o objeto de
  resposta foi descartado; o banco também foi restaurado nessa tentativa.
- Fixtures descartáveis inseridas por `docker compose --project-name
  bestprice-feature-0021-issue-93-navegacao-5074bcc1 -f docker-compose.yml exec
  -T db psql ...` no banco local da worktree para `qa-0021-local@example.test`:
  23 monitoramentos, três alertas e duas notificações. Produtos 01 e 02 têm alertas
  ativo e pausado; Produto 22 tem alerta além da primeira página; Produto 23 está
  interrompido e conserva notificação antiga. Detalhes de referência:
  `/produtos/00210002-0000-4000-8000-000000000001` (ativo) e
  `/produtos/00210002-0000-4000-8000-000000000023` (interrompido).
  A primeira tentativa de inserção falhou por `failure_count` obrigatório e foi
  revertida pela transação; a segunda concluiu com contagens 23/3/2.

### Matriz de comprovação em andamento

Nenhum item abaixo está marcado como aceito apenas pelos testes automatizados ou
pelo fallback HTTP. A coordenação relatou inspeção da versão final local no
navegador autenticado com a conta QA: detalhe ativo por URL com título e foco;
detalhe interrompido sem ações de atualizar, alerta ou parar; Alertas com estados
ativo e pausado e Produto 22 além da primeira página; notificação antiga do
Produto 23 abriu seu detalhe sem alterar as duas não lidas no sino;
voltar/avançar; rota desconhecida mostrou página 404, link para Início e foco no
título; logout de Produtos levou a `/login`, e voltar até o detalhe protegido
redirecionou a `/login?returnTo=<id>` sem dados; recarga preservou a query e o
login retornou ao detalhe 23. Início, Produtos, detalhe e Alertas não tiveram
overflow horizontal a 320, 768 e 1280 px; foco e título de página foram
conferidos. No Produto 01, com alerta ativo, a confirmação mostrou o efeito de
pausar o alerta; cancelar manteve a URL e devolveu foco ao botão de parar; confirmar
enviou `DELETE`, navegou para `/produtos`, anunciou “Você parou de monitorar este
produto.” e focou o título “Seus produtos”. A fixture do Produto 01 terminou
inativa. Estados simulados de erro, superfícies não citadas e stage continuam
separados dessas observações.

| AC | Meio de comprovação | Situação nesta rodada |
|---|---|---|
| 01 | Testes de rotas; navegador autenticado nas quatro rotas, inclusive detalhe próprio. | Fallback HTTP e detalhe ativo direto observados; Início, Produtos e Alertas foram visitados na inspeção de layout. |
| 02 | Testes de guard e navegador visitante com retorno para detalhe após login. | Após logout, voltar a detalhe protegido redirecionou ao login sem dados e o login retornou ao ID; entrada inicial visitante em cada rota não foi observada. |
| 03 | Login direto e login já autenticado no navegador. | Navegador pendente. |
| 04 | Testes de allowlist para destino externo, codificado, desconhecido e `/login`. | Suíte frontend final verde; casos específicos de allowlist estão em `returnTo.test.ts`, sem inspeção manual desta rodada. |
| 05 | Voltar/avançar real por Início, Produtos, detalhe e Alertas, com seção ativa. | Voltar/avançar observado no navegador; ordem completa e seção ativa não foram descritas individualmente. |
| 06 | Abertura direta e recarga no Nginx local e na revisão implantada em stage. | Fallback HTTP local e detalhe direto no navegador observados; recarga de login com query observada; stage pendente. |
| 07 | Dashboard, oportunidades, atualizações e formulário com dados/vazio. | Fixtures prontas; navegador pendente. |
| 08 | Produtos, carregar mais e formulário só por link. | 23 fixtures prontas; navegador pendente. |
| 09 | Cadastro sucesso/erro/duplicidade por teste; operação real depende do Mercado Livre. | Limite externo pendente; navegador/resultado de testes a registrar. |
| 10 | Detalhe direto, lista, oportunidade e timeline; histórico e ações. | Detalhe ativo direto com título/foco observado; entradas por lista, oportunidade, timeline e ações não descritas individualmente. |
| 11 | Grupos distintos; três páginas, página sem alerta, pausado, retry e notificações. | Ativo, pausado, Produto 22 além da primeira página e notificações observados; erros/retry pendentes. |
| 12 | Sino e notificações abrem ID do monitoramento sem marcar leitura. | Notificação antiga do Produto 23 abriu seu detalhe, e sino permaneceu com duas não lidas; marcar como lida separadamente não foi observado. |
| 13 | UUID inválido, ausente e alheio sem dados; falha transitória com retry. | HTTP fallback comprovado, estado de UI pendente. |
| 14 | 401 em sessão ativa e falha temporária de `/auth/me`; retorno e retry. | Navegador/simulação pendentes. |
| 15 | Logout, voltar/avançar, recarga e restauração por bfcache em navegador real. | Logout de Produtos foi a login; voltar a detalhe protegido não exibiu dados. Avançar, recarga de rota protegida e bfcache não foram descritos individualmente. |
| 16 | Rota desconhecida para visitante e autenticado, sem loop. | Autenticado: página 404, link para Início e foco no h1 observados; visitante não observado no navegador. |
| 17 | Teclado, nova aba, foco, títulos e `aria-current` em navegador real. | Foco e títulos conferidos; acionamento por teclado, nova aba e `aria-current` não foram descritos individualmente. |
| 18 | Viewports 320, 768 e 1280 px sem overflow ou corte. | Início, Produtos, detalhe e Alertas sem overflow horizontal nas três larguras; login e acesso a todas as ações principais não foram descritos. |
| 19 | Recarregar login com `returnTo` e rejeitar retorno para `/login`. | Recarga preservou query e login retornou ao detalhe 23; destino `/login` testado na suíte, sem observação manual. |
| 20 | Parada com confirmação, cancelamento, sucesso/falha, anúncio e foco. | Produto 01 com alerta ativo: efeito no alerta mostrado; cancelamento manteve URL/foco; confirmação enviou `DELETE`, levou a Produtos, anunciou sucesso e focou o título. Falha de parada não observada no navegador. |
| 21 | Detalhe interrompido por URL e notificação antiga sem ações ativas. | Produto 23 interrompido observado por detalhe e notificação antiga, sem ações de atualizar, alerta ou parar. |

Stage só pode fechar AC06 quando a revisão da feature for
promovida a `stage` e estiver implantada nos serviços correspondentes; preview não
substitui essa evidência. O cadastro real de anúncio novo permanece limitado pela
autorização da integração Mercado Livre, desabilitada neste ambiente.

## Sincronização documental

Após os gates e a revisão independentes, o agente `doc-sync-onboarding` conferiu o
diff de código, `AGENTS.md`, `CLAUDE.md`, `docs/index.md` e `frontend/nginx.conf`.
Atualizou `README.md`, `docs/architecture.md`, `docs/apps/frontend.md`,
`docs/apps/infraestrutura.md`, `docs/PROGRESS.md`, este registro e `tasks.md` para
descrever as rotas, os estados e os limites verificados. Os quatro arquivos
conferidos não exigiram edição. `git diff --check` passou após essa sincronização.

## Revalidação após atualização de `develop`

O merge `33346ed` incorporou `origin/develop`, incluindo a suíte backend da spec
0022, sem alterar o comportamento da navegação da 0021. Na primeira tentativa de
revalidar, o Docker Desktop estava parado; após recuperá-lo, a coordenação executou
os gates na worktree. Frontend: **288 passed/288 em 26 arquivos**, lint e build
passaram. Backend: Ruff passou e pytest terminou com **158 passed, 2 skipped,
1 warning**. A suíte de automação terminou com **50/50**. A interrupção
inicial foi de infraestrutura local e não representa falha desses gates.

O agente `doc-sync-onboarding` reviu `AGENTS.md`, `CLAUDE.md`, `docs/index.md`,
`frontend/nginx.conf` e a documentação afetada após o merge. As orientações de
onboarding não mudaram; `docs/apps/backend.md` e `docs/database.md` já documentam
a spec 0022 incorporada. As contagens da 0021 foram atualizadas neste registro e
em `docs/PROGRESS.md`. AC06 permanece pendente de verificação em `stage`.
