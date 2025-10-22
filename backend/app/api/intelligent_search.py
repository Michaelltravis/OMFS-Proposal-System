"""
AI-Powered Intelligent Search API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.intelligent_search import (
    IntelligentSearchRequest,
    IntelligentSearchResponse,
    CleanupRequest
)
from app.services.intelligent_search_service import intelligent_search_service
from app.services.claude_service import claude_service

router = APIRouter()


@router.post("/search", response_model=IntelligentSearchResponse)
async def intelligent_search(
    request: IntelligentSearchRequest,
    db: Session = Depends(get_db)
):
    """
    Perform AI-powered intelligent search across Content Library and Google Drive

    Args:
        request: Search request with query and filters
        db: Database session

    Returns:
        Combined search results with AI interpretation and summaries
    """
    try:
        results = await intelligent_search_service.intelligent_search(
            db=db,
            query=request.query,
            section_type=request.section_type,
            include_library=request.include_library,
            include_drive=request.include_drive,
            max_results=request.max_results
        )
        return results
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Search error: {str(e)}"
        )


@router.post("/cleanup")
async def cleanup_content(request: CleanupRequest):
    """
    Clean up and polish assembled content using Claude AI

    Args:
        request: Content to clean up with optional instructions

    Returns:
        Cleaned and polished content
    """
    try:
        # Use Claude to clean up the content
        cleaned_content = await claude_service.generate_content(
            action="improve",
            section_type="general",
            prompt=request.instructions or "Polish and clean up this content for a professional proposal. Improve flow, remove redundancies, and ensure consistency.",
            existing_content=request.content
        )

        return {
            "original": request.content,
            "cleaned": cleaned_content
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Cleanup error: {str(e)}"
        )
