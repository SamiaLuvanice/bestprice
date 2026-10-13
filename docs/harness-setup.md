# Instalação do harness

Pré-requisitos deste perfil: Python 3.13, uv, Node.js 22/npm, Docker Compose, Git e PowerShell no Windows (ou Bash em Unix). Clone o repositório, crie .env a partir de .env.example, instale backend com uv sync --locked --extra dev e frontend com npm ci. Para ferramentas que precisam projeção, execute .agents/sync.ps1 no Windows ou bash .agents/sync.sh no Unix. Codex lê AGENTS.md e .agents/ diretamente.

Rode scripts/diagnose-harness.ps1 para conferir referências. Não copie segredos, volumes ou arquivos .env para outro projeto. Se adaptar o harness, edite .agents/ e config/harness.example.yaml; os links gerados não são fonte.
