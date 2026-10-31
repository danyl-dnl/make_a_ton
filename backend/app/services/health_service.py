"""Service layer for health and infrastructure status monitoring."""

import logging
import time
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.health import DatabaseHealth

logger = logging.getLogger(__name__)


class HealthService:
    """Service to probe and monitor health of core infrastructure components."""

    @staticmethod
    async def check_database_connectivity(db: AsyncSession) -> DatabaseHealth:
        """Execute a lightweight probe on PostgreSQL and record response latency.

        Args:
            db (AsyncSession): Active asynchronous database session.

        Returns:
            DatabaseHealth: Connectivity state, round-trip latency, and any error message.
        """
        start_time = time.perf_counter()
        try:
            result = await db.execute(text("SELECT 1"))
            scalar_result = result.scalar()
            if scalar_result != 1:
                return DatabaseHealth(
                    status="disconnected",
                    error="Database returned unexpected validation result.",
                )

            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return DatabaseHealth(
                status="connected",
                latency_ms=latency_ms,
            )
        except Exception as exc:
            logger.error("Database health check probe failed: %s", exc)
            return DatabaseHealth(
                status="disconnected",
                error=str(exc),
            )
