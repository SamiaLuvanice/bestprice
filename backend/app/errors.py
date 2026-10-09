from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class ApiError(Exception):
    def __init__(
        self, status_code: int, code: str, message: str,
        tracked_product_id: str | None = None, retry_after_seconds: int | None = None,
    ) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        self.tracked_product_id = tracked_product_id
        self.retry_after_seconds = retry_after_seconds


def api_error_handler(_request: Request, error: ApiError) -> JSONResponse:
    headers = {"Retry-After": str(error.retry_after_seconds)} if error.retry_after_seconds is not None else None
    return JSONResponse(
        status_code=error.status_code,
        headers=headers,
        content={"error": {
            "code": error.code,
            "message": error.message,
            "fields": [],
            "tracked_product_id": error.tracked_product_id,
            "retry_after_seconds": error.retry_after_seconds,
        }},
    )


def validation_error_handler(_request: Request, error: RequestValidationError) -> JSONResponse:
    fields = []
    for item in error.errors():
        location = item.get("loc", ())
        field = ".".join(str(part) for part in location if part not in {"body", "query", "path"})
        fields.append({
            "field": field or "body",
            "code": str(item.get("type", "invalid_value")),
            "message": "Valor inválido ou ausente.",
        })
    return JSONResponse(status_code=422, content={"error": {
        "code": "validation_error", "message": "Confira os dados informados.",
        "fields": fields, "tracked_product_id": None, "retry_after_seconds": None,
    }})
