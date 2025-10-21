"""
Content Repository API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.content import ContentBlock, Tag, SectionType, ContentVersion
from app.schemas.content import (
    ContentBlockCreate,
    ContentBlockUpdate,
    ContentBlockResponse,
    TagCreate,
    TagResponse,
    SectionTypeCreate,
    SectionTypeResponse,
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
    query: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db),
):
    """Get all content blocks with pagination and filtering"""
    db_query = db.query(ContentBlock).filter(ContentBlock.is_deleted == False)

    # Apply filters
    if section_type:
        db_query = db_query.filter(ContentBlock.section_type == section_type)

    if query:
        db_query = db_query.filter(
            or_(
                ContentBlock.title.ilike(f"%{query}%"),
                ContentBlock.content.ilike(f"%{query}%"),
            )
        )

    # Filter by tags (OR logic - blocks with any of the specified tags)
    if tags and len(tags) > 0:
        db_query = db_query.join(ContentBlock.tags).filter(Tag.name.in_(tags))

    # Get total count
    total = db_query.count()

    # Apply pagination
    offset = (page - 1) * limit
    items = db_query.order_by(ContentBlock.updated_at.desc()).offset(offset).limit(limit).all()

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
    # Extract tag IDs and section type IDs
    tag_ids = block_data.tag_ids if hasattr(block_data, 'tag_ids') else []
    section_type_ids = block_data.section_type_ids if hasattr(block_data, 'section_type_ids') else []
    block_dict = block_data.model_dump(exclude={'tag_ids', 'section_type_ids'})

    # Create content block
    content_block = ContentBlock(**block_dict)

    # Add tags if provided
    if tag_ids:
        tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
        content_block.tags = tags

        # Increment usage_count for each tag
        for tag in tags:
            tag.usage_count = (tag.usage_count or 0) + 1
            db.add(tag)  # Explicitly mark tag as modified

    # Add section types if provided
    if section_type_ids:
        section_types = db.query(SectionType).filter(SectionType.id.in_(section_type_ids)).all()
        content_block.section_types = section_types

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
    version = ContentVersion(
        content_block_id=block.id,
        version_number=len(block.versions) + 1,
        title=block.title,
        content=block.content,
        context_metadata=block.context_metadata,
        change_description="Auto-saved version before update",
    )
    db.add(version)

    # Update fields
    update_data = block_data.model_dump(exclude_unset=True, exclude={'tag_ids', 'section_type_ids'})
    for field, value in update_data.items():
        setattr(block, field, value)

    # Update tags if provided
    if hasattr(block_data, 'tag_ids') and block_data.tag_ids is not None:
        # Get old and new tag IDs
        old_tag_ids = set(tag.id for tag in block.tags)
        new_tag_ids = set(block_data.tag_ids)

        # Find tags being removed and decrement their usage_count
        removed_tag_ids = old_tag_ids - new_tag_ids
        if removed_tag_ids:
            removed_tags = db.query(Tag).filter(Tag.id.in_(removed_tag_ids)).all()
            for tag in removed_tags:
                tag.usage_count = max(0, (tag.usage_count or 0) - 1)
                db.add(tag)  # Explicitly mark tag as modified

        # Find tags being added and increment their usage_count
        added_tag_ids = new_tag_ids - old_tag_ids
        if added_tag_ids:
            added_tags = db.query(Tag).filter(Tag.id.in_(added_tag_ids)).all()
            for tag in added_tags:
                tag.usage_count = (tag.usage_count or 0) + 1
                db.add(tag)  # Explicitly mark tag as modified

        # Update the block's tags
        tags = db.query(Tag).filter(Tag.id.in_(block_data.tag_ids)).all()
        block.tags = tags

    # Update section types if provided
    if hasattr(block_data, 'section_type_ids') and block_data.section_type_ids is not None:
        section_types = db.query(SectionType).filter(SectionType.id.in_(block_data.section_type_ids)).all()
        block.section_types = section_types

    db.commit()
    db.refresh(block)

    return block


@router.delete("/blocks/{block_id}", status_code=204)
def delete_content_block(block_id: int, db: Session = Depends(get_db)):
    """Soft delete a content block"""
    block = db.query(ContentBlock).filter(ContentBlock.id == block_id).first()

    if not block:
        raise HTTPException(status_code=404, detail="Content block not found")

    # Decrement usage_count for all associated tags
    for tag in block.tags:
        tag.usage_count = max(0, (tag.usage_count or 0) - 1)
        db.add(tag)  # Explicitly mark tag as modified

    block.is_deleted = True
    db.commit()

    return None


# Tags
@router.get("/tags", response_model=List[TagResponse])
def get_tags(db: Session = Depends(get_db)):
    """Get all tags with calculated usage counts"""
    from app.models.content import content_block_tags

    # Get all tags with their actual usage count from the junction table
    tags = db.query(Tag).all()

    # Calculate usage count for each tag (excluding deleted blocks)
    for tag in tags:
        count = db.query(content_block_tags).join(
            ContentBlock,
            content_block_tags.c.content_block_id == ContentBlock.id
        ).filter(
            content_block_tags.c.tag_id == tag.id,
            ContentBlock.is_deleted == False
        ).count()
        tag.usage_count = count

    # Sort by usage count descending
    tags.sort(key=lambda t: t.usage_count or 0, reverse=True)

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


# Section Types
@router.get("/section-types", response_model=List[SectionTypeResponse])
def get_section_types(db: Session = Depends(get_db)):
    """Get all section types"""
    section_types = db.query(SectionType).order_by(SectionType.usage_count.desc()).all()
    return section_types


@router.post("/section-types", response_model=SectionTypeResponse, status_code=201)
def create_section_type(section_type_data: SectionTypeCreate, db: Session = Depends(get_db)):
    """Create a new section type"""
    # Check if section type already exists
    existing = db.query(SectionType).filter(SectionType.name == section_type_data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Section type already exists")

    section_type = SectionType(**section_type_data.model_dump())
    db.add(section_type)
    db.commit()
    db.refresh(section_type)

    return section_type


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
