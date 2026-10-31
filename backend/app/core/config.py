"""Application configuration using Pydantic Settings."""

from typing import List, Union
from pydantic import computed_field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application runtime settings loaded from environment variables."""

    # Project Information
    APP_NAME: str = "Brightloop Subscription Management System"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api"

    # Server Bind Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Authentication & Security
    SECRET_KEY: str = "brightloop-subscriptiq-jwt-secret-key-production-change-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # PostgreSQL Database Parameters
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5434
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "brightloop_db"

    # Optional Override Database URLs
    DATABASE_URL: Union[str, None] = None
    ASYNC_DATABASE_URL: Union[str, None] = None

    # CORS Allowed Origins
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://localhost:5173"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:3000", "http://localhost:5173"]

    @computed_field  # type: ignore[prop-decorator]
    @property
    def sync_database_uri(self) -> str:
        """Construct synchronous PostgreSQL URI for Alembic and sync tools."""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def async_database_uri(self) -> str:
        """Construct asynchronous PostgreSQL URI for FastAPI SQLAlchemy 2.0."""
        if self.ASYNC_DATABASE_URL:
            return self.ASYNC_DATABASE_URL
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "backend/.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
