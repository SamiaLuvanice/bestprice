from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.auth.settings import SignupSettings, signup_settings
from app.main import app

SIGNUP_VARIABLES = (
    "SIGNUP_ENABLED", "SIGNUP_RATE_LIMIT_ATTEMPTS", "SIGNUP_RATE_LIMIT_WINDOW_MINUTES",
    "TRUSTED_PROXY_SECRET", "SIGNUP_SOURCE_HASH_SECRET",
)
SECRET = "s" * 32


@pytest.fixture(autouse=True)
def clean_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    for name in SIGNUP_VARIABLES:
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setenv("APP_ENV", "development")


@pytest.fixture(autouse=True)
def startup_cleanups(monkeypatch: pytest.MonkeyPatch) -> list[float]:
    """Dublê do cleanup_loop: a limpeza real da partida rodaria numa thread que sobrevive ao
    teste e, no CI (DATABASE_URL = banco de teste), apagaria linhas de testes seguintes."""
    started: list[float] = []

    async def fake_cleanup_loop(interval: float = 3600) -> None:
        started.append(interval)

    monkeypatch.setattr("app.main.cleanup_loop", fake_cleanup_loop)
    return started


def test_defaults_keep_signup_off_with_five_attempts_per_hour() -> None:
    assert signup_settings() == SignupSettings(
        enabled=False, rate_limit_attempts=5, rate_limit_window=timedelta(minutes=60),
        trusted_proxy_secret="", source_hash_secret="",
    )


def test_only_true_turns_signup_on(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SIGNUP_SOURCE_HASH_SECRET", SECRET)
    for value, expected in [("true", True), ("TRUE", True), ("1", False), ("yes", False), ("", False)]:
        monkeypatch.setenv("SIGNUP_ENABLED", value)
        assert signup_settings().enabled is expected


def test_custom_limit_is_read_from_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SIGNUP_RATE_LIMIT_ATTEMPTS", "2")
    monkeypatch.setenv("SIGNUP_RATE_LIMIT_WINDOW_MINUTES", "10")
    settings = signup_settings()
    assert (settings.rate_limit_attempts, settings.rate_limit_window) == (2, timedelta(minutes=10))


@pytest.mark.parametrize(("name", "value"), [
    ("SIGNUP_RATE_LIMIT_ATTEMPTS", "0"),
    ("SIGNUP_RATE_LIMIT_ATTEMPTS", "1001"),
    ("SIGNUP_RATE_LIMIT_ATTEMPTS", "cinco"),
    ("SIGNUP_RATE_LIMIT_WINDOW_MINUTES", "0"),
    ("SIGNUP_RATE_LIMIT_WINDOW_MINUTES", "1441"),
    ("TRUSTED_PROXY_SECRET", "curto"),
    ("SIGNUP_SOURCE_HASH_SECRET", "s" * 31),
])
def test_invalid_values_fail_fast(monkeypatch: pytest.MonkeyPatch, name: str, value: str) -> None:
    monkeypatch.setenv(name, value)
    with pytest.raises(RuntimeError, match=name):
        signup_settings()


@pytest.mark.parametrize("environment", ["development", "test", "stage", "production"])
def test_enabled_without_source_hash_secret_fails_in_any_environment(
    monkeypatch: pytest.MonkeyPatch, environment: str,
) -> None:
    monkeypatch.setenv("APP_ENV", environment)
    monkeypatch.setenv("SIGNUP_ENABLED", "true")
    monkeypatch.setenv("TRUSTED_PROXY_SECRET", SECRET)
    with pytest.raises(RuntimeError, match="SIGNUP_SOURCE_HASH_SECRET"):
        signup_settings()


@pytest.mark.parametrize("environment", ["stage", "production"])
def test_enabled_in_deployed_environment_requires_trusted_proxy_secret(
    monkeypatch: pytest.MonkeyPatch, environment: str,
) -> None:
    monkeypatch.setenv("APP_ENV", environment)
    monkeypatch.setenv("SIGNUP_ENABLED", "true")
    monkeypatch.setenv("SIGNUP_SOURCE_HASH_SECRET", SECRET)
    with pytest.raises(RuntimeError, match="TRUSTED_PROXY_SECRET"):
        signup_settings()
    monkeypatch.setenv("TRUSTED_PROXY_SECRET", "p" * 32)
    assert signup_settings().enabled is True


def test_enabled_locally_does_not_require_proxy_secret(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SIGNUP_ENABLED", "true")
    monkeypatch.setenv("SIGNUP_SOURCE_HASH_SECRET", SECRET)
    assert signup_settings().enabled is True


def test_error_message_never_echoes_the_secret_value(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TRUSTED_PROXY_SECRET", "segredo-curto-x")
    with pytest.raises(RuntimeError) as raised:
        signup_settings()
    assert "segredo-curto-x" not in str(raised.value)


def test_lifespan_refuses_to_start_with_invalid_signup_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "stage")
    monkeypatch.setenv("SIGNUP_ENABLED", "true")
    monkeypatch.setenv("SIGNUP_SOURCE_HASH_SECRET", SECRET)
    with pytest.raises(RuntimeError, match="TRUSTED_PROXY_SECRET"), TestClient(app):
        pass


def test_lifespan_starts_with_signup_off_and_no_secrets(
    monkeypatch: pytest.MonkeyPatch, startup_cleanups: list[float],
) -> None:
    monkeypatch.setenv("APP_ENV", "stage")
    with TestClient(app) as client:
        assert client.app is app
    assert startup_cleanups == [3600]  # o dublê rodou no lugar da limpeza real


@pytest.mark.parametrize("enabled", ["true", "false"])
def test_proxy_and_hash_secrets_must_differ(monkeypatch: pytest.MonkeyPatch, enabled: str) -> None:
    shared = "mesmo-segredo-" + "x" * 32
    monkeypatch.setenv("SIGNUP_ENABLED", enabled)
    monkeypatch.setenv("TRUSTED_PROXY_SECRET", shared)
    monkeypatch.setenv("SIGNUP_SOURCE_HASH_SECRET", shared)
    with pytest.raises(RuntimeError, match="TRUSTED_PROXY_SECRET") as raised:
        signup_settings()
    assert "SIGNUP_SOURCE_HASH_SECRET" in str(raised.value) and shared not in str(raised.value)
    monkeypatch.setenv("SIGNUP_SOURCE_HASH_SECRET", "outro-segredo-" + "y" * 32)
    assert signup_settings().trusted_proxy_secret == shared


def test_lifespan_refuses_equal_proxy_and_hash_secrets(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TRUSTED_PROXY_SECRET", SECRET)
    monkeypatch.setenv("SIGNUP_SOURCE_HASH_SECRET", SECRET)
    with pytest.raises(RuntimeError, match="SIGNUP_SOURCE_HASH_SECRET"), TestClient(app):
        pass
