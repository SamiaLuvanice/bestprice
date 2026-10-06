# bestprice — base de estudos

Este repositório reinicia a aplicação em FastAPI (Python 3.13), React + TypeScript (Vite) e PostgreSQL 17. O histórico Git, as specs anteriores e os ADRs continuam como contexto histórico; a base atual implementa apenas a verificação de disponibilidade, sem funcionalidades de negócio. O harness em .agents/ coordena spec, TDD, revisão e verificação.

## Pré-requisitos

Python 3.13, uv, Node.js 22, npm, Docker com Compose para o PostgreSQL e Git. No Windows, PowerShell executa os auxiliares. Nenhum JDK ou CLI Angular é necessário.

## Desenvolvimento local

1. Copie .env.example para .env na raiz e troque POSTGRES_PASSWORD. O Compose lê .env automaticamente. Para iniciar só o banco: docker compose up -d db. A porta local padrão do banco é 5433, configurável por DB_PORT.
2. Em backend/, rode uv sync --locked --extra dev. Defina DATABASE_URL para postgresql://bestprice:<senha>@localhost:5433/bestprice e inicie uv run uvicorn app.main:app --reload --port 8000.
3. Em frontend/, rode npm ci e npm run dev. Abra http://localhost:5173. O Vite repassa /api para localhost:8000.
4. Consulte http://localhost:8000/api/health. Com o banco disponível, retorna HTTP 200 e JSON {"status":"ok","database":"ok"}. Sem banco, retorna 503 e ambos os campos unavailable. A interface só mostra sucesso após esse contrato. Não há autenticação ou esquema de domínio.

No PowerShell, uma URL local pode ser definida com $env:DATABASE_URL = 'postgresql://bestprice:senha@localhost:5433/bestprice'. No Bash, use export DATABASE_URL='...'. Se a senha tiver caracteres especiais em URL, faça o escape de URL apropriado.

## Stack inteira no Compose

Com .env criado, rode docker compose up --build. A SPA fica em http://localhost:5173 e a API em http://localhost:8000. O serviço frontend usa proxy /api para backend. docker compose down para os containers e preserva o volume db-data; não use -v se quiser preservar dados.

Em uma worktree, use .\scripts\compose-worktree.ps1 up --build e depois .\scripts\compose-worktree.ps1 down. O auxiliar deriva projeto, portas e volume isolados da branch. O volume anterior do checkout principal pode conter credenciais/esquema antigos; preserve-o e use uma worktree isolada para comprovar a base nova. Não pressuponha migração automática.

## Verificação e processo

Em backend/: uv run ruff check . e uv run pytest -q com TEST_DATABASE_URL de banco isolado. Em frontend/: npm run lint, npm test -- --run e npm run build. Automação: node --test .github/scripts/*.test.cjs; workflows: actionlint. O CI executa esses gates e agrega no check obrigatório CI.

Siga /spec → /plan → /implement → /verify. Uma feature usa Issue, worktree de origin/develop, PR para develop, check CI e revisão independente. A skill .agents/skills/agent-orchestration/SKILL.md coordena papéis. Veja docs/github-workflow.md. GitHub Project depende de acesso e configuração; release GHCR depende da promoção até main; implantação externa ainda não está configurada.

Para sincronizar projeções do harness, execute .\.agents\sync.ps1 no Windows ou bash .agents/sync.sh no Unix. Diagnóstico: .\scripts\diagnose-harness.ps1. Nunca versione .env, credenciais ou dumps de banco.
