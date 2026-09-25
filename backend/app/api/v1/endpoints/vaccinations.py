from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, Path, Query, status
from app.api.deps import get_current_user, require_active_user
from app.schemas.common import APIResponse
from app.schemas.vaccination import (
    VaccinationRecordCreateRequest,
    VaccinationRecordUpdateRequest,
    VaccinationRecordResponse,
    MemberScheduleResponse,
)
from app.services.vaccination_service import vaccination_service
from app.services.schedule_catalog import STANDARD_VACCINATION_SCHEDULE

router = APIRouter(dependencies=[Depends(require_active_user)])


@router.get(
    "/catalog",
    response_model=APIResponse[List[dict]],
    summary="Get official vaccination schedule catalog",
)
async def get_schedule_catalog(
    category: Optional[str] = Query(None, description="Optional category filter: UNIVERSAL_NIS, CONDITIONAL_NIS, PRIVATE_OPTIONAL"),
):
    """Returns the immutable WHO / National Immunization Schedule rules catalogue."""
    from app.services.schedule_catalog import ALL_VACCINE_CATALOG, get_catalog
    data = get_catalog(category=category) if category else ALL_VACCINE_CATALOG
    return APIResponse[List[dict]](
        success=True,
        message="Vaccination catalog retrieved successfully.",
        data=data,
    )


# =============================================================================
# Member Vaccination Records & Schedule Endpoints
# =============================================================================

@router.post(
    "/member/{member_id}",
    response_model=APIResponse[VaccinationRecordResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Record an administered vaccination dose for a family member",
)
async def add_vaccination_record(
    member_id: str = Path(..., description="ID of the family member"),
    req: VaccinationRecordCreateRequest = ...,
    current_user: dict = Depends(get_current_user),
):
    """
    Records an administered vaccine dose.
    - Validates ownership of family member.
    - Validates date cannot be in future or prior to member DOB.
    - Rejects duplicate doses.
    """
    record = await vaccination_service.add_record(
        owner_user_id=current_user["id"],
        member_id=member_id,
        req=req,
        user_role=current_user.get("role"),
    )
    return APIResponse[VaccinationRecordResponse](
        success=True,
        message=f"Recorded dose {record['dose_number']} of '{record['vaccine_name']}' successfully.",
        data=VaccinationRecordResponse(**record),
    )


@router.get(
    "/member/{member_id}",
    response_model=APIResponse[List[VaccinationRecordResponse]],
    summary="List all administered vaccination records for a family member",
)
async def list_member_records(
    member_id: str = Path(..., description="ID of the family member"),
    current_user: dict = Depends(get_current_user),
):
    """Lists all administered records for a family member. Enforces family ownership."""
    records = await vaccination_service.list_records_for_member(
        owner_user_id=current_user["id"],
        member_id=member_id,
        user_role=current_user.get("role"),
    )
    return APIResponse[List[VaccinationRecordResponse]](
        success=True,
        message=f"Retrieved {len(records)} vaccination records.",
        data=[VaccinationRecordResponse(**r) for r in records],
    )


@router.get(
    "/member/{member_id}/schedule",
    response_model=APIResponse[MemberScheduleResponse],
    summary="Get calculated deterministic vaccination schedule and status for a family member",
)
async def get_member_schedule(
    member_id: str = Path(..., description="ID of the family member"),
    reference_date: Optional[date] = Query(None, description="Optional reference date for calculation (defaults to today)"),
    eligible_for_je: bool = Query(False, description="Whether member is in a Japanese Encephalitis endemic district"),
    include_private: bool = Query(False, description="Whether to include private/IAP optional vaccines in schedule"),
    current_user: dict = Depends(get_current_user),
):
    """
    Deterministic Schedule Calculation:
    Produces member's entire immunization schedule with statuses (COMPLETED, DUE, OVERDUE, UPCOMING, MISSED),
    taking into account birth date, past administration history, strict birth-dose windows, and interval constraints.
    """
    schedule_data = await vaccination_service.get_member_schedule(
        owner_user_id=current_user["id"],
        member_id=member_id,
        reference_date=reference_date,
        user_role=current_user.get("role"),
        eligible_for_je=eligible_for_je,
        include_private_optional=include_private,
    )
    return APIResponse[MemberScheduleResponse](
        success=True,
        message="Vaccination schedule evaluated deterministically.",
        data=MemberScheduleResponse(**schedule_data),
    )


# =============================================================================
# Individual Record CRUD Endpoints
# =============================================================================

@router.get(
    "/records/{record_id}",
    response_model=APIResponse[VaccinationRecordResponse],
    summary="Get details of a specific vaccination record",
)
async def get_vaccination_record(
    record_id: str = Path(..., description="ID of the vaccination record"),
    current_user: dict = Depends(get_current_user),
):
    """Fetches single vaccination record. Verifies ownership."""
    record = await vaccination_service.get_record(
        owner_user_id=current_user["id"],
        record_id=record_id,
        user_role=current_user.get("role"),
    )
    return APIResponse[VaccinationRecordResponse](
        success=True,
        message="Record details retrieved.",
        data=VaccinationRecordResponse(**record),
    )


@router.patch(
    "/records/{record_id}",
    response_model=APIResponse[VaccinationRecordResponse],
    summary="Update a vaccination record",
)
async def update_vaccination_record(
    record_id: str = Path(..., description="ID of the vaccination record to update"),
    req: VaccinationRecordUpdateRequest = ...,
    current_user: dict = Depends(get_current_user),
):
    """Updates record details (e.g. batch number, provider, notes). Verifies ownership."""
    updated = await vaccination_service.update_record(
        owner_user_id=current_user["id"],
        record_id=record_id,
        req=req,
        user_role=current_user.get("role"),
    )
    return APIResponse[VaccinationRecordResponse](
        success=True,
        message="Vaccination record updated successfully.",
        data=VaccinationRecordResponse(**updated),
    )


@router.delete(
    "/records/{record_id}",
    response_model=APIResponse[dict],
    summary="Delete a vaccination record",
)
async def delete_vaccination_record(
    record_id: str = Path(..., description="ID of the vaccination record to delete"),
    current_user: dict = Depends(get_current_user),
):
    """Deletes vaccination record. Verifies ownership."""
    await vaccination_service.delete_record(
        owner_user_id=current_user["id"],
        record_id=record_id,
        user_role=current_user.get("role"),
    )
    return APIResponse[dict](
        success=True,
        message="Vaccination record deleted successfully.",
        data={"deleted_record_id": record_id},
    )
