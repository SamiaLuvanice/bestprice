#!/usr/bin/env bash
# Recusa commit de trabalho nas branches integradoras.
#
# A regra `git-worktree-required` diz, desde sempre, que este script bloqueia
# commits de feature em `stage`. Ele não existia: a frase veio da documentação
# do boilerplate e ninguém conferiu. Descobri porque um agente commitou direto
# no checkout principal e o defeito só apareceu num conflito de rebase, horas
# depois — regra que cita guarda inexistente é pior que regra sem guarda, porque
# quem a lê acredita estar protegido.
#
# ## O que ele impede, e o que não impede
#
# Impede o acidente: `stage` e `main` recebem merge de PR, não commit direto.
# Um commit ali entra em staging no deploy seguinte sem ter passado por revisão,
# e a única evidência costuma ser um conflito em quem for atualizar depois.
#
# Não impede quem quiser burlar: `--no-verify` existe. A regra proíbe usá-lo, e
# a proibição é para gente, não para o hook — a exceção legítima é o commit que
# instala o próprio guarda, marcado com `[bootstrap-guard]` na mensagem.
set -euo pipefail

PROTEGIDAS="stage main master"

branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"
[[ -n "$branch" ]] || exit 0

for protegida in $PROTEGIDAS; do
  [[ "$branch" == "$protegida" ]] || continue

  # O commit que instala o guarda é a única exceção, e ela é explícita.
  mensagem="$(cat "${1:-/dev/null}" 2>/dev/null || true)"
  if [[ "$mensagem" == *"[bootstrap-guard]"* ]]; then
    exit 0
  fi

  cat >&2 <<MSG

✗ Commit recusado: você está em '$branch', que é branch integradora.

  Trabalho vai em worktree próprio, e chega aqui por merge de PR — regra
  .agents/rules/git-worktree-required.md. Commit direto aqui não passa por
  revisão e vai para staging no deploy seguinte.

  Para mover o que você já escreveu:

      git stash push -u -m "wip"
      git worktree add .worktrees/<slug> -b <tipo>/<nome> origin/$branch
      cd .worktrees/<slug>
      git stash list --format='%H %gs'      # ache o SHA do seu "wip"
      git stash apply <sha>

  A pilha de stash é compartilhada entre worktrees: aplique pelo SHA, nunca
  com 'pop', ou você pega o trabalho de outra sessão.

MSG
  exit 1
done

exit 0
