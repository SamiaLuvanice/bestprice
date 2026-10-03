---
description: Commits (Conventional Commits), branches e o que nunca entra no repositório.
---

# Git

## Commits — Conventional Commits com escopo

```
<tipo>(<escopo>): <resumo no imperativo, minúsculo, sem ponto final>
```

Tipos: `feat` `fix` `refactor` `test` `docs` `chore` `perf` `build`
Escopos: `backend` `frontend` `api` `docs` `agents`

```
feat(backend): adiciona endpoint de transferência entre contas
fix(frontend): corrige validação do campo de valor
chore(agents): ajusta regras para a stack java + angular
```

Um commit é uma mudança coesa. Se o resumo precisa de "e", provavelmente são dois commits.

## Atribuição

Não adicione `Co-Authored-By` de assistente nem rodapé "Generated with" a commits ou PRs,
salvo se o dono do repositório pedir. A autoria é de quem versiona.

## Branches

`main` é sempre verde. Trabalhe em branch curta e integre por PR (ou merge local, se estiver sozinho).

```
feat/0003-accounts-crud     ← referencia o número da spec, se houver
fix/transfer-rounding
chore/bump-spring-boot
```

Rebase/atualize a partir da `main` antes de integrar. Commit direto na `main` só para docs triviais.
Não use `--no-verify` para contornar hooks: conserte a causa.

## Pull requests (quando usar)

Um tema por PR. O corpo traz: o que mudou (uma frase), como verificar, e o que ficou de fora.
Para estudo solo, o PR serve de revisão e de registro — vale o hábito.

## O que nunca entra

`.env`, segredo/credencial, `application-local.yml`, dump de banco, `target/`, `build/`,
`node_modules/`, `dist/`, `.angular/`, arquivo de IDE (`.idea/`, `.vscode/` pessoal), `.DS_Store`.
Garanta isso com `.gitignore` desde o primeiro commit (os geradores do Spring Initializr e do Angular CLI já trazem um).
