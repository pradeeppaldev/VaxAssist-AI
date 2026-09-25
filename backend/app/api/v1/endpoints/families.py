from typing import List
from fastapi import APIRouter, Depends, Path, status
from app.api.deps import get_current_user, require_active_user
from app.schemas.common import APIResponse
from app.schemas.family import (
    FamilyCreateRequest,
    FamilyUpdateRequest,
    FamilyResponse,
    FamilyMemberCreateRequest,
    FamilyMemberUpdateRequest,
    FamilyMemberResponse,
)
from app.services.family_service import family_service

router = APIRouter(dependencies=[Depends(require_active_user)])


# =============================================================================
# Family Household Endpoints
# =============================================================================

@router.post(
    "",
    response_model=APIResponse[FamilyResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new family household profile",
)
async def create_family(
    req: FamilyCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a new family household managed by the current user."""
    family = await family_service.create_family(
        owner_user_id=current_user["id"],
        owner_name=current_user["name"],
        req=req,
    )
    return APIResponse[FamilyResponse](
        success=True,
        message="Family profile created successfully.",
        data=FamilyResponse(**family),
    )


@router.get(
    "/me",
    response_model=APIResponse[FamilyResponse],
    summary="Get current user's family household profile",
)
async def get_my_family(
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieves the current user's family profile.
    Automatically provisions default family if none has been explicitly created yet.
    """
    family = await family_service.get_or_create_default_family(
        owner_user_id=current_user["id"],
        owner_name=current_user["name"],
    )
    return APIResponse[FamilyResponse](
        success=True,
        message="Family profile retrieved successfully.",
        data=FamilyResponse(**family),
    )


@router.patch(
    "/me",
    response_model=APIResponse[FamilyResponse],
    summary="Update current user's family household details",
)
async def update_my_family(
    req: FamilyUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Updates family name and description for the current user's family."""
    updated = await family_service.update_family(
        owner_user_id=current_user["id"],
        req=req,
    )
    return APIResponse[FamilyResponse](
        success=True,
        message="Family profile updated successfully.",
        data=FamilyResponse(**updated),
    )


# =============================================================================
# Family Members Endpoints
# =============================================================================

@router.post(
    "/me/members",
    response_model=APIResponse[FamilyMemberResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Add a new family member to current user's family",
)
async def add_family_member(
    req: FamilyMemberCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Add a new member (child, spouse, parent, etc.) to the user's family."""
    # Ensure family exists first
    await family_service.get_or_create_default_family(
        owner_user_id=current_user["id"],
        owner_name=current_user["name"],
    )

    new_member = await family_service.add_member(
        owner_user_id=current_user["id"],
        req=req,
    )
    return APIResponse[FamilyMemberResponse](
        success=True,
        message=f"Family member '{new_member['full_name']}' added successfully.",
        data=FamilyMemberResponse(**new_member),
    )


@router.get(
    "/me/members",
    response_model=APIResponse[List[FamilyMemberResponse]],
    summary="List all family members for the current user's family",
)
async def list_family_members(
    current_user: dict = Depends(get_current_user),
):
    """List all members registered under the authenticated user's family."""
    members = await family_service.list_members(owner_user_id=current_user["id"])
    member_responses = [FamilyMemberResponse(**m) for m in members]
    return APIResponse[List[FamilyMemberResponse]](
        success=True,
        message=f"Retrieved {len(member_responses)} family members.",
        data=member_responses,
    )


@router.get(
    "/me/members/{member_id}",
    response_model=APIResponse[FamilyMemberResponse],
    summary="Get an individual family member",
)
async def get_family_member(
    member_id: str = Path(..., description="ID of the family member"),
    current_user: dict = Depends(get_current_user),
):
    """Get single member record. Strictly enforces that the member belongs to the current user."""
    member = await family_service.get_member(
        owner_user_id=current_user["id"],
        member_id=member_id,
        user_role=current_user.get("role"),
    )
    return APIResponse[FamilyMemberResponse](
        success=True,
        message="Family member details retrieved.",
        data=FamilyMemberResponse(**member),
    )


@router.patch(
    "/me/members/{member_id}",
    response_model=APIResponse[FamilyMemberResponse],
    summary="Update a family member's details",
)
async def update_family_member(
    member_id: str = Path(..., description="ID of the family member to update"),
    req: FamilyMemberUpdateRequest = ...,
    current_user: dict = Depends(get_current_user),
):
    """Update member profile. Strictly enforces ownership."""
    updated = await family_service.update_member(
        owner_user_id=current_user["id"],
        member_id=member_id,
        req=req,
        user_role=current_user.get("role"),
    )
    return APIResponse[FamilyMemberResponse](
        success=True,
        message=f"Family member '{updated['full_name']}' updated successfully.",
        data=FamilyMemberResponse(**updated),
    )


@router.delete(
    "/me/members/{member_id}",
    response_model=APIResponse[dict],
    summary="Delete a family member",
)
async def delete_family_member(
    member_id: str = Path(..., description="ID of the family member to delete"),
    current_user: dict = Depends(get_current_user),
):
    """Deletes member record. Strictly enforces ownership."""
    await family_service.delete_member(
        owner_user_id=current_user["id"],
        member_id=member_id,
        user_role=current_user.get("role"),
    )
    return APIResponse[dict](
        success=True,
        message="Family member removed successfully.",
        data={"deleted_member_id": member_id},
    )
