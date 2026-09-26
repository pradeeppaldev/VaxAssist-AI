"""
VaxAssist AI - Phase 9: Multi-Agent Orchestrator Comprehensive Test Suite.

Validates the centralized orchestrator coordinating all five Phase 8 agents:
1. Monitoring Agent (agent_monitoring_v1)
2. Reminder Agent (agent_reminder_v1)
3. Knowledge / RAG Agent (agent_knowledge_rag_v1)
4. Recommendation Agent (agent_recommendation_v1)
5. Report Generation Agent (agent_report_generation_v1)

Test Scenarios:
1. BaseAgent Architecture & Lifecycle Telemetry
2. Full Routine Cycle Workflow (Monitoring -> Reminder -> Recommendation)
3. Clinical Advisory Workflow with Knowledge RAG Grounding
4. Dedicated Reminder Pipeline with Idempotency & Deduplication
5. Comprehensive Immunization Passport Pipeline (Report Agent + SHA-256)
6. Dedicated Knowledge Inquiry Workflow
7. Conditional Step Skipping (No Actionable Events / Disabled Toggles)
8. Fault Tolerance, Resiliency & Partial Success on Step Failure
9. Step Timeout Containment & Isolated Error Boundaries
10. Multi-Tenant Household Isolation & RBAC Security Enforcement
11. Dynamic Task Intent Routing (/route)
12. FastAPI Endpoints via TestClient (/workflows, /run, /route, /run-lifecycle)
"""
import asyncio
from datetime import date, datetime, timedelta
import sys
import unittest
from unittest.mock import AsyncMock, MagicMock, patch
import uuid

# FastAPI TestClient
from starlette.testclient import TestClient

from app.main import app
from app.api.deps import get_current_user
from app.models.user import UserRole
from app.models.notification import NotificationChannel, NotificationPriority
from app.agents.base import AgentStatus
from app.agents.monitoring.schemas import (
    MonitoringAgentResult,
    ActionableMonitoringEvent,
    MemberMonitoringAssessment,
    DoseAssessmentItem,
)
from app.agents.reminder.schemas import (
    ReminderAgentResult,
    DispatchedReminderItem,
    ReminderStatus,
)
from app.agents.knowledge.schemas import (
    KnowledgeAgentResult,
    KnowledgeSourceCitation,
)
from app.agents.knowledge.agent import MANDATORY_CLINICAL_DISCLAIMER
from app.agents.recommendation.schemas import (
    RecommendationAgentResult,
    RecommendationItem,
    RecommendationPriority,
    RecommendationCategory,
    CatchUpPathwayItem,
    MemberRecommendation,
)
from app.agents.report.schemas import (
    ReportAgentResult,
    ReportType,
    ReportOutputFormat,
    MANDATORY_REPORT_DISCLAIMER,
)
from app.agents.orchestrator import (
    multi_agent_orchestrator,
    MultiAgentOrchestrator,
    OrchestratorInput,
    OrchestratorResult,
    OrchestrationWorkflowType,
    StepExecutionStatus,
    WORKFLOW_SPECIFICATIONS,
)


class TestPhase9MultiAgentOrchestrator(unittest.IsolatedAsyncioTestCase):
    """Exhaustive test suite for Phase 9 Multi-Agent Orchestrator."""

    def setUp(self):
        self.orchestrator = multi_agent_orchestrator
        self.test_user_id = "user_orch_patient_001"
        self.test_member_id = "mem_orch_infant_001"
        self.today = date.today()

        # Reusable mock monitoring result
        self.mock_monitoring_result = MonitoringAgentResult(
            evaluated_members_count=1,
            total_doses_evaluated=5,
            status_distribution={"DUE": 1, "UPCOMING": 3, "COMPLETED": 1},
            member_assessments=[
                MemberMonitoringAssessment(
                    member_id=self.test_member_id,
                    full_name="Aarav Sharma",
                    date_of_birth=self.today - timedelta(days=70),
                    categorized_doses={},
                )
            ],
            actionable_events=[
                ActionableMonitoringEvent(
                    event_id=f"evt_{uuid.uuid4().hex[:8]}",
                    dedup_key=f"{self.test_user_id}:{self.test_member_id}:PENTA:1:DUE:{self.today}",
                    event_type="DUE_ALERT",
                    priority="HIGH",
                    family_member_id=self.test_member_id,
                    member_name="Aarav Sharma",
                    vaccine_code="PENTA",
                    vaccine_name="Pentavalent",
                    dose_number=1,
                    dose_name="Dose 1",
                    calculated_due_date=self.today,
                    ready_for_reminder=True,
                    title="Vaccination Due: Pentavalent",
                    message="Pentavalent (Dose 1) is currently due for Aarav Sharma.",
                )
            ],
            data_quality_issues=[],
            execution_duration_ms=4.2,
        )

        # Reusable mock reminder result
        self.mock_reminder_result = ReminderAgentResult(
            user_id=self.test_user_id,
            total_events_processed=1,
            dispatched_reminders=[
                DispatchedReminderItem(
                    event_id="evt_orch_001",
                    dedup_key=f"{self.test_user_id}:{self.test_member_id}:PENTA:1:DUE:{self.today}",
                    notification_id="notif_orch_001",
                    channel=NotificationChannel.IN_APP,
                    status=ReminderStatus.DISPATCHED,
                    family_member_id=self.test_member_id,
                    member_name="Aarav Sharma",
                    vaccine_code="PENTA",
                    vaccine_name="Pentavalent",
                    dose_number=1,
                    dose_name="Dose 1",
                    title="Vaccination Due: Pentavalent",
                    message="Pentavalent (Dose 1) is currently due for Aarav Sharma.",
                )
            ],
            skipped_duplicate_count=0,
            deferred_quiet_hours_count=0,
            channel_delivery_receipts={"in_app": 1},
            execution_duration_ms=2.1,
        )

        # Reusable mock recommendation result
        self.mock_recommendation_result = RecommendationAgentResult(
            user_id=self.test_user_id,
            evaluated_members_count=1,
            total_recommendations_count=1,
            member_recommendations=[
                MemberRecommendation(
                    member_id=self.test_member_id,
                    member_name="Aarav Sharma",
                    total_recommendations=1,
                    recommendations=[
                        RecommendationItem(
                            recommendation_id="rec_orch_001",
                            vaccine_code="PENTA",
                            dose_number=1,
                            priority=RecommendationPriority.HIGH,
                            category=RecommendationCategory.DUE_ACTION,
                            title="Pentavalent (Dose 1) Due",
                            description="Schedule pediatrician visit.",
                            clinical_rationale="Protects against 5 life-threatening childhood diseases.",
                            target_date=self.today,
                        )
                    ],
                )
            ],
            all_recommendations=[],
            catch_up_pathways=[],
            optional_vaccine_advisories=[],
            pediatric_discussion_points=["Verify cold chain maintenance."],
            allergy_alerts=[],
            clinical_disclaimer="Non-prescriptive clinical advisory.",
            execution_duration_ms=3.5,
        )

        # Reusable mock report result
        self.mock_report_result = ReportAgentResult(
            report_id="rep_orch_001",
            report_type="comprehensive_record",
            output_format="json",
            timestamp=datetime.utcnow(),
            user_id=self.test_user_id,
            family_member_id=self.test_member_id,
            patient_name="Aarav Sharma",
            filename="report_aarav_sharma.json",
            report_data={"total_doses": 5, "compliance_rate": "20%"},
            verification_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            disclaimer=MANDATORY_REPORT_DISCLAIMER,
            execution_duration_ms=8.0,
        )

        # Reusable mock knowledge result
        self.mock_knowledge_result = KnowledgeAgentResult(
            question="What is Pentavalent vaccine?",
            answer="Pentavalent protects against Diphtheria, Pertussis, Tetanus, Hepatitis B, and Hib.",
            sources=[
                KnowledgeSourceCitation(
                    document_id="doc_test_uip_001",
                    document_title="UIP Operational Guidelines",
                    source_authority="MoHFW",
                    page_number=12,
                    relevance_score=0.92,
                    excerpt="Pentavalent combines five antigens into a single injection.",
                )
            ],
            confidence_score=0.92,
            disclaimer=MANDATORY_CLINICAL_DISCLAIMER,
            execution_duration_ms=15.0,
        )

    # =========================================================================
    # Test 1: BaseAgent Architecture & Lifecycle Telemetry
    # =========================================================================
    async def test_01_orchestrator_architecture_and_lifecycle(self):
        """Verifies orchestrator metadata, workflow catalog, and BaseAgent lifecycle."""
        print("\n" + "=" * 75)
        print("[TEST ORCHESTRATOR] 1. Architecture, Catalog & BaseAgent Lifecycle")
        print("=" * 75)

        self.assertEqual(self.orchestrator.agent_id, "agent_orchestrator_v1")
        self.assertEqual(self.orchestrator.name, "Multi-Agent Orchestrator")

        catalog = self.orchestrator.get_workflow_catalog()
        self.assertIn("routine_cycle", catalog)
        self.assertIn("clinical_advisory", catalog)
        self.assertIn("reminder_pipeline", catalog)
        self.assertIn("comprehensive_record", catalog)
        self.assertIn("knowledge_inquiry", catalog)
        self.assertIn("dynamic_route", catalog)

        # Test BaseAgent.run() wrapper
        with patch("app.agents.monitoring.monitoring_agent.execute", new_callable=AsyncMock) as mock_mon:
            mock_mon.return_value = self.mock_monitoring_result
            inp = OrchestratorInput(
                workflow=OrchestrationWorkflowType.ROUTINE_CYCLE,
                user_id=self.test_user_id,
                include_reminders=False,
                include_recommendations=False,
                include_report=False,
                dry_run=True,
            )
            exec_envelope = await self.orchestrator.run(input_data=inp)
            self.assertEqual(exec_envelope.status, AgentStatus.SUCCESS)
            self.assertTrue(exec_envelope.execution_id.startswith("exec_"))
            self.assertGreater(exec_envelope.duration_ms, 0.0)
            self.assertIsNotNone(exec_envelope.data)
            print("[OK] Orchestrator BaseAgent lifecycle, execution ID, and telemetry verified.")

    # =========================================================================
    # Test 2: Full Routine Cycle Workflow Chaining
    # =========================================================================
    async def test_02_full_routine_cycle_workflow(self):
        """Verifies sequential chaining: Monitoring -> Reminder -> Recommendation -> Report."""
        print("\n" + "=" * 75)
        print("[TEST ORCHESTRATOR] 2. Full Routine Cycle Workflow (Monitoring -> Reminder -> Rec -> Report)")
        print("=" * 75)

        with patch("app.agents.monitoring.monitoring_agent.execute", new_callable=AsyncMock) as mock_mon, \
             patch("app.agents.reminder.reminder_agent.execute", new_callable=AsyncMock) as mock_rem, \
             patch("app.agents.recommendation.recommendation_agent.execute", new_callable=AsyncMock) as mock_rec, \
             patch("app.agents.report.report_agent.execute", new_callable=AsyncMock) as mock_rep:

            mock_mon.return_value = self.mock_monitoring_result
            mock_rem.return_value = self.mock_reminder_result
            mock_rec.return_value = self.mock_recommendation_result
            mock_rep.return_value = self.mock_report_result

            inp = OrchestratorInput(
                workflow=OrchestrationWorkflowType.ROUTINE_CYCLE,
                user_id=self.test_user_id,
                family_member_id=self.test_member_id,
                include_reminders=True,
                include_recommendations=True,
                include_report=True,
                dry_run=True,
            )

            res = await self.orchestrator.execute(inp)

            self.assertEqual(res.workflow_status, AgentStatus.SUCCESS)
            self.assertEqual(res.steps_executed, ["monitoring", "reminder", "recommendation", "report"])
            self.assertEqual(len(res.steps_failed), 0)
            self.assertIsNotNone(res.monitoring)
            self.assertIsNotNone(res.reminder)
            self.assertIsNotNone(res.recommendation)
            self.assertIsNotNone(res.report)
            self.assertEqual(res.actionable_events_count, 1)
            self.assertEqual(res.reminders_dispatched_count, 1)
            self.assertEqual(res.recommendations_count, 1)
            self.assertEqual(res.report_checksum, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")

            # Verify inputs were correctly passed to downstream agents
            rem_call_args = mock_rem.call_args[1]["input_data"]
            self.assertEqual(rem_call_args.user_id, self.test_user_id)
            self.assertEqual(len(rem_call_args.events), 1)
            self.assertTrue(rem_call_args.dry_run)
            print("[OK] Full routine cycle chained structured outputs and verified milestone counts.")

    # =========================================================================
    # Test 3: Clinical Advisory Workflow with Grounded Knowledge Citations
    # =========================================================================
    async def test_03_clinical_advisory_workflow_with_rag(self):
        """Verifies clinical advisory pipeline: Monitoring -> Recommendation -> Knowledge Agent."""
        print("\n" + "=" * 75)
        print("[TEST ORCHESTRATOR] 3. Clinical Advisory Workflow (Monitoring -> Rec -> Knowledge RAG)")
        print("=" * 75)

        with patch("app.agents.monitoring.monitoring_agent.execute", new_callable=AsyncMock) as mock_mon, \
             patch("app.agents.recommendation.recommendation_agent.execute", new_callable=AsyncMock) as mock_rec, \
             patch("app.agents.knowledge.knowledge_agent.execute", new_callable=AsyncMock) as mock_kno:

            mock_mon.return_value = self.mock_monitoring_result
            mock_rec.return_value = self.mock_recommendation_result
            mock_kno.return_value = self.mock_knowledge_result

            inp = OrchestratorInput(
                workflow=OrchestrationWorkflowType.CLINICAL_ADVISORY,
                user_id=self.test_user_id,
                family_member_id=self.test_member_id,
                query="What is Pentavalent vaccine?",
            )

            res = await self.orchestrator.execute(inp)

            self.assertEqual(res.workflow_status, AgentStatus.SUCCESS)
            self.assertIn("monitoring", res.steps_executed)
            self.assertIn("recommendation", res.steps_executed)
            self.assertIn("knowledge", res.steps_executed)
            self.assertIsNotNone(res.knowledge)
            self.assertEqual(len(res.knowledge.sources), 1)
            self.assertEqual(res.knowledge.sources[0].source_authority, "MoHFW")
            print("[OK] Clinical advisory successfully coordinated with grounded knowledge citations.")

    # =========================================================================
    # Test 4: Dedicated Reminder Pipeline with Deduplication & Idempotency
    # =========================================================================
    async def test_04_reminder_pipeline_deduplication(self):
        """Verifies reminder pipeline gating and idempotency tracking."""
        print("\n" + "=" * 75)
        print("[TEST ORCHESTRATOR] 4. Dedicated Reminder Pipeline & Idempotency Gating")
        print("=" * 75)

        with patch("app.agents.monitoring.monitoring_agent.execute", new_callable=AsyncMock) as mock_mon, \
             patch("app.agents.reminder.reminder_agent.execute", new_callable=AsyncMock) as mock_rem:

            mock_mon.return_value = self.mock_monitoring_result
            mock_rem.return_value = self.mock_reminder_result

            inp = OrchestratorInput(
                workflow=OrchestrationWorkflowType.REMINDER_PIPELINE,
                user_id=self.test_user_id,
                dry_run=True,
            )

            res = await self.orchestrator.execute(inp)

            self.assertEqual(res.workflow_status, AgentStatus.SUCCESS)
            self.assertEqual(res.steps_executed, ["monitoring", "reminder"])
            self.assertEqual(res.reminders_dispatched_count, 1)

            # Simulate second run where reminder agent reports skipped duplicate
            mock_dup_reminder = ReminderAgentResult(
                user_id=self.test_user_id,
                total_events_processed=1,
                dispatched_reminders=[],
                total_skipped_duplicate=1,
                total_deferred_quiet_hours=0,
                channel_delivery_receipts={},
                execution_duration_ms=1.5,
            )
            mock_rem.return_value = mock_dup_reminder

            res2 = await self.orchestrator.execute(inp)
            self.assertEqual(res2.reminders_dispatched_count, 0)
            self.assertEqual(res2.reminder.total_skipped_duplicate, 1)
            print("[OK] Reminder pipeline deduplication and duplicate prevention verified.")

    # =========================================================================
    # Test 5: Comprehensive Immunization Passport Pipeline
    # =========================================================================
    async def test_05_comprehensive_record_pipeline(self):
        """Verifies report generation pipeline compiling verifiable passport."""
        print("\n" + "=" * 75)
        print("[TEST ORCHESTRATOR] 5. Comprehensive Record Pipeline (Report Agent + Checksum)")
        print("=" * 75)

        with patch("app.agents.monitoring.monitoring_agent.execute", new_callable=AsyncMock) as mock_mon, \
             patch("app.agents.recommendation.recommendation_agent.execute", new_callable=AsyncMock) as mock_rec, \
             patch("app.agents.report.report_agent.execute", new_callable=AsyncMock) as mock_rep:

            mock_mon.return_value = self.mock_monitoring_result
            mock_rec.return_value = self.mock_recommendation_result
            mock_rep.return_value = self.mock_report_result

            inp = OrchestratorInput(
                workflow=OrchestrationWorkflowType.COMPREHENSIVE_RECORD,
                user_id=self.test_user_id,
                family_member_id=self.test_member_id,
                include_recommendations=True,
                report_type=ReportType.COMPREHENSIVE_RECORD,
            )

            res = await self.orchestrator.execute(inp)

            self.assertEqual(res.workflow_status, AgentStatus.SUCCESS)
            self.assertEqual(res.steps_executed, ["monitoring", "recommendation", "report"])
            self.assertIsNotNone(res.report)
            self.assertEqual(res.report_checksum, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
            print("[OK] Comprehensive record pipeline assembled with verified checksum.")

    # =========================================================================
    # Test 6: Dedicated Knowledge Inquiry Workflow
    # =========================================================================
    async def test_06_knowledge_inquiry_workflow(self):
        """Verifies direct knowledge inquiry workflow."""
        print("\n" + "=" * 75)
        print("[TEST ORCHESTRATOR] 6. Dedicated Knowledge Inquiry Workflow")
        print("=" * 75)

        with patch("app.agents.knowledge.knowledge_agent.execute", new_callable=AsyncMock) as mock_kno:
            mock_kno.return_value = self.mock_knowledge_result

            inp = OrchestratorInput(
                workflow=OrchestrationWorkflowType.KNOWLEDGE_INQUIRY,
                user_id=self.test_user_id,
                query="What is Pentavalent vaccine?",
            )

            res = await self.orchestrator.execute(inp)
            self.assertEqual(res.workflow_status, AgentStatus.SUCCESS)
            self.assertEqual(res.steps_executed, ["knowledge"])
            self.assertIsNotNone(res.knowledge)

            # Test missing query raises ValueError
            bad_inp = OrchestratorInput(
                workflow=OrchestrationWorkflowType.KNOWLEDGE_INQUIRY,
                user_id=self.test_user_id,
                query="",
            )
            with self.assertRaises(ValueError):
                await self.orchestrator.execute(bad_inp)
            print("[OK] Dedicated knowledge inquiry workflow verified.")

    # =========================================================================
    # Test 7: Conditional Step Skipping
    # =========================================================================
    async def test_07_conditional_step_skipping(self):
        """Verifies that steps are safely skipped when conditions or toggles are not met."""
        print("\n" + "=" * 75)
        print("[TEST ORCHESTRATOR] 7. Conditional Step Skipping (Zero Actionable Events & Toggles)")
        print("=" * 75)

        # Case A: Zero actionable events -> skip reminder step
        empty_mon_res = MonitoringAgentResult(
            evaluated_members_count=1,
            total_doses_evaluated=5,
            status_distribution={"COMPLETED": 5},
            member_assessments=[],
            actionable_events=[],  # No upcoming/due/overdue events
            data_quality_issues=[],
            execution_duration_ms=3.0,
        )

        with patch("app.agents.monitoring.monitoring_agent.execute", new_callable=AsyncMock) as mock_mon, \
             patch("app.agents.reminder.reminder_agent.execute", new_callable=AsyncMock) as mock_rem:

            mock_mon.return_value = empty_mon_res

            inp = OrchestratorInput(
                workflow=OrchestrationWorkflowType.ROUTINE_CYCLE,
                user_id=self.test_user_id,
                include_reminders=True,
                include_recommendations=False,
                include_report=False,
                dry_run=True,
            )

            res = await self.orchestrator.execute(inp)

            self.assertEqual(res.workflow_status, AgentStatus.SUCCESS)
            self.assertIn("monitoring", res.steps_executed)
            self.assertIn("reminder", res.steps_skipped)
            self.assertEqual(res.step_results["reminder"].status, StepExecutionStatus.SKIPPED)
            mock_rem.assert_not_called()
            print("  [OK] Zero actionable events safely skipped Reminder Agent invocation.")

            # Case B: Toggles explicitly disabled
            inp_disabled = OrchestratorInput(
                workflow=OrchestrationWorkflowType.ROUTINE_CYCLE,
                user_id=self.test_user_id,
                include_reminders=False,
                include_recommendations=False,
                include_report=False,
            )
            res2 = await self.orchestrator.execute(inp_disabled)
            self.assertIn("reminder", res2.steps_skipped)
            self.assertIn("recommendation", res2.steps_skipped)
            self.assertIn("report", res2.steps_skipped)
            print("  [OK] Disabled toggles correctly recorded in steps_skipped.")
        print("[OK] Conditional step skipping verified.")

    # =========================================================================
    # Test 8: Fault Tolerance & Resilient Partial Success
    # =========================================================================
    async def test_08_fault_tolerance_and_partial_success(self):
        """Verifies that an error in a downstream agent doesn't crash the orchestrator."""
        print("\n" + "=" * 75)
        print("[TEST ORCHESTRATOR] 8. Fault Tolerance & Resilient Partial Success")
        print("=" * 75)

        with patch("app.agents.monitoring.monitoring_agent.execute", new_callable=AsyncMock) as mock_mon, \
             patch("app.agents.reminder.reminder_agent.execute", new_callable=AsyncMock) as mock_rem, \
             patch("app.agents.recommendation.recommendation_agent.execute", new_callable=AsyncMock) as mock_rec:

            mock_mon.return_value = self.mock_monitoring_result
            # Reminder agent throws unexpected delivery provider exception
            mock_rem.side_effect = RuntimeError("SMS Provider Gateway Timeout 504")
            mock_rec.return_value = self.mock_recommendation_result

            inp = OrchestratorInput(
                workflow=OrchestrationWorkflowType.ROUTINE_CYCLE,
                user_id=self.test_user_id,
                include_reminders=True,
                include_recommendations=True,
                include_report=False,
                continue_on_failure=True,
                dry_run=True,
            )

            res = await self.orchestrator.execute(inp)

            # Workflow should be PARTIAL_SUCCESS, not crashed
            self.assertEqual(res.workflow_status, AgentStatus.PARTIAL_SUCCESS)
            self.assertIn("monitoring", res.steps_executed)
            self.assertIn("reminder", res.steps_failed)
            self.assertIn("recommendation", res.steps_executed)
            self.assertEqual(res.step_results["reminder"].status, StepExecutionStatus.FAILED)
            self.assertIn("SMS Provider Gateway Timeout 504", res.step_results["reminder"].error)
            self.assertIsNotNone(res.monitoring)
            self.assertIsNotNone(res.recommendation)
            print("[OK] Downstream failure caught cleanly: PARTIAL_SUCCESS recorded with intact sibling results.")

    # =========================================================================
    # Test 9: Step Timeout Containment
    # =========================================================================
    async def test_09_step_timeout_containment(self):
        """Verifies that a hanging agent step is timed out and captured cleanly."""
        print("\n" + "=" * 75)
        print("[TEST ORCHESTRATOR] 9. Step Timeout Containment & Isolated Error Boundaries")
        print("=" * 75)

        async def slow_mock_execute(*args, **kwargs):
            await asyncio.sleep(0.5)  # Simulate slow network call
            return self.mock_reminder_result

        with patch("app.agents.monitoring.monitoring_agent.execute", new_callable=AsyncMock) as mock_mon, \
             patch("app.agents.reminder.reminder_agent.execute", side_effect=slow_mock_execute):

            mock_mon.return_value = self.mock_monitoring_result

            inp = OrchestratorInput(
                workflow=OrchestrationWorkflowType.REMINDER_PIPELINE,
                user_id=self.test_user_id,
                step_timeout_seconds=0.1,  # Short timeout to trigger timeout
                continue_on_failure=True,
            )

            res = await self.orchestrator.execute(inp)

            self.assertEqual(res.workflow_status, AgentStatus.PARTIAL_SUCCESS)
            self.assertIn("reminder", res.steps_failed)
            self.assertEqual(res.step_results["reminder"].status, StepExecutionStatus.TIMEOUT)
            self.assertIn("timed out after 0.1s", res.step_results["reminder"].error)
            print("[OK] Step timeout caught cleanly without blocking or crashing the orchestrator.")

    # =========================================================================
    # Test 10: Multi-Tenant Household Isolation & RBAC
    # =========================================================================
    async def test_10_multitenant_authorization_and_isolation(self):
        """Verifies strict household isolation and role-based permissions."""
        print("\n" + "=" * 75)
        print("[TEST ORCHESTRATOR] 10. Multi-Tenant Household Isolation & RBAC Security")
        print("=" * 75)

        # Patient caller attempting to run workflow on another household
        foreign_user_id = "user_foreign_household_999"
        inp_unauthorized = OrchestratorInput(
            workflow=OrchestrationWorkflowType.ROUTINE_CYCLE,
            user_id=foreign_user_id,
            caller_user_id=self.test_user_id,  # caller != target
            caller_role=UserRole.PATIENT.value,
        )

        with self.assertRaises(PermissionError) as ctx:
            await self.orchestrator.execute(inp_unauthorized)
        self.assertIn("Access Denied", str(ctx.exception))
        print("  [OK] Unauthorized cross-tenant attempt by PATIENT blocked with PermissionError.")

        # Healthcare Worker caller permitted cross-household orchestration
        with patch("app.agents.monitoring.monitoring_agent.execute", new_callable=AsyncMock) as mock_mon:
            mock_mon.return_value = self.mock_monitoring_result
            inp_hcw = OrchestratorInput(
                workflow=OrchestrationWorkflowType.ROUTINE_CYCLE,
                user_id=foreign_user_id,
                caller_user_id="user_hcw_doctor_01",
                caller_role=UserRole.HEALTHCARE_WORKER.value,
                include_reminders=False,
                include_recommendations=False,
                include_report=False,
            )
            res_hcw = await self.orchestrator.execute(inp_hcw)
            self.assertEqual(res_hcw.workflow_status, AgentStatus.SUCCESS)
            print("  [OK] HEALTHCARE_WORKER authorized to orchestrate patient household.")

        # Admin caller permitted cross-household orchestration
        with patch("app.agents.monitoring.monitoring_agent.execute", new_callable=AsyncMock) as mock_mon:
            mock_mon.return_value = self.mock_monitoring_result
            inp_admin = OrchestratorInput(
                workflow=OrchestrationWorkflowType.ROUTINE_CYCLE,
                user_id=foreign_user_id,
                caller_user_id="user_admin_01",
                caller_role=UserRole.ADMIN.value,
                include_reminders=False,
                include_recommendations=False,
                include_report=False,
            )
            res_admin = await self.orchestrator.execute(inp_admin)
            self.assertEqual(res_admin.workflow_status, AgentStatus.SUCCESS)
            print("  [OK] ADMIN authorized to orchestrate patient household.")
        print("[OK] Multi-tenant isolation and RBAC verified.")

    # =========================================================================
    # Test 11: Dynamic Task Routing (/route)
    # =========================================================================
    async def test_11_dynamic_task_intent_routing(self):
        """Verifies intent-based task routing logic."""
        print("\n" + "=" * 75)
        print("[TEST ORCHESTRATOR] 11. Dynamic Task Intent Routing")
        print("=" * 75)

        with patch("app.agents.knowledge.knowledge_agent.execute", new_callable=AsyncMock) as mock_kno:
            mock_kno.return_value = self.mock_knowledge_result

            # Standalone question should route to KNOWLEDGE_INQUIRY
            inp = OrchestratorInput(
                workflow=OrchestrationWorkflowType.DYNAMIC_ROUTE,
                user_id=self.test_user_id,
                query="Tell me about BCG vaccine dose",
                include_reminders=False,
                include_recommendations=False,
                include_report=False,
            )
            res = await self.orchestrator.execute(inp)
            self.assertEqual(res.workflow_status, AgentStatus.SUCCESS)
            self.assertIn("knowledge", res.steps_executed)
            print("[OK] Standalone query dynamically routed to Knowledge Agent.")

    # =========================================================================
    # Test 12: FastAPI Endpoints via TestClient
    # =========================================================================
    def test_12_fastapi_orchestrator_endpoints(self):
        """Verifies /workflows, /run, /route, and /run-lifecycle via TestClient."""
        print("\n" + "=" * 75)
        print("[TEST ORCHESTRATOR] 12. FastAPI Endpoints via TestClient")
        print("=" * 75)

        client = TestClient(app)

        # 1. Unauthenticated request rejected
        resp_unauth = client.get("/api/v1/agents/orchestrator/workflows")
        self.assertEqual(resp_unauth.status_code, 401)
        print("  [OK] Unauthenticated GET /workflows rejected (401).")

        # Mock authenticated patient user
        mock_patient = {
            "id": self.test_user_id,
            "email": "patient@vaxassist.ai",
            "role": UserRole.PATIENT.value,
            "is_active": True,
        }
        app.dependency_overrides[get_current_user] = lambda: mock_patient

        try:
            # 2. GET /workflows
            resp_wf = client.get("/api/v1/agents/orchestrator/workflows")
            self.assertEqual(resp_wf.status_code, 200)
            data_wf = resp_wf.json()
            self.assertTrue(data_wf["success"])
            self.assertIn("routine_cycle", data_wf["data"])
            print("  [OK] GET /workflows returned 200 with catalog.")

            # 3. POST /run (with mocked agents)
            with patch("app.agents.monitoring.monitoring_agent.execute", new_callable=AsyncMock) as mock_mon, \
                 patch("app.agents.reminder.reminder_agent.execute", new_callable=AsyncMock) as mock_rem:

                mock_mon.return_value = self.mock_monitoring_result
                mock_rem.return_value = self.mock_reminder_result

                payload_run = {
                    "workflow": "routine_cycle",
                    "include_reminders": True,
                    "include_recommendations": False,
                    "include_report": False,
                    "dry_run": True,
                }
                resp_run = client.post("/api/v1/agents/orchestrator/run", json=payload_run)
                self.assertEqual(resp_run.status_code, 200)
                data_run = resp_run.json()
                self.assertTrue(data_run["success"])
                self.assertEqual(data_run["data"]["workflow_status"], "SUCCESS")
                print("  [OK] POST /orchestrator/run returned 200 with OrchestratorResult.")

                # 4. POST /route
                payload_route = {
                    "task_intent": "remind upcoming vaccinations",
                    "dry_run": True,
                }
                resp_route = client.post("/api/v1/agents/orchestrator/route", json=payload_route)
                self.assertEqual(resp_route.status_code, 200)
                data_route = resp_route.json()
                self.assertTrue(data_route["success"])
                print("  [OK] POST /orchestrator/route returned 200 with routed result.")

                # 5. POST /run-lifecycle
                resp_life = client.post("/api/v1/agents/orchestrator/run-lifecycle", json=payload_run)
                self.assertEqual(resp_life.status_code, 200)
                data_life = resp_life.json()
                self.assertTrue(data_life["success"])
                self.assertTrue("execution_id" in data_life["data"])
                print("  [OK] POST /orchestrator/run-lifecycle returned 200 with AgentExecutionResult.")

            # 6. Cross-household request blocked with 403 Forbidden
            payload_forbidden = {
                "target_user_id": "user_someone_else_403",
                "workflow": "routine_cycle",
            }
            resp_forbid = client.post("/api/v1/agents/orchestrator/run", json=payload_forbidden)
            self.assertEqual(resp_forbid.status_code, 403)
            print("  [OK] Cross-household access blocked with HTTP 403 Forbidden.")

        finally:
            app.dependency_overrides.clear()
        print("[OK] All FastAPI endpoints verified via TestClient.")


def run_tests():
    suite = unittest.TestLoader().loadTestsFromTestCase(TestPhase9MultiAgentOrchestrator)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if not result.wasSuccessful():
        sys.exit(1)


if __name__ == "__main__":
    run_tests()
