import os
from dataclasses import dataclass

MODEL = "gemini-3.5-flash-lite"
RETENTION_DAYS = 90
MAX_MESSAGE_CHARS = 2000
MAX_CONTEXT_CHARS = 16000
MAX_RESPONSE_CHARS = 8000
USER_DAILY_LIMIT = 20
GLOBAL_DAILY_LIMIT = 60
USER_MINUTE_LIMIT = 3
GLOBAL_MINUTE_LIMIT = 5


@dataclass(frozen=True)
class AISettings:
    enabled: bool
    api_key: str

    @property
    def available(self) -> bool:
        return self.enabled and bool(self.api_key.strip())


def ai_settings() -> AISettings:
    return AISettings(
        enabled=os.environ.get("AI_ENABLED", "false").lower() == "true",
        api_key=os.environ.get("GEMINI_API_KEY", ""),
    )
