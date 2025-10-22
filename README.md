# Proposal Content Repository & Builder

A full-stack application for managing and building government proposal content using AI assistance from Claude.

## Project Overview

This system provides a content repository for storing, organizing, and reusing proposal content blocks. It includes rich text editing capabilities and AI-powered content generation to help proposal writers draft, improve, and expand content quickly.

### Key Features

✅ **Completed:**

**Content Repository:**
- Content block CRUD operations (Create, Read, Update, Delete)
- Rich text editor with TipTap (headings, bold, italic, lists, tables)
- Advanced search and filtering with tag-based filters
- Content search modal for browsing and selecting content
- Tag system for categorizing content (create, assign, filter)
- Section type labeling for content blocks
- Version history with visual diff comparison
- Track changes support for tags and section categories

**AI Integration:**
- Claude AI integration for content generation (draft, improve, expand)
- Section-specific intelligent prompts
- Real-time content generation with error handling

**Proposal Builder:**
- Full proposal builder interface with questionnaire
- Draggable sections for reordering
- Content block linking system to proposals
- Add, edit, and delete content within proposal sections
- Visual and HTML edit modes for content editing
- Section content management with modal interface

**Google Drive Integration:**
- OAuth 2.0 authentication with Google Drive
- Automatic search for relevant files based on section title/type
- Custom search functionality within Google Drive
- File metadata display (name, size, modified date)
- Insert file references into proposal content
- Connection status indicator and disconnect/reconnect functionality

**Export & Import:**
- Word document export with Claude formatting
- Section-level export to Word

**Security & Testing:**
- XSS protection and input sanitization
- Rate limiting for API endpoints
- Comprehensive logging configuration
- pytest testing infrastructure with test coverage for content and health endpoints

**UI/UX:**
- Responsive design with Tailwind CSS v4
- Enhanced filtering and tag management UX
- Track changes visualization
- Collapsible sections and content panels

🚧 **Planned:**
- Word document import (export completed)
- Vector embeddings with Qdrant for semantic search
- Multi-user support with authentication
- Advanced collaboration features

## Tech Stack

### Backend
- **Framework:** FastAPI (Python)
- **Database:** SQLite (development) / PostgreSQL (production)
- **ORM:** SQLAlchemy
- **Migrations:** Alembic
- **AI:** Anthropic Claude 3.5 Sonnet
- **Integrations:** Google Drive API (OAuth 2.0)
- **Testing:** pytest with asyncio support
- **Security:** Rate limiting, XSS protection, structured logging
- **Vector DB:** Qdrant (planned)

### Frontend
- **Framework:** React 19 + TypeScript
- **Styling:** Tailwind CSS v4
- **Rich Text Editor:** TipTap
- **Data Fetching:** TanStack Query (React Query)
- **HTTP Client:** Axios
- **Build Tool:** Vite

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL (optional, SQLite works for development)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` and add your API keys:**
   ```env
   ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   DATABASE_URL=sqlite:///./proposal_db.sqlite
   ```

5. **Initialize the database:**
   ```bash
   # Create tables and seed sample data
   python init_db.py --drop --seed
   ```

6. **Run the backend server:**
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   Backend will be available at: http://localhost:8000
   API docs at: http://localhost:8000/docs

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

   Frontend will be available at: http://localhost:5173

## Usage Guide

### Creating Content Blocks

1. Open the application at http://localhost:5173
2. Click the **"New Content"** button
3. Fill in:
   - **Title**: Name for your content block
   - **Section Type**: Choose from dropdown (Technical Approach, Past Performance, etc.)
   - **Content**: Use the rich text editor to write or paste content

4. Use formatting tools:
   - **Body Text** (T icon): Convert to normal paragraph
   - **H1, H2, H3**: Heading styles (14pt, 12pt, 11pt)
   - **B, I**: Bold and italic
   - **Lists**: Bullet and numbered lists
   - **Table**: Insert 3x3 table
   - **Clear Formatting**: Remove all styles

5. Click **"Create Content Block"** to save

### Using Claude AI Assistant

In the Content Editor modal, you'll see the **Claude AI Assistant** panel on the right:

#### Draft New Content
1. Enter a prompt describing what you need:
   ```
   Write a technical approach for modernizing a SCADA system for
   a water treatment facility, focusing on cybersecurity and zero downtime
   ```
2. Click **"Draft Content"**
3. Claude will generate professional proposal content

#### Improve Existing Content
1. Write or paste some initial content in the editor
2. In the Claude prompt, describe what to improve:
   ```
   Make this more persuasive and add specific benefits
   ```
3. Click **"Improve Content"**
4. Claude will enhance your content

#### Expand Content
1. Have some content in the editor
2. Enter expansion instructions:
   ```
   Add more technical detail about the implementation phases
   ```
3. Click **"Expand Content"**
4. Claude will add more detail while maintaining style

### Using Google Drive Integration

The Google Drive integration allows you to search and reference files from your Google Drive while building proposals.

#### Setting Up Google Drive
1. Follow the complete setup guide in `GOOGLE_DRIVE_SETUP.md`
2. Configure OAuth credentials in Google Cloud Console
3. Add credentials to `backend/.env`
4. Restart the backend server

#### Connecting Your Google Drive
1. Open a proposal and click **"Add Content"** on any section
2. In the section content modal, click the **"Connect Google Drive"** button in the header
3. Authorize access in the Google OAuth window
4. Once connected, the status will show "Connected to Google Drive"

#### Finding Relevant Content
1. When editing a section, the **Google Drive Suggestions** panel appears on the right
2. The system automatically searches for files related to your section title and type
3. Enter custom search terms and click **"Search"** to find specific content
4. Click on any file to insert a reference link into your content
5. Click the external link icon to open the file directly in Google Drive

#### Managing Your Connection
- View connection status in the section content modal header
- Click the logout icon to disconnect
- Toggle the suggestions panel on/off using the panel icon

## Current Status

### 🎉 Recently Completed

**Google Drive Integration (Latest):**
- Full OAuth 2.0 authentication flow
- Intelligent file search based on proposal sections
- Side panel suggestions in content editor
- File reference insertion into proposals
- Complete documentation in `GOOGLE_DRIVE_SETUP.md`

**Security & Testing Infrastructure:**
- XSS protection with HTML sanitization
- Rate limiting middleware for API protection
- Structured logging with rotation
- pytest test suite with fixtures and coverage

**Enhanced Proposal Builder:**
- Content search modal for browsing content library
- Drag-and-drop section reordering
- In-line content editing with visual/HTML modes
- Edit and delete content functionality
- Section content management improvements

**Content Management Improvements:**
- Apply Filters functionality with tag counts
- Enhanced tag creation and filtering
- Version history with visual diff comparison
- Track changes for tags and section categories
- Advanced search and filtering capabilities

### 🔧 Configuration Required

**For Claude AI features:**
1. Create `.env` file: `cp backend/.env.example backend/.env`
2. Add your Anthropic API key:
   ```env
   ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   ```
3. Restart the backend server

**For Google Drive integration:**
1. Set up Google Cloud project and OAuth credentials (see `GOOGLE_DRIVE_SETUP.md`)
2. Add to `.env`:
   ```env
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5173/google-drive/callback
   ```
3. Run database migration: `cd backend && alembic upgrade head`

### 📋 Next Steps

**High Priority:**
1. **Word Document Import** - Import existing proposals (export already implemented)
2. **Semantic Search** - Qdrant integration for intelligent content discovery
3. **User Authentication** - Multi-user support with role-based access

**Future Enhancements:**
- Collaboration features (comments, suggestions)
- Advanced analytics and reporting
- Template management system
- Integration with additional cloud storage providers

## Development Notes

### Running Both Servers

You need TWO terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Accessing Services

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Key Files Reference

### Backend
- Main app: `backend/app/main.py`
- Config: `backend/app/core/config.py`
- Database models: `backend/app/models/`
- API endpoints:
  - Content: `backend/app/api/content.py`
  - Proposals: `backend/app/api/proposals.py`
  - Google Drive: `backend/app/api/google_drive.py`
- Services:
  - Claude AI: `backend/app/services/claude_service.py`
  - Google Drive: `backend/app/services/google_drive_service.py`
- Database migrations: `backend/alembic/versions/`
- Tests: `backend/tests/`

### Frontend
- Pages:
  - Repository: `frontend/src/pages/repository/RepositoryPage.tsx`
  - Proposal Builder: `frontend/src/pages/proposal/ProposalPage.tsx`
  - Google Drive Callback: `frontend/src/pages/GoogleDriveCallback.tsx`
- Components:
  - Content Editor: `frontend/src/components/ContentEditorModal.tsx`
  - Content Search: `frontend/src/components/ContentSearchModal.tsx`
  - Section Content: `frontend/src/components/SectionContentModal.tsx`
  - Google Drive Connect: `frontend/src/components/GoogleDriveConnect.tsx`
  - Google Drive Suggestions: `frontend/src/components/GoogleDriveSuggestions.tsx`
  - Rich Text Editor: `frontend/src/components/common/RichTextEditor.tsx`
- Services:
  - Content: `frontend/src/services/contentService.ts`
  - Proposals: `frontend/src/services/proposalService.ts`
  - Google Drive: `frontend/src/services/googleDriveService.ts`
- Security: `frontend/src/utils/sanitizer.ts`

## Troubleshooting

### Claude AI not working
1. Verify `ANTHROPIC_API_KEY` is set in `backend/.env`
2. Backend must be restarted after adding API key
3. Check backend logs for API errors

### Google Drive integration issues

**"Google OAuth credentials not configured" error:**
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `backend/.env`
- Restart the backend server after adding credentials
- See `GOOGLE_DRIVE_SETUP.md` for complete setup instructions

**OAuth callback not working:**
- Verify redirect URI in Google Cloud Console matches: `http://localhost:5173/google-drive/callback`
- Ensure frontend is running on port 5173
- Check browser console for error messages

**"Failed to search Google Drive" error:**
- Verify you're connected to Google Drive (check connection status)
- Ensure Google Drive API is enabled in your GCP project
- Token may have expired - disconnect and reconnect

**No files found in search:**
- Try different search terms
- Verify you have documents in your Google Drive
- Search supports: Google Docs, PDFs, Word documents, and presentations

### Database migration issues
- Run `cd backend && alembic current` to check current migration
- Run `cd backend && alembic upgrade head` to apply all migrations
- If migrations fail, check database connection in `.env`

### CORS errors
Frontend URL must be in CORS_ORIGINS (default includes localhost:5173-5175)
