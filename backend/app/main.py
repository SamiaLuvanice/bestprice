import asyncio
from contextlib import asynccontextmanager, suppress
from typing import Literal

from fastapi import Depends, FastAPI, Response, status
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel

from app.auth.routes import router as auth_router
from app.errors import ApiError, api_error_handler, validation_error_handler
from app.health import database_available
from app.marketplace.oauth_routes import router as marketplace_oauth_router
from app.products.routes import dashboard_router
from app.products.routes import router as product_router
from app.research.cleanup import cleanup_loop
from app.research.routes import router as research_router


class HealthResponse(BaseModel):
    status: Literal["ok", "unavailable"]
    database: Literal["ok", "unavailable"]

@asynccontextmanager
async def lifespan(_app: FastAPI):
    cleanup_task = asyncio.create_task(cleanup_loop())
    try:
        yield
    finally:
        cleanup_task.cancel()
        with suppress(asyncio.CancelledError):
            await cleanup_task


app = FastAPI(lifespan=lifespan)
app.add_exception_handler(ApiError, api_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.include_router(auth_router)
app.include_router(product_router)
app.include_router(dashboard_router)
app.include_router(marketplace_oauth_router)
app.include_router(research_router)


@app.get("/api/health", response_model=HealthResponse)
def health(response: Response, ready: bool = Depends(database_available)) -> HealthResponse:
    if ready:
        return HealthResponse(status="ok", database="ok")

    response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return HealthResponse(status="unavailable", database="unavailable")
