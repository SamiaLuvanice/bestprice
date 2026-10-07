# BestPrice — base de estudos

**Documentação de onboarding:** [abra o índice de `docs/`](docs/index.md) para seguir a leitura recomendada, consultar arquitetura, banco e guias dos módulos.

O repositório contém uma base de estudos em **FastAPI (Python 3.13)**, **React + TypeScript (Vite)** e **PostgreSQL 17**. Hoje, a aplicação demonstra apenas que a interface consegue consultar a API e que a API consegue verificar uma conexão real com o banco. Não há funcionalidades de negócio, autenticação ou dados de domínio.

## Pré-requisitos

- Git
- Python 3.13 e [uv](https://docs.astral.sh/uv/)
- Node.js 22 e npm
- Docker com Docker Compose (para PostgreSQL ou para executar a stack inteira)
- PowerShell no Windows para `scripts/compose-worktree.ps1`

## Rodar localmente

1. Na raiz, copie `.env.example` para `.env` e substitua `POSTGRES_PASSWORD` por uma senha local. O Compose lê esse arquivo automaticamente. `.env` é ignorado pelo Git.
2. Inicie o banco: `docker compose up -d db`. Por padrão, ele fica em `localhost:5433`; a porta dentro do Compose é `5432`.
3. Em `backend/`, instale as dependências: `uv sync --locked --extra dev`.
4. Em PowerShell, configure a URL da aplicação (ajuste a senha): `$env:DATABASE_URL = 'postgresql://bestprice:senha@localhost:5433/bestprice'`. Em Bash, use `export DATABASE_URL='postgresql://bestprice:senha@localhost:5433/bestprice'`. Escape caracteres reservados da senha conforme a sintaxe de URL.
5. Ainda em `backend/`, inicie a API: `uv run uvicorn app.main:app --reload --port 8000`.
6. Em outro terminal, entre em `frontend/`, rode `npm ci` e `npm run dev`. Abra <http://localhost:5173>. O Vite encaminha `/api` para a API em `localhost:8000`.
7. Acesse <http://localhost:8000/api/health>. Com PostgreSQL acessível, a resposta é HTTP 200 e `{"status":"ok","database":"ok"}`. Sem banco ou sem configuração, a resposta é HTTP 503 e ambos os campos são `unavailable`.

Não há migrações ou criação de usuário administrador: a aplicação ainda não tem tabelas de domínio, autenticação ou painel administrativo. O container oficial inicializa o banco vazio com as credenciais definidas no `.env`.

## Executar a stack pelo Compose

Com `.env` configurado, rode `docker compose up --build`. A interface fica em <http://localhost:5173>, a API em <http://localhost:8000> e o PostgreSQL é publicado em `localhost:5433`. A SPA usa Nginx para encaminhar `/api/` ao backend. `docker compose down` remove os containers, preservando o volume `db-data`; não use `-v` se quiser preservar esse volume.

Em uma worktree, use `./scripts/compose-worktree.ps1 up --build` e `./scripts/compose-worktree.ps1 down` no PowerShell. O script deriva um nome de projeto e portas isolados da worktree; consulte [infraestrutura](docs/apps/infraestrutura.md).

## Arquitetura e operação

```mermaid
graph LR
  Browser[Navegador] -->|Vite / Nginx: /api/health| API[FastAPI]
  API -->|SELECT 1| DB[(PostgreSQL)]
```

O backend está em `backend/app/`; a SPA está em `frontend/src/`. O Compose, os Dockerfiles, o proxy Nginx e os workflows GitHub completam a infraestrutura. O CI valida backend, frontend e automações; após promoção para `main`, o workflow de entrega publica imagens no GHCR e cria uma release. **Implantação externa não está configurada.** Consulte [arquitetura](docs/architecture.md), [banco](docs/database.md), [infraestrutura](docs/apps/infraestrutura.md) e [fluxo GitHub](docs/github-workflow.md).

## Verificações locais

- Backend: em `backend/`, `uv run ruff check .` e `uv run pytest -q`. Os testes de integração usam `TEST_DATABASE_URL` e são ignorados se ela não estiver definida.
- Frontend: em `frontend/`, `npm run lint`, `npm test -- --run` e `npm run build`.
- Automação/workflows: `node --test .github/scripts/*.test.cjs` e `actionlint` (instalado no CI via Go).

## Processo de contribuição

O fluxo ativo é `/spec` → `/plan` → `/implement` → `/verify`, com Issue, worktree baseada em `origin/develop`, PR para `develop`, CI e revisão independente. A configuração dos agentes fica em `.agents/`; o processo e suas dependências externas estão descritos em [docs/github-workflow.md](docs/github-workflow.md). O GitHub Project depende de configuração de credenciais e implantação externa ainda não existe.
