---
name: task-handoff
description: >-
  Obrigatório ao entregar implementação: PROGRESS/AGENT-HANDOFF,
  PR do worktree, prompt do próximo agente (revisor). Tarefa ✅ só após
  review+merge+verificação+QA (regra task-done-criteria). Use em
  handoff/continue.
---

# task-handoff

Após terminar código + testes locais verdes:

## Checklist

1. **PR aberta** contra `stage` a partir do worktree.
2. **`status` da spec** atualizado para `em revisão`, com o link da PR.
3. **Card no board** movido para a coluna de review, com o link da PR no comentário.
4. **Card no board** movido para `review` com o link da PR e a saída da verificação (skill `clickup`).
5. **Resposta ao orquestrador**: PR URL + próximo passo (revisor) + tempo estimado de review.

## O prompt do próximo agente carrega o papel

O handoff entrega um prompt pronto para o próximo agente. Ele **começa** apontando o papel e
as skills, com caminho literal — porque o tipo de subagente nem sempre está disponível, e
quando não está, o prompt é o único lugar onde o papel existe.

```
Antes de qualquer coisa, leia e siga:
- o papel: .agents/agents/arch-reviewer.md
- as skills: .agents/skills/pr-review-merge/SKILL.md
             .agents/skills/clean-architecture/SKILL.md
- as regras sempre ativas, a começar por .agents/rules/evidencia.md

Se o seu papel declara `tools:` restrito e você tem mais ferramentas,
respeite a restrição do papel.
```

Handoff sem isso entrega tarefa sem contexto, e o próximo agente reconstrói do zero o que já
estava escrito.

## Template de resposta ao orquestrador

```markdown
## Implementação entregue — {{ID}}

- **PR:** {{URL}}
- **Repos tocados:** {{lista}}
- **Testes:** `make ci` verde — colar a saída
- **Migration:** {{sim/não}} — reversível
- **Docs:** {{sim/não}}
- **Screenshot local:** {{path, se aplicável}}

### Handoff (próximo agente)

Cole em nova sessão de revisor:

```
Revisor — PR {{URL}} (tarefa {{ID}}).

1. Ler specs/{{NNNN}}-{{slug}}/spec.md (critérios de aceite)
2. Rodar make ci (verificadores em Docker)
3. Se OK → merge --squash em stage, atualizar PROGRESS ✅, comentar no ClickUp [Reviewer][<Modelo>]
4. Se bloqueio → detalhar no comentário da PR e no ClickUp

Regras: pr-review-merge, task-done-criteria.
```

### Progresso por serviço

| Serviço | Antes | Depois |
|---------|-------|--------|
| backend | X% | Y% |
| frontend | X% | Y% |

**Não** marquei ✅. Aguardando review + merge + QA.
```

## NÃO fazer

- Não use "concluído", "pronto" ou ✅ para uma tarefa que você mesmo implementou.
- Não pule a PR — nada de commit direto em `stage`.
- Não pule Docker — testes no host não valem como evidência.
- Não pule o board — comente com `[Dev]` e cole a saída dos portões.
