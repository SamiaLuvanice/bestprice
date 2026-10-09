"""Validated operational limits for the monitoring process and price freshness."""

import os
from dataclasses import dataclass
from datetime import timedelta


def _integer(name: str, default: int, minimum: int, maximum: int) -> int:
    raw = os.getenv(name, str(default))
    try:
        value = int(raw)
    except ValueError as exc:
        raise ValueError(f"{name} deve ser um número inteiro") from exc
    if not minimum <= value <= maximum:
        raise ValueError(f"{name} deve estar entre {minimum} e {maximum}")
    return value


@dataclass(frozen=True)
class MonitoringSettings:
    check_interval: timedelta
    freshness_window: timedelta
    batch_limit: int
    max_concurrency: int
    poll_interval_seconds: int


def load_monitoring_settings() -> MonitoringSettings:
    return MonitoringSettings(
        check_interval=timedelta(seconds=_integer("MONITOR_CHECK_INTERVAL_SECONDS", 3600, 60, 86400)),
        freshness_window=timedelta(seconds=_integer("MONITOR_FRESHNESS_SECONDS", 3600, 60, 86400)),
        batch_limit=_integer("MONITOR_BATCH_LIMIT", 20, 1, 100),
        max_concurrency=_integer("MONITOR_MAX_CONCURRENCY", 1, 1, 16),
        poll_interval_seconds=_integer("MONITOR_POLL_INTERVAL_SECONDS", 60, 1, 3600),
    )
