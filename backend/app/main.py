import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1.api import api_router
from app.database.mongodb import db_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("vaxassist.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    logger.info("Initializing VaxAssist AI application...")
    await db_manager.connect()
    # Bootstrap initial admin if configured and database is connected
    if db_manager.is_connected:
        from app.services.user_service import user_service
        from app.services.family_service import family_service
        await user_service.bootstrap_admin()
        await family_service.init_indexes()
    yield
    # Shutdown: Close database connections
    logger.info("Shutting down VaxAssist AI application...")
    await db_manager.disconnect()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Digital Vaccination Tracking, Reminder and Multi-Agent AI Assistance System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Configure CORS
origins = settings.BACKEND_CORS_ORIGINS
if isinstance(origins, str):
    origins = [origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", summary="Root status check")
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "status": "online",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
    }
