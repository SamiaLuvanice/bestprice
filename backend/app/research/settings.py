import os
from dataclasses import dataclass

# Free tier grounding with Google Search is available on 2.5 Flash-Lite (spec 0047).
MODEL = "gemini-2.5-flash-lite"
RETENTION_DAYS = 90
MAX_MESSAGE_CHARS = 2000
MAX_CONTEXT_CHARS = 16000
MAX_RESPONSE_CHARS = 8000
USER_DAILY_LIMIT = 20
GLOBAL_DAILY_LIMIT = 60
USER_MINUTE_LIMIT = 3
GLOBAL_MINUTE_LIMIT = 5
MAX_GROUNDING_SOURCES = 10
MAX_SOURCE_TITLE_CHARS = 200
MAX_SOURCE_URL_CHARS = 2048
MAX_SUGGESTIONS_HTML_CHARS = 32000


@dataclass(frozen=True)
class AISettings:
    enabled: bool
    api_key: str
    web_search: bool = False

    @property
    def available(self) -> bool:
        return self.enabled and bool(self.api_key.strip())

    @property
    def web_search_enabled(self) -> bool:
        return self.available and self.web_search


def ai_settings() -> AISettings:
    return AISettings(
        enabled=os.environ.get("AI_ENABLED", "false").lower() == "true",
        api_key=os.environ.get("GEMINI_API_KEY", ""),
        web_search=os.environ.get("AI_WEB_SEARCH_ENABLED", "false").lower() == "true",
    )
