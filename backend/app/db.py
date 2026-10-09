import os
from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session


class Base(DeclarativeBase):
    pass


def database_url() -> str:
    configured = os.environ.get("DATABASE_URL")
    if configured:
        return configured.replace("postgresql://", "postgresql+psycopg://", 1)
    options = {name: os.environ.get(name) for name in ("DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD")}
    if any(value is None for value in options.values()):
        raise RuntimeError("Banco de dados não configurado")
    from sqlalchemy.engine import URL

    return URL.create(
        "postgresql+psycopg",
        username=options["DB_USER"], password=options["DB_PASSWORD"],
        host=options["DB_HOST"], port=int(options["DB_PORT"]), database=options["DB_NAME"],
    ).render_as_string(hide_password=False)


def _pin_utc_timezone(dbapi_connection, _connection_record) -> None:
    # Timestamps leave PostgreSQL as UTC regardless of server/PGTZ defaults, so the API
    # serializes instants with "Z". SET runs in autocommit so a later rollback keeps it.
    previous = dbapi_connection.autocommit
    dbapi_connection.autocommit = True
    try:
        with dbapi_connection.cursor() as cursor:
            cursor.execute("SET TIME ZONE 'UTC'")
    finally:
        dbapi_connection.autocommit = previous


@lru_cache(maxsize=1)
def create_database_engine():
    engine = create_engine(database_url(), pool_pre_ping=True)
    event.listen(engine, "connect", _pin_utc_timezone)
    return engine


def get_session() -> Iterator[Session]:
    with Session(create_database_engine()) as session:
        yield session
