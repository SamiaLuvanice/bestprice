# Customização por projeto

## Deve ser alterado

- `harness.yaml`;
- `.agents/sources.md`;
- regras específicas da stack;
- comandos de build e teste (`harness.yaml → quality`);
- URLs e credenciais fornecidas somente pelo ambiente.

## Deve permanecer compartilhado

- formato de agents, skills e commands;
- `AGENTS.md` sem sintaxe de uma só ferramenta (nada de `@import`; isso fica no `CLAUDE.md`);
- regras de segurança, evidência e falha explícita;
- sincronização entre ferramentas;
- procedimento de revisão e a skill `spec-driven`;
- convenções de handoff e critérios de aceite.

Não edite `.claude/agents`, `.claude/skills`, `.opencode/agent`,
`.opencode/skills` ou equivalentes gerados. Edite `.agents/` e sincronize.
