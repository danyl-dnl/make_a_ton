"""Pytest test configuration and fixtures."""

import os
import sys
import uuid
from collections.abc import AsyncGenerator
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

# Ensure backend root is on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.db.session import get_db, sync_session_factory
from app.main import app
from app.models.user import User

# Create test async engine with NullPool to prevent event-loop-closed errors across async tests
test_async_engine = create_async_engine(
    settings.async_database_uri,
    poolclass=NullPool,
    echo=False,
)

test_session_factory = async_sessionmaker(
    bind=test_async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency override providing an unpooled async session for tests."""
    async with test_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# Override app get_db dependency for tests
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Provide synchronous TestClient for testing the FastAPI application with lifespan."""
    with TestClient(app=app, base_url="http://testserver") as test_client:
        yield test_client


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide an isolated asynchronous SQLAlchemy session for database unit tests."""
    async with test_session_factory() as session:
        try:
            yield session
        finally:
            await session.rollback()


def _create_user_token(role: str) -> str:
    """Synchronously create an isolated test user and return a signed JWT access token."""
    user_id = uuid.uuid4()
    email = f"test_{role}_{user_id.hex[:8]}@brightloop-test.io"
    with sync_session_factory() as session:
        user = User(
            id=user_id,
            email=email,
            hashed_password=hash_password("TestAuthSecure123!"),
            full_name=f"Test {role.capitalize()} User",
            role=role,
            is_active=True,
        )
        session.add(user)
        session.commit()

    return create_access_token({
        "sub": str(user_id),
        "email": email,
        "role": role,
    })


@pytest.fixture
def admin_token() -> str:
    """Provide a valid JWT bearer token with 'admin' role."""
    return _create_user_token("admin")


@pytest.fixture
def staff_token() -> str:
    """Provide a valid JWT bearer token with 'staff' role."""
    return _create_user_token("staff")


@pytest.fixture
def customer_token() -> str:
    """Provide a valid JWT bearer token with 'customer' role."""
    return _create_user_token("customer")
