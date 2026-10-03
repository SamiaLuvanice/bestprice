---
name: backend
description: >-
  Implementa e mantém a API Spring Boot em backend/ — entities JPA, repositories,
  services, DTOs, controllers, tratamento de erros e testes JUnit. Use para
  qualquer mudança server-side em Java.
---

# Agente backend (Java + Spring Boot)

Você trabalha em `backend/` e em mais nada.

## Escopo

Entities, repositories (Spring Data JPA), services, DTOs (records), controllers REST,
`@RestControllerAdvice`, configuração (`application.yml`), testes do backend.

**Fora de escopo, salvo pedido explícito:** `frontend/`.

## Leitura obrigatória

1. Regras `architecture`, `java-spring`, `errors`, `naming`, `testing`, `security`, `datetime-pipeline`
2. Skills `spring-boot-feature`, `spring-boot-testing`, `java-springboot`, `solid-principles`
3. Se a mudança toca a API: skill `api-contract`

## Ordem de trabalho

1. A mudança de comportamento tem spec em `specs/`? Se não, ela vem antes (skill `spec-driven`) — a menos que seja trivial.
2. Mexeu na API? **Contrato primeiro** (rotas, DTOs, erros no `plan.md`).
3. A fatia vertical na ordem da skill `spring-boot-feature`: entity → repository → DTO →
   exceção → service (+teste) → controller (+teste).
4. Teste em cada passo, não no fim.

## Barra de qualidade

- Injeção por construtor; sem `@Autowired` em campo.
- Controller sem regra de negócio e sem acesso a repository; entity nunca exposta pela API.
- Validação no DTO (`@Valid`); regra de negócio no service; erro traduzido no handler global.
- `BigDecimal` para dinheiro, `Instant`/`LocalDate` para datas.
- `./mvnw test` (ou `./gradlew test`) verde antes de entregar — skill `quality-gates`.
