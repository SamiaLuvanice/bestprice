---
name: clean-architecture
description: Como aplicar a regra de dependência deste projeto ao escrever ou mover código — onde colocar uma classe nova, o que cada camada pode importar, ports versus adapters, entity versus model do ORM. Use ao criar arquivos, ao decidir a camada de algo, ao refatorar, ou quando o verificador de arquitetura acusar violação.
---

# Clean Architecture na prática

A regra completa está em `.agents/rules/architecture.md`. Esta skill é como aplicá-la.

## Onde ponho isto?

```
É uma regra de negócio que valeria mesmo sem banco e sem HTTP?
  └─ sim → entities/

É a orquestração de um caso de uso do sistema?
  └─ sim → use_cases/            (e o port dele em use_cases/ports/)

Fala com banco, fila, e-mail, ou outro serviço?
  └─ sim → repositories/         (implementando um port)

Traduz HTTP em chamada de use case?
  └─ sim → api/                  (com o DTO em schemas/)

Monta o grafo de objetos, lê env, abre conexão?
  └─ sim → config/
```

Se nenhuma resposta é clara, o conceito provavelmente é dois conceitos.

## Criar uma fatia vertical

Para um recurso `Order`, nesta ordem:

```
1. entities/order.<ext>                    a entity, pura
2. use_cases/ports/order_repository.<ext>  o port — só a interface
3. use_cases/create_order.<ext>            o caso de uso, contra o port
4. tests/unit/test_create_order.<ext>      com um fake do port
5. repositories/models/order.<ext>         o model do ORM
6. repositories/sql_order_repository.<ext> o adapter
7. migrations/…                            a migration
8. tests/integration/…                     contra banco real
9. schemas/order.<ext>                     DTOs de entrada e saída
10. api/orders.<ext>                       as rotas
11. config/container                       registra o adapter e o use case
12. tests/integration/test_orders_api      as rotas ponta a ponta
```

Os passos 1–4 rodam sem banco nenhum. Se não rodarem, a regra foi quebrada.

## Entity não é model

```
entities/user.<ext>              User            regra de negócio
repositories/models/user.<ext>   UserModel       tabela
```

O repository traduz nos dois sentidos. A entity não tem anotação de ORM, não herda de
`Base`, não sabe o nome da tabela. O model não tem método de negócio.

Sim, é código a mais. É o que permite testar a regra sem banco e trocar o banco sem tocar
na regra.

## O port fica com quem consome

A interface mora em `use_cases/ports/`, não junto da implementação. Quem define o contrato
é quem precisa dele. A dependência então aponta para dentro: o adapter conhece o port, o
port não conhece o adapter.

O port declara o que o caso de uso precisa — nada além. Um port com quinze métodos porque
"o repositório tem" está errado.

## Cheiros de violação

| Cheiro | O que fazer |
|---|---|
| `use_case` importando o model do ORM | trocar por um port |
| `api` chamando `repository` direto | criar o use case que faltou |
| `entity` importando qualquer coisa do projeto | mover para `use_cases` |
| `use_case` devolvendo status code | devolver entity ou lançar erro de domínio |
| `repository` chamando outro `repository` | orquestrar no use case |
| um `use_case` com quatro métodos públicos | são quatro use cases |

## Quando o verificador acusa

Ele está certo. A saída aponta a importação proibida — mova o código, não relaxe a regra.
Se cumprir custa contorção grande, abra uma ADR em `docs/adr/` antes de abrir exceção.
