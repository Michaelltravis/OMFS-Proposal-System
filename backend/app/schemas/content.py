"""
Pydantic schemas for Content Repository
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# Tag Schemas
class TagBase(BaseModel):
    name: str
    category: Optional[str] = None
    color: Optional[str] = None


class TagCreate(TagBase):
    pass


class TagResponse(TagBase):
    id: int
    usage_count: int
    created_at: datetime

    class Config:
        from_attributes = True


# Content Block Schemas
class ContentBlockBase(BaseModel):
    title: str
    content: str
    section_type: str
    estimated_pages: Optional[float] = None
    word_count: Optional[int] = None
    parent_id: Optional[int] = None
    path: Optional[str] = None
    context_metadata: Optional[Dict[str, Any]] = None
    quality_rating: Optional[float] = Field(None, ge=0, le=5)


class ContentBlockCreate(ContentBlockBase):
    tag_ids: Optional[List[int]] = []


class ContentBlockUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    section_type: Optional[str] = None
    estimated_pages: Optional[float] = None
    word_count: Optional[int] = None
    context_metadata: Optional[Dict[str, Any]] = None
    quality_rating: Optional[float] = Field(None, ge=0, le=5)
    tag_ids: Optional[List[int]] = None


class CustomizationHistoryEntry(BaseModel):
    proposal: str
    date: str
    changes: str
    level: str  # 'light', 'moderate', 'heavy'


class ContentBlockResponse(ContentBlockBase):
    id: int
    document_source_id: Optional[int] = None
    usage_count: int
    customization_history: List[Dict[str, Any]] = []
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    is_deleted: bool
    tags: List[TagResponse] = []

    class Config:
        from_attributes = True


# Content Version Schemas
class ContentVersionResponse(BaseModel):
    id: int
    content_block_id: int
    version_number: int
    title: str
    content: str
    section_type: Optional[str] = None
    context_metadata: Optional[Dict[str, Any]] = None
    tags_snapshot: Optional[List[Dict[str, Any]]] = None
    change_description: Optional[str] = None
    created_at: datetime
    created_by: Optional[str] = None

    class Config:
        from_attributes = True


# Search Schemas
class SearchParams(BaseModel):
    query: Optional[str] = None
    section_type: Optional[str] = None
    tags: Optional[List[str]] = []
    client_type: Optional[str] = None
    facility_type: Optional[str] = None
    min_rating: Optional[float] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)


# AI Generation Schemas
class AIGenerateRequest(BaseModel):
    action: str = Field(..., description="One of: draft, improve, expand")
    section_type: str
    prompt: str = Field(..., description="User instructions for content generation")
    existing_content: Optional[str] = Field(None, description="Current content (for improve/expand)")


class AIGenerateResponse(BaseModel):
    content: str = Field(..., description="Generated HTML content")
    action: str
    section_type: str
