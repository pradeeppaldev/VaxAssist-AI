"""
Schemas for Report Generation Agent (Phase 8, Agent 5).
Defines structured input/output models, report types, items, and verification metadata.
"""
from enum import Enum
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

MANDATORY_REPORT_DISCLAIMER: str = (
    "VaxAssist AI vaccination reports are generated from recorded immunization data "
    "and official National Immunization Schedule guidelines for informational and tracking "
    "purposes. This document does not substitute for certified clinical advice, physical "
    "examination, or an official government-issued vaccination certificate. Please consult a "
    "qualified healthcare professional or authorized immunization center to confirm immunization "
    "status and schedule."
)


class ReportType(str, Enum):
    VACCINATION_HISTORY = "vaccination_history"
    VACCINATION_STATUS = "vaccination_status"
    PROGRESS_SUMMARY = "progress_summary"
    COMPREHENSIVE_RECORD = "comprehensive_record"


class ReportOutputFormat(str, Enum):
    JSON = "json"
    PDF = "pdf"


class PatientDemographicsReportItem(BaseModel):
    member_id: str
    full_name: str
    relationship: str
    date_of_birth: Optional[str] = None
    age_display: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: List[str] = Field(default_factory=list)
    household_id: Optional[str] = None
    notes: Optional[str] = None


class AdministeredRecordReportItem(BaseModel):
    record_id: Optional[str] = None
    vaccine_code: str
    vaccine_name: str
    dose_number: int
    dose_name: Optional[str] = None
    administered_date: str
    batch_number: Optional[str] = None
    healthcare_provider: Optional[str] = None
    administration_site: Optional[str] = None
    adverse_reactions: Optional[str] = None
    notes: Optional[str] = None
    status: str = "completed"
    is_verified: bool = True


class ScheduledDoseReportItem(BaseModel):
    vaccine_code: str
    vaccine_name: str
    dose_number: int
    due_date: Optional[str] = None
    overdue_date: Optional[str] = None
    status: str
    milestone: Optional[str] = None
    is_mandatory: bool = True
    preventable_disease: Optional[str] = None
    action_priority: Optional[str] = None
    reason: Optional[str] = None


class ProgressSummaryReportItem(BaseModel):
    total_required_doses: int = 0
    completed_doses: int = 0
    upcoming_doses: int = 0
    due_doses: int = 0
    overdue_doses: int = 0
    missed_doses: int = 0
    catch_up_doses: int = 0
    compliance_percentage: float = 0.0
    is_up_to_date: bool = True
    nis_coverage_summary: str = ""


class RecommendationReportItem(BaseModel):
    vaccine_code: Optional[str] = None
    priority: str
    category: str
    title: str
    summary: str
    clinical_rationale: str
    pediatric_discussion_points: List[str] = Field(default_factory=list)


class DataQualityReportItem(BaseModel):
    issue_type: str
    vaccine_code: Optional[str] = None
    severity: str
    message: str


class ReportDocumentMetadata(BaseModel):
    report_id: str
    generated_at: str
    agent_id: str = "agent_report_generation_v1"
    report_type: str
    output_format: str
    reference_date: str
    verification_hash: str
    issuer: str = "VaxAssist AI Digital Immunization Platform"
    disclaimer: str = MANDATORY_REPORT_DISCLAIMER


class ReportAgentInput(BaseModel):
    user_id: str = Field(description="Target household owner / patient user ID")
    family_member_id: Optional[str] = Field(default=None, description="Target family member ID (optional, defaults to first or evaluated member)")
    report_type: ReportType = Field(default=ReportType.COMPREHENSIVE_RECORD, description="Type of report to generate")
    output_format: ReportOutputFormat = Field(default=ReportOutputFormat.JSON, description="Output format: JSON or PDF")
    reference_date: Optional[date] = Field(default=None, description="Evaluation reference date (defaults to today)")
    include_recommendations: bool = Field(default=True, description="Whether to include clinical recommendations in comprehensive reports")
    include_data_quality: bool = Field(default=True, description="Whether to include data quality checks and auditing findings")
    include_private_optional: bool = Field(default=False, description="Whether to evaluate private sector optional vaccines")
    eligible_for_je: bool = Field(default=False, description="Whether Japanese Encephalitis endemic schedule applies")
    caller_user_id: Optional[str] = Field(default=None, description="Caller user ID for tenant isolation verification")
    caller_role: Optional[str] = Field(default=None, description="Caller role for authorization checks")
    correlation_id: Optional[str] = Field(default=None, description="Tracing correlation ID")

    # In-memory test fixtures to bypass database queries during isolated testing
    members_fixture: Optional[List[Dict[str, Any]]] = None
    records_fixture: Optional[List[Dict[str, Any]]] = None


class ReportAgentResult(BaseModel):
    agent_id: str = "agent_report_generation_v1"
    report_id: str
    timestamp: datetime
    user_id: str
    family_member_id: Optional[str] = None
    patient_name: str
    date_of_birth: Optional[str] = None
    age_display: Optional[str] = None
    gender: Optional[str] = None
    report_type: str
    output_format: str
    filename: str
    content_base64: Optional[str] = None
    report_data: Dict[str, Any] = Field(default_factory=dict)
    verification_hash: str
    disclaimer: str = MANDATORY_REPORT_DISCLAIMER
    warnings: List[str] = Field(default_factory=list)
    execution_duration_ms: float = 0.0
