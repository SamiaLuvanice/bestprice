---
description: Critérios de conclusão de uma tarefa e regra única de sincronização da documentação.
alwaysApply: true
---

# Tarefa pronta

Uma tarefa de spec só está pronta com:
1. Cada critério de aceite demonstrado em /verify.
2. Portões do escopo tocado verdes em `node .agents/scripts/gates.mjs` (filtre com `--scope`/`--only`), com contagem de testes positiva onde houver testes; checagens extras do perfil (ex.: complexidade do backend) conforme a skill quality-gates.
3. Testes de comportamento cobrem sucesso e erro principal.
4. Revisão independente ou revisão documentada do diff com as regras do perfil.
5. Fluxo local ponta a ponta conferido quando a mudança atravessa mais de uma camada.
6. Documentação sincronizada conforme a seção abaixo.

Registre comandos e resultados reais. Item não executado é pendência explícita. Implementação entregue aguarda revisão até cumprir o handoff.

## Sincronização da documentação (regra única)

Esta é a única fonte da regra; os demais arquivos apenas a referenciam.

Depois da última alteração de código, dos portões e da revisão, rode `node .agents/scripts/docs-impact.mjs`. Ele cruza o diff com o mapa `docs_impact` de `harness.yaml`:

- se listar documentos a revisar, execute o agente `.agents/agents/doc-sync-onboarding.md` na mesma branch/worktree;
- se não listar nada, registre no handoff que nenhum documento mapeado foi impactado;
- em qualquer caso, confira `AGENTS.md` e `CLAUDE.md` quando a mudança alterar instruções do harness.

Se o código mudar depois, repita a checagem. Caminho novo que deveria afetar documentação entra no mapa `docs_impact`.
