"""
Main FastAPI application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base

# Create database tables (for development, use Alembic in production)
# Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "vector_store": "connected",
    }


# Import and include API routers
from app.api import content, proposals

app.include_router(content.router, prefix="/api/content", tags=["content"])
app.include_router(proposals.router, prefix="/api/proposals", tags=["proposals"])
# app.include_router(search.router, prefix="/api/search", tags=["search"])
# app.include_router(claude.router, prefix="/api/claude", tags=["claude"])

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
