# my_bank — projeto de estudos (Java + Spring Boot + Angular)

Esta pasta contém o **harness** (agents, skills, rules, commands) que acelera o desenvolvimento
de um projeto com **backend Java/Spring Boot** e **frontend Angular**, para uso com qualquer ferramenta de IA (Codex, Claude Code, Cursor, OpenCode).

> O que mudou em relação ao harness original e por quê: [docs/HARNESS-CHANGES.md](docs/HARNESS-CHANGES.md)

## Estrutura

- `.agents/`: fonte única das configurações (agents, skills, rules, commands).
- `AGENTS.md`: ponto de entrada agnóstico (Codex, Cursor e OpenCode leem direto).
- `.claude/`: projeção gerada por `bash .agents/sync.sh` + `settings.json` (permissões).
- `backend/` e `frontend/`: a aplicação (ainda a criar — veja abaixo).
- `specs/`: especificações das features.
- `docs/`: documentação do harness e, depois, ADRs e aprendizados.
- `scripts/diagnose-harness.ps1`: valida o harness.
- `config/` e `harness.yaml`: stack, comandos de qualidade.

## Primeiros passos

1. Sincronize as ferramentas (cria os links de `.claude/` → `.agents/`):

   ```bash
   bash .agents/sync.sh
   ```

2. Crie o backend com o [Spring Initializr](https://start.spring.io) em `backend/`
   (Java LTS, Maven ou Gradle; dependências: Spring Web, Validation, Spring Data JPA, H2 Database).
3. Crie o frontend em `frontend/` (peça ao Claude: a skill `angular-new-app` guia o `ng new`).
4. Faça a primeira feature seguindo o fluxo:

   ```
   /spec <nome>  →  /plan NNNN  →  /implement NNNN  →  /verify NNNN
   ```

5. Verifique o harness a qualquer momento:

   ```powershell
   .\scripts\diagnose-harness.ps1
   ```

## Comandos do dia a dia

```bash
cd backend  && ./mvnw spring-boot:run     # API em :8080   (Gradle: ./gradlew bootRun)
cd backend  && ./mvnw test                #               (Gradle: ./gradlew test)
cd frontend && ng serve                   # SPA em :4200
cd frontend && ng build && ng test --watch=false
```

(No PowerShell, use `.\mvnw.cmd` / `.\gradlew.bat`.)

## Princípios

Simples primeiro; uma regra por assunto; evidência antes de hipótese; teste junto do código.
Sem ClickUp, Railway, CI/CD ou nuvem neste momento — o que existia ficou em `.agents/archive/`.

Nunca versione `.env`, `application-local.yml`, credenciais, `target/`, `node_modules/`.
