"""
VaxAssist AI - Final Verification Audit (Phase 8 & Phase 9 Before Phase 10)
End-to-End Multi-Agent Integration Audit Script

Validates the 6 Critical End-to-End Scenarios:
1. Scenario 1: Routine Cycle (Monitoring -> Reminder -> Recommendation -> Report)
2. Scenario 2: Clinical Advisory (Monitoring + Knowledge RAG Grounding + Recommendation)
3. Scenario 3: Reminder Pipeline (Preferences, Quiet Hours, Idempotent Dedup, Dry-Run Dispatch)
4. Scenario 4: Comprehensive Record (Deterministic Schedule Engine, SHA-256 Hash, RBAC Isolation)
5. Scenario 5: Frontend-Accessible Endpoints & API Contract Validation
6. Scenario 6: Fault Tolerance & Graceful Partial Success (Step Failure / Timeout Resiliency)
"""

import asyncio
from datetime import date, datetime, timedelta
import unittest
from unittest.mock import AsyncMock, MagicMock, patch
import uuid

from starlette.testclient import TestClient

from app.main import app
from app.api.deps import get_current_user
from app.models.user import UserRole
from app.models.notification import NotificationChannel
from app.agents.base import AgentStatus
from app.agents.monitoring.schemas import (
    MonitoringAgentResult,
    ActionableMonitoringEvent,
    MemberMonitoringAssessment,
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
    MemberRecommendation,
)
from app.agents.report.schemas import (
    ReportAgentResult,
    ReportType,
    MANDATORY_REPORT_DISCLAIMER,
)
from app.agents.orchestrator import (
    multi_agent_orchestrator,
    OrchestratorInput,
    OrchestrationWorkflowType,
    StepExecutionStatus,
)


class TestFinalAuditE2E(unittest.IsolatedAsyncioTestCase):
    """Final verification audit suite for Phase 8 and Phase 9 integration."""

    def setUp(self):
        self.orchestrator = multi_agent_orchestrator
        self.test_user_id = "user_audit_final_001"
        self.test_member_id = "mem_audit_infant_001"
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
                    dedup_key=f"{self.test_user_id}:{self.test_member_id}:OPV:1:DUE:{self.today}",
                    event_type="DUE_ALERT",
                    priority="HIGH",
                    family_member_id=self.test_member_id,
                    member_name="Aarav Sharma",
                    vaccine_code="OPV",
                    vaccine_name="Oral Polio Vaccine",
                    dose_number=1,
                    dose_name="Dose 1",
                    calculated_due_date=self.today,
                    ready_for_reminder=True,
                    title="Vaccination Due: OPV",
                    message="OPV (Dose 1) is currently due for Aarav Sharma.",
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
                    dedup_key=f"{self.test_user_id}:{self.test_member_id}:OPV:1:DUE:{self.today}",
                    notification_id="notif_orch_001",
                    channel=NotificationChannel.IN_APP,
                    status=ReminderStatus.DISPATCHED,
                    family_member_id=self.test_member_id,
                    member_name="Aarav Sharma",
                    vaccine_code="OPV",
                    vaccine_name="Oral Polio Vaccine",
                    dose_number=1,
                    dose_name="Dose 1",
                    title="Vaccination Due: OPV",
                    message="OPV (Dose 1) is currently due for Aarav Sharma.",
                )
            ],
            total_skipped_duplicate=0,
            total_deferred_quiet_hours=0,
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
                            vaccine_code="OPV",
                            dose_number=1,
                            priority=RecommendationPriority.HIGH,
                            category=RecommendationCategory.DUE_ACTION,
                            title="Oral Polio Vaccine (Dose 1) Due",
                            description="Schedule visit for OPV-1.",
                            clinical_rationale="Protects against poliovirus.",
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
            question="What is OPV catch-up guidance?",
            answer="Oral Poliovirus Vaccine dose 1 should be given at birth/6 weeks. If delayed, administer at first contact.",
            sources=[
                KnowledgeSourceCitation(
                    document_id="doc_test_uip_001",
                    document_title="UIP Operational Guidelines",
                    source_authority="MoHFW",
                    page_number=12,
                    relevance_score=0.92,
                    excerpt="OPV-1 is given at 6 weeks or earliest contact.",
                )
            ],
            confidence_score=0.92,
            disclaimer=MANDATORY_CLINICAL_DISCLAIMER,
            execution_duration_ms=15.0,
        )

    # =========================================================================
    # SCENARIO 1: Full Routine Cycle Workflow
    # Monitoring -> Reminder -> Recommendation -> Report chained
    # =========================================================================
    async def test_scenario_1_routine_cycle_e2e(self):
        """Scenario 1: Routine cycle chains monitoring, reminder, recommendation, and report."""
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

            # Validate outputs are correctly structured in result
            self.assertIsNotNone(res.monitoring)
            self.assertIsNotNone(res.reminder)
            self.assertIsNotNone(res.recommendation)
            self.assertIsNotNone(res.report)
            self.assertEqual(res.actionable_events_count, 1)
            self.assertEqual(res.reminders_dispatched_count, 1)
            self.assertEqual(res.recommendations_count, 1)
            self.assertEqual(res.report_checksum, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")

            # Verify dry_run was passed down to reminder agent
            mock_rem.assert_called_once()
            rem_call_args = mock_rem.call_args[1]["input_data"]
            self.assertTrue(rem_call_args.dry_run)

    # =========================================================================
    # SCENARIO 2: Clinical Advisory Workflow with RAG Grounding
    # Monitoring + Knowledge RAG + Recommendations
    # =========================================================================
    async def test_scenario_2_clinical_advisory_e2e(self):
        """Scenario 2: Clinical advisory integrates monitoring with RAG knowledge search."""
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
                query="What is OPV catch-up guidance?",
            )

            res = await self.orchestrator.execute(inp)

            self.assertEqual(res.workflow_status, AgentStatus.SUCCESS)
            self.assertIn("monitoring", res.steps_executed)
            self.assertIn("recommendation", res.steps_executed)
            self.assertIn("knowledge", res.steps_executed)
            self.assertIsNotNone(res.knowledge)
            self.assertIsNotNone(res.recommendation)

            # Verify RAG citations and disclaimers are preserved
            self.assertEqual(len(res.knowledge.sources), 1)
            self.assertEqual(res.knowledge.sources[0].source_authority, "MoHFW")
            self.assertIn("medical diagnosis", res.knowledge.disclaimer.lower())
            self.assertEqual(
                res.recommendation.member_recommendations[0].recommendations[0].priority,
                RecommendationPriority.HIGH,
            )

    # =========================================================================
    # SCENARIO 3: Reminder Pipeline (Preferences, Quiet Hours, Idempotent Dedup)
    # =========================================================================
    async def test_scenario_3_reminder_pipeline_e2e(self):
        """Scenario 3: Dedicated reminder pipeline validates dry-run and dedup."""
        mock_reminder_dedup = ReminderAgentResult(
            user_id=self.test_user_id,
            total_events_processed=2,
            dispatched_reminders=[
                DispatchedReminderItem(
                    event_id="evt_orch_001",
                    dedup_key=f"{self.test_user_id}:{self.test_member_id}:OPV:1:DUE:{self.today}",
                    notification_id="notif_orch_001",
                    channel=NotificationChannel.IN_APP,
                    status=ReminderStatus.DISPATCHED,
                    family_member_id=self.test_member_id,
                    member_name="Aarav Sharma",
                    vaccine_code="OPV",
                    vaccine_name="Oral Polio Vaccine",
                    dose_number=1,
                    dose_name="Dose 1",
                    title="Vaccination Due: OPV",
                    message="OPV (Dose 1) is currently due for Aarav Sharma.",
                )
            ],
            total_skipped_duplicate=1,
            total_deferred_quiet_hours=1,
            channel_delivery_receipts={"in_app": 1},
            execution_duration_ms=2.1,
        )

        with patch("app.agents.monitoring.monitoring_agent.execute", new_callable=AsyncMock) as mock_mon, \
             patch("app.agents.reminder.reminder_agent.execute", new_callable=AsyncMock) as mock_rem:

            mock_mon.return_value = self.mock_monitoring_result
            mock_rem.return_value = mock_reminder_dedup

            inp = OrchestratorInput(
                workflow=OrchestrationWorkflowType.REMINDER_PIPELINE,
                user_id=self.test_user_id,
                family_member_id=self.test_member_id,
                dry_run=True,
            )

            res = await self.orchestrator.execute(inp)

            self.assertEqual(res.workflow_status, AgentStatus.SUCCESS)
            self.assertEqual(res.reminder.total_skipped_duplicate, 1)
            self.assertEqual(res.reminder.total_deferred_quiet_hours, 1)
            self.assertEqual(len(res.reminder.dispatched_reminders), 1)

    # =========================================================================
    # SCENARIO 4: Comprehensive Record (Deterministic Schedule Engine, SHA-256)
    # =========================================================================
    async def test_scenario_4_comprehensive_record_e2e(self):
        """Scenario 4: Generates immutable immunization passport with cryptographic hash."""
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
            self.assertIsNotNone(res.report)
            self.assertEqual(res.report.report_type, "comprehensive_record")
            # Verify SHA-256 hash length (64 hex characters)
            self.assertEqual(len(res.report_checksum), 64)
            # Verify mandatory legal disclaimer is attached
            self.assertIn("informational", res.report.disclaimer.lower())

    # =========================================================================
    # SCENARIO 5: Frontend-Accessible APIs & Endpoints
    # =========================================================================
    def test_scenario_5_api_endpoints_contract(self):
        """Scenario 5: Validates REST contracts for orchestrator and agent endpoints."""
        mock_user = {
            "id": self.test_user_id,
            "email": "parent@vaxassist.test",
            "role": UserRole.PATIENT.value,
        }

        app.dependency_overrides[get_current_user] = lambda: mock_user

        try:
            client = TestClient(app)

            # 1. GET /api/v1/agents/orchestrator/workflows
            wf_res = client.get("/api/v1/agents/orchestrator/workflows")
            self.assertEqual(wf_res.status_code, 200)
            wf_data = wf_res.json()
            self.assertTrue(wf_data.get("success", False))
            workflows = wf_data["data"]
            self.assertEqual(len(workflows), 6)
            for expected_wf in ["routine_cycle", "clinical_advisory", "reminder_pipeline", "comprehensive_record", "knowledge_inquiry", "dynamic_route"]:
                self.assertIn(expected_wf, workflows)

            # 2. POST /api/v1/agents/orchestrator/route (Dynamic intent routing)
            with patch("app.agents.monitoring.monitoring_agent.execute", new_callable=AsyncMock) as mock_mon, \
                 patch("app.agents.reminder.reminder_agent.execute", new_callable=AsyncMock) as mock_rem:
                mock_mon.return_value = self.mock_monitoring_result
                mock_rem.return_value = self.mock_reminder_result

                payload_route = {
                    "task_intent": "remind upcoming vaccinations",
                    "dry_run": True,
                }
                route_res = client.post("/api/v1/agents/orchestrator/route", json=payload_route)
                self.assertEqual(route_res.status_code, 200)
                route_data = route_res.json()
                self.assertTrue(route_data["success"])
                self.assertEqual(route_data["data"]["workflow"], "reminder_pipeline")

            # 3. POST /api/v1/agents/orchestrator/run-lifecycle
            with patch("app.agents.monitoring.monitoring_agent.execute", new_callable=AsyncMock) as mock_mon:
                mock_mon.return_value = self.mock_monitoring_result

                payload_run = {
                    "workflow": "routine_cycle",
                    "include_reminders": False,
                    "include_recommendations": False,
                    "include_report": False,
                    "dry_run": True,
                }
                life_res = client.post("/api/v1/agents/orchestrator/run-lifecycle", json=payload_run)
                self.assertEqual(life_res.status_code, 200)
                life_data = life_res.json()
                self.assertTrue(life_data["success"])
                self.assertTrue("execution_id" in life_data["data"])

            # 4. RBAC Cross-Household Isolation check: Patients cannot access other households
            forbidden_payload = {
                "target_user_id": "other_user_household_999",
                "workflow": "routine_cycle",
            }
            forbid_res = client.post("/api/v1/agents/orchestrator/run", json=forbidden_payload)
            self.assertEqual(forbid_res.status_code, 403)
            self.assertIn("Access Denied", forbid_res.json()["detail"])

        finally:
            app.dependency_overrides.pop(get_current_user, None)

    # =========================================================================
    # SCENARIO 6: Failure Handling & Partial Results Resiliency
    # =========================================================================
    async def test_scenario_6_failure_handling_and_partial_results(self):
        """Scenario 6: Step failure does not crash pipeline; yields PARTIAL_SUCCESS."""
        with patch("app.agents.monitoring.monitoring_agent.execute", new_callable=AsyncMock) as mock_mon, \
             patch("app.agents.reminder.reminder_agent.execute", new_callable=AsyncMock) as mock_rem, \
             patch("app.agents.recommendation.recommendation_agent.execute", new_callable=AsyncMock) as mock_rec, \
             patch("app.agents.report.report_agent.execute", new_callable=AsyncMock) as mock_rep:

            # Monitoring succeeds
            mock_mon.return_value = self.mock_monitoring_result
            # Reminder agent raises an exception
            mock_rem.side_effect = RuntimeError("SMS Provider Gateway Timeout 504")
            # Recommendation succeeds
            mock_rec.return_value = self.mock_recommendation_result
            # Report succeeds despite reminder failure
            mock_rep.return_value = self.mock_report_result

            inp = OrchestratorInput(
                workflow=OrchestrationWorkflowType.ROUTINE_CYCLE,
                user_id=self.test_user_id,
                family_member_id=self.test_member_id,
                include_reminders=True,
                include_recommendations=True,
                include_report=True,
                continue_on_failure=True,
                dry_run=True,
            )

            res = await self.orchestrator.execute(inp)

            # Workflow should be PARTIAL_SUCCESS, not crashed
            self.assertEqual(res.workflow_status, AgentStatus.PARTIAL_SUCCESS)
            self.assertIn("monitoring", res.steps_executed)
            self.assertIn("reminder", res.steps_failed)
            self.assertIn("recommendation", res.steps_executed)
            self.assertIn("report", res.steps_executed)
            self.assertEqual(res.step_results["reminder"].status, StepExecutionStatus.FAILED)
            self.assertIn("SMS Provider Gateway Timeout 504", res.step_results["reminder"].error)

            # Upstream and downstream sibling results preserved
            self.assertIsNotNone(res.monitoring)
            self.assertIsNotNone(res.recommendation)
            self.assertIsNotNone(res.report)


if __name__ == "__main__":
    unittest.main()
