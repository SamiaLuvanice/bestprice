# Plano — Spec 0016

## Escopo e contrato

Base inspecionada: `6ddf407` de `origin/develop`. Não há backend, migration ou novo
contrato REST nesta entrega. Preservar `frontend/src/api.ts`, endpoints, DTOs, mensagens,
paginação e estados de domínio de 0011–0013.

A entrega altera apenas a apresentação: fixa o tema claro da SPA. Os protótipos em
`designsystem/` (incluindo o controle demonstrativo de tema em `designsystem/index.html`)
não são alterados.

## Decisão de desenho

1. Remover integralmente o bloco `@media (prefers-color-scheme: dark) { :root { ... } }`
   de `frontend/src/styles.css`. O seletor `:root` já define `color-scheme: light` e todos
   os tokens claros; sem a sobrescrita do sistema, a aplicação rende sempre clara, inclusive
   nos controles nativos de formulário (que respeitam `color-scheme`).
   - Alternativa descartada: manter o bloco e neutralizá-lo com uma condição impossível
     (ex.: `@media (prefers-color-scheme: dark) and (max-width: 0px)`). É frágil e deixa
     código morto; remover é mais simples e direto.
   - Alternativa descartada: adicionar `html { color-scheme: light only }`. `only` não é
     amplamente suportado e não substitui a remoção dos tokens escuros.
2. Nenhuma alteração em componentes, hooks, tokens claros, contraste ou layouts.

## Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `frontend/src/styles.css` | Remover o bloco `@media (prefers-color-scheme: dark)` (linhas 55–88 na base) |
| `docs/apps/frontend.md` | Descrever o tema claro fixo (linhas 15–18 e a linha 58 da tabela) |
| `docs/PROGRESS.md` | Registrar a spec 0016 |
| `specs/0016-tema-claro-padrao/verification.md` | Evidência e portões |

Nenhum arquivo novo de código ou dependência nova.

## Testes e evidências

O tema é CSS global e não há comportamento de componente associado; espelhar classes/CSS em
teste automatizado adiciona ruído sem cobrir o requisito. Segue-se o precedente da 0015:
para CSS, evidência visual e suíte existente. Portanto:

1. Rodar em `frontend/`: `npm run lint`, `npm test -- --run` (contagem verde mantida) e
   `npm run build`.
2. Evidência visual: com a preferência de cor do navegador/sistema em escuro, registrar que
   a aplicação renderiza clara (capturas locais, ignoradas pelo Git). Conferir entrada e
   área autenticada.

## Riscos

- CSS global afeta todas as superfícies; a remoção é única e verificável por inspeção.
- Nenhum teste cobre o tema hoje; a demonstração de AC01–AC03 é visual, conforme acima.

## Documentação e responsabilidades

- `docs/apps/frontend.md`: fonte da descrição de tema ativo; atualizar junto.
- `docs/PROGRESS.md`, `verification.md`: andamento e resultados reais.
- Revisão independente: arch-reviewer; aceite: QA. Após a última mudança de código,
  doc-sync-onboarding encerra a sincronização.
- Handoff por PR para `develop` com `Closes #52`.
