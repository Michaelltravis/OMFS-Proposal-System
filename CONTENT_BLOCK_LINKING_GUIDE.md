# Content Block Linking System - User Guide

## Overview

The OMFS Proposal System now features a comprehensive **Content Block Linking System** that allows you to leverage your content repository when building proposals. This workflow enables you to:

1. **Reuse existing content** from your Content Blocks database
2. **Link content blocks** to specific proposal sections
3. **Refine content** using Claude AI's advanced LLM capabilities
4. **Export sections** to Word documents with strict formatting

---

## Workflow

### 1. Start a Proposal

Navigate to the Proposal Builder and create a new proposal:

```
- Proposal Name
- Client Name
- RFP Number
- Deadline
- Page Limits
```

### 2. Outline Proposal with Major Sections

Add sections to your proposal with:
- **Title**: Section name (e.g., "Technical Approach")
- **Section Type**: Category (e.g., "technical_approach", "past_performance")
- **Page Targets**: Minimum and maximum page limits
- **Status**: not_started, in_progress, completed

Section types help filter relevant content blocks from your repository.

### 3. Build Content Using Content Blocks

#### Option A: Link from Repository

For each section, click **"Add Content Block from Repository"** to:

1. **Browse Content Blocks** filtered by section type
2. **Search** by title or content keywords
3. **Preview** content blocks with metadata:
   - Word count and estimated pages
   - Quality rating
   - Usage count
   - Tags
   - Section types

4. **Select and Add** content blocks to your section

The Content Block Browser automatically filters blocks by the current section's type (e.g., showing only "technical_approach" blocks for Technical Approach sections).

#### Option B: Create Custom Content

You can also create custom content directly in the proposal section using the rich text editor.

### 4. Refine and Iterate Content Using Claude

Once content is added to a section, you can refine it using Claude AI:

#### Refinement Actions

1. **Improve**: Enhance clarity, flow, and quality
   - Makes language more concise and professional
   - Focuses on measurable outcomes
   - Improves technical accuracy

2. **Expand**: Add more detail and depth
   - Adds technical details
   - Includes specific examples
   - Expands on key points

#### How to Refine

1. Click the **Sparkles icon** (✨) on any linked content
2. Choose refinement action: **Improve** or **Expand**
3. Provide **instructions** for Claude:
   ```
   Example (Improve): "Make the language more concise and professional.
   Focus on measurable outcomes."

   Example (Expand): "Add more technical details about implementation
   approach. Include specific technologies and methodologies."
   ```
4. Click **"Generate Refined Content"**
5. Review the refined content side-by-side with the original
6. Click **"Apply Changes"** to update the section

The system tracks all refinements in the `customization_notes` field.

### 5. Edit Content Directly

You can also manually edit any content block:

1. Click the **Edit icon** (✏️) on any linked content
2. Modify the title and content using the rich text editor
3. Save changes

### 6. Export to Word Document

#### Export Individual Sections

1. Click **"Export to Word"** on any section
2. Optionally provide **formatting instructions** for Claude:
   ```
   Example: "Use 12pt Times New Roman font, 1.5 line spacing,
   add page numbers in the footer, include section headers"
   ```
3. Download the `.docx` file

The export follows **strict Claude Skills instructions** for proper formatting.

#### Export Full Proposal

Export all sections together as a complete proposal document with:
- Title page
- Table of contents (if configured)
- All sections in order
- Consistent formatting throughout

---

## Features

### Content Block Browser

**Features:**
- Automatic filtering by section type
- Full-text search across titles and content
- Preview panel with metadata
- Pagination for large repositories
- Tag-based organization
- Quality ratings and usage statistics

**Smart Filtering:**
When you open the browser from a "Technical Approach" section, it automatically shows only content blocks tagged with the "technical_approach" section type.

### Linked Content Display

Each linked content block shows:

- **Link icon** (🔗) indicating it's from the repository
- **Title** and **content preview**
- **Metadata**: Word count, page count, customization notes
- **Action buttons**:
  - ✨ **Refine with Claude** - AI-powered improvements
  - ✏️ **Edit** - Manual editing
  - 🗑️ **Delete** - Remove from section

**Custom content** shows a different icon (📄) to distinguish it from repository content.

### Claude AI Refinement

**Powered by Claude Sonnet**, the refinement modal provides:

- **Side-by-side comparison** of original and refined content
- **Context-aware improvements** based on section type
- **Customizable prompts** for specific needs
- **Preview before applying** changes
- **Tracked customization history**

### Content Reusability

The system tracks:
- **Usage count**: How many times a block has been used
- **Quality rating**: 1-5 star ratings
- **Customization history**: How blocks were modified for different proposals
- **Version history**: All changes tracked automatically

---

## Section Types

Pre-configured section types include:

| Section Type | Display Name | Use Case |
|--------------|--------------|----------|
| `technical_approach` | Technical Approach | Detailed technical explanations and methodologies |
| `past_performance` | Past Performance | Previous project narratives and case studies |
| `executive_summary` | Executive Summary | High-level proposal overviews |
| `qualifications` | Qualifications | Team credentials and certifications |
| `pricing` | Pricing | Cost breakdowns and pricing strategies |

You can add custom section types as needed.

---

## Database Schema

### Key Relationships

```
ContentBlock (Repository)
    ├── section_types (many-to-many)
    ├── tags (many-to-many)
    └── versions (one-to-many)

ProposalSection
    └── contents (one-to-many) → ProposalContent
                                      ├── source_block_id → ContentBlock
                                      └── is_custom (boolean)
```

### ProposalContent Fields

- `source_block_id`: Links to ContentBlock (null for custom content)
- `is_custom`: Boolean flag (true = custom, false = from repository)
- `content`: Rich HTML content
- `title`: Optional content title
- `order`: Position within section
- `customization_notes`: Tracking refinements and edits
- `word_count`: Calculated word count
- `estimated_pages`: Estimated page count

---

## API Endpoints

### Content Blocks

```
GET    /api/content/blocks?section_type={type}&search={query}
POST   /api/content/blocks
PUT    /api/content/blocks/{id}
DELETE /api/content/blocks/{id}
```

### Proposal Sections & Content

```
GET    /api/proposals/{id}/sections
POST   /api/proposals/{id}/sections
POST   /api/proposals/{id}/sections/{id}/content
PUT    /api/proposals/{id}/sections/{id}/content/{cid}
DELETE /api/proposals/{id}/sections/{id}/content/{cid}
```

### AI Refinement

```
POST   /api/content/ai/generate
{
  "action": "improve" | "expand",
  "section_type": "technical_approach",
  "prompt": "Your instructions...",
  "existing_content": "<html>...</html>"
}
```

### Export

```
POST   /api/proposals/{id}/sections/{sid}/export
POST   /api/proposals/{id}/export
{
  "formatting_instructions": "Optional Claude instructions..."
}
```

---

## Best Practices

### Content Organization

1. **Tag consistently**: Use tags to categorize content by industry, technology, client type
2. **Rate quality**: Assign quality ratings to help find the best content
3. **Update metadata**: Keep section types and context metadata current
4. **Version control**: The system automatically versions, but add meaningful change descriptions

### Proposal Building

1. **Start with templates**: Create section templates with standard structure
2. **Reuse high-quality content**: Filter by quality rating to find proven content
3. **Customize for context**: Use Claude to tailor generic content to specific RFPs
4. **Track customizations**: Document how you've adapted content for each proposal

### Claude AI Usage

1. **Be specific**: Provide detailed instructions for better results
2. **Iterate**: Use "Improve" multiple times with different instructions
3. **Review carefully**: Always review AI-generated content before finalizing
4. **Combine approaches**: Use AI refinement + manual editing for best results

### Export Workflow

1. **Section-by-section**: Export and review sections individually before final proposal
2. **Formatting instructions**: Create standard formatting templates
3. **Quality check**: Review exported Word docs for proper formatting
4. **Track versions**: Keep exported versions with proposal records

---

## Technical Architecture

### Frontend Components

- **ContentBlockBrowser**: Browse and select repository content
- **LinkedContentItem**: Display linked content with actions
- **ContentRefinementModal**: AI-powered content improvement
- **RichTextEditor**: TipTap-based rich text editing

### Backend Services

- **ContentService**: Manage content blocks and repository
- **ProposalService**: Handle proposals, sections, and content
- **ClaudeService**: AI content generation and refinement
- **DocumentExportService**: Word document generation

### Technologies

- **Frontend**: React 19 + TypeScript + TailwindCSS
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **AI**: Anthropic Claude (Sonnet model)
- **Rich Text**: TipTap editor with extensions
- **Export**: python-docx for Word documents

---

## Troubleshooting

### Content blocks not showing in browser

**Check:**
- Section has a `section_type` assigned
- Content blocks have matching section types
- Content blocks are not soft-deleted (`is_deleted = false`)

### Claude refinement fails

**Check:**
- `ANTHROPIC_API_KEY` is configured in backend `.env`
- Existing content is provided for "improve" or "expand" actions
- Instructions are clear and specific

### Export formatting issues

**Solutions:**
- Provide explicit formatting instructions
- Check HTML content for complex nested structures
- Review `document_export_service.py` for supported HTML tags

### Content not linking properly

**Verify:**
- `source_block_id` references a valid ContentBlock
- Section and content are in the same proposal
- API endpoints are returning success responses

---

## Future Enhancements

Potential improvements to the system:

1. **Drag-and-drop reordering** of content within sections
2. **Bulk operations** for adding multiple content blocks
3. **Smart suggestions** based on RFP requirements
4. **Vector search** using Qdrant for semantic content matching
5. **Collaboration features** for team-based proposal development
6. **Template library** for common proposal structures
7. **Analytics dashboard** for content reuse and effectiveness

---

## Support

For questions or issues:

1. Check this documentation
2. Review API documentation at `/api/docs` (FastAPI auto-generated)
3. Examine backend logs for error details
4. Verify database schema matches expectations

---

## Summary

The Content Block Linking System provides a powerful workflow for proposal development:

**Create → Organize → Link → Refine → Export**

By leveraging your content repository and Claude AI, you can:
- Build proposals faster
- Maintain content quality and consistency
- Customize content for specific RFPs
- Export professional Word documents

This system fully leverages existing content, Claude's LLM abilities, and strict formatting skills to streamline your proposal development process.
