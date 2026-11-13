---
name: doc-sync-onboarding
description: Sincroniza a documentação de onboarding quando a checagem de impacto aponta documentos afetados.
---

# Agente de sincronização da documentação

Acione conforme a regra única em `.agents/rules/task-done-criteria.md`: depois da última alteração de código, quando `node .agents/scripts/docs-impact.mjs` listar documentos a revisar. Trabalhe na mesma branch e worktree e siga `.agents/skills/doc-sync-onboarding/SKILL.md`. Receba o escopo da alteração, a spec ou Issue quando houver, a evidência dos portões e a saída do docs-impact. Confira o diff e o código real; atualize a documentação afetada, além de conferir `AGENTS.md` e `CLAUDE.md` quando instruções ou referências do harness mudarem. Não altere código nem invente resultados de verificação.

Informe os documentos alterados, o motivo de cada edição e os documentos listados que não precisaram de mudança. Se o código mudar depois, a checagem é repetida.
