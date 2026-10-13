# Plano — 0018 Stage no Supabase, Render e Cloudflare Pages

## Estado e dependências

- `origin/stage` está atrás de `origin/develop`; a promoção por PR é necessária para
  colocar a configuração e a API atual na branch implantada.
- A Issue [#60](https://github.com/SamiaLuvanice/bestprice/issues/60) e a branch da
  feature existem. O projeto Supabase `bestprice-stage` foi criado em `sa-east-1`
  no plano Free. Os controles de cobrança dos três painéis foram inspecionados
  em 13/10/2026; Render e Pages ainda precisam de provisionamento. A
  documentação Render prevê suspensão dos serviços Free se a banda exceder a
  franquia enquanto não houver forma de pagamento cadastrada.
- A API já oferece `GET /api/health`, cujo `200` depende de `SELECT 1` no banco.
- O Dockerfile do backend inclui Alembic e Uvicorn. No Compose, a migration roda
  antes do servidor. A implementação da 0018 habilitou `Secure` em `stage` e
  `production`.
- O frontend chama `/api` por caminho relativo, compatível com um proxy Pages da
  mesma origem; o projeto não configura CORS.

## Desenho

1. Declarar um único serviço web `free` em `render.yaml`, com `runtime: docker`,
   contexto `backend`, branch `stage`, implantação após checks e health check
   `/api/health`. Não declarar PostgreSQL do Render nem worker pago.
2. No comando Docker do Render, executar `alembic upgrade head` e só então iniciar
   Uvicorn em `0.0.0.0` usando `PORT`. O plano gratuito não oferece comando de
   pré-deploy; a migration na inicialização replica o fluxo do Compose. A nova
   instância só receberá tráfego após o health check.
3. Definir `APP_ENV=stage` no serviço Render e fazer o cookie usar `Secure` em
   `stage` e `production`. A mudança preserva `development` sem Secure.
4. Configurar `DATABASE_URL` como segredo no Render com a string **Session pooler**
   do Supabase, porta 5432, `sslmode=require`, projeto exclusivo de stage. Essa
   modalidade oferece IPv4 e mantém estado de sessão necessário ao backend.
   Confirmar a execução real do Alembic pelo pooler. Os segredos Mercado Livre
   permanecem ausentes e `MERCADOLIVRE_THIRD_PARTY_VALIDATED=false`.
5. Criar o projeto Supabase no plano Free e tamanho de compute incluído. Não ativar
   IPv4 pago, backups/PITR pagos, compute adicional nem outro add-on. Usar o limite
   Free de banco como limite operacional: ao atingir a cota, o stage pode ficar
   somente leitura ou indisponível.
6. No Cloudflare Pages, vincular o mesmo repositório, selecionar `frontend/` como
   diretório raiz, usar `npm ci && npm run build` e `dist` como saída. Configurar
   `stage` como branch de produção do Pages. Adicionar uma Pages Function em
   `frontend/functions/api/[[path]].ts` que encaminha `/api/*` ao endereço Render
   configurado como variável não secreta `API_ORIGIN`. Incluir `_routes.json` na
   saída para invocar a Function só em `/api/*`; manter estáticos gratuitos.
7. Criar/vincular a Issue GitHub, trabalhar em worktree de `origin/develop`, abrir
   PR para `develop` e promover `develop` → `stage` por PR após os gates. Criar ou
   sincronizar os projetos Pages e Render. Conferir revisão, logs sem segredos,
   health público, login e cookie via HTTPS pela mesma origem.
8. Configurar o Render com o plano `free`, sem recursos adicionais. Desativar
   excedentes faturáveis: confirmar ausência de forma de pagamento; o limite de
   gasto do pipeline cobre somente minutos de build, não toda a banda de saída.
   Configurar Cloudflare Workers/Pages Free e organização Supabase Free, sem
   add-ons pagos. Confirmar os planos e limites no painel de cada fornecedor.
9. Documentar criação, variáveis, promoção, cotas gratuitas, suspensão ao exceder
   limites e reversão.
   Registrar limites reais do free tier e os resultados em `verification.md`.

## Arquivos previstos

| Arquivo | Alteração |
|---|---|
| `render.yaml` | Serviço web de stage, build Docker, branch, comando, health e variáveis |
| `frontend/functions/api/[[path]].ts`, `frontend/public/_routes.json` | Proxy de mesma origem da API |
| `docs/apps/infraestrutura.md`, `docs/apps/backend.md`, `docs/apps/frontend.md` | Operação e configuração de stage |
| `docs/architecture.md`, `docs/PROGRESS.md` | Topologia e estado comprovado |
| `specs/0018-*/verification.md` | Evidência real de gates e deploy |

## Riscos e limites

- O Render free hiberna após inatividade. Supabase Free pode pausar projeto com
  pouca atividade. Stage poderá ficar temporariamente indisponível.
- Render pode cobrar tráfego de saída ou minutos de pipeline excedentes quando há
  forma de pagamento na conta. A conta deve impedir excedentes faturáveis; plano
  `free` sozinho não garante cobrança zero nessa situação.
- Supabase Free possui cota de 500 MB por banco; acima dela, o banco pode entrar em
  modo somente leitura. Projetos Free pouco ativos podem ser pausados.
- Cloudflare Pages Functions consome a cota Free de Workers, atualmente limitada a
  100.000 solicitações por dia. Ao esgotá-la, as rotas dinâmicas podem falhar até
  a renovação diária.
- Sem worker gratuito dedicado, o monitoramento periódico não rodará nesse
  ambiente nesta entrega. A API e o banco serão exercitáveis; a atualização
  automática terá de ser planejada separadamente.
- A Pages Function adiciona execução de borda apenas às rotas `/api/*`; o arquivo
  `_routes.json` deve excluir os demais caminhos para evitar chamadas desnecessárias.
- A implantação da API depende dos checks do GitHub configurados no Render; os
  dois provedores precisam estar vinculados ao repositório e à branch corretos.
- Migrations antes de Uvicorn podem executar durante rollback e não são revertidas
  automaticamente. Verificar compatibilidade de schema antes de promover; para
  reversão, voltar ao último deploy compatível e tratar dados/schema em procedimento
  separado.
- `GET /api/health` comprova conexão ao banco, não migration, OAuth ou worker.
  A verificação incluirá consulta segura à revisão Alembic sem expor credenciais.
