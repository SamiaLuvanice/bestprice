# Verificação — Spec 0010

Data: 2026-10-07. Worktree: `.worktrees/feature-0010-issue-29-onboarding-harness`; branch `feature/0010-issue-29-onboarding-harness`, criada de `origin/develop` no commit `8045420`. Issue [#29](https://github.com/SamiaLuvanice/bestprice/issues/29); PR [#30](https://github.com/SamiaLuvanice/bestprice/pull/30) aberta para `develop`. O [CI #37645230540](https://github.com/SamiaLuvanice/bestprice/actions/runs/37645230540) passou no SHA `8162835`; a aprovação GitHub e o merge continuam pendentes.

## Critérios de aceite

| Critério | Evidência observada | Situação |
|---|---|---|
| Guia inicial executável | `uv sync --locked --extra dev` instalou 27 pacotes; `npm ci` instalou 256; PostgreSQL 18 temporário permitiu os testes de integração de 200/503. O Docker Desktop não iniciou nesta máquina e a interface não foi aberta em navegador a partir de clone limpo. | Parcial |
| Índice e guias navegáveis | QA conferiu 84 Markdown, 49 links relativos válidos, nenhuma cerca desbalanceada e cobertura dos guias pelo índice. | Demonstrado por inspeção |
| Conteúdo fiel ao código | Revisão comparou FastAPI, frontend, Compose e workflows com os guias; foram corrigidas rotas automáticas do FastAPI e a opcionalidade de `DB_PORT`. Não há tabelas de domínio, migração ou admin no código. | Demonstrado por inspeção |
| Material anterior fora da árvore | Foram excluídos os arquivos históricos de documentação, specs e harness. Busca por identificadores e caminhos antigos nos documentos, specs, scripts e harness ativos não retornou ocorrências. | Demonstrado por diff e busca |
| Harness e projeções coerentes | `.agents/modules.yaml` inclui as três skills complementares anunciadas; `.agents/sources.md` aponta para a arquitetura existente; `.agents/sync.ps1` criou junctions da worktree; `scripts/diagnose-harness.ps1` retornou `Harness válido` após tratar arquivos vazios. | Demonstrado |
| Skill React adicional com origem e licença | A cópia local de terceiro não foi transferida para a worktree nem será incluída no pacote: não contém aviso de licença completo e tem regras exclusivas de Next.js. A skill `react-vite-performance` da spec 0009 permanece disponível. | Demonstrado por inspeção e exclusão do diff |
| Revisão e verificações | Ruff, pytest com PostgreSQL real, lint/test/build do frontend, testes Node e diagnóstico passaram. Revisão independente e QA documental concluídas sem achado bloqueante. O CI remoto #37645230540 passou no SHA `8162835`, inclusive o actionlint no job de automação; `actionlint` não está instalado localmente. | Demonstrado localmente e no CI do SHA indicado |
| Issue e PR para `develop` | `origin/develop` foi atualizado e a worktree criada sem tocar no histórico. A criação REST gerou a Issue [#29](https://github.com/SamiaLuvanice/bestprice/issues/29); a branch foi renomeada, publicada e a PR [#30](https://github.com/SamiaLuvanice/bestprice/pull/30) foi aberta para `develop` com `Closes #29`. CI do SHA `8162835` verde; aprovação GitHub e merge pendentes. | Parcial |

## Comandos e resultados

| Comando | Resultado |
|---|---|
| `git fetch origin` e `git show-ref --verify refs/remotes/origin/develop` | Sucesso; referência disponível antes de criar a worktree. |
| `.agents/sync.ps1` | Criou `.claude/agents`, `.claude/skills` e `.claude/commands` apontando para a worktree. |
| `scripts/diagnose-harness.ps1` | Falhou inicialmente em `Get-Content -Raw` de arquivo vazio; após correção, código 0 e `Harness válido`. |
| `uv sync --locked --extra dev` | Sucesso após execução com acesso ao cache do uv; 27 pacotes instalados. |
| `backend/.venv/Scripts/ruff.exe check .` | Código 0, `All checks passed!`. |
| `backend/.venv/Scripts/pytest.exe -q` sem banco de teste | 3 passed, 2 skipped; os pulados não contam como prova de integração. |
| `backend/.venv/Scripts/pytest.exe -q` com `TEST_DATABASE_URL` para PostgreSQL 18 temporário | 5 passed; incluiu 200 com consulta real e 503 para banco inexistente, sem URL no log. |
| `npm ci` | Código 0; 256 pacotes instalados. |
| `npm run lint` | Código 0. |
| `npm test -- --run` | Código 0 fora do sandbox; 1 arquivo, 7 testes. |
| `npm run build` | Código 0 fora do sandbox; TypeScript e Vite concluíram. |
| `node --test .github/scripts/*.test.cjs` | Código 0 fora do sandbox; 15 testes passaram. |
| `git diff --check` | Código 0; avisos de conversão LF/CRLF sem erro de whitespace. |
| `gh api -X POST repos/SamiaLuvanice/bestprice/issues --input ...` | Criou a Issue #29 após falhas anteriores da CLI; URL confirmada. |
| `git worktree repair` e `.agents/sync.ps1` | Registro Git reparado após renomear o caminho da worktree; junctions `.claude` recriadas para o novo caminho. |
| `git commit` e `git push` | Commit `4497793` passou nos hooks `pre-commit` e `commit-msg` e foi publicado na branch da Issue #29. |
| `gh pr create --base develop ...` | Criou a PR #30 com `Closes #29`, spec, resultados locais e limites. |
| `gh run view 37645230540` | Run `completed/success` no SHA `8162835`; jobs PR policy, Backend, Frontend, Automation e CI concluíram com sucesso. |

## Limites e pendências

- Os comandos Vite e Node falharam no sandbox por `spawn EPERM`; repetidos com a permissão de execução necessária, passaram. O uv precisou de acesso ao cache global pelo mesmo motivo.
- A instância temporária PostgreSQL 18 foi parada e seus dados removidos após os testes. O Compose do projeto usa PostgreSQL 17; Docker Desktop estava parado e seu serviço não pôde ser iniciado nesta sessão. A abertura da interface no navegador e o setup literal de clone limpo não foram demonstrados.
- `actionlint` não está instalado nesta máquina. Nenhum workflow foi alterado por esta spec.
- A Issue #29 e a PR #30 existem. O resultado remoto acima vale para `8162835`; commits documentais posteriores exigem CI novo. A aprovação GitHub e o merge ainda dependem do fluxo da PR; não foi feito commit direto em `develop`.

## Revisão independente e QA

O `arch-reviewer` revisou o diff e confirmou as correções de rotas automáticas, `DB_PORT`, catálogo e fonte de arquitetura; executou o diagnóstico do harness e `git diff --check`, ambos com código 0. Apontou uma inconsistência no texto da busca de referências antigas, corrigida antes deste registro. A revisão não repetiu os testes da aplicação.

O QA revisou a árvore após a exclusão do material anterior: 84 Markdown, 49 links relativos válidos, nenhuma cerca desbalanceada, índice cobrindo todos os guias e catálogo apontando para arquivos existentes. Confirmou a ausência da cópia local da skill de terceiro na worktree e a correspondência das rotas FastAPI com a documentação. A ressalva sobre `DB_PORT` na tabela de arquitetura foi corrigida antes deste registro.
