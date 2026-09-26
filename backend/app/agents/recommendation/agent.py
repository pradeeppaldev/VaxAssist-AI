"""
Recommendation Agent Implementation (Phase 8, Agent 4).
Provides personalized, structured, and clinically safe vaccination recommendations
synthesized from the deterministic Monitoring Agent, Schedule Engine, and Knowledge Agent.
Zero schedule calculation or date fabrication.
"""
import time
import logging
from datetime import date, datetime
from typing import Optional, List, Dict, Any, Tuple

from app.agents.base import BaseAgent
from app.agents.recommendation.schemas import (
    RecommendationAgentInput,
    RecommendationAgentResult,
    MemberRecommendation,
    RecommendationItem,
    RecommendationPriority,
    RecommendationCategory,
    CatchUpPathwayItem,
    OptionalVaccineGuidance,
)
from app.agents.monitoring import (
    monitoring_agent,
    MonitoringAgent,
    MonitoringAgentInput,
    MonitoringAgentResult,
    MemberMonitoringAssessment,
    DoseAssessmentItem,
    DataQualityIssue,
)
from app.agents.knowledge import (
    knowledge_agent,
    KnowledgeAgent,
    KnowledgeAgentInput,
)
from app.models.vaccination import VaccinationStatus
from app.models.user import UserRole
from app.services.family_service import family_service, format_doc
from app.services.vaccination_service import vaccination_service
from app.services.schedule_catalog import (
    UNIVERSAL_NIS_SCHEDULE,
    CONDITIONAL_NIS_SCHEDULE,
    PRIVATE_OPTIONAL_SCHEDULE,
)

logger = logging.getLogger("vaxassist.agents.recommendation")

RECOMMENDATION_CLINICAL_DISCLAIMER = (
    "VaxAssist AI recommendations are synthesized from verified deterministic schedule "
    "calculations (MoHFW UIP/NIS) and official clinical guidelines. They serve as advisory "
    "decision support for parents and healthcare workers and do not replace professional "
    "clinical judgment or physical examination by a qualified pediatrician. Patient vaccination "
    "due dates and compliance statuses are computed deterministically by the VaxAssist Schedule Engine."
)

# Static catalog lookup for clinical metadata
ALL_CATALOG_RULES: Dict[str, Dict[str, Any]] = {
    rule["code"]: rule
    for rule in (UNIVERSAL_NIS_SCHEDULE + CONDITIONAL_NIS_SCHEDULE + PRIVATE_OPTIONAL_SCHEDULE)
}


class RecommendationAgent(BaseAgent):
    """
    Agent 4 of 5: Recommendation Agent.
    Personalized clinical advisory and catch-up pathway guide.
    Consumes Monitoring Agent assessments, interprets clinical states,
    formulates actionable recommendations with clear rationales,
    and consults the Knowledge Agent for official citations.
    """

    def __init__(
        self,
        mon_agent: Optional[MonitoringAgent] = None,
        know_agent: Optional[KnowledgeAgent] = None,
    ):
        super().__init__(
            agent_id="agent_recommendation_v1",
            name="Recommendation Agent",
            description=(
                "Synthesizes patient clinical status from the Monitoring Agent with "
                "official guidelines to provide personalized, non-prescriptive vaccination "
                "recommendations, catch-up pathways, and pediatric discussion points."
            ),
            version="1.0.0",
        )
        self.monitoring_agent = mon_agent or monitoring_agent
        self.knowledge_agent = know_agent or knowledge_agent

    def _validate_access(
        self,
        target_user_id: str,
        target_member_id: Optional[str],
        caller_user_id: Optional[str],
        caller_role: Optional[str],
        user_members: List[Dict[str, Any]],
    ) -> None:
        """
        Enforces tenant isolation and role-based access restrictions.
        - Patients can ONLY access their own household.
        - Healthcare workers and Admins are authorized across patients.
        """
        if not caller_user_id:
            return  # System internal invocation

        if caller_role in (UserRole.PATIENT.value, "PATIENT"):
            if caller_user_id != target_user_id:
                raise PermissionError(
                    f"Access Denied: Patient {caller_user_id} cannot request recommendations "
                    f"for household {target_user_id}."
                )

            if target_member_id:
                member_ids = [str(m.get("id") or m.get("_id")) for m in user_members]
                if target_member_id not in member_ids:
                    raise PermissionError(
                        f"Access Denied: Family member {target_member_id} does not belong to your household."
                    )

    async def execute(
        self,
        input_data: Optional[RecommendationAgentInput] = None,
        **kwargs: Any,
    ) -> RecommendationAgentResult:
        """
        Executes the Recommendation Agent:
        1. Validates inputs and RBAC authorization
        2. Retrieves household members and vaccination records
        3. Executes or consumes Monitoring Agent assessments
        4. Synthesizes structured recommendations (Overdue, Due, Catch-Up, Review, Data Quality)
        5. Evaluates optional private vaccines based on age eligibility
        6. Queries Knowledge Agent when guideline citations are requested
        7. Aggregates results and returns RecommendationAgentResult
        """
        start_time = time.perf_counter()

        if input_data is None:
            input_data = RecommendationAgentInput(**kwargs)

        target_user_id = input_data.user_id
        target_member_id = input_data.family_member_id
        ref_date = input_data.reference_date or date.today()
        caller_user_id = input_data.caller_user_id
        caller_role = input_data.caller_role
        include_optional = input_data.include_optional_vaccines
        eligible_for_je = input_data.eligible_for_je
        query_kb = input_data.query_knowledge_base

        # Support in-memory test fixtures passed via kwargs
        fixture_members = kwargs.get("members_fixture")
        fixture_records = kwargs.get("records_fixture")
        fixture_monitoring = kwargs.get("monitoring_result_fixture")

        # 1. Retrieve household members
        if fixture_members is not None:
            members = fixture_members
        else:
            try:
                members = await family_service.list_members(owner_user_id=target_user_id)
            except Exception as exc:
                logger.error(f"Failed to list family members for user {target_user_id}: {exc}")
                members = []

        # 2. Enforce authorization & tenant isolation
        self._validate_access(
            target_user_id=target_user_id,
            target_member_id=target_member_id,
            caller_user_id=caller_user_id,
            caller_role=caller_role,
            user_members=members,
        )

        # Filter to specific member if requested
        if target_member_id:
            members = [m for m in members if str(m.get("id") or m.get("_id")) == str(target_member_id)]

        if not members and fixture_monitoring is None:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return RecommendationAgentResult(
                agent_id=self.agent_id,
                timestamp=datetime.utcnow(),
                user_id=target_user_id,
                evaluated_members_count=0,
                member_recommendations=[],
                total_recommendations_count=0,
                recommendations_by_priority={},
                recommendations_by_category={},
                clinical_disclaimer=RECOMMENDATION_CLINICAL_DISCLAIMER,
                warnings=["No registered family members found in household to evaluate."],
                correlation_id=input_data.correlation_id,
                execution_duration_ms=duration_ms,
            )

        # 3. Obtain Monitoring Agent evaluation
        if fixture_monitoring is not None:
            mon_result: MonitoringAgentResult = fixture_monitoring
        else:
            mon_input = MonitoringAgentInput(
                user_id=target_user_id,
                family_member_id=target_member_id,
                reference_date=ref_date,
                caller_user_id=caller_user_id,
                caller_role=caller_role,
                include_private_optional=include_optional,
                eligible_for_je=eligible_for_je,
                dispatch_notifications=False,
            )
            mon_result = await self.monitoring_agent.execute(
                input_data=mon_input,
                members_fixture=fixture_members,
                records_fixture=fixture_records,
            )

        # Map member records for quick demographic lookup
        members_map: Dict[str, Dict[str, Any]] = {
            str(m.get("id") or m.get("_id")): m for m in members
        }

        # 4. Generate recommendations per member
        member_recommendations: List[MemberRecommendation] = []
        overall_priority_counts: Dict[str, int] = {}
        overall_category_counts: Dict[str, int] = {}
        overall_warnings: List[str] = []

        for assessment in mon_result.member_assessments:
            m_id = assessment.member_id
            m_name = assessment.full_name
            m_doc = members_map.get(m_id, {})
            m_dob = assessment.date_of_birth

            member_recs: List[RecommendationItem] = []
            catch_up_pathways: List[CatchUpPathwayItem] = []
            optional_advisories: List[OptionalVaccineGuidance] = []
            discussion_points: List[str] = []
            member_warnings: List[str] = []

            # --- A. Data Quality Remediation ---
            for dq in assessment.data_quality_issues:
                is_err = (dq.severity in ("ERROR", "CRITICAL"))
                prio = RecommendationPriority.HIGH if is_err else RecommendationPriority.MEDIUM
                member_recs.append(
                    RecommendationItem(
                        category=RecommendationCategory.DATA_REMEDIATION,
                        priority=prio,
                        title=f"Record Discrepancy: {dq.issue_type.replace('_', ' ').title()}",
                        description=dq.suggested_action,
                        clinical_rationale=dq.description,
                        action_type="UPDATE_RECORD",
                        is_deterministic=True,
                    )
                )
                member_warnings.append(f"{dq.issue_type}: {dq.description}")

            # If date of birth is missing, halt further schedule-based recommendations
            if not m_dob:
                member_warnings.append("Recommendation synthesis limited: verified Date of Birth is missing.")
                member_recommendations.append(
                    MemberRecommendation(
                        member_id=m_id,
                        member_name=m_name,
                        date_of_birth=None,
                        age_display=assessment.age_display,
                        total_recommendations=len(member_recs),
                        recommendations=member_recs,
                        catch_up_pathways=[],
                        optional_vaccine_advisories=[],
                        pediatric_discussion_points=["Verify and update official date of birth with healthcare provider."],
                        warnings=member_warnings,
                    )
                )
                continue

            # --- B. Overdue Interventions (HIGH Priority) ---
            overdue_doses = assessment.categorized_doses.get(VaccinationStatus.OVERDUE.value, [])
            for dose in overdue_doses:
                due_str = dose.calculated_due_date.strftime("%b %d, %Y")
                member_recs.append(
                    RecommendationItem(
                        category=RecommendationCategory.OVERDUE_INTERVENTION,
                        priority=RecommendationPriority.HIGH,
                        title=f"Overdue: {dose.vaccine_name} ({dose.dose_name})",
                        description=(
                            f"{m_name} is overdue for {dose.vaccine_name} ({dose.dose_name}), which was "
                            f"due on {due_str}. Arrange an immunization visit as soon as possible."
                        ),
                        clinical_rationale=(
                            f"Delay in {dose.vaccine_name} leaves {m_name} vulnerable to {dose.target_disease}. "
                            f"The routine UIP milestone is {dose.recommended_age_display}."
                        ),
                        vaccine_code=dose.vaccine_code,
                        vaccine_name=dose.vaccine_name,
                        dose_number=dose.dose_number,
                        dose_name=dose.dose_name,
                        due_date=dose.calculated_due_date,
                        action_type="SCHEDULE_CLINIC_VISIT",
                        is_deterministic=True,
                    )
                )
                discussion_points.append(f"When can we schedule the overdue {dose.vaccine_name} ({dose.dose_name}) dose?")

            # --- C. Due Action Items (MEDIUM / HIGH Priority) ---
            due_doses = assessment.categorized_doses.get(VaccinationStatus.DUE.value, [])
            for dose in due_doses:
                due_str = dose.calculated_due_date.strftime("%b %d, %Y")
                member_recs.append(
                    RecommendationItem(
                        category=RecommendationCategory.DUE_ACTION,
                        priority=RecommendationPriority.MEDIUM,
                        title=f"Due Now: {dose.vaccine_name} ({dose.dose_name})",
                        description=(
                            f"{dose.vaccine_name} ({dose.dose_name}) is currently due for {m_name} "
                            f"(milestone: {dose.recommended_age_display}). Schedule a clinic visit."
                        ),
                        clinical_rationale=(
                            f"Timely administration according to the UIP schedule maintains continuous protective "
                            f"immunity against {dose.target_disease}."
                        ),
                        vaccine_code=dose.vaccine_code,
                        vaccine_name=dose.vaccine_name,
                        dose_number=dose.dose_number,
                        dose_name=dose.dose_name,
                        due_date=dose.calculated_due_date,
                        action_type="SCHEDULE_CLINIC_VISIT",
                        is_deterministic=True,
                    )
                )
                discussion_points.append(f"Arrange administration of currently due {dose.vaccine_name} ({dose.dose_name}).")

            # --- D. Near-Term Upcoming Milestones (LOW Priority) ---
            upcoming_doses = assessment.categorized_doses.get(VaccinationStatus.UPCOMING.value, [])
            for dose in upcoming_doses:
                days_away = (dose.calculated_due_date - ref_date).days
                if 0 <= days_away <= 14:
                    due_str = dose.calculated_due_date.strftime("%b %d, %Y")
                    member_recs.append(
                        RecommendationItem(
                            category=RecommendationCategory.UPCOMING_PLANNING,
                            priority=RecommendationPriority.LOW,
                            title=f"Upcoming Milestone: {dose.vaccine_name} ({dose.dose_name})",
                            description=(
                                f"{dose.vaccine_name} ({dose.dose_name}) will be due in {days_away} days "
                                f"on {due_str} ({dose.recommended_age_display})."
                            ),
                            clinical_rationale=f"Routine NIS milestone approaching for {dose.target_disease}.",
                            vaccine_code=dose.vaccine_code,
                            vaccine_name=dose.vaccine_name,
                            dose_number=dose.dose_number,
                            dose_name=dose.dose_name,
                            due_date=dose.calculated_due_date,
                            action_type="PLAN_VISIT",
                            is_deterministic=True,
                        )
                    )

            # --- E. Catch-Up Pathway Guidance (HIGH Priority) ---
            catch_up_doses = assessment.categorized_doses.get(VaccinationStatus.CATCH_UP_REQUIRED.value, [])
            for dose in catch_up_doses:
                cat_rule = ALL_CATALOG_RULES.get(dose.rule_code, {})
                catch_up_guidance = (
                    cat_rule.get("catch_up_notes")
                    or f"Administer catch-up dose according to standard minimum interval guidelines for {dose.vaccine_name}."
                )
                min_interval = cat_rule.get("minimum_interval_days")
                age_limit = cat_rule.get("catch_up_max_age_days")
                age_limit_str = f"Up to {age_limit // 365} years" if age_limit else "Per official UIP guidelines"

                supporting_citations = []
                if query_kb:
                    try:
                        kb_query = f"What are the official catch-up guidelines and minimum intervals for {dose.vaccine_name} under UIP?"
                        kb_resp = await self.knowledge_agent.execute(
                            KnowledgeAgentInput(
                                question=kb_query,
                                authority_filter="MOHFW",
                                correlation_id=input_data.correlation_id,
                            )
                        )
                        if kb_resp and kb_resp.has_sufficient_context and kb_resp.sources:
                            supporting_citations = kb_resp.sources
                    except Exception as kb_err:
                        logger.warning(f"Knowledge Agent query failed during catch-up synthesis: {kb_err}")

                member_recs.append(
                    RecommendationItem(
                        category=RecommendationCategory.CATCH_UP_PATHWAY,
                        priority=RecommendationPriority.HIGH,
                        title=f"Catch-Up Protocol: {dose.vaccine_name} ({dose.dose_name})",
                        description=(
                            f"{dose.vaccine_name} ({dose.dose_name}) was delayed and requires catch-up sequencing. "
                            f"{catch_up_guidance}"
                        ),
                        clinical_rationale=(
                            f"Child remains eligible for catch-up vaccination under national guidelines without restarting "
                            f"the series. Minimum interval rules ({min_interval or 28} days) must be observed."
                        ),
                        vaccine_code=dose.vaccine_code,
                        vaccine_name=dose.vaccine_name,
                        dose_number=dose.dose_number,
                        dose_name=dose.dose_name,
                        due_date=dose.calculated_due_date,
                        action_type="CONSULT_PEDIATRICIAN",
                        is_deterministic=True,
                        supporting_citations=supporting_citations,
                    )
                )

                catch_up_pathways.append(
                    CatchUpPathwayItem(
                        vaccine_code=dose.vaccine_code,
                        vaccine_name=dose.vaccine_name,
                        current_status=VaccinationStatus.CATCH_UP_REQUIRED.value,
                        catch_up_guidance=catch_up_guidance,
                        minimum_interval_days=min_interval,
                        age_limit_notes=age_limit_str,
                        official_protocol_citation="MoHFW National Immunization Schedule Guidelines",
                    )
                )
                discussion_points.append(
                    f"What is the recommended catch-up interval and schedule for delayed {dose.vaccine_name}?"
                )

            # --- F. Clinical Review Required (HIGH Priority) ---
            review_doses = assessment.categorized_doses.get(VaccinationStatus.CLINICAL_REVIEW.value, [])
            for dose in review_doses:
                cat_rule = ALL_CATALOG_RULES.get(dose.rule_code, {})
                review_notes = cat_rule.get("clinical_review_notes") or dose.status_reason

                member_recs.append(
                    RecommendationItem(
                        category=RecommendationCategory.CLINICAL_REVIEW,
                        priority=RecommendationPriority.HIGH,
                        title=f"Clinical Review Required: {dose.vaccine_name} ({dose.dose_name})",
                        description=(
                            f"Administration of {dose.vaccine_name} requires in-person pediatric evaluation. "
                            f"{review_notes}"
                        ),
                        clinical_rationale=dose.status_reason,
                        vaccine_code=dose.vaccine_code,
                        vaccine_name=dose.vaccine_name,
                        dose_number=dose.dose_number,
                        dose_name=dose.dose_name,
                        due_date=dose.calculated_due_date,
                        action_type="CLINICAL_EVALUATION",
                        is_deterministic=True,
                    )
                )
                discussion_points.append(
                    f"Review eligibility, precautions, and evaluation requirements for {dose.vaccine_name}."
                )

            # --- G. Documented Allergies & Sensitivity Alerts ---
            allergies = m_doc.get("allergies", [])
            if allergies:
                allergy_str = ", ".join(allergies)
                member_recs.append(
                    RecommendationItem(
                        category=RecommendationCategory.CLINICAL_REVIEW,
                        priority=RecommendationPriority.HIGH,
                        title=f"Allergy Screening Alert: {allergy_str}",
                        description=(
                            f"{m_name} has documented sensitivities ({allergy_str}). Inform the healthcare "
                            f"provider prior to administering vaccines to screen for contraindications or components."
                        ),
                        clinical_rationale=(
                            "Screening for anaphylaxis and severe hypersensitivity precautions is mandatory "
                            "under standard clinical immunization safety guidelines."
                        ),
                        action_type="VERIFY_ALLERGIES",
                        is_deterministic=False,
                    )
                )
                discussion_points.append(f"Inform clinic of documented allergies ({allergy_str}) prior to injection.")

            # --- H. Optional / Private Vaccine Advisories (INFORMATIONAL) ---
            if include_optional:
                age_days = (ref_date - m_dob).days
                # Check administered vaccines for this member to avoid recommending completed ones
                administered_codes = set()
                for cat_items in assessment.categorized_doses.values():
                    for item in cat_items:
                        if item.status == VaccinationStatus.COMPLETED:
                            administered_codes.add(item.vaccine_code.upper())
                            administered_codes.add(item.rule_code.upper())

                advisories_candidates: List[OptionalVaccineGuidance] = []

                # HPV (Human Papillomavirus): prioritized for adolescents age 9-18 years (3285 to 6570 days)
                if 3285 <= age_days <= 6570 and "HPV" not in administered_codes:
                    advisories_candidates.append(
                        OptionalVaccineGuidance(
                            vaccine_code="HPV",
                            vaccine_name="Human Papillomavirus Vaccine",
                            target_disease="HPV-related Cancers (Cervical, Anogenital)",
                            recommended_age_range="9–14 Years (2-dose schedule)",
                            advisory_notes="Highly effective preventive cancer vaccine. Most immunogenic when administered before adolescent exposure.",
                            discussion_point="Is my child eligible for the HPV vaccination series?",
                        )
                    )

                # Typhoid Conjugate Vaccine (TCV): age >= 6 months (180 days)
                if 180 <= age_days and "TYPHOID" not in administered_codes:
                    advisories_candidates.append(
                        OptionalVaccineGuidance(
                            vaccine_code="TYPHOID",
                            vaccine_name="Typhoid Conjugate Vaccine (TCV)",
                            target_disease="Typhoid Fever (Salmonella Typhi)",
                            recommended_age_range="6–9 Months and above",
                            advisory_notes="Provides long-lasting protection against typhoid fever with high immunogenicity in infants and children.",
                            discussion_point="Is Typhoid Conjugate Vaccine (TCV) recommended for my child?",
                        )
                    )

                # Varicella (Chickenpox): age >= 15 months (450 days)
                if age_days >= 450 and "VARICELLA" not in administered_codes:
                    advisories_candidates.append(
                        OptionalVaccineGuidance(
                            vaccine_code="VARICELLA",
                            vaccine_name="Varicella Vaccine",
                            target_disease="Chickenpox (Varicella Zoster)",
                            recommended_age_range="15 Months onwards (2-dose series)",
                            advisory_notes="Prevents varicella illness and complications. Recommended by IAP as a 2-dose series (15 months and 4–6 years).",
                            discussion_point="Should we consider the Varicella (chickenpox) vaccine?",
                        )
                    )

                # Hepatitis A: age >= 12 months (365 days)
                if age_days >= 365 and "HEPA" not in administered_codes:
                    advisories_candidates.append(
                        OptionalVaccineGuidance(
                            vaccine_code="HEPA",
                            vaccine_name="Hepatitis A Vaccine",
                            target_disease="Hepatitis A Virus",
                            recommended_age_range="12 Months onwards",
                            advisory_notes="Protects against viral hepatitis A. Available as single-dose live or 2-dose inactivated vaccine.",
                            discussion_point="Discuss Hepatitis A immunization options with our pediatrician.",
                        )
                    )

                # Influenza (Annual Flu): infants age >= 6 months
                if age_days >= 180 and "INFLUENZA" not in administered_codes:
                    advisories_candidates.append(
                        OptionalVaccineGuidance(
                            vaccine_code="INFLUENZA",
                            vaccine_name="Seasonal Influenza Vaccine",
                            target_disease="Influenza (Seasonal Flu)",
                            recommended_age_range="Annual (from 6 Months onwards)",
                            advisory_notes="Annual seasonal vaccination protects against circulating influenza strains prior to winter/monsoon season.",
                            discussion_point="Would seasonal influenza vaccination be beneficial for our household this season?",
                        )
                    )

                # Include age-appropriate advisories (up to 5)
                for adv in advisories_candidates[:5]:
                    optional_advisories.append(adv)
                    member_recs.append(
                        RecommendationItem(
                            category=RecommendationCategory.OPTIONAL_VACCINE_ADVISORY,
                            priority=RecommendationPriority.INFORMATIONAL,
                            title=f"Optional Advisory: {adv.vaccine_name}",
                            description=(
                                f"{adv.vaccine_name} is an optional private-sector vaccine ({adv.recommended_age_range}). "
                                f"{adv.advisory_notes}"
                            ),
                            clinical_rationale=f"IAP/ACVIP guidelines recommend considering {adv.vaccine_name} for protection against {adv.target_disease}.",
                            vaccine_code=adv.vaccine_code,
                            vaccine_name=adv.vaccine_name,
                            action_type="OPTIONAL_DISCUSSION",
                            is_deterministic=False,
                        )
                    )
                    discussion_points.append(adv.discussion_point)

            # --- I. Up to Date Fallback ---
            if not member_recs:
                member_recs.append(
                    RecommendationItem(
                        category=RecommendationCategory.UPCOMING_PLANNING,
                        priority=RecommendationPriority.INFORMATIONAL,
                        title=f"Vaccinations Up to Date: {m_name}",
                        description=(
                            f"All routine immunizations scheduled up to {ref_date.strftime('%b %d, %Y')} "
                            f"are completed. Continue maintaining healthy records."
                        ),
                        clinical_rationale="No outstanding due, overdue, or catch-up doses detected by the Schedule Engine.",
                        action_type="MAINTAIN_ROUTINE",
                        is_deterministic=True,
                    )
                )

            # Deduplicate discussion points
            unique_discussion_points = []
            for dp in discussion_points:
                if dp not in unique_discussion_points:
                    unique_discussion_points.append(dp)

            member_recommendations.append(
                MemberRecommendation(
                    member_id=m_id,
                    member_name=m_name,
                    date_of_birth=m_dob,
                    age_display=assessment.age_display,
                    total_recommendations=len(member_recs),
                    recommendations=member_recs,
                    catch_up_pathways=catch_up_pathways,
                    optional_vaccine_advisories=optional_advisories,
                    pediatric_discussion_points=unique_discussion_points[:5],
                    warnings=member_warnings,
                )
            )

        # 5. Tally summary metrics
        total_recs = 0
        for mr in member_recommendations:
            total_recs += len(mr.recommendations)
            for r in mr.recommendations:
                p_key = r.priority.value
                c_key = r.category.value
                overall_priority_counts[p_key] = overall_priority_counts.get(p_key, 0) + 1
                overall_category_counts[c_key] = overall_category_counts.get(c_key, 0) + 1

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return RecommendationAgentResult(
            agent_id=self.agent_id,
            timestamp=datetime.utcnow(),
            user_id=target_user_id,
            evaluated_members_count=len(member_recommendations),
            member_recommendations=member_recommendations,
            total_recommendations_count=total_recs,
            recommendations_by_priority=overall_priority_counts,
            recommendations_by_category=overall_category_counts,
            clinical_disclaimer=RECOMMENDATION_CLINICAL_DISCLAIMER,
            warnings=overall_warnings,
            correlation_id=input_data.correlation_id,
            execution_duration_ms=duration_ms,
        )


# Singleton instance for backend reuse
recommendation_agent = RecommendationAgent()
