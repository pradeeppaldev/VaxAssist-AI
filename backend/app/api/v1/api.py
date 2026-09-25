from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, admin, families

api_router = APIRouter()
api_router.include_router(health.router, tags=["System Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Profile"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administrator Management"])
api_router.include_router(families.router, prefix="/families", tags=["Family & Patient Management"])
