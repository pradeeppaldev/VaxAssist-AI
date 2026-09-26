"""
Notification & Proactive Monitoring API Endpoints (Phase 6).
Provides secure, authenticated access to notifications, unread metrics,
reminder preferences, and monitoring triggers.
"""
import logging
from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from app.api.deps import get_current_user
from app.models.user import UserRole
from app.schemas.common import APIResponse
from app.schemas.notification import (
    NotificationResponse,
    NotificationUnreadCountResponse,
    NotificationPreferenceResponse,
    NotificationPreferenceUpdateRequest,
    MonitoringRunRequest,
    MonitoringRunResponse,
)
from app.services.notification_service import notification_service
from app.services.monitoring_engine import monitoring_engine
from app.services.monitoring_scheduler import monitoring_scheduler

logger = logging.getLogger("vaxassist.api.notifications")

router = APIRouter()


@router.get(
    "",
    response_model=APIResponse[List[NotificationResponse]],
    summary="Get current user's notifications",
)
async def get_my_notifications(
    member_id: Optional[str] = Query(default=None, description="Filter by family member ID"),
    type: Optional[str] = Query(default=None, description="Filter by notification type"),
    priority: Optional[str] = Query(default=None, description="Filter by priority (LOW, MEDIUM, HIGH, URGENT)"),
    is_read: Optional[bool] = Query(default=None, description="Filter by read status"),
    limit: int = Query(default=50, ge=1, le=100, description="Max records to return"),
    skip: int = Query(default=0, ge=0, description="Records to skip"),
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieve authenticated user's notifications sorted chronologically descending.
    Strictly isolated to current user's household.
    """
    user_id = current_user["id"]
    notifications = await notification_service.get_user_notifications(
        user_id=user_id,
        member_id=member_id,
        notif_type=type,
        priority=priority,
        is_read=is_read,
        limit=limit,
        skip=skip,
    )
    data = [NotificationResponse(**n) for n in notifications]
    return APIResponse[List[NotificationResponse]](
        success=True,
        message=f"Retrieved {len(data)} notifications.",
        data=data,
    )


@router.get(
    "/unread-count",
    response_model=APIResponse[NotificationUnreadCountResponse],
    summary="Get unread notification count",
)
async def get_unread_notification_count(
    current_user: dict = Depends(get_current_user),
):
    """Returns total unread notification count for the current user."""
    count = await notification_service.get_unread_count(current_user["id"])
    return APIResponse[NotificationUnreadCountResponse](
        success=True,
        message="Unread notification count retrieved.",
        data=NotificationUnreadCountResponse(unread_count=count),
    )


@router.get(
    "/history",
    response_model=APIResponse[List[NotificationResponse]],
    summary="Get notification and reminder history",
)
async def get_notification_history(
    member_id: Optional[str] = Query(default=None, description="Filter by family member ID"),
    limit: int = Query(default=50, ge=1, le=100),
    skip: int = Query(default=0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    """Retrieve full audit log of dispatched reminders and clinical alerts."""
    user_id = current_user["id"]
    notifications = await notification_service.get_history(
        user_id=user_id,
        member_id=member_id,
        limit=limit,
        skip=skip,
    )
    data = [NotificationResponse(**n) for n in notifications]
    return APIResponse[List[NotificationResponse]](
        success=True,
        message=f"Retrieved {len(data)} notification history records.",
        data=data,
    )


@router.patch(
    "/{notification_id}/read",
    response_model=APIResponse[NotificationResponse],
    summary="Mark an individual notification as read",
)
async def mark_notification_read(
    notification_id: str = Path(..., description="ID of the notification"),
    current_user: dict = Depends(get_current_user),
):
    """
    Marks a notification as read.
    Enforces strict ownership check (cannot mark other users' notifications).
    """
    is_admin = current_user.get("role") == UserRole.ADMIN.value
    updated = await notification_service.mark_as_read(
        user_id=current_user["id"],
        notification_id=notification_id,
        is_admin=is_admin,
    )
    return APIResponse[NotificationResponse](
        success=True,
        message="Notification marked as read.",
        data=NotificationResponse(**updated),
    )


@router.patch(
    "/{notification_id}/acknowledge",
    response_model=APIResponse[NotificationResponse],
    summary="Acknowledge a notification/reminder",
)
async def acknowledge_notification(
    notification_id: str = Path(..., description="ID of the notification"),
    current_user: dict = Depends(get_current_user),
):
    """
    Marks a notification as ACKNOWLEDGED.
    Enforces strict ownership check.
    """
    is_admin = current_user.get("role") == UserRole.ADMIN.value
    updated = await notification_service.acknowledge_notification(
        user_id=current_user["id"],
        notification_id=notification_id,
        is_admin=is_admin,
    )
    return APIResponse[NotificationResponse](
        success=True,
        message="Notification acknowledged successfully.",
        data=NotificationResponse(**updated),
    )


@router.patch(
    "/mark-all-read",
    response_model=APIResponse[dict],
    summary="Mark all unread notifications as read",
)
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user),
):
    """Marks all unread notifications for the current user as read."""
    count = await notification_service.mark_all_as_read(current_user["id"])
    return APIResponse[dict](
        success=True,
        message=f"Marked {count} notifications as read.",
        data={"marked_read_count": count},
    )


@router.get(
    "/preferences",
    response_model=APIResponse[NotificationPreferenceResponse],
    summary="Get user notification and reminder preferences",
)
async def get_notification_preferences(
    current_user: dict = Depends(get_current_user),
):
    """Retrieves user's delivery channels and reminder lead time preferences."""
    prefs = await notification_service.get_preferences(current_user["id"])
    return APIResponse[NotificationPreferenceResponse](
        success=True,
        message="Preferences retrieved.",
        data=NotificationPreferenceResponse(**prefs),
    )


@router.put(
    "/preferences",
    response_model=APIResponse[NotificationPreferenceResponse],
    summary="Update notification and reminder preferences",
)
async def update_notification_preferences(
    req: NotificationPreferenceUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Updates user's reminder lead days and notification channels."""
    updated = await notification_service.update_preferences(
        user_id=current_user["id"],
        req=req,
    )
    return APIResponse[NotificationPreferenceResponse](
        success=True,
        message="Preferences updated successfully.",
        data=NotificationPreferenceResponse(**updated),
    )


@router.post(
    "/monitor/run",
    response_model=APIResponse[MonitoringRunResponse],
    summary="Trigger monitoring engine manually for testing/development",
)
async def trigger_monitoring_run(
    req: Optional[MonitoringRunRequest] = None,
    current_user: dict = Depends(get_current_user),
):
    """
    Manually triggers proactive monitoring.
    - Regular users (PATIENT) evaluate their own family members.
    - ADMIN users evaluate either their own family or all users if no member is specified.
    """
    user_role = current_user.get("role")
    ref_date = req.reference_date if req else None
    target_member_id = req.family_member_id if req else None

    if user_role == UserRole.ADMIN.value and not target_member_id:
        # Admin global run across all active users
        stats = await monitoring_scheduler.run_cycle()
        return APIResponse[MonitoringRunResponse](
            success=True,
            message="Global monitoring cycle executed successfully across all active patients.",
            data=MonitoringRunResponse(
                scanned_users=stats.get("scanned_users", 0),
                scanned_members=stats.get("scanned_members", 0),
                evaluated_doses=stats.get("evaluated_doses", 0),
                notifications_created=stats.get("notifications_created", 0),
                notifications_skipped_duplicate=stats.get("notifications_skipped_duplicate", 0),
                resolved_notifications=stats.get("resolved_notifications", 0),
                details=stats.get("details", []),
            ),
        )
    else:
        # User run for own family
        stats = await monitoring_engine.monitor_user_family(
            user_id=current_user["id"],
            reference_date=ref_date,
            family_member_id=target_member_id,
        )
        return APIResponse[MonitoringRunResponse](
            success=True,
            message="Proactive monitoring completed for your family.",
            data=MonitoringRunResponse(
                scanned_users=1,
                scanned_members=stats.get("scanned_members", 0),
                evaluated_doses=stats.get("evaluated_doses", 0),
                notifications_created=stats.get("notifications_created", 0),
                notifications_skipped_duplicate=stats.get("notifications_skipped_duplicate", 0),
                resolved_notifications=stats.get("resolved_notifications", 0),
                details=stats.get("details", []),
            ),
        )
