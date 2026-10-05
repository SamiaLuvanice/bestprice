# .agents — configuração de agentes, agnóstica de ferramenta

Toda instrução de agente deste projeto vive aqui. É a **fonte única**. As pastas por
ferramenta (`.claude/`, `.opencode/`, `.cursor/`) contêm apenas links criados por
[`sync.sh`](sync.sh) e a config exclusiva de cada uma (ex.: `.claude/settings.json`).

Stack do projeto: **Java + Spring Boot** (`backend/`) e **Angular** (`frontend/`). Funciona com **Codex, Claude Code, Cursor e OpenCode**.

## Layout

```
.agents/
  AGENTS.md          este arquivo
  modules.yaml       o que é núcleo e o que é do perfil java-springboot-angular
  sources.md         links de referência do projeto
  sync.sh            cria os links por ferramenta (symlink, ou junction no Windows)
  agents/            papéis — frontmatter `name` + `description`
  rules/             regras; as principais entram por @import no AGENTS.md da raiz
  skills/            sob demanda — <nome>/SKILL.md + apoio
  commands/          /spec · /plan · /implement · /verify
  archive/           material de outra stack/integrações — NÃO é carregado
AGENTS.md            (raiz) ponteiro curto + @import das regras sempre ativas
CLAUDE.md            (raiz) `@AGENTS.md` + @import das regras (só o Claude expande @)
skills-lock.json     (raiz) versões das skills externas instaladas via `npx skills`
```

## O que está aqui

**Agents:** `backend` (Spring Boot), `frontend` (Angular), `fullstack`, `qa` (testes e aceite),
`arch-reviewer` (arquitetura e qualidade), `debugger` (causa raiz), `product-owner`, `spec-reviewer`.

**Rules:** processo — `workspace` (índice), `evidencia`, `task-done-criteria`, `git`,
`git-worktree-required` (branches/worktrees) e `implementation-handoff` (entrega/revisão).
Técnicas — `architecture`, `java-spring`, `errors`, `frontend`, `naming`, `testing`, `security`, `datetime-pipeline`.

**Skills:**

| Origem | Skills |
|---|---|
| Externas (instaladas por `npx skills add`) | `java-springboot` (github/awesome-copilot), `angular-developer` e `angular-new-app` (angular/skills, oficiais) |
| Do projeto — stack | `spring-boot-feature`, `spring-boot-testing`, `api-contract`, `monorepo-navigation`, `solid-principles` |
| Do projeto — processo | `spec-driven`, `po-intake`, `quality-gates`, `bug-resolve`, `learnings` |

## Skills externas: como instalar sem quebrar a fonte única

O comando `npx skills add ... -a claude-code` copia direto para `.claude/skills/`. Aqui, **mova**
a pasta instalada para `.agents/skills/` e rode `bash .agents/sync.sh`:

```bash
npx skills add https://github.com/github/awesome-copilot --skill java-springboot -a claude-code -y
mv .claude/skills/java-springboot .agents/skills/    # e .claude/skills se ficar vazio
```

## Como as ferramentas enxergam

| Ferramenta | O que existe na pasta dela | Como |
|---|---|---|
| Codex | nada — lê `AGENTS.md` e `.agents/skills` | nativo |
| Claude Code | `.claude/agents`, `.claude/skills`, `.claude/commands` | link → `.agents/` |
| | `.claude/settings.json` | config exclusiva — fica lá mesmo |
| OpenCode (opcional) | `.opencode/...` | `bash .agents/sync.sh --with-opencode` |
| Cursor (opcional) | `.cursor/...` | `bash .agents/sync.sh --with-cursor` |

As **rules** não têm link: o `AGENTS.md` da raiz lista as sempre ativas por caminho (sem `@import`,
que só o Claude entende) e as demais são lidas sob demanda quando o agente/skill as cita.

```bash
bash .agents/sync.sh        # após clonar, ou ao adicionar skill/agent
```

## Como editar

1. Regra → `rules/<tema>.md` (e, se for sempre ativa, a lista no `AGENTS.md` da raiz,
   a lista de rules em `modules.yaml` e o `@import` no `CLAUDE.md`)
2. Procedimento reutilizável → `skills/<nome>/SKILL.md`
3. Papel de agente → `agents/<papel>.md`
4. Endereço externo → `sources.md`

## Convenções que não se negociam

- **Nomes neutros.** Skill, rule e agente não carregam nome de produto ou cliente anterior.
- **Simples primeiro.** Camadas Controller → Service → Repository e pacotes por feature
  (`rules/architecture.md`). Complexidade extra exige um motivo escrito.
