#!/usr/bin/env bash
# Roda o roteiro Playwright contra o SPA, usando a stack do compose.
#
#   ./scripts/e2e.sh
#   make e2e
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

[[ -f .env ]] || { echo "✗ .env não encontrado. Rode 'cp .env.example .env'."; exit 1; }

# shellcheck disable=SC1091
set -a; source .env; set +a

# Nome de projeto e portas próprios deste worktree — ver o cabeçalho do script.
# Vem depois do .env de propósito: valor fixado à mão lá continua vencendo.
# shellcheck disable=SC1090
eval "$("$ROOT/scripts/worktree-stack.sh")"
WEB_PORT="${WEB_PORT:-5173}"
WEB_URL="http://localhost:${WEB_PORT}"

# `--build` não é opcional: o SPA é assado na imagem, sem volume de código. Sem
# ele o Playwright exercita o frontend da última vez que alguém construiu — que
# num repositório com vários worktrees é o de outra branch.
echo "→ subindo a stack"
# `--remove-orphans` porque renomear um serviço no compose deixa o container do
# nome antigo de pé, segurando a porta — e o erro que aparece é "port is already
# allocated", que não aponta para a causa.
docker compose up -d --build --wait --remove-orphans

# Delegado ao Makefile: cada stack aplica migration do seu jeito, e este
# script é idêntico nos seis repositórios da família.
echo "→ aplicando migrations"
make migrate >/dev/null

# O auto-cadastro cria conta com o perfil de menor privilégio desde a 0005, e
# perfil Cliente não enxerga administração. Sem o seed a jornada de usuários não
# tem por onde entrar — foi assim que o E2E ficou vermelho.
echo "→ semeando contas de desenvolvimento"
make seed >/dev/null

echo "→ Playwright em $WEB_URL"
cd "$ROOT/e2e"
WEB_URL="$WEB_URL" npx playwright test "$@"

echo "✓ e2e passou"
