"""
Pytest configuration and fixtures for testing

This file sets up the test environment with:
- In-memory SQLite database for fast tests
- Test client for API endpoint testing
- Database fixtures for clean test isolation
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.main import app


@pytest.fixture(scope="function")
def test_db():
    """
    Create a fresh in-memory database for each test

    This ensures test isolation - each test gets a clean database
    that is destroyed after the test completes.

    Yields:
        Session: SQLAlchemy database session
    """
    # Create in-memory SQLite database
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False}
    )

    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Create session factory
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )

    # Create session
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        # Cleanup after test
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(test_db):
    """
    Create a test client with database override

    This fixture provides a FastAPI TestClient that uses the test
    database instead of the production database.

    Args:
        test_db: Test database session fixture

    Returns:
        TestClient: FastAPI test client for making requests

    Example:
        def test_create_content(client):
            response = client.post("/api/content/blocks", json={...})
            assert response.status_code == 201
    """
    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    # Override the database dependency
    app.dependency_overrides[get_db] = override_get_db

    # Create test client
    test_client = TestClient(app)

    yield test_client

    # Clean up dependency overrides
    app.dependency_overrides.clear()


@pytest.fixture
def sample_content_data():
    """
    Sample content block data for testing

    Returns:
        dict: Valid content block data
    """
    return {
        "title": "Test Content Block",
        "content": "<p>This is test content for a proposal section.</p>",
        "section_type": "technical_approach",
        "word_count": 10,
        "estimated_pages": 0.1,
        "tag_ids": [],
        "section_type_ids": []
    }


@pytest.fixture
def sample_tag_data():
    """
    Sample tag data for testing

    Returns:
        dict: Valid tag data
    """
    return {
        "name": "cloud-computing",
        "category": "technology",
        "color": "#3B82F6"
    }


@pytest.fixture
def sample_section_type_data():
    """
    Sample section type data for testing

    Returns:
        dict: Valid section type data
    """
    return {
        "name": "executive_summary",
        "display_name": "Executive Summary",
        "description": "High-level overview of the proposal",
        "color": "#10B981"
    }
