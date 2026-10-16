import pytest

from app import db


def test_engine_options_bound_age_reuse_and_wait() -> None:
    options = db.engine_kwargs()

    assert options["pool_pre_ping"] is True
    assert options["pool_recycle"] == 300
    assert options["pool_use_lifo"] is True
    assert options["pool_timeout"] == 10
    assert options["connect_args"] == {"connect_timeout": 5}


def test_create_database_engine_applies_pool_options(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:secret@localhost:5432/bestprice")
    db.create_database_engine.cache_clear()
    engine = db.create_database_engine()
    try:
        options = db.engine_kwargs()
        assert engine.pool._pre_ping is options["pool_pre_ping"]
        assert engine.pool._recycle == options["pool_recycle"]
        assert engine.pool._timeout == options["pool_timeout"]
        assert engine.pool._pool.use_lifo is options["pool_use_lifo"]
    finally:
        engine.dispose()
        db.create_database_engine.cache_clear()
