"""Health check endpoint handler."""

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import __version__
from app.core.config import settings
from app.db.session import get_db
from app.schemas.health import HealthCheckResponse
from app.services.health_service import HealthService

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="Health Check and Database Verification",
    description="Returns service status, environment details, and verifies PostgreSQL connection.",
    responses={
        200: {
            "description": "System and database are completely healthy.",
            "model": HealthCheckResponse,
        },
        503: {
            "description": "Database connectivity failed or is degraded.",
            "model": HealthCheckResponse,
        },
    },
)
async def health_check(
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> HealthCheckResponse:
    """Perform liveness probe and active PostgreSQL query validation."""
    db_health = await HealthService.check_database_connectivity(db)
    is_healthy = db_health.status == "connected"

    if not is_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return HealthCheckResponse(
        status="healthy" if is_healthy else "unhealthy",
        app_name=settings.APP_NAME,
        version=__version__,
        environment=settings.APP_ENV,
        database=db_health,
    )
