---
description: Commits (Conventional Commits), branches e o que nunca entra no repositório.
---

# Git

## Commits — Conventional Commits com escopo

```
<tipo>(<escopo>): <resumo no imperativo, minúsculo, sem ponto final>
```

Tipos: `feat` `fix` `refactor` `test` `docs` `chore` `perf` `build`
Escopos: `backend` `frontend` `api` `docs` `agents` `ci`

```
feat(backend): adiciona endpoint de transferência entre contas
fix(frontend): corrige validação do campo de valor
chore(agents): ajusta regras para a stack java + angular
```

Um commit é uma mudança coesa. Se o resumo precisa de "e", provavelmente são dois commits.
Commits de tarefa incluem `Refs #<issue>` no corpo; a PR declara `Closes #<issue>`.
Veja o fluxo e suas exceções de promoção em `docs/github-workflow.md`.

## Atribuição

Não adicione `Co-Authored-By` de assistente nem rodapé "Generated with" a commits ou PRs,
salvo se o dono do repositório pedir. A autoria é de quem versiona.

## Branches

`main` é a linha estável de release; `develop` recebe a integração diária de features;
`stage` recebe a candidata a release para validação. Proteja as três contra commits diretos
de feature e integre mudanças por PR. O trabalho de feature parte de `origin/develop` e
abre PR para `develop` (ver `git-worktree-required.md`).

```
feature/0007-issue-123-accounts-crud
fix/issue-124-transfer-rounding
chore/issue-125-bump-spring-boot
```

Promoção de release: PR `develop` → `stage` e, após validação/aceite, PR `stage` → `main`.
Atualize a branch de feature a partir de `develop` antes de integrar, conforme a política
do repositório. Não faça commit direto em `main`, `stage` ou `develop`.
Não use `--no-verify` para contornar hooks: conserte a causa.

O hook `guard-protected-branch` bloqueia commits diretos em `develop`, `stage` e `main`
quando os hooks estiverem instalados. Instale/atualize ambos com
`pre-commit install --hook-type pre-commit --hook-type commit-msg`. O hook é uma proteção
local contra acidentes, não substitui as regras de proteção de branch do GitHub.

## Pull requests (quando usar)

Um tema por PR. O corpo traz: o que mudou (uma frase), como verificar, e o que ficou de fora.
Para estudo solo, o PR serve de revisão e de registro — vale o hábito.
As branches integradoras exigem o check `CI` e uma aprovação independente no GitHub.
A branch padrão é `develop`; `main` mantém a linha de release. Merge em develop
fecha a Issue vinculada; publicação ocorre após promoção para main. Não faça
autoaprovação nem bypass para contornar a falta de revisor.

## O que nunca entra

`.env`, segredo/credencial, `application-local.yml`, dump de banco, `target/`, `build/`,
`node_modules/`, `dist/`, `.angular/`, arquivo de IDE (`.idea/`, `.vscode/` pessoal), `.DS_Store`.
Garanta isso com `.gitignore` desde o primeiro commit (os geradores do Spring Initializr e do Angular CLI já trazem um).
