"""
Data schemas and event models for the Monitoring Agent (Phase 8).
Produces structured, standardized clinical assessments and actionable events
for the Reminder Agent and Multi-Agent Orchestrator.
"""
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from enum import Enum
from pydantic import BaseModel, Field
from app.models.vaccination import VaccinationStatus
from app.models.notification import NotificationPriority


class MonitoringAgentInput(BaseModel):
    """Input payload for Monitoring Agent execution."""
    user_id: str = Field(..., description="ID of the user who owns the household")
    family_member_id: Optional[str] = Field(default=None, description="Optional specific family member to assess")
    reference_date: Optional[date] = Field(default=None, description="Clinical evaluation date (defaults to today)")
    caller_user_id: Optional[str] = Field(default=None, description="Authenticated caller ID for tenant validation")
    caller_role: Optional[str] = Field(default=None, description="Role of caller (PATIENT, HEALTHCARE_WORKER, ADMIN)")
    include_private_optional: bool = Field(default=False, description="Include optional private sector vaccines")
    eligible_for_je: bool = Field(default=False, description="Include Japanese Encephalitis endemic rules")
    dispatch_notifications: bool = Field(
        default=False,
        description="Whether to also persist alerts to MongoDB notification collection (Phase 6 compatibility)"
    )


class DoseAssessmentItem(BaseModel):
    """Authoritative evaluation of a single vaccine dose schedule item."""
    rule_code: str
    vaccine_code: str
    dose_number: int
    dose_name: str
    vaccine_name: str
    target_disease: str
    category: str
    recommended_age_display: str
    recommended_date: date
    calculated_due_date: date
    status: VaccinationStatus
    status_reason: str
    administered_date: Optional[date] = None
    record_id: Optional[str] = None
    priority: NotificationPriority = NotificationPriority.MEDIUM
    route: Optional[str] = None
    site: Optional[str] = None
    is_conditional: bool = False
    condition_description: Optional[str] = None


class ActionableMonitoringEvent(BaseModel):
    """
    Structured actionable event produced by Monitoring Agent.
    Consumable directly by Reminder Agent and Multi-Agent Orchestrator.
    """
    event_id: str = Field(..., description="Deterministic unique identifier for this event")
    dedup_key: str = Field(..., description="Deterministic deduplication key for idempotency")
    event_type: str = Field(..., description="e.g. DUE_ALERT, OVERDUE_ALERT, MISSED_ALERT, UPCOMING_REMINDER")
    priority: NotificationPriority
    family_member_id: str
    member_name: str
    vaccine_code: str
    vaccine_name: str
    dose_number: int
    dose_name: str
    calculated_due_date: date
    days_until_due: Optional[int] = None
    days_overdue: Optional[int] = None
    title: str
    message: str
    ready_for_reminder: bool = True
    suggested_lead_bucket: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class DataQualityIssue(BaseModel):
    """Records missing, invalid, or conflicting records discovered during evaluation."""
    family_member_id: Optional[str] = None
    member_name: Optional[str] = None
    record_id: Optional[str] = None
    issue_type: str = Field(..., description="e.g. MISSING_DOB, FUTURE_DATE, CHRONOLOGICAL_CONFLICT, CORRUPTED_RECORD")
    severity: str = Field(default="WARNING", description="WARNING, ERROR, CRITICAL")
    description: str
    suggested_action: str


class MemberMonitoringAssessment(BaseModel):
    """Complete clinical monitoring assessment for an individual family member."""
    member_id: str
    full_name: str
    date_of_birth: Optional[date] = None
    age_days: Optional[int] = None
    age_display: Optional[str] = None
    summary: Dict[str, Any] = Field(
        default_factory=lambda: {
            "total_doses": 0,
            "completed_count": 0,
            "due_count": 0,
            "overdue_count": 0,
            "upcoming_count": 0,
            "missed_count": 0,
            "catch_up_count": 0,
            "clinical_review_count": 0,
            "completion_percentage": 0.0,
        }
    )
    categorized_doses: Dict[str, List[DoseAssessmentItem]] = Field(default_factory=dict)
    actionable_events: List[ActionableMonitoringEvent] = Field(default_factory=list)
    data_quality_issues: List[DataQualityIssue] = Field(default_factory=list)
    notifications_created: int = 0
    notifications_skipped_duplicate: int = 0
    resolved_notifications: int = 0


class MonitoringAgentResult(BaseModel):
    """
    Standardized top-level result of the Monitoring Agent.
    Contains aggregated clinical metrics, itemized assessments,
    and events prepared for the Reminder Agent.
    """
    agent_id: str = "agent_monitoring_v1"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    evaluated_users_count: int = 1
    evaluated_members_count: int = 0
    member_assessments: List[MemberMonitoringAssessment] = Field(default_factory=list)
    total_doses_evaluated: int = 0
    status_distribution: Dict[str, int] = Field(default_factory=dict)
    total_actionable_events: int = 0
    actionable_events: List[ActionableMonitoringEvent] = Field(default_factory=list)
    total_data_quality_issues: int = 0
    data_quality_issues: List[DataQualityIssue] = Field(default_factory=list)
    execution_duration_ms: float = 0.0
