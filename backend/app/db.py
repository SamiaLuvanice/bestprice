import os
from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import create_engine
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


@lru_cache(maxsize=1)
def create_database_engine():
    return create_engine(database_url(), pool_pre_ping=True)


def get_session() -> Iterator[Session]:
    with Session(create_database_engine()) as session:
        yield session
