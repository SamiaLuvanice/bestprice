#!/usr/bin/env bash
# Nome de projeto e portas próprios para cada worktree. Para ser **carregado**,
# não executado:
#
#   eval "$(scripts/worktree-stack.sh)"
#
# ## Por que
#
# O compose usa `name: ${APP_NAME:-samia-dev}` e publica `${API_PORT:-8000}` e
# `${WEB_PORT:-5173}`. Os três saem do `.env`, que é por worktree — mas o
# `.env.example` dá o mesmo padrão a todo mundo, então quem copia colide.
#
# O sintoma não aponta para a causa. Subir a stack num worktree **substitui** os
# containers do outro, porque para o compose é o mesmo projeto: o outro agente
# vê a API dele trocada por uma de outra branch, sem aviso. E quando o nome
# difere mas a porta não, o erro é `port is already allocated`, que também não
# diz de onde vem. Os dois aconteceram aqui — na 0007 o implementador desistiu
# do `make up` e montou infra à mão.
#
# ## Como
#
# O checkout principal fica com `samia-dev` e as portas padrão, para não mudar o
# que já está na cabeça de quem trabalha nele. Cada worktree ligado — esteja ele
# em `.worktrees/<slug>` ou em `.claude/worktrees/<slug>` — ganha
# `samia-dev-<slug>` e um deslocamento de porta derivado do próprio slug — mesmo
# worktree, mesmas portas, sempre.
#
# Valor já definido no ambiente vence: quem quiser fixar a porta à mão continua
# podendo.
set -euo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Worktree ligado, ou o checkout principal? Pergunte ao git, não ao nome da
# pasta. Reconhecer só `.worktrees/` deixava de fora `.claude/worktrees/`, que é
# onde o harness de worktree do agente cria os dele — e ali o script devolvia
# `samia-dev` com as portas padrão, de modo que `make up` num worktree do agente
# **substituía** os containers do checkout principal, em silêncio. Medido na
# revisão da PR #126.
#
# Num worktree ligado, `--git-dir` aponta para `…/.git/worktrees/<nome>` e
# `--git-common-dir` para o `.git` compartilhado; no checkout principal os dois
# são o mesmo lugar.
git_proprio="$(git -C "$raiz" rev-parse --absolute-git-dir 2>/dev/null || echo '')"
git_comum="$(cd "$(git -C "$raiz" rev-parse --git-common-dir 2>/dev/null || echo .)" 2>/dev/null && pwd || echo '')"

if [[ -n "$git_proprio" && -n "$git_comum" && "$git_proprio" != "$git_comum" ]]; then
  slug="$(basename "$raiz")"
  # Soma dos bytes do slug, em 1..97. Determinístico: o mesmo worktree recebe
  # sempre as mesmas portas, então dá para guardar a URL.
  deslocamento=$(( ( $(printf '%s' "$slug" | cksum | cut -d' ' -f1) % 97 ) + 1 ))
  projeto="samia-dev-${slug}"
else
  slug="principal"
  deslocamento=0
  projeto="samia-dev"
fi

echo "export APP_NAME='${APP_NAME:-$projeto}'"
echo "export API_PORT='${API_PORT:-$(( 8000 + deslocamento ))}'"
echo "export WEB_PORT='${WEB_PORT:-$(( 5173 + deslocamento ))}'"
echo "export HARNESS_WORKTREE='${slug}'"
