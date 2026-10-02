from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Path
from app.api.deps import require_admin
from app.schemas.auth import (
    UserResponse,
    UserStatusUpdateRequest,
    UserRoleUpdateRequest,
)
from app.schemas.common import APIResponse
from app.services.user_service import user_service

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get(
    "/users",
    response_model=APIResponse[List[UserResponse]],
    summary="List all users with optional filtering",
)
async def list_users(
    role: Optional[str] = Query(None, description="Filter by role: PATIENT, HEALTHCARE_WORKER, ADMIN"),
    status: Optional[str] = Query(None, description="Filter by status: ACTIVE, PENDING, REJECTED, INACTIVE"),
    search: Optional[str] = Query(None, description="Search term across name, email, or license"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """Admin-only endpoint: list and inspect user accounts."""
    users = await user_service.list_users(
        role=role,
        status=status,
        search=search,
        skip=skip,
        limit=limit,
    )
    user_responses = [UserResponse(**u) for u in users]
    return APIResponse[List[UserResponse]](
        success=True,
        message=f"Retrieved {len(user_responses)} users",
        data=user_responses,
    )


@router.patch(
    "/users/{user_id}/status",
    response_model=APIResponse[UserResponse],
    summary="Update user account status (Approve, Reject, Activate, Deactivate)",
)
async def update_user_status(
    user_id: str = Path(..., description="ID of the user to update"),
    req: UserStatusUpdateRequest = ...,
):
    """
    Admin-only endpoint: Update a user's lifecycle status.
    - Used to approve or reject pending Healthcare Worker registrations.
    - Used to activate or deactivate user accounts.
    """
    updated_user = await user_service.update_status(
        user_id=user_id,
        new_status=req.account_status,
        reason=req.reason,
    )
    return APIResponse[UserResponse](
        success=True,
        message=f"User status successfully updated to '{req.account_status.value}'",
        data=UserResponse(**updated_user),
    )


@router.patch(
    "/users/{user_id}/role",
    response_model=APIResponse[UserResponse],
    summary="Update user system role",
)
async def update_user_role(
    user_id: str = Path(..., description="ID of the user to update"),
    req: UserRoleUpdateRequest = ...,
):
    """Admin-only endpoint: Controlled role management."""
    updated_user = await user_service.update_role(
        user_id=user_id,
        new_role=req.role,
    )
    return APIResponse[UserResponse](
        success=True,
        message=f"User role successfully updated to '{req.role.value}'",
        data=UserResponse(**updated_user),
    )


@router.get(
    "/settings/system-info",
    summary="Get sanitized system telemetry and configuration status",
)
async def get_system_settings_info():
    """
    Returns sanitized backend telemetry, database connection health,
    AI/RAG model configuration, and background notification status.
    Masks all secrets and identifies environment variables managed in Render.
    """
    from app.config import settings
    from app.database.mongodb import db_manager

    masked_gemini = (
        f"{settings.GEMINI_API_KEY[:6]}...{settings.GEMINI_API_KEY[-4:]}"
        if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 10
        else ("Configured" if settings.GEMINI_API_KEY else "Not Configured")
    )
    masked_brevo = (
        f"{settings.BREVO_API_KEY[:6]}...{settings.BREVO_API_KEY[-4:]}"
        if settings.BREVO_API_KEY and len(settings.BREVO_API_KEY) > 10
        else ("Configured" if settings.BREVO_API_KEY else "Not Configured")
    )

    db_ping = await db_manager.ping()

    return {
        "success": True,
        "message": "System settings retrieved successfully.",
        "data": {
            "app_info": {
                "name": settings.PROJECT_NAME,
                "version": "1.0.0",
                "environment": settings.ENVIRONMENT,
                "debug": settings.DEBUG,
                "api_prefix": settings.API_V1_STR,
                "host": settings.HOST,
                "port": settings.PORT,
            },
            "database": {
                "type": "MongoDB Atlas",
                "database_name": settings.MONGODB_DB_NAME,
                "connected": db_manager.is_connected,
                "status": db_ping.get("status", "unknown"),
                "latency_ms": db_ping.get("latency_ms", None),
            },
            "ai_rag": {
                "provider": settings.LLM_PROVIDER,
                "generation_model": settings.GEMINI_GENERATION_MODEL,
                "embedding_model": settings.GEMINI_EMBEDDING_MODEL,
                "gemini_api_configured": bool(settings.GEMINI_API_KEY),
                "gemini_api_key_masked": masked_gemini,
                "vector_store_type": "ChromaDB Persistent Client",
                "chroma_persist_dir": settings.CHROMA_PERSIST_DIRECTORY,
                "knowledge_storage_dir": settings.KNOWLEDGE_STORAGE_DIRECTORY,
                "collection_name": settings.CHROMA_COLLECTION_NAME,
                "rag_top_k": settings.RAG_TOP_K,
                "chunk_size_chars": settings.CHUNK_SIZE_CHARS,
                "chunk_overlap_chars": settings.CHUNK_OVERLAP_CHARS,
            },
            "notifications": {
                "brevo_configured": bool(settings.BREVO_API_KEY),
                "brevo_key_masked": masked_brevo,
                "brevo_sender_email": settings.BREVO_SENDER_EMAIL,
                "brevo_sender_name": settings.BREVO_SENDER_NAME,
                "brevo_sms_sender": settings.BREVO_SMS_SENDER_NAME,
                "email_dispatch_enabled": settings.BREVO_EMAIL_ENABLED,
                "sms_dispatch_enabled": settings.BREVO_SMS_ENABLED,
            },
            "scheduler": {
                "background_scheduler_enabled": settings.ENABLE_BACKGROUND_SCHEDULER,
                "monitoring_interval_minutes": settings.MONITORING_INTERVAL_MINUTES,
                "default_lead_days": settings.DEFAULT_REMINDER_LEAD_DAYS,
            },
            "security": {
                "jwt_algorithm": settings.JWT_ALGORITHM,
                "token_expire_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
                "cors_origins": settings.BACKEND_CORS_ORIGINS if isinstance(settings.BACKEND_CORS_ORIGINS, list) else [settings.BACKEND_CORS_ORIGINS],
                "auto_bootstrap_admin": settings.AUTO_BOOTSTRAP_ADMIN,
                "admin_email": settings.ADMIN_EMAIL,
            },
            "render_env_guide": [
                {
                    "key": "MONGODB_URI",
                    "description": "MongoDB Atlas connection string with auth credentials",
                    "configured": bool(settings.MONGODB_URI and "mongodb" in settings.MONGODB_URI),
                    "scope": "Render Dashboard -> Environment",
                },
                {
                    "key": "GEMINI_API_KEY",
                    "description": "Google AI Studio API key for Gemini RAG & embeddings",
                    "configured": bool(settings.GEMINI_API_KEY),
                    "scope": "Render Dashboard -> Environment",
                },
                {
                    "key": "BREVO_API_KEY",
                    "description": "Brevo Transactional SMTP/SMS API key for proactive reminders",
                    "configured": bool(settings.BREVO_API_KEY),
                    "scope": "Render Dashboard -> Environment",
                },
                {
                    "key": "JWT_SECRET_KEY",
                    "description": "Cryptographic HMAC secret for signing access tokens",
                    "configured": bool(settings.JWT_SECRET_KEY),
                    "scope": "Render Dashboard -> Environment",
                },
                {
                    "key": "ENVIRONMENT",
                    "description": "Application environment (production / development)",
                    "configured": True,
                    "scope": "Render Dashboard -> Environment",
                },
                {
                    "key": "BACKEND_CORS_ORIGINS",
                    "description": "Allowed origins for CORS (Vercel domains & local dev)",
                    "configured": True,
                    "scope": "Render Dashboard -> Environment",
                },
            ],
        },
    }
