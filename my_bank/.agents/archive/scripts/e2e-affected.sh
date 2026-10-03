#!/usr/bin/env bash
# Roda só os specs de Playwright afetados pelo diff atual, para encurtar o
# ciclo de iteração — o `make e2e` completo leva 8-13 minutos, e rodá-lo a
# cada ajuste pequeno estava travando o monitoramento (timeout do shell) sem
# agregar informação nova na maior parte das vezes.
#
#   ./scripts/e2e-affected.sh              # compara contra origin/stage
#   BASE=origin/main ./scripts/e2e-affected.sh
#
# Isto é um acelerador de iteração, não substitui a exigência de
# `evidencia.md` §6: antes de abrir PR ou pedir revisão, rode o conjunto
# final (afetado ou completo, o que este script escolher) **duas vezes
# seguidas**, e as duas têm que dar verde — chame o script duas vezes, ou
# `make e2e` se ele decidir que o escopo é o completo.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BASE="${BASE:-origin/stage}"
git fetch origin "${BASE#origin/}" >/dev/null 2>&1 || true

# Compara contra o ponto onde a branch nasceu, não contra HEAD — assim pega
# tanto o que já foi commitado nesta branch quanto o que ainda está solto na
# árvore de trabalho (staged ou não). É isso que faz sentido enquanto se
# itera, antes do commit final.
MERGE_BASE="$(git merge-base "$BASE" HEAD)"
CHANGED="$(git diff --name-only "$MERGE_BASE" -- frontend/src backend/src contract/openapi.yaml e2e/ 2>/dev/null || true)"

if [[ -z "$CHANGED" ]]; then
  echo "→ nada mudou em frontend/backend/contrato/e2e contra $BASE — rodando o smoke (jornada.spec.ts) só para confirmar que a stack sobe"
  exec "$ROOT/scripts/e2e.sh" specs/jornada.spec.ts
fi

echo "→ arquivos mudados contra $BASE:"
echo "$CHANGED" | sed 's/^/  /'

# Tocar qualquer um destes força o conjunto completo: são arquivos
# compartilhados por várias telas, e foi exatamente aí que as regressões
# desta sessão apareceram (navegação, foco, breakpoint) — um spec isolado
# não pegaria.
SHARED_PATTERN='^(frontend/src/app/(layout|router)\.tsx|frontend/src/ui/(app-shell|side-nav)\.tsx|frontend/src/app/nav-items\.ts|frontend/src/(data|domain)/|backend/src/app/config/|backend/src/app/entities/errors\.py|backend/migrations/|contract/openapi\.yaml|e2e/apoio/)'

if echo "$CHANGED" | grep -qE "$SHARED_PATTERN"; then
  echo "→ o diff toca superfície compartilhada — rodando o conjunto completo (make e2e), não dá para reduzir com segurança"
  exec "$ROOT/scripts/e2e.sh"
fi

# Mapa página/rota/domínio → spec. Best-effort: qualquer coisa que não bater
# aqui cai no fallback (conjunto completo), de propósito — errar para o lado
# de rodar demais é seguro; errar para o lado de rodar de menos esconde
# regressão.
declare -A MAPA=(
  [agenda]="specs/agenda.spec.ts"
  [kanban]="specs/kanban.spec.ts"
  [amostra]="specs/amostra.spec.ts specs/agenda.spec.ts"
  [sample]="specs/amostra.spec.ts specs/agenda.spec.ts"
  [qr]="specs/amostra.spec.ts"
  [ensaio]="specs/ensaio.spec.ts specs/agenda.spec.ts"
  [test_result]="specs/resultado.spec.ts specs/ensaio.spec.ts"
  [test-result]="specs/resultado.spec.ts specs/ensaio.spec.ts"
  [resultado]="specs/resultado.spec.ts"
  [report]="specs/laudo.spec.ts specs/portal.spec.ts"
  [laudo]="specs/laudo.spec.ts"
  [portal]="specs/portal.spec.ts"
  [measurement]="specs/medicao.spec.ts specs/resultado.spec.ts"
  [medicao]="specs/medicao.spec.ts"
  [design-system]="specs/design-system.spec.ts"
  [theme]="specs/design-system.spec.ts"
)

SPECS=()
UNMAPPED=0
while IFS= read -r arquivo; do
  [[ -z "$arquivo" ]] && continue
  achou=""
  for chave in "${!MAPA[@]}"; do
    if [[ "$arquivo" == *"$chave"* ]]; then
      # shellcheck disable=SC2206
      SPECS+=(${MAPA[$chave]})
      achou=1
    fi
  done
  [[ -z "$achou" ]] && UNMAPPED=1
done <<<"$CHANGED"

if [[ "$UNMAPPED" == "1" || ${#SPECS[@]} -eq 0 ]]; then
  echo "→ pelo menos um arquivo mudado não bate com nenhuma área conhecida do mapa — rodando o conjunto completo, para não arriscar esconder regressão"
  exec "$ROOT/scripts/e2e.sh"
fi

# jornada.spec.ts sempre entra: é o smoke de login/sessão que quase todo
# resto depende, e é barato (menos de 1 minuto).
SPECS+=("specs/jornada.spec.ts")

# Deduplica mantendo a ordem.
declare -A VISTO=()
UNICOS=()
for s in "${SPECS[@]}"; do
  if [[ -z "${VISTO[$s]:-}" ]]; then
    VISTO[$s]=1
    UNICOS+=("$s")
  fi
done

echo "→ rodando só os specs afetados: ${UNICOS[*]}"
exec "$ROOT/scripts/e2e.sh" "${UNICOS[@]}"
