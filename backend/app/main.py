from typing import Literal

from fastapi import Depends, FastAPI, Response, status
from pydantic import BaseModel

from app.health import database_available


class HealthResponse(BaseModel):
    status: Literal["ok", "unavailable"]
    database: Literal["ok", "unavailable"]

app = FastAPI()


@app.get("/api/health", response_model=HealthResponse)
def health(response: Response, ready: bool = Depends(database_available)) -> HealthResponse:
    if ready:
        return HealthResponse(status="ok", database="ok")

    response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return HealthResponse(status="unavailable", database="unavailable")
