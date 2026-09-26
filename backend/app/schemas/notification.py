from typing import Optional, List, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel, Field
from app.models.notification import (
    NotificationChannel,
    NotificationType,
    NotificationPriority,
    NotificationStatus,
)
from app.models.vaccination import VaccinationStatus


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    family_member_id: Optional[str] = None
    member_name: Optional[str] = None
    vaccine_code: Optional[str] = None
    vaccine_name: Optional[str] = None
    dose_number: Optional[int] = None
    dose_name: Optional[str] = None
    due_date: Optional[date] = None
    vaccination_status: Optional[VaccinationStatus] = None
    title: str
    message: str
    channel: NotificationChannel
    type: NotificationType
    priority: NotificationPriority
    status: NotificationStatus
    is_read: bool = False
    scheduled_for: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    dedup_key: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NotificationUnreadCountResponse(BaseModel):
    unread_count: int = Field(..., ge=0, description="Total number of unread notifications")


class NotificationPreferenceResponse(BaseModel):
    channels_enabled: List[NotificationChannel] = Field(default_factory=lambda: [NotificationChannel.IN_APP])
    reminder_lead_days: List[int] = Field(default_factory=lambda: [14, 7, 3, 1])
    email_enabled: bool = True
    email_address: Optional[str] = None
    sms_enabled: bool = False
    phone_number: Optional[str] = None
    quiet_hours_enabled: bool = False
    quiet_hours_start: str = "22:00"
    quiet_hours_end: str = "08:00"
    timezone: str = "UTC"

    class Config:
        from_attributes = True


class NotificationPreferenceUpdateRequest(BaseModel):
    channels_enabled: Optional[List[NotificationChannel]] = None
    reminder_lead_days: Optional[List[int]] = Field(default=None, description="e.g. [7, 3, 1]")
    email_enabled: Optional[bool] = None
    email_address: Optional[str] = None
    sms_enabled: Optional[bool] = None
    phone_number: Optional[str] = None
    quiet_hours_enabled: Optional[bool] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    timezone: Optional[str] = None


class MonitoringRunRequest(BaseModel):
    family_member_id: Optional[str] = Field(default=None, description="Optional member ID to evaluate specifically")
    reference_date: Optional[date] = Field(default=None, description="Optional simulation / reference date")


class MonitoringRunResponse(BaseModel):
    scanned_users: int = 0
    scanned_members: int = 0
    evaluated_doses: int = 0
    notifications_created: int = 0
    notifications_skipped_duplicate: int = 0
    resolved_notifications: int = 0
    details: List[Dict[str, Any]] = Field(default_factory=list)
