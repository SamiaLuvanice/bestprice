---
name: spring-boot-feature
description: Criar uma fatia vertical de feature no backend Spring Boot — entity, repository, DTOs, service, controller, exceções e testes, na ordem correta. Use ao adicionar um recurso ou endpoint novo, ao decidir onde colocar uma classe, ou ao ligar uma regra de negócio à camada HTTP.
---

# Uma feature no Spring Boot

Pré-leitura: `.agents/rules/architecture.md` e `java-spring.md`; boas práticas gerais na skill
`java-springboot`. Aqui é a **ordem** e o esqueleto mínimo. Exemplo: feature `account`.

## A ordem

```
1. Entity JPA            account/Account.java
2. Repository            account/AccountRepository.java      (extends JpaRepository)
3. DTOs (records)        account/dto/AccountRequest, AccountResponse  (+ validação)
4. Exceções de domínio   account/AccountNotFoundException.java
5. Service + teste       account/AccountService.java         (@Transactional, regra de negócio)
6. Controller + teste    account/AccountController.java      (@WebMvcTest)
7. Tradução de erros     shared/error/GlobalExceptionHandler (uma vez; reutilize nas próximas)
```

Teste em cada passo, não no fim.

## Esqueleto

```java
// dto — record com validação (formato)
public record AccountRequest(
    @NotBlank @Size(max = 80) String owner,
    @NotNull @PositiveOrZero BigDecimal initialBalance) {}

public record AccountResponse(Long id, String owner, BigDecimal balance) {}
```

```java
// service — regra de negócio e transação; conhece exceções de domínio, não HTTP
@Service
public class AccountService {
    private final AccountRepository accounts;

    public AccountService(AccountRepository accounts) { this.accounts = accounts; }

    @Transactional
    public AccountResponse open(AccountRequest request) {
        Account saved = accounts.save(new Account(request.owner(), request.initialBalance()));
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public AccountResponse get(Long id) {
        return accounts.findById(id).map(this::toResponse)
                .orElseThrow(() -> new AccountNotFoundException(id));
    }

    private AccountResponse toResponse(Account a) {
        return new AccountResponse(a.getId(), a.getOwner(), a.getBalance());
    }
}
```

```java
// controller — só HTTP
@RestController
@RequestMapping("/api/accounts")
public class AccountController {
    private final AccountService service;

    public AccountController(AccountService service) { this.service = service; }

    @PostMapping
    public ResponseEntity<AccountResponse> open(@Valid @RequestBody AccountRequest request) {
        AccountResponse created = service.open(request);
        return ResponseEntity.created(URI.create("/api/accounts/" + created.id())).body(created);
    }

    @GetMapping("/{id}")
    public AccountResponse get(@PathVariable Long id) { return service.get(id); }
}
```

```java
// shared/error — um tradutor global (ProblemDetail)
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(AccountNotFoundException.class)
    ProblemDetail notFound(AccountNotFoundException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setTitle("Account not found");
        return pd;
    }
}
```

## Checklist antes de seguir

- [ ] Controller não tem `if` de regra de negócio nem chama repository.
- [ ] Nenhuma `@Entity` aparece em assinatura de controller.
- [ ] Todo `@RequestBody` tem `@Valid`; DTO tem as anotações de validação.
- [ ] Valores monetários são `BigDecimal`.
- [ ] Teste do service cobre o feliz e cada exceção; teste do controller cobre status e corpo de erro (skill `spring-boot-testing`).
- [ ] `./mvnw test` (ou `./gradlew test`) verde.

Depois, o lado Angular da mesma feature: skill `angular-developer` + regra `frontend.md`.
