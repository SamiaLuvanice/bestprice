---
description: Git worktree obrigatório para todo trabalho de feature nos repos backend e frontend.
alwaysApply: true
---

# Git worktree (vários agentes no mesmo repo)

Vários agentes podem trabalhar no **mesmo** `backend` ou `frontend` em paralelo. O checkout que o IDE abre (`backend/`, `frontend/`) deve permanecer em **`stage`** (ou `main`).

## Regra

1. **Antes de qualquer edição de código** (feature, fix, refactor — inclusive ajustes pequenos, correções de PR, feedback do usuário): criar ou entrar em **git worktree** — skill `pr-review-merge` § Git worktree.
2. **Nunca** `git checkout -b` nem commits de feature no checkout principal.
3. **Commits, testes, `npm run dev`, PR** — só dentro de `<repo>/.worktrees/<slug>/`.
4. **Principal** — apenas `git fetch`, `git pull`, review/merge de PR, deploy.
5. **O guarda só vale instalado.** `make install` registra os hooks, inclusive o
   `commit-msg` que o guarda usa. Num checkout sem eles, a regra é honra — e honra falha:
   foi assim que um commit de agente entrou em `stage` e só apareceu num conflito de
   rebase, horas depois. Confira com `ls .git/hooks/commit-msg`.
6. **Proibido `--no-verify`** — o guard rail `scripts/guard-stage-branch.sh` bloqueia commits de feature no stage. Usar `git commit --no-verify` para burlar o guard é violação do fluxo. A única exceção é o bootstrap inicial do próprio guard rail (indicado no commit message).

## Caminhos

| Papel | Caminho | Branch |
|-------|---------|--------|
| Principal | `backend/` ou `frontend/` | `stage` |
| Feature | `<repo>/.worktrees/<slug>/` | `feature/<nome>` |

`<slug>` = branch sem `/` (ex. `feature/0004-orders-checkout` → `feature-0004-orders-checkout`).

## Primeiro comando da sessão (copiar no prompt)

```bash
cd frontend    # ou backend
git fetch origin && git checkout stage && git pull origin stage
BRANCH=feature/<id-tarefa>
SLUG=${BRANCH//\//-}
mkdir -p .worktrees
git worktree add .worktrees/$SLUG -b "$BRANCH" origin/stage
cd .worktrees/$SLUG
```

Confirmar: `pwd` deve terminar em `.worktrees/<slug>` antes de editar arquivos.
