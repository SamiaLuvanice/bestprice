# O que mudou no Harness (e por quê)

Harness original: FastAPI + React/Vue/Angular, board ClickUp, deploy Railway, orquestração de
vários agentes. Harness atual: **Java + Spring Boot + Angular**, para estudo, local e simples.

Método: nada foi apagado às cegas. O que não serve agora foi **movido** para `.agents/archive/`
(ninguém o carrega, mas dá para restaurar). O que serve foi mantido ou adaptado.

## 1. Skills

### Instaladas (novas, externas)

| Skill | Origem | Por quê |
|---|---|---|
| `java-springboot` | `github/awesome-copilot` | pedido; boas práticas gerais de Spring Boot (pacotes por feature, injeção por construtor, DTOs, `@ControllerAdvice`, teste em fatias) |
| `angular-developer` | `angular/skills` (oficial) | **substitui** `analogjs/.../angular-component`, que está **descontinuada e esvaziada** (o próprio texto manda usar `angular/skills`). Cobre componentes, signals, formulários, rotas, DI, HTTP, testes |
| `angular-new-app` | `angular/skills` (oficial) | acompanha a anterior; guia o `ng new` correto |

O CLI (`npx skills add`) grava em `.claude/skills/`; as pastas foram **movidas** para
`.agents/skills/` para manter a fonte única. `skills-lock.json` (raiz) registra as versões.

### Criadas

| Skill | Por quê |
|---|---|
| `spring-boot-feature` | receita da fatia vertical (entity → repository → DTO → service → controller) com esqueleto; substitui `fastapi-feature` |
| `spring-boot-testing` | JUnit 5, Mockito, `@WebMvcTest`, `@DataJpaTest`; substitui `fastapi-testing` |

### Adaptadas (mesma ideia, nova stack)

`api-contract` (OpenAPI/codegen de 3 frontends → contrato simples no `plan.md` entre DTO Java e interface TS),
`monorepo-navigation` (comandos `mvnw`/`ng`), `quality-gates` (de `make ci` para `mvnw verify` + `ng build/test`),
`solid-principles` (exemplos Java/Angular), `bug-resolve` (sem card/staging: reproduzir → teste que falha → corrigir → confirmar),
`po-intake` + template (sem board/worktree/Railway), `spec-driven` e `learnings` (ajustes pontuais).

### Mantidas como estavam

`spec-driven` (núcleo do fluxo), `learnings`.

### Arquivadas

`clickup`, `drive-artefatos`, `stage-to-main` (integrações/Railway — pedido), `agent-orchestration`
(pipeline multiagente), `task-handoff`, `pr-review-merge` (handoff antigo e deploy), `fastapi-*`,
`react-feature`, `vue-feature`, `frontend-parity` (outras stacks), `clean-architecture`
(ports/adapters Python; não corresponde à arquitetura simples por feature), `i18n` (idiomas fora
do escopo), `qa-visual` (precisa de roteiro e ambiente configurados). As ideias reutilizáveis de
`angular-feature` e `datetime` foram reescritas nas skills de projeto
`.agents/skills/angular-feature/` e `.agents/skills/java-datetime/`.

Os scripts antigos de proteção de branch e isolamento de containers também foram adaptados:
`scripts/guard-protected-branch.py` protege as branches integradoras do fluxo atual, e
`scripts/compose-worktree.ps1` separa nome/portas do Docker Compose por worktree. E2E visual e
validação Schemathesis continuam arquivados porque não há Playwright, specs E2E nem contrato
OpenAPI configurados neste projeto.

## 2. Agents

| Agent | Situação | Mudança |
|---|---|---|
| `backend` | adaptado | Spring Boot em vez de FastAPI |
| `frontend` | adaptado | Angular em vez de React |
| `fullstack` | adaptado | ordem contrato → backend → frontend, sem `codegen` |
| `qa` | adaptado | virou agente de **testes** e validação de aceite (JUnit/Angular), sem Playwright/staging |
| `arch-reviewer` | adaptado | revisa arquitetura **e** qualidade geral (Java/Spring/Angular) |
| `spec-reviewer`, `product-owner` | mantidos | só removidas referências a board/specs inexistentes |
| `debugger` | **novo** | pedido (debugging); curto, aplica a regra `evidencia` + `bug-resolve` |
| `orchestrator` | arquivado | coordenação de vários subagentes é excesso para estudo |

Não foram criados agentes separados de "arquitetura" ou "code review": o `arch-reviewer` já cobre os dois.

## 3. Rules

| Rule | Situação | Mudança |
|---|---|---|
| `workspace` | reescrita | índice novo; dinheiro (`BigDecimal`), datas, idioma |
| `architecture` | reescrita | Controller → Service → Repository, pacotes por feature, entity fora da API; estrutura Angular. Troca "Uncle Bob com ports" por algo mais didático |
| `java-spring` | **nova** | convenções Java, Spring, REST, Bean Validation, JPA, logs |
| `errors` | reescrita | `ProblemDetail` nativo do Spring + `@RestControllerAdvice` |
| `frontend` | reescrita | Angular moderno (standalone, OnPush, signals, services, rotas lazy, formulários, 4 estados) |
| `naming` | reescrita | Java e TypeScript/Angular |
| `security` | reescrita | BCrypt, segredos por ambiente, CORS, entrada; removido o desenho de refresh-token com rotação (complexo demais) |
| `testing` | reescrita | JUnit/Mockito/slices e testes Angular; mantida a ideia "teste que nunca falhou não prova nada" |
| `git` | adaptada | só `main`; sem `stage`; atribuição só se o dono pedir |
| `datetime-pipeline` | reescrita (enxuta) | `Instant`/UTC e `BigDecimal` |
| `evidencia` | enxugada | de 11 KB para o essencial; tabela de "onde está a evidência" agora para Java/Spring/Angular |
| `task-done-criteria` | simplificada | sem board/deploy/QA em staging: testes + build + revisão |
| `git-worktree-required`, `implementation-handoff`, `i18n` | arquivadas | processo de equipe / escopo fora do estudo |

## 4. Configuração

| Arquivo | Mudança |
|---|---|
| `AGENTS.md` (raiz) | **lista por caminho** as 4 regras sempre ativas e explica como usar skills/agents/comandos sem suporte nativo. Antes usava `@import`, que só o Claude Code expande — Codex e Cursor nunca carregavam as regras |
| `CLAUDE.md` | `@AGENTS.md` + `@import` das 4 regras (o `@` fica restrito ao arquivo do Claude) |
| `harness.yaml`, `config/harness.example.yaml` | perfil `java-springboot-angular`; comandos `mvnw`/`ng`; branch única `main`; sem integrações |
| `.agents/modules.yaml` | núcleo × perfil novo; `integrations: {}` |
| `.agents/sources.md` | sem board/deploy; só referências da stack |
| `.agents/sync.sh` | Claude por padrão (OpenCode/Cursor opt-in; Codex lê `AGENTS.md` e `.agents/skills` sem sync); não substitui mais o `CLAUDE.md`; **fallback para junction no Windows** e `nativestrict` (o `ln -s` do Git Bash fazia cópia silenciosa, quebrando a fonte única) |
| `.claude/settings.json` | **novo**: permite `mvnw/gradlew/ng/npm`, leitura de git; nega ler `.env`/`application-local.yml`, `push --force`, `--no-verify` |
| `.pre-commit-config.yaml` | só hooks genéricos (YAML/JSON, chave privada, arquivos grandes); removidos black/ruff/mypy/uv |
| `scripts/` | só `diagnose-harness.ps1`; demais (worktree, E2E, contrato, guarda de `stage`) arquivados |
| `.gitignore` | **novo**: segredos, `target/`, `node_modules/`, `dist/`, projeções geradas |
| `docs/harness-*.md`, `README.md`, `.agents/AGENTS.md`, `.agents/README.md` | atualizados para a nova stack |

## 5. Decisões que você pode rever

- **400 vs 422 em validação:** usei 400 (padrão do Spring). Se preferir 422, ajuste `errors.md`.
- **Mockito permitido** nos testes de service (a regra antiga proibia mocks): é o caminho mais comum no ecossistema Spring e mais fácil de aprender.
- **Sem Flyway/Testcontainers/springdoc por padrão:** estão citados como opcionais, para você adotar quando quiser estudá-los.
- **Maven ou Gradle:** nada fixa um; os exemplos mostram os dois.

## 6. Como usar

```bash
bash .agents/sync.sh                  # recria .claude/ (links) após clonar ou mudar skills
.\scripts\diagnose-harness.ps1        # valida o harness
```

Fluxo: `/spec` → `/plan` → `/implement` → `/verify`; antes de entregar, o agent `arch-reviewer`.
Reinicie a ferramenta (Claude Code, Codex, Cursor...) ou abra uma sessão nova para carregar as skills e agents recém-linkados.
