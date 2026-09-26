"""
Pydantic Schemas for Recommendation Agent (Phase 8, Agent 4).
Defines request, result, recommendation item, catch-up pathway,
and advisory guidance data transfer objects.
"""
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from enum import Enum
import uuid
from pydantic import BaseModel, Field

from app.agents.knowledge.schemas import KnowledgeSourceCitation


class RecommendationPriority(str, Enum):
    """Clinical priority classification for recommendations."""
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFORMATIONAL = "INFORMATIONAL"


class RecommendationCategory(str, Enum):
    """Functional category of clinical recommendation."""
    OVERDUE_INTERVENTION = "OVERDUE_INTERVENTION"
    DUE_ACTION = "DUE_ACTION"
    UPCOMING_PLANNING = "UPCOMING_PLANNING"
    CATCH_UP_PATHWAY = "CATCH_UP_PATHWAY"
    CLINICAL_REVIEW = "CLINICAL_REVIEW"
    DATA_REMEDIATION = "DATA_REMEDIATION"
    OPTIONAL_VACCINE_ADVISORY = "OPTIONAL_VACCINE_ADVISORY"


class RecommendationItem(BaseModel):
    """An individual actionable recommendation for a patient."""
    recommendation_id: str = Field(
        default_factory=lambda: f"rec_{uuid.uuid4().hex[:10]}",
        description="Unique identifier for this recommendation",
    )
    category: RecommendationCategory = Field(..., description="Functional classification")
    priority: RecommendationPriority = Field(..., description="Action urgency priority")
    title: str = Field(..., description="Concise headline for the recommendation")
    description: str = Field(..., description="Clear, user-friendly guidance or suggested action")
    clinical_rationale: str = Field(
        ...,
        description="Objective clinical basis derived from verified schedule rules or monitoring results",
    )
    vaccine_code: Optional[str] = Field(default=None, description="Relevant vaccine code if dose-specific")
    vaccine_name: Optional[str] = Field(default=None, description="Full vaccine name if dose-specific")
    dose_number: Optional[int] = Field(default=None, description="Specific dose number")
    dose_name: Optional[str] = Field(default=None, description="Dose title (e.g. Birth Dose, Booster)")
    due_date: Optional[date] = Field(default=None, description="Deterministic due date from schedule engine")
    action_type: str = Field(
        default="CONSULT_PEDIATRICIAN",
        description="Suggested action verb: SCHEDULE_CLINIC_VISIT, CONSULT_PEDIATRICIAN, UPDATE_RECORD, OPTIONAL_DISCUSSION",
    )
    is_deterministic: bool = Field(
        default=True,
        description="True if derived directly from deterministic schedule engine; False if general advisory",
    )
    supporting_citations: List[KnowledgeSourceCitation] = Field(
        default_factory=list,
        description="Official guideline citations retrieved via Knowledge / RAG Agent if queried",
    )


class CatchUpPathwayItem(BaseModel):
    """Specific catch-up sequence guidance for a delayed or missed vaccine series."""
    vaccine_code: str
    vaccine_name: str
    current_status: str
    catch_up_guidance: str
    minimum_interval_days: Optional[int] = None
    age_limit_notes: Optional[str] = None
    official_protocol_citation: Optional[str] = None


class OptionalVaccineGuidance(BaseModel):
    """Advisory information for non-NIS private/optional vaccines."""
    vaccine_code: str
    vaccine_name: str
    target_disease: str
    recommended_age_range: str
    advisory_notes: str
    discussion_point: str


class MemberRecommendation(BaseModel):
    """Consolidated recommendation dossier for an individual family member."""
    member_id: str
    member_name: str
    date_of_birth: Optional[date] = None
    age_display: Optional[str] = None
    total_recommendations: int = 0
    recommendations: List[RecommendationItem] = Field(default_factory=list)
    catch_up_pathways: List[CatchUpPathwayItem] = Field(default_factory=list)
    optional_vaccine_advisories: List[OptionalVaccineGuidance] = Field(default_factory=list)
    pediatric_discussion_points: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class RecommendationAgentInput(BaseModel):
    """Input payload for Recommendation Agent execution."""
    user_id: str = Field(..., description="ID of the user who owns the household")
    family_member_id: Optional[str] = Field(default=None, description="Optional specific family member to evaluate")
    caller_user_id: Optional[str] = Field(default=None, description="Authenticated caller ID for tenant validation")
    caller_role: Optional[str] = Field(default=None, description="Role of caller (PATIENT, HEALTHCARE_WORKER, ADMIN)")
    reference_date: Optional[date] = Field(default=None, description="Evaluation reference date (defaults to today)")
    include_optional_vaccines: bool = Field(
        default=True,
        description="Whether to include private-sector optional vaccine advisories (MMR, Varicella, HPV, etc.)",
    )
    eligible_for_je: bool = Field(
        default=False,
        description="Include Japanese Encephalitis endemic district rules",
    )
    query_knowledge_base: bool = Field(
        default=False,
        description="Whether to consult the Knowledge / RAG Agent for official guideline citations on catch-up items",
    )
    correlation_id: Optional[str] = Field(
        default=None,
        description="Unique cross-agent correlation ID for distributed tracing",
    )


class RecommendationAgentResult(BaseModel):
    """Standardized top-level result of the Recommendation Agent."""
    agent_id: str = Field(default="agent_recommendation_v1", description="Unique agent identifier")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="UTC execution timestamp")
    user_id: str = Field(..., description="Target household owner ID")
    evaluated_members_count: int = Field(default=0, description="Total family members evaluated")
    member_recommendations: List[MemberRecommendation] = Field(
        default_factory=list,
        description="Itemized recommendations per family member",
    )
    total_recommendations_count: int = Field(default=0, description="Total recommendations generated")
    recommendations_by_priority: Dict[str, int] = Field(
        default_factory=dict,
        description="Count of recommendations by priority (HIGH, MEDIUM, LOW, INFORMATIONAL)",
    )
    recommendations_by_category: Dict[str, int] = Field(
        default_factory=dict,
        description="Count of recommendations by category",
    )
    clinical_disclaimer: str = Field(
        ...,
        description="Mandatory clinical safety and non-prescriptive advisory disclaimer",
    )
    warnings: List[str] = Field(
        default_factory=list,
        description="Advisory warnings (e.g. missing records, data quality issues, unverified DOB)",
    )
    correlation_id: Optional[str] = Field(
        default=None,
        description="Cross-agent correlation ID",
    )
    execution_duration_ms: float = Field(
        default=0.0,
        description="Total execution time in milliseconds",
    )
