# Proposal Content Repository & Builder

A full-stack application for managing and building government proposal content using AI assistance from Claude.

## Project Overview

This system provides a content repository for storing, organizing, and reusing proposal content blocks. It includes rich text editing capabilities and AI-powered content generation to help proposal writers draft, improve, and expand content quickly.

### Key Features

✅ **Completed:**
- Content Repository with search and filtering
- Rich text editor with TipTap (headings, bold, italic, lists, tables)
- Content block CRUD operations (Create, Read, Update, Delete)
- Tag system for categorizing content
- Version history for content blocks
- Claude AI integration for content generation (draft, improve, expand)
- Responsive UI with Tailwind CSS

🚧 **In Progress / Planned:**
- Tag management UI
- Delete/archive functionality UI
- Word document import
- Proposal builder interface
- Vector embeddings with Qdrant for semantic search

## Tech Stack

### Backend
- **Framework:** FastAPI (Python)
- **Database:** SQLite (development) / PostgreSQL (production)
- **ORM:** SQLAlchemy
- **Migrations:** Alembic
- **AI:** Anthropic Claude 3.5 Sonnet
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

## Current Status

### ✅ Completed Today

1. **Rich Text Editor Implementation**
   - TipTap integration with all required formatting
   - Custom font sizes (H1: 14pt, H2: 12pt, H3: 11pt, Body: 11pt)
   - Body text and clear formatting buttons
   - Scrollbar for large content blocks

2. **Content Editor Modal**
   - Full create/edit interface
   - Form validation
   - Save functionality

3. **Claude AI Backend Integration**
   - Created claude_service.py with Anthropic API integration
   - API endpoint at /api/content/ai/generate
   - Support for draft, improve, and expand actions
   - Intelligent system prompts per section type
   - HTML output format for TipTap compatibility

4. **Frontend AI Integration**
   - Connected Content Editor to Claude AI endpoint
   - Real-time content generation
   - Error handling

### 🔧 Configuration Required

**Before testing Claude AI features, you must:**

1. Create `.env` file in backend directory:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Add your Anthropic API key to `.env`:
   ```env
   ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   ```

3. Restart the backend server

### 📋 Next Steps (Priorities for Tomorrow)

1. **Test Claude AI Features** - After configuring API key
2. **Tag Management UI** - Add/edit/assign tags to content blocks
3. **Delete/Archive Functionality** - Implement soft delete UI
4. **Word Document Import** - Use python-docx to import existing proposals
5. **Proposal Builder** - Interface for assembling proposals from content blocks
6. **Semantic Search** - Qdrant integration for intelligent content search

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
- Content API: `backend/app/api/content.py`
- Claude service: `backend/app/services/claude_service.py`

### Frontend
- Repository page: `frontend/src/pages/repository/RepositoryPage.tsx`
- Content editor: `frontend/src/components/ContentEditorModal.tsx`
- Rich text editor: `frontend/src/components/common/RichTextEditor.tsx`
- Content service: `frontend/src/services/contentService.ts`

## Troubleshooting

### Claude AI not working
1. Verify `ANTHROPIC_API_KEY` is set in `backend/.env`
2. Backend must be restarted after adding API key
3. Check backend logs for API errors

### CORS errors
Frontend URL must be in CORS_ORIGINS (default includes localhost:5173-5175)
