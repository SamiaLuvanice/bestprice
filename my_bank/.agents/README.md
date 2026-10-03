# Configuração de Agentes - `.agents/`

Esta pasta é a **fonte única de verdade** para toda configuração de agentes, skills e regras do projeto.

## Estrutura

```
.agents/
├── agents/              ← definições de papéis (backend, frontend, qa, debugger...)
├── skills/              ← skills executáveis por agentes
├── commands/            ← comandos CLI (/spec, /plan, /implement, /verify)
├── rules/               ← regras do projeto (obrigatórias em todos os commits)
├── AGENTS.md            ← documentação de como é tudo organizado
├── modules.yaml         ← núcleo × perfil java-springboot-angular
├── sources.md           ← links de referência
├── sync.sh              ← script que sincroniza as ferramentas
└── archive/             ← material de outra stack/integrações (não carregado)
```

## Como cada ferramenta acessa `.agents/`

| Ferramenta | Localização | Tipo | O que faz |
|---|---|---|---|
| **Codex** | — | nativo | Lê `AGENTS.md` e `.agents/skills` direto |
| **Claude Code** | `.claude/` | junctions/symlinks | Aponta para `.agents/` |
| **OpenCode** (opcional) | `.opencode/` | junctions/symlinks | `sync.sh --with-opencode` |
| **Cursor** | `.cursor/` | cópia `.mdc` | Copia rules em `.mdc` (único lugar com cópia) |

Todos importam `AGENTS.md` da raiz do projeto.

## Setup local

### Após clonar o repositório

```bash
bash .agents/sync.sh
```

Isso cria os symlinks (ou, no Windows sem privilégio, **junctions** automaticamente) que apontam para `.agents/`.

### Em Windows (se houver problemas de permissão)

Symlinks em Windows requerem privilégios de administrador. Se `sync.sh` falhar:

**Opção 1: Rodar como Administrador**
- Abra PowerShell como Admin e rode `bash .agents/sync.sh`

**Opção 2: Desabilitar symlinks no Git**
```bash
git config core.symlinks false
# Depois rode sync.sh novamente — usará junctions do Windows
```

**Opção 3: Ativar Developer Mode no Windows 11**
- Settings > Privacy & Security > For developers > Developer Mode ON
- Depois: `git config --global core.symlinks true`

## O que nunca editar

- Conteúdo de `.agents/` não é editado manualmente — é trazido por comando `/skill` ou `Skill` ou versionado junto
- Diretórios em `.claude/`, `.opencode/`, `.cursor/` são **ponteiros**, não sources — não edite lá

## Como adicionar uma skill nova

1. Crie em `.agents/skills/<nome>/SKILL.md`
2. Rode `bash .agents/sync.sh` para sincronizar as ferramentas
3. Commit a pasta `.agents/skills/<nome>/`

## Como adicionar um agente novo

1. Crie em `.agents/agents/<nome>.md`
2. Rode `bash .agents/sync.sh`
3. Commit o arquivo `.agents/agents/<nome>.md`

## Entendendo os links

### Linux / macOS
Verdadeiros symlinks simbólicos:
```bash
$ ls -l .claude/agents
lrwxr-xr-x  agents -> ../.agents/agents
```

### Windows (sem admin)
NTFS junctions (apontam para o mesmo diretório):
```bash
$ ls -l .claude/agents
drwxr-xr-x  agents/  # é um diretório, mas é na verdade um junction
```

Para verificar que é junction:
```powershell
fsutil reparsepoint query C:\Users\<projeto>\.claude\agents
```

## Verificando que está tudo sincronizado

```bash
# Todos esses devem apontar para ../.agents/*
readlink .claude/agents
readlink .claude/skills
readlink .claude/commands

readlink .opencode/agent
readlink .opencode/skills
readlink .opencode/command
```

Se algum der erro ou listar um arquivo em vez de um link, rode `bash .agents/sync.sh` novamente.

## Por que essa estrutura?

- **Uma source de verdade**: edita `.agents/`, todos os IDEs veem
- **Agnóstico de ferramenta**: Claude Code, OpenCode, Cursor, VS Code — todos apontam para o mesmo lugar
- **Sem duplicação**: rules e skills não existem em múltiplos lugares
- **Offline-first**: os links locais funcionam sem internet, e as IDEs leem do disco local

## Referências

- Ver AGENTS.md para como agentes e skills estão organizados
- Ver `sources.md` para links de referência da stack
- Rules obrigatórias em `.agents/rules/` — importadas no AGENTS.md da raiz
