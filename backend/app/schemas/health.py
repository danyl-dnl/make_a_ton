"""Pydantic schemas for health check endpoints."""

from typing import Optional
from pydantic import BaseModel, Field


class DatabaseHealth(BaseModel):
    """Schema representing PostgreSQL connection status and latency."""

    status: str = Field(..., description="Database connection status: 'connected' or 'disconnected'")
    latency_ms: Optional[float] = Field(None, description="Ping query execution roundtrip latency in milliseconds")
    error: Optional[str] = Field(None, description="Error detail if connection check failed")


class HealthCheckResponse(BaseModel):
    """Schema for top-level application health check response."""

    status: str = Field(..., description="Overall service health: 'healthy' or 'unhealthy'")
    app_name: str = Field(..., description="Application name")
    version: str = Field(..., description="Application release version")
    environment: str = Field(..., description="Runtime environment (development, staging, production)")
    database: DatabaseHealth = Field(..., description="Database connectivity status and latency")
