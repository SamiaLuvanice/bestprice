---
description: Git worktree obrigatório para toda implementação de spec ou mudança de código.
alwaysApply: true
---

# Worktree e fluxo de branches

O repositório é um monorepo. `main` é a linha estável de release, `develop` é a integração
diária de features e `stage` é a linha de validação de release candidate. Não há deploy
configurado; validações de release são locais até que isso mude explicitamente.

## Regra

1. Antes de editar código para uma spec, bug ou refactor, crie uma worktree na raiz do
   monorepo. Correções solicitadas em review continuam na mesma worktree/branch.
2. Não crie nem faça commits de feature no checkout principal. Código, testes e comandos
   da aplicação rodam dentro da worktree.
3. Cada feature usa branch `feature/<spec>-<slug>` (ex.: `feature/0004-transferencias`).
   Correções fora de uma spec usam `fix/<slug>`; outros tipos seguem `.agents/rules/git.md`.
4. A base da feature e o destino do PR são `develop`. Antes, execute `git fetch origin`
   e confirme que `refs/remotes/origin/develop` existe. Se não existir, pare e reporte;
   não use `stage` nem `main` como fallback.
5. O checkout principal permanece em `develop` para o trabalho diário. `stage` e `main`
   são atualizadas apenas pelo fluxo de promoção de release via PR.
6. Instale os hooks locais com `pre-commit install --hook-type pre-commit --hook-type commit-msg`;
   não use `--no-verify` para contorná-los. A proteção no GitHub continua sendo necessária.

## Caminhos

| Papel | Caminho | Branch |
|---|---|---|
| Checkout principal | raiz do monorepo | `develop` |
| Feature | `.worktrees/<slug>/` | `feature/<spec>-<slug>` |

`<slug>` é o nome da branch sem `/` (ex.: `feature/0004-transferencias` →
`feature-0004-transferencias`). A pasta `.worktrees/` é ignorada pelo Git.

## Criar worktree (PowerShell)

```powershell
git fetch origin
git show-ref --verify refs/remotes/origin/develop
$branch = "feature/0004-transferencias"
$slug = $branch.Replace('/', '-')
git worktree add ".worktrees/$slug" -b $branch origin/develop
Set-Location ".worktrees/$slug"
```

Confirme que o diretório atual termina em `.worktrees/<slug>` antes de editar.

## Promoção de release

Quando uma release for solicitada, promova por PR `develop` → `stage` para validação
local e, após aceite, `stage` → `main`. Isso é separado da conclusão de uma spec e não
implica deploy.
