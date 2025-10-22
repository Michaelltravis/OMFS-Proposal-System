"""
Pydantic schemas for AI-powered intelligent search
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class IntelligentSearchRequest(BaseModel):
    """Request schema for intelligent search"""
    query: str
    section_type: Optional[str] = None
    include_library: bool = True
    include_drive: bool = True
    max_results: int = 10


class QueryInterpretation(BaseModel):
    """Interpreted query with keywords and intent"""
    keywords: List[str]
    intent: str
    section_suggestions: List[str]
    enhanced_query: str


class ContentChunk(BaseModel):
    """Content chunk with metadata"""
    chunk_index: int
    text: str
    start_position: int
    end_position: int
    length: int
    summary: Optional[str] = None


class LibraryResult(BaseModel):
    """Content Library search result"""
    id: int
    title: str
    section_type: Optional[str]
    content: str
    word_count: Optional[int]
    quality_rating: Optional[float]
    usage_count: int
    source: str = "content_library"


class DriveResult(BaseModel):
    """Google Drive search result with chunks"""
    id: str
    name: str
    mime_type: str
    web_view_link: Optional[str]
    modified_time: Optional[str]
    source: str = "google_drive"
    has_content: bool
    chunks: List[ContentChunk] = []


class IntelligentSearchResponse(BaseModel):
    """Response schema for intelligent search"""
    query: str
    interpretation: QueryInterpretation
    library_results: List[LibraryResult]
    drive_results: List[DriveResult]


class CleanupRequest(BaseModel):
    """Request schema for content cleanup"""
    content: str
    instructions: Optional[str] = None
