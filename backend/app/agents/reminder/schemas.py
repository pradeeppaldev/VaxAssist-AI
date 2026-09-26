"""
Schemas and Data Models for the Reminder Agent (Phase 8 - Agent 2 of 5).
Handles multi-channel notification preparation, eligibility, quiet-hours evaluation,
and structured dispatch tracking for the Multi-Agent Orchestrator.
"""
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from enum import Enum
from pydantic import BaseModel, Field

from app.models.notification import NotificationChannel, NotificationPriority
from app.agents.monitoring.schemas import ActionableMonitoringEvent


class ReminderStatus(str, Enum):
    DISPATCHED = "DISPATCHED"
    PENDING_QUIET_HOURS = "PENDING_QUIET_HOURS"
    SKIPPED_PREFERENCE = "SKIPPED_PREFERENCE"
    SKIPPED_DUPLICATE = "SKIPPED_DUPLICATE"
    SKIPPED_NOT_READY = "SKIPPED_NOT_READY"
    SKIPPED_COMPLETED = "SKIPPED_COMPLETED"
    FAILED_VALIDATION = "FAILED_VALIDATION"
    FAILED_PROVIDER = "FAILED_PROVIDER"


class ReminderAgentInput(BaseModel):
    """Input payload for Reminder Agent execution."""
    user_id: str = Field(..., description="Target user / household owner ID")
    caller_user_id: Optional[str] = Field(default=None, description="Authenticated caller ID for tenant validation")
    caller_role: Optional[str] = Field(default=None, description="Role of caller (PATIENT, HEALTHCARE_WORKER, ADMIN)")
    events: Optional[List[ActionableMonitoringEvent]] = Field(
        default=None,
        description="Actionable monitoring events. If omitted, Monitoring Agent is invoked automatically."
    )
    family_member_id: Optional[str] = Field(default=None, description="Filter to specific family member")
    reference_date: Optional[date] = Field(default=None, description="Simulation / reference date")
    dry_run: bool = Field(default=False, description="If True, evaluates and prepares reminders without database writes or external dispatches")
    correlation_id: Optional[str] = Field(default=None, description="Tracking or correlation ID across multi-agent workflows")
    force_dispatch_quiet_hours: bool = Field(default=False, description="Emergency override to bypass quiet hours")
    channels_override: Optional[List[NotificationChannel]] = Field(default=None, description="Explicit channel filter/override")


class DispatchedReminderItem(BaseModel):
    """Itemized record of a reminder evaluation and dispatch outcome."""
    event_id: str
    dedup_key: str
    notification_id: Optional[str] = None
    channel: NotificationChannel = NotificationChannel.IN_APP
    recipient: Optional[str] = None
    status: ReminderStatus
    family_member_id: str = ""
    member_name: str = ""
    vaccine_code: str = ""
    vaccine_name: str = ""
    dose_number: int = 1
    dose_name: Optional[str] = None
    title: str
    message: str
    priority: NotificationPriority = NotificationPriority.MEDIUM
    scheduled_for: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    next_eligible_dispatch_time: Optional[datetime] = None
    skip_reason: Optional[str] = None
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ReminderAgentResult(BaseModel):
    """
    Structured outcome of the Reminder Agent.
    Consumable directly by Phase 9 Multi-Agent Orchestrator and backend callers.
    """
    agent_id: str = "agent_reminder_v1"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    correlation_id: Optional[str] = None
    user_id: str
    dry_run: bool = False
    total_events_received: int = 0
    total_eligible: int = 0
    total_dispatched: int = 0
    total_deferred_quiet_hours: int = 0
    total_skipped_duplicate: int = 0
    total_skipped_preference: int = 0
    total_skipped_not_ready: int = 0
    total_validation_failures: int = 0
    total_provider_failures: int = 0
    channel_delivery_receipts: Dict[str, int] = Field(default_factory=dict)
    dispatched_reminders: List[DispatchedReminderItem] = Field(default_factory=list)
    deferred_reminders: List[DispatchedReminderItem] = Field(default_factory=list)
    skipped_reminders: List[DispatchedReminderItem] = Field(default_factory=list)
    execution_duration_ms: float = 0.0
