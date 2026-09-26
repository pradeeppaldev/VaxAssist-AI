"""
VaxAssist AI - Multi-Agent Orchestrator Schemas (Phase 9).

Defines workflow types, execution request envelopes, step-level tracking records,
and aggregated multi-agent outcome containers.
"""
from enum import Enum
from typing import Optional, Dict, Any, List
from datetime import datetime, date
import uuid
from pydantic import BaseModel, Field

from app.agents.base import AgentStatus
from app.models.notification import NotificationChannel
from app.agents.monitoring.schemas import (
    MonitoringAgentResult,
    ActionableMonitoringEvent,
    MemberMonitoringAssessment,
)
from app.agents.reminder.schemas import (
    ReminderAgentResult,
    DispatchedReminderItem,
)
from app.agents.knowledge.schemas import (
    KnowledgeAgentResult,
    KnowledgeSourceCitation,
)
from app.agents.recommendation.schemas import (
    RecommendationAgentResult,
    RecommendationItem,
)
from app.agents.report.schemas import (
    ReportAgentResult,
    ReportType,
    ReportOutputFormat,
)


class OrchestrationWorkflowType(str, Enum):
    """Named multi-agent workflows coordinated by the orchestrator."""
    ROUTINE_CYCLE = "routine_cycle"
    CLINICAL_ADVISORY = "clinical_advisory"
    REMINDER_PIPELINE = "reminder_pipeline"
    COMPREHENSIVE_RECORD = "comprehensive_record"
    KNOWLEDGE_INQUIRY = "knowledge_inquiry"
    DYNAMIC_ROUTE = "dynamic_route"


class StepExecutionStatus(str, Enum):
    """Status of an individual agent step within an orchestration workflow."""
    SUCCESS = "SUCCESS"
    SKIPPED = "SKIPPED"
    FAILED = "FAILED"
    TIMEOUT = "TIMEOUT"


class WorkflowStepResult(BaseModel):
    """Execution telemetry and data container for an individual workflow step."""
    step_name: str
    agent_id: str
    status: StepExecutionStatus
    duration_ms: float = 0.0
    summary: Optional[str] = None
    error: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    data: Optional[Dict[str, Any]] = None

    class Config:
        arbitrary_types_allowed = True


class OrchestratorInput(BaseModel):
    """Input payload instructing the Multi-Agent Orchestrator."""
    workflow: OrchestrationWorkflowType = Field(
        default=OrchestrationWorkflowType.ROUTINE_CYCLE,
        description="Named orchestration workflow to execute"
    )
    user_id: str = Field(..., description="Target patient or household owner ID")
    family_member_id: Optional[str] = Field(default=None, description="Optional target family member ID")
    reference_date: Optional[date] = Field(default=None, description="Clinical evaluation reference date")
    caller_user_id: Optional[str] = Field(default=None, description="Caller ID for multi-tenant ownership checks")
    caller_role: Optional[str] = Field(default="PATIENT", description="Caller role for RBAC authorization")
    
    # Workflow toggles & parameters
    query: Optional[str] = Field(default=None, description="Clinical question for Knowledge/RAG agent steps")
    include_reminders: bool = Field(default=True, description="Whether to dispatch or preview reminders")
    include_recommendations: bool = Field(default=True, description="Whether to evaluate personalized recommendations")
    include_report: bool = Field(default=False, description="Whether to generate structured vaccination report/passport")
    report_type: ReportType = Field(default=ReportType.COMPREHENSIVE_RECORD, description="Report type if report is enabled")
    report_output_format: ReportOutputFormat = Field(default=ReportOutputFormat.JSON, description="Report output format (json/pdf)")
    
    # Execution & Safety policies
    dry_run: bool = Field(default=False, description="Preview reminders and notifications without DB writes or external provider calls")
    force_dispatch_quiet_hours: bool = Field(default=False, description="Emergency override to bypass quiet hours")
    channels: Optional[List[NotificationChannel]] = Field(default=None, description="Explicit delivery channels override")
    include_private_optional: bool = Field(default=False, description="Include private sector optional vaccines")
    eligible_for_je: bool = Field(default=False, description="Japanese Encephalitis endemic status")
    
    # Reliability & fault tolerance
    continue_on_failure: bool = Field(default=True, description="Continue subsequent workflow steps if non-critical step fails")
    step_timeout_seconds: float = Field(default=60.0, ge=0.01, le=180.0, description="Maximum timeout per individual agent step")
    correlation_id: Optional[str] = Field(default=None, description="Distributed tracing / cross-agent correlation ID")


class OrchestratorResult(BaseModel):
    """Structured aggregate outcome produced by the Multi-Agent Orchestrator."""
    workflow: OrchestrationWorkflowType
    workflow_status: AgentStatus = AgentStatus.SUCCESS
    user_id: str
    family_member_id: Optional[str] = None
    reference_date: date
    correlation_id: str = Field(default_factory=lambda: f"orch_{uuid.uuid4().hex[:12]}")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    total_duration_ms: float = 0.0
    summary: str = ""
    
    # Orchestration lifecycle telemetry
    steps_executed: List[str] = Field(default_factory=list)
    steps_skipped: List[str] = Field(default_factory=list)
    steps_failed: List[str] = Field(default_factory=list)
    step_results: Dict[str, WorkflowStepResult] = Field(default_factory=dict)
    
    # Agent outcomes (populated when corresponding steps are executed)
    monitoring: Optional[MonitoringAgentResult] = None
    reminder: Optional[ReminderAgentResult] = None
    knowledge: Optional[KnowledgeAgentResult] = None
    recommendation: Optional[RecommendationAgentResult] = None
    report: Optional[ReportAgentResult] = None
    
    # High-level aggregated clinical highlights
    actionable_events_count: int = 0
    reminders_dispatched_count: int = 0
    recommendations_count: int = 0
    data_quality_issues_count: int = 0
    report_checksum: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True


class WorkflowSpecification(BaseModel):
    """Metadata describing a coordinated multi-agent workflow."""
    workflow: OrchestrationWorkflowType
    name: str
    description: str
    steps: List[str]
    conditional_steps: List[str]
    inputs: List[str]
    resilience_strategy: str
