# Plano — 0019 Releases por tags sem branch main

## Contrato observável

Não há mudança de API REST nem de tela. O contrato operacional fica assim:

- Tags `vMAJOR.MINOR.PATCH` apontam para o SHA da ponta atual de `stage`, após confirmação no painel Render de que esse SHA está Live e health direto/proxy aprovados.
- O push dessa tag dispara a entrega. A execução manual só pode partir da branch `stage`, receber uma versão SemVer válida e encontrar uma tag existente que aponte para o mesmo SHA.
- Tags `build-*` continuam como identificadores técnicos de imagem e não disparam releases.
- Uma release só é criada depois que os gates e a publicação das imagens backend e frontend terminarem. A release registra SHA e digests.
- O Project deixa de mapear merge em `main`; a opção atual `Main` será renomeada para `Released`, preservando itens e histórico. O sync não atribui `Released` a novos eventos.
- `develop` e `stage` continuam protegidas; a branch padrão passa a `develop`. A branch remota `main` é removida somente depois de workflow por tags, proteções, branch padrão e Project estarem migrados e verificados.

## Decisões

1. **Release por tag SemVer, sem tag criada pelo workflow.** O workflow só aceita `vMAJOR.MINOR.PATCH` em push ou dispatch. A tag precisa existir e apontar para `github.sha`; no push, esse SHA também precisa ser exatamente o HEAD de `stage`. Isso evita a corrida de criar uma tag durante a própria execução e disparar uma segunda publicação. O dispatch de recuperação só aceita branch `stage` e tag preexistente para o mesmo SHA.
2. **Vínculo estrito à ponta atual de stage.** A publicação consulta a ref remota `stage` e falha se o SHA diferir. Também confere health da API Render e da rota proxied do Pages antes de publicar. O endpoint não informa SHA servido; a confirmação do deploy Live do SHA atual de `stage` é operacional e deve ocorrer antes da criação da tag. Se `stage` avançar antes da tag, a versão antiga não será publicada; publique a versão validada antes de promover a próxima candidata.
3. **Gates do SHA marcado.** O workflow reutiliza `quality.yml` para o SHA da tag e só inicia a matriz Docker depois da qualidade e dos health checks. Cada imagem mantém as tags da versão e do SHA; release registra os dois digests. `build-*` é preservado para referências já publicadas e não entra no gatilho.
4. **Project preserva registros.** Renomear a opção existente `Main` para `Released` mantém as Issues/PRs já associadas à opção e seus eventos. `project-state.cjs` só reconhece merges em `develop` e `stage`; qualquer base aposentada ou desconhecida falha antes de gravar no Project.
5. **Configuração externa na ordem segura.** Após o código chegar a `develop`, definir `develop` como padrão; aplicar ruleset de branches somente em `develop` e `stage` e confirmar proteção de tags; renomear a opção Project; verificar gatilho/execução por tag e health; só então retirar `main`. Não remover tags nem releases existentes.
6. **Sem mudança de deployment.** Stage continua no Render/Supabase/Pages. A nova release publica GHCR e não implanta PROD.

## Camadas e arquivos

- `.github/workflows/ci.yml`, `release.yml`: branches de CI e pipeline de entrega por tag.
- `.github/scripts/policy.cjs`, `policy.test.cjs`: promoção `develop ↔ stage`, PRs de feature para `develop`, rejeição de bases removidas.
- `.github/scripts/release-policy.cjs`, `release-policy.test.cjs`: validação pura de evento, formato/versionamento e correspondência dos SHAs, usada pelo workflow.
- `.github/scripts/project-state.cjs`, `project-state.test.cjs`, `sync-project.test.cjs`: estados sem `Main`, preservando o Project existente.
- `.github/pull_request_template.md`, `scripts/configure-github.ps1`, `scripts/guard-protected-branch.py`: orientação de promoção e proteção local/remota.
- `README.md`, `docs/github-workflow.md`, `docs/apps/infraestrutura.md`, `docs/product-context.md`, `docs/harness-modules.md`, `.agents/sources.md`, `.agents/rules/git.md`, `.agents/rules/git-worktree-required.md`, `.agents/rules/implementation-handoff.md`, `.agents/skills/agent-orchestration/SKILL.md`: onboarding e instruções ativas; sincronizar projeções com `.agents/sync.ps1`.
- `specs/0019-releases-por-tag-sem-main/{spec,plan,tasks,verification}.md`: critérios, sequência e evidências.

Specs implementadas antigas e verificações históricas não serão reescritas; referências históricas a `main` continuam como registro do fluxo anterior.

## Riscos e limites

- A ponta de `stage` pode avançar antes da criação da tag. A política falha fechada e exige publicar a tag antes da próxima promoção.
- Health confirma disponibilidade e banco, não compara por si só o SHA servido; a identidade do commit é verificada pela ref remota `stage` e pelo deploy atual observado no fluxo operacional. Registrar o limite da verificação pública no `verification.md`.
- As duas imagens podem ser publicadas parcialmente se um job da matriz falhar. Nesse caso não existe release concluída; a rerun publica o mesmo SHA e não sobrescreve uma release existente.
- A configuração GitHub/Project exige acesso de administração. A branch não será excluída até a verificação posterior à migração.
