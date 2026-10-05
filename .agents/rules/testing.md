---
description: Estratégia de testes — JUnit 5/Spring Boot Test no backend e testes de componente/serviço no Angular.
---

# Testes

## A pirâmide

| Nível | Backend (JUnit 5) | Frontend (Angular) |
|---|---|---|
| unitário (maioria) | `@Service` com Mockito, sem Spring | serviço/pipe/função pura; componente com `TestBed` |
| fatia | `@WebMvcTest` (controller + validação), `@DataJpaTest` (repository) | componente + `HttpTestingController` |
| integração (poucos) | `@SpringBootTest` + banco de teste | — |
| ponta a ponta | manual no início; automatizar só se valer a pena | opcional (Playwright/Cypress) |

A maior parte dos testes é unitária ou de fatia: rápidos e fáceis de diagnosticar. Se quase tudo
exige `@SpringBootTest`, a lógica provavelmente está no lugar errado.

## Backend

- **Service:** teste a regra de negócio com Mockito (`@ExtendWith(MockitoExtension.class)`),
  repository mockado. Cubra o caminho feliz **e** cada exceção de domínio.
- **Controller:** `@WebMvcTest` + `MockMvc`; confira status, corpo JSON e o formato do erro
  (`ProblemDetail`). Valide que entrada inválida devolve 400 com `errors`.
- **Repository:** `@DataJpaTest` (H2 em memória) para consultas próprias e restrições (unicidade).
  Prefira Testcontainers se o banco real tiver diferenças que importam (opcional, exige Docker).
- Use **AssertJ** (`assertThat`), não `assertTrue` solto.
- Dinheiro em `BigDecimal`: compare com `isEqualByComparingTo`, não `equals` (escala importa).

## Frontend

- Teste pela perspectiva do usuário: consulte por papel e texto acessível, não por classe CSS.
- Serviço HTTP: `provideHttpClient()` + `provideHttpClientTesting()` + `HttpTestingController`.
- Use o *runner* que o projeto Angular gerou (Vitest nas versões recentes, Karma/Jasmine nas antigas):
  confira `package.json`/`angular.json` e rode `ng test`.
- Componentes: renderize, interaja, verifique o DOM. Não teste detalhes internos (métodos privados).

## Nomes e estrutura

O nome descreve o comportamento: `transfer_withInsufficientFunds_throws` / `shows error when email is invalid`.
Três blocos separados por linha em branco: preparar, executar, verificar.

## Um teste que nunca falhou não prova nada

Para teste novo importante, **quebre de propósito** o código que ele guarda e veja ficar vermelho.
Se continuar verde, ele não testa o que o nome diz. Registre "verifiquei que falha se X voltar" no PR.

## O que não testar

Getters triviais, o framework, bibliotecas de terceiros, código que só existe para subir cobertura.
Cobertura é piso informativo, não meta: não escreva teste sem asserção para subir o número.
