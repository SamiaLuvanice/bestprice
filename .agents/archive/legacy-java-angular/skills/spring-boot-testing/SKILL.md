---
name: spring-boot-testing
description: Mecânica de testes no backend Spring Boot — JUnit 5, Mockito, @WebMvcTest, @DataJpaTest e @SpringBootTest; qual usar e exemplos mínimos. Use ao escrever teste de service/controller/repository, ao decidir entre teste unitário e de integração, ou ao investigar teste que falha.
---

# Testes no Spring Boot

A política está em `.agents/rules/testing.md`. Aqui é a mecânica. `spring-boot-starter-test` já traz JUnit 5, Mockito, AssertJ e MockMvc.

## Qual teste escrever

| Testa | Anotação | Carrega Spring? |
|---|---|---|
| regra do service | `@ExtendWith(MockitoExtension.class)` | não (rápido) |
| controller + validação + erro | `@WebMvcTest(AccountController.class)` | só a camada web |
| consulta/restrição do repository | `@DataJpaTest` | só JPA + H2 |
| fluxo completo | `@SpringBootTest` | tudo (use pouco) |

## Service (unitário)

```java
@ExtendWith(MockitoExtension.class)
class AccountServiceTest {
    @Mock AccountRepository accounts;
    @InjectMocks AccountService service;

    @Test
    void get_whenMissing_throws() {
        when(accounts.findById(42L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(42L))
                .isInstanceOf(AccountNotFoundException.class);
    }
}
```

## Controller (fatia web)

```java
@WebMvcTest(AccountController.class)
class AccountControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean AccountService service;      // Spring Boot 3.4+; antes: @MockBean

    @Test
    void open_withBlankOwner_returns400() throws Exception {
        mvc.perform(post("/api/accounts").contentType(APPLICATION_JSON)
                .content("""
                    {"owner": "", "initialBalance": 10}"""))
           .andExpect(status().isBadRequest());
    }
}
```

Para erro de domínio, importe o `GlobalExceptionHandler` (`@Import`) e confira `$.status` e `$.title`.

## Repository (fatia JPA)

```java
@DataJpaTest
class AccountRepositoryTest {
    @Autowired AccountRepository accounts;

    @Test
    void findByOwner_returnsSavedAccount() {
        accounts.save(new Account("Ana", new BigDecimal("10.00")));

        assertThat(accounts.findByOwner("Ana")).isPresent();
    }
}
```

## Dicas

- `BigDecimal`: `assertThat(x).isEqualByComparingTo("10.00")`.
- Tempo: injete `Clock` e use `Clock.fixed(...)` no teste.
- Teste vermelho por contexto que não sobe: leia o `Caused by:` mais profundo (falta de bean, propriedade ausente).
- Não use `@SpringBootTest` por comodidade: ele deixa a suíte lenta e esconde de onde veio a falha.
- `@Disabled` não é "resolver teste": registre o motivo e um prazo, ou apague.
- Banco real opcional: Testcontainers (exige Docker); comece com H2.
