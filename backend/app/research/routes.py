from functools import wraps
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, Response
from sqlalchemy.exc import SQLAlchemyError

from app.auth.routes import SessionDep, current_user
from app.errors import ApiError
from app.products.models import User
from app.research import repository as repo
from app.research import service
from app.research.models import Comparison, Conversation
from app.research.provider import GeminiProvider, get_provider
from app.research.schemas import (
    AnalysisInput,
    ChatInput,
    ChatOutput,
    ComparisonInput,
    ComparisonOutput,
    ComparisonUpdate,
    ConversationOutput,
    ResearchPage,
)
from app.research.serialization import comparison_output, conversation_output
from app.research.settings import MODEL, ai_settings

router = APIRouter(prefix="/api", tags=["research"])


def database_guard(function):
    @wraps(function)
    def guarded(*args, **kwargs):
        try:
            return function(*args, **kwargs)
        except SQLAlchemyError as error:
            raise ApiError(503, "research_unavailable", "Não foi possível acessar suas pesquisas. Tente novamente.") from error
    return guarded


def research_user(request: Request, session: SessionDep) -> User:
    try:
        return current_user(request, session)
    except SQLAlchemyError as error:
        raise ApiError(503, "research_unavailable", "Não foi possível acessar suas pesquisas. Tente novamente.") from error


ResearchUser = Annotated[User, Depends(research_user)]
ProviderDep = Annotated[GeminiProvider, Depends(get_provider)]
ClockDep = Annotated[service.Clock, Depends(service.get_clock)]


@router.get("/ai/capabilities")
def capabilities(_user: ResearchUser) -> dict:
    return {
        "enabled": ai_settings().available, "provider": "google", "model": MODEL,
        "retention_days": 90, "max_message_chars": 2000, "user_daily_limit": 20,
    }


@router.post("/ai/chat", response_model=ChatOutput)
@database_guard
def chat(payload: ChatInput, user: ResearchUser, session: SessionDep, provider: ProviderDep, clock: ClockDep):
    return service.send_chat(session, user.id, payload, provider, clock)


@router.get("/ai/conversations/{resource_id}", response_model=ConversationOutput)
@database_guard
def get_conversation(resource_id: UUID, user: ResearchUser, session: SessionDep, clock: ClockDep):
    resource = repo.owned(session, Conversation, resource_id, user.id, clock())
    return conversation_output(session, resource)


@router.delete("/ai/conversations/{resource_id}", status_code=204)
@database_guard
def delete_conversation(resource_id: UUID, user: ResearchUser, session: SessionDep, clock: ClockDep):
    repo.delete_research(session, Conversation, resource_id, user.id, clock())
    session.commit()
    return Response(status_code=204)


@router.post("/comparisons", status_code=201, response_model=ComparisonOutput)
@database_guard
def create_comparison(payload: ComparisonInput, user: ResearchUser, session: SessionDep, clock: ClockDep):
    return comparison_output(service.create_comparison(session, user.id, payload, clock()))


@router.get("/comparisons/{resource_id}", response_model=ComparisonOutput)
@database_guard
def get_comparison(resource_id: UUID, user: ResearchUser, session: SessionDep, clock: ClockDep):
    return comparison_output(repo.owned(session, Comparison, resource_id, user.id, clock()))


@router.put("/comparisons/{resource_id}", response_model=ComparisonOutput)
@database_guard
def update_comparison(resource_id: UUID, payload: ComparisonUpdate, user: ResearchUser, session: SessionDep, clock: ClockDep):
    return comparison_output(service.update_comparison(session, user.id, resource_id, payload, clock()))


@router.post("/comparisons/{resource_id}/analyze", response_model=ComparisonOutput)
@database_guard
def analyze_comparison(resource_id: UUID, payload: AnalysisInput, user: ResearchUser, session: SessionDep, provider: ProviderDep, clock: ClockDep):
    return service.analyze_comparison(session, user.id, resource_id, payload, provider, clock)


@router.delete("/comparisons/{resource_id}", status_code=204)
@database_guard
def delete_comparison(resource_id: UUID, user: ResearchUser, session: SessionDep, clock: ClockDep):
    repo.delete_research(session, Comparison, resource_id, user.id, clock())
    session.commit()
    return Response(status_code=204)


@router.get("/research", response_model=ResearchPage)
@database_guard
def list_research(
    user: ResearchUser, session: SessionDep, clock: ClockDep,
    kind: Literal["all", "conversation", "comparison"] = "all",
    q: str = Query(default="", max_length=100), offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=50),
):
    return repo.research_page(session, user.id, clock(), kind, q.strip(), offset, limit)
