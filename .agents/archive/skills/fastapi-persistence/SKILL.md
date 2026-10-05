---
name: fastapi-persistence
description: Models SQLAlchemy, migrations Alembic e repositories neste boilerplate — tradução entity ↔ model, sessão, e como criar e aplicar migration. Use ao adicionar tabela ou coluna, ao escrever repository, ao mexer em migration, ou quando o schema divergir dos models.
---

# Persistência

## As três peças

```
app/repositories/models/<recurso>.py          a tabela
app/use_cases/ports/<recurso>_repository.py   o contrato
app/repositories/sql_<recurso>_repository.py  o adapter que liga as duas
migrations/versions/                          a evolução do schema
```

## Model

```python
class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
```

- `sa.Uuid` genérico, não o tipo do dialeto — mantém o model portável.
- `DateTime(timezone=True)` sempre. Datetime sem fuso vira bug de expiração de token.
- Todo model novo entra em `app/repositories/models/__init__.py`, senão o Alembic não o vê.
- Nada de método de negócio aqui. Isso é da entity.

## A pilha é async inteira

Driver `asyncpg`, `create_async_engine`, `async_sessionmaker`, e `async def` em port,
repository, caso de uso e rota. Rota `async def` chamando repositório síncrono — ou o
inverso — é o que a ADR 0012 proíbe: parece pronta e degrada em silêncio, e nenhum teste
pega. Só o Alembic continua em `psycopg2`, por uma URL própria.

Nada de bloqueante dentro de corrotina: `time.sleep`, `requests`, cliente síncrono ou
trabalho caro de CPU vão para um thread (`asyncio.to_thread`), como o argon2 já vai.
`src/tests/unit/test_async_stack.py` varre isso a cada rodada.

## Repository

Recebe a **unidade de trabalho**, não a fábrica de sessões e não o `Database` de `config`:

```python
def __init__(self, transaction: SqlAlchemyTransaction) -> None:
    self._transaction = transaction

async def get_by_id(self, user_id: UUID, client_scope: frozenset[UUID] | None) -> User | None:
    conditions = [UserModel.id == user_id, *_scope_of(client_scope)]
    model = (await self._transaction.session.scalars(select(UserModel).where(*conditions))).first()
    return _to_entity(model) if model is not None else None
```

**O repositório não dá `commit`.** Ele usa a sessão do escopo e chama `flush()` na escrita,
para que a violação de unicidade apareça na chamada que a causou. Quem confirma é o caso de
uso, pelo `@atomic`.

**Leitura e escrita recebem `client_scope`, sem valor padrão**, e o escopo entra no mesmo
`WHERE` das duas. Filtro de segurança que se esquece de passar é filtro que não protege.

Cada arquivo traz `_to_entity` e `_to_model` no fim — a tradução mora aqui e em nenhum
outro lugar.

## A transação é do caso de uso

```python
class RegisterSampleUseCase:
    @atomic
    async def execute(self, ...) -> Sample:
        labels = await self._labels.reserve(count)
        return await self._samples.add(Sample.of(labels, ...))
```

- As gravações do método são **uma** transação; exceção em qualquer ponto desfaz todas.
- `@atomic` aninhado junta-se à transação de fora, não abre outra.
- **Leitura não leva `@atomic`.** Marcar tudo faz o marcador perder o significado.
- Esquecer o decorador não é erro invisível: a sessão **recusa** gravar fora de transação e
  levanta `TransactionRequired`.
- Escrita que precisa sobreviver a um erro — a queda da família de refresh na detecção de
  roubo — é transação própria, num método `@atomic` separado.

Quem abre o escopo é a borda: o middleware, numa requisição; o próprio comando, no seed.

## Migrations

```bash
uv run alembic revision --autogenerate -m "descricao curta"
uv run alembic upgrade head          # ou: make migrate
uv run alembic downgrade -1
```

**Sempre leia a migration gerada antes de commitar.** O autogenerate erra em renomeação
(vira drop + add, perdendo dados), em mudança de tipo e em constraint nomeada.

Toda migration tem `downgrade()` que funciona de verdade. Um `downgrade` com `pass` é uma
migration sem volta.

O `script_location` no `alembic.ini` é `migrations` — o diretório se chama assim, e não
`alembic`.

## Unicidade é do banco

O caso de uso confere antes e lança `EmailAlreadyTaken`, mas isso é uma corrida: duas
requisições simultâneas passam as duas pela conferência. A constraint `unique` no banco é
o que de fato garante — e há teste de integração que a exercita.

## Datetime

Grave sempre com fuso, vindo do port `Clock`. Nunca `datetime.now()` sem `tz` e nunca
`datetime.utcnow()`, que é ingênuo e está obsoleto.
