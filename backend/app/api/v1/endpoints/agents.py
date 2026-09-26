"""
AI Agents API Endpoints (Phase 8).
Exposes the multi-agent architecture and Monitoring Agent operations.
"""
import base64
import logging
from typing import Optional, Dict, Any, List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel, Field

logger = logging.getLogger("vaxassist.api.agents")

from app.api.deps import get_current_user
from app.models.user import UserRole
from app.schemas.common import APIResponse
from app.agents.architecture import FIVE_AGENT_ARCHITECTURE, get_agent_architecture_spec
from app.agents.base import AgentExecutionResult
from app.models.notification import NotificationChannel
from app.agents.monitoring import (
    monitoring_agent,
    MonitoringAgentInput,
    MonitoringAgentResult,
    ActionableMonitoringEvent,
)
from app.agents.reminder import (
    reminder_agent,
    ReminderAgentInput,
    ReminderAgentResult,
)
from app.agents.knowledge import (
    knowledge_agent,
    KnowledgeAgentInput,
    KnowledgeAgentResult,
)
from app.agents.recommendation import (
    recommendation_agent,
    RecommendationAgentInput,
    RecommendationAgentResult,
)
from app.agents.report import (
    report_agent,
    ReportAgentInput,
    ReportAgentResult,
    ReportType,
    ReportOutputFormat,
)
from app.agents.orchestrator import (
    multi_agent_orchestrator,
    OrchestratorInput,
    OrchestratorResult,
    OrchestrationWorkflowType,
    WORKFLOW_SPECIFICATIONS,
)
from app.services.embedding_service import GeminiAPIError, GeminiAPIKeyMissingError
from app.services.vector_store import VectorStoreError

router = APIRouter()



class MonitoringEvaluateRequest(BaseModel):
    family_member_id: Optional[str] = Field(default=None, description="Optional family member ID to evaluate")
    target_user_id: Optional[str] = Field(default=None, description="Target household owner ID (Admin/Healthcare Worker only)")
    reference_date: Optional[date] = Field(default=None, description="Evaluation reference date (defaults to today)")
    include_private_optional: bool = Field(default=False, description="Include private optional vaccines")
    eligible_for_je: bool = Field(default=False, description="Include Japanese Encephalitis endemic rules")
    dispatch_notifications: bool = Field(default=False, description="Persist generated notifications in DB")


class ReminderDispatchRequest(BaseModel):
    family_member_id: Optional[str] = Field(default=None, description="Optional family member ID")
    target_user_id: Optional[str] = Field(default=None, description="Target household owner ID (Admin/Healthcare Worker only)")
    events: Optional[List[ActionableMonitoringEvent]] = Field(default=None, description="Optional events from Monitoring Agent")
    reference_date: Optional[date] = Field(default=None, description="Reference date for evaluation")
    dry_run: bool = Field(default=False, description="Preview dispatch without database writes or provider sends")
    correlation_id: Optional[str] = Field(default=None, description="Cross-agent correlation ID")
    force_dispatch_quiet_hours: bool = Field(default=False, description="Emergency override for quiet hours")
    channels: Optional[List[NotificationChannel]] = Field(default=None, description="Explicit channels override")


class KnowledgeQueryRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000, description="Vaccination-related inquiry")
    top_k: Optional[int] = Field(default=None, ge=1, le=10, description="Override maximum number of relevant chunks to retrieve")
    document_type_filter: Optional[str] = Field(default=None, description="Filter retrieval by DocumentType")
    authority_filter: Optional[str] = Field(default=None, description="Filter retrieval by SourceAuthority")
    correlation_id: Optional[str] = Field(default=None, description="Optional cross-agent correlation ID")


class RecommendationEvaluateRequest(BaseModel):
    family_member_id: Optional[str] = Field(default=None, description="Optional specific family member ID to evaluate")
    target_user_id: Optional[str] = Field(default=None, description="Target household owner ID (Admin/Healthcare Worker only)")
    reference_date: Optional[date] = Field(default=None, description="Evaluation reference date (defaults to today)")
    include_optional_vaccines: bool = Field(default=True, description="Include private optional vaccine advisories")
    eligible_for_je: bool = Field(default=False, description="Include Japanese Encephalitis endemic district rules")
    query_knowledge_base: bool = Field(default=False, description="Consult Knowledge Agent for official guideline citations")
    correlation_id: Optional[str] = Field(default=None, description="Cross-agent correlation ID")




@router.get(
    "/architecture",
    response_model=APIResponse[Dict[str, Any]],
    summary="Get Five-Agent Architecture Specification",
)
async def get_architecture_specification(
    current_user: dict = Depends(get_current_user),
):
    """
    Returns the formal multi-agent architecture specification defining
    all five specialized agents, responsibilities, input/output schemas,
    dependencies, and Phase 9 orchestration protocols.
    """
    specs = get_agent_architecture_spec()
    return APIResponse[Dict[str, Any]](
        success=True,
        message="Five-agent architecture specification retrieved successfully.",
        data=specs,
    )


@router.post(
    "/monitoring/evaluate",
    response_model=APIResponse[MonitoringAgentResult],
    summary="Evaluate patient household via Monitoring Agent",
)
async def evaluate_monitoring_agent(
    req: MonitoringEvaluateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Executes the Monitoring Agent:
    - Authoritative deterministic schedule calculations (Zero LLM)
    - Full classification: UPCOMING, DUE, OVERDUE, MISSED, CATCH_UP, CLINICAL_REVIEW
    - Audits data quality, chronological conflicts, and corrupted dates
    - Produces structured actionable events for Reminder Agent and Orchestration
    - Strictly isolates tenant data and validates role access
    """
    caller_id = str(current_user["id"])
    caller_role = current_user.get("role", UserRole.PATIENT.value)

    # Determine target user ID
    target_user_id = caller_id
    if req.target_user_id and req.target_user_id != caller_id:
        if caller_role not in (UserRole.ADMIN.value, UserRole.HEALTHCARE_WORKER.value):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Patients can only evaluate their own household records.",
            )
        target_user_id = req.target_user_id

    agent_input = MonitoringAgentInput(
        user_id=target_user_id,
        family_member_id=req.family_member_id,
        reference_date=req.reference_date,
        caller_user_id=caller_id,
        caller_role=caller_role,
        include_private_optional=req.include_private_optional,
        eligible_for_je=req.eligible_for_je,
        dispatch_notifications=req.dispatch_notifications,
    )

    try:
        result = await monitoring_agent.execute(input_data=agent_input)
        return APIResponse[MonitoringAgentResult](
            success=True,
            message="Monitoring Agent evaluation completed successfully.",
            data=result,
        )
    except PermissionError as pe:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(pe),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Monitoring Agent error: {str(exc)}",
        )


@router.post(
    "/monitoring/run",
    response_model=APIResponse[AgentExecutionResult[MonitoringAgentResult]],
    summary="Execute Monitoring Agent with standardized execution lifecycle",
)
async def run_monitoring_agent(
    req: MonitoringEvaluateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Executes the Monitoring Agent using the standardized BaseAgent.run() wrapper,
    returning lifecycle timing, status, execution ID, and telemetry.
    """
    caller_id = str(current_user["id"])
    caller_role = current_user.get("role", UserRole.PATIENT.value)

    target_user_id = caller_id
    if req.target_user_id and req.target_user_id != caller_id:
        if caller_role not in (UserRole.ADMIN.value, UserRole.HEALTHCARE_WORKER.value):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Patients can only evaluate their own household records.",
            )
        target_user_id = req.target_user_id

    agent_input = MonitoringAgentInput(
        user_id=target_user_id,
        family_member_id=req.family_member_id,
        reference_date=req.reference_date,
        caller_user_id=caller_id,
        caller_role=caller_role,
        include_private_optional=req.include_private_optional,
        eligible_for_je=req.eligible_for_je,
        dispatch_notifications=req.dispatch_notifications,
    )

    result = await monitoring_agent.run(input_data=agent_input)
    return APIResponse[AgentExecutionResult[MonitoringAgentResult]](
        success=True,
        message="Monitoring Agent run completed.",
        data=result,
    )


@router.post(
    "/reminders/dispatch",
    response_model=APIResponse[ReminderAgentResult],
    summary="Dispatch multi-channel reminders via Reminder Agent",
)
async def dispatch_reminders(
    req: ReminderDispatchRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Executes the Reminder Agent:
    - Consumes actionable events from Monitoring Agent (or invokes it internally)
    - Validates reminder readiness and user notification preferences
    - Evaluates quiet-hour boundaries in user local timezone
    - Enforces atomic deduplication across channels
    - Dispatches through existing notification service and delivery providers
    - Strictly isolates tenant data and validates role access
    """
    caller_id = str(current_user["id"])
    caller_role = current_user.get("role", UserRole.PATIENT.value)

    target_user_id = caller_id
    if req.target_user_id and req.target_user_id != caller_id:
        if caller_role not in (UserRole.ADMIN.value, UserRole.HEALTHCARE_WORKER.value):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Patients can only dispatch reminders for their own household.",
            )
        target_user_id = req.target_user_id

    agent_input = ReminderAgentInput(
        user_id=target_user_id,
        caller_user_id=caller_id,
        caller_role=caller_role,
        events=req.events,
        family_member_id=req.family_member_id,
        reference_date=req.reference_date,
        dry_run=req.dry_run,
        correlation_id=req.correlation_id,
        force_dispatch_quiet_hours=req.force_dispatch_quiet_hours,
        channels_override=req.channels,
    )

    try:
        result = await reminder_agent.execute(input_data=agent_input)
        return APIResponse[ReminderAgentResult](
            success=True,
            message="Reminder Agent execution completed.",
            data=result,
        )
    except PermissionError as pe:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(pe),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reminder Agent error: {str(exc)}",
        )


@router.post(
    "/reminders/run",
    response_model=APIResponse[AgentExecutionResult[ReminderAgentResult]],
    summary="Execute Reminder Agent with standardized execution lifecycle",
)
async def run_reminder_agent(
    req: ReminderDispatchRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Executes the Reminder Agent using the standardized BaseAgent.run() wrapper,
    returning lifecycle timing, status, execution ID, and telemetry.
    """
    caller_id = str(current_user["id"])
    caller_role = current_user.get("role", UserRole.PATIENT.value)

    target_user_id = caller_id
    if req.target_user_id and req.target_user_id != caller_id:
        if caller_role not in (UserRole.ADMIN.value, UserRole.HEALTHCARE_WORKER.value):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Patients can only dispatch reminders for their own household.",
            )
        target_user_id = req.target_user_id

    agent_input = ReminderAgentInput(
        user_id=target_user_id,
        caller_user_id=caller_id,
        caller_role=caller_role,
        events=req.events,
        family_member_id=req.family_member_id,
        reference_date=req.reference_date,
        dry_run=req.dry_run,
        correlation_id=req.correlation_id,
        force_dispatch_quiet_hours=req.force_dispatch_quiet_hours,
        channels_override=req.channels,
    )

    result = await reminder_agent.run(input_data=agent_input)
    return APIResponse[AgentExecutionResult[ReminderAgentResult]](
        success=True,
        message="Reminder Agent run completed.",
        data=result,
    )


@router.post(
    "/knowledge/query",
    response_model=APIResponse[KnowledgeAgentResult],
    summary="Query Knowledge / RAG Agent (Agent 3)",
)
@router.post(
    "/knowledge/ask",
    response_model=APIResponse[KnowledgeAgentResult],
    summary="Query Knowledge / RAG Agent (Agent 3) - Alias",
    include_in_schema=False,
)
async def query_knowledge_agent(
    req: KnowledgeQueryRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Executes the Knowledge / RAG Agent (Agent 3):
    - Answers clinical, guideline, and policy questions grounded strictly in official documentation
    - Semantic vector retrieval from ChromaDB + Gemini inference with clinical safety guardrails
    - Returns structured citations, document metadata, and mandatory clinical disclaimers
    - Rejects schedule calculation requests to preserve deterministic Schedule Engine authority
    """
    caller_id = str(current_user["id"])
    caller_role = current_user.get("role", UserRole.PATIENT.value)

    agent_input = KnowledgeAgentInput(
        question=req.question,
        top_k=req.top_k,
        document_type_filter=req.document_type_filter,
        authority_filter=req.authority_filter,
        correlation_id=req.correlation_id,
        user_id=caller_id,
        caller_user_id=caller_id,
        caller_role=caller_role,
    )

    try:
        result = await knowledge_agent.execute(input_data=agent_input)
        return APIResponse[KnowledgeAgentResult](
            success=True,
            message="Knowledge Agent query executed successfully.",
            data=result,
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except GeminiAPIKeyMissingError as key_err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(key_err),
        )
    except GeminiAPIError as api_err:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Knowledge Agent AI service error: {str(api_err)}",
        )
    except VectorStoreError as vs_err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Knowledge Agent vector store error: {str(vs_err)}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Knowledge Agent execution error: {str(exc)}",
        )


@router.post(
    "/knowledge/run",
    response_model=APIResponse[AgentExecutionResult[KnowledgeAgentResult]],
    summary="Execute Knowledge / RAG Agent with standardized BaseAgent lifecycle",
)
async def run_knowledge_agent(
    req: KnowledgeQueryRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Executes the Knowledge / RAG Agent using the standardized BaseAgent.run() wrapper,
    returning lifecycle timing, execution ID, telemetry, and structured result.
    """
    caller_id = str(current_user["id"])
    caller_role = current_user.get("role", UserRole.PATIENT.value)

    agent_input = KnowledgeAgentInput(
        question=req.question,
        top_k=req.top_k,
        document_type_filter=req.document_type_filter,
        authority_filter=req.authority_filter,
        correlation_id=req.correlation_id,
        user_id=caller_id,
        caller_user_id=caller_id,
        caller_role=caller_role,
    )

    result = await knowledge_agent.run(input_data=agent_input)
    return APIResponse[AgentExecutionResult[KnowledgeAgentResult]](
        success=True,
        message="Knowledge Agent run completed.",
        data=result,
    )


@router.post(
    "/recommendations/evaluate",
    response_model=APIResponse[RecommendationAgentResult],
    summary="Evaluate patient household recommendations (Agent 4)",
)
@router.post(
    "/recommendations/generate",
    response_model=APIResponse[RecommendationAgentResult],
    summary="Evaluate patient household recommendations (Agent 4) - Alias",
    include_in_schema=False,
)
async def evaluate_recommendation_agent(
    req: RecommendationEvaluateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Executes the Recommendation Agent (Agent 4):
    - Synthesizes personalized clinical recommendations from Monitoring Agent assessments
    - Formulates overdue actions, upcoming milestones, catch-up pathways, and review alerts
    - Recommends age-appropriate optional private vaccines (MMR, Varicella, HPV, etc.)
    - Preserves deterministic schedule integrity and enforces tenant isolation
    """
    caller_id = str(current_user["id"])
    caller_role = current_user.get("role", UserRole.PATIENT.value)

    target_user_id = caller_id
    if req.target_user_id and req.target_user_id != caller_id:
        if caller_role not in (UserRole.ADMIN.value, UserRole.HEALTHCARE_WORKER.value):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Patients can only request recommendations for their own household.",
            )
        target_user_id = req.target_user_id

    agent_input = RecommendationAgentInput(
        user_id=target_user_id,
        family_member_id=req.family_member_id,
        caller_user_id=caller_id,
        caller_role=caller_role,
        reference_date=req.reference_date,
        include_optional_vaccines=req.include_optional_vaccines,
        eligible_for_je=req.eligible_for_je,
        query_knowledge_base=req.query_knowledge_base,
        correlation_id=req.correlation_id,
    )

    try:
        result = await recommendation_agent.execute(input_data=agent_input)
        return APIResponse[RecommendationAgentResult](
            success=True,
            message="Recommendation Agent evaluation completed successfully.",
            data=result,
        )
    except PermissionError as pe:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(pe),
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recommendation Agent error: {str(exc)}",
        )


@router.post(
    "/recommendations/query",
    response_model=APIResponse[RecommendationAgentResult],
    summary="Query recommendations (Agent 4 alias)",
)
async def query_recommendation_agent(
    req: RecommendationEvaluateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Alias for /recommendations/evaluate."""
    return await evaluate_recommendation_agent(req, current_user)


@router.post(
    "/recommendations/run",
    response_model=APIResponse[AgentExecutionResult[RecommendationAgentResult]],
    summary="Execute Recommendation Agent with standardized BaseAgent lifecycle",
)
async def run_recommendation_agent(
    req: RecommendationEvaluateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Executes the Recommendation Agent using the standardized BaseAgent.run() wrapper,
    returning lifecycle timing, execution ID, telemetry, and structured result.
    """
    caller_id = str(current_user["id"])
    caller_role = current_user.get("role", UserRole.PATIENT.value)

    target_user_id = caller_id
    if req.target_user_id and req.target_user_id != caller_id:
        if caller_role not in (UserRole.ADMIN.value, UserRole.HEALTHCARE_WORKER.value):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Patients can only request recommendations for their own household.",
            )
        target_user_id = req.target_user_id

    agent_input = RecommendationAgentInput(
        user_id=target_user_id,
        family_member_id=req.family_member_id,
        caller_user_id=caller_id,
        caller_role=caller_role,
        reference_date=req.reference_date,
        include_optional_vaccines=req.include_optional_vaccines,
        eligible_for_je=req.eligible_for_je,
        query_knowledge_base=req.query_knowledge_base,
        correlation_id=req.correlation_id,
    )

    result = await recommendation_agent.run(input_data=agent_input)
    return APIResponse[AgentExecutionResult[RecommendationAgentResult]](
        success=True,
        message="Recommendation Agent run completed.",
        data=result,
    )


# =============================================================================
# Agent 5: Report Generation Agent Endpoints
# =============================================================================

class ReportGenerateRequest(BaseModel):
    target_user_id: Optional[str] = Field(default=None, description="Target household owner ID (Admin/Healthcare Worker only)")
    family_member_id: Optional[str] = Field(default=None, description="Target family member ID (optional, defaults to primary member)")
    report_type: ReportType = Field(default=ReportType.COMPREHENSIVE_RECORD, description="Type of report: comprehensive_record, vaccination_history, vaccination_status, progress_summary")
    output_format: ReportOutputFormat = Field(default=ReportOutputFormat.JSON, description="Output format: json or pdf")
    reference_date: Optional[date] = Field(default=None, description="Evaluation reference date (defaults to today)")
    include_recommendations: bool = Field(default=True, description="Include clinical recommendations in comprehensive report")
    include_data_quality: bool = Field(default=True, description="Include data quality checks and auditing discrepancies")
    include_private_optional: bool = Field(default=False, description="Evaluate private sector optional vaccines")
    eligible_for_je: bool = Field(default=False, description="Japanese Encephalitis endemic status")
    correlation_id: Optional[str] = Field(default=None, description="Cross-agent correlation ID")


@router.post(
    "/reports/generate",
    response_model=APIResponse[ReportAgentResult],
    summary="Generate structured immunization report (Agent 5)",
)
async def generate_report_endpoint(
    req: ReportGenerateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Executes the Report Generation Agent:
    - Verifies patient identity and strictly enforces multi-tenant household ownership.
    - Assembles verified administered vaccination histories from the clinical database.
    - Pulls deterministic schedule calculations from the authoritative Schedule Engine & Monitoring Agent.
    - Synthesizes personalized catch-up recommendations (if requested).
    - Computes cryptographic SHA-256 integrity checksum.
    - Produces structured JSON or Base64-encoded publication-grade PDF report.
    """
    caller_id = str(current_user["id"])
    caller_role = current_user.get("role", UserRole.PATIENT.value)

    target_user_id = caller_id
    if req.target_user_id and req.target_user_id != caller_id:
        if caller_role not in (UserRole.ADMIN.value, UserRole.HEALTHCARE_WORKER.value):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Patients can only generate reports for their own household.",
            )
        target_user_id = req.target_user_id

    agent_input = ReportAgentInput(
        user_id=target_user_id,
        family_member_id=req.family_member_id,
        report_type=req.report_type,
        output_format=req.output_format,
        reference_date=req.reference_date,
        include_recommendations=req.include_recommendations,
        include_data_quality=req.include_data_quality,
        include_private_optional=req.include_private_optional,
        eligible_for_je=req.eligible_for_je,
        caller_user_id=caller_id,
        caller_role=caller_role,
        correlation_id=req.correlation_id,
    )

    try:
        result = await report_agent.execute(input_data=agent_input)
        return APIResponse[ReportAgentResult](
            success=True,
            message="Vaccination report generated successfully.",
            data=result,
        )
    except PermissionError as pe:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(pe),
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as exc:
        logger.exception(f"Report Generation Agent error: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report Generation Agent error: {str(exc)}",
        )


@router.post(
    "/reports/download",
    summary="Download publication-grade immunization passport PDF",
    response_description="Binary PDF file stream",
)
async def download_report_pdf(
    req: ReportGenerateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Executes the Report Generation Agent with PDF output format,
    streaming the compiled vector PDF as a direct file download attachment.
    """
    caller_id = str(current_user["id"])
    caller_role = current_user.get("role", UserRole.PATIENT.value)

    target_user_id = caller_id
    if req.target_user_id and req.target_user_id != caller_id:
        if caller_role not in (UserRole.ADMIN.value, UserRole.HEALTHCARE_WORKER.value):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Patients can only generate reports for their own household.",
            )
        target_user_id = req.target_user_id

    # Enforce PDF output format
    agent_input = ReportAgentInput(
        user_id=target_user_id,
        family_member_id=req.family_member_id,
        report_type=req.report_type,
        output_format=ReportOutputFormat.PDF,
        reference_date=req.reference_date,
        include_recommendations=req.include_recommendations,
        include_data_quality=req.include_data_quality,
        include_private_optional=req.include_private_optional,
        eligible_for_je=req.eligible_for_je,
        caller_user_id=caller_id,
        caller_role=caller_role,
        correlation_id=req.correlation_id,
    )

    try:
        result = await report_agent.execute(input_data=agent_input)
        if not result.content_base64:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="PDF generation did not produce binary content.",
            )
        pdf_bytes = base64.b64decode(result.content_base64)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{result.filename}"',
                "X-Report-ID": result.report_id,
                "X-Verification-Hash": result.verification_hash,
            },
        )
    except PermissionError as pe:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(pe),
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report Generation Agent error: {str(exc)}",
        )


@router.post(
    "/reports/run",
    response_model=APIResponse[AgentExecutionResult[ReportAgentResult]],
    summary="Execute Report Generation Agent with standardized BaseAgent lifecycle",
)
async def run_report_agent(
    req: ReportGenerateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Executes the Report Generation Agent using the standardized BaseAgent.run() wrapper,
    returning lifecycle timing, execution ID, telemetry, and structured report result.
    """
    caller_id = str(current_user["id"])
    caller_role = current_user.get("role", UserRole.PATIENT.value)

    target_user_id = caller_id
    if req.target_user_id and req.target_user_id != caller_id:
        if caller_role not in (UserRole.ADMIN.value, UserRole.HEALTHCARE_WORKER.value):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Patients can only generate reports for their own household.",
            )
        target_user_id = req.target_user_id

    agent_input = ReportAgentInput(
        user_id=target_user_id,
        family_member_id=req.family_member_id,
        report_type=req.report_type,
        output_format=req.output_format,
        reference_date=req.reference_date,
        include_recommendations=req.include_recommendations,
        include_data_quality=req.include_data_quality,
        include_private_optional=req.include_private_optional,
        eligible_for_je=req.eligible_for_je,
        caller_user_id=caller_id,
        caller_role=caller_role,
        correlation_id=req.correlation_id,
    )

    result = await report_agent.run(input_data=agent_input)
    return APIResponse[AgentExecutionResult[ReportAgentResult]](
        success=True,
        message="Report Generation Agent run completed.",
        data=result,
    )


# =============================================================================
# Phase 9: Multi-Agent Orchestrator Endpoints
# =============================================================================

class OrchestratorRunRequest(BaseModel):
    target_user_id: Optional[str] = Field(default=None, description="Target household owner ID (Admin/Healthcare Worker only)")
    family_member_id: Optional[str] = Field(default=None, description="Optional target family member ID")
    workflow: OrchestrationWorkflowType = Field(default=OrchestrationWorkflowType.ROUTINE_CYCLE, description="Named orchestration workflow to execute")
    reference_date: Optional[date] = Field(default=None, description="Clinical evaluation reference date")
    query: Optional[str] = Field(default=None, description="Clinical inquiry for knowledge or consultation workflows")
    include_reminders: bool = Field(default=True, description="Whether to dispatch/preview reminders")
    include_recommendations: bool = Field(default=True, description="Whether to evaluate personalized recommendations")
    include_report: bool = Field(default=False, description="Whether to compile structured report/passport")
    report_type: ReportType = Field(default=ReportType.COMPREHENSIVE_RECORD, description="Report type if report is enabled")
    report_output_format: ReportOutputFormat = Field(default=ReportOutputFormat.JSON, description="Output format (json or pdf)")
    dry_run: bool = Field(default=False, description="Preview reminders and notifications without DB writes or external provider calls")
    force_dispatch_quiet_hours: bool = Field(default=False, description="Emergency override to bypass quiet hours")
    channels: Optional[List[NotificationChannel]] = Field(default=None, description="Explicit delivery channels override")
    include_private_optional: bool = Field(default=False, description="Include private sector optional vaccines")
    eligible_for_je: bool = Field(default=False, description="Japanese Encephalitis endemic status")
    continue_on_failure: bool = Field(default=True, description="Continue subsequent steps if a non-critical step fails")
    step_timeout_seconds: float = Field(default=60.0, ge=0.01, le=180.0, description="Maximum timeout per individual agent step")
    correlation_id: Optional[str] = Field(default=None, description="Distributed tracing / correlation ID")


class TaskRouteRequest(BaseModel):
    target_user_id: Optional[str] = Field(default=None, description="Target household owner ID (Admin/Healthcare Worker only)")
    family_member_id: Optional[str] = Field(default=None, description="Optional target family member ID")
    task_intent: str = Field(..., description="Target task intent: routine, advisory, reminder, report, knowledge, dynamic")
    query: Optional[str] = Field(default=None, description="Clinical inquiry string")
    reference_date: Optional[date] = Field(default=None, description="Clinical evaluation reference date")
    include_private_optional: bool = Field(default=False, description="Include private sector optional vaccines")
    dry_run: bool = Field(default=True, description="Preview actions without external side-effects")
    correlation_id: Optional[str] = Field(default=None, description="Distributed tracing / correlation ID")


@router.get(
    "/orchestrator/workflows",
    response_model=APIResponse[Dict[str, Any]],
    summary="List available multi-agent orchestration workflows",
)
async def list_orchestrator_workflows(
    current_user: dict = Depends(get_current_user),
):
    """
    Returns the metadata, dependency graph, inputs, and resilience strategies
    for all multi-agent orchestration workflows supported by VaxAssist AI.
    """
    catalog = multi_agent_orchestrator.get_workflow_catalog()
    return APIResponse[Dict[str, Any]](
        success=True,
        message="Orchestrator workflow catalog retrieved successfully.",
        data=catalog,
    )


@router.post(
    "/orchestrator/run",
    response_model=APIResponse[OrchestratorResult],
    summary="Execute multi-agent orchestration workflow (Phase 9)",
)
async def run_orchestrator_workflow(
    req: OrchestratorRunRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Executes a coordinated multi-agent workflow:
    - Verifies patient ownership & RBAC authorization.
    - Chains agent outputs (Monitoring -> Reminder -> Recommendation -> Report / Knowledge).
    - Applies step-level timeouts and fault-tolerant error boundaries.
    - Aggregates telemetry, milestone counts, and execution summaries.
    """
    caller_id = str(current_user["id"])
    caller_role = current_user.get("role", UserRole.PATIENT.value)

    target_user_id = caller_id
    if req.target_user_id and req.target_user_id != caller_id:
        if caller_role not in (UserRole.ADMIN.value, UserRole.HEALTHCARE_WORKER.value):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Patients can only orchestrate workflows for their own household.",
            )
        target_user_id = req.target_user_id

    agent_input = OrchestratorInput(
        workflow=req.workflow,
        user_id=target_user_id,
        family_member_id=req.family_member_id,
        reference_date=req.reference_date,
        caller_user_id=caller_id,
        caller_role=caller_role,
        query=req.query,
        include_reminders=req.include_reminders,
        include_recommendations=req.include_recommendations,
        include_report=req.include_report,
        report_type=req.report_type,
        report_output_format=req.report_output_format,
        dry_run=req.dry_run,
        force_dispatch_quiet_hours=req.force_dispatch_quiet_hours,
        channels=req.channels,
        include_private_optional=req.include_private_optional,
        eligible_for_je=req.eligible_for_je,
        continue_on_failure=req.continue_on_failure,
        step_timeout_seconds=req.step_timeout_seconds,
        correlation_id=req.correlation_id,
    )

    try:
        result = await multi_agent_orchestrator.execute(input_data=agent_input)
        return APIResponse[OrchestratorResult](
            success=True,
            message=f"Orchestration workflow '{req.workflow.value}' executed successfully.",
            data=result,
        )
    except PermissionError as pe:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(pe),
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Multi-Agent Orchestrator error: {str(exc)}",
        )


@router.post(
    "/orchestrator/route",
    response_model=APIResponse[OrchestratorResult],
    summary="Dynamically route tasks across multi-agent ecosystem",
)
async def route_orchestrator_task(
    req: TaskRouteRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Dynamically routes a task intent to the optimal multi-agent workflow.
    """
    caller_id = str(current_user["id"])
    caller_role = current_user.get("role", UserRole.PATIENT.value)

    target_user_id = caller_id
    if req.target_user_id and req.target_user_id != caller_id:
        if caller_role not in (UserRole.ADMIN.value, UserRole.HEALTHCARE_WORKER.value):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Patients can only route tasks for their own household.",
            )
        target_user_id = req.target_user_id

    # Map intent to workflow
    intent_clean = req.task_intent.lower().strip()
    if any(k in intent_clean for k in ("routine", "sweep", "cycle", "full", "check")):
        workflow = OrchestrationWorkflowType.ROUTINE_CYCLE
        inc_rem = True
        inc_rec = True
        inc_rep = False
    elif any(k in intent_clean for k in ("advisory", "recommend", "catchup", "consult")):
        workflow = OrchestrationWorkflowType.CLINICAL_ADVISORY
        inc_rem = False
        inc_rec = True
        inc_rep = False
    elif any(k in intent_clean for k in ("remind", "alert", "notify")):
        workflow = OrchestrationWorkflowType.REMINDER_PIPELINE
        inc_rem = True
        inc_rec = False
        inc_rep = False
    elif any(k in intent_clean for k in ("report", "passport", "cert", "history", "download")):
        workflow = OrchestrationWorkflowType.COMPREHENSIVE_RECORD
        inc_rem = False
        inc_rec = True
        inc_rep = True
    elif any(k in intent_clean for k in ("ask", "knowledge", "inquiry", "question", "rag")):
        workflow = OrchestrationWorkflowType.KNOWLEDGE_INQUIRY
        inc_rem = False
        inc_rec = False
        inc_rep = False
    else:
        workflow = OrchestrationWorkflowType.DYNAMIC_ROUTE
        inc_rem = True
        inc_rec = True
        inc_rep = False

    agent_input = OrchestratorInput(
        workflow=workflow,
        user_id=target_user_id,
        family_member_id=req.family_member_id,
        reference_date=req.reference_date,
        caller_user_id=caller_id,
        caller_role=caller_role,
        query=req.query,
        include_reminders=inc_rem,
        include_recommendations=inc_rec,
        include_report=inc_rep,
        dry_run=req.dry_run,
        include_private_optional=req.include_private_optional,
        correlation_id=req.correlation_id,
    )

    try:
        result = await multi_agent_orchestrator.execute(input_data=agent_input)
        return APIResponse[OrchestratorResult](
            success=True,
            message=f"Task routed to workflow '{workflow.value}' and executed successfully.",
            data=result,
        )
    except PermissionError as pe:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(pe),
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Task routing error: {str(exc)}",
        )


@router.post(
    "/orchestrator/run-lifecycle",
    response_model=APIResponse[AgentExecutionResult[OrchestratorResult]],
    summary="Execute Multi-Agent Orchestrator via BaseAgent lifecycle wrapper",
)
async def run_orchestrator_lifecycle(
    req: OrchestratorRunRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Executes the Multi-Agent Orchestrator wrapped inside the standardized
    BaseAgent.run() envelope for execution timing, execution ID, and telemetry.
    """
    caller_id = str(current_user["id"])
    caller_role = current_user.get("role", UserRole.PATIENT.value)

    target_user_id = caller_id
    if req.target_user_id and req.target_user_id != caller_id:
        if caller_role not in (UserRole.ADMIN.value, UserRole.HEALTHCARE_WORKER.value):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Patients can only orchestrate workflows for their own household.",
            )
        target_user_id = req.target_user_id

    agent_input = OrchestratorInput(
        workflow=req.workflow,
        user_id=target_user_id,
        family_member_id=req.family_member_id,
        reference_date=req.reference_date,
        caller_user_id=caller_id,
        caller_role=caller_role,
        query=req.query,
        include_reminders=req.include_reminders,
        include_recommendations=req.include_recommendations,
        include_report=req.include_report,
        report_type=req.report_type,
        report_output_format=req.report_output_format,
        dry_run=req.dry_run,
        force_dispatch_quiet_hours=req.force_dispatch_quiet_hours,
        channels=req.channels,
        include_private_optional=req.include_private_optional,
        eligible_for_je=req.eligible_for_je,
        continue_on_failure=req.continue_on_failure,
        step_timeout_seconds=req.step_timeout_seconds,
        correlation_id=req.correlation_id,
    )

    result = await multi_agent_orchestrator.run(input_data=agent_input)
    return APIResponse[AgentExecutionResult[OrchestratorResult]](
        success=True,
        message="Multi-Agent Orchestrator run completed.",
        data=result,
    )



