# API Guide

This guide provides examples for interacting with the Proposal System API.

## Base URL

```
http://localhost:8000
```

## API Documentation

Interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Content Repository API

### Content Blocks

#### List Content Blocks

```bash
GET /api/content/blocks?page=1&limit=20&section_type=technical_approach
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `section_type` (optional): Filter by section type
- `search` (optional): Search in title and content

**Example Response:**
```json
{
  "items": [
    {
      "id": 1,
      "title": "SCADA Modernization Approach",
      "content": "<p>Our approach to SCADA modernization...</p>",
      "section_type": "technical_approach",
      "usage_count": 5,
      "quality_rating": 4.5,
      "tags": [
        {"id": 1, "name": "SCADA", "category": "technology"}
      ],
      "created_at": "2025-10-20T12:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "pages": 3,
  "limit": 20
}
```

#### Create Content Block

```bash
POST /api/content/blocks
Content-Type: application/json

{
  "title": "Water Quality Monitoring Solution",
  "content": "<p>Our water quality monitoring solution includes...</p>",
  "section_type": "technical_approach",
  "estimated_pages": 3,
  "context_metadata": {
    "problem_context": "Aging monitoring equipment",
    "solution_approach": "Modern sensor network",
    "client_type": "municipal",
    "facility_type": "wastewater"
  },
  "tag_ids": [1, 2, 3]
}
```

#### Update Content Block

```bash
PUT /api/content/blocks/1
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "<p>Updated content...</p>",
  "quality_rating": 5.0
}
```

#### Delete Content Block

```bash
DELETE /api/content/blocks/1
```

### Tags

#### List All Tags

```bash
GET /api/content/tags
```

#### Create Tag

```bash
POST /api/content/tags
Content-Type: application/json

{
  "name": "SCADA",
  "category": "technology",
  "color": "#3b82f6"
}
```

### Versions

#### Get Content Block Versions

```bash
GET /api/content/blocks/1/versions
```

#### Revert to Version

```bash
POST /api/content/blocks/1/versions/3/revert
```

## Proposal Builder API

### Proposals

#### List Proposals

```bash
GET /api/proposals?page=1&limit=20&archived=false
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `archived` (optional): Filter by archive status
- `status` (optional): Filter by status (draft, in_progress, review, completed, archived)

#### Create Proposal

```bash
POST /api/proposals
Content-Type: application/json

{
  "name": "City of Phoenix Wastewater Treatment RFP",
  "client_name": "City of Phoenix",
  "rfp_number": "RFP-2025-001",
  "rfp_deadline": "2025-12-01T17:00:00Z",
  "page_limit": 50,
  "rfp_context": "Modernization of existing treatment facility"
}
```

#### Update Proposal

```bash
PUT /api/proposals/1
Content-Type: application/json

{
  "status": "in_progress",
  "notes": "Updated with client feedback"
}
```

#### Archive Proposal

```bash
POST /api/proposals/1/archive
```

### Proposal Sections

#### Create Section

```bash
POST /api/proposals/1/sections
Content-Type: application/json

{
  "title": "Technical Approach",
  "section_type": "technical_approach",
  "order": 3,
  "page_target_min": 15,
  "page_target_max": 20,
  "notes": "Focus on SCADA modernization"
}
```

#### Add Content to Section

```bash
POST /api/proposals/1/sections/3/content
Content-Type: application/json

{
  "source_block_id": 5,
  "content": "<p>Content pulled from repository block #5...</p>",
  "title": "SCADA Modernization",
  "order": 1,
  "is_custom": false,
  "customization_notes": "Adapted for Phoenix project specifics"
}
```

### RFP Requirements

#### Create Requirement

```bash
POST /api/proposals/1/requirements
Content-Type: application/json

{
  "requirement_number": "3.2.1",
  "requirement_text": "Describe your approach to SCADA cybersecurity",
  "section": "Technical Approach",
  "is_mandatory": true,
  "priority": "must"
}
```

#### Update Requirement Status

```bash
PUT /api/proposals/1/requirements/1
Content-Type: application/json

{
  "status": "fully_addressed",
  "coverage_notes": "Addressed in Technical Approach section",
  "addressed_in_section_id": 3
}
```

## Example Workflows

### Workflow 1: Create Content Block from Existing Document

1. Import Word document (Phase 2 feature)
2. Review auto-created content blocks
3. Add tags and metadata
4. Set quality rating

### Workflow 2: Build a Proposal

1. Create proposal project:
```bash
POST /api/proposals
{
  "name": "City of Austin RFP",
  "client_name": "City of Austin",
  "rfp_deadline": "2025-11-15T17:00:00Z"
}
```

2. Create sections:
```bash
POST /api/proposals/1/sections
{"title": "Executive Summary", "order": 1}

POST /api/proposals/1/sections
{"title": "Technical Approach", "order": 2}
```

3. Add content from repository:
```bash
# Search for relevant content blocks
GET /api/content/blocks?section_type=technical_approach&search=SCADA

# Add selected block to section
POST /api/proposals/1/sections/2/content
{
  "source_block_id": 5,
  "content": "...",
  "order": 1
}
```

4. Track requirements:
```bash
POST /api/proposals/1/requirements
{
  "requirement_text": "Describe SCADA approach",
  "is_mandatory": true
}
```

### Workflow 3: Version Control

1. Edit content block
2. System auto-creates version snapshot
3. View version history:
```bash
GET /api/content/blocks/1/versions
```

4. Revert if needed:
```bash
POST /api/content/blocks/1/versions/2/revert
```

## Status Codes

- `200 OK`: Success
- `201 Created`: Resource created
- `204 No Content`: Success with no response body (delete operations)
- `400 Bad Request`: Invalid input
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

## Error Response Format

```json
{
  "detail": "Content block not found"
}
```

## Rate Limiting

Currently no rate limiting is implemented. This may be added in production.

## Authentication

Currently no authentication is required. JWT authentication will be added in a future phase.
