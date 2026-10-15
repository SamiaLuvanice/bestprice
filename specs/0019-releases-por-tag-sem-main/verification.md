# Verificação — 0019 Releases por tags sem branch main

## Evidência local

| Verificação | Resultado |
|---|---|
| `node --test .github/scripts/*.test.cjs` | Passou: 50 testes, 0 falhas. Inclui política de PR, estados do Project, tags leves/anotadas, SemVer, SHA de tag e dispatch manual. |
| `python -m py_compile scripts/guard-protected-branch.py` | Passou. |
| `./scripts/configure-github.ps1` sem `-Apply` | Passou como preview: regras de branch limitadas a `develop`/`stage`; tags `v*` e `build-*` protegidas contra remoção e force push. Não alterou configuração remota. |
| `./.agents/sync.ps1` | Passou; projeções `.claude` reconciliadas e arquivos gerados reportados pelo script. |
| `git diff --check` | Sem erros de whitespace; Git reporta avisos de conversão LF→CRLF no checkout Windows. |
| Revisão YAML por QA | QA reportou parse válido dos quatro workflows. |
| actionlint local | Não executado: binário indisponível neste ambiente. No CI remoto da PR #78, `quality / Automation` passou, incluindo a etapa actionlint de `quality.yml`. |
| Checks remotos PR #78 | Passou: CI, Backend, Frontend, Automation/actionlint, PR policy, Project sync e Cloudflare Pages verdes. PR #78 integrada em `develop` em 15/10/2026 (`Closes #77`). |
| Release por tag `v0.1.0` | Passou: Run [38765816883](https://github.com/SamiaLuvanice/bestprice/actions/runs/38765816883) disparado por push de tag SemVer anotada sobre o commit `7177087023501a774e3a2222b9356058330341fa` (HEAD de `stage`). Jobs `prepare`, `stage-health`, `quality` (Frontend, Automation, Backend), `images` (frontend, backend) e `release` todos verdes. |
| Imagens publicadas no GHCR | Backend: `ghcr.io/samialuvanice/bestprice-backend@sha256:77c9b570ee65c6a01de0ad578ed3798dcccd97e533dd721f6c92cd506d0068aa`<br>Frontend: `ghcr.io/samialuvanice/bestprice-frontend@sha256:00b786f4eaa9adeed2c9ad1cf7289d61104641c801f50a1a7ad0d9feeb507931` |
| GitHub Release | Concluída: [v0.1.0](https://github.com/SamiaLuvanice/bestprice/releases/tag/v0.1.0) criada com sucesso contendo os digests imutáveis e SHA de release. |
| Health de Stage pré-release | Confirmado 200 OK (`{"status":"ok","database":"ok"}`) em `https://bestprice-stage-api.onrender.com/api/health` e `https://bestprice-stage.pages.dev/api/health`. |
| Configuração de Branches | `develop` configurada como branch padrão (`defaultBranchRef: develop`). Rulesets ativos: `integration-branches` (ID 24581959, cobrindo `develop` e `stage`) e `delivery-tags` (ID 24584593, cobrindo `v*` e `build-*`). |
| Remoção de `origin/main` | Concluída com confirmação explícita do usuário (`git push origin --delete main`); `origin/HEAD` ajustado para `origin/develop`. |

## Revisões

- `spec-reviewer`: aprovado, sem bloqueios. O deploy Live do SHA de `stage` precisa ser confirmado no painel antes da tag; health público não informa o SHA servido.
- `arch-reviewer`: revisou workflow, scripts e documentação; dois pontos documentais foram corrigidos (guard de branch e linha duplicada do Project). Revalidação local: 50/50 Node e `py_compile` aprovados.
- `qa`: 50/50 Node, YAML parseado e preview de ruleset aprovado.
- `Operação e entrega`: release por tag `v0.1.0` executada com sucesso com imagens GHCR e release GitHub publicadas; branch remota `main` removida após gates comprovados.

## Critérios e evidências finais

Todos os critérios de aceite foram comprovados:
1. `develop` é a branch padrão e `main` foi removida da origem; `origin/HEAD` aponta para `develop`.
2. Rulesets protegem `develop`, `stage` e tags SemVer/build.
3. PRs para `develop` e `stage` validam checks sem requerer `main`.
4. Release por tag `v0.1.0` comprovada no SHA de `stage` (`7177087`), com health de API e Pages verificado.
5. Imagens de backend e frontend publicadas no GHCR com digests imutáveis referenciados na GitHub Release.
6. Ação destrutiva de remoção da branch remota `main` executada após confirmação explícita do operador.
7. Nenhuma implantação em PROD foi iniciada nem configurada.
