---
description: Commits, branches e arquivos não versionados.
---

# Git

Commits Conventional Commits com escopo: feat(backend), fix(frontend), docs(agents), chore(ci). Um tema por commit. Inclua Refs #<issue> no corpo; PR para develop declara Closes #<issue>.

Autoria é sempre humana. Commits, PRs, issues, reviews e comentários não creditam agentes de IA (Claude, Cursor, Codex, OpenCode, Copilot ou similares): sem trailer `Co-Authored-By` de agente, sem rodapé como "Generated with ..." e sem assinatura de ferramenta. Esta regra prevalece sobre padrões de atribuição da própria ferramenta. Antes do push, confira `git log --format=%B origin/develop..HEAD`.

main é release estável, develop integração diária e stage candidata de release. Features nascem de origin/develop em worktree e usam feature/<spec>-issue-<numero>-<slug>. Integração e promoções por PR com check CI e revisão independente. Promoção: develop → stage → main; sincronizações reversas também por PR. Não faça commit direto em branch protegida nem use --no-verify. Consulte docs/github-workflow.md.

Nunca versione .env, credenciais, dumps de banco, .venv/, __pycache__/, node_modules/, dist/ ou artefatos de teste. Preserve volumes locais.
