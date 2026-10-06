---
description: Índice do workspace e das decisões ativas.
alwaysApply: true
---

# Workspace

Stack: FastAPI (Python 3.13) em backend/, React + TypeScript em frontend/ e PostgreSQL. Projeto de estudos: simplicidade e explicação das decisões.

- Diagnóstico com evidência: evidencia.md.
- API e persistência: architecture.md, backend.md, errors.md.
- Interface: frontend.md. Contrato REST: skill api-contract.
- Convenções: naming.md, testing.md, security.md e datetime-pipeline.md.
- Processo: git.md, git-worktree-required.md, implementation-handoff.md, task-done-criteria.md.
- Descoberta: skill monorepo-navigation. Gates: skill quality-gates.

Mudança de comportamento nasce de spec numerada: /spec → /plan → /implement com TDD → /verify. A skill agent-orchestration coordena os papéis quando há delegação. GitHub Issues, PRs e CI seguem docs/github-workflow.md; Project é opcional e implantação externa não está configurada.

Identificadores em inglês; documentação e mensagens para usuários em português. Segredos só por ambiente. Dinheiro usa Decimal no Python e NUMERIC no PostgreSQL; instantes UTC. Verifique testes e build antes da entrega.
