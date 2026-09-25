from enum import Enum
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import Field
from app.models.base import MongoBaseModel


class NotificationChannel(str, Enum):
    IN_APP = "IN_APP"
    EMAIL = "EMAIL"
    SMS = "SMS"


class NotificationType(str, Enum):
    REMINDER = "REMINDER"
    OVERDUE_ALERT = "OVERDUE_ALERT"
    STATUS_UPDATE = "STATUS_UPDATE"
    SYSTEM = "SYSTEM"


class NotificationStatus(str, Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"
    READ = "READ"


class Notification(MongoBaseModel):
    user_id: str
    member_id: Optional[str] = None
    vaccination_record_id: Optional[str] = None
    title: str
    message: str
    channel: NotificationChannel = NotificationChannel.IN_APP
    type: NotificationType = NotificationType.REMINDER
    status: NotificationStatus = NotificationStatus.PENDING
    scheduled_for: datetime
    sent_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
