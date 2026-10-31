"""FastAPI Application Entrypoint for Brightloop Software Subscription Management."""

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app import __version__
from app.api.v1.router import api_router
from app.core.config import settings
from app.db.session import async_engine

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("brightloop.backend")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for application startup and shutdown events."""
    logger.info("Initializing Brightloop Backend [%s]...", settings.APP_ENV)
    # Validate database connection on startup
    try:
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("PostgreSQL database connection verified successfully.")
    except Exception as exc:
        logger.warning(
            "Initial database connection probe failed: %s. "
            "(Ensure PostgreSQL container is running via `docker compose up -d`)",
            exc,
        )

    yield

    logger.info("Disposing database connection pool...")
    await async_engine.dispose()
    logger.info("Brightloop Backend shutdown complete.")


def create_application() -> FastAPI:
    """FastAPI application factory."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=__version__,
        description="Subscription Management & Recurring Billing System - Brightloop Software",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Configure CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register API routers under /api
    app.include_router(api_router, prefix=settings.API_V1_STR)

    @app.get("/", tags=["Root"], include_in_schema=False)
    async def root():
        return {
            "message": "Brightloop Subscription Management API",
            "version": __version__,
            "status": "online",
            "docs": "/docs",
            "health": f"{settings.API_V1_STR}/health",
        }

    return app


app = create_application()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
