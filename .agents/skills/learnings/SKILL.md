---
name: learnings
description: >-
  Captura de aprendizados e evolução contínua de boas práticas e
  design system. Use após qualquer bug fix, feature ou code review
  que revele um padrão novo, anti-pattern a evitar, ou regra que deva
  ser documentada para consistência futura do código. Também use ao
  receber instrução do usuário sobre "aprendizado", "boa prática",
  "design system", ou "documentar isso".
---

# learnings

Quando aparecer algo que **outros agentes precisarão saber**:

1. Se é regra de código → adicionar em `.agents/rules/<tema>.md` (fonte única; os adaptadores por ferramenta são symlinks e não precisam de cópia).
2. Se é padrão de skill → editar a skill relevante em `.agents/skills/<tema>/SKILL.md`.
3. Se é aprendizado geral → adicionar em `docs/LEARNINGS.md` com data, contexto e princípio extraído.

## Formato de entrada em `docs/LEARNINGS.md`

```markdown
## 2026-08-19 — Nome curto do aprendizado

**Contexto:** o que aconteceu (bug, code review, decisão de design).

**Princípio:** a regra generalizável.

**Anti-pattern:** o que **não** fazer.

**Referências:** PR #, tarefa T-*, arquivo:linha.
```

## Quando escalar para regra

- Aparece **≥ 2 vezes** em revisões diferentes.
- Corrige categoria de bug (não incidente isolado).
- Convenção que muda produto (UX, naming, contratos).

Nesse caso, editar o `.md` correspondente em `.agents/rules/` e adicionar linha em `workspace.md` se for cross-cutting.

## Fonte única (sem espelho)

Toda regra vive **apenas** em `.agents/rules/`. As ferramentas (Codex, Claude Code, OpenCode, Cursor) enxergam a mesma pasta via symlink criado por `.agents/sync.sh` — não existe cópia para manter em dia.
