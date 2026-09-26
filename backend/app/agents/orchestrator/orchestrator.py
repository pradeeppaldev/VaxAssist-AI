"""
VaxAssist AI - Multi-Agent Orchestrator (Phase 9).

Coordinates the five specialized Phase 8 agents:
1. Monitoring Agent (agent_monitoring_v1)
2. Reminder Agent (agent_reminder_v1)
3. Knowledge / RAG Agent (agent_knowledge_rag_v1)
4. Recommendation Agent (agent_recommendation_v1)
5. Report Generation Agent (agent_report_generation_v1)

Implements task routing, sequential chaining, conditional invocation,
fault-tolerant error containment, and multi-tenant security preservation.
"""
import asyncio
from datetime import datetime, date
import logging
import time
from typing import Optional, Dict, Any, List, Tuple
import uuid

from app.agents.base import BaseAgent, AgentStatus
from app.models.user import UserRole
from app.agents.orchestrator.schemas import (
    OrchestrationWorkflowType,
    StepExecutionStatus,
    WorkflowStepResult,
    OrchestratorInput,
    OrchestratorResult,
    WorkflowSpecification,
)
from app.agents.monitoring import (
    monitoring_agent,
    MonitoringAgentInput,
    MonitoringAgentResult,
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

logger = logging.getLogger("vaxassist.agents.orchestrator")


WORKFLOW_SPECIFICATIONS: Dict[OrchestrationWorkflowType, WorkflowSpecification] = {
    OrchestrationWorkflowType.ROUTINE_CYCLE: WorkflowSpecification(
        workflow=OrchestrationWorkflowType.ROUTINE_CYCLE,
        name="Household Routine Vaccination Sweep",
        description="Authoritative clinical milestone evaluation followed by conditional reminder dispatch, catch-up recommendations, and optional report generation.",
        steps=["monitoring", "reminder", "recommendation", "report"],
        conditional_steps=["reminder (requires actionable events)", "report (optional)"],
        inputs=["user_id", "family_member_id", "reference_date", "include_reminders", "include_recommendations"],
        resilience_strategy="CONTINUE_ON_FAILURE for downstream communication and reporting",
    ),
    OrchestrationWorkflowType.CLINICAL_ADVISORY: WorkflowSpecification(
        workflow=OrchestrationWorkflowType.CLINICAL_ADVISORY,
        name="Comprehensive Clinical Decision Support",
        description="Evaluates patient clinical state, synthesizes personalized catch-up pathways, and grounds complex inquiries with verified MoHFW/WHO guidelines.",
        steps=["monitoring", "recommendation", "knowledge"],
        conditional_steps=["knowledge (triggered when clinical query is present)"],
        inputs=["user_id", "family_member_id", "query", "reference_date"],
        resilience_strategy="CONTINUE_ON_FAILURE with fallback to deterministic recommendations",
    ),
    OrchestrationWorkflowType.REMINDER_PIPELINE: WorkflowSpecification(
        workflow=OrchestrationWorkflowType.REMINDER_PIPELINE,
        name="Actionable Reminder Dispatch Pipeline",
        description="Detects upcoming and overdue doses and securely gates them through quiet hours, channel preferences, and idempotency deduplication.",
        steps=["monitoring", "reminder"],
        conditional_steps=["reminder (skipped if no actionable milestones exist)"],
        inputs=["user_id", "family_member_id", "channels", "dry_run", "force_dispatch_quiet_hours"],
        resilience_strategy="Graceful capture of delivery provider outages without database corruption",
    ),
    OrchestrationWorkflowType.COMPREHENSIVE_RECORD: WorkflowSpecification(
        workflow=OrchestrationWorkflowType.COMPREHENSIVE_RECORD,
        name="Official Immunization Passport Pipeline",
        description="Assembles complete historical immunization records, compliance calculations, recommendations, and SHA-256 verifiable document.",
        steps=["monitoring", "recommendation", "report"],
        conditional_steps=["recommendation (can be omitted for pure history)"],
        inputs=["user_id", "family_member_id", "report_type", "report_output_format"],
        resilience_strategy="Strict failure capture on primary history, soft fallback on recommendations",
    ),
    OrchestrationWorkflowType.KNOWLEDGE_INQUIRY: WorkflowSpecification(
        workflow=OrchestrationWorkflowType.KNOWLEDGE_INQUIRY,
        name="Clinical Knowledge Consultation",
        description="Queries official MoHFW/WHO guidelines and immunization schedules via grounded RAG with verifiable source citations.",
        steps=["knowledge"],
        conditional_steps=[],
        inputs=["query", "top_k", "authority_filter"],
        resilience_strategy="Strict clinical disclaimer attachment on insufficient evidence",
    ),
    OrchestrationWorkflowType.DYNAMIC_ROUTE: WorkflowSpecification(
        workflow=OrchestrationWorkflowType.DYNAMIC_ROUTE,
        name="Dynamic Task Router",
        description="Analyzes request parameters and dynamically routes execution across appropriate specialized agents.",
        steps=["dynamic"],
        conditional_steps=["All steps conditionally evaluated based on intent"],
        inputs=["user_id", "workflow", "query", "include_reminders", "include_recommendations"],
        resilience_strategy="Per-step isolated error boundaries",
    ),
}


class MultiAgentOrchestrator(BaseAgent):
    """
    Centralized coordinator for VaxAssist AI's multi-agent ecosystem.
    Manages task routing, data chaining, conditional gating, fault tolerance,
    and multi-tenant security enforcement.
    """

    def __init__(self):
        super().__init__(
            agent_id="agent_orchestrator_v1",
            name="Multi-Agent Orchestrator",
            description=(
                "Coordinates the five specialized Phase 8 agents: Monitoring, Reminder, "
                "Knowledge, Recommendation, and Report Generation. Provides workflow chaining, "
                "conditional branch routing, timeout containment, and resilient error recovery."
            ),
            version="1.0.0",
        )

    def get_workflow_catalog(self) -> Dict[str, Any]:
        """Returns metadata and step topology for all supported workflows."""
        return {
            wf.value: spec.model_dump()
            for wf, spec in WORKFLOW_SPECIFICATIONS.items()
        }

    async def _execute_step(
        self,
        step_name: str,
        agent_id: str,
        coroutine,
        timeout_seconds: float,
    ) -> Tuple[StepExecutionStatus, Any, float, Optional[str]]:
        """
        Executes an individual agent step with duration measurement, timeout protection,
        and exception containment.
        Returns (status, data, duration_ms, error_message).
        """
        start = time.perf_counter()
        try:
            result_data = await asyncio.wait_for(coroutine, timeout=timeout_seconds)
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.info(f"[Orchestrator] Step '{step_name}' ({agent_id}) succeeded in {duration_ms}ms")
            return StepExecutionStatus.SUCCESS, result_data, duration_ms, None
        except asyncio.TimeoutError:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            err_msg = f"Step '{step_name}' timed out after {timeout_seconds}s"
            logger.error(f"[Orchestrator] {err_msg}")
            return StepExecutionStatus.TIMEOUT, None, duration_ms, err_msg
        except Exception as exc:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            err_msg = str(exc)
            logger.error(f"[Orchestrator] Step '{step_name}' failed after {duration_ms}ms: {err_msg}")
            return StepExecutionStatus.FAILED, None, duration_ms, err_msg

    async def execute(self, input_data: OrchestratorInput) -> OrchestratorResult:
        """
        Executes the designated multi-agent workflow.
        Strictly enforces tenant data ownership, validates inputs, and chains agent outputs.
        """
        overall_start = time.perf_counter()
        cid = input_data.correlation_id or f"orch_{uuid.uuid4().hex[:12]}"
        ref_date = input_data.reference_date or date.today()

        # 1. Multi-Tenant Authorization & Household Isolation
        caller_id = input_data.caller_user_id or input_data.user_id
        caller_role = input_data.caller_role or UserRole.PATIENT.value

        if caller_id != input_data.user_id:
            valid_elevated_roles = (
                UserRole.ADMIN.value,
                UserRole.HEALTHCARE_WORKER.value,
                "ADMIN",
                "HEALTHCARE_WORKER",
            )
            if caller_role not in valid_elevated_roles:
                raise PermissionError(
                    f"Access Denied: Caller '{caller_id}' ({caller_role}) is not authorized "
                    f"to orchestrate workflows for household '{input_data.user_id}'."
                )

        # Initialize result container
        result = OrchestratorResult(
            workflow=input_data.workflow,
            workflow_status=AgentStatus.SUCCESS,
            user_id=input_data.user_id,
            family_member_id=input_data.family_member_id,
            reference_date=ref_date,
            correlation_id=cid,
            created_at=datetime.utcnow(),
        )

        # 2. Dispatch to specific workflow runner
        if input_data.workflow == OrchestrationWorkflowType.ROUTINE_CYCLE:
            await self._run_routine_cycle(input_data, result, cid, ref_date)
        elif input_data.workflow == OrchestrationWorkflowType.CLINICAL_ADVISORY:
            await self._run_clinical_advisory(input_data, result, cid, ref_date)
        elif input_data.workflow == OrchestrationWorkflowType.REMINDER_PIPELINE:
            await self._run_reminder_pipeline(input_data, result, cid, ref_date)
        elif input_data.workflow == OrchestrationWorkflowType.COMPREHENSIVE_RECORD:
            await self._run_comprehensive_record(input_data, result, cid, ref_date)
        elif input_data.workflow == OrchestrationWorkflowType.KNOWLEDGE_INQUIRY:
            await self._run_knowledge_inquiry(input_data, result, cid)
        elif input_data.workflow == OrchestrationWorkflowType.DYNAMIC_ROUTE:
            await self._run_dynamic_route(input_data, result, cid, ref_date)
        else:
            raise ValueError(f"Unsupported orchestration workflow: '{input_data.workflow}'")

        # 3. Post-execution telemetry & status calculation
        result.total_duration_ms = round((time.perf_counter() - overall_start) * 1000, 2)

        # Aggregate counts
        if result.monitoring:
            result.actionable_events_count = len(result.monitoring.actionable_events)
            result.data_quality_issues_count = len(result.monitoring.data_quality_issues)
        if result.reminder:
            result.reminders_dispatched_count = len(result.reminder.dispatched_reminders)
        if result.recommendation:
            result.recommendations_count = getattr(
                result.recommendation, "total_recommendations_count",
                getattr(result.recommendation, "total_recommendations", 0)
            )
        if result.report:
            result.report_checksum = getattr(
                result.report, "verification_hash",
                getattr(result.report, "verification_checksum", None)
            )

        # Determine overall workflow status
        failed_count = len(result.steps_failed)
        executed_count = len(result.steps_executed)

        if failed_count == 0:
            result.workflow_status = AgentStatus.SUCCESS
        elif executed_count > 0:
            result.workflow_status = AgentStatus.PARTIAL_SUCCESS
        else:
            result.workflow_status = AgentStatus.FAILED

        # Build human-readable executive summary
        summary_parts = [
            f"Workflow '{input_data.workflow.value}' completed with status {result.workflow_status.value} in {result.total_duration_ms}ms.",
            f"Steps executed ({len(result.steps_executed)}): {', '.join(result.steps_executed) if result.steps_executed else 'None'}.",
        ]
        if result.steps_skipped:
            summary_parts.append(f"Steps skipped ({len(result.steps_skipped)}): {', '.join(result.steps_skipped)}.")
        if result.steps_failed:
            summary_parts.append(f"Steps failed ({len(result.steps_failed)}): {', '.join(result.steps_failed)}.")
        if result.monitoring:
            summary_parts.append(
                f"Clinical milestones: {result.actionable_events_count} actionable event(s) detected across "
                f"{len(result.monitoring.member_assessments)} member(s)."
            )
        if result.reminder:
            dup_cnt = getattr(result.reminder, "total_skipped_duplicate", getattr(result.reminder, "skipped_duplicate_count", 0))
            summary_parts.append(
                f"Reminders: {result.reminders_dispatched_count} dispatched, "
                f"{dup_cnt} skipped as duplicate."
            )
        if result.recommendation:
            summary_parts.append(f"Advisory: {result.recommendations_count} clinical recommendation(s) generated.")
        if result.report:
            rep_type_val = getattr(result.report.report_type, "value", str(result.report.report_type))
            chk = result.report_checksum[:8] if result.report_checksum else "N/A"
            summary_parts.append(f"Report: Compiled ({rep_type_val}) with checksum {chk}...")

        result.summary = " ".join(summary_parts)
        return result

    # =========================================================================
    # Workflow Implementations
    # =========================================================================

    async def _run_routine_cycle(
        self,
        input_data: OrchestratorInput,
        result: OrchestratorResult,
        cid: str,
        ref_date: date,
    ):
        """
        Executes the full household routine cycle:
        Monitoring -> (Conditional) Reminder -> (Conditional) Recommendation -> (Optional) Report
        """
        # Step 1: Monitoring Agent (Sensory Foundation)
        mon_input = MonitoringAgentInput(
            user_id=input_data.user_id,
            family_member_id=input_data.family_member_id,
            reference_date=ref_date,
            caller_user_id=input_data.caller_user_id,
            caller_role=input_data.caller_role,
            include_private_optional=input_data.include_private_optional,
            eligible_for_je=input_data.eligible_for_je,
            dispatch_notifications=False,  # Notification handling delegated to Reminder Agent
        )
        status, data, dur, err = await self._execute_step(
            step_name="monitoring",
            agent_id="agent_monitoring_v1",
            coroutine=monitoring_agent.execute(input_data=mon_input),
            timeout_seconds=input_data.step_timeout_seconds,
        )
        self._record_step(result, "monitoring", "agent_monitoring_v1", status, dur, data, err)

        if status != StepExecutionStatus.SUCCESS:
            if not input_data.continue_on_failure:
                return
        else:
            result.monitoring = data

        # Step 2: Reminder Agent (Conditional on actionable events and toggle)
        actionable_events = result.monitoring.actionable_events if result.monitoring else []
        if not input_data.include_reminders:
            self._skip_step(result, "reminder", "include_reminders toggle is disabled")
        elif not actionable_events:
            self._skip_step(result, "reminder", "No actionable vaccination events detected by Monitoring Agent")
        else:
            rem_input = ReminderAgentInput(
                user_id=input_data.user_id,
                family_member_id=input_data.family_member_id,
                caller_user_id=input_data.caller_user_id,
                caller_role=input_data.caller_role,
                events=actionable_events,
                reference_date=ref_date,
                dry_run=input_data.dry_run,
                correlation_id=cid,
                force_dispatch_quiet_hours=input_data.force_dispatch_quiet_hours,
                channels=input_data.channels,
            )
            r_status, r_data, r_dur, r_err = await self._execute_step(
                step_name="reminder",
                agent_id="agent_reminder_v1",
                coroutine=reminder_agent.execute(input_data=rem_input),
                timeout_seconds=input_data.step_timeout_seconds,
            )
            self._record_step(result, "reminder", "agent_reminder_v1", r_status, r_dur, r_data, r_err)
            if r_status == StepExecutionStatus.SUCCESS:
                result.reminder = r_data

        # Step 3: Recommendation Agent (Conditional on toggle)
        if not input_data.include_recommendations:
            self._skip_step(result, "recommendation", "include_recommendations toggle is disabled")
        else:
            rec_input = RecommendationAgentInput(
                user_id=input_data.user_id,
                family_member_id=input_data.family_member_id,
                caller_user_id=input_data.caller_user_id,
                caller_role=input_data.caller_role,
                reference_date=ref_date,
                include_optional_vaccines=input_data.include_private_optional,
                eligible_for_je=input_data.eligible_for_je,
                query_knowledge_base=bool(input_data.query),
                correlation_id=cid,
            )
            rc_status, rc_data, rc_dur, rc_err = await self._execute_step(
                step_name="recommendation",
                agent_id="agent_recommendation_v1",
                coroutine=recommendation_agent.execute(
                    input_data=rec_input,
                    monitoring_result_fixture=result.monitoring,
                ),
                timeout_seconds=input_data.step_timeout_seconds,
            )
            self._record_step(result, "recommendation", "agent_recommendation_v1", rc_status, rc_dur, rc_data, rc_err)
            if rc_status == StepExecutionStatus.SUCCESS:
                result.recommendation = rc_data

        # Step 4: Report Generation Agent (Optional)
        if not input_data.include_report:
            self._skip_step(result, "report", "include_report toggle is disabled")
        else:
            rep_input = ReportAgentInput(
                user_id=input_data.user_id,
                family_member_id=input_data.family_member_id,
                report_type=input_data.report_type,
                output_format=input_data.report_output_format,
                reference_date=ref_date,
                include_recommendations=input_data.include_recommendations,
                include_data_quality=True,
                include_private_optional=input_data.include_private_optional,
                eligible_for_je=input_data.eligible_for_je,
                caller_user_id=input_data.caller_user_id,
                caller_role=input_data.caller_role,
                correlation_id=cid,
            )
            rp_status, rp_data, rp_dur, rp_err = await self._execute_step(
                step_name="report",
                agent_id="agent_report_generation_v1",
                coroutine=report_agent.execute(
                    input_data=rep_input,
                    monitoring_result_fixture=result.monitoring,
                    recommendation_result_fixture=result.recommendation,
                ),
                timeout_seconds=input_data.step_timeout_seconds,
            )
            self._record_step(result, "report", "agent_report_generation_v1", rp_status, rp_dur, rp_data, rp_err)
            if rp_status == StepExecutionStatus.SUCCESS:
                result.report = rp_data

    async def _run_clinical_advisory(
        self,
        input_data: OrchestratorInput,
        result: OrchestratorResult,
        cid: str,
        ref_date: date,
    ):
        """
        Executes clinical decision support workflow:
        Monitoring -> Recommendation -> (Optional) Knowledge / RAG Agent
        """
        # Step 1: Monitoring
        mon_input = MonitoringAgentInput(
            user_id=input_data.user_id,
            family_member_id=input_data.family_member_id,
            reference_date=ref_date,
            caller_user_id=input_data.caller_user_id,
            caller_role=input_data.caller_role,
            include_private_optional=input_data.include_private_optional,
            eligible_for_je=input_data.eligible_for_je,
            dispatch_notifications=False,
        )
        status, data, dur, err = await self._execute_step(
            step_name="monitoring",
            agent_id="agent_monitoring_v1",
            coroutine=monitoring_agent.execute(input_data=mon_input),
            timeout_seconds=input_data.step_timeout_seconds,
        )
        self._record_step(result, "monitoring", "agent_monitoring_v1", status, dur, data, err)
        if status == StepExecutionStatus.SUCCESS:
            result.monitoring = data
        else:
            if not input_data.continue_on_failure:
                return

        # Step 2: Recommendation
        rec_input = RecommendationAgentInput(
            user_id=input_data.user_id,
            family_member_id=input_data.family_member_id,
            caller_user_id=input_data.caller_user_id,
            caller_role=input_data.caller_role,
            reference_date=ref_date,
            include_optional_vaccines=input_data.include_private_optional,
            eligible_for_je=input_data.eligible_for_je,
            query_knowledge_base=False,
            correlation_id=cid,
        )
        rc_status, rc_data, rc_dur, rc_err = await self._execute_step(
            step_name="recommendation",
            agent_id="agent_recommendation_v1",
            coroutine=recommendation_agent.execute(
                input_data=rec_input,
                monitoring_result_fixture=result.monitoring,
            ),
            timeout_seconds=input_data.step_timeout_seconds,
        )
        self._record_step(result, "recommendation", "agent_recommendation_v1", rc_status, rc_dur, rc_data, rc_err)
        if rc_status == StepExecutionStatus.SUCCESS:
            result.recommendation = rc_data

        # Step 3: Knowledge / RAG Agent (if query supplied)
        if input_data.query:
            k_input = KnowledgeAgentInput(
                question=input_data.query,
                correlation_id=cid,
            )
            k_status, k_data, k_dur, k_err = await self._execute_step(
                step_name="knowledge",
                agent_id="agent_knowledge_rag_v1",
                coroutine=knowledge_agent.execute(input_data=k_input),
                timeout_seconds=input_data.step_timeout_seconds,
            )
            self._record_step(result, "knowledge", "agent_knowledge_rag_v1", k_status, k_dur, k_data, k_err)
            if k_status == StepExecutionStatus.SUCCESS:
                result.knowledge = k_data
        else:
            self._skip_step(result, "knowledge", "No clinical question/query supplied for Knowledge Agent")

    async def _run_reminder_pipeline(
        self,
        input_data: OrchestratorInput,
        result: OrchestratorResult,
        cid: str,
        ref_date: date,
    ):
        """
        Executes dedicated reminder pipeline:
        Monitoring -> Reminder (with idempotency, quiet hours, and channel gating)
        """
        # Step 1: Monitoring
        mon_input = MonitoringAgentInput(
            user_id=input_data.user_id,
            family_member_id=input_data.family_member_id,
            reference_date=ref_date,
            caller_user_id=input_data.caller_user_id,
            caller_role=input_data.caller_role,
            include_private_optional=input_data.include_private_optional,
            eligible_for_je=input_data.eligible_for_je,
            dispatch_notifications=False,
        )
        status, data, dur, err = await self._execute_step(
            step_name="monitoring",
            agent_id="agent_monitoring_v1",
            coroutine=monitoring_agent.execute(input_data=mon_input),
            timeout_seconds=input_data.step_timeout_seconds,
        )
        self._record_step(result, "monitoring", "agent_monitoring_v1", status, dur, data, err)
        if status != StepExecutionStatus.SUCCESS:
            return
        result.monitoring = data

        # Step 2: Reminder
        actionable_events = result.monitoring.actionable_events
        if not actionable_events:
            self._skip_step(result, "reminder", "Zero actionable events detected for reminder dispatch")
            return

        rem_input = ReminderAgentInput(
            user_id=input_data.user_id,
            family_member_id=input_data.family_member_id,
            caller_user_id=input_data.caller_user_id,
            caller_role=input_data.caller_role,
            events=actionable_events,
            reference_date=ref_date,
            dry_run=input_data.dry_run,
            correlation_id=cid,
            force_dispatch_quiet_hours=input_data.force_dispatch_quiet_hours,
            channels=input_data.channels,
        )
        r_status, r_data, r_dur, r_err = await self._execute_step(
            step_name="reminder",
            agent_id="agent_reminder_v1",
            coroutine=reminder_agent.execute(input_data=rem_input),
            timeout_seconds=input_data.step_timeout_seconds,
        )
        self._record_step(result, "reminder", "agent_reminder_v1", r_status, r_dur, r_data, r_err)
        if r_status == StepExecutionStatus.SUCCESS:
            result.reminder = r_data

    async def _run_comprehensive_record(
        self,
        input_data: OrchestratorInput,
        result: OrchestratorResult,
        cid: str,
        ref_date: date,
    ):
        """
        Executes comprehensive record pipeline:
        Monitoring -> Recommendation -> Report Generation Agent
        """
        # Step 1: Monitoring
        mon_input = MonitoringAgentInput(
            user_id=input_data.user_id,
            family_member_id=input_data.family_member_id,
            reference_date=ref_date,
            caller_user_id=input_data.caller_user_id,
            caller_role=input_data.caller_role,
            include_private_optional=input_data.include_private_optional,
            eligible_for_je=input_data.eligible_for_je,
            dispatch_notifications=False,
        )
        status, data, dur, err = await self._execute_step(
            step_name="monitoring",
            agent_id="agent_monitoring_v1",
            coroutine=monitoring_agent.execute(input_data=mon_input),
            timeout_seconds=input_data.step_timeout_seconds,
        )
        self._record_step(result, "monitoring", "agent_monitoring_v1", status, dur, data, err)
        if status == StepExecutionStatus.SUCCESS:
            result.monitoring = data
        else:
            if not input_data.continue_on_failure:
                return

        # Step 2: Recommendation (if requested)
        if input_data.include_recommendations:
            rec_input = RecommendationAgentInput(
                user_id=input_data.user_id,
                family_member_id=input_data.family_member_id,
                caller_user_id=input_data.caller_user_id,
                caller_role=input_data.caller_role,
                reference_date=ref_date,
                include_optional_vaccines=input_data.include_private_optional,
                eligible_for_je=input_data.eligible_for_je,
                query_knowledge_base=False,
                correlation_id=cid,
            )
            rc_status, rc_data, rc_dur, rc_err = await self._execute_step(
                step_name="recommendation",
                agent_id="agent_recommendation_v1",
                coroutine=recommendation_agent.execute(
                    input_data=rec_input,
                    monitoring_result_fixture=result.monitoring,
                ),
                timeout_seconds=input_data.step_timeout_seconds,
            )
            self._record_step(result, "recommendation", "agent_recommendation_v1", rc_status, rc_dur, rc_data, rc_err)
            if rc_status == StepExecutionStatus.SUCCESS:
                result.recommendation = rc_data
        else:
            self._skip_step(result, "recommendation", "include_recommendations disabled")

        # Step 3: Report Agent
        rep_input = ReportAgentInput(
            user_id=input_data.user_id,
            family_member_id=input_data.family_member_id,
            report_type=input_data.report_type,
            output_format=input_data.report_output_format,
            reference_date=ref_date,
            include_recommendations=input_data.include_recommendations,
            include_data_quality=True,
            include_private_optional=input_data.include_private_optional,
            eligible_for_je=input_data.eligible_for_je,
            caller_user_id=input_data.caller_user_id,
            caller_role=input_data.caller_role,
            correlation_id=cid,
        )
        rp_status, rp_data, rp_dur, rp_err = await self._execute_step(
            step_name="report",
            agent_id="agent_report_generation_v1",
            coroutine=report_agent.execute(
                input_data=rep_input,
                monitoring_result_fixture=result.monitoring,
                recommendation_result_fixture=result.recommendation,
            ),
            timeout_seconds=input_data.step_timeout_seconds,
        )
        self._record_step(result, "report", "agent_report_generation_v1", rp_status, rp_dur, rp_data, rp_err)
        if rp_status == StepExecutionStatus.SUCCESS:
            result.report = rp_data

    async def _run_knowledge_inquiry(
        self,
        input_data: OrchestratorInput,
        result: OrchestratorResult,
        cid: str,
    ):
        """
        Executes dedicated knowledge inquiry workflow:
        Knowledge / RAG Agent directly with grounded evidence.
        """
        if not input_data.query:
            raise ValueError("Knowledge inquiry workflow requires a valid non-empty 'query'.")

        k_input = KnowledgeAgentInput(
            question=input_data.query,
            correlation_id=cid,
        )
        k_status, k_data, k_dur, k_err = await self._execute_step(
            step_name="knowledge",
            agent_id="agent_knowledge_rag_v1",
            coroutine=knowledge_agent.execute(input_data=k_input),
            timeout_seconds=input_data.step_timeout_seconds,
        )
        self._record_step(result, "knowledge", "agent_knowledge_rag_v1", k_status, k_dur, k_data, k_err)
        if k_status == StepExecutionStatus.SUCCESS:
            result.knowledge = k_data

    async def _run_dynamic_route(
        self,
        input_data: OrchestratorInput,
        result: OrchestratorResult,
        cid: str,
        ref_date: date,
    ):
        """
        Dynamically analyzes parameters to determine and execute only requested agents.
        """
        # If query supplied without patient context, route to Knowledge Agent
        if input_data.query and not input_data.include_reminders and not input_data.include_recommendations and not input_data.include_report:
            await self._run_knowledge_inquiry(input_data, result, cid)
            return

        # Otherwise run selective pipeline based on flags
        if input_data.include_report:
            await self._run_comprehensive_record(input_data, result, cid, ref_date)
        elif input_data.include_reminders:
            await self._run_routine_cycle(input_data, result, cid, ref_date)
        else:
            await self._run_clinical_advisory(input_data, result, cid, ref_date)

    # =========================================================================
    # Step Recording Utilities
    # =========================================================================

    def _record_step(
        self,
        result: OrchestratorResult,
        step_name: str,
        agent_id: str,
        status: StepExecutionStatus,
        duration_ms: float,
        data: Any,
        error: Optional[str],
    ):
        """Records execution telemetry for an attempted agent step."""
        if status == StepExecutionStatus.SUCCESS:
            result.steps_executed.append(step_name)
        else:
            result.steps_failed.append(step_name)

        result.step_results[step_name] = WorkflowStepResult(
            step_name=step_name,
            agent_id=agent_id,
            status=status,
            duration_ms=duration_ms,
            summary=f"Step '{step_name}' finished with status {status.value}.",
            error=error,
            timestamp=datetime.utcnow(),
        )

    def _skip_step(self, result: OrchestratorResult, step_name: str, reason: str):
        """Records a skipped agent step with documented reason."""
        result.steps_skipped.append(step_name)
        result.step_results[step_name] = WorkflowStepResult(
            step_name=step_name,
            agent_id="N/A",
            status=StepExecutionStatus.SKIPPED,
            duration_ms=0.0,
            summary=f"Skipped: {reason}",
            error=None,
            timestamp=datetime.utcnow(),
        )
        logger.info(f"[Orchestrator] Step '{step_name}' skipped: {reason}")


# Global singleton instance
multi_agent_orchestrator = MultiAgentOrchestrator()
