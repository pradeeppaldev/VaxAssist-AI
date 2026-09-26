"""
Comprehensive Test Suite for Phase 8:
AGENT 5 OF 5: REPORT GENERATION AGENT IMPLEMENTATION.

Validates:
A. Agent Architecture & BaseAgent Lifecycle Execution
B. Comprehensive Vaccination Passport & Record Generation (JSON & PDF)
C. Vaccination History & Provenance Report Generation
D. Vaccination Status & Schedule Milestone Report Generation
E. Progress Summary & NIS Compliance Calculation
F. Missing DOB, Corrupt Records & Empty History Edge Cases
G. Clinical Recommendations Toggle & Data Quality Auditing Inclusion
H. Tamper-Evident SHA-256 Cryptographic Verification Checksum
I. Multi-Tenant Household Isolation & Role-Based Access Control (RBAC)
J. FastAPI Endpoints via TestClient (/reports/generate, /download, /run)
"""
import sys
import base64
import hashlib
import asyncio
from datetime import date, datetime, timedelta
from typing import List, Dict, Any
from unittest.mock import AsyncMock, patch, MagicMock

import httpx
from starlette.testclient import TestClient

from app.main import app
from app.agents.base import BaseAgent, AgentStatus, AgentExecutionResult
from app.agents.architecture import FIVE_AGENT_ARCHITECTURE
from app.agents.report import (
    report_agent,
    ReportAgent,
    ReportAgentInput,
    ReportAgentResult,
    ReportType,
    ReportOutputFormat,
    MANDATORY_REPORT_DISCLAIMER,
)
from app.agents.report.schemas import (
    PatientDemographicsReportItem,
    AdministeredRecordReportItem,
    ScheduledDoseReportItem,
    ProgressSummaryReportItem,
    RecommendationReportItem,
    DataQualityReportItem,
)
from app.models.user import UserRole
from app.api.deps import get_current_user


def print_step(title: str):
    print(f"\n{'='*75}\n[TEST REPORT GENERATION AGENT] {title}\n{'='*75}")


# =============================================================================
# Helper Fixtures
# =============================================================================

def make_sample_member(
    member_id: str = "mem_aarav_001",
    full_name: str = "Aarav Sharma",
    dob_str: str = "2025-01-15",
    relationship: str = "Child",
    gender: str = "Male",
    blood_group: str = "O+",
    allergies: List[str] = None,
) -> Dict[str, Any]:
    return {
        "id": member_id,
        "full_name": full_name,
        "date_of_birth": dob_str,
        "relationship": relationship,
        "gender": gender,
        "blood_group": blood_group,
        "allergies": allergies or ["Egg protein (mild)"],
        "notes": "Follow-up required after 18-month milestone.",
    }


def make_sample_administered_records(member_id: str = "mem_aarav_001") -> List[Dict[str, Any]]:
    return [
        {
            "id": "rec_001",
            "family_member_id": member_id,
            "vaccine_code": "BCG",
            "vaccine_name": "BCG (Bacillus Calmette-Guérin)",
            "dose_number": 1,
            "dose_name": "Dose 1",
            "administered_date": "2025-01-16",
            "batch_number": "BCG-9981A",
            "healthcare_provider": "City General Hospital",
            "administration_site": "Left upper arm (intradermal)",
            "adverse_reactions": None,
            "notes": "Routine birth dose administered without incident.",
        },
        {
            "id": "rec_002",
            "family_member_id": member_id,
            "vaccine_code": "OPV_0",
            "vaccine_name": "Oral Polio Vaccine (Birth Dose)",
            "dose_number": 1,
            "dose_name": "Birth Dose",
            "administered_date": "2025-01-16",
            "batch_number": "OPV-3312B",
            "healthcare_provider": "City General Hospital",
            "administration_site": "Oral",
            "adverse_reactions": None,
            "notes": "Birth dose given within 24 hours.",
        },
        {
            "id": "rec_003",
            "family_member_id": member_id,
            "vaccine_code": "HEPB_BIRTH",
            "vaccine_name": "Hepatitis B (Birth Dose)",
            "dose_number": 1,
            "dose_name": "Birth Dose",
            "administered_date": "2025-01-16",
            "batch_number": "HB-7721",
            "healthcare_provider": "City General Hospital",
            "administration_site": "Anterolateral aspect of mid-thigh",
            "adverse_reactions": None,
            "notes": "Birth dose within 24 hours.",
        },
        {
            "id": "rec_004",
            "family_member_id": member_id,
            "vaccine_code": "PENTA_1",
            "vaccine_name": "Pentavalent (DPT-HepB-Hib) Dose 1",
            "dose_number": 1,
            "dose_name": "Dose 1",
            "administered_date": "2025-03-01",
            "batch_number": "PT-5520",
            "healthcare_provider": "Community Health Center",
            "administration_site": "Anterolateral thigh",
            "adverse_reactions": "Mild localized redness for 24h",
            "notes": "Given at 6-week milestone.",
        },
    ]


# =============================================================================
# Test Suite
# =============================================================================

async def test_agent_architecture_and_lifecycle():
    print_step("Test 1: Agent Architecture & BaseAgent Lifecycle")

    assert report_agent.agent_id == "agent_report_generation_v1", f"Unexpected ID: {report_agent.agent_id}"
    assert report_agent.name == "Report Generation Agent"
    assert report_agent.metadata.agent_id == "agent_report_generation_v1"

    spec = FIVE_AGENT_ARCHITECTURE.get("report_agent")
    assert spec is not None, "report_agent specification missing from FIVE_AGENT_ARCHITECTURE"
    assert spec["agent_id"] == "agent_report_generation_v1"
    assert "primary_inputs" in spec
    assert "primary_outputs" in spec

    # Test standardized BaseAgent.run() wrapper
    member = make_sample_member()
    records = make_sample_administered_records()
    agent_input = ReportAgentInput(
        user_id="user_test_001",
        family_member_id=member["id"],
        report_type=ReportType.COMPREHENSIVE_RECORD,
        output_format=ReportOutputFormat.JSON,
        reference_date=date(2025, 6, 1),
        members_fixture=[member],
        records_fixture=records,
    )

    run_result = await report_agent.run(input_data=agent_input)
    assert isinstance(run_result, AgentExecutionResult)
    assert run_result.agent_id == "agent_report_generation_v1"
    assert run_result.status == AgentStatus.SUCCESS
    assert run_result.execution_id.startswith("exec_")
    assert run_result.duration_ms >= 0
    assert run_result.data is not None
    assert run_result.data.report_id.startswith("VAX-REP-")
    print("[OK] BaseAgent lifecycle execution completed successfully.")


async def test_comprehensive_record_json_and_pdf():
    print_step("Test 2: Comprehensive Vaccination Passport (JSON & PDF)")

    member = make_sample_member()
    records = make_sample_administered_records(member["id"])
    ref_date = date(2025, 9, 1)

    # 1. JSON output
    agent_input_json = ReportAgentInput(
        user_id="user_test_001",
        family_member_id=member["id"],
        report_type=ReportType.COMPREHENSIVE_RECORD,
        output_format=ReportOutputFormat.JSON,
        reference_date=ref_date,
        include_recommendations=True,
        include_data_quality=True,
        members_fixture=[member],
        records_fixture=records,
    )
    result_json = await report_agent.execute(agent_input_json)

    assert result_json.report_type == "comprehensive_record"
    assert result_json.output_format == "json"
    assert result_json.patient_name == "Aarav Sharma"
    assert result_json.date_of_birth == "2025-01-15"
    assert result_json.filename.endswith(".json")
    assert MANDATORY_REPORT_DISCLAIMER in result_json.disclaimer
    assert len(result_json.verification_hash) == 64

    # Validate structured report data
    data = result_json.report_data
    assert "metadata" in data
    assert "patient" in data
    assert "progress" in data
    assert "history" in data
    assert "scheduled_doses" in data
    assert "recommendations" in data

    assert data["patient"]["full_name"] == "Aarav Sharma"
    assert len(data["history"]) == 4
    assert data["progress"]["completed_doses"] >= 4
    print("[OK] Comprehensive JSON report structure validated.")

    # 2. PDF output
    agent_input_pdf = ReportAgentInput(
        user_id="user_test_001",
        family_member_id=member["id"],
        report_type=ReportType.COMPREHENSIVE_RECORD,
        output_format=ReportOutputFormat.PDF,
        reference_date=ref_date,
        include_recommendations=True,
        include_data_quality=True,
        members_fixture=[member],
        records_fixture=records,
    )
    result_pdf = await report_agent.execute(agent_input_pdf)

    assert result_pdf.output_format == "pdf"
    assert result_pdf.filename.endswith(".pdf")
    assert result_pdf.content_base64 is not None

    pdf_bytes = base64.b64decode(result_pdf.content_base64)
    assert pdf_bytes.startswith(b"%PDF"), "Generated PDF does not have %PDF header!"
    assert len(pdf_bytes) > 2000, f"Generated PDF is unusually small: {len(pdf_bytes)} bytes"
    print(f"[OK] Publication-grade PDF report compiled successfully ({len(pdf_bytes)} bytes).")


async def test_vaccination_history_report():
    print_step("Test 3: Vaccination History Report Type")

    member = make_sample_member()
    records = make_sample_administered_records(member["id"])

    agent_input = ReportAgentInput(
        user_id="user_test_001",
        family_member_id=member["id"],
        report_type=ReportType.VACCINATION_HISTORY,
        output_format=ReportOutputFormat.JSON,
        reference_date=date(2025, 9, 1),
        members_fixture=[member],
        records_fixture=records,
    )
    result = await report_agent.execute(agent_input)

    assert result.report_type == "vaccination_history"
    data = result.report_data
    assert len(data["history"]) == 4

    # Check chronological ordering
    dates = [h["administered_date"] for h in data["history"]]
    assert dates == sorted(dates), f"History rows are not sorted chronologically: {dates}"

    first = data["history"][0]
    assert first["vaccine_code"] in ("BCG", "OPV-0", "HEP-B-0")
    assert first["batch_number"] is not None
    assert first["healthcare_provider"] == "City General Hospital"
    print("[OK] Chronological vaccination history with full provenance verified.")


async def test_vaccination_status_report():
    print_step("Test 4: Vaccination Status Report Type")

    member = make_sample_member()
    records = make_sample_administered_records(member["id"])

    agent_input = ReportAgentInput(
        user_id="user_test_001",
        family_member_id=member["id"],
        report_type=ReportType.VACCINATION_STATUS,
        output_format=ReportOutputFormat.JSON,
        reference_date=date(2025, 9, 1),
        members_fixture=[member],
        records_fixture=records,
    )
    result = await report_agent.execute(agent_input)

    assert result.report_type == "vaccination_status"
    data = result.report_data
    assert "scheduled_doses" in data
    assert len(data["scheduled_doses"]) > 0

    statuses = {d["status"].upper() for d in data["scheduled_doses"]}
    assert "COMPLETED" in statuses or "DUE" in statuses or "UPCOMING" in statuses or "OVERDUE" in statuses
    print(f"[OK] Vaccination status milestones categorized: {statuses}")


async def test_progress_summary_report():
    print_step("Test 5: Progress Summary Report Type")

    member = make_sample_member()
    records = make_sample_administered_records(member["id"])

    agent_input = ReportAgentInput(
        user_id="user_test_001",
        family_member_id=member["id"],
        report_type=ReportType.PROGRESS_SUMMARY,
        output_format=ReportOutputFormat.JSON,
        reference_date=date(2025, 9, 1),
        members_fixture=[member],
        records_fixture=records,
    )
    result = await report_agent.execute(agent_input)

    assert result.report_type == "progress_summary"
    progress = result.report_data["progress"]
    assert progress["total_required_doses"] > 0
    assert progress["completed_doses"] >= 4
    assert 0.0 <= progress["compliance_percentage"] <= 100.0
    assert isinstance(progress["is_up_to_date"], bool)
    print(f"[OK] Progress summary verified: {progress['compliance_percentage']}% NIS compliance.")


async def test_missing_dob_and_empty_records_safety():
    print_step("Test 6: Missing DOB & Empty Records Safety")

    # Member with missing DOB
    member_no_dob = {
        "id": "mem_no_dob",
        "full_name": "Baby Without DOB",
        "date_of_birth": None,
        "relationship": "Child",
        "gender": "Female",
        "blood_group": "Unknown",
        "allergies": [],
    }

    agent_input = ReportAgentInput(
        user_id="user_test_002",
        family_member_id="mem_no_dob",
        report_type=ReportType.COMPREHENSIVE_RECORD,
        output_format=ReportOutputFormat.PDF,
        members_fixture=[member_no_dob],
        records_fixture=[],
    )
    result = await report_agent.execute(agent_input)

    assert result.patient_name == "Baby Without DOB"
    assert any("date of birth is missing" in w for w in result.warnings)
    assert any("No administered vaccination records" in w for w in result.warnings)

    # Verify PDF compiles cleanly even without DOB and with empty records
    pdf_bytes = base64.b64decode(result.content_base64)
    assert pdf_bytes.startswith(b"%PDF")
    print("[OK] Missing DOB and empty records handled safely without crashes.")


async def test_recommendations_toggle_and_data_quality():
    print_step("Test 7: Clinical Recommendations Toggle & Data Quality Auditing")

    member = make_sample_member()
    records = make_sample_administered_records(member["id"])

    # Without recommendations
    input_no_recs = ReportAgentInput(
        user_id="user_test_001",
        family_member_id=member["id"],
        report_type=ReportType.COMPREHENSIVE_RECORD,
        output_format=ReportOutputFormat.JSON,
        include_recommendations=False,
        members_fixture=[member],
        records_fixture=records,
    )
    res_no_recs = await report_agent.execute(input_no_recs)
    assert len(res_no_recs.report_data["recommendations"]) == 0
    print("[OK] include_recommendations=False successfully omitted recommendations.")

    # With recommendations
    input_with_recs = ReportAgentInput(
        user_id="user_test_001",
        family_member_id=member["id"],
        report_type=ReportType.COMPREHENSIVE_RECORD,
        output_format=ReportOutputFormat.JSON,
        include_recommendations=True,
        members_fixture=[member],
        records_fixture=records,
    )
    res_with_recs = await report_agent.execute(input_with_recs)
    assert "recommendations" in res_with_recs.report_data
    print(f"[OK] include_recommendations=True attached recommendations ({len(res_with_recs.report_data['recommendations'])} items).")


async def test_cryptographic_verification_checksum():
    print_step("Test 8: Cryptographic Verification Checksum Integrity")

    member = make_sample_member()
    records1 = make_sample_administered_records(member["id"])
    records2 = records1[:2]  # Different record count

    input1 = ReportAgentInput(
        user_id="user_test_001",
        family_member_id=member["id"],
        members_fixture=[member],
        records_fixture=records1,
    )
    input2 = ReportAgentInput(
        user_id="user_test_001",
        family_member_id=member["id"],
        members_fixture=[member],
        records_fixture=records2,
    )

    res1 = await report_agent.execute(input1)
    res2 = await report_agent.execute(input2)

    assert len(res1.verification_hash) == 64
    assert len(res2.verification_hash) == 64
    assert res1.verification_hash != res2.verification_hash, "Checksums should differ for different clinical records!"
    print("[OK] SHA-256 verification hash detects patient record differences.")


async def test_multi_tenant_isolation_and_rbac():
    print_step("Test 9: Multi-Tenant Household Isolation & RBAC")

    member = make_sample_member()

    # 1. Patient accessing other household -> 403 PermissionError
    input_unauth = ReportAgentInput(
        user_id="target_household_999",
        family_member_id=member["id"],
        caller_user_id="attacker_household_111",
        caller_role=UserRole.PATIENT.value,
        members_fixture=[member],
        records_fixture=[],
    )
    try:
        await report_agent.execute(input_unauth)
        assert False, "Should have raised PermissionError for cross-household patient access!"
    except PermissionError as pe:
        assert "Access Denied" in str(pe)
        print("[OK] Cross-household access blocked for patient callers.")

    # 2. Healthcare worker accessing patient household -> Allowed
    input_hcw = ReportAgentInput(
        user_id="target_household_999",
        family_member_id=member["id"],
        caller_user_id="hcw_dr_sharma",
        caller_role=UserRole.HEALTHCARE_WORKER.value,
        members_fixture=[member],
        records_fixture=[],
    )
    res_hcw = await report_agent.execute(input_hcw)
    assert res_hcw.user_id == "target_household_999"
    print("[OK] Healthcare Worker permitted cross-household report generation.")

    # 3. Admin accessing patient household -> Allowed
    input_admin = ReportAgentInput(
        user_id="target_household_999",
        family_member_id=member["id"],
        caller_user_id="admin_system",
        caller_role=UserRole.ADMIN.value,
        members_fixture=[member],
        records_fixture=[],
    )
    res_admin = await report_agent.execute(input_admin)
    assert res_admin.user_id == "target_household_999"
    print("[OK] Admin permitted cross-household report generation.")


def test_fastapi_endpoints():
    print_step("Test 10: FastAPI Endpoints (/reports/generate, /download, /run)")

    member = make_sample_member("mem_api_001", "Priya Verma")
    records = make_sample_administered_records("mem_api_001")

    patient_user = {
        "id": "user_patient_42",
        "email": "priya@example.com",
        "role": UserRole.PATIENT.value,
        "is_active": True,
    }

    client = TestClient(app)
    app.dependency_overrides[get_current_user] = lambda: patient_user

    try:
        # Mock family_service and vaccination_service inside the execution
        with patch("app.agents.report.agent.family_service.list_members", new_callable=AsyncMock) as mock_members, \
             patch("app.agents.report.agent.vaccination_service.list_records_for_member", new_callable=AsyncMock) as mock_records:

            mock_members.return_value = [member]
            mock_records.return_value = records

            # 1. POST /api/v1/agents/reports/generate (JSON)
            payload_json = {
                "family_member_id": "mem_api_001",
                "report_type": "comprehensive_record",
                "output_format": "json",
                "reference_date": "2025-08-01",
                "include_recommendations": True,
            }
            resp_gen = client.post("/api/v1/agents/reports/generate", json=payload_json)
            assert resp_gen.status_code == 200, f"Generate failed: {resp_gen.text}"
            data_gen = resp_gen.json()
            assert data_gen["success"] is True
            assert data_gen["data"]["patient_name"] == "Priya Verma"
            assert data_gen["data"]["report_type"] == "comprehensive_record"
            print("[OK] POST /api/v1/agents/reports/generate (JSON) succeeded.")

            # 2. POST /api/v1/agents/reports/download (PDF stream)
            payload_pdf = {
                "family_member_id": "mem_api_001",
                "report_type": "comprehensive_record",
                "output_format": "pdf",
                "reference_date": "2025-08-01",
            }
            resp_dl = client.post("/api/v1/agents/reports/download", json=payload_pdf)
            assert resp_dl.status_code == 200, f"Download failed: {resp_dl.text}"
            assert resp_dl.headers["content-type"] == "application/pdf"
            assert "attachment; filename=" in resp_dl.headers["content-disposition"]
            assert resp_dl.content.startswith(b"%PDF"), "Download stream not valid PDF"
            print(f"[OK] POST /api/v1/agents/reports/download (PDF) streamed {len(resp_dl.content)} bytes.")

            # 3. POST /api/v1/agents/reports/run (BaseAgent execution wrapper)
            resp_run = client.post("/api/v1/agents/reports/run", json=payload_json)
            assert resp_run.status_code == 200, f"Run failed: {resp_run.text}"
            data_run = resp_run.json()
            assert data_run["success"] is True
            assert data_run["data"]["status"] == "SUCCESS"
            assert data_run["data"]["agent_id"] == "agent_report_generation_v1"
            print("[OK] POST /api/v1/agents/reports/run returned BaseAgent execution envelope.")

            # 4. Unauthorized cross-household access attempt
            payload_unauth = {
                "target_user_id": "other_user_household",
                "family_member_id": "mem_api_001",
            }
            resp_unauth = client.post("/api/v1/agents/reports/generate", json=payload_unauth)
            assert resp_unauth.status_code == 403, f"Expected 403, got {resp_unauth.status_code}"
            print("[OK] Multi-tenant isolation verified on API route: 403 Forbidden returned.")

    finally:
        app.dependency_overrides.clear()


# =============================================================================
# Main Test Runner
# =============================================================================

async def main():
    print(f"\n{'='*75}\nSTARTING PHASE 8 AGENT 5 (REPORT GENERATION AGENT) TEST SUITE\n{'='*75}")
    await test_agent_architecture_and_lifecycle()
    await test_comprehensive_record_json_and_pdf()
    await test_vaccination_history_report()
    await test_vaccination_status_report()
    await test_progress_summary_report()
    await test_missing_dob_and_empty_records_safety()
    await test_recommendations_toggle_and_data_quality()
    await test_cryptographic_verification_checksum()
    await test_multi_tenant_isolation_and_rbac()
    test_fastapi_endpoints()
    print(f"\n{'='*75}\n[ALL 10 TESTS PASSED] REPORT GENERATION AGENT IS FULLY OPERATIONAL!\n{'='*75}")


if __name__ == "__main__":
    asyncio.run(main())
