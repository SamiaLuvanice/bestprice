# Verificação — 0005 Fluxo TDD no harness

## Critérios de aceite

| Critério | Situação | Evidência |
|---|---|---|
| Red → Green → Refactor por fatia vertical | Implementado por procedimento | `skills/tdd/SKILL.md` exige testar primeiro, confirmar falha pela ausência do comportamento, implementar o mínimo e refatorar mantendo verde. |
| Testes observam comportamento e evitam tautologia/acoplamento | Implementado por procedimento | `skills/tdd/SKILL.md` e `tests.md` favorecem interfaces públicas e resultados independentes; rejeitam método privado, chamadas internas e assertions tautológicas. |
| Mocks compatíveis com estratégia existente | Demonstrado por inspeção | `mocking.md` remete a `rules/testing.md`, recomenda mocks em fronteiras externas e `HttpTestingController` no service Angular. |
| Sem confirmação repetida de seams já definidos | Implementado por procedimento | A skill deriva comportamento da spec e pede esclarecimento só se a ambiguidade alterar o contrato/aceite. |
| Skill registrada sem remover capacidades atuais | Demonstrado por inspeção | `modules.yaml` e `.agents/AGENTS.md` adicionam `tdd` e mantêm skills existentes, incluindo `angular-feature`, `java-datetime` e `task-cleanup`. |
| Nenhum código da aplicação alterado | Demonstrado por diff | `git diff --name-only origin/develop...HEAD` contém apenas harness, manifesto, docs e spec 0005. |

## Checagens executadas

- `git diff --check` — código de saída 0; sem erros de whitespace (apenas avisos do Git sobre LF/CRLF no checkout Windows).
- `pre-commit run --config my_bank/.pre-commit-config.yaml --all-files` — todos os hooks passaram: trailing whitespace, EOF, YAML, JSON, merge conflicts, large files e private key.
- `bash .agents/sync.sh` — passou; criou junctions `.claude/agents`, `.claude/skills` e `.claude/commands` para `.agents/`.
- `pwsh -NoProfile -File my_bank/scripts/diagnose-harness.ps1 -Root (Resolve-Path my_bank).Path` — falhou ao processar o arquivo vazio já existente `frontend/src/app/app.scss`: `Get-Content -Raw` retorna `$null`, e o script chama `.Contains()` na linha 41. Não alterei o arquivo fora do escopo.

## Limites

Não rodei testes Java/Angular: nenhum código da aplicação foi alterado. O diagnóstico geral do
harness falha no arquivo vazio `frontend/src/app/app.scss`; o scanner precisará lidar com
conteúdo vazio em um ajuste separado.

## Handoff

- Branch `chore/tdd-harness`, baseada em `origin/develop` após o merge da PR #5.
- Próximo passo: revisão independente e integração em `develop`.
