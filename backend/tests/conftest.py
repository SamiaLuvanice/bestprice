"""Dublê padrão do limitador de login para os testes HTTP.

Desde a spec 0054 o login reserva cada tentativa no PostgreSQL (pg_advisory_xact_lock), o que
não existe no SQLite em memória usado pelos testes HTTP de outras funcionalidades. Esses
testes só precisam entrar; o limite de login é verificado nos testes test_login_*, que usam
o dublê abaixo (contrato HTTP) ou o PostgresLoginLimiter real (integração).
"""

from collections.abc import Iterator
from dataclasses import dataclass, field
from datetime import datetime

import pytest
from sqlalchemy.orm import Session

from app.auth.login_limiter import LoginRateLimited
from app.auth.routes import get_login_limiter
from app.auth.settings import LoginSettings
from app.main import app


@dataclass
class FakeLoginLimiter:
    """Registra reservas e sucessos; recusa tudo quando `retry_after_seconds` está definido."""

    retry_after_seconds: int | None = None
    reservations: list[tuple[str, str | None, datetime]] = field(default_factory=list)
    successes: list[tuple[int, str, str]] = field(default_factory=list)

    def reserve(
        self, _session: Session, source_key: str, account_key: str | None, now: datetime, _settings: LoginSettings,
    ) -> int:
        if self.retry_after_seconds is not None:
            raise LoginRateLimited(self.retry_after_seconds)
        self.reservations.append((source_key, account_key, now))
        return len(self.reservations)

    def record_success(self, _session: Session, reservation_id: int, source_key: str, account_key: str) -> None:
        self.successes.append((reservation_id, source_key, account_key))


@pytest.fixture(autouse=True)
def login_limiter() -> Iterator[FakeLoginLimiter]:
    limiter = FakeLoginLimiter()
    app.dependency_overrides[get_login_limiter] = lambda: limiter
    try:
        yield limiter
    finally:
        app.dependency_overrides.pop(get_login_limiter, None)
