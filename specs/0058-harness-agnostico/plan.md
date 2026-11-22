# Plano — 0058 Harness agnóstico e verificável

## Decisões

- **Node sem dependências** para o núcleo (`.agents/scripts/*.mjs`). Node 22 já é pré-requisito
  (frontend e `.github/scripts`). Alternativa descartada: Python, que exigiria PyYAML ou outro
  parser e não está presente em projetos só de front-end.
- **`harness.yaml` como configuração única** dos scripts, lido por um parser do subconjunto de
  YAML usado (mapas, escalares, listas inline e em bloco). Alternativa descartada: arquivo JSON
  paralelo, que duplicaria `protected_branches` e `quality`.
- **Scripts idênticos entre projetos**: nada específico da stack no código; valores em
  `harness.yaml` (`quality`, `git`, `diagnose`, `docs_impact`).
- **Wrappers preservados** (`.agents/sync.sh`, `.agents/sync.ps1`, `scripts/diagnose-harness.ps1`)
  para não quebrar hábitos e docs; só delegam.
- **Política de commit em hook e no CI**: o hook pode ser contornado localmente; o job
  `Commit policy` aplica a mesma função ao range do PR (`origin/<base>..<head.sha>`, sem o merge
  sintético do GitHub).
- **Segredos**: gitleaks no pre-commit e, no CI, em Docker só sobre os commits do evento
  (histórico antigo não é reavaliado). O diagnóstico mantém padrões próprios para arquivos
  versionáveis, com marcador por linha `gitleaks:allow` para valores fictícios intencionais.
- **Doc-sync condicional**: regra única em `task-done-criteria.md`; `docs-impact.mjs` cruza o
  diff com `docs_impact` e decide se o agente roda.
- **Núcleo × perfil**: regras, agentes e skills com termos da stack saem de `core` em
  `modules.yaml`; `diagnose.core_forbidden_terms` impede regressão.

## Arquivos

- Novos: `.agents/scripts/{lib,sync,diagnose,gates,docs-impact,commit-msg}.mjs`,
  `.agents/scripts/harness.test.mjs`.
- Alterados: `harness.yaml`, `config/harness.example.yaml`, `.agents/modules.yaml`,
  wrappers, `.pre-commit-config.yaml`, `.github/workflows/{ci,quality}.yml`,
  `.claude/settings.json`, `.gitignore`, `skills-lock.json`, regras/agentes/skills/comandos do
  núcleo, `AGENTS.md`, `.agents/AGENTS.md`, docs do harness e de CI.
- Removido: `scripts/guard-protected-branch.py` (substituído por `commit-msg.mjs`).
- Código da aplicação: só um comentário `gitleaks:allow` em `backend/app/auth/security.py`.

## Riscos

- Contribuidor sem `pre-commit install --hook-type commit-msg` não recebe o hook — mitigado pelo
  job `Commit policy`.
- Deny `Bash(cat *.env*)` também bloqueia ler `.env.example` por `cat` — use a ferramenta de
  leitura de arquivos.
- `sync.sh` com CRLF em checkout Windows com `autocrlf` (pré-existente): Git Bash chama `node`
  direto pelo wrapper ps1 ou `node .agents/scripts/sync.mjs`.
