import os


def database_connection_options() -> dict[str, str] | None:
    url = os.environ.get("DATABASE_URL")
    if url:
        return {"conninfo": url}

    options = {
        "host": os.environ.get("DB_HOST", ""),
        "port": os.environ.get("DB_PORT", "5432"),
        "dbname": os.environ.get("DB_NAME", ""),
        "user": os.environ.get("DB_USER", ""),
        "password": os.environ.get("DB_PASSWORD", ""),
    }
    return options if all(options.values()) else None
