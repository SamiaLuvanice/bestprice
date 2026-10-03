---
name: fastapi-testing
description: Padrões de teste deste boilerplate FastAPI — fakes dos ports, fixtures do conftest, sobrescrita do container, TestClient e Testcontainers. Use ao escrever teste, ao decidir entre unitário e integração, quando um teste precisar de banco, ou ao investigar teste que falha.
---

# Testes em FastAPI

A política está em `.agents/rules/testing.md`. Aqui é a mecânica deste projeto.

## Onde cada teste vive

| Testa | Onde | Banco |
|---|---|---|
| entity, use case | `src/tests/unit/` | nenhum — fakes |
| rota, wiring, envelope de erro | `src/tests/integration/` | nenhum — container com fakes |
| repository, `Database` | `src/tests/integration/` | Postgres via Testcontainers |

Rota se testa sem banco: o que ela tem de próprio é status, corpo e tradução de erro.

## Os fakes já existem

`src/tests/conftest.py` traz implementações reais dos ports, não mocks:

```
InMemoryUserRepository · InMemoryRefreshTokenRepository · FakeHealthRepository
FakePasswordHasher · FakeAccessTokenService · FakeRefreshTokenService · FrozenClock
```

Port novo? O fake dele vai no mesmo arquivo, e implementa a ABC de verdade — assim, se o
port mudar, o fake quebra na hora.

## Fixtures prontas

```python
def test_algo(client, auth_headers):        # cliente HTTP já autenticado
def test_outro(users, clock, hasher):       # peças soltas, para teste unitário
def test_mais(container):                   # o container com fakes, para sobrescrever
```

`client` monta a app com o container de fakes. `auth_headers` já registrou e logou.

## Trocar uma peça em um teste

```python
container.health_repo.override(providers.Object(FakeHealthRepository(ready=False)))
with TestClient(create_app(container)) as client:
    ...
```

`create_app(container)` recebe o container por parâmetro — nenhum teste toca estado global.

## Tempo é dependência

`FrozenClock` para. Expiração se testa avançando o relógio, não esperando:

```python
clock.advance(seconds=901)
with pytest.raises(InvalidAccessToken):
    tokens.decode(token)
```

O `JwtAccessTokenService` valida `exp` contra o `Clock` injetado, e não contra o relógio
de parede — por isso isso funciona.

## Banco real

As fixtures de `src/tests/integration/conftest.py` sobem um Postgres por sessão e limpam
as tabelas entre testes. Exige Docker no ambiente.

```bash
uv run pytest -m unit          # rápido, sem Docker
uv run pytest -m integration   # precisa de Docker
```

## Cobertura

```bash
make test                                   # falha abaixo de 90%
uv run pytest --cov=app --cov-report=html   # relatório navegável
```

Antes de escrever teste para subir o número, leia **quais** linhas faltam. Caminho de erro
sem teste é lacuna real; código que ninguém chama deve ser apagado, não coberto.
