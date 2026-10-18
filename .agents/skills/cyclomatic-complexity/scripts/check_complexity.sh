#!/usr/bin/env bash
# Atalho para rodar a análise de complexidade a partir da raiz do projeto.
#
#   .agents/skills/cyclomatic-complexity/scripts/check_complexity.sh
#   .agents/skills/cyclomatic-complexity/scripts/check_complexity.sh backend/app/products
#   .agents/skills/cyclomatic-complexity/scripts/check_complexity.sh --changed origin/develop
#
# Todos os argumentos são repassados para complexity_report.py.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

if [[ -x "$PROJECT_ROOT/backend/.venv/bin/python" ]]; then
  PY="$PROJECT_ROOT/backend/.venv/bin/python"
elif [[ -x "$PROJECT_ROOT/backend/.venv/Scripts/python.exe" ]]; then
  PY="$PROJECT_ROOT/backend/.venv/Scripts/python.exe"
else
  PY="$(command -v python3 || command -v python)"
fi

cd "$PROJECT_ROOT" || exit 2
exec "$PY" "$SCRIPT_DIR/complexity_report.py" "$@"
