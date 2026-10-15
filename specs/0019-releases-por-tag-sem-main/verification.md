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
| actionlint local | Não executado: binário indisponível neste ambiente. O workflow `quality.yml` instala e executa actionlint no CI; aguarda check remoto da PR. |

## Revisões

- `spec-reviewer`: aprovado, sem bloqueios. O deploy Live do SHA de `stage` precisa ser confirmado no painel antes da tag; health público não informa o SHA servido.
- `arch-reviewer`: revisou workflow, scripts e documentação; dois pontos documentais foram corrigidos (guard de branch e linha duplicada do Project). Revalidação local: 50/50 Node e `py_compile` aprovados.
- `qa`: 50/50 Node, YAML parseado e preview de ruleset aprovado. Não executou health público, CI remoto ou configuração GitHub/Project.

## Critérios ainda pendentes

A confirmação do SHA Live no Render e health da API/Pages, branch padrão `develop`, aplicação remota dos rulesets, renomeação de `Main` para `Released` com reconciliação dos itens, execução de uma release real com imagens/digests e remoção da branch remota `main` dependem de configuração/observação após a integração da PR. A branch `main` não deve ser removida antes dessas evidências; a remoção requer confirmação explícita no momento da ação.

A workflow valida tag SemVer, igualdade entre tag, SHA da execução e ponta de `stage`, health da API e Pages e repete a ponta de `stage` antes da release. O endpoint público não comprova sozinho qual SHA está implantado; registrar no momento da primeira publicação o SHA Live consultado no painel Render, o SHA de `stage`, os dois health checks e o horário.
