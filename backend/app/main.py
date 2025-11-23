"""Main FastAPI application for Surreal backend."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import router
from app.config import settings
from app.utils import logger, setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """
    Application lifespan events.

    Handles startup and shutdown logic.
    """
    # Startup
    logger.info("Starting Surreal Backend API...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Log Level: {settings.LOG_LEVEL}")

    # Validate environment variables
    try:
        assert settings.GEMINI_API_KEY, "GEMINI_API_KEY not set"
        assert settings.BRAVE_API_KEY, "BRAVE_API_KEY not set"
        logger.info("Environment variables validated")
    except AssertionError as e:
        logger.error(f"Configuration error: {str(e)}")
        logger.error("Please check your .env file")

    # Optional: Test MongoDB connection
    if settings.MONGODB_URI and settings.MONGODB_URI != "mongodb://localhost:27017":
        logger.info("MongoDB URI configured (persistence enabled)")
    else:
        logger.warning("MongoDB not configured (using in-memory state only)")

    logger.info("Surreal Backend API started successfully")

    yield

    # Shutdown
    logger.info("Shutting down Surreal Backend API...")
    logger.info("Cleanup complete")


# Create FastAPI application
app = FastAPI(
    title="Surreal Backend API",
    description="Active Inference Knowledge Graph Engine",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(router)


# Root endpoint
@app.get("/")
async def root() -> dict:
    """Root endpoint with API information."""
    return {
        "message": "Surreal Backend API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/api/health",
        "environment": settings.ENVIRONMENT,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.is_development,
        log_level=settings.LOG_LEVEL.lower(),
    )
