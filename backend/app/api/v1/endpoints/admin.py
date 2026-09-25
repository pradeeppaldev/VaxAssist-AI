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
