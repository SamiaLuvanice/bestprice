import base64
import binascii
from datetime import UTC, datetime
from uuid import UUID

from app.errors import ApiError


def encode_cursor(moment: datetime, row_id: UUID) -> str:
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=UTC)
    raw = f"{moment.astimezone(UTC).isoformat()}|{row_id}"
    return base64.urlsafe_b64encode(raw.encode("ascii")).decode("ascii").rstrip("=")


def decode_cursor(raw: str) -> tuple[datetime, UUID]:
    try:
        if not raw or len(raw) > 160 or any(char not in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_" for char in raw):
            raise ValueError("cursor inválido")
        decoded = base64.b64decode(raw + "=" * (-len(raw) % 4), altchars=b"-_", validate=True).decode("ascii")
        moment_raw, id_raw = decoded.split("|", maxsplit=1)
        moment = datetime.fromisoformat(moment_raw)
        if moment.tzinfo is None or moment.utcoffset() is None:
            raise ValueError("cursor sem fuso")
        return moment.astimezone(UTC), UUID(id_raw)
    except (ValueError, UnicodeError, binascii.Error) as exc:
        raise ApiError(422, "validation_error", "Cursor inválido.") from exc
