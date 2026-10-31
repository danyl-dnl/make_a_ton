"""SQLAlchemy 2.0 Database Session and Engine Management."""

from collections.abc import AsyncGenerator
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Asynchronous SQLAlchemy 2.0 Engine for FastAPI
async_engine = create_async_engine(
    settings.async_database_uri,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# Asynchronous Session Factory
async_session_factory = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

# Synchronous Engine & Session Factory (for Alembic migrations and CLI scripts)
sync_engine = create_engine(
    settings.sync_database_uri,
    echo=False,
    pool_pre_ping=True,
)

sync_session_factory = sessionmaker(
    bind=sync_engine,
    autoflush=False,
    autocommit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for obtaining an asynchronous database session.

    Yields:
        AsyncSession: Managed SQLAlchemy asynchronous session.
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
