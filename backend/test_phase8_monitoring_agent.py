"""
Comprehensive Test Suite for Phase 8:
AI AGENT ARCHITECTURE & MONITORING AGENT IMPLEMENTATION.

Validates:
1. Five-Agent Architecture specification completeness & contracts
2. Normal vaccination records & authoritative clinical states (UPCOMING, DUE, OVERDUE, MISSED, CATCH_UP, CLINICAL_REVIEW, COMPLETED)
3. Missing or incomplete records handling (missing DOB, missing vaccine_code, missing dates)
4. Multiple family members evaluation and household aggregation
5. Invalid or conflicting data (future dates, pre-birth dates, chronological sequence inversions, corrupted dates)
6. Duplicate processing, idempotency, and deterministic dedup_key generation
7. Authorization, patient data isolation, and RBAC tenant enforcement
8. Integration with deterministic schedule engine and Phase 6 monitoring services
9. Zero-LLM enforcement (100% deterministic clinical calculations)
10. Standardized BaseAgent lifecycle (execution_id, telemetry, duration_ms)
"""
import sys
from datetime import date, timedelta
from typing import List, Dict, Any

from app.agents.base import AgentStatus, BaseAgent, AgentExecutionResult
from app.agents.architecture import FIVE_AGENT_ARCHITECTURE, get_agent_architecture_spec
from app.agents.monitoring import (
    monitoring_agent,
    MonitoringAgent,
    MonitoringAgentInput,
    MonitoringAgentResult,
    MemberMonitoringAssessment,
    DoseAssessmentItem,
    ActionableMonitoringEvent,
    DataQualityIssue,
)
from app.models.vaccination import VaccinationStatus
from app.models.notification import NotificationPriority
from app.models.user import UserRole


def print_step(title: str):
    print(f"\n{'='*75}\n[TEST PHASE 8] {title}\n{'='*75}")


def test_agent_architecture_spec():
    """Verify that all five specialized agents are formally defined with required contracts."""
    print_step("1. Five-Agent Architecture Specification Verification")
    specs = get_agent_architecture_spec()

    required_agents = [
        "monitoring_agent",
        "reminder_agent",
        "knowledge_rag_agent",
        "recommendation_agent",
        "report_agent",
    ]

    for agent_key in required_agents:
        assert agent_key in specs, f"Missing agent '{agent_key}' in architecture specification!"
        spec = specs[agent_key]
        assert spec["agent_id"], f"Agent {agent_key} must have agent_id"
        assert spec["name"], f"Agent {agent_key} must have name"
        assert spec["role_type"], f"Agent {agent_key} must have role_type"
        assert spec["responsibility"], f"Agent {agent_key} must have responsibility"
        assert len(spec["primary_inputs"]) > 0, f"Agent {agent_key} must define primary_inputs"
        assert len(spec["primary_outputs"]) > 0, f"Agent {agent_key} must define primary_outputs"
        assert len(spec["upstream_dependencies"]) > 0, f"Agent {agent_key} must define upstream_dependencies"
        assert len(spec["downstream_consumers"]) > 0, f"Agent {agent_key} must define downstream_consumers"
        assert spec["backend_invocation"], f"Agent {agent_key} must define backend_invocation"
        assert spec["orchestration_phase9_role"], f"Agent {agent_key} must define orchestration_phase9_role"
        print(f"  [OK] {spec['name']} ({spec['agent_id']}): Verified specification, inputs, outputs, and dependencies.")

    assert specs["monitoring_agent"]["zero_llm_rules_enforced"] is True
    print("PASS: Five-agent architecture fully specified for Phase 8 and Phase 9.")


def test_normal_vaccination_states():
    """Verify normal records and accurate identification of all clinical states."""
    print_step("2. Normal Vaccination Records & Expected Clinical States")
    ref_date = date(2026, 9, 26)

    # A. Newborn baby (DOB = Today)
    newborn_member = {
        "id": "mem_newborn_001",
        "full_name": "Baby Aarav",
        "date_of_birth": ref_date,
    }
    assessment_newborn = monitoring_agent.evaluate_member(
        user_id="user_test_001",
        member=newborn_member,
        raw_records=[],
        reference_date=ref_date,
    )
    assert assessment_newborn.summary["completed_count"] == 0
    assert assessment_newborn.summary["due_count"] >= 3  # BCG, HepB Birth, OPV-0
    assert assessment_newborn.summary["upcoming_count"] > 10

    due_codes = [d.rule_code for d in assessment_newborn.categorized_doses[VaccinationStatus.DUE.value]]
    assert "BCG" in due_codes
    assert "HEPB_BIRTH" in due_codes
    assert "OPV_0" in due_codes
    print("  âœ“ Newborn baby correctly evaluated: Birth doses DUE, subsequent doses UPCOMING.")

    # B. 14-month infant with missed birth doses and catch-up required
    dob_14mo = ref_date - timedelta(days=420)
    infant_14mo = {
        "id": "mem_infant_002",
        "full_name": "Infant Priya",
        "date_of_birth": dob_14mo,
    }
    assessment_14mo = monitoring_agent.evaluate_member(
        user_id="user_test_001",
        member=infant_14mo,
        raw_records=[],
        reference_date=ref_date,
    )

    missed_codes = [d.rule_code for d in assessment_14mo.categorized_doses[VaccinationStatus.MISSED.value]]
    assert "HEPB_BIRTH" in missed_codes, "HepB birth dose past 24h must be MISSED"
    assert "OPV_0" in missed_codes, "OPV-0 past 15d must be MISSED"
    assert any("ROTA" in c for c in missed_codes), "Rotavirus past 1 year must be MISSED"

    catchup_codes = [d.rule_code for d in assessment_14mo.categorized_doses[VaccinationStatus.CATCH_UP_REQUIRED.value]]
    assert "PENTA_1" in catchup_codes, "Penta-1 at 14mo must be CATCH_UP_REQUIRED"

    review_codes = [d.rule_code for d in assessment_14mo.categorized_doses[VaccinationStatus.CLINICAL_REVIEW.value]]
    assert "BCG" in review_codes, "BCG past 1 year must require CLINICAL_REVIEW"
    print("  âœ“ 14-month infant correctly evaluated: HepB/OPV-0/Rota MISSED, Penta CATCH_UP, BCG CLINICAL_REVIEW.")

    # C. Timely administered doses -> COMPLETED
    infant_timely = {
        "id": "mem_infant_003",
        "full_name": "Infant Rohan",
        "date_of_birth": ref_date - timedelta(days=60),
    }
    administered_records = [
        {"id": "r1", "family_member_id": "mem_infant_003", "vaccine_code": "BCG", "dose_number": 1, "administered_date": ref_date - timedelta(days=58)},
        {"id": "r2", "family_member_id": "mem_infant_003", "vaccine_code": "HEPB_BIRTH", "dose_number": 1, "administered_date": ref_date - timedelta(days=59)},
        {"id": "r3", "family_member_id": "mem_infant_003", "vaccine_code": "OPV_0", "dose_number": 1, "administered_date": ref_date - timedelta(days=55)},
    ]
    assessment_timely = monitoring_agent.evaluate_member(
        user_id="user_test_001",
        member=infant_timely,
        raw_records=administered_records,
        reference_date=ref_date,
    )
    assert assessment_timely.summary["completed_count"] == 3
    completed_codes = [d.rule_code for d in assessment_timely.categorized_doses[VaccinationStatus.COMPLETED.value]]
    assert "BCG" in completed_codes
    assert "HEPB_BIRTH" in completed_codes
    assert "OPV_0" in completed_codes
    print("  âœ“ Administered records correctly classified as COMPLETED.")
    print("PASS: Authoritative clinical vaccination states verified.")


def test_missing_and_incomplete_records():
    """Verify safe handling of missing, incomplete, or null fields without throwing exceptions."""
    print_step("3. Safe Handling of Missing or Incomplete Records")
    ref_date = date(2026, 9, 26)

    # 1. Missing date of birth
    member_no_dob = {
        "id": "mem_no_dob",
        "full_name": "Unregistered DOB Member",
        "date_of_birth": None,
    }
    assessment_no_dob = monitoring_agent.evaluate_member(
        user_id="user_test_001",
        member=member_no_dob,
        raw_records=[],
        reference_date=ref_date,
    )
    assert assessment_no_dob.summary["total_doses"] == 0
    assert len(assessment_no_dob.data_quality_issues) >= 1
    issue = assessment_no_dob.data_quality_issues[0]
    assert issue.issue_type == "MISSING_DOB"
    assert issue.severity == "CRITICAL"
    assert len(assessment_no_dob.actionable_events) == 1
    assert assessment_no_dob.actionable_events[0].event_type == "CLINICAL_REVIEW_ALERT"
    print("  âœ“ Missing DOB safely handled: schedule halted, clinical review event generated, zero crash.")

    # 2. Incomplete record: Missing vaccine_code
    member_valid = {
        "id": "mem_valid",
        "full_name": "Valid Baby",
        "date_of_birth": ref_date - timedelta(days=30),
    }
    records_incomplete = [
        {"id": "bad_rec_1", "family_member_id": "mem_valid", "vaccine_code": "", "dose_number": 1, "administered_date": ref_date - timedelta(days=20)},
        {"id": "bad_rec_2", "family_member_id": "mem_valid", "vaccine_code": "BCG", "dose_number": 1, "administered_date": None},
        {"id": "bad_rec_3", "family_member_id": "mem_valid", "vaccine_code": "HEPB_BIRTH", "dose_number": -5, "administered_date": ref_date - timedelta(days=28)},
    ]
    assessment_incomplete = monitoring_agent.evaluate_member(
        user_id="user_test_001",
        member=member_valid,
        raw_records=records_incomplete,
        reference_date=ref_date,
    )
    issue_types = [i.issue_type for i in assessment_incomplete.data_quality_issues]
    assert "MISSING_VACCINE_CODE" in issue_types
    assert "MISSING_ADMINISTERED_DATE" in issue_types
    assert "INVALID_DOSE_NUMBER" in issue_types
    print(f"  âœ“ Incomplete records safely caught and audited: {issue_types}")
    print("PASS: Safe handling of missing and incomplete records verified.")


def test_invalid_and_conflicting_data():
    """Verify detection and audit logging of clinical conflicts and invalid dates."""
    print_step("4. Invalid and Conflicting Clinical Data Handling")
    ref_date = date(2026, 9, 26)
    dob = ref_date - timedelta(days=200)

    member = {
        "id": "mem_conflicts",
        "full_name": "Conflicting Records Child",
        "date_of_birth": dob,
    }

    records_with_conflicts = [
        # Administered date in the future
        {
            "id": "future_rec",
            "family_member_id": "mem_conflicts",
            "vaccine_code": "PENTA",
            "dose_number": 1,
            "administered_date": ref_date + timedelta(days=30),
        },
        # Administered date before member was born
        {
            "id": "pre_birth_rec",
            "family_member_id": "mem_conflicts",
            "vaccine_code": "BCG",
            "dose_number": 1,
            "administered_date": dob - timedelta(days=10),
        },
        # Corrupted date string
        {
            "id": "corrupt_date_rec",
            "family_member_id": "mem_conflicts",
            "vaccine_code": "OPV",
            "dose_number": 1,
            "administered_date": "not-a-valid-date-string",
        },
        # Chronological inversion: Dose 2 given before Dose 1
        {
            "id": "inv_dose_1",
            "family_member_id": "mem_conflicts",
            "vaccine_code": "ROTA",
            "dose_number": 1,
            "administered_date": ref_date - timedelta(days=50),
        },
        {
            "id": "inv_dose_2",
            "family_member_id": "mem_conflicts",
            "vaccine_code": "ROTA",
            "dose_number": 2,
            "administered_date": ref_date - timedelta(days=80),  # earlier than dose 1!
        },
    ]

    assessment = monitoring_agent.evaluate_member(
        user_id="user_test_001",
        member=member,
        raw_records=records_with_conflicts,
        reference_date=ref_date,
    )

    issue_types = [i.issue_type for i in assessment.data_quality_issues]
    assert "FUTURE_ADMINISTERED_DATE" in issue_types
    assert "ADMINISTERED_BEFORE_BIRTH" in issue_types
    assert "CORRUPTED_DATE" in issue_types
    assert "CHRONOLOGICAL_CONFLICT" in issue_types

    print("  âœ“ Detected FUTURE_ADMINISTERED_DATE")
    print("  âœ“ Detected ADMINISTERED_BEFORE_BIRTH")
    print("  âœ“ Detected CORRUPTED_DATE")
    print("  âœ“ Detected CHRONOLOGICAL_CONFLICT (Dose 2 before Dose 1)")
    print("PASS: Invalid and conflicting data audited without crash.")


def test_multiple_family_members():
    """Verify monitoring evaluation across multiple family members in a household."""
    print_step("5. Multiple Family Members Household Evaluation")
    import asyncio
    ref_date = date(2026, 9, 26)

    members_fixture = [
        {"id": "mem_fam_1", "full_name": "Toddler Maya", "date_of_birth": ref_date - timedelta(days=500)},
        {"id": "mem_fam_2", "full_name": "Newborn Arjun", "date_of_birth": ref_date},
        {"id": "mem_fam_3", "full_name": "Teenager Diya", "date_of_birth": ref_date - timedelta(days=365 * 15)},
    ]

    records_fixture = [
        {"id": "r10", "family_member_id": "mem_fam_1", "vaccine_code": "BCG", "dose_number": 1, "administered_date": ref_date - timedelta(days=490)},
        {"id": "r11", "family_member_id": "mem_fam_3", "vaccine_code": "TD_10", "dose_number": 1, "administered_date": ref_date - timedelta(days=365 * 5)},
    ]

    input_data = MonitoringAgentInput(
        user_id="user_multimember_001",
        reference_date=ref_date,
    )

    result: MonitoringAgentResult = asyncio.run(
        monitoring_agent.execute(
            input_data=input_data,
            members_fixture=members_fixture,
            records_fixture=records_fixture,
        )
    )

    assert result.evaluated_members_count == 3
    assert len(result.member_assessments) == 3
    assert result.total_doses_evaluated > 50

    names = [m.full_name for m in result.member_assessments]
    assert "Toddler Maya" in names
    assert "Newborn Arjun" in names
    assert "Teenager Diya" in names

    assert result.total_actionable_events > 0
    print(f"  âœ“ Successfully evaluated {result.evaluated_members_count} family members.")
    print(f"  âœ“ Total doses evaluated: {result.total_doses_evaluated}")
    print(f"  âœ“ Actionable events generated: {result.total_actionable_events}")
    print(f"  âœ“ Status distribution: {result.status_distribution}")
    print("PASS: Multiple family members evaluated and aggregated accurately.")


def test_duplicate_processing_and_idempotency():
    """Verify deterministic deduplication keys and idempotent event creation."""
    print_step("6. Duplicate Processing and Idempotency Verification")
    import asyncio
    ref_date = date(2026, 9, 26)

    member = {"id": "mem_idem_001", "full_name": "Baby Idem", "date_of_birth": ref_date}
    records = []

    # Run evaluation twice
    assessment_1 = monitoring_agent.evaluate_member(
        user_id="user_idem",
        member=member,
        raw_records=records,
        reference_date=ref_date,
    )
    assessment_2 = monitoring_agent.evaluate_member(
        user_id="user_idem",
        member=member,
        raw_records=records,
        reference_date=ref_date,
    )

    keys_1 = [e.dedup_key for e in assessment_1.actionable_events]
    keys_2 = [e.dedup_key for e in assessment_2.actionable_events]

    assert len(keys_1) == len(keys_2), "Both runs must produce the exact same number of events"
    assert keys_1 == keys_2, "Dedup keys must be 100% identical and deterministic across runs"

    # Verify key structure format
    for k in keys_1:
        parts = k.split(":")
        assert parts[0] == "user_idem"
        assert parts[1] == "mem_idem_001"
        assert len(parts) >= 4

    print(f"  âœ“ Generated {len(keys_1)} deterministic dedup keys identically across runs.")
    print(f"  âœ“ Sample dedup key: {keys_1[0]}")
    print("PASS: Duplicate processing and idempotency verified.")


def test_authorization_and_data_isolation():
    """Verify strict tenant isolation and role-based access restrictions."""
    print_step("7. Authorization and Patient Data Isolation")
    import asyncio
    ref_date = date(2026, 9, 26)

    members_fixture = [
        {"id": "mem_patient_b", "full_name": "Patient B Child", "date_of_birth": ref_date}
    ]

    # Scenario 1: Patient A attempts to monitor Patient B's household
    input_patient_a_hack = MonitoringAgentInput(
        user_id="user_patient_b",
        caller_user_id="user_patient_a",
        caller_role=UserRole.PATIENT.value,
        reference_date=ref_date,
    )
    try:
        asyncio.run(
            monitoring_agent.execute(
                input_data=input_patient_a_hack,
                members_fixture=members_fixture,
            )
        )
        assert False, "Patient A accessing Patient B data must raise PermissionError!"
    except PermissionError as e:
        assert "cannot monitor records belonging to user" in str(e)
        print("  âœ“ Blocked cross-tenant household access for PATIENT (403 Forbidden equivalent).")

    # Scenario 2: Patient A attempts to access a family member ID not in their household
    input_patient_wrong_member = MonitoringAgentInput(
        user_id="user_patient_a",
        family_member_id="mem_not_in_family",
        caller_user_id="user_patient_a",
        caller_role=UserRole.PATIENT.value,
        reference_date=ref_date,
    )
    try:
        asyncio.run(
            monitoring_agent.execute(
                input_data=input_patient_wrong_member,
                members_fixture=[{"id": "mem_patient_a_legit", "date_of_birth": ref_date}],
            )
        )
        assert False, "Accessing foreign member ID must raise PermissionError!"
    except PermissionError as e:
        assert "does not belong to your household" in str(e)
        print("  âœ“ Blocked foreign family_member_id access for PATIENT.")

    # Scenario 3: HEALTHCARE_WORKER evaluates Patient B's household -> Allowed
    input_hcw = MonitoringAgentInput(
        user_id="user_patient_b",
        caller_user_id="user_hcw_001",
        caller_role=UserRole.HEALTHCARE_WORKER.value,
        reference_date=ref_date,
    )
    result_hcw = asyncio.run(
        monitoring_agent.execute(
            input_data=input_hcw,
            members_fixture=members_fixture,
            records_fixture=[],
        )
    )
    assert result_hcw.evaluated_members_count == 1
    print("  âœ“ HEALTHCARE_WORKER successfully permitted to monitor patient household.")

    # Scenario 4: ADMIN evaluates Patient B's household -> Allowed
    input_admin = MonitoringAgentInput(
        user_id="user_patient_b",
        caller_user_id="user_admin_001",
        caller_role=UserRole.ADMIN.value,
        reference_date=ref_date,
    )
    result_admin = asyncio.run(
        monitoring_agent.execute(
            input_data=input_admin,
            members_fixture=members_fixture,
            records_fixture=[],
        )
    )
    assert result_admin.evaluated_members_count == 1
    print("  âœ“ ADMIN successfully permitted to monitor patient household.")
    print("PASS: Authorization and tenant data isolation verified.")


def test_structured_output_for_reminder_agent():
    """Verify that Monitoring Agent produces complete structured events ready for Reminder Agent."""
    print_step("8. Structured Output Readiness for Reminder Agent")
    ref_date = date(2026, 9, 26)

    # 4-month baby: penta-1 was due at 6 weeks, currently overdue
    dob = ref_date - timedelta(days=120)
    member = {"id": "mem_rem_001", "full_name": "Baby Meera", "date_of_birth": dob}

    assessment = monitoring_agent.evaluate_member(
        user_id="user_rem",
        member=member,
        raw_records=[],
        reference_date=ref_date,
        reminder_lead_days=[14, 7, 3, 1],
    )

    assert len(assessment.actionable_events) > 0
    sample_evt = assessment.actionable_events[0]

    # Verify attributes needed by Reminder Agent
    assert sample_evt.event_id
    assert sample_evt.dedup_key
    assert sample_evt.event_type in ("DUE_ALERT", "OVERDUE_ALERT", "MISSED_ALERT", "CATCH_UP_ALERT", "UPCOMING_REMINDER")
    assert sample_evt.priority in (NotificationPriority.LOW, NotificationPriority.MEDIUM, NotificationPriority.HIGH, NotificationPriority.URGENT)
    assert sample_evt.family_member_id == "mem_rem_001"
    assert sample_evt.member_name == "Baby Meera"
    assert sample_evt.vaccine_code
    assert sample_evt.vaccine_name
    assert sample_evt.dose_number >= 1
    assert sample_evt.dose_name
    assert sample_evt.calculated_due_date
    assert sample_evt.title
    assert sample_evt.message
    assert sample_evt.ready_for_reminder is True

    print(f"  âœ“ Actionable event successfully verified for Reminder Agent:")
    print(f"    - Type: {sample_evt.event_type}")
    print(f"    - Priority: {sample_evt.priority.value}")
    print(f"    - Vaccine: {sample_evt.vaccine_name} ({sample_evt.dose_name})")
    print(f"    - Message: {sample_evt.message}")
    print(f"    - Ready for Reminder: {sample_evt.ready_for_reminder}")
    print("PASS: Structured output for Reminder Agent validated.")


def test_base_agent_lifecycle():
    """Verify BaseAgent standard lifecycle, timing telemetry, and execution IDs."""
    print_step("9. BaseAgent Lifecycle & Telemetry")
    import asyncio
    ref_date = date(2026, 9, 26)

    members_fixture = [
        {"id": "mem_telemetry", "full_name": "Baby Telemetry", "date_of_birth": ref_date}
    ]

    exec_result: AgentExecutionResult[MonitoringAgentResult] = asyncio.run(
        monitoring_agent.run(
            input_data=MonitoringAgentInput(user_id="user_telemetry", reference_date=ref_date),
            members_fixture=members_fixture,
            records_fixture=[],
        )
    )

    assert exec_result.status == AgentStatus.SUCCESS
    assert exec_result.agent_id == "agent_monitoring_v1"
    assert exec_result.agent_name == "Monitoring Agent"
    assert exec_result.execution_id.startswith("exec_")
    assert exec_result.duration_ms >= 0.0
    assert exec_result.data is not None
    assert exec_result.data.evaluated_members_count == 1
    print(f"  âœ“ Execution ID: {exec_result.execution_id}")
    print(f"  âœ“ Execution Status: {exec_result.status.value}")
    print(f"  âœ“ Duration: {exec_result.duration_ms} ms")
    print("PASS: BaseAgent lifecycle and telemetry verified.")


def run_all_phase8_tests():
    print("=" * 75)
    print("RUNNING PHASE 8: AI AGENT ARCHITECTURE & MONITORING AGENT TEST SUITE")
    print("=" * 75)

    test_agent_architecture_spec()
    test_normal_vaccination_states()
    test_missing_and_incomplete_records()
    test_invalid_and_conflicting_data()
    test_multiple_family_members()
    test_duplicate_processing_and_idempotency()
    test_authorization_and_data_isolation()
    test_structured_output_for_reminder_agent()
    test_base_agent_lifecycle()

    print("\n" + "=" * 75)
    print("ALL PHASE 8 MONITORING AGENT TESTS PASSED SUCCESSFULLY! (9/9)")
    print("=" * 75)


if __name__ == "__main__":
    run_all_phase8_tests()
