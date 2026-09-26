"""
Comprehensive Test Suite for Phase 8:
AGENT 4 OF 5: RECOMMENDATION AGENT IMPLEMENTATION.

Validates:
A. Agent Architecture & BaseAgent Lifecycle
B. Deterministic Recommendation Generation (Overdue, Due, Upcoming)
C. Catch-Up Pathway Guidance & Schedule Engine Integrity
D. Clinical Review, Missing DOB & Data Quality Remediation
E. Optional Private Vaccines & Age-Gated Advisories
F. Patient Allergy Screening & Pediatric Discussion Points
G. Knowledge / RAG Agent Integration & Citation Preservation
H. Multi-Tenant Household Isolation & RBAC Authorization
I. API Endpoints via FastAPI TestClient (/recommendations/evaluate, /query, /run)
"""
import sys
import asyncio
from datetime import date, datetime, timedelta
from typing import List, Dict, Any
from unittest.mock import AsyncMock, patch, MagicMock

from app.main import app
from app.agents.base import BaseAgent, AgentStatus, AgentExecutionResult
from app.agents.architecture import FIVE_AGENT_ARCHITECTURE
from app.agents.recommendation import (
    recommendation_agent,
    RecommendationAgent,
    RecommendationAgentInput,
    RecommendationAgentResult,
    RecommendationItem,
    RecommendationPriority,
    RecommendationCategory,
    CatchUpPathwayItem,
    OptionalVaccineGuidance,
    MemberRecommendation,
    RECOMMENDATION_CLINICAL_DISCLAIMER,
)
from app.agents.monitoring.schemas import (
    MonitoringAgentResult,
    MemberMonitoringAssessment,
    DoseAssessmentItem,
    ActionableMonitoringEvent,
    DataQualityIssue,
)
from app.agents.knowledge.schemas import (
    KnowledgeAgentResult,
    KnowledgeSourceCitation,
)
from app.models.vaccination import VaccinationStatus
from app.models.user import UserRole
from app.models.notification import NotificationPriority
from app.api.deps import get_current_user


def print_step(title: str):
    print(f"\n{'='*75}\n[TEST RECOMMENDATION AGENT] {title}\n{'='*75}")


# =============================================================================
# Helper Fixtures
# =============================================================================
def make_mock_dose(
    rule_code: str,
    vaccine_code: str,
    dose_number: int,
    dose_name: str,
    vaccine_name: str,
    target_disease: str,
    recommended_age_display: str,
    due_date: date,
    status: VaccinationStatus,
    status_reason: str = "Standard routine milestone.",
) -> DoseAssessmentItem:
    return DoseAssessmentItem(
        rule_code=rule_code,
        vaccine_code=vaccine_code,
        dose_number=dose_number,
        dose_name=dose_name,
        vaccine_name=vaccine_name,
        target_disease=target_disease,
        category="UNIVERSAL_NIS",
        recommended_age_display=recommended_age_display,
        recommended_date=due_date,
        calculated_due_date=due_date,
        status=status,
        status_reason=status_reason,
        priority=NotificationPriority.HIGH if status in (VaccinationStatus.OVERDUE, VaccinationStatus.CATCH_UP_REQUIRED) else NotificationPriority.MEDIUM,
    )


# =============================================================================
# A. Agent Architecture & BaseAgent Lifecycle
# =============================================================================
def test_recommendation_agent_architecture():
    print_step("A. Agent Architecture & BaseAgent Lifecycle")

    assert isinstance(recommendation_agent, BaseAgent)
    assert recommendation_agent.agent_id == "agent_recommendation_v1"
    assert recommendation_agent.name == "Recommendation Agent"
    assert recommendation_agent.version == "1.0.0"

    metadata = recommendation_agent.metadata
    assert metadata.agent_id == "agent_recommendation_v1"
    assert "recommendation" in metadata.description.lower() or "catch-up" in metadata.description.lower()

    # Architecture registry
    assert "recommendation_agent" in FIVE_AGENT_ARCHITECTURE
    spec = FIVE_AGENT_ARCHITECTURE["recommendation_agent"]
    assert spec["agent_id"] == "agent_recommendation_v1"
    assert "Monitoring Agent" in str(spec["upstream_dependencies"])
    assert "Knowledge / RAG Agent" in str(spec["upstream_dependencies"])

    print("  [OK] Recommendation Agent implements BaseAgent and matches architecture registry.")
    print("PASS: Agent Architecture validated.")


# =============================================================================
# B. Deterministic Recommendation Generation (Overdue, Due, Upcoming)
# =============================================================================
def test_overdue_and_due_recommendations():
    print_step("B. Deterministic Recommendation Generation (Overdue, Due, Upcoming)")

    ref_date = date(2026, 9, 26)
    m_id = "mem_infant_001"
    dob = date(2026, 7, 18)  # ~10 weeks old

    # Dose 1: Pentavalent-1 is OVERDUE (was due at 6 weeks: Aug 29, 2026)
    overdue_dose = make_mock_dose(
        rule_code="PENTA_1",
        vaccine_code="PENTA",
        dose_number=1,
        dose_name="Dose 1",
        vaccine_name="Pentavalent (DPT-HepB-Hib)",
        target_disease="Diphtheria, Pertussis, Tetanus, HepB, Hib",
        recommended_age_display="6 Weeks",
        due_date=date(2026, 8, 29),
        status=VaccinationStatus.OVERDUE,
        status_reason="Vaccination is overdue past the recommended 6 weeks milestone.",
    )

    # Dose 2: Pentavalent-2 is DUE (due at 10 weeks: Sep 26, 2026)
    due_dose = make_mock_dose(
        rule_code="PENTA_2",
        vaccine_code="PENTA",
        dose_number=2,
        dose_name="Dose 2",
        vaccine_name="Pentavalent (DPT-HepB-Hib)",
        target_disease="Diphtheria, Pertussis, Tetanus, HepB, Hib",
        recommended_age_display="10 Weeks",
        due_date=date(2026, 9, 26),
        status=VaccinationStatus.DUE,
        status_reason="Vaccination is currently due today.",
    )

    # Dose 3: Pentavalent-3 is UPCOMING (due at 14 weeks: Oct 24, 2026)
    upcoming_dose = make_mock_dose(
        rule_code="PENTA_3",
        vaccine_code="PENTA",
        dose_number=3,
        dose_name="Dose 3",
        vaccine_name="Pentavalent (DPT-HepB-Hib)",
        target_disease="Diphtheria, Pertussis, Tetanus, HepB, Hib",
        recommended_age_display="14 Weeks",
        due_date=date(2026, 10, 24),
        status=VaccinationStatus.UPCOMING,
        status_reason="Upcoming routine dose.",
    )

    mock_assessment = MemberMonitoringAssessment(
        member_id=m_id,
        full_name="Baby Ananya",
        date_of_birth=dob,
        age_days=70,
        age_display="2 mo 10 d",
        categorized_doses={
            VaccinationStatus.OVERDUE.value: [overdue_dose],
            VaccinationStatus.DUE.value: [due_dose],
            VaccinationStatus.UPCOMING.value: [upcoming_dose],
        },
    )

    mock_mon_result = MonitoringAgentResult(
        agent_id="agent_monitoring_v1",
        evaluated_users_count=1,
        evaluated_members_count=1,
        member_assessments=[mock_assessment],
    )

    mock_members = [{
        "id": m_id,
        "full_name": "Baby Ananya",
        "date_of_birth": dob.isoformat(),
        "allergies": [],
        "notes": None,
    }]

    input_data = RecommendationAgentInput(
        user_id="user_test_001",
        family_member_id=m_id,
        reference_date=ref_date,
        include_optional_vaccines=False,
    )

    result: RecommendationAgentResult = asyncio.run(
        recommendation_agent.execute(
            input_data=input_data,
            members_fixture=mock_members,
            monitoring_result_fixture=mock_mon_result,
        )
    )

    assert result.evaluated_members_count == 1
    assert len(result.member_recommendations) == 1
    m_rec = result.member_recommendations[0]

    # Verify Overdue Recommendation
    overdue_recs = [r for r in m_rec.recommendations if r.category == RecommendationCategory.OVERDUE_INTERVENTION]
    assert len(overdue_recs) == 1
    o_rec = overdue_recs[0]
    assert o_rec.priority == RecommendationPriority.HIGH
    assert o_rec.vaccine_code == "PENTA"
    assert o_rec.dose_number == 1
    assert o_rec.due_date == date(2026, 8, 29)
    assert o_rec.action_type == "SCHEDULE_CLINIC_VISIT"
    assert o_rec.is_deterministic is True
    assert "Diphtheria" in o_rec.clinical_rationale

    # Verify Due Recommendation
    due_recs = [r for r in m_rec.recommendations if r.category == RecommendationCategory.DUE_ACTION]
    assert len(due_recs) == 1
    d_rec = due_recs[0]
    assert d_rec.priority == RecommendationPriority.MEDIUM
    assert d_rec.vaccine_code == "PENTA"
    assert d_rec.dose_number == 2
    assert d_rec.due_date == date(2026, 9, 26)

    # Verify Discussion Points
    assert len(m_rec.pediatric_discussion_points) >= 2
    assert any("overdue" in dp.lower() for dp in m_rec.pediatric_discussion_points)

    print("  [OK] Overdue and Due recommendations generated accurately with deterministic due dates.")
    print("PASS: Deterministic recommendation generation verified.")


# =============================================================================
# C. Catch-Up Pathway Guidance & Schedule Engine Integrity
# =============================================================================
def test_catch_up_pathway_guidance():
    print_step("C. Catch-Up Pathway Guidance & Schedule Engine Integrity")

    ref_date = date(2026, 9, 26)
    m_id = "mem_toddler_002"
    dob = date(2025, 6, 1)  # ~16 months old

    # Catch-Up Doses:
    # Pentavalent-1 missed in infancy (dose 1, no prior interval)
    catch_up_dose_1 = make_mock_dose(
        rule_code="PENTA_1",
        vaccine_code="PENTA",
        dose_number=1,
        dose_name="Dose 1",
        vaccine_name="Pentavalent (DPT-HepB-Hib)",
        target_disease="Diphtheria, Pertussis, Tetanus, HepB, Hib",
        recommended_age_display="6 Weeks",
        due_date=date(2025, 7, 13),
        status=VaccinationStatus.CATCH_UP_REQUIRED,
        status_reason="Infant missed routine milestone. Child is eligible for catch-up vaccination up to 1 year for Hib / 7 years for DPT.",
    )
    # Pentavalent-2 delayed (dose 2, 28-day minimum interval from dose 1)
    catch_up_dose_2 = make_mock_dose(
        rule_code="PENTA_2",
        vaccine_code="PENTA",
        dose_number=2,
        dose_name="Dose 2",
        vaccine_name="Pentavalent (DPT-HepB-Hib)",
        target_disease="Diphtheria, Pertussis, Tetanus, HepB, Hib",
        recommended_age_display="10 Weeks",
        due_date=date(2025, 8, 10),
        status=VaccinationStatus.CATCH_UP_REQUIRED,
        status_reason="Delayed second dose. Minimum 28-day interval required after dose 1.",
    )

    mock_assessment = MemberMonitoringAssessment(
        member_id=m_id,
        full_name="Toddler Rohan",
        date_of_birth=dob,
        age_days=482,
        age_display="1 yr 3 mo",
        categorized_doses={
            VaccinationStatus.CATCH_UP_REQUIRED.value: [catch_up_dose_1, catch_up_dose_2],
        },
    )

    mock_mon_result = MonitoringAgentResult(
        agent_id="agent_monitoring_v1",
        evaluated_users_count=1,
        evaluated_members_count=1,
        member_assessments=[mock_assessment],
    )

    mock_members = [{
        "id": m_id,
        "full_name": "Toddler Rohan",
        "date_of_birth": dob.isoformat(),
        "allergies": [],
        "notes": None,
    }]

    input_data = RecommendationAgentInput(
        user_id="user_test_catchup",
        family_member_id=m_id,
        reference_date=ref_date,
        include_optional_vaccines=False,
    )

    result: RecommendationAgentResult = asyncio.run(
        recommendation_agent.execute(
            input_data=input_data,
            members_fixture=mock_members,
            monitoring_result_fixture=mock_mon_result,
        )
    )

    m_rec = result.member_recommendations[0]
    cu_recs = [r for r in m_rec.recommendations if r.category == RecommendationCategory.CATCH_UP_PATHWAY]
    assert len(cu_recs) == 2
    rec = cu_recs[0]
    assert rec.priority == RecommendationPriority.HIGH
    assert rec.action_type == "CONSULT_PEDIATRICIAN"
    assert rec.vaccine_code == "PENTA"
    assert "catch-up" in rec.description.lower()

    # Verify itemized Catch-Up Pathways
    assert len(m_rec.catch_up_pathways) == 2
    cu_item_1: CatchUpPathwayItem = m_rec.catch_up_pathways[0]
    cu_item_2: CatchUpPathwayItem = m_rec.catch_up_pathways[1]
    assert cu_item_1.vaccine_code == "PENTA"
    assert cu_item_1.minimum_interval_days is None  # Dose 1 has no previous dose interval
    assert cu_item_2.minimum_interval_days == 28   # Dose 2 has 28-day minimum interval from catalog
    assert "7 years" in str(cu_item_1.age_limit_notes) or "UIP" in str(cu_item_1.age_limit_notes)

    print("  [OK] Catch-up pathway correctly synthesized: 28-day minimum interval and age limits captured.")
    print("PASS: Catch-Up Pathway Guidance verified.")


# =============================================================================
# D. Clinical Review, Missing DOB & Data Quality Remediation
# =============================================================================
def test_clinical_review_and_data_quality():
    print_step("D. Clinical Review, Missing DOB & Data Quality Remediation")

    ref_date = date(2026, 9, 26)

    # 1. Member with Clinical Review (BCG unadministered past 1 year of age)
    m1_id = "mem_review_001"
    dob1 = date(2025, 1, 1)  # ~20 months old (> 1 year limit)

    bcg_review_dose = make_mock_dose(
        rule_code="BCG",
        vaccine_code="BCG",
        dose_number=1,
        dose_name="Birth Dose",
        vaccine_name="BCG",
        target_disease="Tuberculosis (TB)",
        recommended_age_display="At Birth",
        due_date=date(2025, 1, 1),
        status=VaccinationStatus.CLINICAL_REVIEW,
        status_reason="Child is past 1 year of age. Under NTEP/MoHFW guidelines, Mantoux test is required prior to considering BCG.",
    )

    assessment1 = MemberMonitoringAssessment(
        member_id=m1_id,
        full_name="Child Kabir",
        date_of_birth=dob1,
        age_days=633,
        age_display="1 yr 8 mo",
        categorized_doses={
            VaccinationStatus.CLINICAL_REVIEW.value: [bcg_review_dose],
        },
    )

    # 2. Member with Missing DOB
    m2_id = "mem_nodob_002"
    dq_issue = DataQualityIssue(
        family_member_id=m2_id,
        member_name="Child Without DOB",
        issue_type="MISSING_DOB",
        severity="ERROR",
        description="Date of birth is missing. Cannot calculate vaccination schedule.",
        suggested_action="Please provide a valid date of birth.",
    )
    assessment2 = MemberMonitoringAssessment(
        member_id=m2_id,
        full_name="Child Without DOB",
        date_of_birth=None,
        age_display="Unknown",
        data_quality_issues=[dq_issue],
    )

    mock_mon_result = MonitoringAgentResult(
        agent_id="agent_monitoring_v1",
        evaluated_users_count=1,
        evaluated_members_count=2,
        member_assessments=[assessment1, assessment2],
    )

    mock_members = [
        {"id": m1_id, "full_name": "Child Kabir", "date_of_birth": dob1.isoformat(), "allergies": []},
        {"id": m2_id, "full_name": "Child Without DOB", "date_of_birth": None, "allergies": []},
    ]

    input_data = RecommendationAgentInput(
        user_id="user_test_review",
        reference_date=ref_date,
        include_optional_vaccines=False,
    )

    result = asyncio.run(
        recommendation_agent.execute(
            input_data=input_data,
            members_fixture=mock_members,
            monitoring_result_fixture=mock_mon_result,
        )
    )

    assert result.evaluated_members_count == 2

    # Verify Member 1: Clinical Review
    rec1 = result.member_recommendations[0]
    review_recs = [r for r in rec1.recommendations if r.category == RecommendationCategory.CLINICAL_REVIEW]
    assert len(review_recs) == 1
    assert review_recs[0].priority == RecommendationPriority.HIGH
    assert review_recs[0].action_type == "CLINICAL_EVALUATION"
    assert "Mantoux" in review_recs[0].description or "pediatric" in review_recs[0].description

    # Verify Member 2: Data Remediation for missing DOB
    rec2 = result.member_recommendations[1]
    dq_recs = [r for r in rec2.recommendations if r.category == RecommendationCategory.DATA_REMEDIATION]
    assert len(dq_recs) == 1
    assert dq_recs[0].priority == RecommendationPriority.HIGH
    assert dq_recs[0].action_type == "UPDATE_RECORD"
    assert any("Date of Birth is missing" in w for w in rec2.warnings)

    print("  [OK] Clinical review and missing DOB data quality remediations generated properly.")
    print("PASS: Clinical Review and Data Quality verified.")


# =============================================================================
# E. Optional Private Vaccines & Age-Gated Advisories
# =============================================================================
def test_optional_vaccine_advisories():
    print_step("E. Optional Private Vaccines & Age-Gated Advisories")

    ref_date = date(2026, 9, 26)

    # Adolescent patient: 11 years old
    m_id = "mem_adolescent_001"
    dob = date(2015, 5, 10)  # ~11 years old (4156 days)

    assessment = MemberMonitoringAssessment(
        member_id=m_id,
        full_name="Pooja Sharma",
        date_of_birth=dob,
        age_days=4156,
        age_display="11 yr 4 mo",
        categorized_doses={},  # Routine UIP complete
    )

    mock_mon_result = MonitoringAgentResult(
        agent_id="agent_monitoring_v1",
        evaluated_users_count=1,
        evaluated_members_count=1,
        member_assessments=[assessment],
    )

    mock_members = [{
        "id": m_id,
        "full_name": "Pooja Sharma",
        "date_of_birth": dob.isoformat(),
        "allergies": [],
    }]

    input_data = RecommendationAgentInput(
        user_id="user_test_optional",
        family_member_id=m_id,
        reference_date=ref_date,
        include_optional_vaccines=True,
    )

    result = asyncio.run(
        recommendation_agent.execute(
            input_data=input_data,
            members_fixture=mock_members,
            monitoring_result_fixture=mock_mon_result,
        )
    )

    rec = result.member_recommendations[0]
    opt_advisories = rec.optional_vaccine_advisories
    assert len(opt_advisories) >= 1

    # For an 11-year-old, HPV must be recommended
    hpv_adv = [a for a in opt_advisories if a.vaccine_code == "HPV"]
    assert len(hpv_adv) == 1, "HPV must be advised for 11-year-old adolescent"
    assert "9–14 Years" in hpv_adv[0].recommended_age_range or "9" in hpv_adv[0].recommended_age_range
    assert "Cervical" in hpv_adv[0].target_disease or "HPV" in hpv_adv[0].target_disease

    # Check corresponding RecommendationItem
    hpv_recs = [r for r in rec.recommendations if r.vaccine_code == "HPV"]
    assert len(hpv_recs) == 1
    assert hpv_recs[0].priority == RecommendationPriority.INFORMATIONAL
    assert hpv_recs[0].category == RecommendationCategory.OPTIONAL_VACCINE_ADVISORY
    assert hpv_recs[0].is_deterministic is False

    print("  [OK] Adolescent correctly received HPV cancer prevention advisory.")
    print("PASS: Optional private vaccine advisories verified.")


# =============================================================================
# F. Patient Allergy Screening & Pediatric Discussion Points
# =============================================================================
def test_allergy_screening_and_discussion_points():
    print_step("F. Patient Allergy Screening & Pediatric Discussion Points")

    ref_date = date(2026, 9, 26)
    m_id = "mem_allergic_001"
    dob = date(2026, 1, 1)

    assessment = MemberMonitoringAssessment(
        member_id=m_id,
        full_name="Baby Vivaan",
        date_of_birth=dob,
        age_days=268,
        age_display="8 mo 25 d",
        categorized_doses={},
    )

    mock_mon_result = MonitoringAgentResult(
        agent_id="agent_monitoring_v1",
        evaluated_users_count=1,
        evaluated_members_count=1,
        member_assessments=[assessment],
    )

    mock_members = [{
        "id": m_id,
        "full_name": "Baby Vivaan",
        "date_of_birth": dob.isoformat(),
        "allergies": ["Severe Egg Anaphylaxis", "Gelatin"],
    }]

    input_data = RecommendationAgentInput(
        user_id="user_test_allergy",
        family_member_id=m_id,
        reference_date=ref_date,
        include_optional_vaccines=False,
    )

    result = asyncio.run(
        recommendation_agent.execute(
            input_data=input_data,
            members_fixture=mock_members,
            monitoring_result_fixture=mock_mon_result,
        )
    )

    rec = result.member_recommendations[0]
    allergy_recs = [r for r in rec.recommendations if r.action_type == "VERIFY_ALLERGIES"]
    assert len(allergy_recs) == 1
    assert allergy_recs[0].priority == RecommendationPriority.HIGH
    assert "Egg Anaphylaxis" in allergy_recs[0].title
    assert "contraindications" in allergy_recs[0].description.lower()

    # Verify discussion point exists
    assert any("allergies" in dp.lower() for dp in rec.pediatric_discussion_points)

    print("  [OK] Severe allergy alert generated with HIGH clinical priority and discussion point.")
    print("PASS: Allergy screening & discussion points verified.")


# =============================================================================
# G. Knowledge / RAG Agent Integration & Citation Preservation
# =============================================================================
def test_knowledge_agent_integration():
    print_step("G. Knowledge / RAG Agent Integration & Citation Preservation")

    ref_date = date(2026, 9, 26)
    m_id = "mem_rag_int_001"
    dob = date(2025, 8, 1)

    catch_up_dose = make_mock_dose(
        rule_code="MR_1",
        vaccine_code="MR",
        dose_number=1,
        dose_name="Dose 1",
        vaccine_name="Measles-Rubella (MR-1)",
        target_disease="Measles, Rubella",
        recommended_age_display="9–12 Months",
        due_date=date(2026, 5, 1),
        status=VaccinationStatus.CATCH_UP_REQUIRED,
        status_reason="Child missed 9-12 months window; eligible for catch-up up to 5 years.",
    )

    assessment = MemberMonitoringAssessment(
        member_id=m_id,
        full_name="Baby Diya",
        date_of_birth=dob,
        age_days=421,
        age_display="1 yr 1 mo",
        categorized_doses={
            VaccinationStatus.CATCH_UP_REQUIRED.value: [catch_up_dose],
        },
    )

    mock_mon_result = MonitoringAgentResult(
        agent_id="agent_monitoring_v1",
        evaluated_users_count=1,
        evaluated_members_count=1,
        member_assessments=[assessment],
    )

    mock_members = [{
        "id": m_id,
        "full_name": "Baby Diya",
        "date_of_birth": dob.isoformat(),
        "allergies": [],
    }]

    mock_kb_citation = KnowledgeSourceCitation(
        document_id="doc_uip_mr_guidelines",
        document_title="Measles-Rubella Operational Catch-Up Guidelines",
        source_authority="MOHFW",
        page_number=5,
        relevance_score=0.91,
        excerpt="Children who missed MR-1 at 9 months may receive catch-up dose up to 5 years of age.",
    )

    mock_kb_result = KnowledgeAgentResult(
        agent_id="agent_knowledge_rag_v1",
        question="What are the official catch-up guidelines and minimum intervals for Measles-Rubella (MR-1) under UIP?",
        answer="Under UIP guidelines, children missing MR-1 at 9 months can receive catch-up vaccination up to 5 years of age.",
        has_sufficient_context=True,
        confidence_score=0.91,
        sources=[mock_kb_citation],
        disclaimer="Standard medical disclaimer",
    )

    with patch.object(recommendation_agent.knowledge_agent, "execute", new_callable=AsyncMock) as mock_kb:
        mock_kb.return_value = mock_kb_result

        input_data = RecommendationAgentInput(
            user_id="user_test_kb",
            family_member_id=m_id,
            reference_date=ref_date,
            query_knowledge_base=True,
            include_optional_vaccines=False,
        )

        result = asyncio.run(
            recommendation_agent.execute(
                input_data=input_data,
                members_fixture=mock_members,
                monitoring_result_fixture=mock_mon_result,
            )
        )

        rec = result.member_recommendations[0]
        cu_recs = [r for r in rec.recommendations if r.category == RecommendationCategory.CATCH_UP_PATHWAY]
        assert len(cu_recs) == 1
        mr_rec = cu_recs[0]
        assert len(mr_rec.supporting_citations) == 1
        assert mr_rec.supporting_citations[0].document_title == "Measles-Rubella Operational Catch-Up Guidelines"
        assert mr_rec.supporting_citations[0].source_authority == "MOHFW"
        assert mr_rec.supporting_citations[0].relevance_score == 0.91

        print("  [OK] Knowledge Agent queried and official citations preserved in recommendation.")

    # Test Graceful Fallback if Knowledge Agent fails
    with patch.object(recommendation_agent.knowledge_agent, "execute", new_callable=AsyncMock) as mock_kb_fail:
        mock_kb_fail.side_effect = Exception("ChromaDB connection timeout")

        result_fallback = asyncio.run(
            recommendation_agent.execute(
                input_data=input_data,
                members_fixture=mock_members,
                monitoring_result_fixture=mock_mon_result,
            )
        )
        rec_fallback = result_fallback.member_recommendations[0]
        cu_recs_fallback = [r for r in rec_fallback.recommendations if r.category == RecommendationCategory.CATCH_UP_PATHWAY]
        assert len(cu_recs_fallback) == 1
        assert cu_recs_fallback[0].supporting_citations == []
        print("  [OK] Handled Knowledge Agent failure gracefully without crashing deterministic recommendations.")

    print("PASS: Knowledge Agent integration and citation preservation verified.")


# =============================================================================
# H. Multi-Tenant Household Isolation & RBAC Authorization
# =============================================================================
def test_authorization_and_tenant_isolation():
    print_step("H. Multi-Tenant Household Isolation & RBAC Authorization")

    patient_a_id = "patient_user_001"
    patient_b_id = "patient_user_002"
    m_id = "mem_001"

    mock_members = [{"id": m_id, "full_name": "Patient A Child", "date_of_birth": "2026-01-01"}]

    # 1. Patient A requesting Patient B's recommendations -> PermissionError (403)
    input_cross = RecommendationAgentInput(
        user_id=patient_b_id,
        caller_user_id=patient_a_id,
        caller_role=UserRole.PATIENT.value,
    )

    try:
        asyncio.run(recommendation_agent.execute(input_data=input_cross, members_fixture=mock_members))
        assert False, "Should have raised PermissionError on cross-tenant request"
    except PermissionError as pe:
        assert "Access Denied" in str(pe)
        print("  [OK] Blocked cross-tenant access for PATIENT.")

    # 2. Patient requesting non-existent or foreign family member
    input_bad_mem = RecommendationAgentInput(
        user_id=patient_a_id,
        family_member_id="foreign_member_999",
        caller_user_id=patient_a_id,
        caller_role=UserRole.PATIENT.value,
    )

    try:
        asyncio.run(recommendation_agent.execute(input_data=input_bad_mem, members_fixture=mock_members))
        assert False, "Should have raised PermissionError on foreign member access"
    except PermissionError as pe:
        assert "does not belong to your household" in str(pe)
        print("  [OK] Blocked foreign family member access for PATIENT.")

    # 3. Healthcare Worker accessing Patient household -> Authorized
    input_hw = RecommendationAgentInput(
        user_id=patient_a_id,
        family_member_id=m_id,
        caller_user_id="hw_user_123",
        caller_role=UserRole.HEALTHCARE_WORKER.value,
        include_optional_vaccines=False,
    )
    res_hw = asyncio.run(recommendation_agent.execute(
        input_data=input_hw,
        members_fixture=mock_members,
        records_fixture=[],
    ))
    assert res_hw.user_id == patient_a_id
    print("  [OK] HEALTHCARE_WORKER authorized to evaluate patient recommendations.")

    # 4. Admin accessing Patient household -> Authorized
    input_admin = RecommendationAgentInput(
        user_id=patient_a_id,
        family_member_id=m_id,
        caller_user_id="admin_user_456",
        caller_role=UserRole.ADMIN.value,
        include_optional_vaccines=False,
    )
    res_admin = asyncio.run(recommendation_agent.execute(
        input_data=input_admin,
        members_fixture=mock_members,
        records_fixture=[],
    ))
    assert res_admin.user_id == patient_a_id
    print("  [OK] ADMIN authorized to evaluate patient recommendations.")

    print("PASS: Multi-tenant household isolation and RBAC authorization verified.")


# =============================================================================
# I. API Endpoints via FastAPI TestClient
# =============================================================================
def test_api_endpoints():
    print_step("I. API Endpoints via FastAPI TestClient (/recommendations/evaluate, /query, /run)")
    from starlette.testclient import TestClient

    client = TestClient(app)

    # 1. Unauthenticated request -> 401 / 403
    resp_unauth = client.post("/api/v1/agents/recommendations/evaluate", json={})
    assert resp_unauth.status_code in (401, 403), f"Expected 401/403, got {resp_unauth.status_code}"
    print("  [OK] Unauthenticated request to /recommendations/evaluate rejected.")

    # 2. Dependency override for authenticated patient
    patient_id = "patient_api_test_001"
    async def mock_current_patient():
        return {"id": patient_id, "role": UserRole.PATIENT.value, "email": "patient@vaxassist.ai"}

    app.dependency_overrides[get_current_user] = mock_current_patient

    try:
        mock_rec_result = RecommendationAgentResult(
            agent_id="agent_recommendation_v1",
            user_id=patient_id,
            evaluated_members_count=1,
            member_recommendations=[
                MemberRecommendation(
                    member_id="mem_api_01",
                    member_name="Aarav",
                    date_of_birth=date(2026, 1, 1),
                    age_display="8 mo",
                    total_recommendations=1,
                    recommendations=[
                        RecommendationItem(
                            category=RecommendationCategory.DUE_ACTION,
                            priority=RecommendationPriority.MEDIUM,
                            title="Due for Vaccination: Measles-Rubella (MR-1)",
                            description="MR-1 is currently due for Aarav.",
                            clinical_rationale="Timely administration protects against Measles and Rubella.",
                            action_type="SCHEDULE_CLINIC_VISIT",
                            due_date=date(2026, 10, 1),
                        )
                    ],
                    pediatric_discussion_points=["Schedule MR-1 dose."],
                )
            ],
            total_recommendations_count=1,
            recommendations_by_priority={"MEDIUM": 1},
            recommendations_by_category={"DUE_ACTION": 1},
            clinical_disclaimer=RECOMMENDATION_CLINICAL_DISCLAIMER,
            correlation_id="api_corr_123",
            execution_duration_ms=5.2,
        )

        with patch.object(recommendation_agent, "execute", new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = mock_rec_result

            # 3. POST /api/v1/agents/recommendations/evaluate
            resp_eval = client.post(
                "/api/v1/agents/recommendations/evaluate",
                json={"correlation_id": "api_corr_123"},
            )
            assert resp_eval.status_code == 200, f"Expected 200, got {resp_eval.status_code}: {resp_eval.text}"
            body_eval = resp_eval.json()
            assert body_eval["success"] is True
            data_eval = body_eval["data"]
            assert data_eval["agent_id"] == "agent_recommendation_v1"
            assert data_eval["user_id"] == patient_id
            assert data_eval["total_recommendations_count"] == 1
            print("  [OK] POST /api/v1/agents/recommendations/evaluate returned 200 with RecommendationAgentResult.")

            # 4. POST /api/v1/agents/recommendations/query (Alias route)
            resp_query = client.post(
                "/api/v1/agents/recommendations/query",
                json={"correlation_id": "api_corr_123"},
            )
            assert resp_query.status_code == 200
            print("  [OK] POST /api/v1/agents/recommendations/query (alias) returned 200.")

        # 5. POST /api/v1/agents/recommendations/run (BaseAgent lifecycle)
        with patch.object(recommendation_agent, "execute", new_callable=AsyncMock) as mock_exec_run:
            mock_exec_run.return_value = mock_rec_result

            resp_run = client.post(
                "/api/v1/agents/recommendations/run",
                json={"correlation_id": "api_corr_run"},
            )
            assert resp_run.status_code == 200
            body_run = resp_run.json()
            assert body_run["success"] is True
            exec_data = body_run["data"]
            assert exec_data["agent_id"] == "agent_recommendation_v1"
            assert exec_data["status"] == "SUCCESS"
            assert exec_data["execution_id"].startswith("exec_")
            assert exec_data["duration_ms"] >= 0
            assert exec_data["data"]["user_id"] == patient_id
            print("  [OK] POST /api/v1/agents/recommendations/run returned 200 with AgentExecutionResult.")

        # 6. Cross-tenant attempt via API by Patient -> 403 Forbidden
        resp_hack = client.post(
            "/api/v1/agents/recommendations/evaluate",
            json={"target_user_id": "foreign_victim_user_999"},
        )
        assert resp_hack.status_code == 403
        print("  [OK] Blocked cross-tenant access via API endpoint (403 Forbidden).")

    finally:
        app.dependency_overrides.clear()

    print("PASS: API endpoints verified via FastAPI TestClient.")


# =============================================================================
# MAIN RUNNER
# =============================================================================
def run_all_recommendation_tests():
    print("=" * 75)
    print("RUNNING PHASE 8: AGENT 4 (RECOMMENDATION AGENT) TEST SUITE")
    print("=" * 75)

    test_recommendation_agent_architecture()
    test_overdue_and_due_recommendations()
    test_catch_up_pathway_guidance()
    test_clinical_review_and_data_quality()
    test_optional_vaccine_advisories()
    test_allergy_screening_and_discussion_points()
    test_knowledge_agent_integration()
    test_authorization_and_tenant_isolation()
    test_api_endpoints()

    print("\n" + "=" * 75)
    print("ALL RECOMMENDATION AGENT TESTS PASSED SUCCESSFULLY! (9/9)")
    print("=" * 75)


if __name__ == "__main__":
    run_all_recommendation_tests()
