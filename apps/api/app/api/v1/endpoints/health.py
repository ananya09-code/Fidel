"""Health-check endpoint."""

from fastapi import APIRouter

from app.schemas.health import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
)
async def health_check() -> HealthResponse:
    """Report that the API is reachable and healthy."""
    return HealthResponse(status="healthy", service="fidel-api")