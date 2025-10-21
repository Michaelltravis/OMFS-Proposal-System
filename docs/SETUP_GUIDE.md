# Setup Guide

This guide will help you set up and run the Proposal Content Repository & Builder System.

## Prerequisites

1. **Python 3.11+** - [Download](https://www.python.org/downloads/)
2. **Node.js 18+** - [Download](https://nodejs.org/)
3. **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
4. **Qdrant** (Vector Database) - Via Docker (recommended)

## Step 1: Database Setup

### PostgreSQL

1. Install PostgreSQL
2. Create a new database:

```sql
CREATE DATABASE proposal_db;
CREATE USER proposal_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE proposal_db TO proposal_user;
```

### Qdrant (Vector Database)

Install and run Qdrant using Docker:

```bash
docker pull qdrant/qdrant
docker run -p 6333:6333 -p 6334:6334 \
    -v $(pwd)/qdrant_storage:/qdrant/storage \
    qdrant/qdrant
```

Alternatively, without Docker, download from: https://qdrant.tech/documentation/quick-start/

## Step 2: Backend Setup

1. Navigate to backend directory:

```bash
cd backend
```

2. Create and activate virtual environment:

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create environment file:

```bash
copy .env.example .env  # Windows
cp .env.example .env    # Mac/Linux
```

5. Edit `.env` file with your settings:

```env
DATABASE_URL=postgresql://proposal_user:your_password@localhost:5432/proposal_db
QDRANT_URL=http://localhost:6333
ANTHROPIC_API_KEY=your_claude_api_key_here
```

6. Run database migrations:

```bash
alembic upgrade head
```

7. Start the backend server:

```bash
python app/main.py
```

Or use uvicorn directly:

```bash
uvicorn app.main:app --reload
```

The backend API will be available at: `http://localhost:8000`
API documentation at: `http://localhost:8000/docs`

## Step 3: Frontend Setup

1. Open a new terminal and navigate to frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
copy .env.example .env  # Windows
cp .env.example .env    # Mac/Linux
```

4. Edit `.env` file:

```env
VITE_API_URL=http://localhost:8000
```

5. Start the development server:

```bash
npm run dev
```

The frontend will be available at: `http://localhost:5173`

## Step 4: Get Your Claude API Key

1. Go to: https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Add it to your backend `.env` file

## Step 5: Verify Installation

1. Open your browser to `http://localhost:5173`
2. Check that the backend API is responding at `http://localhost:8000/health`
3. Check the API documentation at `http://localhost:8000/docs`

## Troubleshooting

### Database Connection Error

- Verify PostgreSQL is running
- Check DATABASE_URL in `.env` file
- Ensure database and user exist

### Qdrant Connection Error

- Verify Qdrant is running: `docker ps` (if using Docker)
- Check QDRANT_URL in `.env` file
- Try accessing `http://localhost:6333` in your browser

### Frontend Can't Connect to Backend

- Verify backend is running on port 8000
- Check VITE_API_URL in frontend `.env` file
- Check browser console for CORS errors

### Python Package Installation Errors

- Ensure you're using Python 3.11+
- Try upgrading pip: `pip install --upgrade pip`
- On Windows, some packages may require Visual C++ Build Tools

## Development Workflow

### Backend Development

```bash
cd backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
uvicorn app.main:app --reload
```

### Frontend Development

```bash
cd frontend
npm run dev
```

### Database Migrations

After modifying models, create a new migration:

```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

## Next Steps

Once setup is complete:

1. Import your existing Word documents into the Content Repository
2. Create tags and categories for organizing content
3. Start building your first proposal
4. Explore Claude AI integration for content generation

## Additional Resources

- FastAPI Documentation: https://fastapi.tiangolo.com/
- React Documentation: https://react.dev/
- TipTap Editor: https://tiptap.dev/
- Anthropic Claude API: https://docs.anthropic.com/
