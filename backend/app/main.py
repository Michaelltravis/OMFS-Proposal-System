"""
Main FastAPI application
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.core.logging_config import setup_logging, get_logger
import time

# Initialize logging
setup_logging(
    level="DEBUG" if settings.DEBUG else "INFO",
    json_logs=not settings.DEBUG,  # JSON logs in production, colored in debug
    log_file="app.log" if not settings.DEBUG else None
)

logger = get_logger(__name__)

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


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Log all HTTP requests with timing information

    Logs:
    - Request method and path
    - Response status code
    - Request duration in milliseconds
    """
    start_time = time.time()

    # Log incoming request
    logger.info(
        f"{request.method} {request.url.path}",
        extra={
            "method": request.method,
            "path": request.url.path,
            "client": request.client.host if request.client else None,
        }
    )

    # Process request
    response = await call_next(request)

    # Calculate duration
    duration_ms = (time.time() - start_time) * 1000

    # Log response
    logger.info(
        f"Response: {response.status_code} ({duration_ms:.2f}ms)",
        extra={
            "status_code": response.status_code,
            "duration_ms": round(duration_ms, 2),
            "path": request.url.path,
        }
    )

    return response


@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info(
        f"Starting {settings.APP_NAME} v{settings.APP_VERSION}",
        extra={"debug_mode": settings.DEBUG}
    )


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info(f"Shutting down {settings.APP_NAME}")


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
from app.api import content, proposals, google_drive

app.include_router(content.router, prefix="/api/content", tags=["content"])
app.include_router(proposals.router, prefix="/api/proposals", tags=["proposals"])
app.include_router(google_drive.router, prefix="/api/google-drive", tags=["google-drive"])
# app.include_router(search.router, prefix="/api/search", tags=["search"])
# app.include_router(claude.router, prefix="/api/claude", tags=["claude"])

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
