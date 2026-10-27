from app.research import repository
from app.research.models import Comparison, Conversation, Message


def summary(resource: Conversation | Comparison) -> dict:
    return {
        "id": resource.id, "title": resource.title,
        "created_at": repository.utc(resource.created_at),
        "updated_at": repository.utc(resource.updated_at),
        "expires_at": repository.utc(resource.expires_at),
    }


def message_output(message: Message) -> dict:
    return {"id": message.id, "role": message.role, "content": message.content, "created_at": repository.utc(message.created_at)}


def conversation_output(session, resource: Conversation) -> dict:
    return {**summary(resource), "messages": [message_output(row) for row in repository.messages(session, resource.id)]}


def comparison_output(resource: Comparison) -> dict:
    return {
        **summary(resource), "use_case": resource.use_case, "products": comparison_products_output(resource),
        "version": resource.version, "analysis": resource.analysis,
    }


def comparison_products_output(resource: Comparison) -> list[dict]:
    return [{
        "name": product.name, "details": product.details,
        "price": format(product.price, ".2f") if product.price is not None else None,
        "currency": product.currency, "url": product.url,
    } for product in resource.products]
