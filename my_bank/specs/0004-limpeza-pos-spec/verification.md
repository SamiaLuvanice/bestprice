# Verificação — 0004 Limpeza segura após spec

## Critérios de aceite

| Critério | Situação | Evidência |
|---|---|---|
| Limpeza só depois de PR integrada e worktree limpa | Implementado por procedimento | `task-cleanup/SKILL.md` exige estado `MERGED` para `develop`, commit contido em `origin/develop` e `git status --short` vazio antes de remover. |
| Arquivos ignorados inspecionados antes de remover a worktree | Implementado por procedimento | Skill exige `git status --short --ignored`; `.env`, segredos e dados locais bloqueiam a remoção até haver destino de preservação acordado. |
| Compose limitado ao projeto isolado, sem prune global | Implementado por procedimento | Skill usa `compose-worktree.ps1 down --remove-orphans`, que deriva o mesmo nome de projeto; proíbe `docker system/container/volume prune`. |
| Volumes preservados por padrão | Implementado por procedimento | Skill não passa `--volumes`; exclusão requer pedido explícito e ownership exclusivo confirmado. |
| Worktree e branch local removidas sem forçar | Implementado por procedimento | Skill verifica `git status --short --ignored`, usa `git worktree remove` sem `--force` e `git branch -d`; manda parar se Git recusar ou se a branch estiver em outra worktree. |
| Branch remota removida apenas se for a branch da PR integrada | Implementado por procedimento | Skill confirma PR/base/branch, proteção e ancestralidade em `origin/develop`; comando limitado a `git push origin --delete <branch>`. |
| Rotina repetível e escopo restrito | Implementado por procedimento | Recursos ausentes são relatados; não usa `git worktree prune`, não infere projeto Docker e não remove recursos compartilhados. |
| Rule e inventário apontam para skill | Demonstrado por inspeção | `implementation-handoff.md`, `workspace.md`, `.agents/AGENTS.md`, `modules.yaml` e `AGENTS.md` referenciam a rotina. |

## Checagens executadas

- `git diff --check` — código de saída 0; sem erros de whitespace (Git exibiu somente avisos de conversão LF/CRLF do checkout Windows).
- `pwsh -NoProfile -File my_bank/scripts/diagnose-harness.ps1 -Root (Resolve-Path my_bank).Path` — falhou ao ler o arquivo vazio já existente `frontend/src/app/app.scss`: `Get-Content -Raw` retorna `$null` e o scanner chama `.Contains()` na linha 41. Não alterei esse arquivo nem ampliei o escopo da spec.
- `pre-commit run --config my_bank/.pre-commit-config.yaml --all-files` — todos os hooks passaram: trailing whitespace, EOF, YAML, JSON, merge conflicts, large files e private key.
- Sincronização oficial `bash .agents/sync.sh` — passou; criou junctions `.claude/agents`, `.claude/skills` e `.claude/commands` para `.agents/`.

## Limites

Não executei `docker compose down`, remoção de volumes, worktrees ou branches: isso apagaria
recursos de ambiente sem ser uma tarefa de limpeza pós-merge. O critério desses comandos foi
verificado por inspeção; o procedimento sempre bloqueia recursos sem ownership confirmado.

## Handoff

- Branch `chore/spec-cleanup-routine`, baseada em `origin/develop`.
- Próximo passo: revisão independente e PR; só após merge a skill deverá ser usada para limpar
  os recursos desta tarefa.
