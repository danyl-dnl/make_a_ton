"""Unit and integration tests for application health check and root endpoints."""

from fastapi.testclient import TestClient


def test_health_check_endpoint(client: TestClient):
    """Verify that GET /api/health responds with 200 OK and connected database."""
    response = client.get("/api/health")
    assert response.status_code == 200, f"Expected 200 OK, got: {response.text}"
    data = response.json()

    assert data["status"] == "healthy"
    assert data["app_name"] == "Brightloop Subscription Management System"
    assert data["version"] == "0.1.0"
    assert data["environment"] == "development"

    # Verify database connectivity
    db_info = data["database"]
    assert db_info["status"] == "connected"
    assert db_info["latency_ms"] is not None
    assert db_info["latency_ms"] >= 0
    assert db_info["error"] is None


def test_root_endpoint(client: TestClient):
    """Verify that GET / returns API metadata and online status."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "version" in data
    assert data["health"] == "/api/health"
