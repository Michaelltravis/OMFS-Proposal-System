"""
Database initialization script
Creates all tables and optionally seeds sample data
"""
import sys
from sqlalchemy import create_engine
from app.core.config import settings
from app.core.database import Base
import app.models  # Import all models


def init_database(drop_existing=False):
    """Initialize the database with tables"""
    print(f"Connecting to database: {settings.DATABASE_URL}")

    engine = create_engine(settings.DATABASE_URL)

    if drop_existing:
        print("Dropping existing tables...")
        Base.metadata.drop_all(bind=engine)
        print("Tables dropped")

    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

    print("\nDatabase initialized. Tables created:")
    for table in Base.metadata.tables.keys():
        print(f"  - {table}")


def seed_sample_data():
    """Add sample data for testing"""
    from app.core.database import SessionLocal
    from app.models.content import Tag, ContentBlock
    from app.models.proposal import Proposal, ProposalSection

    db = SessionLocal()

    try:
        print("\nSeeding sample data...")

        # Create sample tags
        tags = [
            Tag(name="SCADA", category="technology", color="#3b82f6"),
            Tag(name="Water Quality", category="service", color="#10b981"),
            Tag(name="Municipal", category="client_type", color="#f59e0b"),
            Tag(name="Wastewater", category="facility_type", color="#8b5cf6"),
            Tag(name="Cloud", category="technology", color="#06b6d4"),
        ]

        for tag in tags:
            existing = db.query(Tag).filter(Tag.name == tag.name).first()
            if not existing:
                db.add(tag)

        db.commit()
        print("Sample tags created")

        # Create sample content block
        sample_block = ContentBlock(
            title="SCADA System Modernization - Municipal Water Treatment",
            content="""
            <h2>SCADA Modernization Approach</h2>
            <p>Our approach to modernizing SCADA systems for municipal water treatment facilities
            focuses on ensuring zero downtime while implementing modern cybersecurity standards.</p>

            <h3>Key Components:</h3>
            <ul>
                <li>Phased migration strategy with redundant systems</li>
                <li>Modern Rockwell ControlLogix or Siemens S7 PLCs</li>
                <li>Secure remote access with VPN and multi-factor authentication</li>
                <li>NIST cybersecurity framework compliance</li>
            </ul>

            <h3>Implementation Approach:</h3>
            <p>We implement a parallel systems approach during cutover to ensure continuous
            plant operations. Our team provides comprehensive training to operators and
            IT staff on the new systems.</p>
            """,
            section_type="technical_approach",
            estimated_pages=4,
            word_count=250,
            context_metadata={
                "problem_context": "Aging SCADA infrastructure with cybersecurity vulnerabilities",
                "solution_approach": "Phased modernization with zero downtime",
                "client_type": "municipal",
                "facility_type": "water_treatment",
                "technologies": ["SCADA", "PLC", "VPN", "Cybersecurity"],
                "transferable_elements": "Approach applicable to any critical infrastructure SCADA upgrade"
            },
            quality_rating=4.5,
        )

        existing_block = db.query(ContentBlock).filter(
            ContentBlock.title == sample_block.title
        ).first()

        if not existing_block:
            # Add tags to block
            scada_tag = db.query(Tag).filter(Tag.name == "SCADA").first()
            municipal_tag = db.query(Tag).filter(Tag.name == "Municipal").first()
            if scada_tag and municipal_tag:
                sample_block.tags = [scada_tag, municipal_tag]

            db.add(sample_block)
            db.commit()
            print("Sample content block created")

        # Create sample proposal
        sample_proposal = Proposal(
            name="City of Phoenix Wastewater Treatment RFP Response",
            client_name="City of Phoenix",
            rfp_number="RFP-2025-WWT-001",
            page_limit=50,
            rfp_context="Modernization of 40-year-old wastewater treatment facility",
            notes="Focus on SCADA modernization and process improvements"
        )

        existing_proposal = db.query(Proposal).filter(
            Proposal.name == sample_proposal.name
        ).first()

        if not existing_proposal:
            db.add(sample_proposal)
            db.commit()
            db.refresh(sample_proposal)

            # Create sample sections
            sections = [
                ProposalSection(
                    proposal_id=sample_proposal.id,
                    title="Executive Summary",
                    section_type="executive_summary",
                    order=1,
                    page_target_min=1,
                    page_target_max=2,
                ),
                ProposalSection(
                    proposal_id=sample_proposal.id,
                    title="Technical Approach",
                    section_type="technical_approach",
                    order=2,
                    page_target_min=15,
                    page_target_max=20,
                ),
                ProposalSection(
                    proposal_id=sample_proposal.id,
                    title="Past Performance",
                    section_type="past_performance",
                    order=3,
                    page_target_min=5,
                    page_target_max=8,
                ),
            ]

            for section in sections:
                db.add(section)

            db.commit()
            print("Sample proposal and sections created")

        print("\nSample data seeded successfully!")

    except Exception as e:
        print(f"\nError seeding data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Initialize the database")
    parser.add_argument(
        "--drop",
        action="store_true",
        help="Drop existing tables before creating (WARNING: This will delete all data!)"
    )
    parser.add_argument(
        "--seed",
        action="store_true",
        help="Seed database with sample data"
    )

    args = parser.parse_args()

    if args.drop:
        confirm = input("WARNING: Are you sure you want to drop all existing tables? (yes/no): ")
        if confirm.lower() != "yes":
            print("Aborted.")
            sys.exit(0)

    init_database(drop_existing=args.drop)

    if args.seed:
        seed_sample_data()

    print("\nDatabase initialization complete!")
    print("\nNext steps:")
    print("  1. Start the backend: uvicorn app.main:app --reload")
    print("  2. Visit http://localhost:8000/docs to test the API")
    print("  3. Start the frontend: cd ../frontend && npm run dev")
