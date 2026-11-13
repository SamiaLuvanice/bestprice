"""Configuração do cadastro self-service e do limite de login, validada na inicialização da API."""

import os
import secrets
from dataclasses import dataclass
from datetime import timedelta
from functools import cache

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


def _check_distinct_secrets(proxy_secret: str, hash_secret: str) -> None:
    if proxy_secret and proxy_secret == hash_secret:
        # Quem conhece o segredo do proxy (Pages) não pode também reverter os HMACs da origem.
        raise RuntimeError("TRUSTED_PROXY_SECRET e SIGNUP_SOURCE_HASH_SECRET devem ser diferentes")


def signup_settings() -> SignupSettings:
    settings = SignupSettings(
        enabled=os.environ.get("SIGNUP_ENABLED", "false").lower() == "true",
        rate_limit_attempts=_integer("SIGNUP_RATE_LIMIT_ATTEMPTS", 5, 1, 1000),
        rate_limit_window=timedelta(minutes=_integer("SIGNUP_RATE_LIMIT_WINDOW_MINUTES", 60, 1, 1440)),
        trusted_proxy_secret=_secret("TRUSTED_PROXY_SECRET"),
        source_hash_secret=_secret("SIGNUP_SOURCE_HASH_SECRET"),
    )
    _check_distinct_secrets(settings.trusted_proxy_secret, settings.source_hash_secret)
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


@dataclass(frozen=True)
class LoginSettings:
    account_attempts: int
    source_attempts: int
    window: timedelta
    trusted_proxy_secret: str
    hash_secret: str


@cache
def ephemeral_hash_secret() -> str:
    """Segredo local gerado uma vez por processo: basta para um único processo de desenvolvimento."""
    return secrets.token_hex(32)


def login_settings() -> LoginSettings:
    account_attempts = _integer("LOGIN_RATE_LIMIT_ACCOUNT_ATTEMPTS", 10, 1, 1000)
    source_attempts = _integer("LOGIN_RATE_LIMIT_SOURCE_ATTEMPTS", 50, 1, 10000)
    if source_attempts < account_attempts:
        raise RuntimeError(
            "LOGIN_RATE_LIMIT_SOURCE_ATTEMPTS deve ser maior ou igual a LOGIN_RATE_LIMIT_ACCOUNT_ATTEMPTS",
        )
    window = timedelta(minutes=_integer("LOGIN_RATE_LIMIT_WINDOW_MINUTES", 15, 1, 1440))
    # A chave dos limites de login é a mesma do cadastro: nenhum segredo novo para a operação.
    proxy_secret = _secret("TRUSTED_PROXY_SECRET")
    hash_secret = _secret("SIGNUP_SOURCE_HASH_SECRET")
    _check_distinct_secrets(proxy_secret, hash_secret)
    if os.environ.get("APP_ENV") in DEPLOYED_ENVIRONMENTS:
        # O login está sempre ligado: sem os segredos, todo o tráfego cairia numa única origem
        # e 50 falhas de qualquer pessoa bloqueariam o login de todos.
        for name, value in (("TRUSTED_PROXY_SECRET", proxy_secret), ("SIGNUP_SOURCE_HASH_SECRET", hash_secret)):
            if not value:
                raise RuntimeError(f"{name} é obrigatório em stage/production (limite de login)")
    return LoginSettings(
        account_attempts=account_attempts, source_attempts=source_attempts, window=window,
        trusted_proxy_secret=proxy_secret, hash_secret=hash_secret or ephemeral_hash_secret(),
    )
