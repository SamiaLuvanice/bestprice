# Tarefas — 0014

## Produto

- [x] **P01 — Revisar a spec.** `spec-reviewer` sem achado bloqueante; status `pronta`.

## Implementação (TDD: Red registrado antes de cada Green)

- [x] **I01 — Vínculo e leitura da spec.** Testes de `spec-status` para padrão de
  branch, status (comentário, cabeçalho ausente, inválido), pasta ausente/ambígua,
  spec alterada no push (ignorando outras specs),
  várias branches por Issue e leitura no SHA atual. Concluída com Red → Green.
- [x] **I02 — Estado `Ready`.** Testes de `projectStatus` para `Ready`, precedência de
  responsável e Issue fechada. Concluída com Red → Green.
- [x] **I03 — Eventos de Issue consideram a spec.** `sync-project` procura branches da
  Issue e preenche `specReady`. Testes de evento e de reconciliação manual.
- [x] **I04 — Push em branch de feature.** Resolve a Issue pela branch; branch fora do
  padrão, Issue inexistente ou PR não escrevem; spec ilegível avisa sem falhar.
- [x] **I05 — Workflow.** Gatilho `push` com filtro de caminho, fallback de concorrência;
  `actionlint` verde.
- [x] **I06 — Documentação.** `docs/github-workflow.md`: matriz com `Ready`, formato do
  vínculo e reconciliação; remover "Ready apenas manual".

## Verificação e entrega

- [x] **V01 — Gates.** `node --test .github/scripts/*.test.cjs` (contagem > 0) e
  `actionlint`; registrar em `verification.md`.
- [x] **V02 — Revisão independente** (`arch-reviewer`) e QA dos ACs.
- [x] **V03 — doc-sync-onboarding** por último; PR para `develop` com `Closes #39`.
- [x] **V04 — Pós-merge.** Com branch de teste para uma Issue sem responsável, observar
  `Ready` e o retorno a `Backlog` no Project real; registrar em `verification.md`.
