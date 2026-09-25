from datetime import datetime, timezone
from fastapi import APIRouter
from app.config import settings
from app.database.mongodb import db_manager
from app.schemas.common import HealthCheckResponse

router = APIRouter()


@router.get("/health", response_model=HealthCheckResponse, summary="System Health Check")
async def health_check():
    """Returns the operational status of the FastAPI application and connected database."""
    db_status = await db_manager.ping()
    
    return HealthCheckResponse(
        status="healthy" if db_status.get("status") == "connected" else "degraded",
        service=settings.PROJECT_NAME,
        version="1.0.0",
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc),
        database=db_status,
    )
