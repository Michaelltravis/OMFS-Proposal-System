"""
Application configuration and settings
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application
    APP_NAME: str = "Proposal Content Repository & Builder"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/proposal_db"

    # Qdrant Vector Database
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_COLLECTION_NAME: str = "content_chunks"
    VECTOR_SIZE: int = 384  # all-MiniLM-L6-v2 embedding size

    # Anthropic Claude
    ANTHROPIC_API_KEY: Optional[str] = None
    CLAUDE_MODEL: str = "claude-sonnet-4-5"
    CLAUDE_MAX_TOKENS: int = 8192

    # OpenAI (for embeddings)
    OPENAI_API_KEY: Optional[str] = None
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
