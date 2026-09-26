from enum import Enum
from typing import Optional, Dict, Any, List
from datetime import datetime, date
from pydantic import Field
from app.models.base import MongoBaseModel
from app.models.vaccination import VaccinationStatus


class NotificationChannel(str, Enum):
    IN_APP = "IN_APP"
    EMAIL = "EMAIL"
    SMS = "SMS"


class NotificationType(str, Enum):
    REMINDER = "REMINDER"
    DUE_ALERT = "DUE_ALERT"
    OVERDUE_ALERT = "OVERDUE_ALERT"
    MISSED_ALERT = "MISSED_ALERT"
    CATCH_UP_ALERT = "CATCH_UP_ALERT"
    CLINICAL_REVIEW_ALERT = "CLINICAL_REVIEW_ALERT"
    STATUS_UPDATE = "STATUS_UPDATE"
    SYSTEM = "SYSTEM"


class NotificationPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class NotificationStatus(str, Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    READ = "READ"
    FAILED = "FAILED"
    DISMISSED = "DISMISSED"
    ACKNOWLEDGED = "ACKNOWLEDGED"


class Notification(MongoBaseModel):
    user_id: str = Field(..., description="ID of the user who owns this notification")
    family_member_id: Optional[str] = Field(default=None, description="Related family member ID if applicable")
    member_name: Optional[str] = Field(default=None, description="Denormalized name of the family member")
    vaccine_code: Optional[str] = Field(default=None, description="Vaccine code e.g. BCG, HEPB_BIRTH, PENTA_1")
    vaccine_name: Optional[str] = Field(default=None, description="Full name of vaccine")
    dose_number: Optional[int] = Field(default=None, description="Dose number")
    dose_name: Optional[str] = Field(default=None, description="Dose name label e.g. Dose 1, Birth Dose")
    due_date: Optional[date] = Field(default=None, description="Calculated due date for vaccination")
    vaccination_status: Optional[VaccinationStatus] = Field(
        default=None,
        description="Evaluated clinical vaccination status (UPCOMING, DUE, OVERDUE, etc.)"
    )
    title: str = Field(..., description="Short notification summary title")
    message: str = Field(..., description="Full descriptive notification message")
    channel: NotificationChannel = Field(default=NotificationChannel.IN_APP)
    type: NotificationType = Field(default=NotificationType.REMINDER)
    priority: NotificationPriority = Field(default=NotificationPriority.MEDIUM)
    status: NotificationStatus = Field(default=NotificationStatus.SENT)
    is_read: bool = Field(default=False, description="Read state indicator")
    scheduled_for: Optional[datetime] = Field(default=None, description="When notification was scheduled for")
    sent_at: Optional[datetime] = Field(default=None, description="When notification was delivered")
    read_at: Optional[datetime] = Field(default=None, description="Timestamp when notification was marked read")
    dedup_key: str = Field(..., description="Deterministic key for duplicate prevention and idempotency")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Custom metadata or routing attributes")


class NotificationPreference(MongoBaseModel):
    user_id: str = Field(..., description="ID of the user")
    channels_enabled: List[NotificationChannel] = Field(
        default_factory=lambda: [NotificationChannel.IN_APP],
        description="Active delivery channels"
    )
    reminder_lead_days: List[int] = Field(
        default_factory=lambda: [14, 7, 3, 1],
        description="Days prior to due date to dispatch reminders"
    )
    email_enabled: bool = Field(default=True)
    email_address: Optional[str] = Field(default=None)
    sms_enabled: bool = Field(default=False)
    phone_number: Optional[str] = Field(default=None)
    quiet_hours_enabled: bool = Field(default=False)
    quiet_hours_start: str = Field(default="22:00", description="Quiet hours start time HH:MM (24-hour format)")
    quiet_hours_end: str = Field(default="08:00", description="Quiet hours end time HH:MM (24-hour format)")
    timezone: str = Field(default="UTC", description="User local timezone (e.g. 'UTC', 'Asia/Kolkata')")
