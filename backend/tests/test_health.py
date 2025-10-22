"""
Health check endpoint tests

Tests basic application health and connectivity
"""

import pytest


def test_root_endpoint(client):
    """Test the root endpoint returns application info"""
    response = client.get("/")

    assert response.status_code == 200
    data = response.json()
    assert "app" in data
    assert "version" in data
    assert "status" in data
    assert data["status"] == "running"


def test_health_check_endpoint(client):
    """Test the health check endpoint"""
    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "database" in data
    assert "vector_store" in data


def test_api_documentation_available(client):
    """Test that API documentation is accessible"""
    # FastAPI auto-generates /docs (Swagger UI)
    response = client.get("/docs")
    assert response.status_code == 200

    # OpenAPI JSON schema should be available
    response = client.get("/openapi.json")
    assert response.status_code == 200
