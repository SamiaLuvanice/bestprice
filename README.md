# bestprice — projeto de estudos (Java + Spring Boot + Angular)

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
- `scripts/compose-worktree.ps1`: sobe o Compose com nome e portas próprios em uma worktree.
- `config/` e `harness.yaml`: stack, comandos de qualidade.

## Primeiros passos

1. Sincronize as ferramentas (cria os links de `.claude/` → `.agents/`):

   ```bash
   bash .agents/sync.sh
   ```

   No Windows, use `.\.agents\sync.ps1` para criar junctions nativas acessíveis
   pelo PowerShell e pelo Git Bash, sem precisar de administrador.

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

Antes de executar a API, configure `BANK_AUTH_EMAIL` e `BANK_AUTH_PASSWORD` no ambiente.
A conta local é reconstruída em memória com BCrypt em cada inicialização; não existe cadastro.
A senha é obrigatória, não pode ser só espaços e aceita até 72 bytes UTF-8. E-mails são
normalizados com espaços externos removidos e minúsculas. A API falha indicando o nome da
configuração ausente/inválida, sem mostrar o valor. Os testes geram credenciais próprias.
O arquivo `.env` é carregado pelo Compose; Maven não o lê automaticamente.

```powershell
$env:BANK_AUTH_EMAIL = Read-Host 'E-mail da conta local'
$localPassword = Read-Host 'Senha da conta local' -AsSecureString
$env:BANK_AUTH_PASSWORD = [System.Net.NetworkCredential]::new('', $localPassword).Password
cd backend
.\mvnw.cmd spring-boot:run
```

Abra `http://localhost:4200`: `/login` permite entrar e `/dashboard` confirma o acesso e
oferece logout. A autenticação usa sessão no servidor com cookie `JSESSIONID` HttpOnly,
SameSite=Lax e sem persistência. F5 recupera a identificação por `/api/auth/me`.
Após 30 minutos sem requisição autenticada aceita, a sessão expira; health, bootstrap CSRF
e requisições rejeitadas não renovam esse prazo. Logout e reinício da API invalidam a sessão.
Fechar o navegador exige novo login quando não há restauração de sessão habilitada.
`Secure=false` permite HTTP local; qualquer futura execução com HTTPS deve usar
`server.servlet.session.cookie.secure=true`.

`/api/**` exige autenticação, inclusive rotas inexistentes (401 sem sessão, 404 autenticado).
São públicos apenas `POST /api/auth/login`, `GET /api/auth/csrf` e `GET /actuator/health`.
Para clientes diretos, consulte `/api/auth/csrf`, preserve os cookies e envie o valor de
`XSRF-TOKEN` no header `X-XSRF-TOKEN` nos POSTs. Consulte novamente após login/logout.
O proxy Angular/nginx mantém a mesma origem para sessão e CSRF.

## Docker

Sobe Postgres 17, a API (profile `docker`) e a SPA servida pelo nginx:

```bash
# crie um .env na raiz (não é versionado) com:
#   POSTGRES_DB=mybank
#   POSTGRES_USER=mybank
#   POSTGRES_PASSWORD=<escolha uma senha>
#   BANK_AUTH_EMAIL=<e-mail da conta local>
#   BANK_AUTH_PASSWORD=<senha da conta local, até 72 bytes UTF-8>
docker compose up --build        # SPA em :4200, API em :8080, health em /actuator/health
docker compose down              # para; o banco persiste no volume db-data (-v apaga)
```

Para dar à worktree containers/volume próprios e não disputar as portas fixas do checkout
principal, use o auxiliar abaixo dentro dela; ele deriva nome do projeto e portas de forma
estável da branch e do caminho local da worktree (e aceita `BACKEND_PORT`/`FRONTEND_PORT` como overrides):

```powershell
.\scripts\compose-worktree.ps1 up --build
.\scripts\compose-worktree.ps1 down
```

No checkout principal, continue usando `docker compose up --build` e `docker compose down`.

No Docker o nginx repassa `/api` para o backend; fora dele, é o proxy do `ng serve`.
Em ambos, a API deve expor as rotas sob o prefixo `/api`.

## Princípios

Simples primeiro; uma regra por assunto; evidência antes de hipótese; teste junto do código.
Issues, Projects, PRs, CI e entrega de imagens/releases seguem o
[fluxo integrado do GitHub](docs/github-workflow.md). CI é obrigatório nas branches
integradoras; Project depende de credencial adicional. Implantação externa ainda
não está configurada. ClickUp/Railway permanecem em `.agents/archive/`.

Nunca versione `.env`, `application-local.yml`, credenciais, `target/`, `node_modules/`.
