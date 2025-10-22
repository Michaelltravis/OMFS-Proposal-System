"""
Pydantic schemas for Proposal Builder
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.proposal import ProposalStatus, SectionStatus, RequirementStatus


# Proposal Schemas
class ProposalBase(BaseModel):
    name: str
    client_name: Optional[str] = None
    rfp_number: Optional[str] = None
    rfp_deadline: Optional[datetime] = None
    page_limit: Optional[int] = None
    notes: Optional[str] = None
    rfp_context: Optional[str] = None


class ProposalCreate(ProposalBase):
    pass


class ProposalUpdate(BaseModel):
    name: Optional[str] = None
    client_name: Optional[str] = None
    rfp_number: Optional[str] = None
    rfp_deadline: Optional[datetime] = None
    page_limit: Optional[int] = None
    status: Optional[ProposalStatus] = None
    notes: Optional[str] = None
    rfp_context: Optional[str] = None


class ProposalResponse(ProposalBase):
    id: int
    status: ProposalStatus
    is_archived: bool
    estimated_pages: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

    class Config:
        from_attributes = True


# Proposal Section Schemas
class ProposalSectionBase(BaseModel):
    title: str
    section_type: Optional[str] = None
    order: int
    page_target_min: Optional[float] = None
    page_target_max: Optional[float] = None
    notes: Optional[str] = None
    requirements: Optional[Dict[str, Any]] = None


class ProposalSectionCreate(ProposalSectionBase):
    pass


class ProposalSectionUpdate(BaseModel):
    title: Optional[str] = None
    section_type: Optional[str] = None
    order: Optional[int] = None
    page_target_min: Optional[float] = None
    page_target_max: Optional[float] = None
    status: Optional[SectionStatus] = None
    notes: Optional[str] = None
    requirements: Optional[Dict[str, Any]] = None


class SectionReorderItem(BaseModel):
    id: int
    order: int


class SectionReorderRequest(BaseModel):
    sections: List[SectionReorderItem]


class ProposalSectionResponse(ProposalSectionBase):
    id: int
    proposal_id: int
    current_pages: Optional[float] = None
    status: SectionStatus
    contents: List["ProposalContentResponse"] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Proposal Content Schemas
class ProposalContentBase(BaseModel):
    content: str
    title: Optional[str] = None
    order: int
    customization_notes: Optional[str] = None


class ProposalContentCreate(ProposalContentBase):
    source_block_id: Optional[int] = None
    is_custom: bool = False


class ProposalContentUpdate(BaseModel):
    content: Optional[str] = None
    title: Optional[str] = None
    order: Optional[int] = None
    customization_notes: Optional[str] = None


class ProposalContentResponse(ProposalContentBase):
    id: int
    section_id: int
    source_block_id: Optional[int] = None
    is_custom: bool
    word_count: Optional[int] = None
    estimated_pages: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# RFP Requirement Schemas
class RFPRequirementBase(BaseModel):
    requirement_text: str
    requirement_number: Optional[str] = None
    section: Optional[str] = None
    priority: Optional[str] = None
    is_mandatory: bool = False


class RFPRequirementCreate(RFPRequirementBase):
    pass


class RFPRequirementUpdate(BaseModel):
    requirement_text: Optional[str] = None
    requirement_number: Optional[str] = None
    section: Optional[str] = None
    status: Optional[RequirementStatus] = None
    coverage_notes: Optional[str] = None
    addressed_in_section_id: Optional[int] = None
    priority: Optional[str] = None
    is_mandatory: Optional[bool] = None


class RFPRequirementResponse(RFPRequirementBase):
    id: int
    proposal_id: int
    status: RequirementStatus
    coverage_notes: Optional[str] = None
    addressed_in_section_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Resolve forward references
ProposalSectionResponse.model_rebuild()
