# Tarefas — 0019 Releases por tags sem branch main

- [x] T01 — Revisar a spec aprovada e confirmar Issue #77, `origin/develop` e worktree/branch `feature/0019-issue-77-releases-por-tag-sem-main`.
- [x] T02 — Escrever testes Node para política de PR sem `main`, estados do Project sem `Main` e validação do SHA/tag/dispatch; observar as falhas esperadas antes da correção.
- [x] T03 — Alterar políticas e automações para aceitar somente promoções entre `develop` e `stage`, sem mapear PR mergeada em `main`.
- [x] T04 — Migrar `release.yml` para push de tags `v*`; validar SemVer, tag preexistente, SHA idêntico à ponta de `stage`, health de API/Pages e gates sobre o SHA marcado; publicar ambas as imagens e release com digests.
- [x] T05 — Atualizar o ruleset gerado pelo script para `develop`/`stage`, manter proteção de tags `v*` e `build-*`, e ajustar o guard local de branch.
- [x] T06 — Atualizar README, documentação de fluxo/infraestrutura/contexto do produto e instruções ativas do harness; sincronizar projeções a partir de `.agents/`.
- [x] T07 — Rodar testes Node, actionlint e verificações de estrutura/configuração; registrar comandos, resultados e limites em `verification.md` (actionlint local indisponível; executado com sucesso no CI remoto da PR #78).
- [x] T08 — Fazer revisão independente de arquitetura e QA; corrigir os achados documentais na mesma worktree e repetir os gates afetados.
- [x] T09 — Executar doc-sync-onboarding depois da última alteração de código; conferir `AGENTS.md`, `CLAUDE.md` e documentos afetados.
- [x] T10 — Commit `e3e3b2e` com `Refs #77`; branch publicada e PR [#78](https://github.com/SamiaLuvanice/bestprice/pull/78) aberta para `develop` com `Closes #77`; CI remoto verde. Integrada em `develop` em 15/10/2026.
- [x] T11 — Após integração aprovada: branch padrão confirmada como `develop`, rulesets aplicados em `develop`/`stage` e tags `v*`/`build-*`, `Main` aposentado em favor de `Released` no Project e execução de release comprovada com tag `v0.1.0` (Run [38765816883](https://github.com/SamiaLuvanice/bestprice/actions/runs/38765816883)), publicando backend/frontend no GHCR e criando a release com os digests.
- [x] T12 — Com as pré-condições verificadas e após confirmação explícita no momento da ação destrutiva, branch remota `main` removida via `git push origin --delete main`; `origin/HEAD` atualizado para `develop` e evidência registrada.
