# BestPrice

O [contexto do produto](docs/product-context.md) define a visão de monitoramento automático de preços, tendo o Mercado Livre Brasil como marketplace exclusivo desta fase (a premissa anterior era a Amazon). Esta branch implementa um fluxo inicial para publicações MLB: entrada por URL, histórico, dashboard, alertas e notificações em FastAPI, React e PostgreSQL. A integração real com anúncios de terceiros permanece desabilitada por padrão até validar autorização externa e configurar um token OAuth operacional.

## Preparar e executar localmente

Pré-requisitos: Python 3.13, uv, Node.js 22, npm e Docker Compose.

1. Copie `.env.example` para `.env` e substitua `POSTGRES_PASSWORD`.
2. Suba o banco com `docker compose up -d db`.
3. Em `backend/`, rode `uv sync --locked --extra dev`. Configure `DATABASE_URL` para o banco local, por exemplo `postgresql://bestprice:SENHA@localhost:5433/bestprice`, e execute `uv run alembic upgrade head`.
4. Ainda em `backend/`, crie uma conta com `uv run python -m app.auth.provision EMAIL`; a senha é solicitada sem eco. Inicie a API com `uv run uvicorn app.main:app --reload --port 8000`.
5. Em `frontend/`, rode `npm ci` e `npm run dev`. Abra <http://localhost:5173>. O Vite encaminha `/api` para a API local.

Também é possível subir a stack com `docker compose up --build`. Nesse modo, o backend aplica Alembic antes de iniciar; o worker espera o backend ficar saudável. Em worktree Windows, use `./scripts/compose-worktree.ps1 up --build` para isolar portas e volume. `docker compose down` preserva os dados.

O worker usa por padrão uma consulta por publicação a cada 3600 segundos, lote de 20, uma tentativa por vez e pausa de 60 segundos entre ciclos. `.env.example` permite ajustar `MONITOR_CHECK_INTERVAL_SECONDS`, `MONITOR_FRESHNESS_SECONDS`, `MONITOR_BATCH_LIMIT`, `MONITOR_MAX_CONCURRENCY` e `MONITOR_POLL_INTERVAL_SECONDS`. Defina a frequência e a concorrência conforme os limites oficiais da integração depois de validá-la; a [arquitetura](docs/architecture.md#estado-desta-branch) mostra padrões e faixas aceitas.

`GET /api/health` responde 200 quando o banco aceita `SELECT 1`; não testa o esquema nem a API externa. Sem validação oficial para anúncios de terceiros, mantenha `MERCADOLIVRE_THIRD_PARTY_VALIDATED=false`: consultas novas à publicação retornam 503. A API ainda rejeita URL inválida, link curto, busca ou categoria com 400 e mensagem específica, informa vínculo duplicado com 409, retoma um vínculo interrompido com 200 e aplica o intervalo mínimo de atualização com 429 antes de solicitar a integração. A interface permite entrar com conta provisionada e navegar pelos dados já existentes.

O código dispõe de armazenamento cifrado e renovação OAuth da conta operadora. Para uma operação autorizada, configure `MERCADOLIVRE_CLIENT_ID`, `MERCADOLIVRE_CLIENT_SECRET` e uma chave Fernet única em `MERCADOLIVRE_OAUTH_KEY`, fora do repositório. Obtenha os tokens iniciais pelo fluxo oficial de autorização da conta operadora e, em `backend/` com acesso ao banco e migrations aplicadas, execute `uv run python -m app.marketplace.provision`; o comando solicita access token, refresh token e validade restante no terminal. Provisione novamente se a renovação ficar bloqueada após uma resposta ambígua. Só ative `MERCADOLIVRE_THIRD_PARTY_VALIDATED=true` depois de confirmar permissão real para a finalidade. Ainda não foram usadas credenciais reais nem comprovados autorização inicial, renovação real ou acesso a anúncios de terceiros.

## Verificar

Em `backend/`: `uv run ruff check .` e `uv run pytest -q`; `TEST_DATABASE_URL` habilita testes contra PostgreSQL isolado. Em `frontend/`: `npm run lint`, `npm test -- --run` e `npm run build`. Resultados e limites desta branch estão em [spec 0013](specs/0013-monitoramento-mercado-livre-brasil/verification.md).

A [documentação de onboarding](docs/index.md) detalha arquitetura, esquema, módulos e infraestrutura. O processo de contribuição usa spec, plano, implementação, verificação, PR para `develop` e revisão independente. A publicação no GHCR após merge em `main` não configura implantação externa.
