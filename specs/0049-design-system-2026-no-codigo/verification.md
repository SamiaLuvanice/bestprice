# Verificação da spec 0049

Registro do papel `frontend` (Fases 0 a 4 de [tasks.md](tasks.md)). Worktree
`.worktrees/feature-0049-issue-267-design-system-2026`, branch
`feature/0049-issue-267-design-system-2026`, base `origin/develop` `de5d8ee`
(ponta inicial `1d35d5c`). Sistema da execução: Windows 11 (sem SF Pro instalada),
Chromium do Playwright 1.64 headless, Node do ambiente local. Evidência de TDD em
[frontend-evidence.md](frontend-evidence.md).

Este registro não afirma resultado de CI, PR, revisão independente nem comparação lado a lado
com o Figma (Fase 5, D3/F24–F26, fora desta delegação).

## F0 — Linha de base (sem alterações, ponta `1d35d5c`)

Comandos em `frontend/` depois de `npm ci`:

| Comando | Resultado |
|---|---|
| `npm run lint` | 0 problemas |
| `npm test` (1ª execução) | 38 arquivos; **530 passed, 1 failed** (531) |
| `npm test` (2ª execução) | 4 arquivos falharam; 4 testes: `App.test.tsx` (heading "Fone sem fio" não encontrado) e 3 *timeouts* de 15 s (`hero`, `products`, `refresh-row`) |
| `npx vitest run` só nos 4 arquivos | **82 passed** (4 arquivos) |
| `npm run build` | ok (2666 módulos; CSS 97,70 kB, JS principal 424,92 kB) |
| `npx playwright test` | **203 passed, 19 failed, 54 skipped** (4,8 min) |

**Observação sobre o Vitest:** as falhas mudam entre execuções e somem com os arquivos isolados.
Inferência: instabilidade por carga (12 núcleos, 38 ambientes jsdom em paralelo), não regressão.
Não foi corrigida nesta spec; fica registrada como risco para as contagens das fases seguintes.

### Classificação das 19 falhas da Issue #259

Reexecutadas com `npx playwright test --last-failed --reporter=line`; diffs em
`frontend/test-results/` (não versionado).

| # | Teste | Larguras | Falha observada | Causa (evidência) | Classe | Destino |
|---|---|---|---|---|---|---|
| 1–8 | `public-pages.spec.ts` "landing pública" (claro e escuro) | 320, 390, 768, 1280 | 801 px diferentes (0,01) | O diff (`landing-light-diff.png`) só marca a marca no cabeçalho; o restante da página é idêntico. A marca da landing passou a 34 px em `fb46498` (assistente do Figma, 02/11) e a baseline é anterior | **Baseline desatualizada** | Separada para a Fase 5 (F26) / #259; nenhuma baseline foi alterada nesta delegação |
| 9–16 | `brand.spec.ts` "marca landing" e "marca inicio" | 320, 390, 768, 1280 | `image.width` esperado ≥ 40, recebido 34 | Mesma mudança intencional: `.research-brand .brand-logo { width:34px }` (shell interno aprovado no Figma, 0040/0043). A asserção é anterior ao shell | **Asserção visual desatualizada** (não é regressão de produto) | Separada para a Fase 5 / #259; atualizar a asserção exige confirmar o tamanho contra o quadro do Figma |
| 17–19 | `redesign.spec.ts` "produtos", "detalhe", "alertas" | 1280 | axe `label-content-name-mismatch` em `.account-button` | Em 1280 o e-mail fica visível; o texto visível do botão incluía a inicial do avatar ("P" + e-mail), que não está contida no nome acessível `Conta: pessoa@example.com` (WCAG 2.5.3) | **Regressão real de acessibilidade** | **Corrigida** antes da Fase 1: a inicial passou para `data-initial` + `::before` (CSS), sem mudar o nome acessível. `npx playwright test tests/visual/redesign.spec.ts --project=viewport-1280` → **15 passed** |
