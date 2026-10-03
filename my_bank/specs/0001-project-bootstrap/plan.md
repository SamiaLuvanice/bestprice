# Plano — 0001 Esqueleto executável do projeto

> Retroativo: descreve o que foi implementado, não o que se pretende implementar.

## Contrato da API

Nenhum endpoint de domínio. Dois endereços existem:

| Método | Rota | Resposta |
|---|---|---|
| GET | `/actuator/health` | `200 {"status":"UP", ...}` (Actuator) |
| qualquer | `/api/**` | reservado: prefixo do futuro contrato; sem controller ainda, retorna `404` JSON do Spring |

**Convenção que as próximas specs herdam:** todo endpoint de domínio vive sob `/api`. O proxy do
nginx e o do `ng serve` repassam `/api` **sem remover o prefixo**.

`/actuator/health` fica fora de `/api` e, no Docker, só é acessível direto na porta 8080
(o nginx não o repassa).

## Camadas tocadas

**Backend** (`backend/`) — só a classe de entrada e a configuração; nenhuma camada de domínio ainda.

- `pom.xml`, `mvnw`, `.mvn/`: gerados pelo Spring Initializr
- `MyBankApplication.java`, `MyBankApplicationTests.java`: gerados
- `application.yml`: fuso UTC (regra `datetime-pipeline.md`) e `open-in-view: false`
- `application-docker.yml` (novo): datasource PostgreSQL vindo de variáveis de ambiente (`DB_HOST` assume `db`, o nome do serviço no compose)
- `Dockerfile`, `.dockerignore` (novos)

**Frontend** (`frontend/`) — app gerado pelo Angular CLI, sem componente de domínio.

- `proxy.conf.json` (novo) + `proxyConfig` em `angular.json`: `/api` → `localhost:8080` no `ng serve`
- `nginx.conf`, `Dockerfile`, `.dockerignore`, `.npmrc` (novos)

**Raiz:** `docker-compose.yml` (novo, portas publicadas só em `127.0.0.1`); `README.md` e `specs/0000-template/spec.md` (alterados: cabeçalho alinhado ao `po-intake/reference.md`).

## Decisões de desenho

| Decisão | Alternativa descartada | Por quê |
|---|---|---|
| Spring Boot **4.1.1**, Java **25** | Boot 3.5 + Java 21 | Boot 4.1.1 é o padrão estável do Initializr; Java 25 é LTS e já era o JDK instalado. Custo: Boot 4 é novo (Jackson 3, starters renomeados), há menos material de estudo |
| **Maven** com wrapper | Gradle | Não há Maven global; o wrapper dispensa instalação. A regra do projeto aceita os dois |
| **Angular 21** (CLI 21) | CLI mais recente | O CLI mais novo exige Node ≥ 22.22.3 e o ambiente tem 22.18; não se alterou o Node da máquina |
| **H2** em memória fora do Docker, **PostgreSQL 17** no profile `docker` | Postgres também no desenvolvimento local | H2 deixa `./mvnw spring-boot:run` e os testes funcionarem sem Docker. Risco: dialetos diferentes (ver riscos) |
| `ddl-auto=update` no profile `docker` | Flyway agora | Simples para estudo; migrations ficam como evolução quando houver schema real |
| **nginx** serve a SPA e faz proxy de `/api` | Backend servindo os estáticos; CORS aberto | Mesma origem para o navegador, sem CORS; espelha o proxy do `ng serve` |
| `legacy-peer-deps=true` em `frontend/.npmrc` | Atualizar o npm; trocar o test runner | O npm 10.9.3 falha ao resolver os peers opcionais do `vitest` (`reading 'edgesOut'`, evidenciado no log do arborist). Contorno seguro: pacotes Angular são dependências diretas |
| Senha do banco **obrigatória** no compose (`:?`) | Senha padrão no compose | Evita segredo no repositório e falha cedo com mensagem clara |
| Containers da API e do nginx **sem healthcheck** | Healthcheck via actuator | A imagem JRE não traz `curl`; só o banco tem healthcheck (a API espera por ele via `depends_on`) |

## Riscos

- **H2 ≠ PostgreSQL.** Um teste verde em H2 pode falhar no Postgres (tipos, `NUMERIC`, funções).
  Mitigação futura: Testcontainers para os testes de repository.
- **`ddl-auto=update`** nunca remove coluna nem faz migração de dados.
- **Boot 4 / Jackson 3:** exemplos e respostas antigas da internet usam Boot 3; pacotes mudaram de nome.
- **Imagens sem versão fixada no patch** (`eclipse-temurin:25-*`, `node:22-alpine`, `nginx:alpine`):
  o build pode mudar entre dois dias.
- **Dockerfile do backend depende de `mvnw` com fim de linha LF.** O `.gitattributes` do Initializr
  garante isso no checkout; um arquivo copiado com CRLF quebraria o build.

## Desvios das regras do harness

| Regra | O que existe | Situação |
|---|---|---|
| `java-spring.md`: `ddl-auto: update` **só em `dev`** | `update` no profile `docker` (não existe profile `dev` nem de produção) | Aceito: o profile `docker` é de estudo local. Quando houver ambiente real, trocar por Flyway e `validate` |
| `security.md`: versionar um `.env.example` com valores falsos | `.env.example` versionado (PR #2) | Resolvido |
| `.claude/settings.json` negava `Read(./.env.*)`, que também casava com `.env.example` | a regra ainda existe | **Pendente, decisão do dono do repo:** trocar por `Read(./.env.local)`. O assistente não consegue editar o próprio arquivo de permissões |
| `frontend.md`: componentes `OnPush` e `HttpClient` | `App` com `OnPush`; `provideHttpClient` ainda não configurado | `HttpClient` entra na primeira feature que chamar a API |

O teste `should render title` do frontend deixou de verificar o placeholder do CLI: o template
agora é mínimo (`<h1>` + `<router-outlet />`) e o teste confere o título "My Bank". Confirmado
que ele guarda o código: com o texto esperado trocado, o teste ficou vermelho.

Mudança de configuração de `.properties` para `.yml` foi feita para seguir `java-spring.md`.
