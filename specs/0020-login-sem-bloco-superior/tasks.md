# Tarefas — 0020 Login direto, sem bloco superior

Cada tarefa só fecha com a evidência indicada, registrada em `verification.md`.

## Preparação
- [x] T01 — Numeração duplicada resolvida: spec renumerada para 0020 (autorizado pelo responsável). Antes era: resolver a numeração duplicada com `0019-releases-por-tag-sem-main` (decisão do responsável). Rebasear a branch em `origin/develop` (8 commits atrás) e commitar o trabalho parcial passando pelos hooks. Evidência: `git log origin/develop..HEAD` e `git status` limpo.

## Contrato
- [x] T02 — Confirmar que não há mudança de REST: `git diff origin/develop -- backend frontend/src/api.ts` vazio ao final. Registrar a nota do `email` com `trim`.

## Backend
- [x] T03 — Nenhuma tarefa: sem alteração em `backend/`. Evidência: diff vazio em `backend/`.

## Frontend — grupo 1: remoção do bloco superior (AC01–AC05)
- [x] T04 — Red: testes de AC01 (sem `banner`, sem formulário de link, primeiro elemento do `main` é o login), AC02 (único `h1` "Bem-vindo de volta", sem `h2` antes) e AC04 (loading/unavailable mantêm cabeçalho e hero). Falhar pelo motivo esperado.
- [x] T05 — Green: ramo `guest` em `App.tsx`; `h2`→`h1` em `LoginForm.tsx`. Evidência: testes verdes.
- [x] T06 — Commit `feat(frontend)` do grupo 1 com `Refs #75`.

## Frontend — grupo 2: acessibilidade e validação (AC06–AC10, AC15)
- [x] T07 — Red: função de validação (casos válidos e inválidos da spec, trim), mensagens por campo ao mesmo tempo, API não chamada, sem validação no blur, `aria-invalid`/`aria-describedby`, foco no primeiro inválido, mensagens sem `role="alert"`, remoção do alerta de servidor ao falhar a validação, atributos do campo e-mail (AC09), botão ocupado com `aria-busy`/`aria-disabled`, cliques e Enter ignorados e foco preservado (AC08).
- [x] T08 — Green: `LoginForm.tsx`, limpeza do aviso em `App.tsx`, estilos de foco/erro/ocupado em `styles.css`. Atualizar os testes antigos que dependiam da validação nativa.
- [x] T09 — Registrar em `designsystem/README.md` as extensões (anel de foco, mensagem de validação).
- [x] T10 — Commit `feat(frontend)` do grupo 2.

## Frontend — grupo 3: marca, texto e efeitos (AC11–AC14)
- [x] T11 — Red: logo da coluna com nome "BestPrice" e logo reduzida presente (AC12/AC14); textos novos e ausência do parágrafo de apoio (AC13).
- [x] T12 — Green: `LoginForm.tsx` (coluna não oculta por inteiro, logo reduzida, textos) e `styles.css` (≤ 840 px sem `backdrop-filter` nem brilhos; logo ≤ 32 px de altura). Registrar a logo reduzida no `designsystem/README.md`.
- [x] T13 — Commit `feat(frontend)` do grupo 3.

## Integração e QA no navegador
- [x] T14 (comparação por valores medidos, 0 diferenças; capturas dispensadas pela emenda do AC05) — Comparar loading/unavailable com a base `b431134` em 320/768/1280 px (AC05): capturas anexadas à PR/issue, links em `verification.md`.
- [x] T15 — Medir AC03 (sem rolagem, 640 px de altura), AC06 (contraste ≥ 3:1 do foco), AC10 (≥ 4,5:1 por amostragem de pixels, > 840 e ≤ 840 px), AC11 (propriedades computadas em 840/841 px), AC12/AC14 (uma logo por vez, ≤ 32 px), AC16 (teclado, `prefers-reduced-motion`, 44 × 44 px). Valores reais em `verification.md`.

## Quality-gates
- [x] T16 — `npm run lint`, `npm test -- --run` (contagem > 0) e `npm run build` em `frontend/`. Registrar comandos e resultados reais.

## Revisão e documentação
- [x] T17 — `arch-reviewer` independente sobre o diff; `qa` valida os 16 AC. Achados voltam à mesma worktree com teste de regressão.
- [x] T18 — `verification.md` reescrito (a versão atual descreve só o escopo antigo); `docs/PROGRESS.md` atualizado.
- [x] T19 — `doc-sync-onboarding` por último, conferindo `AGENTS.md`, `CLAUDE.md` e `docs/`.
- [x] T20 (PR #82 mergeada; QA e correção de contraste na #83) — PR para `develop` com `Closes #75`, spec, resultados e pendências; CI verde; aguardar revisão independente (sem autoaprovação nem merge).
