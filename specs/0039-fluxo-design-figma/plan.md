# Plano — 0039

Issue: [#211](https://github.com/SamiaLuvanice/bestprice/issues/211).
Base: `origin/develop`, SHA `3f230793e6699f16e8443ecad045dc1d13ba3304`.
Worktree: `.worktrees/feature-0039-issue-211-fluxo-design-figma`.

## Contrato e limites

Nenhum contrato REST, runtime, banco, tela, estilo ou dependência da aplicação
será alterado. Remoção de tooling, configuração e documentação não introduz
comportamento de produto; TDD Red/Green de comportamento não se aplica.
Não haverá automação ou escrita em Figma/Paper nesta entrega.

## Dependências verificadas antes da exclusão

`tools/paper-bridge/` contém 46 arquivos versionados, pacote npm independente,
dependência própria `playwright`, scripts CDP/clipboard, CLI/API, testes e exemplos.
O adaptador lê `frontend/src/styles.css`, `features/research/research.css`,
`App.tsx`, `ResearchArea.tsx` e inventaria componentes; o gerador resolve Vite a
partir de `frontend/package.json` e produz relatórios dentro da Bridge. Nenhuma
referência executável à Bridge foi encontrada em `frontend/src`, `frontend/tests`,
`backend/app`, `backend/tests`, `scripts`, `config` ou `.github/scripts`.
O único consumidor executável externo encontrado é `.github/workflows/quality.yml`.

Paper MCP está em `.agents/mcp.json`, `.mcp.json`, `opencode.json` e
`.cursor/mcp.json`; as três últimas são projeções. A conexão global do cliente,
o plugin disponível nesta sessão e o aplicativo instalado não são gerenciados
por esses arquivos e ficam fora do escopo. Não adicionar um segundo servidor
Figma nem copiar credenciais: priorizar o conector oficial já disponível, com
autorização verificada quando houver tarefa real com arquivo/frame.

## Implementação e propriedade dos arquivos

1. Agente fullstack/tooling: excluir somente os 46 arquivos versionados de
   `tools/paper-bridge/` na nova worktree, após validar caminhos absolutos e
   consumidores. Remover só as três etapas exclusivas da Bridge em `quality.yml`.
   Preservar testes Node gerais e actionlint. Não alterar docs, MCP ou frontend.
2. Coordenador: preservar `paper` em `.agents/mcp.json` para uso eventual, conforme
   ajuste posterior solicitado pelo usuário; atualizar
   `.agents/AGENTS.md`, `.agents/rules/{workspace,frontend}.md` e
   `designsystem/{agent-guidelines,README,brand-spec}.md` para precedência Figma, componentes,
   tokens, exportações e proibição de novas bridges sem autorização. Aplicar
   `.agents/sync.ps1 -WithCursor -WithOpenCode` na mesma worktree.
3. Documentação final, após gates/revisão/QA: agente doc-sync-onboarding atualiza
   `README.md`, `docs/{index,architecture,harness-setup,PROGRESS,LEARNINGS}.md`,
   `docs/apps/{frontend,infraestrutura}.md` e aviso na auditoria histórica
   `designsystem/prototypes/2026-10-27-bestprice-ai-audit.md`. Revisar AGENTS.md e
   CLAUDE.md; evitar duplicação, manter o guia principal em `docs/apps/frontend.md`.
4. Specs 0035–0037 e seus resultados são históricos preservados. A spec 0038 e
   sua Issue #210 não serão alteradas remotamente nem seus arquivos locais
   copiados/descartados; registrar em 0039 e PROGRESS a substituição da direção
   Paper. A worktree 0038 contém modificações e arquivos novos pendentes.

## Convenções documentadas

Figma → Codex → Implementação → Validação visual. Reutilizar a organização
documentada `00 · Design system`, `01 · Telas desktop`, `02 · Telas mobile`;
identificar rota/tela/estado/viewport e link com node-id em cada handoff. Inspecionar
frame, screenshot, propriedades, variantes, tokens e mapeamento para componentes
locais. Extensões de tokens são registradas; conflitos de identidade não autorizam
redesign implícito. Exportações trazem origem, data, dimensões e limites; ausência
de detalhe essencial deve ser resolvida com referência exportada, sem inventar.

## Riscos e verificações

- Links históricos para código removido: apontar para o snapshot Git anterior à
  retirada ou identificar caminho como histórico; não apagar evidências.
- Projeções: sync pode normalizar formatação, mas todos os servidores existentes,
  inclusive Paper, devem permanecer semanticamente idênticos; comprovar parseando JSON.
- Trabalho local: nenhum `git clean`, reset, remoção de worktree, pasta de assets
  ou configuração global. Checkout principal e worktrees antigas ficam intactos.
- Rodar testes Node gerais, actionlint disponível, hooks, diff-check, comparação
  das árvores frontend/backend com a base e revisão/QA independentes.
- Lint/test/build frontend/backend completos rodam no CI da PR; gates locais dessas
  camadas não são necessários para alteração sem diff nelas. Registrar limites.
- Preparar PR para develop com Closes #211, sem merge ou deploy nesta tarefa.
