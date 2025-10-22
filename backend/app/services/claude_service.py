"""
Claude AI Service for content generation and improvement
"""
from typing import Optional
from anthropic import Anthropic, APIError, APIConnectionError, RateLimitError, APIStatusError
from fastapi import HTTPException
from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class ClaudeService:
    """Service for interacting with Claude AI API"""

    def __init__(self):
        self._client = None
        self.model = settings.CLAUDE_MODEL
        self.max_tokens = settings.CLAUDE_MAX_TOKENS

    @property
    def client(self):
        """Lazy initialization of Anthropic client"""
        if self._client is None:
            if not settings.ANTHROPIC_API_KEY:
                raise ValueError("ANTHROPIC_API_KEY not configured")
            self._client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        return self._client

    async def generate_content(
        self,
        action: str,
        section_type: str,
        prompt: str,
        existing_content: Optional[str] = None
    ) -> str:
        """
        Generate or improve content using Claude AI

        Args:
            action: One of 'draft', 'improve', or 'expand'
            section_type: Type of content section (e.g., 'technical_approach')
            prompt: User's instructions or requirements
            existing_content: Current content (for improve/expand actions)

        Returns:
            Generated HTML content
        """
        system_message = self._build_system_message(section_type)
        user_message = self._build_user_message(action, prompt, existing_content)

        try:
            logger.info(f"Generating content with Claude: action={action}, section_type={section_type}")

            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                system=system_message,
                messages=[
                    {"role": "user", "content": user_message}
                ]
            )

            # Extract text from response
            content = response.content[0].text
            logger.info(f"Successfully generated content: {len(content)} characters")
            return content

        except RateLimitError as e:
            logger.error(f"Claude rate limit exceeded: {e}")
            raise HTTPException(
                status_code=429,
                detail="AI service rate limit exceeded. Please try again in a few moments."
            )

        except APIConnectionError as e:
            logger.error(f"Claude connection error: {e}")
            raise HTTPException(
                status_code=503,
                detail="AI service temporarily unavailable. Please check your internet connection and try again."
            )

        except APIStatusError as e:
            logger.error(f"Claude API status error: {e.status_code} - {e.message}")
            if e.status_code == 401:
                raise HTTPException(
                    status_code=500,
                    detail="AI service authentication failed. Please contact support."
                )
            elif e.status_code >= 500:
                raise HTTPException(
                    status_code=503,
                    detail="AI service is experiencing issues. Please try again later."
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"AI service error: {e.message}"
                )

        except APIError as e:
            logger.error(f"Claude API error: {e}")
            raise HTTPException(
                status_code=500,
                detail="AI content generation failed. Please try again."
            )

        except Exception as e:
            logger.exception(f"Unexpected error in Claude service: {e}")
            raise HTTPException(
                status_code=500,
                detail="An unexpected error occurred during AI content generation."
            )

    def _build_system_message(self, section_type: str) -> str:
        """Build the system message based on section type"""
        section_guidance = {
            "technical_approach": "You are an expert technical writer for government proposals. Focus on clear, detailed technical explanations with specific methodologies, technologies, and implementation strategies.",
            "past_performance": "You are an expert at writing past performance narratives for proposals. Highlight measurable outcomes, client satisfaction, and relevant experience with similar projects.",
            "executive_summary": "You are an expert at writing compelling executive summaries for proposals. Be concise, persuasive, and highlight key value propositions and differentiators.",
            "qualifications": "You are an expert at presenting organizational qualifications and team credentials. Emphasize relevant expertise, certifications, and capability statements.",
            "pricing": "You are an expert at writing pricing narratives for proposals. Clearly explain cost structure, value proposition, and competitive advantages."
        }

        base_guidance = section_guidance.get(
            section_type,
            "You are an expert proposal writer. Create professional, persuasive content."
        )

        return f"""{base_guidance}

IMPORTANT FORMATTING RULES:
- Output ONLY valid HTML content
- Use semantic HTML tags: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <table>, etc.
- Do NOT include markdown formatting (no **, __, #, etc.)
- Do NOT wrap content in ```html blocks
- Start directly with the HTML content
- Use <h1> for major section headings (14pt equivalent)
- Use <h2> for subsection headings (12pt equivalent)
- Use <h3> for minor headings (11pt equivalent)
- Use <p> for paragraphs (11pt equivalent)
- Use <strong> for bold text
- Use <em> for italic text
- Use <ul> and <li> for bullet lists
- Use <ol> and <li> for numbered lists
- Use <table>, <thead>, <tbody>, <tr>, <th>, <td> for tables
- Keep content professional and suitable for government proposals"""

    def _build_user_message(
        self,
        action: str,
        prompt: str,
        existing_content: Optional[str] = None
    ) -> str:
        """Build the user message based on action type"""
        if action == "draft":
            return f"""Create new proposal content based on this request:

{prompt}

Remember to output only HTML content without markdown formatting."""

        elif action == "improve":
            content_preview = existing_content[:1000] if existing_content else ""
            return f"""Improve and refine this existing proposal content:

CURRENT CONTENT:
{content_preview}

IMPROVEMENT INSTRUCTIONS:
{prompt if prompt else "Enhance clarity, professionalism, and persuasiveness. Fix any grammar or style issues."}

Remember to output only HTML content without markdown formatting."""

        elif action == "expand":
            content_preview = existing_content[:1000] if existing_content else ""
            return f"""Expand and add more detail to this existing proposal content:

CURRENT CONTENT:
{content_preview}

EXPANSION INSTRUCTIONS:
{prompt if prompt else "Add more detail, examples, and supporting information while maintaining the same tone and style."}

Remember to output only HTML content without markdown formatting."""

        else:
            raise ValueError(f"Invalid action: {action}. Must be 'draft', 'improve', or 'expand'")


# Create singleton instance
claude_service = ClaudeService()
