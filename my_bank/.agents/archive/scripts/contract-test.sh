#!/usr/bin/env bash
# Valida o backend em execução contra contract/openapi.yaml.
#
# Sobe nada: espera a api já de pé (make up). Usa Schemathesis, que gera casos a
# partir do próprio contrato — inclusive os que ninguém lembraria de escrever.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# A porta publicada vem do .env, como no compose. Sem isto o script mira 8000
# enquanto a stack está em outra porta — e o erro aparece como timeout.
if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a; source .env; set +a
fi

# Nome de projeto e portas próprios deste worktree — ver o cabeçalho do script.
# Vem depois do .env de propósito: valor fixado à mão lá continua vencendo.
# shellcheck disable=SC1090
eval "$("$ROOT/scripts/worktree-stack.sh")"

BASE_URL="${BASE_URL:-http://localhost:${API_PORT:-8000}}"
SPEC="${SPEC:-contract/openapi.yaml}"
CONFIG="${CONFIG:-schemathesis.toml}"

[[ -f "$SPEC" ]] || { echo "✗ contrato não encontrado: $SPEC"; exit 1; }

echo "→ aguardando $BASE_URL/api/v1/health/ready"
for i in $(seq 1 30); do
  if curl -fsS "$BASE_URL/api/v1/health/ready" >/dev/null 2>&1; then
    echo "  api pronta"
    break
  fi
  [[ $i -eq 30 ]] && { echo "✗ api não respondeu em 60s. Rode 'make up' antes."; exit 1; }
  sleep 2
done

# Sem credencial, toda rota protegida devolve 401 e o Schemathesis nunca chega a
# validar um 200 delas contra o schema. Foi assim que uma resposta de /users com
# a paginação achatada — quando o contrato a declara aninhada em `meta` — passou
# batido em duas stacks, e só o e2e pegou.
#
# A sessão vem do **seed**, não de auto-cadastro. Desde a 0005 quem se cadastra
# sozinho nasce com o perfil de menor privilégio, que não alcança quase nada: as
# rotas de escrita paravam no 403 e os `GET /{id}` no 404, e o teste ficava
# verde sem nunca ter validado um 200 contra o schema — exatamente o que o
# parágrafo acima existe para impedir.
echo "→ semeando e obtendo uma sessão de administrador"

make seed >/dev/null || {
  echo "✗ não consegui semear as contas"
  echo "  a base pode não estar migrada — rode 'make migrate' antes"
  exit 1
}

CONTA="${CONTRACT_EMAIL:-}"
SENHA="${SEED_PASSWORD:-}"
[[ -n "$CONTA" && -n "$SENHA" ]] || {
  echo "✗ defina CONTRACT_EMAIL e SEED_PASSWORD no ambiente"
  exit 1
}

TOKEN="$(
  curl -fsS -X POST "$BASE_URL/api/v1/auth/login" \
    -H 'content-type: application/json' \
    -d "{\"email\":\"$CONTA\",\"password\":\"$SENHA\"}" \
  | sed -n 's/.*"access_token"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p'
)"

[[ -n "$TOKEN" ]] || { echo "✗ não consegui obter o access token"; exit 1; }

echo "→ validando o contrato contra $BASE_URL"

# O Git Bash no Windows reescreve todo argumento que parece caminho POSIX: o
# `/api/v1/auth/logout` do `--exclude-path` chegava ao Schemathesis como
# `C:/Program Files/Git/api/v1/auth/logout`, que não casa com operação nenhuma.
# O sintoma era o portão vermelho por uma rota que a exclusão devia ter tirado,
# com o aviso "Unmatched filters" no meio de outros quarenta — e verde no CI,
# que roda em Linux e não sofre a conversão (`Selected: 57/58` lá contra
# `58/58` aqui). Quarto caso da mesma família da nota de plataforma da spec
# 0023.
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

# Argumentos comuns. O caminho do contrato entra separado porque dentro do
# container ele fica montado em /contract.
ARGS=(
  --url "$BASE_URL"
  --checks all
  --max-examples 40
  --exclude-path /api/v1/auth/logout
  --header "Authorization: Bearer $TOKEN"
)

# A configuração é passada por caminho explícito, nunca por autodescoberta.
# O Schemathesis procura `schemathesis.toml` a partir do diretório de trabalho,
# e o diretório de trabalho não é o mesmo nos três ramos abaixo — dentro do
# container ele não é sequer o repositório. Foi assim que a configuração deixou
# de ser lida no CI enquanto passava na máquina de quem a escreveu: o portão
# ficou desligado sem que ninguém tivesse decidido desligá-lo.
[[ -f "$CONFIG" ]] || {
  echo "✗ configuração não encontrada: $CONFIG"
  echo "  Ela carrega o dicionário de documentos válidos e as duas exceções de"
  echo "  validação fora do alcance do schema. Sem ela o teste não vale."
  exit 1
}

if command -v schemathesis >/dev/null 2>&1; then
  schemathesis --config-file "$CONFIG" run "$SPEC" "${ARGS[@]}"
elif command -v uvx >/dev/null 2>&1; then
  uvx --from schemathesis schemathesis --config-file "$CONFIG" run "$SPEC" "${ARGS[@]}"
else
  echo "  (schemathesis local não encontrado — usando o container)"
  docker run --rm --network host \
    -v "$ROOT/$(dirname "$SPEC"):/contract:ro" \
    -v "$ROOT/$CONFIG:/schemathesis.toml:ro" \
    schemathesis/schemathesis:stable \
    --config-file /schemathesis.toml \
    run "/contract/$(basename "$SPEC")" "${ARGS[@]}"
fi

echo "✓ o backend cumpre o contrato"
