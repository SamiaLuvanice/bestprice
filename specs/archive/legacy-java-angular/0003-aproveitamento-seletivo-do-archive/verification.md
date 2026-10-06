# Verificação — 0003 Aproveitamento seletivo do archive

## Critérios de aceite

| Critério | Situação | Evidência |
|---|---|---|
| Datas/hora cobrem tipos Java, horário local, transições de fuso e `Clock` | Demonstrado por inspeção | `.agents/skills/java-datetime/SKILL.md` distingue `Instant`, `LocalDate`, `LocalTime`/`LocalDateTime` + `ZoneId`, gap/overlap e `Clock.fixed`/`Clock.offset` |
| Guia Angular segue a estrutura e os serviços do projeto | Demonstrado por inspeção | `.agents/skills/angular-feature/SKILL.md` encaminha para `frontend.md`, usa `features/<feature>`, service HTTP e quatro estados |
| Compose aceita nome/portas da worktree, overrides e mantém defaults | Demonstração de configuração | `compose-worktree.ps1 config --quiet` reportou `mybank-chore-archive-reuse-review-cbdeb239`, API `20756`, SPA `27756`; repetição com overrides reportou `23001`/`33001`; `docker-compose.yml` mantém defaults 8080/4200 |
| Branches protegidas usam guard configurado para fluxo atual | Demonstrado por inspeção | `scripts/guard-protected-branch.py` declara `develop`, `stage`, `main`; `.pre-commit-config.yaml` o registra na fase `commit-msg` |
| Archive explica adaptações e dependências mantidas fora | Demonstrado por inspeção | `.agents/archive/README.md` e `docs/HARNESS-CHANGES.md` apontam para skills/scripts adaptados e justificam E2E/contrato arquivados |

## Checagens executadas

- `git diff --check` — código de saída 0; sem erros de whitespace (Git exibiu apenas avisos de conversão LF/CRLF do checkout Windows).
- Parser PowerShell via `[System.Management.Automation.Language.Parser]::ParseFile(...)` — `PowerShell parser: OK`.
- `$env:POSTGRES_PASSWORD='validation-only'; .\scripts\compose-worktree.ps1 config --quiet` — saída 0; projeto/portas da worktree resolvidos.
- Mesmo comando com `BACKEND_PORT=23001` e `FRONTEND_PORT=33001` — saída 0; overrides reportados e aceitos pelo Compose.
- `C:\Program Files\Git\bin\bash.exe .agents/sync.sh` — sincronização concluída; junctions de agents, skills e commands criados para Claude Code.

## Limites

Não subi containers nem rodei testes/build Java ou Angular: nenhum código da aplicação foi
alterado. A inicialização e encerramento de uma stack real em paralelo com outra worktree
continuam sem demonstração. A revisão independente foi concluída sem achados e a branch foi integrada.

## Handoff

- PR [#4](https://github.com/SamiaLuvanice/bestprice/pull/4), integrada em `develop` pelo
  merge commit `7091dd1` após revisão independente.
