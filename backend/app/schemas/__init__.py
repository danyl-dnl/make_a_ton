"""Pydantic schemas package."""
from app.schemas.health import DatabaseHealth, HealthCheckResponse

__all__ = ["DatabaseHealth", "HealthCheckResponse"]
