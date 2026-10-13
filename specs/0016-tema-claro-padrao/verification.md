# Verificação — Spec 0016

Base: `6ddf407` de `origin/develop` (worktree
`.worktrees/feature-0016-issue-52-tema-claro-padrao`, branch
`feature/0016-issue-52-tema-claro-padrao`).

## Mudança

`frontend/src/styles.css`: removido o bloco `@media (prefers-color-scheme: dark)`
(34 linhas), mantendo `:root` com `color-scheme: light` e os tokens claros.
Nenhuma alteração em componentes, tokens claros, layouts ou comportamento.

## Portões (executados em `frontend/`)

| Comando | Resultado |
|---|---|
| `npm ci` | 257 pacotes, 0 vulnerabilidades |
| `npm run lint` | verde, sem saída de erro |
| `npm test -- --run` | **242 passed** em 22 arquivos |
| `npm run build` | `tsc -b && vite build` verde; CSS final `dist/assets/index-Df0qYN9Q.css` (27,32 kB) |

## Evidência da regra "evidência antes de hipótese"

Inspeção determinística do CSS compilado (`dist/assets/index-Df0qYN9Q.css`):

| Checagem | Comando | Resultado |
|---|---|---|
| Sem consulta de preferência do sistema | busca por `prefers-color-scheme` no CSS compilado | **ausente** |
| Esquema claro declarado | busca por `color-scheme: light` | **presente** |
| Fundo claro presente | busca por `--color-bg: #fff` | 1 ocorrência |

Como não há mais nenhum bloco sensível a `prefers-color-scheme` e o
`color-scheme: light` é declarado em `:root`, a preferência de cor do sistema não
altera mais a renderização, e os controles nativos permanecem claros.

## Critérios de aceite

| AC | Situação | Evidência |
|---|---|---|
| AC01 — sistema em escuro ⇒ app claro | Demonstrado no nível de estilo compilado | CSS compilado sem `prefers-color-scheme` e com `color-scheme: light`; tokens claros em `:root`. Conferência visual no navegador fica como pendência manual (ver abaixo). |
| AC02 — legibilidade/contraste no claro | Herdado da 0015 | Os tokens claros são os mesmos auditados na 0015 (texto ≥ 4,5:1; limites/foco ≥ 3:1); a 0016 não altera cores. |
| AC03 — mudar preferência com a página aberta não muda o tema | Demonstrado no nível de estilo compilado | Não existe mais regra condicionada a `prefers-color-scheme`, logo não há caminho de mudança de tema. |
| AC04 — documentação descreve tema claro fixo | Atendido | `docs/apps/frontend.md` atualizado; não descreve mais o app como acompanhando o sistema. |

## Limites e pendências explícitas

- **Conferência visual em navegador (manual).** Seguindo o precedente da 0015, a inspeção
  em navegador não faz parte do repositório nem do CI. Não foi executada nesta sessão:
  registrar capturas locais (entrada e área autenticada) com a preferência de cor do
  navegador em escuro confirmando o tema claro. Fica como pendência para QA.
- Navegadores/extensões de alto contraste forçado permanecem fora de escopo.
- Os protótipos em `designsystem/` não foram alterados e mantêm seu controle próprio.
