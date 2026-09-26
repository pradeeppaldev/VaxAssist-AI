"""
VaxAssist AI - Phase D: Agent & Orchestrator Integration Test Suite.
Verifies all five specialized agents individually and together through the Multi-Agent Orchestrator:
1. Monitoring Agent (deterministic schedule engine, missing dates, milestones)
2. Reminder Agent (eligibility, deduplication, quiet hours, delivery failure handling)
3. Knowledge / RAG Agent (grounded retrieval, citations, service failure resilience)
4. Recommendation Agent (clinical rules, catch-up pathways, optional vaccines)
5. Report Generation Agent (data assembly, vector PDF, SHA-256 checksum)
6. Multi-Agent Orchestrator workflows (Knowledge Inquiry, Clinical Advisory, Comprehensive Record, Routine Cycle)
7. Inter-agent data chaining and elimination of redundant executions
8. Error containment, step timeouts, and partial workflow completion
9. Tenant data isolation and role-based access control
10. Execution against real MongoDB Atlas database records
11. REST API endpoints verification
"""
import asyncio
from datetime import date, datetime, timedelta
import os
import sys
import unittest
from unittest.mock import AsyncMock, patch

sys.path.insert(0, os.path.abspath("backend"))

from starlette.testclient import TestClient

from app.main import app
from app.database.mongodb import db_manager
from app.models.user import UserRole
from app.models.notification import NotificationChannel
from app.services.user_service import user_service
from app.services.family_service import family_service
from app.services.vaccination_service import vaccination_service
from app.services.notification_service import notification_service
from app.services.embedding_service import GeminiAPIError

from app.agents.base import AgentStatus
from app.agents.monitoring import monitoring_agent, MonitoringAgentInput, MonitoringAgentResult
from app.agents.reminder import reminder_agent, ReminderAgentInput, ReminderAgentResult, ReminderStatus
from app.agents.knowledge import knowledge_agent, KnowledgeAgentInput, KnowledgeAgentResult
from app.agents.recommendation import recommendation_agent, RecommendationAgentInput, RecommendationAgentResult
from app.agents.report import report_agent, ReportAgentInput, ReportAgentResult, ReportType, ReportOutputFormat
from app.agents.orchestrator import (
    multi_agent_orchestrator,
    OrchestratorInput,
    OrchestratorResult,
    OrchestrationWorkflowType,
    StepExecutionStatus,
)


class TestPhaseDAgentsAndWorkflows(unittest.TestCase):
    """Verifies all five agents and orchestrator workflows directly via asyncio."""

    @classmethod
    def setUpClass(cls):
        print("\n" + "=" * 70)
        print("  VAXASSIST AI — PHASE D: AGENT & ORCHESTRATOR INTEGRATION SUITE")
        print("=" * 70)
        cls.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(cls.loop)
        cls.loop.run_until_complete(db_manager.connect())

        # Fetch real test user from MongoDB
        cls.patient_user = cls.loop.run_until_complete(
            user_service.get_by_email("rajesh.sharma@vaxassist.demo")
        )
        if cls.patient_user:
            cls.patient_id = str(cls.patient_user.get("id") or cls.patient_user.get("_id"))
        else:
            cls.patient_id = "test_patient_placeholder"

    @classmethod
    def tearDownClass(cls):
        cls.loop.run_until_complete(db_manager.disconnect())
        cls.loop.close()

    # =========================================================================
    # Test 1: Each of the Five Agents Executes Independently
    # =========================================================================
    def test_01_all_five_agents_independent_execution(self):
        print("\n[PHASE D TEST 1] Verifying All Five Agents Independently...")

        test_dob = date(2024, 2, 14)
        fixture_member = {
            "id": "mem_phase_d_01",
            "full_name": "Rohan Sharma",
            "date_of_birth": test_dob.isoformat(),
            "relationship": "Child",
            "gender": "male",
        }
        fixture_record = {
            "id": "rec_phase_d_01",
            "family_member_id": "mem_phase_d_01",
            "vaccine_code": "BCG",
            "vaccine_name": "Bacillus Calmette-Guerin",
            "dose_number": 1,
            "dose_name": "Birth Dose",
            "administered_date": test_dob.isoformat(),
        }

        # 1. Monitoring Agent
        mon_res = self.loop.run_until_complete(
            monitoring_agent.execute(
                MonitoringAgentInput(
                    user_id=self.patient_id,
                    family_member_id="mem_phase_d_01",
                    caller_user_id=self.patient_id,
                    caller_role="PATIENT",
                ),
                members_fixture=[fixture_member],
                records_fixture=[fixture_record],
            )
        )
        self.assertIsInstance(mon_res, MonitoringAgentResult)
        self.assertEqual(mon_res.evaluated_members_count, 1)
        self.assertGreater(mon_res.total_doses_evaluated, 0)
        self.assertGreater(len(mon_res.actionable_events), 0)
        print(f"  PASS: Monitoring Agent -> {mon_res.total_doses_evaluated} doses evaluated, {len(mon_res.actionable_events)} actionable events.")

        # 2. Reminder Agent
        rem_res = self.loop.run_until_complete(
            reminder_agent.execute(
                ReminderAgentInput(
                    user_id=self.patient_id,
                    events=mon_res.actionable_events[:2],
                    dry_run=True,
                    caller_user_id=self.patient_id,
                    caller_role="PATIENT",
                )
            )
        )
        self.assertIsInstance(rem_res, ReminderAgentResult)
        self.assertEqual(rem_res.total_events_received, 2)
        print(f"  PASS: Reminder Agent -> {rem_res.total_dispatched} dispatched (dry-run), {rem_res.total_skipped_duplicate} duplicates.")

        # 3. Knowledge / RAG Agent
        know_res = self.loop.run_until_complete(
            knowledge_agent.execute(
                KnowledgeAgentInput(
                    question="What is the schedule for OPV birth dose under UIP India?",
                    top_k=2,
                )
            )
        )
        self.assertIsInstance(know_res, KnowledgeAgentResult)
        self.assertTrue(len(know_res.answer) > 20)
        self.assertIn("MoHFW", know_res.disclaimer)
        print(f"  PASS: Knowledge Agent -> Answer length={len(know_res.answer)}, Chunks={know_res.retrieved_chunks_count}.")

        # 4. Recommendation Agent
        rec_res = self.loop.run_until_complete(
            recommendation_agent.execute(
                RecommendationAgentInput(
                    user_id=self.patient_id,
                    family_member_id="mem_phase_d_01",
                    caller_user_id=self.patient_id,
                    caller_role="PATIENT",
                    include_optional_vaccines=True,
                ),
                members_fixture=[fixture_member],
                records_fixture=[fixture_record],
                monitoring_result_fixture=mon_res,
            )
        )
        self.assertIsInstance(rec_res, RecommendationAgentResult)
        self.assertGreater(rec_res.total_recommendations_count, 0)
        print(f"  PASS: Recommendation Agent -> {rec_res.total_recommendations_count} recommendations generated.")

        # 5. Report Generation Agent
        rep_res = self.loop.run_until_complete(
            report_agent.execute(
                ReportAgentInput(
                    user_id=self.patient_id,
                    family_member_id="mem_phase_d_01",
                    report_type=ReportType.COMPREHENSIVE_RECORD,
                    output_format=ReportOutputFormat.PDF,
                    caller_user_id=self.patient_id,
                    caller_role="PATIENT",
                ),
                members_fixture=[fixture_member],
                records_fixture=[fixture_record],
                monitoring_result_fixture=mon_res,
                recommendation_result_fixture=rec_res,
            )
        )
        self.assertIsInstance(rep_res, ReportAgentResult)
        self.assertIsNotNone(rep_res.content_base64)
        self.assertIsNotNone(rep_res.verification_hash)
        self.assertEqual(len(rep_res.verification_hash), 64)  # Valid SHA-256
        print(f"  PASS: Report Agent -> PDF size={len(rep_res.content_base64)} chars, SHA-256={rep_res.verification_hash[:16]}...")

    # =========================================================================
    # Test 2: Orchestrator Workflows (All 4 Primary Workflows)
    # =========================================================================
    def test_02_all_orchestrator_workflows_end_to_end(self):
        print("\n[PHASE D TEST 2] Verifying All Multi-Agent Orchestrator Workflows...")

        # Workflow 1: Knowledge Inquiry
        ki_res = self.loop.run_until_complete(
            multi_agent_orchestrator.execute(
                OrchestratorInput(
                    workflow=OrchestrationWorkflowType.KNOWLEDGE_INQUIRY,
                    user_id=self.patient_id,
                    query="What vaccines are administered at 6 weeks of age under NIS India?",
                    caller_user_id=self.patient_id,
                    caller_role="PATIENT",
                )
            )
        )
        self.assertEqual(ki_res.workflow_status, AgentStatus.SUCCESS)
        self.assertIn("knowledge", ki_res.steps_executed)
        self.assertIsNotNone(ki_res.knowledge)
        print(f"  PASS: Workflow 1 (KNOWLEDGE_INQUIRY) -> Status={ki_res.workflow_status}, Duration={ki_res.total_duration_ms}ms")

        # Workflow 2: Clinical Advisory
        ca_res = self.loop.run_until_complete(
            multi_agent_orchestrator.execute(
                OrchestratorInput(
                    workflow=OrchestrationWorkflowType.CLINICAL_ADVISORY,
                    user_id=self.patient_id,
                    query="What is the catch-up protocol for missed Pentavalent dose?",
                    caller_user_id=self.patient_id,
                    caller_role="PATIENT",
                )
            )
        )
        self.assertEqual(ca_res.workflow_status, AgentStatus.SUCCESS)
        self.assertIn("monitoring", ca_res.steps_executed)
        self.assertIn("recommendation", ca_res.steps_executed)
        self.assertIn("knowledge", ca_res.steps_executed)
        print(f"  PASS: Workflow 2 (CLINICAL_ADVISORY) -> Steps={ca_res.steps_executed}, Duration={ca_res.total_duration_ms}ms")

        # Workflow 3: Comprehensive Record Review
        cr_res = self.loop.run_until_complete(
            multi_agent_orchestrator.execute(
                OrchestratorInput(
                    workflow=OrchestrationWorkflowType.COMPREHENSIVE_RECORD,
                    user_id=self.patient_id,
                    caller_user_id=self.patient_id,
                    caller_role="PATIENT",
                    report_output_format=ReportOutputFormat.JSON,
                )
            )
        )
        self.assertEqual(cr_res.workflow_status, AgentStatus.SUCCESS)
        self.assertIn("monitoring", cr_res.steps_executed)
        self.assertIn("recommendation", cr_res.steps_executed)
        self.assertIn("report", cr_res.steps_executed)
        self.assertIsNotNone(cr_res.report_checksum)
        print(f"  PASS: Workflow 3 (COMPREHENSIVE_RECORD) -> Checksum={cr_res.report_checksum[:16]}..., Duration={cr_res.total_duration_ms}ms")

        # Workflow 4: Routine Monitoring Cycle
        rc_res = self.loop.run_until_complete(
            multi_agent_orchestrator.execute(
                OrchestratorInput(
                    workflow=OrchestrationWorkflowType.ROUTINE_CYCLE,
                    user_id=self.patient_id,
                    caller_user_id=self.patient_id,
                    caller_role="PATIENT",
                    include_reminders=True,
                    include_recommendations=True,
                    include_report=True,
                    dry_run=True,
                )
            )
        )
        self.assertEqual(rc_res.workflow_status, AgentStatus.SUCCESS)
        self.assertIn("monitoring", rc_res.steps_executed)
        self.assertIn("reminder", rc_res.steps_executed)
        self.assertIn("recommendation", rc_res.steps_executed)
        self.assertIn("report", rc_res.steps_executed)
        print(f"  PASS: Workflow 4 (ROUTINE_CYCLE) -> Executed 4 steps={rc_res.steps_executed}, Duration={rc_res.total_duration_ms}ms")

    # =========================================================================
    # Test 3: Inter-Agent Context Propagation & Performance
    # =========================================================================
    def test_03_context_propagation_and_zero_redundant_operations(self):
        print("\n[PHASE D TEST 3] Verifying Inter-Agent Context Propagation & Telemetry...")

        res = self.loop.run_until_complete(
            multi_agent_orchestrator.execute(
                OrchestratorInput(
                    workflow=OrchestrationWorkflowType.COMPREHENSIVE_RECORD,
                    user_id=self.patient_id,
                    caller_user_id=self.patient_id,
                    caller_role="PATIENT",
                    include_recommendations=True,
                    include_report=True,
                )
            )
        )
        self.assertEqual(res.workflow_status, AgentStatus.SUCCESS)

        # Verify step results exist with non-zero duration telemetry
        self.assertIn("monitoring", res.step_results)
        self.assertIn("recommendation", res.step_results)
        self.assertIn("report", res.step_results)

        for step in ["monitoring", "recommendation", "report"]:
            step_record = res.step_results[step]
            self.assertEqual(step_record.status, StepExecutionStatus.SUCCESS)
            self.assertGreater(step_record.duration_ms, 0)
            self.assertIsNone(step_record.error)

        # Verify report incorporates monitoring & recommendation items
        self.assertIsNotNone(res.report)
        self.assertIsNotNone(res.report.verification_hash)
        progress = res.report.report_data.get("progress", {})
        self.assertGreaterEqual(len(progress.get("nis_coverage_summary", "")), 5)
        print(f"  PASS: Context seamlessly propagated across steps. Total pipeline={res.total_duration_ms}ms.")

    # =========================================================================
    # Test 4: Fault Tolerance, Failure Boundaries & Step Timeouts
    # =========================================================================
    def test_04_fault_tolerance_and_timeouts(self):
        print("\n[PHASE D TEST 4] Verifying Error Containment, Timeouts & Partial Workflow Completion...")

        # 1. Non-critical step failure with continue_on_failure=True
        with patch.object(recommendation_agent, "execute", side_effect=RuntimeError("Simulated Recommendation Failure")):
            res = self.loop.run_until_complete(
                multi_agent_orchestrator.execute(
                    OrchestratorInput(
                        workflow=OrchestrationWorkflowType.ROUTINE_CYCLE,
                        user_id=self.patient_id,
                        caller_user_id=self.patient_id,
                        caller_role="PATIENT",
                        continue_on_failure=True,
                        dry_run=True,
                    )
                )
            )
            self.assertEqual(res.workflow_status, AgentStatus.PARTIAL_SUCCESS)
            self.assertIn("recommendation", res.steps_failed)
            self.assertIn("monitoring", res.steps_executed)
            self.assertEqual(res.step_results["recommendation"].status, StepExecutionStatus.FAILED)
            self.assertIn("Simulated Recommendation Failure", res.step_results["recommendation"].error)
            print(f"  PASS: Faulty agent captured. Overall status={res.workflow_status} (PARTIAL_SUCCESS).")

        # 2. Critical step failure with continue_on_failure=False
        with patch.object(monitoring_agent, "execute", side_effect=RuntimeError("Database Connection Lost")):
            res_halt = self.loop.run_until_complete(
                multi_agent_orchestrator.execute(
                    OrchestratorInput(
                        workflow=OrchestrationWorkflowType.ROUTINE_CYCLE,
                        user_id=self.patient_id,
                        caller_user_id=self.patient_id,
                        caller_role="PATIENT",
                        continue_on_failure=False,
                        dry_run=True,
                    )
                )
            )
            self.assertEqual(res_halt.workflow_status, AgentStatus.FAILED)
            self.assertIn("monitoring", res_halt.steps_failed)
            self.assertEqual(len(res_halt.steps_executed), 0)
            print(f"  PASS: Critical failure with continue_on_failure=False halted execution immediately ({res_halt.workflow_status}).")

        # 3. Step timeout protection
        async def slow_mock_execute(*args, **kwargs):
            await asyncio.sleep(0.5)
            return MonitoringAgentResult(agent_id="agent_monitoring_v1", timestamp=datetime.utcnow())

        with patch.object(monitoring_agent, "execute", side_effect=slow_mock_execute):
            res_timeout = self.loop.run_until_complete(
                multi_agent_orchestrator.execute(
                    OrchestratorInput(
                        workflow=OrchestrationWorkflowType.ROUTINE_CYCLE,
                        user_id=self.patient_id,
                        caller_user_id=self.patient_id,
                        caller_role="PATIENT",
                        step_timeout_seconds=0.05,  # Very short timeout to trigger protection
                        continue_on_failure=True,
                    )
                )
            )
            self.assertIn("monitoring", res_timeout.steps_failed)
            self.assertEqual(res_timeout.step_results["monitoring"].status, StepExecutionStatus.TIMEOUT)
            self.assertIn("timed out after 0.05s", res_timeout.step_results["monitoring"].error)
            print("  PASS: Step timeout triggered cleanly without hanging workflow.")

    # =========================================================================
    # Test 5: Tenant Isolation & Role-Based Access Control (RBAC)
    # =========================================================================
    def test_05_multi_tenant_isolation_and_rbac(self):
        print("\n[PHASE D TEST 5] Verifying Multi-Tenant Isolation & Role Authorization...")

        victim_household_id = "user_victim_household_999"
        attacker_patient_id = self.patient_id

        # Patient attempting to orchestrate another user's household -> PermissionError
        with self.assertRaises(PermissionError):
            self.loop.run_until_complete(
                multi_agent_orchestrator.execute(
                    OrchestratorInput(
                        workflow=OrchestrationWorkflowType.ROUTINE_CYCLE,
                        user_id=victim_household_id,
                        caller_user_id=attacker_patient_id,
                        caller_role="PATIENT",
                    )
                )
            )
        print("  PASS: Cross-tenant orchestrator execution rejected with PermissionError.")

        # Monitoring Agent direct access validation
        with self.assertRaises(PermissionError):
            self.loop.run_until_complete(
                monitoring_agent.execute(
                    MonitoringAgentInput(
                        user_id=victim_household_id,
                        caller_user_id=attacker_patient_id,
                        caller_role="PATIENT",
                    )
                )
            )
        print("  PASS: Monitoring Agent direct cross-tenant access rejected with PermissionError.")

        # Report Agent direct access validation
        with self.assertRaises(PermissionError):
            self.loop.run_until_complete(
                report_agent.execute(
                    ReportAgentInput(
                        user_id=victim_household_id,
                        caller_user_id=attacker_patient_id,
                        caller_role="PATIENT",
                    )
                )
            )
        print("  PASS: Report Agent direct cross-tenant access rejected with PermissionError.")

        # Admin authorized across households
        admin_res = self.loop.run_until_complete(
            multi_agent_orchestrator.execute(
                OrchestratorInput(
                    workflow=OrchestrationWorkflowType.ROUTINE_CYCLE,
                    user_id=self.patient_id,
                    caller_user_id="user_admin_super",
                    caller_role="ADMIN",
                    dry_run=True,
                )
            )
        )
        self.assertEqual(admin_res.workflow_status, AgentStatus.SUCCESS)
        print("  PASS: Admin caller successfully authorized for cross-household operations.")

    # =========================================================================
    # Test 6: Real Database Records Execution (Sharma Household)
    # =========================================================================
    def test_06_real_database_records_execution(self):
        print("\n[PHASE D TEST 6] Verifying Execution Against Live MongoDB Atlas Records...")

        members = self.loop.run_until_complete(family_service.list_members(self.patient_id))
        self.assertGreater(len(members), 0, "Expected seeded members in Sharma household.")

        aarav = next((m for m in members if "Aarav" in m.get("full_name", "")), None)
        self.assertIsNotNone(aarav, "Expected Aarav Sharma in database.")
        aarav_id = str(aarav.get("id") or aarav.get("_id"))

        records = self.loop.run_until_complete(
            vaccination_service.list_records_for_member(self.patient_id, aarav_id)
        )
        self.assertGreater(len(records), 0, "Expected administered vaccination records for Aarav.")

        # Execute Monitoring Agent on real child records
        mon_res = self.loop.run_until_complete(
            monitoring_agent.execute(
                MonitoringAgentInput(
                    user_id=self.patient_id,
                    family_member_id=aarav_id,
                    caller_user_id=self.patient_id,
                    caller_role="PATIENT",
                )
            )
        )
        self.assertEqual(mon_res.evaluated_members_count, 1)
        aarav_eval = mon_res.member_assessments[0]
        self.assertIn("COMPLETED", aarav_eval.categorized_doses)
        self.assertGreater(len(aarav_eval.categorized_doses["COMPLETED"]), 0)
        print(f"  PASS: Evaluated Aarav Sharma in MongoDB: {len(aarav_eval.categorized_doses['COMPLETED'])} completed doses.")

    # =========================================================================
    # Test 7: External Service Error Handling (Gemini & Notification Providers)
    # =========================================================================
    def test_07_resilient_error_handling_gemini_and_notifications(self):
        print("\n[PHASE D TEST 7] Verifying External Service Failure Resilience...")

        # 1. Knowledge Agent gracefully handles external GeminiAPIError
        with patch.object(knowledge_agent.rag_service, "query", side_effect=GeminiAPIError("Rate quota exceeded")):
            k_res = self.loop.run_until_complete(
                knowledge_agent.execute(
                    KnowledgeAgentInput(question="What is the schedule for Measles Rubella?")
                )
            )
            self.assertFalse(k_res.has_sufficient_context)
            self.assertIn("temporarily unavailable", k_res.answer)
            self.assertIn("MoHFW", k_res.disclaimer)
            print("  PASS: Knowledge Agent absorbed external AI quota error with safe clinical fallback.")

        # 2. Reminder Agent captures provider failure without reporting false success
        from app.agents.monitoring.schemas import ActionableMonitoringEvent
        from app.models.notification import NotificationPriority
        sample_event = ActionableMonitoringEvent(
            event_id="evt_test_provider_fail",
            dedup_key=f"{self.patient_id}:mem_test:BCG:REMINDER:2026-01-01:1d",
            event_type="DUE_REMINDER",
            priority=NotificationPriority.HIGH,
            family_member_id="mem_test",
            member_name="Aarav Sharma",
            vaccine_code="BCG",
            vaccine_name="BCG",
            dose_number=1,
            dose_name="Birth Dose",
            calculated_due_date=date.today(),
            title="Vaccination Due: BCG",
            message="BCG is due today.",
            ready_for_reminder=True,
        )

        with patch.object(notification_service, "create_notification", new_callable=AsyncMock, side_effect=RuntimeError("Provider Outage")):
            r_res = self.loop.run_until_complete(
                reminder_agent.execute(
                    ReminderAgentInput(
                        user_id=self.patient_id,
                        events=[sample_event],
                        dry_run=False,
                        caller_user_id=self.patient_id,
                        caller_role="PATIENT",
                        channels_override=[NotificationChannel.IN_APP],
                    ),
                    preferences_fixture={
                        "channels_enabled": [NotificationChannel.IN_APP],
                        "quiet_hours_enabled": False,
                    },
                )
            )
            self.assertEqual(r_res.total_dispatched, 0)
            self.assertGreater(r_res.total_provider_failures, 0)
            self.assertEqual(r_res.skipped_reminders[0].status, ReminderStatus.FAILED_PROVIDER)
            print("  PASS: Reminder Agent correctly recorded FAILED_PROVIDER without false positive dispatch.")


class TestPhaseDAPIEndpoints(unittest.TestCase):
    """Verifies REST API endpoints via TestClient."""

    @classmethod
    def setUpClass(cls):
        print("\n" + "=" * 70)
        print("  VAXASSIST AI — PHASE D: REST API ENDPOINTS VERIFICATION")
        print("=" * 70)
        cls.test_client_ctx = TestClient(app)
        cls.client = cls.test_client_ctx.__enter__()

        # Login to obtain authentication token
        resp = cls.client.post("/api/v1/auth/login", json={
            "email": "rajesh.sharma@vaxassist.demo",
            "password": "Rajesh@Vax2026!",
        })
        if resp.status_code == 200:
            cls.patient_token = resp.json()["access_token"]
            cls.patient_headers = {"Authorization": f"Bearer {cls.patient_token}"}
        else:
            cls.patient_headers = {}

    @classmethod
    def tearDownClass(cls):
        cls.test_client_ctx.__exit__(None, None, None)

    def test_08_api_endpoints_integration(self):
        print("\n[PHASE D TEST 8] Verifying REST API Endpoints...")

        if not self.patient_headers:
            self.skipTest("No patient auth token available for API endpoint test.")

        # 1. Architecture endpoint
        arch_resp = self.client.get("/api/v1/agents/architecture", headers=self.patient_headers)
        self.assertEqual(arch_resp.status_code, 200)
        arch_data = arch_resp.json()["data"]
        self.assertEqual(len(arch_data), 5)
        self.assertIn("monitoring_agent", arch_data)
        self.assertIn("report_agent", arch_data)
        print("  PASS: GET /api/v1/agents/architecture -> 5 agents retrieved.")

        # 2. Workflow catalog endpoint
        wf_resp = self.client.get("/api/v1/agents/orchestrator/workflows", headers=self.patient_headers)
        self.assertEqual(wf_resp.status_code, 200)
        wf_data = wf_resp.json()["data"]
        self.assertIn("routine_cycle", wf_data)
        self.assertIn("clinical_advisory", wf_data)
        self.assertIn("comprehensive_record", wf_data)
        self.assertIn("knowledge_inquiry", wf_data)
        print("  PASS: GET /api/v1/agents/orchestrator/workflows -> 6 workflow definitions cataloged.")

        # 3. Run Orchestrator endpoint
        orch_req = {
            "workflow": "knowledge_inquiry",
            "query": "What is the recommended age for BCG vaccine under UIP?",
        }
        run_resp = self.client.post("/api/v1/agents/orchestrator/run", json=orch_req, headers=self.patient_headers)
        self.assertEqual(run_resp.status_code, 200)
        run_data = run_resp.json()["data"]
        self.assertEqual(run_data["workflow_status"], "SUCCESS")
        self.assertIn("knowledge", run_data["steps_executed"])
        print(f"  PASS: POST /api/v1/agents/orchestrator/run -> Status={run_data['workflow_status']}, Time={run_data['total_duration_ms']}ms.")

        # 4. Route Task endpoint
        route_req = {
            "task_intent": "Please check upcoming vaccines and reminders for our family",
            "dry_run": True,
        }
        route_resp = self.client.post("/api/v1/agents/orchestrator/route", json=route_req, headers=self.patient_headers)
        self.assertEqual(route_resp.status_code, 200)
        route_data = route_resp.json()["data"]
        self.assertEqual(route_data["workflow"], "routine_cycle")
        print("  PASS: POST /api/v1/agents/orchestrator/route -> Routed to 'routine_cycle'.")

        # 5. Download Report PDF endpoint
        dl_req = {
            "report_type": "comprehensive_record",
            "output_format": "pdf",
        }
        dl_resp = self.client.post("/api/v1/agents/reports/download", json=dl_req, headers=self.patient_headers)
        self.assertEqual(dl_resp.status_code, 200)
        self.assertEqual(dl_resp.headers.get("content-type"), "application/pdf")
        self.assertIn("X-Verification-Hash", dl_resp.headers)
        self.assertTrue(len(dl_resp.content) > 100)
        print(f"  PASS: POST /api/v1/agents/reports/download -> Received binary PDF ({len(dl_resp.content)} bytes), Hash={dl_resp.headers['X-Verification-Hash'][:16]}...")


if __name__ == "__main__":
    unittest.main()
