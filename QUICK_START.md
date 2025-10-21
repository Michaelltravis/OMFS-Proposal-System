# Quick Start Guide

## Start Development Servers

### Terminal 1 - Backend
```bash
cd C:\Users\micha\proposal-system\backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 - Frontend
```bash
cd C:\Users\micha\proposal-system\frontend
npm run dev
```

## Access Points

- **App**: http://localhost:5173
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## First Time Setup

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add ANTHROPIC_API_KEY
python init_db.py --drop --seed
```

### 2. Frontend
```bash
cd frontend
npm install
```

## Key Features

### Content Management
1. View content blocks in main library
2. Click "New Content" to create
3. Click any block to view details
4. Click "Edit" to modify

### Rich Text Editor
- **T** = Body text
- **H1/H2/H3** = Headings
- **B/I** = Bold/Italic
- **Lists** = Bullet/Numbered
- **Table** = Insert table
- **Clear** = Remove formatting

### Claude AI
1. Enter prompt in Claude panel
2. Choose: Draft, Improve, or Expand
3. Wait for generation
4. Edit and save

## Important Files

### Backend
- Config: `backend/app/core/config.py`
- Content API: `backend/app/api/content.py`
- Claude Service: `backend/app/services/claude_service.py`
- Models: `backend/app/models/content.py`

### Frontend
- Main Page: `frontend/src/pages/repository/RepositoryPage.tsx`
- Editor: `frontend/src/components/ContentEditorModal.tsx`
- Rich Text: `frontend/src/components/common/RichTextEditor.tsx`
- API Service: `frontend/src/services/contentService.ts`

## Common Commands

```bash
# Reset database
cd backend && python init_db.py --drop --seed

# Backend dependencies
cd backend && pip install -r requirements.txt

# Frontend dependencies
cd frontend && npm install

# Database migration
cd backend && alembic upgrade head
```

## Environment Variables

Edit `backend/.env`:
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
DATABASE_URL=sqlite:///./proposal_db.sqlite
DEBUG=True
```

## Project Structure
```
proposal-system/
├── backend/          # FastAPI Python backend
│   ├── app/
│   │   ├── api/      # API endpoints
│   │   ├── models/   # Database models
│   │   ├── services/ # Business logic
│   │   └── main.py   # App entry
│   └── .env          # Environment config
│
└── frontend/         # React TypeScript frontend
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── services/
    └── package.json
```

## Status

✅ Working:
- Content CRUD
- Rich text editing
- Search/filtering
- Version history

🔧 Needs Setup:
- Claude AI (API key required)

📋 Todo:
- Tag management UI
- Delete/archive UI
- Word import
- Proposal builder
