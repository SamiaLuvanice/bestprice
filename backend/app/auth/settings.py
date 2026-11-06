"""Configuração do cadastro self-service, validada na inicialização da API."""

import os
from dataclasses import dataclass
from datetime import timedelta

MIN_SECRET_CHARS = 32
DEPLOYED_ENVIRONMENTS = {"stage", "production"}


@dataclass(frozen=True)
class SignupSettings:
    enabled: bool
    rate_limit_attempts: int
    rate_limit_window: timedelta
    trusted_proxy_secret: str
    source_hash_secret: str


def _integer(name: str, default: int, minimum: int, maximum: int) -> int:
    raw = os.environ.get(name, str(default))
    try:
        value = int(raw)
    except ValueError:
        raise RuntimeError(f"{name} deve ser um número inteiro") from None
    if not minimum <= value <= maximum:
        raise RuntimeError(f"{name} deve estar entre {minimum} e {maximum}")
    return value


def _secret(name: str) -> str:
    # A mensagem nunca repete o valor configurado.
    value = os.environ.get(name, "")
    if value and len(value) < MIN_SECRET_CHARS:
        raise RuntimeError(f"{name} deve ter pelo menos {MIN_SECRET_CHARS} caracteres")
    return value


def signup_settings() -> SignupSettings:
    settings = SignupSettings(
        enabled=os.environ.get("SIGNUP_ENABLED", "false").lower() == "true",
        rate_limit_attempts=_integer("SIGNUP_RATE_LIMIT_ATTEMPTS", 5, 1, 1000),
        rate_limit_window=timedelta(minutes=_integer("SIGNUP_RATE_LIMIT_WINDOW_MINUTES", 60, 1, 1440)),
        trusted_proxy_secret=_secret("TRUSTED_PROXY_SECRET"),
        source_hash_secret=_secret("SIGNUP_SOURCE_HASH_SECRET"),
    )
    if settings.trusted_proxy_secret and settings.trusted_proxy_secret == settings.source_hash_secret:
        # Quem conhece o segredo do proxy (Pages) não pode também reverter os HMACs da origem.
        raise RuntimeError("TRUSTED_PROXY_SECRET e SIGNUP_SOURCE_HASH_SECRET devem ser diferentes")
    if settings.enabled and not settings.source_hash_secret:
        # Sem o segredo não há como gravar a origem sem guardá-la em claro.
        raise RuntimeError("SIGNUP_SOURCE_HASH_SECRET é obrigatório com SIGNUP_ENABLED=true")
    if (
        settings.enabled and not settings.trusted_proxy_secret
        and os.environ.get("APP_ENV") in DEPLOYED_ENVIRONMENTS
    ):
        # Sem o segredo do proxy, todo o tráfego do Pages cairia numa única origem.
        raise RuntimeError("TRUSTED_PROXY_SECRET é obrigatório com SIGNUP_ENABLED=true em stage/production")
    return settings
