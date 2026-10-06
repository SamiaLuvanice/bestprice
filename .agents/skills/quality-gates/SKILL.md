---
name: quality-gates
description: Rodar e interpretar lint, testes, build e automações da stack FastAPI/React.
---

# Portões de qualidade

Na worktree, após instalar dependências:

- backend/: uv sync --locked --extra dev; uv run ruff check .; uv run pytest -q
- frontend/: npm ci; npm run lint; npm test -- --run; npm run build
- raiz: node --test .github/scripts/*.test.cjs; actionlint nos workflows, quando instalado
- integração: PostgreSQL real via TEST_DATABASE_URL para pytest e Compose para o fluxo ponta a ponta.

Confirme contagem de testes maior que zero. Registre comando e resultado em verification.md; não marque skip ou teste não executado como verde. No GitHub, check agregador CI deve passar para a PR. Se ferramenta/serviço não estiver disponível, reporte pendência concreta.
