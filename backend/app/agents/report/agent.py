"""
Report Generation Agent Implementation (Phase 8, Agent 5).
Produces publication-grade vaccination records, compliance summaries, official immunization passports,
and audit reports in structured JSON and vector PDF formats.
Integrates deterministically with the Monitoring Agent, Recommendation Agent, and Schedule Engine.
"""
import time
import json
import base64
import hashlib
import logging
import uuid
from datetime import date, datetime, timezone
from typing import Optional, List, Dict, Any

from app.agents.base import BaseAgent
from app.agents.report.schemas import (
    ReportType,
    ReportOutputFormat,
    ReportAgentInput,
    ReportAgentResult,
    PatientDemographicsReportItem,
    AdministeredRecordReportItem,
    ScheduledDoseReportItem,
    ProgressSummaryReportItem,
    RecommendationReportItem,
    DataQualityReportItem,
    ReportDocumentMetadata,
    MANDATORY_REPORT_DISCLAIMER,
)
from app.agents.report.pdf_builder import vaccination_pdf_builder, VaccinationPDFBuilder
from app.agents.monitoring import (
    monitoring_agent,
    MonitoringAgent,
    MonitoringAgentInput,
    MonitoringAgentResult,
    MemberMonitoringAssessment,
    DoseAssessmentItem,
    DataQualityIssue,
)
from app.agents.recommendation import (
    recommendation_agent,
    RecommendationAgent,
    RecommendationAgentInput,
    RecommendationAgentResult,
    MemberRecommendation,
)
from app.models.user import UserRole
from app.services.family_service import family_service, format_doc
from app.services.vaccination_service import vaccination_service

logger = logging.getLogger("vaxassist.agents.report")


def _format_age(dob_val: Optional[Any], ref_date: date) -> str:
    """Calculates human-readable age string from DOB and reference date."""
    if not dob_val:
        return "Not Specified"
    if isinstance(dob_val, str):
        try:
            d = date.fromisoformat(dob_val)
        except Exception:
            return "Invalid DOB"
    elif isinstance(dob_val, datetime):
        d = dob_val.date()
    elif isinstance(dob_val, date):
        d = dob_val
    else:
        return "Unknown"

    days = (ref_date - d).days
    if days < 0:
        return "Not yet born"
    years = days // 365
    remaining_days = days % 365
    months = remaining_days // 30
    if years == 0:
        if months == 0:
            return f"{days} days"
        return f"{months} months"
    if months == 0:
        return f"{years} years"
    return f"{years} years, {months} months"


class ReportAgent(BaseAgent):
    """
    Agent 5 of 5: Report Generation Agent.
    Synthesizes patient records, schedule engine timelines, monitoring assessments,
    and clinical recommendations into structured, verifiable JSON and PDF reports.
    Strictly enforces tenant ownership isolation and Schedule Engine authority.
    """

    def __init__(
        self,
        mon_agent: Optional[MonitoringAgent] = None,
        rec_agent: Optional[RecommendationAgent] = None,
        pdf_builder: Optional[VaccinationPDFBuilder] = None,
    ):
        super().__init__(
            agent_id="agent_report_generation_v1",
            name="Report Generation Agent",
            description=(
                "Generates structured immunization records, patient vaccination histories, "
                "compliance summaries, catch-up recommendations, and downloadable official "
                "vaccination records/passports in JSON and PDF formats."
            ),
            version="1.0.0",
        )
        self.monitoring_agent = mon_agent or monitoring_agent
        self.recommendation_agent = rec_agent or recommendation_agent
        self.pdf_builder = pdf_builder or vaccination_pdf_builder

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
        Patients can only generate reports for their own household members.
        Healthcare workers and admins have cross-household access.
        """
        is_elevated = caller_role in (UserRole.ADMIN.value, UserRole.HEALTHCARE_WORKER.value)
        if caller_user_id and caller_user_id != target_user_id and not is_elevated:
            raise PermissionError("Access Denied: Patients can only generate reports for their own household records.")

        if target_member_id:
            member_ids = {str(m.get("id") or m.get("_id")) for m in user_members}
            if member_ids and target_member_id not in member_ids and not is_elevated:
                raise PermissionError("Access Denied: Requested member does not belong to the authorized household.")

    async def execute(
        self,
        input_data: Optional[ReportAgentInput] = None,
        **kwargs: Any,
    ) -> ReportAgentResult:
        """
        Core Report Generation Agent execution pipeline:
        1. Access control validation
        2. Demographics & administered record retrieval
        3. Monitoring Agent evaluation (schedule & milestones)
        4. Recommendation Agent synthesis (optional)
        5. Report data structuring & SHA-256 verification hash
        6. Vector PDF generation or JSON compilation
        """
        if input_data is None:
            input_data = ReportAgentInput(**kwargs)

        start_time = time.perf_counter()
        ref_date = input_data.reference_date or date.today()
        warnings: List[str] = []

        fixture_members = kwargs.get("members_fixture") or input_data.members_fixture
        fixture_records = kwargs.get("records_fixture") or input_data.records_fixture

        # -------------------------------------------------------------
        # 1. Fetch Household Members
        # -------------------------------------------------------------
        if fixture_members is not None:
            user_members = fixture_members
        else:
            try:
                user_members = await family_service.list_members(input_data.user_id)
            except Exception as e:
                logger.warning(f"Could not load members from database for user {input_data.user_id}: {e}")
                user_members = []

        # Validate access permissions
        self._validate_access(
            target_user_id=input_data.user_id,
            target_member_id=input_data.family_member_id,
            caller_user_id=input_data.caller_user_id,
            caller_role=input_data.caller_role,
            user_members=user_members,
        )

        if not user_members:
            if input_data.family_member_id:
                raise ValueError(f"No family members found for user {input_data.user_id}.")
            else:
                # Fallback placeholder if completely empty
                selected_member = {
                    "id": f"placeholder_{input_data.user_id}",
                    "full_name": "Primary Account Holder",
                    "relationship": "Self",
                    "date_of_birth": None,
                    "gender": None,
                    "blood_group": None,
                    "allergies": [],
                }
                user_members = [selected_member]
        else:
            if input_data.family_member_id:
                target_id = str(input_data.family_member_id)
                found = next((m for m in user_members if str(m.get("id") or m.get("_id")) == target_id), None)
                if not found:
                    raise ValueError(f"Family member with ID '{target_id}' was not found in user household.")
                selected_member = found
            else:
                selected_member = user_members[0]

        member_id = str(selected_member.get("id") or selected_member.get("_id"))
        full_name = selected_member.get("full_name", "Unknown Patient")
        dob = selected_member.get("date_of_birth")

        if not dob:
            warnings.append("Patient date of birth is missing. Immunization schedule cannot be accurately calculated.")

        # -------------------------------------------------------------
        # 2. Fetch Administered Records
        # -------------------------------------------------------------
        if fixture_records is not None:
            # Filter in-memory fixture for this member
            raw_records = [
                r for r in fixture_records
                if str(r.get("family_member_id")) == member_id
            ]
        else:
            try:
                raw_records = await vaccination_service.list_records_for_member(
                    owner_user_id=input_data.user_id,
                    member_id=member_id,
                    user_role=input_data.caller_role or UserRole.PATIENT.value,
                )
            except Exception as e:
                logger.warning(f"Could not load vaccination records from database: {e}")
                raw_records = []

        if not raw_records:
            warnings.append("No administered vaccination records found on file for this patient.")

        # Build administered history items
        administered_items: List[AdministeredRecordReportItem] = []
        for r in raw_records:
            administered_items.append(
                AdministeredRecordReportItem(
                    record_id=str(r.get("id") or r.get("_id") or ""),
                    vaccine_code=str(r.get("vaccine_code", "")),
                    vaccine_name=str(r.get("vaccine_name", r.get("vaccine_code", "Vaccine"))),
                    dose_number=int(r.get("dose_number", 1)),
                    dose_name=r.get("dose_name"),
                    administered_date=str(r.get("administered_date", "")),
                    batch_number=r.get("batch_number"),
                    healthcare_provider=r.get("healthcare_provider") or r.get("administered_by"),
                    administration_site=r.get("administration_site"),
                    adverse_reactions=r.get("adverse_reactions"),
                    notes=r.get("notes"),
                    status="completed",
                    is_verified=True,
                )
            )
        # Sort chronologically
        administered_items.sort(key=lambda x: x.administered_date)

        # -------------------------------------------------------------
        # 3. Upstream Call: Monitoring Agent Evaluation
        # -------------------------------------------------------------
        fixture_monitoring = kwargs.get("monitoring_result_fixture")
        if fixture_monitoring is not None:
            mon_result = fixture_monitoring
        else:
            mon_input = MonitoringAgentInput(
                user_id=input_data.user_id,
                family_member_id=member_id,
                reference_date=ref_date,
                caller_user_id=input_data.caller_user_id,
                caller_role=input_data.caller_role,
                include_private_optional=input_data.include_private_optional,
                eligible_for_je=input_data.eligible_for_je,
                dispatch_notifications=False,
            )
            mon_result = await self.monitoring_agent.execute(
                input_data=mon_input,
                members_fixture=[selected_member],
                records_fixture=raw_records,
            )

        # Find member assessment
        assessment: Optional[MemberMonitoringAssessment] = next(
            (a for a in mon_result.member_assessments if str(a.member_id) == member_id),
            None,
        )

        categorized = assessment.categorized_doses if assessment else {}
        data_quality_issues = assessment.data_quality_issues if assessment else []
        age_display = assessment.age_display if assessment else _format_age(dob, ref_date)

        # Collect scheduled doses
        scheduled_items: List[ScheduledDoseReportItem] = []
        for cat_status, doses in categorized.items():
            for d in doses:
                due_date_str = str(d.calculated_due_date) if getattr(d, "calculated_due_date", None) else None
                rec_date_str = str(d.recommended_date) if getattr(d, "recommended_date", None) else due_date_str
                status_str = d.status.value if hasattr(d.status, "value") else str(d.status)
                priority_str = d.priority.value if hasattr(d.priority, "value") else str(getattr(d, "priority", "MEDIUM"))

                scheduled_items.append(
                    ScheduledDoseReportItem(
                        vaccine_code=d.vaccine_code,
                        vaccine_name=d.vaccine_name,
                        dose_number=d.dose_number,
                        due_date=due_date_str,
                        overdue_date=due_date_str,
                        status=status_str,
                        milestone=getattr(d, "recommended_age_display", None),
                        is_mandatory=not getattr(d, "is_conditional", False),
                        preventable_disease=getattr(d, "target_disease", None),
                        action_priority=priority_str,
                        reason=getattr(d, "status_reason", None),
                    )
                )

        # Sort scheduled doses by target due date (items with dates first, then upcoming)
        scheduled_items.sort(
            key=lambda x: (
                x.due_date is None,
                x.due_date or "9999-12-31",
                x.dose_number,
            )
        )

        # Compute progress metrics
        summary_dict = assessment.summary if (assessment and assessment.summary) else {}
        completed_count = summary_dict.get("completed_count", len(categorized.get("completed", [])))
        due_count = summary_dict.get("due_count", len(categorized.get("due", [])))
        overdue_count = summary_dict.get("overdue_count", len(categorized.get("overdue", [])))
        upcoming_count = summary_dict.get("upcoming_count", len(categorized.get("upcoming", [])))
        missed_count = summary_dict.get("missed_count", len(categorized.get("missed", [])))
        catch_up_count = summary_dict.get("catch_up_count", len(categorized.get("catch_up", [])))

        total_eval = summary_dict.get("total_doses", 0)
        if total_eval == 0:
            total_eval = completed_count + due_count + overdue_count + upcoming_count + missed_count + catch_up_count

        compliance_pct = summary_dict.get("completion_percentage")
        if compliance_pct is None:
            compliance_pct = round((completed_count / total_eval) * 100.0, 1) if total_eval > 0 else 0.0

        is_up_to_date = (overdue_count == 0 and due_count == 0 and missed_count == 0)

        progress_item = ProgressSummaryReportItem(
            total_required_doses=total_eval,
            completed_doses=completed_count,
            upcoming_doses=upcoming_count,
            due_doses=due_count,
            overdue_doses=overdue_count,
            missed_doses=missed_count,
            catch_up_doses=catch_up_count,
            compliance_percentage=compliance_pct,
            is_up_to_date=is_up_to_date,
            nis_coverage_summary=(
                f"{completed_count}/{total_eval} doses completed. "
                f"{'Schedule is current.' if is_up_to_date else f'{overdue_count + due_count} dose(s) require action.'}"
            ),
        )

        # -------------------------------------------------------------
        # 4. Upstream Call: Recommendation Agent (if requested)
        # -------------------------------------------------------------
        rec_items: List[RecommendationReportItem] = []
        if (
            input_data.include_recommendations
            and input_data.report_type in (ReportType.COMPREHENSIVE_RECORD, ReportType.VACCINATION_STATUS)
        ):
            try:
                fixture_recommendation = kwargs.get("recommendation_result_fixture")
                if fixture_recommendation is not None:
                    rec_result = fixture_recommendation
                else:
                    rec_input = RecommendationAgentInput(
                        user_id=input_data.user_id,
                        family_member_id=member_id,
                        caller_user_id=input_data.caller_user_id,
                        caller_role=input_data.caller_role,
                        reference_date=ref_date,
                        include_optional_vaccines=input_data.include_private_optional,
                        eligible_for_je=input_data.eligible_for_je,
                        query_knowledge_base=False,  # Skip external ChromaDB/LLM search for rapid report compilation
                        members_fixture=[selected_member],
                        records_fixture=raw_records,
                    )
                    rec_result = await self.recommendation_agent.execute(
                        input_data=rec_input,
                        members_fixture=[selected_member],
                        records_fixture=raw_records,
                        monitoring_result_fixture=mon_result,
                    )
                member_rec: Optional[MemberRecommendation] = next(
                    (r for r in rec_result.member_recommendations if str(r.member_id) == member_id),
                    None,
                )
                if member_rec:
                    for r in member_rec.recommendations:
                        rec_items.append(
                            RecommendationReportItem(
                                vaccine_code=r.vaccine_code,
                                priority=r.priority.value if hasattr(r.priority, "value") else str(r.priority),
                                category=r.category.value if hasattr(r.category, "value") else str(r.category),
                                title=r.title,
                                summary=r.description,
                                clinical_rationale=r.clinical_rationale,
                                pediatric_discussion_points=getattr(member_rec, "pediatric_discussion_points", []),
                            )
                        )
            except Exception as e:
                logger.warning(f"Recommendation Agent synthesis failed for report: {e}")
                warnings.append(f"Could not synthesize recommendations: {str(e)}")

        # -------------------------------------------------------------
        # 5. Data Quality Items
        # -------------------------------------------------------------
        dq_items: List[DataQualityReportItem] = []
        if input_data.include_data_quality and data_quality_issues:
            for issue in data_quality_issues:
                msg = getattr(issue, "description", None) or getattr(issue, "message", "Data quality discrepancy.")
                dq_items.append(
                    DataQualityReportItem(
                        issue_type=issue.issue_type,
                        vaccine_code=getattr(issue, "vaccine_code", None),
                        severity=issue.severity,
                        message=msg,
                    )
                )

        # -------------------------------------------------------------
        # 6. Build Document Metadata & Cryptographic Hash
        # -------------------------------------------------------------
        report_id = f"VAX-REP-{uuid.uuid4().hex[:8].upper()}"
        generated_at = datetime.now(timezone.utc).isoformat()

        # Compute tamper-evident SHA-256 hash over normalized clinical record fields
        hash_payload = json.dumps(
            {
                "report_id": report_id,
                "user_id": input_data.user_id,
                "member_id": member_id,
                "generated_at": generated_at,
                "reference_date": str(ref_date),
                "administered_count": len(administered_items),
                "compliance_pct": compliance_pct,
                "administered_dates": [r.administered_date for r in administered_items],
            },
            sort_keys=True,
        )
        verification_hash = hashlib.sha256(hash_payload.encode("utf-8")).hexdigest()

        metadata_obj = ReportDocumentMetadata(
            report_id=report_id,
            generated_at=generated_at,
            agent_id=self.agent_id,
            report_type=input_data.report_type.value,
            output_format=input_data.output_format.value,
            reference_date=str(ref_date),
            verification_hash=verification_hash,
            issuer="VaxAssist AI Digital Immunization Platform",
            disclaimer=MANDATORY_REPORT_DISCLAIMER,
        )

        patient_demographics = PatientDemographicsReportItem(
            member_id=member_id,
            full_name=full_name,
            relationship=selected_member.get("relationship", "Self"),
            date_of_birth=str(dob) if dob else None,
            age_display=age_display,
            gender=selected_member.get("gender"),
            blood_group=selected_member.get("blood_group"),
            allergies=selected_member.get("allergies", []),
            household_id=input_data.user_id,
            notes=selected_member.get("notes"),
        )

        # Build full structured dictionary representation
        report_data_dict: Dict[str, Any] = {
            "metadata": metadata_obj.model_dump(),
            "patient": patient_demographics.model_dump(),
            "progress": progress_item.model_dump(),
            "history": [r.model_dump() for r in administered_items],
            "scheduled_doses": [s.model_dump() for s in scheduled_items],
            "recommendations": [r.model_dump() for r in rec_items],
            "data_quality": [d.model_dump() for d in dq_items],
            "report_type": input_data.report_type.value,
        }

        # Clean filename
        clean_patient = "".join(c if c.isalnum() else "_" for c in full_name).strip("_")
        date_stamp = ref_date.strftime("%Y%m%d")
        ext = "pdf" if input_data.output_format == ReportOutputFormat.PDF else "json"
        filename = f"VaxAssist_Report_{clean_patient}_{input_data.report_type.value}_{date_stamp}.{ext}"

        # -------------------------------------------------------------
        # 7. Render Output Format (PDF or JSON Base64)
        # -------------------------------------------------------------
        content_base64: Optional[str] = None
        if input_data.output_format == ReportOutputFormat.PDF:
            try:
                pdf_bytes = self.pdf_builder.build_pdf(report_data_dict)
                content_base64 = base64.b64encode(pdf_bytes).decode("utf-8")
            except Exception as pdf_err:
                logger.error(f"PDF build failed: {pdf_err}", exc_info=True)
                warnings.append(f"PDF rendering failed: {str(pdf_err)}. Fallback to JSON payload.")
                # Fallback to JSON base64
                json_bytes = json.dumps(report_data_dict, indent=2).encode("utf-8")
                content_base64 = base64.b64encode(json_bytes).decode("utf-8")
        else:
            json_bytes = json.dumps(report_data_dict, indent=2).encode("utf-8")
            content_base64 = base64.b64encode(json_bytes).decode("utf-8")

        duration_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        return ReportAgentResult(
            agent_id=self.agent_id,
            report_id=report_id,
            timestamp=datetime.now(timezone.utc),
            user_id=input_data.user_id,
            family_member_id=member_id,
            patient_name=full_name,
            date_of_birth=str(dob) if dob else None,
            age_display=age_display,
            gender=selected_member.get("gender"),
            report_type=input_data.report_type.value,
            output_format=input_data.output_format.value,
            filename=filename,
            content_base64=content_base64,
            report_data=report_data_dict,
            verification_hash=verification_hash,
            disclaimer=MANDATORY_REPORT_DISCLAIMER,
            warnings=warnings,
            execution_duration_ms=duration_ms,
        )


# Global singleton instance
report_agent = ReportAgent()
