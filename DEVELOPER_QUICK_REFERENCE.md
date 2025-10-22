# Developer Quick Reference Guide

**Quick access to common development tasks and patterns**

---

## 🚀 Getting Started (Daily Development)

```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Tests (optional)
cd backend
pytest --watch  # Or run manually
```

---

## 🛡️ Security: Always Sanitize HTML

```typescript
// ALWAYS use this pattern for rendering HTML:
import { sanitizeHtml } from '../utils/sanitizer';

<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />

// ❌ NEVER do this:
<div dangerouslySetInnerHTML={{ __html: content }} />  // UNSAFE!
```

---

## 🧪 Testing: Write Tests for New Features

```python
# Create: backend/tests/test_my_feature.py

def test_my_feature(client, test_db):
    """Test description"""
    # Arrange
    data = {"field": "value"}

    # Act
    response = client.post("/api/endpoint", json=data)

    # Assert
    assert response.status_code == 201
    assert response.json()["field"] == "value"
```

```bash
# Run tests
pytest                              # All tests
pytest tests/test_my_feature.py    # Specific file
pytest -v                          # Verbose
pytest --cov=app                   # With coverage
```

---

## 📊 Logging: Log Important Operations

```python
# At top of file
from app.core.logging_config import get_logger

logger = get_logger(__name__)

# In your functions
def my_function(user_id: int):
    logger.info(f"Processing user {user_id}")

    try:
        # Your code
        logger.debug("Debug info", extra={"user_id": user_id})
    except Exception as e:
        logger.exception(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Error message")
```

---

## 🔧 Error Handling Pattern

```python
from fastapi import HTTPException
from app.core.logging_config import get_logger

logger = get_logger(__name__)

def my_endpoint():
    try:
        result = do_something()
        logger.info("Success")
        return result

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail="User-friendly message")

    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal error")
```

---

## 📝 Common Commands

### Backend:
```bash
cd backend

# Run server
python -m uvicorn app.main:app --reload

# Run tests
pytest
pytest -v                    # Verbose
pytest --cov=app            # With coverage
pytest -k "test_create"     # Match pattern
pytest tests/test_content.py::TestContentBlockCRUD::test_create_content_block  # Specific test

# Code quality
black app/                   # Format code
flake8 app/                 # Lint code

# Database
python init_db.py --drop --seed    # Reset and seed DB
alembic upgrade head                 # Run migrations
```

### Frontend:
```bash
cd frontend

npm run dev                 # Dev server
npm run build               # Production build
npm run preview             # Preview build
```

---

## 🎯 Development Checklist

Before committing code:

- [ ] HTML rendering uses `sanitizeHtml()`
- [ ] New API endpoints have tests
- [ ] Important operations are logged
- [ ] Errors are handled properly with HTTP exceptions
- [ ] Run `pytest` - all tests pass
- [ ] Code formatted with `black app/`

---

## 📦 Project Structure

```
backend/
├── app/
│   ├── api/              # API endpoints
│   ├── models/           # Database models
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # Business logic
│   ├── core/             # Core config, logging, database
│   └── main.py          # Application entry point
└── tests/               # Test files

frontend/
├── src/
│   ├── pages/           # Page components
│   ├── components/      # Reusable components
│   ├── services/        # API clients
│   ├── types/           # TypeScript types
│   └── utils/           # Utilities (sanitizer, etc.)
```

---

## 🔍 Debugging Tips

### Backend:
```python
# Add breakpoint
import pdb; pdb.set_trace()

# Check logs
tail -f app.log            # If logging to file

# SQL queries
# Set DEBUG=True in .env to see SQL queries in logs
```

### Frontend:
```typescript
// Console logging
console.log('Debug:', data);

// React Query DevTools (already configured)
// Check network tab for API calls
```

---

## 🆘 Common Issues

**"ModuleNotFoundError: No module named 'X'"**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend build errors**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Database locked**
```bash
# Kill any running processes using the DB
rm backend/proposal.db  # If needed (will lose data)
python backend/init_db.py --drop --seed
```

**Tests failing**
```bash
# Run with verbose output
pytest -v -s

# Run specific test
pytest tests/test_file.py::test_function_name -v
```

---

## 📚 Key Files to Know

| File | Purpose |
|------|---------|
| `frontend/src/utils/sanitizer.ts` | HTML sanitization (XSS protection) |
| `backend/app/core/logging_config.py` | Logging configuration |
| `backend/tests/conftest.py` | Test fixtures and configuration |
| `backend/app/core/config.py` | Application settings |
| `backend/app/main.py` | FastAPI app and middleware |

---

## 🎨 Code Style

### Python:
- Use `black` for formatting: `black app/`
- Use type hints: `def func(x: int) -> str:`
- Docstrings for complex functions
- Log important operations

### TypeScript:
- Use TypeScript interfaces for type safety
- Sanitize all HTML before rendering
- Use React Query for server state
- Component names in PascalCase

---

## 🔐 Security Checklist

- [ ] All HTML rendering uses `sanitizeHtml()`
- [ ] No secrets in code (use `.env`)
- [ ] Input validation on all endpoints
- [ ] Error messages don't expose internals
- [ ] Logs don't contain sensitive data

---

## 📖 More Resources

- Full documentation: `SECURITY_IMPROVEMENTS.md`
- Setup guide: `docs/SETUP_GUIDE.md`
- API documentation: http://localhost:8000/docs (when running)

---

**Happy coding! 🚀**
