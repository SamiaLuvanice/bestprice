---
description: Commits, branches e arquivos não versionados.
---

# Git

Commits Conventional Commits com escopo: feat(backend), fix(frontend), docs(agents), chore(ci). Um tema por commit. Inclua Refs #<issue> no corpo; PR para develop declara Closes #<issue>.

main é release estável, develop integração diária e stage candidata de release. Features nascem de origin/develop em worktree e usam feature/<spec>-issue-<numero>-<slug>. Integração e promoções por PR com check CI e revisão independente. Promoção: develop → stage → main; sincronizações reversas também por PR. Não faça commit direto em branch protegida nem use --no-verify. Consulte docs/github-workflow.md.

Nunca versione .env, credenciais, dumps de banco, .venv/, __pycache__/, node_modules/, dist/ ou artefatos de teste. Preserve volumes locais.
