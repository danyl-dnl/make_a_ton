"""API router aggregator."""

from fastapi import APIRouter
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.plans import router as plans_router
from app.api.v1.endpoints.products import router as products_router

api_router = APIRouter()

# Include health router so both /api/health and /api/v1/health can resolve cleanly
api_router.include_router(health_router, prefix="", tags=["Health"])
api_router.include_router(health_router, prefix="/v1", tags=["Health"])

# Authentication endpoints under /api/auth and /api/v1/auth
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(auth_router, prefix="/v1/auth", tags=["Authentication"])

# Product catalog management endpoints
api_router.include_router(products_router, prefix="/products", tags=["Products"])
api_router.include_router(products_router, prefix="/v1/products", tags=["Products"])

# Pricing plan management endpoints
api_router.include_router(plans_router, prefix="/plans", tags=["Plans"])
api_router.include_router(plans_router, prefix="/v1/plans", tags=["Plans"])
