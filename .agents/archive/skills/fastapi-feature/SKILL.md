---
name: fastapi-feature
description: Criar uma fatia vertical neste boilerplate FastAPI — entity, port, use case, repository, DTO, rota e registro no container, na ordem correta. Use ao adicionar um recurso ou endpoint novo, ao decidir onde colocar um arquivo, ou ao ligar um caso de uso à camada HTTP.
---

# Uma fatia vertical em FastAPI

A regra de dependência está em `.agents/rules/architecture.md`. Aqui é como ela vira
arquivo neste projeto. Leia `app/use_cases/create_user.py` e `app/api/users.py` como
referência viva.

## A ordem

```
1. app/entities/<recurso>.py                     dataclass frozen, sem import do projeto
2. app/use_cases/ports/<recurso>_repository.py   ABC com só o que o caso de uso precisa
3. app/use_cases/<verbo>_<recurso>.py            a regra, contra o port
4. src/tests/unit/test_<verbo>_<recurso>.py      com o fake do port — roda sem banco
5. app/repositories/models/<recurso>.py          o model SQLAlchemy
6. app/repositories/sql_<recurso>_repository.py  o adapter + tradução entity ↔ model
7. migrations/versions/                          a migration
8. src/tests/integration/test_repositories.py    contra Postgres real
9. app/schemas/<recurso>.py                      DTOs Pydantic
10. app/api/<recurso>.py                         o router
11. app/config/container.py                      registra adapter e caso de uso
12. app/main.py                                  inclui o router
13. src/tests/integration/test_<recurso>_endpoints.py
```

Os passos 1–4 rodam sem banco nenhum. Se não rodarem, algo foi para a camada errada.

## Injeção sem importar o container

A camada `api` **não** importa `Container` — seria uma dependência para fora. O wiring é
por string:

```python
@Router.get("", response_model=Saida)
@inject
def listar(
    use_case: ListarUseCase = Depends(Provide["listar_uc"]),
) -> Saida: ...
```

A string é o nome do provider em `app/config/container.py`. Errar o nome só falha em
tempo de requisição — confira ao registrar.

## Erros

O caso de uso lança erro de domínio de `app/entities/errors.py`. A rota **não** trata:
o handler global em `app/api/errors.py` traduz para o envelope RFC 9457.

Erro novo? Adicione a classe em `entities/errors.py` **e** a linha em `_DOMAIN_MAPPING`.
Sem a segunda, ele vira 500 — há um teste que garante isso.

## Rota protegida

```python
Router = APIRouter(
    prefix="/recursos",
    tags=["recursos"],
    dependencies=[Depends(current_user)],
    responses={**UNAUTHORIZED, **UNPROCESSABLE},
)
```

`responses=` não é enfeite: é o que faz o `/openapi.json` gerado bater com
`contract/openapi.yaml`.

## Entity ≠ model ≠ DTO

Três tipos, de propósito:

| | Onde | Papel |
|---|---|---|
| `User` | `entities/` | regra de negócio, sem ORM |
| `UserModel` | `repositories/models/` | a tabela |
| `UserResponse` | `schemas/` | o que sai pelo HTTP |

O repository traduz entity ↔ model; a rota, entity → DTO.

## Antes de abrir o PR

```bash
make arch     # a regra de dependência
make test     # cobertura ≥ 90%
make lint     # todos os portões
```
