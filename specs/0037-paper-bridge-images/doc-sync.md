# Doc-sync — 0037

Executado em 28/10/2026 como etapa final após gates e revisão independente, na
worktree `feature/0037-issue-205-paper-images`. Papel
`.agents/agents/doc-sync-onboarding.md`; skills `doc-sync-onboarding` e `learnings`.
Nenhum código foi alterado nesta etapa.

## Documentos sincronizados

- `tools/paper-bridge/README.md`: comandos/confirmação, formatos/importação,
  manifesto/cópias, reutilização, validação, API, testes e limites de geração.
- `README.md`: entrada do módulo, preparo versus consumo e testes locais/live;
  retirada da pendência antiga de importação HTML já demonstrada na spec 0036.
- `docs/architecture.md`: responsabilidades dos módulos, estado atômico,
  fingerprint de pixels e fronteira da autorização/consumo.
- `docs/apps/infraestrutura.md`: execução/armazenamento, ensaios opt-in e passos
  Chromium/check/test:images do job Automation.
- `docs/index.md`: catálogo da Bridge inclui imagens/SVG e manifesto.
- `docs/PROGRESS.md`: andamento/gates/revisão/doc-sync com AC4 e CI remoto pendentes.
- `docs/LEARNINGS.md`: URL transitória não identifica conteúdo visual; parâmetros
  precisam ser relidos antes do consumo e primeiro resultado não encerra lote.
- `tasks.md` e `verification.md` desta spec: gates, revisão e etapa documental.

## Conferência e limites

Conferidos diff rastreado e arquivos novos de CLI/Bridge, módulos de imagens,
script live, exemplos, testes, política de documento/lock e workflow Quality.
Comandos/resultados reais estão em verification.md; não foram repetidos ou
ampliados nesta etapa documental. Links locais e diff documental foram conferidos.

`AGENTS.md` e `CLAUDE.md` não exigiram edição: documento autorizado, fonte `.agents/`,
fluxo e regras de onboarding continuam iguais. `docs/database.md`,
`docs/apps/backend.md`, `docs/apps/frontend.md` e `docs/product-context.md` não
exigiram edição porque banco/API/SPA/proposta de produto não mudaram. Não houve
alteração de `.agents/` nem projeções a sincronizar.

O preparo real foi demonstrado; geração remota não foi autorizada ou iniciada.
Variety pack é inspecionado e recusado para geração. Fingerprint raster usa amostra
até 128×128, sem alegar igualdade integral. Validate relata pendências sem adotar
nós automaticamente. Download via exportação pública não foi validado; manifesto
guarda referências. Handoff em PR draft e CI remoto continuam pendentes. Não houve
promoção ao documento BestPrice IA, merge ou deploy. Se o código mudar, repetir
este doc-sync.
