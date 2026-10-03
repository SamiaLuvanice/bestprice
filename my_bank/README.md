# my_bank — projeto de estudos (Java + Spring Boot + Angular)

Esta pasta contém o **harness** (agents, skills, rules, commands) que acelera o desenvolvimento
de um projeto com **backend Java/Spring Boot** e **frontend Angular**, para uso com qualquer ferramenta de IA (Codex, Claude Code, Cursor, OpenCode).

> O que mudou em relação ao harness original e por quê: [docs/HARNESS-CHANGES.md](docs/HARNESS-CHANGES.md)

## Estrutura

- `.agents/`: fonte única das configurações (agents, skills, rules, commands).
- `AGENTS.md`: ponto de entrada agnóstico (Codex, Cursor e OpenCode leem direto).
- `.claude/`: projeção gerada por `bash .agents/sync.sh` + `settings.json` (permissões).
- `backend/`: API Spring Boot 4.1 (Java 25, Maven, Postgres/H2). `frontend/`: Angular 21 (SCSS, rotas).
- `docker-compose.yml`: sobe banco + API + SPA juntos.
- `specs/`: especificações das features.
- `docs/`: documentação do harness e, depois, ADRs e aprendizados.
- `scripts/diagnose-harness.ps1`: valida o harness.
- `config/` e `harness.yaml`: stack, comandos de qualidade.

## Primeiros passos

1. Sincronize as ferramentas (cria os links de `.claude/` → `.agents/`):

   ```bash
   bash .agents/sync.sh
   ```

2. Instale as dependências do frontend (o `.npmrc` já traz o contorno de um bug do npm 10):

   ```bash
   cd frontend && npm install
   ```

3. Faça a primeira feature seguindo o fluxo:

   ```
   /spec <nome>  →  /plan NNNN  →  /implement NNNN  →  /verify NNNN
   ```

4. Verifique o harness a qualquer momento:

   ```powershell
   .\scripts\diagnose-harness.ps1
   ```

## Comandos do dia a dia

```bash
cd backend  && ./mvnw spring-boot:run     # API em :8080 com H2 em memória
cd backend  && ./mvnw test
cd frontend && npx ng serve               # SPA em :4200, /api -> localhost:8080 (proxy.conf.json)
cd frontend && npx ng build && npx ng test --watch=false
```

(No PowerShell, use `.\mvnw.cmd`. O `ng` global é opcional: `npx ng` usa o do projeto.)

## Docker

Sobe Postgres 17, a API (profile `docker`) e a SPA servida pelo nginx:

```bash
# crie um .env na raiz (não é versionado) com:
#   POSTGRES_DB=mybank
#   POSTGRES_USER=mybank
#   POSTGRES_PASSWORD=<escolha uma senha>
docker compose up --build        # SPA em :4200, API em :8080, health em /actuator/health
docker compose down              # para; o banco persiste no volume db-data (-v apaga)
```

No Docker o nginx repassa `/api` para o backend; fora dele, é o proxy do `ng serve`.
Em ambos, a API deve expor as rotas sob o prefixo `/api`.

## Princípios

Simples primeiro; uma regra por assunto; evidência antes de hipótese; teste junto do código.
Sem ClickUp, Railway, CI/CD ou nuvem neste momento — o que existia ficou em `.agents/archive/`.

Nunca versione `.env`, `application-local.yml`, credenciais, `target/`, `node_modules/`.
