"""
Proposal Builder database models
"""
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Float,
    ForeignKey,
    Boolean,
    JSON,
    Enum as SQLEnum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class ProposalStatus(str, enum.Enum):
    """Proposal project status"""

    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class SectionStatus(str, enum.Enum):
    """Section completion status"""

    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class RequirementStatus(str, enum.Enum):
    """RFP requirement coverage status"""

    NOT_ADDRESSED = "not_addressed"
    PARTIALLY_ADDRESSED = "partially_addressed"
    FULLY_ADDRESSED = "fully_addressed"


class Proposal(Base):
    """
    Proposal project - represents a single RFP response being built
    """

    __tablename__ = "proposals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(500), nullable=False)  # e.g., "City of Phoenix WWT RFP"
    client_name = Column(String(200), nullable=True)
    rfp_number = Column(String(100), nullable=True)

    # RFP details
    rfp_deadline = Column(DateTime(timezone=True), nullable=True)
    page_limit = Column(Integer, nullable=True)
    estimated_pages = Column(Integer, nullable=True)

    # Status
    status = Column(SQLEnum(ProposalStatus), default=ProposalStatus.DRAFT, nullable=False)
    is_archived = Column(Boolean, default=False)

    # Metadata
    notes = Column(Text, nullable=True)  # Overall project notes
    rfp_context = Column(Text, nullable=True)  # Key RFP information

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)

    # Relationships
    sections = relationship("ProposalSection", back_populates="proposal", cascade="all, delete-orphan", order_by="ProposalSection.order")
    requirements = relationship("RFPRequirement", back_populates="proposal", cascade="all, delete-orphan")
    documents = relationship("ProposalDocument", back_populates="proposal", cascade="all, delete-orphan")
    proposal_notes = relationship("ProposalNote", back_populates="proposal", cascade="all, delete-orphan")


class ProposalSection(Base):
    """
    Section within a proposal (e.g., Executive Summary, Technical Approach)
    """

    __tablename__ = "proposal_sections"

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id", ondelete="CASCADE"), nullable=False)

    title = Column(String(500), nullable=False)
    section_type = Column(String(100), nullable=True)  # Maps to content block section types
    order = Column(Integer, nullable=False)  # Position in proposal

    # Page targets
    page_target_min = Column(Float, nullable=True)
    page_target_max = Column(Float, nullable=True)
    current_pages = Column(Float, nullable=True)  # Calculated from content

    # Status
    status = Column(SQLEnum(SectionStatus), default=SectionStatus.NOT_STARTED, nullable=False)

    # Section-specific notes
    notes = Column(Text, nullable=True)
    requirements = Column(JSON, nullable=True)  # Specific requirements for this section

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    proposal = relationship("Proposal", back_populates="sections")
    contents = relationship("ProposalContent", back_populates="section", cascade="all, delete-orphan", order_by="ProposalContent.order")


class ProposalContent(Base):
    """
    Actual content within a proposal section
    Can be linked to repository content block or custom content
    """

    __tablename__ = "proposal_contents"

    id = Column(Integer, primary_key=True, index=True)
    section_id = Column(Integer, ForeignKey("proposal_sections.id", ondelete="CASCADE"), nullable=False)

    # Content source
    source_block_id = Column(Integer, nullable=True)  # If from repository, reference to ContentBlock.id
    is_custom = Column(Boolean, default=False)  # True if written directly in proposal

    # Content
    content = Column(Text, nullable=False)  # Rich HTML content
    title = Column(String(500), nullable=True)

    # Order within section
    order = Column(Integer, nullable=False)

    # Metadata
    word_count = Column(Integer, nullable=True)
    estimated_pages = Column(Float, nullable=True)
    customization_notes = Column(Text, nullable=True)  # How this was adapted from source

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    section = relationship("ProposalSection", back_populates="contents")


class RFPRequirement(Base):
    """
    Extracted requirements from RFP document
    Track which requirements are addressed in proposal
    """

    __tablename__ = "rfp_requirements"

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id", ondelete="CASCADE"), nullable=False)

    requirement_number = Column(String(50), nullable=True)  # e.g., "3.2.1"
    requirement_text = Column(Text, nullable=False)
    section = Column(String(200), nullable=True)  # Which section of RFP this is from

    # Coverage tracking
    status = Column(SQLEnum(RequirementStatus), default=RequirementStatus.NOT_ADDRESSED, nullable=False)
    coverage_notes = Column(Text, nullable=True)  # Where/how this is addressed
    addressed_in_section_id = Column(Integer, ForeignKey("proposal_sections.id"), nullable=True)

    # Priority/importance
    priority = Column(String(20), nullable=True)  # e.g., "must", "should", "may"
    is_mandatory = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    proposal = relationship("Proposal", back_populates="requirements")


class ProposalDocument(Base):
    """
    Supplemental documents attached to proposal
    (RFP files, site visit reports, reference materials)
    """

    __tablename__ = "proposal_documents"

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id", ondelete="CASCADE"), nullable=False)

    file_name = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)  # Path in upload directory
    file_type = Column(String(100), nullable=True)  # MIME type
    file_size = Column(Integer, nullable=True)  # Bytes

    # Document categorization
    purpose = Column(String(100), nullable=True)  # e.g., "rfp", "site_visit", "reference"
    description = Column(Text, nullable=True)

    # Timestamps
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    uploaded_by = Column(String(100), nullable=True)

    # Relationships
    proposal = relationship("Proposal", back_populates="documents")


class ProposalNote(Base):
    """
    Team collaboration notes on proposals
    """

    __tablename__ = "proposal_notes"

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(Integer, ForeignKey("proposal_sections.id", ondelete="CASCADE"), nullable=True)

    note_text = Column(Text, nullable=False)
    note_type = Column(String(50), nullable=True)  # e.g., "comment", "todo", "question"

    # Author
    author = Column(String(100), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    proposal = relationship("Proposal", back_populates="proposal_notes")
