"""
AI-Powered Intelligent Search Service
Combines Content Library and Google Drive search with Claude AI
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from anthropic import Anthropic

from app.core.config import settings
from app.core.logging_config import get_logger
from app.services.google_drive_service import GoogleDriveService
from app.models.content import ContentBlock
from app.schemas.google_drive import GoogleDriveFile

logger = get_logger(__name__)


class IntelligentSearchService:
    """Service for AI-powered intelligent content search"""

    def __init__(self):
        self._client = None

    @property
    def client(self):
        """Lazy initialization of Anthropic client"""
        if self._client is None:
            if not settings.ANTHROPIC_API_KEY:
                raise ValueError("ANTHROPIC_API_KEY not configured")
            self._client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        return self._client

    async def interpret_query(
        self,
        query: str,
        section_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Use Claude to interpret and enhance the search query

        Args:
            query: User's search query
            section_type: Optional section type for context

        Returns:
            Interpreted query with keywords and search strategy
        """
        # Check if API key is configured
        if not settings.ANTHROPIC_API_KEY:
            logger.warning("ANTHROPIC_API_KEY not configured, using basic search")
            return {
                "keywords": query.split(),
                "intent": query,
                "section_suggestions": [],
                "enhanced_query": query
            }

        system_message = """You are an expert at understanding proposal content search queries.
Your job is to interpret user queries and extract:
1. Key search terms and keywords
2. Related synonyms and concepts
3. The user's intent and what type of content they're looking for

Respond in JSON format with these fields:
{
    "keywords": ["list", "of", "keywords"],
    "intent": "brief description of what user is looking for",
    "section_suggestions": ["suggested section types"],
    "enhanced_query": "improved search query"
}"""

        context = f"\nSection type context: {section_type}" if section_type else ""
        user_message = f"User query: {query}{context}\n\nInterpret this search query and provide search guidance."

        try:
            response = self.client.messages.create(
                model=settings.CLAUDE_MODEL,
                max_tokens=500,
                system=system_message,
                messages=[{"role": "user", "content": user_message}]
            )

            # Parse JSON response
            import json
            interpretation = json.loads(response.content[0].text)
            return interpretation

        except Exception as e:
            logger.error(f"Error interpreting query: {e}")
            # Fallback to basic query
            return {
                "keywords": query.split(),
                "intent": query,
                "section_suggestions": [],
                "enhanced_query": query
            }

    async def search_content_library(
        self,
        db: Session,
        keywords: List[str],
        section_type: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search content library with interpreted keywords

        Args:
            db: Database session
            keywords: List of search keywords
            section_type: Optional section type filter
            limit: Maximum results

        Returns:
            List of matching content blocks with metadata
        """
        query = db.query(ContentBlock).filter(ContentBlock.is_deleted == False)

        # Build search filter
        if keywords:
            # Search in title and content
            search_term = " ".join(keywords)
            query = query.filter(
                (ContentBlock.title.ilike(f"%{search_term}%")) |
                (ContentBlock.content.ilike(f"%{search_term}%"))
            )

        if section_type:
            query = query.filter(ContentBlock.section_type == section_type)

        # Order by usage count and quality
        query = query.order_by(
            ContentBlock.quality_rating.desc(),
            ContentBlock.usage_count.desc()
        ).limit(limit)

        results = query.all()

        # Format results
        formatted_results = []
        for block in results:
            formatted_results.append({
                "id": block.id,
                "title": block.title,
                "section_type": block.section_type,
                "content": block.content,
                "word_count": block.word_count,
                "quality_rating": block.quality_rating,
                "usage_count": block.usage_count,
                "source": "content_library"
            })

        return formatted_results

    async def search_google_drive(
        self,
        db: Session,
        query: str,
        section_type: Optional[str] = None,
        max_results: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search Google Drive and extract content chunks

        Args:
            db: Database session
            query: Search query
            section_type: Optional section type
            max_results: Maximum files to retrieve

        Returns:
            List of files with extracted content chunks
        """
        try:
            # Search Google Drive
            files = GoogleDriveService.search_files(
                db, query, section_type, max_results
            )

            results = []
            for file in files:
                file_data = {
                    "id": file.id,
                    "name": file.name,
                    "mime_type": file.mime_type,
                    "web_view_link": file.web_view_link,
                    "modified_time": file.modified_time.isoformat() if file.modified_time else None,
                    "source": "google_drive",
                    "chunks": []
                }

                # Try to extract content and chunk it
                try:
                    content = GoogleDriveService.get_file_content(db, file.id)
                    if content:
                        # Chunk the content
                        chunks = GoogleDriveService.chunk_content(content, chunk_size=1000, overlap=200)
                        file_data["chunks"] = chunks[:5]  # Limit to first 5 chunks
                        file_data["has_content"] = True
                    else:
                        file_data["has_content"] = False
                except Exception as e:
                    logger.warning(f"Could not extract content from file {file.id}: {e}")
                    file_data["has_content"] = False

                results.append(file_data)

            return results

        except Exception as e:
            logger.error(f"Error searching Google Drive: {e}")
            return []

    async def summarize_chunk(self, chunk_text: str, context: str = "") -> str:
        """
        Use Claude to summarize a content chunk

        Args:
            chunk_text: Text to summarize
            context: Additional context (file name, section type, etc.)

        Returns:
            Brief summary of the chunk
        """
        system_message = """You are an expert at summarizing proposal content.
Create a brief, informative 1-2 sentence summary that highlights the key points and relevance."""

        user_message = f"""Context: {context}

Content:
{chunk_text[:2000]}

Provide a brief summary."""

        try:
            response = self.client.messages.create(
                model=settings.CLAUDE_MODEL,
                max_tokens=150,
                system=system_message,
                messages=[{"role": "user", "content": user_message}]
            )

            return response.content[0].text.strip()

        except Exception as e:
            logger.error(f"Error summarizing chunk: {e}")
            # Return first 200 chars as fallback
            return chunk_text[:200] + "..."

    async def intelligent_search(
        self,
        db: Session,
        query: str,
        section_type: Optional[str] = None,
        include_library: bool = True,
        include_drive: bool = True,
        max_results: int = 10
    ) -> Dict[str, Any]:
        """
        Perform intelligent search across both Content Library and Google Drive

        Args:
            db: Database session
            query: User's search query
            section_type: Optional section type filter
            include_library: Include Content Library results
            include_drive: Include Google Drive results
            max_results: Maximum results per source

        Returns:
            Combined search results with AI summaries
        """
        # Step 1: Interpret the query
        interpretation = await self.interpret_query(query, section_type)
        logger.info(f"Query interpretation: {interpretation}")

        results = {
            "query": query,
            "interpretation": interpretation,
            "library_results": [],
            "drive_results": []
        }

        # Step 2: Search Content Library
        if include_library:
            library_results = await self.search_content_library(
                db,
                interpretation["keywords"],
                section_type,
                max_results
            )
            results["library_results"] = library_results

        # Step 3: Search Google Drive
        if include_drive:
            drive_results = await self.search_google_drive(
                db,
                interpretation["enhanced_query"],
                section_type,
                max_results
            )

            # Summarize chunks
            for file in drive_results:
                if file.get("chunks"):
                    for chunk in file["chunks"]:
                        summary = await self.summarize_chunk(
                            chunk["text"],
                            context=f"{file['name']} - Chunk {chunk['chunk_index']}"
                        )
                        chunk["summary"] = summary

            results["drive_results"] = drive_results

        return results


# Create singleton instance
intelligent_search_service = IntelligentSearchService()
