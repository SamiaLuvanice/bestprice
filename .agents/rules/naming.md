---
description: Convenções de nomes para Java, Spring Boot, Angular e TypeScript.
---

# Nomes

## Idioma

Código e identificadores em **inglês**. Comentários, documentação, commits e mensagens ao
usuário em **português**.

## Java

| Elemento | Convenção | Exemplo |
|---|---|---|
| pacote | minúsculo, sem `_` | `com.exemplo.mybank.account` |
| classe / record / enum | `PascalCase`, substantivo | `Account`, `AccountResponse` |
| método / variável | `camelCase`, verbo para método | `findById`, `balance` |
| constante | `UPPER_SNAKE_CASE` | `MAX_TRANSFER_AMOUNT` |
| booleano | pergunta, nunca negativo | `isActive`, `hasExpired` (não `isDisabled`) |

Sufixos pelo papel (e só eles): `Controller`, `Service`, `Repository`, `Request`/`Response` (DTOs),
`Exception`, `Properties` (`@ConfigurationProperties`), `Config`.
Entity sem sufixo: `Account`, não `AccountEntity`.
Métodos de service dizem a intenção de negócio: `transfer`, `openAccount` (não `process`, `handle`, `doIt`).
Testes: `AccountServiceTest`; método descreve o comportamento: `transfer_withInsufficientFunds_throws`.

## Angular / TypeScript

Estilo moderno do Angular (v20+): nomes pela intenção. Detalhe: skill `angular-developer`
(`references/naming-conventions.md`).

| Elemento | Convenção | Exemplo |
|---|---|---|
| arquivo | `kebab-case` | `account-list.ts`, `account.service.ts` |
| classe / interface / tipo | `PascalCase` | `AccountList`, `Account` |
| variável / método | `camelCase` | `loadAccounts()` |
| seletor de componente | prefixo do app + `kebab-case` | `app-account-list` |
| signal | substantivo; leitura com `()` | `accounts()`, `isLoading()` |

Interfaces não levam prefixo `I`. Use `readonly` e tipos explícitos em API pública; sem `any`.

## Proibido em qualquer lugar

`data`, `info`, `obj`, `temp`, `aux`, `manager`, `helper`, `utils`, `common`, `misc`,
`process()`/`handle()` sem complemento. Se o melhor nome é `helper`, a responsabilidade não está clara.
