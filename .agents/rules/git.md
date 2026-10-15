---
description: Commits, branches e arquivos não versionados.
---

# Git

Commits Conventional Commits com escopo: feat(backend), fix(frontend), docs(agents), chore(ci). Um tema por commit. Inclua Refs #<issue> no corpo; PR para develop declara Closes #<issue>.

Autoria é sempre humana. Commits, PRs, issues, reviews e comentários não creditam agentes de IA (Claude, Cursor, Codex, OpenCode, Copilot ou similares): sem trailer `Co-Authored-By` de agente, sem rodapé como "Generated with ..." e sem assinatura de ferramenta. Esta regra prevalece sobre padrões de atribuição da própria ferramenta. Antes do push, confira `git log --format=%B origin/develop..HEAD`.

develop é a integração diária e branch padrão; stage valida candidatas. Releases estáveis são publicadas por tag SemVer no SHA validado em stage. Features nascem de origin/develop em worktree e usam feature/<spec>-issue-<numero>-<slug>. Integração e promoções develop ↔ stage ocorrem por PR com check CI; solicite revisão independente quando houver outra pessoa disponível, mas o ruleset do repositório não exige aprovação humana para o fluxo solo. Sincronizações reversas também ocorrem por PR. Não faça commit direto em branch protegida nem use --no-verify. Consulte docs/github-workflow.md.

Nunca versione .env, credenciais, dumps de banco, .venv/, __pycache__/, node_modules/, dist/ ou artefatos de teste. Preserve volumes locais.
