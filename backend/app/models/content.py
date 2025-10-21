"""
Content Repository database models
"""
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Float,
    ForeignKey,
    Table,
    Boolean,
    JSON,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


# Many-to-many relationship table for content blocks and tags
content_block_tags = Table(
    "content_block_tags",
    Base.metadata,
    Column("content_block_id", Integer, ForeignKey("content_blocks.id", ondelete="CASCADE")),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE")),
)


class ContentBlock(Base):
    """
    Modular reusable content block - the core unit of the repository
    """

    __tablename__ = "content_blocks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    content = Column(Text, nullable=False)  # Rich HTML content
    section_type = Column(String(100), nullable=False, index=True)  # e.g., "technical_approach", "past_performance"

    # Size metrics
    estimated_pages = Column(Float, nullable=True)
    word_count = Column(Integer, nullable=True)

    # Hierarchy (for nested structures)
    parent_id = Column(Integer, ForeignKey("content_blocks.id", ondelete="SET NULL"), nullable=True)
    path = Column(String(1000), nullable=True)  # Breadcrumb path

    # Source tracking
    document_source_id = Column(Integer, nullable=True)  # ID of original Word document if imported

    # Type-specific metadata stored as JSON
    # Structure varies by section_type:
    # - technical_approach: problem_context, constraints, solution_approach, etc.
    # - past_performance: client_name, project_title, contract_value, etc.
    # - other: minimal metadata
    context_metadata = Column(JSON, nullable=True)

    # Usage and quality tracking
    quality_rating = Column(Float, nullable=True)  # 1-5 star rating
    usage_count = Column(Integer, default=0)

    # Customization history - array of objects tracking how this was used in proposals
    # [{proposal: "City of Houston", date: "2023-05", changes: "...", level: "heavy"}, ...]
    customization_history = Column(JSON, default=list)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(100), nullable=True)  # User ID/email
    updated_by = Column(String(100), nullable=True)

    # Soft delete
    is_deleted = Column(Boolean, default=False)

    # Relationships
    parent = relationship("ContentBlock", remote_side=[id], backref="children")
    tags = relationship("Tag", secondary=content_block_tags, back_populates="content_blocks")
    chunks = relationship("ContentChunk", back_populates="content_block", cascade="all, delete-orphan")
    versions = relationship("ContentVersion", back_populates="content_block", cascade="all, delete-orphan")


class ContentChunk(Base):
    """
    Smaller units of content for vector search
    Each content block is split into multiple chunks with embeddings
    """

    __tablename__ = "content_chunks"

    id = Column(Integer, primary_key=True, index=True)
    content_block_id = Column(Integer, ForeignKey("content_blocks.id", ondelete="CASCADE"), nullable=False)

    chunk_text = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)  # Order within the content block
    overlap_text = Column(Text, nullable=True)  # Context from adjacent chunks

    # Vector embedding (stored in Qdrant, ID reference here)
    embedding_id = Column(String(100), nullable=True)  # Qdrant point ID

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    content_block = relationship("ContentBlock", back_populates="chunks")


class ContentVersion(Base):
    """
    Version history for content blocks
    Stores full snapshots of content for rollback
    """

    __tablename__ = "content_versions"

    id = Column(Integer, primary_key=True, index=True)
    content_block_id = Column(Integer, ForeignKey("content_blocks.id", ondelete="CASCADE"), nullable=False)

    version_number = Column(Integer, nullable=False)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    context_metadata = Column(JSON, nullable=True)

    change_description = Column(Text, nullable=True)  # What changed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String(100), nullable=True)

    # Relationships
    content_block = relationship("ContentBlock", back_populates="versions")


class Tag(Base):
    """
    Tags for categorizing and filtering content blocks
    """

    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(String(50), nullable=True)  # e.g., "technology", "industry", "client_type"
    color = Column(String(20), nullable=True)  # For UI display
    usage_count = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    content_blocks = relationship("ContentBlock", secondary=content_block_tags, back_populates="tags")
