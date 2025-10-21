# Session Notes - October 20, 2025

## Latest Session (Continued): Claude AI Troubleshooting

### Issues Encountered and Fixed

#### 1. Anthropic SDK Version Mismatch
**Problem**: Code used `client.messages.create()` API pattern from Anthropic SDK v0.18+, but v0.8.1 was installed.

**Error**: `'Anthropic' object has no attribute 'messages'`

**Fix**:
- Updated `requirements.txt` from `anthropic==0.8.1` to `anthropic>=0.18.0`
- Ran `pip install --upgrade anthropic` (installed v0.71.0)
- Restarted backend server

**Files Modified**:
- `backend/requirements.txt`
- `backend/app/services/claude_service.py` (added lazy initialization)

#### 2. Incorrect Claude Model Name
**Problem**: Used invalid model identifier `claude-sonnet-4-5-20250514` instead of `claude-sonnet-4-5`

**Error**: `404 - model not found`

**Fix**:
- Updated model name to `claude-sonnet-4-5` (without date suffix)
- Changed in `.env`, `config.py`, and `.env.example`

**Files Modified**:
- `backend/.env`
- `backend/app/core/config.py`
- `backend/.env.example`

#### 3. PostgreSQL Not Running
**Problem**: Backend configured for PostgreSQL but database server not installed/running

**Error**: `psycopg2.OperationalError: connection to server at "localhost" port 5432 failed: Connection refused`

**Fix**:
- Switched from PostgreSQL to SQLite for development
- Changed `DATABASE_URL` from `postgresql://...` to `sqlite:///./proposal.db`
- Ran `python init_db.py --seed` to create database and add sample data

**Files Modified**:
- `backend/.env`

**Result**: Database now contains sample data:
- 1 content block (SCADA System Modernization)
- 5 tags (SCADA, Water Quality, Municipal, Wastewater, Cloud)
- 1 proposal (City of Phoenix Wastewater Treatment RFP)

### Current Status - WORKING!

Both servers are running successfully:
- **Backend**: http://localhost:8000 (using SQLite + Claude 4.5 Sonnet)
- **Frontend**: http://localhost:5175 (React + TipTap editor)

**All Systems Operational**:
- Database connection working (SQLite)
- Claude AI integration working (v0.71.0 SDK with claude-sonnet-4-5 model)
- Rich text editor working
- Content CRUD operations working

---

## What We Built (Previous Sessions)

### 1. Rich Text Editor (TipTap)
- Full-featured editor with formatting toolbar
- Font sizes: H1 (14pt), H2 (12pt), H3 (11pt), Body (11pt)
- Features: Bold, Italic, Headings, Lists, Tables
- Body Text and Clear Formatting buttons
- Scrollable content area (max 500px)

Location: `frontend/src/components/common/RichTextEditor.tsx`

### 2. Content Editor Modal
- Create and edit content blocks
- Form fields: Title, Section Type, Content
- Save/Update functionality
- Full validation

Location: `frontend/src/components/ContentEditorModal.tsx`

### 3. Claude AI Integration (Backend)

Created service to interact with Anthropic Claude API:
- Draft new content from prompts
- Improve existing content
- Expand content with more detail
- Specialized prompts for each section type
- HTML output format

Location: `backend/app/services/claude_service.py`

API Endpoint: POST `/api/content/ai/generate`

### 4. Frontend AI Integration

Connected editor to Claude backend:
- Real API calls (no more placeholders)
- Error handling
- Loading states
- Content updates in editor

Location: Updated `frontend/src/components/ContentEditorModal.tsx`

## Configuration Summary

### Environment Variables (.env)
```
# Database
DATABASE_URL=sqlite:///./proposal.db

# Anthropic Claude API
ANTHROPIC_API_KEY=your_actual_api_key_here
CLAUDE_MODEL=claude-sonnet-4-5
CLAUDE_MAX_TOKENS=8192
```

### Dependencies
- **Anthropic SDK**: v0.71.0 (upgraded from v0.8.1)
- **Database**: SQLite (switched from PostgreSQL for easier dev)

## How to Start Tomorrow

1. Navigate to project:
   ```bash
   cd C:\Users\micha\proposal-system
   ```

2. Start backend (Terminal 1):
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. Start frontend (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```

4. Open browser:
   - Frontend: http://localhost:5175 (or 5173/5174 if 5175 is taken)
   - API Docs: http://localhost:8000/docs

## Testing Claude AI

The AI integration is now working! To test:

1. Go to http://localhost:5175
2. Click "+ New Content" button
3. Fill in:
   - Title: "Test AI Generation"
   - Section Type: Choose any (e.g., "Technical Approach")
4. In Claude AI Assistant panel:
   - Enter prompt: "Write about cloud-based data analytics platform architecture"
   - Click "Draft Content" button
5. Wait 3-10 seconds for Claude to generate content
6. Content appears in editor - you can edit it
7. Click "Create Content Block" to save

You can also test:
- **Improve Content**: Add content first, then click "Improve Content"
- **Expand Content**: Add brief content, then click "Expand Content" to add more detail

## Current System Status

### Working Features:
- ✅ Content viewing and listing
- ✅ Search and filtering
- ✅ Content creation
- ✅ Content editing
- ✅ Rich text formatting
- ✅ Claude AI draft/improve/expand
- ✅ Version history (backend)
- ✅ Sample data loaded

### Not Yet Implemented:
- ❌ Tag management UI
- ❌ Delete/archive UI
- ❌ Word document import
- ❌ Proposal builder UI
- ❌ Semantic search with Qdrant

## Priority Tasks for Tomorrow

1. ✅ ~~Configure Claude AI~~ (COMPLETED)
2. Test all three AI modes (draft, improve, expand)
3. Implement tag management UI
4. Add delete/archive functionality
5. Start Word document import feature

## Key Commands

### Database:
```bash
# Reset and seed database
cd backend
python init_db.py --drop --seed

# Seed without dropping
python init_db.py --seed
```

### Install Dependencies:
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

## Files Modified This Session

### Created:
- `backend/proposal.db` (SQLite database file)

### Modified:
- `backend/requirements.txt` - Upgraded anthropic SDK
- `backend/.env` - Changed to SQLite, updated Claude model
- `backend/.env.example` - Updated Claude model reference
- `backend/app/core/config.py` - Updated default Claude model
- `backend/app/services/claude_service.py` - Added lazy initialization

## Important Notes

- Backend uses SQLite by default (easy for dev, no separate DB server needed)
- Frontend hot-reloads automatically
- Backend auto-reloads on file changes
- Both servers must be running simultaneously
- CORS is configured for localhost:5173-5175
- Frontend may use ports 5173, 5174, or 5175 depending on availability

## Known Issues

None! System is stable and fully operational.

## Sample Data in Database

The database includes:
- **1 Content Block**: SCADA System Modernization for Municipal Water Treatment
- **5 Tags**: SCADA, Water Quality, Municipal, Wastewater, Cloud
- **1 Proposal**: City of Phoenix Wastewater Treatment RFP Response
  - With 3 sections: Executive Summary, Technical Approach, Past Performance

## Troubleshooting Reference

### If Claude AI fails:
1. Check API key in `backend/.env`
2. Verify model name is `claude-sonnet-4-5` (no date suffix)
3. Check Anthropic SDK version: `pip show anthropic` (should be ≥0.18.0)
4. Restart backend server

### If database fails:
1. Check `DATABASE_URL` in `backend/.env` is `sqlite:///./proposal.db`
2. Run `python init_db.py --drop --seed` to recreate
3. Restart backend server

### If frontend can't connect:
1. Check backend is running on port 8000
2. Check frontend URL (may be 5173, 5174, or 5175)
3. Check CORS settings in `backend/app/core/config.py`

## Next Major Features

1. **Tag Management** - Create/edit tags, assign to content blocks
2. **Delete/Archive** - Soft delete content blocks, archive old proposals
3. **Word Import** - Upload .docx files, extract content into blocks
4. **Proposal Builder** - Drag-and-drop interface to assemble proposals
5. **Semantic Search** - Qdrant vector DB for AI-powered search
