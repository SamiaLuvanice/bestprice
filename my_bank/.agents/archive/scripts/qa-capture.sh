#!/usr/bin/env bash
# Captura de evidência do QA visual — desktop e mobile, com procedência.
#
#   ./scripts/qa-capture.sh sprint-3                 # staging (padrão)
#   WEB_URL=http://localhost:5173 \
#   QA_API_URL=http://localhost:8000 \
#       ./scripts/qa-capture.sh sprint-3-local       # stack local
#   make qa-capture LABEL=sprint-3
#
#   QA_ONLY=kanban,samples-id-report ./scripts/qa-capture.sh sprint-4
#       fotografa só esses alvos — a sprint que acrescentou duas telas não
#       refaz as onze que já têm evidência.
#
#   QA_ID_SAMPLES=<uuid> ./scripts/qa-capture.sh sprint-4
#       fixa de qual registro a tela sai, para a tela que só existe em um
#       (o laudo mora na amostra que tem laudo).
#
# ## Por que este script existe
#
# O `playwright.config.ts` captura `only-on-failure`. É o certo para o roteiro
# de regressão — e significa que **uma rodada verde não produz captura
# nenhuma**. A regra `task-done-criteria` pede screenshot para fechar tarefa com
# UI, e não havia como produzir uma. Este é o caminho.
#
# ## Credencial vem do ambiente, e a falta dela para o script
#
# Sem credencial ele **não roda**. Fotografar a tela de login e arquivar como
# evidência da agenda é pior que não ter evidência: parece prova e não é.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LABEL="${1:-${QA_LABEL:-}}"
if [[ -z "$LABEL" ]]; then
  echo "✗ falta o rótulo da varredura." >&2
  echo "  uso: ./scripts/qa-capture.sh <rótulo>     ex.: sprint-3" >&2
  exit 2
fi

# O `.env` é ignorado pelo git e é onde as chaves QA_STAGING_* vivem. Valor já
# exportado no ambiente vence — quem quiser apontar para outro alvo, exporta.
if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a; source .env; set +a
fi

# O staging real deste projeto. Ver a skill `qa-visual` para as URLs e a conta.
WEB_URL="${WEB_URL:-${QA_STAGING_WEB_URL:-}}"
QA_API_URL="${QA_API_URL:-${QA_STAGING_API_URL:-}}"
QA_EMAIL="${QA_EMAIL:-${QA_STAGING_EMAIL:-}}"
QA_PASSWORD="${QA_PASSWORD:-${QA_STAGING_PASSWORD:-}}"

if [[ -z "$WEB_URL" || -z "$QA_API_URL" || -z "$QA_EMAIL" || -z "$QA_PASSWORD" ]]; then
  cat >&2 <<'FIM'
✗ sem credencial no ambiente — a captura não roda.

  Defina WEB_URL, QA_API_URL, QA_EMAIL e QA_PASSWORD (ou os equivalentes
  QA_STAGING_* que o .env carrega).

  Sem isso o navegador pararia na tela de login e a captura viraria evidência
  de nada — que é o defeito que este script existe para não repetir.
FIM
  exit 2
fi

DESTINO="$ROOT/docs/evidence/qa/$LABEL"
mkdir -p "$DESTINO"

# Procedência: sem ela, uma captura local passa por captura de staging na
# primeira vez que alguém abrir a pasta sem contexto.
if [[ "$WEB_URL" == *localhost* || "$WEB_URL" == *127.0.0.1* ]]; then
  AMBIENTE="**local** (stack do compose deste worktree) — **não é staging**"
else
  AMBIENTE="**staging**"
fi

cat > "$DESTINO/RESUMO.md" <<FIM
# Evidência de QA visual — $LABEL

| | |
|---|---|
| Ambiente | $AMBIENTE |
| SPA | \`$WEB_URL\` |
| API | \`$QA_API_URL\` |
| Conta | \`$QA_EMAIL\` |
| Capturado em | $(date -u +%Y-%m-%dT%H:%M:%SZ) (UTC) |
| Árvore local | \`$(git rev-parse --short HEAD 2>/dev/null || echo "?")\` |
| Como reproduzir | \`./scripts/qa-capture.sh $LABEL\` |

Gerado por \`scripts/qa-capture.sh\` + \`e2e/specs/captura.spec.ts\`.
As linhas abaixo saem da própria execução — inclusive as rotas que **não**
viraram imagem, com o motivo.

| Rota | Viewport | Arquivo | Situação |
|---|---|---|---|
FIM

echo "→ capturando $WEB_URL em $DESTINO"
cd "$ROOT/e2e"
QA_CAPTURE=1 \
QA_EMAIL="$QA_EMAIL" \
QA_PASSWORD="$QA_PASSWORD" \
QA_API_URL="$QA_API_URL" \
QA_OUT="$DESTINO" \
WEB_URL="$WEB_URL" \
  npx playwright test specs/captura.spec.ts "${@:2}"

echo "✓ evidência em docs/evidence/qa/$LABEL — leia o RESUMO.md antes das imagens"
