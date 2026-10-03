---
description: Tratamento de erros da API REST — exceções de domínio e resposta ProblemDetail (RFC 9457).
---

# Erros

## Duas camadas, uma tradução

- O **service** lança exceções de **domínio** (`AccountNotFoundException`, `InsufficientFundsException`).
  Ele não conhece HTTP.
- **Um** `@RestControllerAdvice` (em `shared/error/`) traduz cada exceção para a resposta HTTP.
  Controllers não montam resposta de erro à mão e não têm `try/catch` espalhado.

## Formato: `ProblemDetail`

O Spring Boot 3+ traz `ProblemDetail` (RFC 9457, `application/problem+json`). Use-o.
Opcional: `spring.mvc.problemdetails.enabled: true` para que erros do próprio Spring usem o mesmo formato.

```json
{
  "type": "about:blank",
  "title": "Account not found",
  "status": 404,
  "detail": "Conta 42 não encontrada.",
  "instance": "/api/accounts/42"
}
```

Erros de validação acrescentam a lista de campos (propriedade extra `errors`):

```json
{ "title": "Validation failed", "status": 400, "detail": "Dados inválidos.",
  "errors": [ { "field": "email", "message": "deve ser um e-mail válido" } ] }
```

## Mapeamento

| Situação | HTTP |
|---|---|
| corpo ilegível, `@Valid` falhou, parâmetro inválido | 400 |
| não autenticado | 401 |
| autenticado sem permissão | 403 |
| recurso inexistente | 404 |
| violação de unicidade / estado conflitante | 409 |
| regra de negócio violada (ex.: saldo insuficiente) | 422 (ou 409; escolha um e mantenha) |
| falha inesperada | 500 |

Usamos **400** para falha de Bean Validation (é o padrão do Spring: `MethodArgumentNotValidException`),
porque é o caminho mais simples. Decida 422 vs 409 para regra de negócio na primeira feature e mantenha.

## O que nunca vaza

Stack trace, SQL, nome de tabela, caminho de arquivo. Em 500, `detail` é genérico; o diagnóstico
vai para o log (`log.error("...", ex)`). `server.error.include-stacktrace: never`.

## Frontend

O Angular traduz o erro num único ponto (interceptor ou service base): mapeia `errors[]` para os
campos do formulário e mostra `detail` em mensagem amigável. Componente não lê `status` cru espalhado.
