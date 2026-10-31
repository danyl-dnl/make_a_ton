"""API router aggregator."""

from fastapi import APIRouter
from app.api.v1.endpoints.health import router as health_router

api_router = APIRouter()

# Include health router so both /api/health and /api/v1/health can resolve cleanly
api_router.include_router(health_router, prefix="", tags=["Health"])
api_router.include_router(health_router, prefix="/v1", tags=["Health"])
