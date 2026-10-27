from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import delete, func, literal, select, text, union_all, update
from sqlalchemy.orm import Session

from app.errors import ApiError
from app.research.models import (
    AIRequest,
    AIUsage,
    Comparison,
    ComparisonProduct,
    Conversation,
    Message,
)
from app.research.settings import (
    GLOBAL_DAILY_LIMIT,
    GLOBAL_MINUTE_LIMIT,
    USER_DAILY_LIMIT,
    USER_MINUTE_LIMIT,
)


def utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def not_found() -> ApiError:
    return ApiError(404, "research_not_found", "Pesquisa não encontrada.")


def owned(session: Session, model, resource_id: UUID, owner_id: UUID, now: datetime, *, lock=False):
    statement = select(model).where(model.id == resource_id, model.user_id == owner_id, model.expires_at > now)
    if lock:
        statement = statement.with_for_update()
    resource = session.scalar(statement.execution_options(populate_existing=True))
    if resource is None:
        raise not_found()
    return resource


def messages(session: Session, conversation_id: UUID) -> list[Message]:
    return list(session.scalars(select(Message).where(Message.conversation_id == conversation_id).order_by(Message.position)))


def request_by_id(session: Session, owner_id: UUID, request_id: UUID) -> AIRequest | None:
    return session.scalar(select(AIRequest).where(AIRequest.user_id == owner_id, AIRequest.request_id == request_id))


def serialize_reservations(session: Session) -> None:
    # One short global reservation lock also fixes ordering across user/global windows.
    if session.bind.dialect.name == "postgresql":
        session.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": 3400195})


def quota_windows(owner_id: UUID, now: datetime) -> list[tuple[str, datetime, int]]:
    minute = now.replace(second=0, microsecond=0)
    day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return [
        (f"global:minute:{minute.isoformat()}", minute + timedelta(minutes=1), GLOBAL_MINUTE_LIMIT),
        (f"global:day:{day.date()}", day + timedelta(days=1), GLOBAL_DAILY_LIMIT),
        (f"{owner_id}:minute:{minute.isoformat()}", minute + timedelta(minutes=1), USER_MINUTE_LIMIT),
        (f"{owner_id}:day:{day.date()}", day + timedelta(days=1), USER_DAILY_LIMIT),
    ]


def reserve_quota(session: Session, owner_id: UUID, now: datetime) -> None:
    counters = []
    for key, expires_at, limit in quota_windows(owner_id, now):
        counter = session.get(AIUsage, key)
        if counter is None:
            counter = AIUsage(key=key, count=0, expires_at=expires_at)
            session.add(counter)
        if counter.count >= limit:
            retry = max(1, int((expires_at - now).total_seconds()) + 1)
            raise ApiError(429, "ai_rate_limited", "Limite de uso atingido. Tente novamente depois.", retry_after_seconds=retry)
        counters.append(counter)
    for counter in counters:
        counter.count += 1


def pending_for_target(session: Session, target_id: UUID, now: datetime) -> bool:
    return session.scalar(select(AIRequest.id).where(
        AIRequest.target_id == target_id, AIRequest.state == "processing",
        AIRequest.created_at > now - timedelta(seconds=90),
    ).limit(1)) is not None


def research_page(session: Session, owner_id: UUID, now: datetime, kind: str, query: str, offset: int, limit: int):
    branches = []
    for name, model in (("conversation", Conversation), ("comparison", Comparison)):
        if kind not in {"all", name}:
            continue
        columns = [model.id, model.title, model.created_at, model.updated_at, model.expires_at]
        statement = select(*columns, literal(name).label("kind")).where(model.user_id == owner_id, model.expires_at > now)
        if query:
            statement = statement.where(func.lower(model.title).contains(query.lower(), autoescape=True))
        branches.append(statement)
    combined = union_all(*branches).subquery()
    statement = select(combined).order_by(combined.c.updated_at.desc(), combined.c.kind, combined.c.id).offset(offset).limit(limit + 1)
    rows = list(session.execute(statement).mappings())
    items = [dict(row) for row in rows[:limit]]
    for item in items:
        for field in ("created_at", "updated_at", "expires_at"):
            item[field] = utc(item[field])
    return {"items": items, "next_offset": offset + limit if len(rows) > limit else None}


def erase_request_content(session: Session, kind: str, target_ids: list[UUID]) -> None:
    if target_ids:
        session.execute(update(AIRequest).where(AIRequest.kind == kind, AIRequest.target_id.in_(target_ids)).values(
            result=None, state="failed", error={"status": 404, "code": "research_not_found", "message": "Pesquisa não encontrada."},
        ))


def delete_research(session: Session, model, resource_id: UUID, owner_id: UUID, now: datetime) -> None:
    owned(session, model, resource_id, owner_id, now, lock=True)
    kind = "conversation" if model is Conversation else "comparison"
    erase_request_content(session, kind, [resource_id])
    delete_resource_children(session, model, [resource_id])
    session.execute(delete(model).where(model.id == resource_id))


def delete_resource_children(session: Session, model, resource_ids: list[UUID]) -> None:
    if model is Conversation:
        child_model, parent_column = Message, Message.conversation_id
    else:
        child_model, parent_column = ComparisonProduct, ComparisonProduct.comparison_id
    session.execute(delete(child_model).where(parent_column.in_(resource_ids)))


def purge_expired(session: Session, now: datetime) -> int:
    count = 0
    for kind, model in (("conversation", Conversation), ("comparison", Comparison)):
        ids = list(session.scalars(select(model.id).where(model.expires_at <= now)))
        erase_request_content(session, kind, ids)
        if ids:
            delete_resource_children(session, model, ids)
            session.execute(delete(model).where(model.id.in_(ids)))
            count += len(ids)
    session.execute(delete(AIRequest).where(AIRequest.created_at <= now - timedelta(hours=24)))
    session.execute(delete(AIUsage).where(AIUsage.expires_at <= now - timedelta(days=2)))
    return count
