---
description: Índice do workspace e das decisões ativas.
alwaysApply: true
---

# Workspace

Stack: FastAPI (Python 3.13) em backend/, React + TypeScript em frontend/ e PostgreSQL. BestPrice é um produto de monitoramento de preços da Amazon destinado a usuários reais. Priorize simplicidade, qualidade de produção e explicação das decisões.

Leia [docs/product-context.md](../../docs/product-context.md) antes de definir ou implementar comportamento. Preserve a proposta central: o usuário informa apenas o link uma vez e o acompanhamento passa a ser automático. Não exija cadastro manual dos dados obtidos pela integração. O contexto descreve a direção do produto; consulte a documentação técnica e o código para verificar o que já existe. Atue como engenheiro responsável por evolução incremental; prefira serviços gratuitos/free tier quando adequados, sem comprometer segurança e confiabilidade.

- Diagnóstico com evidência: evidencia.md.
- API e persistência: architecture.md, backend.md, errors.md.
- Interface: frontend.md. Contrato REST: skill api-contract.
- Convenções: naming.md, testing.md, security.md e datetime-pipeline.md.
- Processo: git.md, git-worktree-required.md, implementation-handoff.md, task-done-criteria.md.
- Descoberta: skill monorepo-navigation. Gates: skill quality-gates.

Mudança de comportamento nasce de spec numerada: /spec → /plan → /implement com TDD → /verify. A skill agent-orchestration coordena os papéis quando há delegação. GitHub Issues, PRs e CI seguem docs/github-workflow.md; Project é opcional e implantação externa não está configurada.

Após qualquer alteração de código, execute o agente `doc-sync-onboarding` como última etapa da tarefa, depois dos gates e da revisão. Confira `AGENTS.md`, `CLAUDE.md` e os documentos afetados em `docs/`; sincronize o que a mudança exigir. A tarefa de código só pode ser considerada concluída após esse agente terminar. Se houver nova alteração de código, repita a sincronização.

Identificadores em inglês; documentação e mensagens para usuários em português. Segredos só por ambiente. Dinheiro usa Decimal no Python e NUMERIC no PostgreSQL; instantes UTC. Verifique testes e build antes da entrega.
