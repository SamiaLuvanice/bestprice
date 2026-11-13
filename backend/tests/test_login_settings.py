"""AC13 e AC14 — configuração do limite de login, validada na partida da API."""

from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.auth.settings import login_settings
from app.main import app

LOGIN_VARIABLES = (
    "SIGNUP_ENABLED", "SIGNUP_RATE_LIMIT_ATTEMPTS", "SIGNUP_RATE_LIMIT_WINDOW_MINUTES",
    "TRUSTED_PROXY_SECRET", "SIGNUP_SOURCE_HASH_SECRET",
    "LOGIN_RATE_LIMIT_ACCOUNT_ATTEMPTS", "LOGIN_RATE_LIMIT_SOURCE_ATTEMPTS", "LOGIN_RATE_LIMIT_WINDOW_MINUTES",
)
PROXY_SECRET = "p" * 32
HASH_SECRET = "h" * 32


@pytest.fixture(autouse=True)
def clean_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    for name in LOGIN_VARIABLES:
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setenv("APP_ENV", "development")


@pytest.fixture(autouse=True)
def startup_cleanups(monkeypatch: pytest.MonkeyPatch) -> list[float]:
    # Mesmo dublê de test_signup_settings: a limpeza real não roda na partida do teste.
    started: list[float] = []

    async def fake_cleanup_loop(interval: float = 3600) -> None:
        started.append(interval)

    monkeypatch.setattr("app.main.cleanup_loop", fake_cleanup_loop)
    return started


def test_defaults_are_ten_per_account_fifty_per_source_in_fifteen_minutes() -> None:
    settings = login_settings()
    assert (settings.account_attempts, settings.source_attempts, settings.window) == (
        10, 50, timedelta(minutes=15),
    )
    assert settings.trusted_proxy_secret == ""


def test_custom_values_are_read_from_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LOGIN_RATE_LIMIT_ACCOUNT_ATTEMPTS", "3")
    monkeypatch.setenv("LOGIN_RATE_LIMIT_SOURCE_ATTEMPTS", "7")
    monkeypatch.setenv("LOGIN_RATE_LIMIT_WINDOW_MINUTES", "2")
    monkeypatch.setenv("TRUSTED_PROXY_SECRET", PROXY_SECRET)
    monkeypatch.setenv("SIGNUP_SOURCE_HASH_SECRET", HASH_SECRET)
    settings = login_settings()
    assert (settings.account_attempts, settings.source_attempts, settings.window) == (3, 7, timedelta(minutes=2))
    assert (settings.trusted_proxy_secret, settings.hash_secret) == (PROXY_SECRET, HASH_SECRET)


@pytest.mark.parametrize(("name", "value"), [
    ("LOGIN_RATE_LIMIT_ACCOUNT_ATTEMPTS", "0"),
    ("LOGIN_RATE_LIMIT_ACCOUNT_ATTEMPTS", "1001"),
    ("LOGIN_RATE_LIMIT_ACCOUNT_ATTEMPTS", "dez"),
    ("LOGIN_RATE_LIMIT_SOURCE_ATTEMPTS", "0"),
    ("LOGIN_RATE_LIMIT_SOURCE_ATTEMPTS", "10001"),
    ("LOGIN_RATE_LIMIT_SOURCE_ATTEMPTS", "1.5"),
    ("LOGIN_RATE_LIMIT_WINDOW_MINUTES", "0"),
    ("LOGIN_RATE_LIMIT_WINDOW_MINUTES", "1441"),
    ("TRUSTED_PROXY_SECRET", "curto"),
    ("SIGNUP_SOURCE_HASH_SECRET", "s" * 31),
])
def test_values_out_of_range_fail_fast(monkeypatch: pytest.MonkeyPatch, name: str, value: str) -> None:
    monkeypatch.setenv(name, value)
    with pytest.raises(RuntimeError, match=name):
        login_settings()


def test_range_limits_are_inclusive(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LOGIN_RATE_LIMIT_ACCOUNT_ATTEMPTS", "1000")
    monkeypatch.setenv("LOGIN_RATE_LIMIT_SOURCE_ATTEMPTS", "10000")
    monkeypatch.setenv("LOGIN_RATE_LIMIT_WINDOW_MINUTES", "1440")
    assert login_settings().window == timedelta(minutes=1440)
    monkeypatch.setenv("LOGIN_RATE_LIMIT_ACCOUNT_ATTEMPTS", "1")
    monkeypatch.setenv("LOGIN_RATE_LIMIT_SOURCE_ATTEMPTS", "1")
    monkeypatch.setenv("LOGIN_RATE_LIMIT_WINDOW_MINUTES", "1")
    assert (login_settings().account_attempts, login_settings().source_attempts) == (1, 1)


def test_source_limit_below_account_limit_fails(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LOGIN_RATE_LIMIT_ACCOUNT_ATTEMPTS", "20")
    monkeypatch.setenv("LOGIN_RATE_LIMIT_SOURCE_ATTEMPTS", "19")
    with pytest.raises(RuntimeError, match="LOGIN_RATE_LIMIT_SOURCE_ATTEMPTS") as raised:
        login_settings()
    assert "LOGIN_RATE_LIMIT_ACCOUNT_ATTEMPTS" in str(raised.value)
    monkeypatch.setenv("LOGIN_RATE_LIMIT_SOURCE_ATTEMPTS", "20")
    assert login_settings().source_attempts == 20


@pytest.mark.parametrize("environment", ["stage", "production"])
@pytest.mark.parametrize("missing", ["TRUSTED_PROXY_SECRET", "SIGNUP_SOURCE_HASH_SECRET"])
def test_deployed_environment_requires_both_secrets_even_with_signup_off(
    monkeypatch: pytest.MonkeyPatch, environment: str, missing: str,
) -> None:
    monkeypatch.setenv("APP_ENV", environment)
    monkeypatch.setenv("SIGNUP_ENABLED", "false")
    monkeypatch.setenv("TRUSTED_PROXY_SECRET", PROXY_SECRET)
    monkeypatch.setenv("SIGNUP_SOURCE_HASH_SECRET", HASH_SECRET)
    assert login_settings().hash_secret == HASH_SECRET
    monkeypatch.delenv(missing)
    with pytest.raises(RuntimeError, match=missing):
        login_settings()


def test_proxy_and_hash_secrets_must_differ(monkeypatch: pytest.MonkeyPatch) -> None:
    shared = "mesmo-segredo-" + "x" * 32
    monkeypatch.setenv("TRUSTED_PROXY_SECRET", shared)
    monkeypatch.setenv("SIGNUP_SOURCE_HASH_SECRET", shared)
    with pytest.raises(RuntimeError, match="TRUSTED_PROXY_SECRET") as raised:
        login_settings()
    assert shared not in str(raised.value)


def test_local_without_hash_secret_uses_one_random_secret_per_process() -> None:
    first, second = login_settings(), login_settings()
    assert len(first.hash_secret) >= 32
    assert first.hash_secret == second.hash_secret  # estável durante o processo


def test_local_ephemeral_secret_is_not_predictable(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.auth import settings as settings_module

    generated = settings_module.ephemeral_hash_secret()
    settings_module.ephemeral_hash_secret.cache_clear()
    try:
        assert settings_module.ephemeral_hash_secret() != generated
    finally:
        settings_module.ephemeral_hash_secret.cache_clear()


def test_error_messages_never_echo_secret_values(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SIGNUP_SOURCE_HASH_SECRET", "segredo-curto-y")
    with pytest.raises(RuntimeError) as raised:
        login_settings()
    assert "segredo-curto-y" not in str(raised.value)


def test_lifespan_refuses_stage_without_secrets_even_with_signup_off(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "stage")
    with pytest.raises(RuntimeError, match="TRUSTED_PROXY_SECRET|SIGNUP_SOURCE_HASH_SECRET"), TestClient(app):
        pass


def test_lifespan_refuses_invalid_login_limits(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LOGIN_RATE_LIMIT_WINDOW_MINUTES", "0")
    with pytest.raises(RuntimeError, match="LOGIN_RATE_LIMIT_WINDOW_MINUTES"), TestClient(app):
        pass


def test_lifespan_starts_locally_without_secrets(monkeypatch: pytest.MonkeyPatch) -> None:
    with TestClient(app) as client:
        assert client.app is app


def test_lifespan_starts_in_stage_with_both_secrets(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "stage")
    monkeypatch.setenv("TRUSTED_PROXY_SECRET", PROXY_SECRET)
    monkeypatch.setenv("SIGNUP_SOURCE_HASH_SECRET", HASH_SECRET)
    with TestClient(app) as client:
        assert client.app is app
