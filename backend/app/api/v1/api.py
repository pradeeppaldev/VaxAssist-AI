from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    admin,
    families,
    vaccinations,
    notifications,
    knowledge,
    agents,
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["System Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Profile"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administrator Management"])
api_router.include_router(families.router, prefix="/families", tags=["Family & Patient Management"])
api_router.include_router(vaccinations.router, prefix="/vaccinations", tags=["Vaccination Management & Schedule Engine"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Proactive Monitoring & Notifications"])
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["Knowledge Base & RAG Engine"])
api_router.include_router(agents.router, prefix="/agents", tags=["AI Agents Architecture"])
