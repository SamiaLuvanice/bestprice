---
description: Convenções de Java e Spring Boot (injeção, DTOs, validação, JPA, configuração, logs).
---

# Java e Spring Boot

Detalhes e exemplos: skill `java-springboot`. Esta regra fixa as decisões do projeto.

## Java

- Use a versão LTS do JDK declarada no `pom.xml`/`build.gradle` (`java.version`). Não suba por conta própria.
- **DTOs são `record`.** Imutáveis, sem boilerplate.
- `Optional` só como **retorno** (nunca em campo ou parâmetro). `orElseThrow(...)` com exceção de domínio.
- Prefira `List.of`, `Stream` simples e `var` apenas quando o tipo é óbvio na linha.
- Sem `null` como "valor mágico" em API pública: valide na entrada.
- Lombok é opcional; para aprender, prefira código explícito e `record`.
- Código morto, `System.out.println` e `printStackTrace()` não entram: use SLF4J.

## Spring Boot

- **Injeção por construtor**, campos `private final`. Nada de `@Autowired` em campo.
- Estereótipos corretos: `@RestController`, `@Service`, `@Repository`, `@Configuration`.
- Configuração em `application.yml`; por ambiente com *profiles* (`application-dev.yml`).
  Propriedades próprias com `@ConfigurationProperties`, não `@Value` espalhado.
- Perfil `dev` com **H2** (ou Postgres local via Docker Compose, se preferir) para estudo.
  Schema evolui por **Flyway** quando o modelo estabilizar; no começo, `ddl-auto: update` só em `dev`.
  Nunca `ddl-auto: create/update` em perfil de produção.
- `spring.jpa.open-in-view: false` (evita consulta preguiçosa escondida na camada web).

## REST

- Recursos no plural e em minúsculas: `GET /api/accounts`, `GET /api/accounts/{id}`.
- Verbos HTTP: `GET` lê, `POST` cria (201 + `Location`), `PUT` substitui, `PATCH` altera parte, `DELETE` remove (204).
- Prefixo `/api`. Versionar (`/api/v1`) só quando houver quebra de contrato real.
- Listas grandes: paginação com `Pageable` (`page`, `size`, `sort`).
- Códigos corretos: 200/201/204; erros conforme `errors.md`.

## Validação (Bean Validation)

- Anotações no DTO de entrada: `@NotBlank`, `@Email`, `@Size`, `@Positive`, `@DecimalMin`...
- `@Valid` no `@RequestBody` do controller (e `@Validated` na classe para `@PathVariable`/`@RequestParam`).
- O que o DTO valida é **formato**. **Regra de negócio** (saldo suficiente, e-mail já usado) é do service, que lança exceção de domínio.

## JPA

- `@Entity` com construtor protegido sem argumentos, `id` gerado (`@GeneratedValue`).
- Relacionamentos `LAZY` por padrão. Evite N+1 (`@EntityGraph` ou `JOIN FETCH` quando listar).
- `@Transactional` no **service** (leitura: `@Transactional(readOnly = true)`), não no controller.
- Consultas por derivação de nome ou `@Query` com **parâmetros nomeados**. Nunca concatenar string em SQL/JPQL.

## Logs

SLF4J com mensagem parametrizada: `log.info("Conta {} criada", id)`. Nunca logar senha, token ou dados pessoais completos.
