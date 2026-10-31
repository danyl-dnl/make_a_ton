"""Pytest test configuration and fixtures."""

import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Provide synchronous TestClient for testing the FastAPI application with lifespan."""
    with TestClient(app=app, base_url="http://testserver") as test_client:
        yield test_client
