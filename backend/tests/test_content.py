"""
Content block API endpoint tests

Tests CRUD operations for content blocks, tags, and section types
"""

import pytest


class TestContentBlockCRUD:
    """Test content block create, read, update, delete operations"""

    def test_create_content_block(self, client, sample_content_data):
        """Test creating a new content block"""
        response = client.post("/api/content/blocks", json=sample_content_data)

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == sample_content_data["title"]
        assert data["content"] == sample_content_data["content"]
        assert data["section_type"] == sample_content_data["section_type"]
        assert data["is_deleted"] is False
        assert "id" in data
        assert "created_at" in data

    def test_create_content_block_missing_required_fields(self, client):
        """Test that creating content block without required fields fails"""
        response = client.post("/api/content/blocks", json={
            "title": "Test"
            # Missing content and section_type
        })

        assert response.status_code == 422  # Validation error

    def test_get_content_blocks(self, client, sample_content_data):
        """Test retrieving list of content blocks"""
        # Create a content block first
        client.post("/api/content/blocks", json=sample_content_data)

        # Get all content blocks
        response = client.get("/api/content/blocks")

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data
        assert len(data["items"]) == 1

    def test_get_content_block_by_id(self, client, sample_content_data):
        """Test retrieving a specific content block by ID"""
        # Create a content block
        create_response = client.post("/api/content/blocks", json=sample_content_data)
        block_id = create_response.json()["id"]

        # Get the content block by ID
        response = client.get(f"/api/content/blocks/{block_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == block_id
        assert data["title"] == sample_content_data["title"]

    def test_get_nonexistent_content_block(self, client):
        """Test that getting a non-existent content block returns 404"""
        response = client.get("/api/content/blocks/99999")
        assert response.status_code == 404

    def test_update_content_block(self, client, sample_content_data):
        """Test updating an existing content block"""
        # Create a content block
        create_response = client.post("/api/content/blocks", json=sample_content_data)
        block_id = create_response.json()["id"]

        # Update the content block
        update_data = {
            "title": "Updated Title",
            "content": "<p>Updated content</p>"
        }
        response = client.put(f"/api/content/blocks/{block_id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["content"] == "<p>Updated content</p>"

    def test_delete_content_block(self, client, sample_content_data):
        """Test soft deleting a content block"""
        # Create a content block
        create_response = client.post("/api/content/blocks", json=sample_content_data)
        block_id = create_response.json()["id"]

        # Delete the content block
        response = client.delete(f"/api/content/blocks/{block_id}")
        assert response.status_code == 204

        # Verify it's soft deleted (not in list)
        response = client.get("/api/content/blocks")
        data = response.json()
        assert len(data["items"]) == 0

        # But should return 404 when accessed directly
        response = client.get(f"/api/content/blocks/{block_id}")
        assert response.status_code == 404


class TestContentBlockFiltering:
    """Test content block filtering and search"""

    def test_search_by_query(self, client):
        """Test searching content blocks by text query"""
        # Create content blocks with different titles
        client.post("/api/content/blocks", json={
            "title": "Cloud Infrastructure Design",
            "content": "<p>Content about cloud</p>",
            "section_type": "technical_approach"
        })
        client.post("/api/content/blocks", json={
            "title": "Database Architecture",
            "content": "<p>Content about databases</p>",
            "section_type": "technical_approach"
        })

        # Search for "cloud"
        response = client.get("/api/content/blocks?query=cloud")
        data = response.json()
        assert len(data["items"]) == 1
        assert "Cloud" in data["items"][0]["title"]

    def test_pagination(self, client, sample_content_data):
        """Test pagination of content blocks"""
        # Create multiple content blocks
        for i in range(5):
            data = sample_content_data.copy()
            data["title"] = f"Content Block {i}"
            client.post("/api/content/blocks", json=data)

        # Get first page with limit of 2
        response = client.get("/api/content/blocks?page=1&limit=2")
        data = response.json()

        assert data["page"] == 1
        assert data["limit"] == 2
        assert len(data["items"]) == 2
        assert data["total"] == 5
        assert data["pages"] == 3


class TestTags:
    """Test tag creation and management"""

    def test_create_tag(self, client, sample_tag_data):
        """Test creating a new tag"""
        response = client.post("/api/content/tags", json=sample_tag_data)

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == sample_tag_data["name"]
        assert data["category"] == sample_tag_data["category"]
        assert data["color"] == sample_tag_data["color"]

    def test_create_duplicate_tag_fails(self, client, sample_tag_data):
        """Test that creating duplicate tag name fails"""
        # Create first tag
        client.post("/api/content/tags", json=sample_tag_data)

        # Try to create duplicate
        response = client.post("/api/content/tags", json=sample_tag_data)
        assert response.status_code == 400

    def test_get_tags(self, client, sample_tag_data):
        """Test retrieving all tags"""
        # Create a tag
        client.post("/api/content/tags", json=sample_tag_data)

        # Get all tags
        response = client.get("/api/content/tags")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == sample_tag_data["name"]


class TestSectionTypes:
    """Test section type creation and management"""

    def test_create_section_type(self, client, sample_section_type_data):
        """Test creating a new section type"""
        response = client.post("/api/content/section-types", json=sample_section_type_data)

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == sample_section_type_data["name"]
        assert data["display_name"] == sample_section_type_data["display_name"]

    def test_get_section_types(self, client, sample_section_type_data):
        """Test retrieving all section types"""
        # Create a section type
        client.post("/api/content/section-types", json=sample_section_type_data)

        # Get all section types
        response = client.get("/api/content/section-types")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1  # May have seeded data
