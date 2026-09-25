from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, admin

api_router = APIRouter()
api_router.include_router(health.router, tags=["System Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Profile"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administrator Management"])
