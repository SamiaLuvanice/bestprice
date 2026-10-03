---
name: monorepo-navigation
description: Onde mexer neste repositório — backend (Spring Boot), frontend (Angular), specs, docs ou o harness — e como rodar cada parte. Use ao começar a trabalhar, ao procurar onde algo vive, ou quando um comando falhar por estar no diretório errado.
---

# Navegar no repositório

```
backend/     Spring Boot (Maven ou Gradle — veja se há pom.xml ou build.gradle)
frontend/    Angular
specs/       specs numeradas (o quê e por quê)
docs/        ADRs, aprendizados e a documentação do harness
.agents/     agents, skills, rules, commands (fonte única do harness)
```

Se `backend/` ou `frontend/` ainda não existem, crie-os: backend pelo Spring Initializr
(Web, Validation, Data JPA, H2, Actuator opcional), frontend pela skill `angular-new-app`.

## Onde mexer

| A mudança é… | Vá para |
|---|---|
| regra de negócio, rota, persistência | `backend/` |
| tela, formulário, chamada à API | `frontend/` |
| endpoint ou campo novo | contrato no `plan.md` **primeiro** (skill `api-contract`) |
| comportamento novo, de qualquer lado | `specs/` **antes** do editor |
| como o agente trabalha aqui | `.agents/` |
| decisão de arquitetura | `docs/adr/` |

## Rodar cada parte

Backend (use o wrapper do projeto, `mvnw`/`gradlew`, para não depender da versão instalada):

```bash
cd backend
./mvnw spring-boot:run        # Gradle: ./gradlew bootRun   (porta 8080)
./mvnw test                   # Gradle: ./gradlew test
```

No Windows/PowerShell use `.\mvnw.cmd` / `.\gradlew.bat`.

Frontend:

```bash
cd frontend
npm install
ng serve                      # http://localhost:4200  (proxy /api -> localhost:8080)
ng test --watch=false
ng build
```

## Ordem de uma mudança que atravessa tudo

```
contrato (plan.md)  →  backend  →  frontend  →  teste ponta a ponta
```

## Comando falhando?

Quase sempre é diretório errado: `./mvnw` e `ng` só funcionam dentro de `backend/` e `frontend/`.
Porta ocupada: backend usa 8080 (`server.port`), Angular usa 4200 (`ng serve --port`).
