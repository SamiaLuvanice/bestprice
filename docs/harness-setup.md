# Instalação do harness

## Pré-requisitos

- JDK LTS (o projeto declara a versão em `pom.xml`/`build.gradle`) — Maven/Gradle vêm pelo wrapper (`mvnw`/`gradlew`).
- Node.js LTS e Angular CLI (`npm i -g @angular/cli`) ou `npx @angular/cli`.
- Git e PowerShell no Windows; Bash no Linux/macOS.

## Instalação em um projeto existente

1. Copie `.agents/`, `scripts/`, `config/`, `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json` para a raiz.
2. Crie `harness.yaml` a partir de `config/harness.example.yaml`.
3. No Windows, rode `.\.agents\sync.ps1`; no Linux/macOS, `bash .agents/sync.sh`.
   Só Claude/OpenCode/Cursor precisam dele; o Codex lê `AGENTS.md` e `.agents/skills` direto.
4. Rode `.\scripts\diagnose-harness.ps1`.

## Instalar uma skill externa

Veja a seção "Skills externas" em `.agents/AGENTS.md` (instalar e **mover** para `.agents/skills/`).

## Verificação

- `AGENTS.md` não aponta para arquivos inexistentes;
- não há `.env`, token, senha ou chave privada no repositório;
- `bash .agents/sync.sh` é repetível sem destruir nada.
