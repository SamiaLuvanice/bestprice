import re
from datetime import datetime
from decimal import Decimal
from typing import Literal
from urllib.parse import urlsplit
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ChatInput(Input):
    conversation_id: UUID | None
    request_id: UUID
    message: str = Field(min_length=1, max_length=2000)

    @field_validator("message")
    @classmethod
    def meaningful_message(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Informe uma mensagem.")
        return value.strip()


class ProductInput(Input):
    name: str = Field(min_length=1, max_length=200)
    details: str = Field(max_length=2000)
    price: str | None
    currency: Literal["BRL"]
    url: str | None = Field(max_length=2048)

    @field_validator("name")
    @classmethod
    def meaningful_name(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Informe o nome.")
        return value.strip()

    @field_validator("price")
    @classmethod
    def valid_price(cls, value: str | None) -> str | None:
        if value is not None and (
            not re.fullmatch(r"(?:0|[1-9]\d{0,15})\.\d{2}", value) or Decimal(value) <= 0
        ):
            raise ValueError("Informe um preço positivo com duas casas decimais.")
        return value

    @field_validator("url")
    @classmethod
    def reference_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        try:
            parsed = urlsplit(value)
            valid = parsed.scheme in {"http", "https"} and bool(parsed.hostname)
        except ValueError:
            valid = False
        if not valid:
            raise ValueError("Informe um endereço http ou https.")
        return value


class ComparisonInput(Input):
    title: str = Field(min_length=1, max_length=100)
    use_case: str = Field(max_length=2000)
    products: list[ProductInput] = Field(min_length=2, max_length=3)

    @field_validator("title")
    @classmethod
    def meaningful_title(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Informe o título.")
        return value.strip()


class ComparisonUpdate(ComparisonInput):
    version: int = Field(ge=1)


class AnalysisInput(Input):
    request_id: UUID
    version: int = Field(ge=1)


class Summary(BaseModel):
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    expires_at: datetime


class MessageOutput(BaseModel):
    id: UUID
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime


class ConversationOutput(Summary):
    messages: list[MessageOutput]


class AnalysisOutput(BaseModel):
    version: int
    content: str
    created_at: datetime


class ComparisonOutput(Summary):
    use_case: str
    products: list[ProductInput]
    version: int
    analysis: AnalysisOutput | None


class ChatOutput(BaseModel):
    conversation_id: UUID
    request_id: UUID
    user_message: MessageOutput
    assistant_message: MessageOutput
    expires_at: datetime


class ResearchItem(Summary):
    kind: Literal["conversation", "comparison"]


class ResearchPage(BaseModel):
    items: list[ResearchItem]
    next_offset: int | None
