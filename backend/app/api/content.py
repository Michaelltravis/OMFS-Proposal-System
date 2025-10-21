"""
Content Repository API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.content import ContentBlock, Tag, ContentVersion
from app.schemas.content import (
    ContentBlockCreate,
    ContentBlockUpdate,
    ContentBlockResponse,
    TagCreate,
    TagResponse,
    ContentVersionCreate,
    ContentVersionResponse,
    SearchParams,
    AIGenerateRequest,
    AIGenerateResponse,
)
from app.schemas.common import PaginatedResponse
from sqlalchemy import or_, and_
import math

router = APIRouter()


# Content Blocks CRUD
@router.get("/blocks", response_model=PaginatedResponse[ContentBlockResponse])
def get_content_blocks(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    section_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get all content blocks with pagination and filtering"""
    query = db.query(ContentBlock).filter(ContentBlock.is_deleted == False)

    # Apply filters
    if section_type:
        query = query.filter(ContentBlock.section_type == section_type)

    if search:
        query = query.filter(
            or_(
                ContentBlock.title.ilike(f"%{search}%"),
                ContentBlock.content.ilike(f"%{search}%"),
            )
        )

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * limit
    items = query.order_by(ContentBlock.updated_at.desc()).offset(offset).limit(limit).all()

    pages = math.ceil(total / limit)

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        pages=pages,
        limit=limit,
    )


@router.get("/blocks/{block_id}", response_model=ContentBlockResponse)
def get_content_block(block_id: int, db: Session = Depends(get_db)):
    """Get a single content block by ID"""
    block = db.query(ContentBlock).filter(
        ContentBlock.id == block_id,
        ContentBlock.is_deleted == False
    ).first()

    if not block:
        raise HTTPException(status_code=404, detail="Content block not found")

    return block


@router.post("/blocks", response_model=ContentBlockResponse, status_code=201)
def create_content_block(
    block_data: ContentBlockCreate,
    db: Session = Depends(get_db),
):
    """Create a new content block"""
    # Extract tag IDs
    tag_ids = block_data.tag_ids if hasattr(block_data, 'tag_ids') else []
    block_dict = block_data.model_dump(exclude={'tag_ids'})

    # Create content block
    content_block = ContentBlock(**block_dict)

    # Add tags if provided
    if tag_ids:
        tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
        content_block.tags = tags

    db.add(content_block)
    db.commit()
    db.refresh(content_block)

    return content_block


@router.put("/blocks/{block_id}", response_model=ContentBlockResponse)
def update_content_block(
    block_id: int,
    block_data: ContentBlockUpdate,
    db: Session = Depends(get_db),
):
    """Update an existing content block"""
    block = db.query(ContentBlock).filter(
        ContentBlock.id == block_id,
        ContentBlock.is_deleted == False
    ).first()

    if not block:
        raise HTTPException(status_code=404, detail="Content block not found")

    # Create version snapshot before updating
    change_desc = block_data.change_description if hasattr(block_data, 'change_description') and block_data.change_description else "Auto-saved version before update"
    created_by = block_data.updated_by if hasattr(block_data, 'updated_by') and block_data.updated_by else None

    version = ContentVersion(
        content_block_id=block.id,
        version_number=len(block.versions) + 1,
        title=block.title,
        content=block.content,
        context_metadata=block.context_metadata,
        change_description=change_desc,
        created_by=created_by,
    )
    db.add(version)

    # Update fields (exclude version-specific fields)
    update_data = block_data.model_dump(exclude_unset=True, exclude={'tag_ids', 'change_description'})
    for field, value in update_data.items():
        setattr(block, field, value)

    # Update tags if provided
    if hasattr(block_data, 'tag_ids') and block_data.tag_ids is not None:
        tags = db.query(Tag).filter(Tag.id.in_(block_data.tag_ids)).all()
        block.tags = tags

    db.commit()
    db.refresh(block)

    return block


@router.delete("/blocks/{block_id}", status_code=204)
def delete_content_block(block_id: int, db: Session = Depends(get_db)):
    """Soft delete a content block"""
    block = db.query(ContentBlock).filter(ContentBlock.id == block_id).first()

    if not block:
        raise HTTPException(status_code=404, detail="Content block not found")

    block.is_deleted = True
    db.commit()

    return None


# Tags
@router.get("/tags", response_model=List[TagResponse])
def get_tags(db: Session = Depends(get_db)):
    """Get all tags"""
    tags = db.query(Tag).order_by(Tag.usage_count.desc()).all()
    return tags


@router.post("/tags", response_model=TagResponse, status_code=201)
def create_tag(tag_data: TagCreate, db: Session = Depends(get_db)):
    """Create a new tag"""
    # Check if tag already exists
    existing = db.query(Tag).filter(Tag.name == tag_data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tag already exists")

    tag = Tag(**tag_data.model_dump())
    db.add(tag)
    db.commit()
    db.refresh(tag)

    return tag


# Versions
@router.get("/blocks/{block_id}/versions", response_model=List[ContentVersionResponse])
def get_content_versions(block_id: int, db: Session = Depends(get_db)):
    """Get all versions of a content block"""
    block = db.query(ContentBlock).filter(ContentBlock.id == block_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Content block not found")

    versions = db.query(ContentVersion).filter(
        ContentVersion.content_block_id == block_id
    ).order_by(ContentVersion.version_number.desc()).all()

    return versions


@router.post("/blocks/{block_id}/versions", response_model=ContentVersionResponse, status_code=201)
def create_manual_version(
    block_id: int,
    version_data: ContentVersionCreate,
    db: Session = Depends(get_db),
):
    """Create a manual version/checkpoint of a content block"""
    block = db.query(ContentBlock).filter(
        ContentBlock.id == block_id,
        ContentBlock.is_deleted == False
    ).first()
    if not block:
        raise HTTPException(status_code=404, detail="Content block not found")

    # Create version snapshot
    version = ContentVersion(
        content_block_id=block.id,
        version_number=len(block.versions) + 1,
        title=block.title,
        content=block.content,
        context_metadata=block.context_metadata,
        change_description=version_data.change_description or "Manual checkpoint",
        created_by=version_data.created_by,
    )
    db.add(version)
    db.commit()
    db.refresh(version)

    return version


@router.post("/blocks/{block_id}/versions/{version_id}/revert", response_model=ContentBlockResponse)
def revert_to_version(
    block_id: int,
    version_id: int,
    db: Session = Depends(get_db),
):
    """Revert a content block to a specific version"""
    block = db.query(ContentBlock).filter(ContentBlock.id == block_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Content block not found")

    version = db.query(ContentVersion).filter(
        ContentVersion.id == version_id,
        ContentVersion.content_block_id == block_id,
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    # Create a new version with current state before reverting
    new_version = ContentVersion(
        content_block_id=block.id,
        version_number=len(block.versions) + 1,
        title=block.title,
        content=block.content,
        context_metadata=block.context_metadata,
        change_description=f"Auto-saved before reverting to version {version.version_number}",
    )
    db.add(new_version)

    # Revert to selected version
    block.title = version.title
    block.content = version.content
    block.context_metadata = version.context_metadata

    db.commit()
    db.refresh(block)

    return block


# AI Content Generation
@router.post("/ai/generate", response_model=AIGenerateResponse)
async def generate_content_with_ai(
    request: AIGenerateRequest,
):
    """Generate or improve content using Claude AI"""
    from app.services.claude_service import claude_service

    # Validate action
    if request.action not in ["draft", "improve", "expand"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid action. Must be 'draft', 'improve', or 'expand'"
        )

    # Validate that existing_content is provided for improve/expand
    if request.action in ["improve", "expand"] and not request.existing_content:
        raise HTTPException(
            status_code=400,
            detail=f"existing_content is required for action '{request.action}'"
        )

    try:
        # Generate content using Claude
        generated_content = await claude_service.generate_content(
            action=request.action,
            section_type=request.section_type,
            prompt=request.prompt,
            existing_content=request.existing_content
        )

        return AIGenerateResponse(
            content=generated_content,
            action=request.action,
            section_type=request.section_type
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI generation failed: {str(e)}"
        )
