"""
Proposal Builder API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.proposal import (
    Proposal,
    ProposalSection,
    ProposalContent,
    RFPRequirement,
    ProposalStatus,
)
from app.schemas.proposal import (
    ProposalCreate,
    ProposalUpdate,
    ProposalResponse,
    ProposalSectionCreate,
    ProposalSectionUpdate,
    ProposalSectionResponse,
    ProposalContentCreate,
    ProposalContentUpdate,
    ProposalContentResponse,
    RFPRequirementCreate,
    RFPRequirementUpdate,
    RFPRequirementResponse,
)
from app.schemas.common import PaginatedResponse
import math

router = APIRouter()


# Proposals CRUD
@router.get("", response_model=PaginatedResponse[ProposalResponse])
def get_proposals(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    archived: Optional[bool] = None,
    status: Optional[ProposalStatus] = None,
    db: Session = Depends(get_db),
):
    """Get all proposals with pagination and filtering"""
    query = db.query(Proposal)

    # Apply filters
    if archived is not None:
        query = query.filter(Proposal.is_archived == archived)

    if status:
        query = query.filter(Proposal.status == status)

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * limit
    items = query.order_by(Proposal.updated_at.desc()).offset(offset).limit(limit).all()

    pages = math.ceil(total / limit)

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        pages=pages,
        limit=limit,
    )


@router.get("/{proposal_id}", response_model=ProposalResponse)
def get_proposal(proposal_id: int, db: Session = Depends(get_db)):
    """Get a single proposal by ID"""
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()

    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    return proposal


@router.post("", response_model=ProposalResponse, status_code=201)
def create_proposal(
    proposal_data: ProposalCreate,
    db: Session = Depends(get_db),
):
    """Create a new proposal"""
    proposal = Proposal(**proposal_data.model_dump())
    db.add(proposal)
    db.commit()
    db.refresh(proposal)

    return proposal


@router.put("/{proposal_id}", response_model=ProposalResponse)
def update_proposal(
    proposal_id: int,
    proposal_data: ProposalUpdate,
    db: Session = Depends(get_db),
):
    """Update an existing proposal"""
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()

    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    # Update fields
    update_data = proposal_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(proposal, field, value)

    db.commit()
    db.refresh(proposal)

    return proposal


@router.delete("/{proposal_id}", status_code=204)
def delete_proposal(proposal_id: int, db: Session = Depends(get_db)):
    """Delete a proposal"""
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()

    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    db.delete(proposal)
    db.commit()

    return None


@router.post("/{proposal_id}/archive", response_model=ProposalResponse)
def archive_proposal(proposal_id: int, db: Session = Depends(get_db)):
    """Archive a proposal"""
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()

    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    proposal.is_archived = True
    proposal.status = ProposalStatus.ARCHIVED
    db.commit()
    db.refresh(proposal)

    return proposal


# Proposal Sections
@router.get("/{proposal_id}/sections", response_model=List[ProposalSectionResponse])
def get_sections(proposal_id: int, db: Session = Depends(get_db)):
    """Get all sections for a proposal"""
    # Verify proposal exists
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    sections = db.query(ProposalSection).filter(
        ProposalSection.proposal_id == proposal_id
    ).order_by(ProposalSection.order).all()

    return sections


@router.post("/{proposal_id}/sections", response_model=ProposalSectionResponse, status_code=201)
def create_section(
    proposal_id: int,
    section_data: ProposalSectionCreate,
    db: Session = Depends(get_db),
):
    """Create a new section in a proposal"""
    # Verify proposal exists
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    section = ProposalSection(
        proposal_id=proposal_id,
        **section_data.model_dump()
    )
    db.add(section)
    db.commit()
    db.refresh(section)

    return section


@router.put("/{proposal_id}/sections/{section_id}", response_model=ProposalSectionResponse)
def update_section(
    proposal_id: int,
    section_id: int,
    section_data: ProposalSectionUpdate,
    db: Session = Depends(get_db),
):
    """Update a proposal section"""
    section = db.query(ProposalSection).filter(
        ProposalSection.id == section_id,
        ProposalSection.proposal_id == proposal_id,
    ).first()

    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    # Update fields
    update_data = section_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(section, field, value)

    db.commit()
    db.refresh(section)

    return section


@router.delete("/{proposal_id}/sections/{section_id}", status_code=204)
def delete_section(proposal_id: int, section_id: int, db: Session = Depends(get_db)):
    """Delete a proposal section"""
    section = db.query(ProposalSection).filter(
        ProposalSection.id == section_id,
        ProposalSection.proposal_id == proposal_id,
    ).first()

    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    db.delete(section)
    db.commit()

    return None


# Section Content
@router.post("/{proposal_id}/sections/{section_id}/content", response_model=ProposalContentResponse, status_code=201)
def add_content_to_section(
    proposal_id: int,
    section_id: int,
    content_data: ProposalContentCreate,
    db: Session = Depends(get_db),
):
    """Add content to a proposal section"""
    # Verify section exists
    section = db.query(ProposalSection).filter(
        ProposalSection.id == section_id,
        ProposalSection.proposal_id == proposal_id,
    ).first()

    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    content = ProposalContent(
        section_id=section_id,
        **content_data.model_dump()
    )
    db.add(content)
    db.commit()
    db.refresh(content)

    return content


@router.put("/{proposal_id}/sections/{section_id}/content/{content_id}", response_model=ProposalContentResponse)
def update_section_content(
    proposal_id: int,
    section_id: int,
    content_id: int,
    content_data: ProposalContentUpdate,
    db: Session = Depends(get_db),
):
    """Update section content"""
    content = db.query(ProposalContent).filter(
        ProposalContent.id == content_id,
        ProposalContent.section_id == section_id,
    ).first()

    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    # Update fields
    update_data = content_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(content, field, value)

    db.commit()
    db.refresh(content)

    return content


@router.delete("/{proposal_id}/sections/{section_id}/content/{content_id}", status_code=204)
def delete_section_content(
    proposal_id: int,
    section_id: int,
    content_id: int,
    db: Session = Depends(get_db),
):
    """Delete section content"""
    content = db.query(ProposalContent).filter(
        ProposalContent.id == content_id,
        ProposalContent.section_id == section_id,
    ).first()

    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    db.delete(content)
    db.commit()

    return None


# RFP Requirements
@router.get("/{proposal_id}/requirements", response_model=List[RFPRequirementResponse])
def get_requirements(proposal_id: int, db: Session = Depends(get_db)):
    """Get all RFP requirements for a proposal"""
    # Verify proposal exists
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    requirements = db.query(RFPRequirement).filter(
        RFPRequirement.proposal_id == proposal_id
    ).all()

    return requirements


@router.post("/{proposal_id}/requirements", response_model=RFPRequirementResponse, status_code=201)
def create_requirement(
    proposal_id: int,
    requirement_data: RFPRequirementCreate,
    db: Session = Depends(get_db),
):
    """Create a new RFP requirement"""
    # Verify proposal exists
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    requirement = RFPRequirement(
        proposal_id=proposal_id,
        **requirement_data.model_dump()
    )
    db.add(requirement)
    db.commit()
    db.refresh(requirement)

    return requirement


@router.put("/{proposal_id}/requirements/{requirement_id}", response_model=RFPRequirementResponse)
def update_requirement(
    proposal_id: int,
    requirement_id: int,
    requirement_data: RFPRequirementUpdate,
    db: Session = Depends(get_db),
):
    """Update an RFP requirement"""
    requirement = db.query(RFPRequirement).filter(
        RFPRequirement.id == requirement_id,
        RFPRequirement.proposal_id == proposal_id,
    ).first()

    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")

    # Update fields
    update_data = requirement_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(requirement, field, value)

    db.commit()
    db.refresh(requirement)

    return requirement


@router.delete("/{proposal_id}/requirements/{requirement_id}", status_code=204)
def delete_requirement(
    proposal_id: int,
    requirement_id: int,
    db: Session = Depends(get_db),
):
    """Delete an RFP requirement"""
    requirement = db.query(RFPRequirement).filter(
        RFPRequirement.id == requirement_id,
        RFPRequirement.proposal_id == proposal_id,
    ).first()

    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")

    db.delete(requirement)
    db.commit()

    return None
