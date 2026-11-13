# Verificação — 0058

Executado em 13/11/2026 na worktree `.worktrees/feature-0058-issue-322-harness-agnostico`
(Windows 11, Git Bash, Node 22.18.0, Docker 29.1.3).

| AC | Comando | Observado |
|---|---|---|
| AC01 | `node .agents/scripts/sync.mjs`; `diff -r` com a projeção anterior | `.mcp.json`, `opencode.json`, `.cursor/mcp.json` sem diff; `.claude/{agents,skills,commands}` e `.opencode/{agent,skills,command}` como junction. `.opencode/generated/agents` difere só porque a versão anterior (ps1) gerava BOM e acentuação corrompida (`implementaÃ§Ã£o`); a nova sai em UTF-8 correto. `bash .agents/sync.sh --check` e `.agents/sync.ps1 -Check` → "Projeções em dia." |
| AC02 | `sync.mjs --check` antes da correção do script | Falhou nomeando `.cursor/mcp.json` (cópia reformatada); corrigido para cópia fiel. Teste "sync --check acusa projeção MCP desatualizada" cobre o caso. |
| AC03 | `commit-msg.mjs` com "Update stuff"; com `Co-Authored-By: Claude …`; repositório temporário na branch `develop` | Exit 1 com o motivo nos três; `[bootstrap-guard]` libera (exit 0). |
| AC04 | `node .agents/scripts/commit-msg.mjs --range origin/develop..HEAD` | ok para os commits da branch. Job `Commit policy` no `ci.yml` e no agregador. |
| AC05 | `docker run rhysd/actionlint:1.7.12` | Sem achados (exit 0). Gitleaks `v8.30.1` em Docker sobre `origin/develop..HEAD` num clone limpo: "2 commits scanned … no leaks found". Pre-commit gitleaks: Passed. |
| AC06 | `node .agents/scripts/diagnose.mjs` | "Harness válido". Primeira execução revelou: skill `vercel-react-best-practices` travada sem pasta (removida do lock); `ana@exemplo.com` proibido mas usado como fixture desde a spec 0048 (removido da lista); senhas fictícias em testes/QA (ignore_paths); regex de senha atravessando linhas e `TOKEN = "[bootstrap-guard]"` (padrões corrigidos, com testes). Avisos: pastas `.worktrees/feature-0049-…` e `feature-0050-…` sem worktree registrada (não removidas). |
| AC07 | `node .agents/scripts/gates.mjs --list`; `--scope automation` | 9 portões com diretório correto; automação: 63 testes, diagnóstico ok. |
| AC08 | `node .agents/scripts/docs-impact.mjs` | Listou CLAUDE.md, docs do harness, `infraestrutura.md`, `github-workflow.md`, `backend.md`, `architecture.md`. Regra só em `task-done-criteria.md`. |
| AC09 | `diagnose.mjs` com `core_forbidden_terms`; sonda acrescentando "pytest" a `evidencia.md` | Sem achados; a sonda gerou "núcleo cita termo da stack (pytest)" e foi revertida. |
| AC10 | `.claude/settings.json` | Deny `Bash(cat *.env*)`, `Bash(type *.env*)`, `Bash(Get-Content *.env*)`; allow `Bash(node .agents/scripts/*)`. |

## Portões

- `node --test ".agents/scripts/*.test.mjs"` → 15/15.
- `node --test .github/scripts/*.test.cjs` → 50/50.
- `uvx ruff check backend/app/auth/security.py` → All checks passed (única linha de aplicação alterada: comentário).
- Pytest e Vitest completos não executados: nenhum comportamento da aplicação mudou.

## Doc-sync

`docs-impact.mjs` apontou os documentos acima. Atualizados: `docs/harness-setup.md`,
`harness-modules.md`, `harness-customization.md`, `HARNESS-CHANGES.md`,
`apps/infraestrutura.md`, `github-workflow.md`, `PROGRESS.md`, `AGENTS.md`, `.agents/AGENTS.md`.
Conferidos sem mudança: `CLAUDE.md` (imports válidos), `docs/apps/backend.md` e
`docs/architecture.md` (só comentário em `security.py`).

## Pendências

- Revisão independente e CI da PR.
- Limpar manualmente as pastas órfãs em `.worktrees/` após conferir o conteúdo.

## Revisão independente (13/11/2026) — correções nos scripts compartilhados

A revisão independente feita no Personal_Portfolio (mesmo núcleo `.agents/scripts/`) gerou correções
replicadas aqui, com testes de regressão:

- `commit-msg.mjs`: coautores humanos com nomes como "Devin Smith" ou "Jules Verne" eram recusados.
  Agora os produtos inequívocos casam por palavra inteira e os nomes ambíguos só pelo e-mail de bot.
- `lib.mjs` (`parseYaml`): passa a aceitar lista compacta (`chave:\n- item`) e apóstrofo em valor sem
  aspas (`it's ok # comentário`).
- `sync.mjs`: uma pasta real em lugar de projeção é movida para `*.bak-<data>` em vez de apagada; no
  Cursor, só são removidas as regras `.mdc` que o próprio sync gerou (manifesto `.harness-generated`).
- `ci.yml` (Secrets): em push, quando o `before` não existe no clone (push forçado), cai para `-1`.

| Comando | Resultado |
|---|---|
| `node --test ".agents/scripts/*.test.mjs"` | 18 pass, 0 fail |
| `node .agents/scripts/sync.mjs --check` | Projeções em dia |
| `node .agents/scripts/diagnose.mjs` | Harness válido; 2 avisos de pastas órfãs em `.worktrees/` (0049, 0050) |
