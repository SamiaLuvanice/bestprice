---
name: monorepo-navigation
description: Localizar código, specs, harness e comandos desta stack FastAPI/React/PostgreSQL.
---

# Navegação

backend/ contém FastAPI, pyproject.toml, testes e Dockerfile. frontend/ contém React + Vite, package.json, testes e Dockerfile. specs/ contém contrato e aceite. .agents/ é a fonte das instruções; docs/ explica o fluxo.

Backend local: crie .venv, instale uv sync --locked --extra dev dentro de backend; defina DATABASE_URL; execute uvicorn app.main:app --reload --port 8000. Frontend: npm ci e npm run dev em frontend, porta 5173 e proxy /api → localhost:8000. Banco: docker compose up -d db após criar .env. Stack inteira: docker compose up --build. Em worktree, use scripts/compose-worktree.ps1 para portas e volume isolados. Gates: quality-gates.
