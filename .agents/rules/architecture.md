---
description: Organização de pacotes e camadas do backend Spring Boot e do frontend Angular.
---

# Arquitetura

Princípio: **simples primeiro**. Camadas claras, dependências em uma direção, sem abstração
que o projeto ainda não pede. (Alinhado à skill `java-springboot`: pacotes por feature.)

## Backend — pacotes por feature

```
backend/src/main/java/com/exemplo/mybank/
  MyBankApplication.java
  account/                    ← uma feature (domínio)
    AccountController.java    ← HTTP: recebe/devolve DTOs
    AccountService.java       ← regra de negócio, @Transactional
    AccountRepository.java    ← Spring Data JPA
    Account.java              ← @Entity
    dto/                      ← AccountRequest, AccountResponse (records)
    AccountNotFoundException.java
  shared/                     ← só o que é de fato transversal
    error/                    ← @RestControllerAdvice, tipos de erro
    config/                   ← CORS, beans, @ConfigurationProperties
```

## A regra de dependência (versão enxuta)

```
Controller  →  Service  →  Repository  →  Entity
```

- **Controller** só fala HTTP: valida (`@Valid`), chama o service, devolve DTO. Sem regra de negócio.
- **Service** guarda a regra de negócio e a transação. Não conhece `HttpServletRequest`,
  `ResponseEntity` nem status HTTP.
- **Repository** só acessa dados. Controller **nunca** chama repository direto.
- **Entity JPA nunca sai pela API.** Entrada e saída são DTOs (`record`). O service (ou um
  mapper simples) converte.
- Uma feature não mexe nas tabelas de outra: chama o **service** dela.

Por que sem "ports/adapters" e `entities/use_cases` separados? Para estudo, a divisão acima já
ensina separação de responsabilidades sem triplicar o número de arquivos. Se a regra de negócio
crescer e ficar presa ao JPA, aí sim extraia (registre a decisão em `docs/adr/`).

## Frontend — Angular

```
frontend/src/app/
  core/          ← singletons: interceptors, guards, serviços globais (auth)
  shared/        ← componentes/pipes/diretivas reutilizáveis, sem regra de negócio
  features/
    account/
      account-list/        ← componente (standalone)
      account-form/
      account.service.ts   ← HttpClient: a única camada que chama a API
      account.model.ts     ← interfaces espelhando os DTOs
      account.routes.ts    ← rotas da feature (lazy)
  app.routes.ts
```

- Componente apresenta e coleta entrada; **não** chama `HttpClient`. Quem fala com a API é o *service*.
- Componente "burro" (recebe `input()`, emite `output()`) em `shared/` ou na feature; o "esperto"
  (injeta service) fica na página da feature.
- Dependências: `features → core/shared`. `shared` não importa `features`.

## Quando a regra atrapalha

Se cumprir a regra pede contorção, provavelmente o desenho da feature está errado. Antes de
abrir exceção, anote o motivo em `docs/adr/` (um parágrafo basta).
