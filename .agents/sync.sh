#!/usr/bin/env bash
# Wrapper Unix/Git Bash: a implementação única está em .agents/scripts/sync.mjs.
#   bash .agents/sync.sh [--with-opencode] [--with-cursor] [--check]
set -euo pipefail
exec node "$(dirname "${BASH_SOURCE[0]}")/scripts/sync.mjs" "$@"
