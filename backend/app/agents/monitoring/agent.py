"""
Monitoring Agent Implementation (Phase 8).
Authoritative, deterministic clinical assessment and milestone detection agent.
Strictly relies on the deterministic vaccination schedule engine. Zero LLM dependencies.
"""
from typing import Optional, List, Dict, Any, Tuple
from datetime import date, datetime, timedelta
import logging

from app.agents.base import BaseAgent
from app.agents.monitoring.schemas import (
    MonitoringAgentInput,
    MonitoringAgentResult,
    MemberMonitoringAssessment,
    DoseAssessmentItem,
    ActionableMonitoringEvent,
    DataQualityIssue,
)
from app.models.vaccination import VaccinationStatus
from app.models.notification import (
    NotificationPriority,
    NotificationType,
    NotificationChannel,
)
from app.models.user import UserRole
from app.services.schedule_engine import calculate_member_schedule
from app.services.family_service import family_service, format_doc
from app.services.notification_service import notification_service

logger = logging.getLogger("vaxassist.agents.monitoring")


class MonitoringAgent(BaseAgent):
    """
    Monitoring Agent:
    - Inspects patient & family records
    - Runs deterministic schedule engine (NIS/UIP rules)
    - Detects all vaccination states (UPCOMING, DUE, OVERDUE, MISSED, CATCH_UP_REQUIRED, CLINICAL_REVIEW)
    - Audits clinical data quality (conflicts, missing fields, corrupted dates)
    - Produces structured actionable events for Reminder Agent and Orchestrator
    - Enforces tenant isolation and role-based access control
    """

    def __init__(self):
        super().__init__(
            agent_id="agent_monitoring_v1",
            name="Monitoring Agent",
            description="Authoritative Clinical Assessment & Milestone Detection Agent",
            version="1.0.0",
        )

    def _calculate_age_display(self, dob: Any, ref_date: Any) -> Tuple[int, str]:
        """Calculates exact age in days and a human-readable age label."""
        if hasattr(dob, "date"):
            dob = dob.date()
        if hasattr(ref_date, "date"):
            ref_date = ref_date.date()
        total_days = (ref_date - dob).days
        if total_days < 0:
            return total_days, "Unborn / Future DOB"
        if total_days < 30:
            return total_days, f"{total_days} days"
        months = total_days // 30
        if months < 24:
            rem_days = total_days % 30
            return total_days, f"{months} mo {rem_days} d" if rem_days > 0 else f"{months} mo"
        years = total_days // 365
        rem_mo = (total_days % 365) // 30
        return total_days, f"{years} yr {rem_mo} mo" if rem_mo > 0 else f"{years} yr"

    def _sanitize_and_audit_records(
        self,
        member_id: str,
        member_name: str,
        dob: Optional[date],
        raw_records: List[Dict[str, Any]],
        reference_date: date,
    ) -> Tuple[List[Dict[str, Any]], List[DataQualityIssue]]:
        """
        Validates, sanitizes, and audits vaccination records.
        Handles missing, invalid, or incomplete records safely without crashing.
        Flags chronological conflicts, future dates, and corrupt data.
        """
        if hasattr(reference_date, "date"):
            reference_date = reference_date.date()
        if hasattr(dob, "date"):
            dob = dob.date()

        sanitized = []
        issues: List[DataQualityIssue] = []

        seen_doses_by_vaccine: Dict[str, List[Tuple[int, date, str]]] = {}

        for idx, rec in enumerate(raw_records):
            rec_id = str(rec.get("id") or rec.get("_id") or f"rec_{idx}")
            v_code_raw = rec.get("vaccine_code")

            # 1. Missing vaccine code
            if not v_code_raw or not str(v_code_raw).strip():
                issues.append(DataQualityIssue(
                    family_member_id=member_id,
                    member_name=member_name,
                    record_id=rec_id,
                    issue_type="MISSING_VACCINE_CODE",
                    severity="ERROR",
                    description=f"Record {rec_id} has missing or empty vaccine_code.",
                    suggested_action="Review and supply standard vaccine code (e.g. BCG, HEPB, PENTA)."
                ))
                continue

            v_code = str(v_code_raw).strip().upper()

            # 2. Dose number check
            try:
                dose_num = int(rec.get("dose_number", 1))
                if dose_num <= 0:
                    raise ValueError("Dose number must be >= 1")
            except (ValueError, TypeError):
                issues.append(DataQualityIssue(
                    family_member_id=member_id,
                    member_name=member_name,
                    record_id=rec_id,
                    issue_type="INVALID_DOSE_NUMBER",
                    severity="WARNING",
                    description=f"Invalid dose number '{rec.get('dose_number')}' for {v_code}. Defaulting to 1.",
                    suggested_action="Verify correct sequential dose number."
                ))
                dose_num = 1

            # 3. Administration date check
            adm_raw = rec.get("administered_date")
            adm_date: Optional[date] = None
            if isinstance(adm_raw, str):
                try:
                    adm_date = date.fromisoformat(adm_raw.split("T")[0])
                except ValueError:
                    issues.append(DataQualityIssue(
                        family_member_id=member_id,
                        member_name=member_name,
                        record_id=rec_id,
                        issue_type="CORRUPTED_DATE",
                        severity="ERROR",
                        description=f"Administered date '{adm_raw}' is not valid ISO YYYY-MM-DD.",
                        suggested_action="Update record with verified clinical administration date."
                    ))
                    continue
            elif isinstance(adm_raw, datetime):
                adm_date = adm_raw.date()
            elif isinstance(adm_raw, date):
                adm_date = adm_raw
            elif adm_raw is None:
                issues.append(DataQualityIssue(
                    family_member_id=member_id,
                    member_name=member_name,
                    record_id=rec_id,
                    issue_type="MISSING_ADMINISTERED_DATE",
                    severity="ERROR",
                    description=f"Record {rec_id} ({v_code}) is missing administration date.",
                    suggested_action="Specify administration date or mark as pending."
                ))
                continue

            if hasattr(adm_date, "date"):
                adm_date = adm_date.date()

            # 4. Check for future administration date
            if adm_date and adm_date > reference_date:
                issues.append(DataQualityIssue(
                    family_member_id=member_id,
                    member_name=member_name,
                    record_id=rec_id,
                    issue_type="FUTURE_ADMINISTERED_DATE",
                    severity="ERROR",
                    description=f"Administration date {adm_date.isoformat()} for {v_code} is in the future.",
                    suggested_action="Verify administration date; cannot record future administrations."
                ))

            # 5. Check if administered before member's date of birth
            if dob and adm_date and adm_date < dob:
                issues.append(DataQualityIssue(
                    family_member_id=member_id,
                    member_name=member_name,
                    record_id=rec_id,
                    issue_type="ADMINISTERED_BEFORE_BIRTH",
                    severity="CRITICAL",
                    description=f"Vaccine {v_code} dose {dose_num} administered ({adm_date.isoformat()}) before DOB ({dob.isoformat()}).",
                    suggested_action="Investigate clinical records for date entry discrepancy."
                ))

            # Track doses to detect chronological sequence conflicts
            if adm_date:
                seen_doses_by_vaccine.setdefault(v_code, []).append((dose_num, adm_date, rec_id))

            clean_rec = dict(rec)
            clean_rec["id"] = rec_id
            clean_rec["vaccine_code"] = v_code
            clean_rec["dose_number"] = dose_num
            clean_rec["administered_date"] = adm_date
            clean_rec["vaccine_name"] = rec.get("vaccine_name") or v_code
            sanitized.append(clean_rec)

        # 6. Check for sequence anomalies (e.g., Dose 2 given before Dose 1)
        for v_code, doses in seen_doses_by_vaccine.items():
            sorted_by_num = sorted(doses, key=lambda x: x[0])
            for i in range(len(sorted_by_num) - 1):
                cur_num, cur_date, _ = sorted_by_num[i]
                next_num, next_date, next_id = sorted_by_num[i + 1]
                if cur_num < next_num and cur_date > next_date:
                    issues.append(DataQualityIssue(
                        family_member_id=member_id,
                        member_name=member_name,
                        record_id=next_id,
                        issue_type="CHRONOLOGICAL_CONFLICT",
                        severity="WARNING",
                        description=(
                            f"{v_code} Dose {next_num} recorded on {next_date.isoformat()}, "
                            f"which is earlier than Dose {cur_num} on {cur_date.isoformat()}."
                        ),
                        suggested_action="Clinical review required: confirm dates or batch logs with clinic."
                    ))

        return sanitized, issues

    def evaluate_member(
        self,
        user_id: str,
        member: Dict[str, Any],
        raw_records: List[Dict[str, Any]],
        reference_date: Optional[date] = None,
        reminder_lead_days: Optional[List[int]] = None,
        existing_dedup_keys: Optional[set] = None,
        include_private_optional: bool = False,
        eligible_for_je: bool = False,
    ) -> MemberMonitoringAssessment:
        """
        Pure deterministic assessment for a single family member.
        Zero side effects, zero DB writes, zero LLM calls.
        Produces full categorized doses and actionable events.
        """
        today = reference_date or date.today()
        if hasattr(today, "date"):
            today = today.date()
        member_id = str(member.get("id") or member.get("_id") or "unknown_member")
        member_name = member.get("full_name") or "Family Member"
        lead_days = reminder_lead_days or [14, 7, 3, 1]
        dedup_registry = existing_dedup_keys if existing_dedup_keys is not None else set()

        # Parse date of birth
        dob_raw = member.get("date_of_birth")
        dob: Optional[date] = None
        data_quality_issues: List[DataQualityIssue] = []

        if isinstance(dob_raw, str):
            try:
                dob = date.fromisoformat(dob_raw.split("T")[0])
            except ValueError:
                data_quality_issues.append(DataQualityIssue(
                    family_member_id=member_id,
                    member_name=member_name,
                    issue_type="CORRUPTED_DOB",
                    severity="CRITICAL",
                    description=f"Member '{member_name}' has unparseable date_of_birth '{dob_raw}'.",
                    suggested_action="Set valid ISO YYYY-MM-DD date of birth to evaluate schedule."
                ))
        elif isinstance(dob_raw, datetime):
            dob = dob_raw.date()
        elif isinstance(dob_raw, date):
            dob = dob_raw

        # Handle missing DOB
        if not dob:
            if not data_quality_issues:
                data_quality_issues.append(DataQualityIssue(
                    family_member_id=member_id,
                    member_name=member_name,
                    issue_type="MISSING_DOB",
                    severity="CRITICAL",
                    description=f"Member '{member_name}' is missing date_of_birth.",
                    suggested_action="Update profile with date of birth to calculate vaccination schedule."
                ))
            return MemberMonitoringAssessment(
                member_id=member_id,
                full_name=member_name,
                date_of_birth=None,
                summary={
                    "total_doses": 0,
                    "completed_count": 0,
                    "due_count": 0,
                    "overdue_count": 0,
                    "upcoming_count": 0,
                    "missed_count": 0,
                    "catch_up_count": 0,
                    "clinical_review_count": 1,
                    "completion_percentage": 0.0,
                },
                categorized_doses={},
                actionable_events=[
                    ActionableMonitoringEvent(
                        event_id=f"evt_{member_id}_missing_dob",
                        dedup_key=f"{user_id}:{member_id}:PROFILE:MISSING_DOB",
                        event_type="CLINICAL_REVIEW_ALERT",
                        priority=NotificationPriority.URGENT,
                        family_member_id=member_id,
                        member_name=member_name,
                        vaccine_code="PROFILE",
                        vaccine_name="Patient Profile Incomplete",
                        dose_number=1,
                        dose_name="N/A",
                        calculated_due_date=today,
                        title=f"Incomplete Profile: {member_name}",
                        message=f"{member_name} is missing Date of Birth. Vaccination schedule calculation halted.",
                        ready_for_reminder=True,
                    )
                ],
                data_quality_issues=data_quality_issues,
            )

        # Sanitize records and audit for quality issues
        clean_records, record_issues = self._sanitize_and_audit_records(
            member_id=member_id,
            member_name=member_name,
            dob=dob,
            raw_records=raw_records,
            reference_date=today,
        )
        data_quality_issues.extend(record_issues)

        # Calculate age display
        age_days, age_display = self._calculate_age_display(dob, today)

        # Run authoritative deterministic schedule calculation
        schedule_eval = calculate_member_schedule(
            date_of_birth=dob,
            existing_records=clean_records,
            reference_date=today,
            eligible_for_je=eligible_for_je,
            include_private_optional=include_private_optional,
        )

        categorized_doses: Dict[str, List[DoseAssessmentItem]] = {
            VaccinationStatus.COMPLETED.value: [],
            VaccinationStatus.DUE.value: [],
            VaccinationStatus.OVERDUE.value: [],
            VaccinationStatus.UPCOMING.value: [],
            VaccinationStatus.MISSED.value: [],
            VaccinationStatus.CATCH_UP_REQUIRED.value: [],
            VaccinationStatus.CLINICAL_REVIEW.value: [],
        }

        actionable_events: List[ActionableMonitoringEvent] = []

        for item in schedule_eval["schedule_items"]:
            status: VaccinationStatus = item["status"]
            status_val = status.value
            rule_code = item["code"]
            dose_number = item["dose_number"]
            dose_name = item["dose_name"]
            vaccine_name = item["name"]
            calc_due: date = item["calculated_due_date"]
            status_reason = item["status_reason"]
            priority = NotificationPriority.MEDIUM

            # Map priorities authoritatively
            if status == VaccinationStatus.CLINICAL_REVIEW:
                priority = NotificationPriority.URGENT
            elif status in (VaccinationStatus.OVERDUE, VaccinationStatus.MISSED, VaccinationStatus.CATCH_UP_REQUIRED):
                priority = NotificationPriority.HIGH
            elif status == VaccinationStatus.DUE:
                priority = NotificationPriority.HIGH
            elif status == VaccinationStatus.UPCOMING:
                days_until = (calc_due - today).days
                priority = NotificationPriority.HIGH if days_until <= 1 else NotificationPriority.MEDIUM
            else:
                priority = NotificationPriority.LOW

            dose_assessment = DoseAssessmentItem(
                rule_code=rule_code,
                vaccine_code=item.get("vaccine_code", rule_code),
                dose_number=dose_number,
                dose_name=dose_name,
                vaccine_name=vaccine_name,
                target_disease=item.get("target_disease", ""),
                category=item.get("category", ""),
                recommended_age_display=item.get("recommended_age_display", ""),
                recommended_date=item["recommended_date"],
                calculated_due_date=calc_due,
                status=status,
                status_reason=status_reason,
                administered_date=item.get("administered_date"),
                record_id=item.get("record_id"),
                priority=priority,
                route=item.get("route"),
                site=item.get("site"),
                is_conditional=item.get("is_conditional", False),
                condition_description=item.get("condition_description"),
            )
            categorized_doses.setdefault(status_val, []).append(dose_assessment)

            # Generate Actionable Events for Reminder Agent and Orchestrator
            if status == VaccinationStatus.COMPLETED:
                continue

            elif status == VaccinationStatus.DUE:
                dedup_key = f"{user_id}:{member_id}:{rule_code}:DUE:{calc_due.isoformat()}"
                evt_id = f"evt_{member_id}_{rule_code}_due_{calc_due.isoformat()}"
                due_str = calc_due.strftime("%b %d, %Y")
                actionable_events.append(ActionableMonitoringEvent(
                    event_id=evt_id,
                    dedup_key=dedup_key,
                    event_type="DUE_ALERT",
                    priority=NotificationPriority.HIGH,
                    family_member_id=member_id,
                    member_name=member_name,
                    vaccine_code=item.get("vaccine_code", rule_code),
                    vaccine_name=vaccine_name,
                    dose_number=dose_number,
                    dose_name=dose_name,
                    calculated_due_date=calc_due,
                    days_until_due=0,
                    title=f"Vaccination Due: {vaccine_name}",
                    message=(
                        f"{vaccine_name} ({dose_name}) is currently due for {member_name} "
                        f"(target date: {due_str}). Please book an appointment with your healthcare provider."
                    ),
                    ready_for_reminder=True,
                    metadata={"status": "DUE", "rule_code": rule_code},
                ))

            elif status == VaccinationStatus.OVERDUE:
                days_overdue = (today - calc_due).days
                dedup_key = f"{user_id}:{member_id}:{rule_code}:OVERDUE:{calc_due.isoformat()}"
                evt_id = f"evt_{member_id}_{rule_code}_overdue_{calc_due.isoformat()}"
                actionable_events.append(ActionableMonitoringEvent(
                    event_id=evt_id,
                    dedup_key=dedup_key,
                    event_type="OVERDUE_ALERT",
                    priority=NotificationPriority.HIGH,
                    family_member_id=member_id,
                    member_name=member_name,
                    vaccine_code=item.get("vaccine_code", rule_code),
                    vaccine_name=vaccine_name,
                    dose_number=dose_number,
                    dose_name=dose_name,
                    calculated_due_date=calc_due,
                    days_overdue=days_overdue,
                    title=f"Vaccination Overdue: {vaccine_name}",
                    message=(
                        f"{vaccine_name} ({dose_name}) for {member_name} is overdue by {days_overdue} days "
                        f"(was due {calc_due.strftime('%b %d, %Y')}). Please arrange administration promptly."
                    ),
                    ready_for_reminder=True,
                    metadata={"status": "OVERDUE", "days_overdue": days_overdue, "rule_code": rule_code},
                ))

            elif status == VaccinationStatus.MISSED:
                dedup_key = f"{user_id}:{member_id}:{rule_code}:MISSED"
                evt_id = f"evt_{member_id}_{rule_code}_missed"
                actionable_events.append(ActionableMonitoringEvent(
                    event_id=evt_id,
                    dedup_key=dedup_key,
                    event_type="MISSED_ALERT",
                    priority=NotificationPriority.HIGH,
                    family_member_id=member_id,
                    member_name=member_name,
                    vaccine_code=item.get("vaccine_code", rule_code),
                    vaccine_name=vaccine_name,
                    dose_number=dose_number,
                    dose_name=dose_name,
                    calculated_due_date=calc_due,
                    title=f"Vaccination Window Expired: {vaccine_name}",
                    message=f"{vaccine_name} ({dose_name}) for {member_name}: {status_reason}",
                    ready_for_reminder=True,
                    metadata={"status": "MISSED", "rule_code": rule_code},
                ))

            elif status == VaccinationStatus.CATCH_UP_REQUIRED:
                dedup_key = f"{user_id}:{member_id}:{rule_code}:CATCH_UP"
                evt_id = f"evt_{member_id}_{rule_code}_catchup"
                actionable_events.append(ActionableMonitoringEvent(
                    event_id=evt_id,
                    dedup_key=dedup_key,
                    event_type="CATCH_UP_ALERT",
                    priority=NotificationPriority.HIGH,
                    family_member_id=member_id,
                    member_name=member_name,
                    vaccine_code=item.get("vaccine_code", rule_code),
                    vaccine_name=vaccine_name,
                    dose_number=dose_number,
                    dose_name=dose_name,
                    calculated_due_date=calc_due,
                    title=f"Catch-Up Protocol Required: {vaccine_name}",
                    message=f"{vaccine_name} for {member_name}: {status_reason}",
                    ready_for_reminder=True,
                    metadata={"status": "CATCH_UP_REQUIRED", "rule_code": rule_code},
                ))

            elif status == VaccinationStatus.CLINICAL_REVIEW:
                dedup_key = f"{user_id}:{member_id}:{rule_code}:CLINICAL_REVIEW"
                evt_id = f"evt_{member_id}_{rule_code}_review"
                actionable_events.append(ActionableMonitoringEvent(
                    event_id=evt_id,
                    dedup_key=dedup_key,
                    event_type="CLINICAL_REVIEW_ALERT",
                    priority=NotificationPriority.URGENT,
                    family_member_id=member_id,
                    member_name=member_name,
                    vaccine_code=item.get("vaccine_code", rule_code),
                    vaccine_name=vaccine_name,
                    dose_number=dose_number,
                    dose_name=dose_name,
                    calculated_due_date=calc_due,
                    title=f"Clinical Review Mandatory: {vaccine_name}",
                    message=f"{vaccine_name} for {member_name}: {status_reason}",
                    ready_for_reminder=True,
                    metadata={"status": "CLINICAL_REVIEW", "rule_code": rule_code},
                ))

            elif status == VaccinationStatus.UPCOMING:
                days_until_due = (calc_due - today).days
                # Check lead day buckets
                applicable_buckets = [d for d in lead_days if days_until_due <= d and days_until_due >= 0]
                if applicable_buckets:
                    lead_bucket = min(applicable_buckets)
                    dedup_key = f"{user_id}:{member_id}:{rule_code}:REMINDER:{calc_due.isoformat()}:{lead_bucket}d"
                    evt_id = f"evt_{member_id}_{rule_code}_upcoming_{lead_bucket}d"
                    due_str = calc_due.strftime("%b %d, %Y")
                    days_text = "today" if days_until_due == 0 else f"in {days_until_due} day{'s' if days_until_due != 1 else ''}"
                    actionable_events.append(ActionableMonitoringEvent(
                        event_id=evt_id,
                        dedup_key=dedup_key,
                        event_type="UPCOMING_REMINDER",
                        priority=NotificationPriority.HIGH if days_until_due <= 1 else NotificationPriority.MEDIUM,
                        family_member_id=member_id,
                        member_name=member_name,
                        vaccine_code=item.get("vaccine_code", rule_code),
                        vaccine_name=vaccine_name,
                        dose_number=dose_number,
                        dose_name=dose_name,
                        calculated_due_date=calc_due,
                        days_until_due=days_until_due,
                        title=f"Upcoming Vaccination: {vaccine_name}",
                        message=(
                            f"{member_name} is scheduled for {vaccine_name} ({dose_name}) on {due_str} "
                            f"({item['recommended_age_display']}). Due {days_text}."
                        ),
                        ready_for_reminder=True,
                        suggested_lead_bucket=lead_bucket,
                        metadata={
                            "days_until_due": days_until_due,
                            "lead_bucket": lead_bucket,
                            "rule_code": rule_code,
                        },
                    ))

        return MemberMonitoringAssessment(
            member_id=member_id,
            full_name=member_name,
            date_of_birth=dob,
            age_days=age_days,
            age_display=age_display,
            summary=schedule_eval["summary"],
            categorized_doses=categorized_doses,
            actionable_events=actionable_events,
            data_quality_issues=data_quality_issues,
        )

    def _validate_access(
        self,
        target_user_id: str,
        target_member_id: Optional[str],
        caller_user_id: Optional[str],
        caller_role: Optional[str],
        user_members: List[Dict[str, Any]],
    ) -> None:
        """
        Validates ownership and role-based access restrictions.
        - Patients can ONLY access their own household.
        - Healthcare workers and Admins have authorized access.
        """
        if not caller_user_id:
            return  # Internal or system-level invocation

        # If caller is a PATIENT, they must match target_user_id
        if caller_role == UserRole.PATIENT.value or caller_role == "PATIENT":
            if caller_user_id != target_user_id:
                raise PermissionError(
                    f"Access Denied: Patient {caller_user_id} cannot monitor records belonging to user {target_user_id}."
                )

            # If a specific member ID is requested, verify it belongs to this household
            if target_member_id:
                member_ids = [str(m.get("id") or m.get("_id")) for m in user_members]
                if target_member_id not in member_ids:
                    raise PermissionError(
                        f"Access Denied: Family member {target_member_id} does not belong to your household."
                    )

    async def execute(
        self,
        input_data: Optional[MonitoringAgentInput] = None,
        **kwargs: Any,
    ) -> MonitoringAgentResult:
        """
        Executes the Monitoring Agent.
        Supports both Pydantic input schema and direct keyword arguments.
        """
        if input_data is None:
            input_data = MonitoringAgentInput(**kwargs)

        target_user_id = input_data.user_id
        target_member_id = input_data.family_member_id
        ref_date = input_data.reference_date or date.today()
        if hasattr(ref_date, "date"):
            ref_date = ref_date.date()
        caller_user_id = input_data.caller_user_id
        caller_role = input_data.caller_role

        # Optional in-memory test fixtures passed via kwargs
        fixture_members = kwargs.get("members_fixture")
        fixture_records = kwargs.get("records_fixture")

        # 1. Retrieve members (from fixture or MongoDB)
        if fixture_members is not None:
            members = fixture_members
        else:
            members = await family_service.list_members(owner_user_id=target_user_id)

        # 2. Enforce tenant isolation & authorization
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

        # 3. Retrieve user reminder preferences (from notification_service or defaults)
        lead_days = [14, 7, 3, 1]
        try:
            prefs = await notification_service.get_preferences(target_user_id)
            if prefs and "reminder_lead_days" in prefs:
                lead_days = prefs["reminder_lead_days"]
        except Exception:
            lead_days = [14, 7, 3, 1]

        # 4. Assess each member
        member_assessments: List[MemberMonitoringAssessment] = []
        all_actionable_events: List[ActionableMonitoringEvent] = []
        all_data_quality_issues: List[DataQualityIssue] = []

        total_doses_evaluated = 0
        status_distribution = {
            VaccinationStatus.COMPLETED.value: 0,
            VaccinationStatus.DUE.value: 0,
            VaccinationStatus.OVERDUE.value: 0,
            VaccinationStatus.UPCOMING.value: 0,
            VaccinationStatus.MISSED.value: 0,
            VaccinationStatus.CATCH_UP_REQUIRED.value: 0,
            VaccinationStatus.CLINICAL_REVIEW.value: 0,
        }

        from app.services.vaccination_service import vaccination_service
        v_coll = None

        for m in members:
            m_id = str(m.get("id") or m.get("_id") or "")
            # Retrieve member's vaccination records
            if fixture_records is not None:
                # Filter in-memory fixture records for this member
                records = [r for r in fixture_records if str(r.get("family_member_id")) == m_id]
            else:
                if v_coll is None:
                    v_coll = vaccination_service.get_collection()
                cursor = v_coll.find({"family_member_id": m_id})
                records = []
                async for doc in cursor:
                    records.append(format_doc(doc))

            # Run deterministic clinical assessment
            assessment = self.evaluate_member(
                user_id=target_user_id,
                member=m,
                raw_records=records,
                reference_date=ref_date,
                reminder_lead_days=lead_days,
                include_private_optional=input_data.include_private_optional,
                eligible_for_je=input_data.eligible_for_je,
            )

            # Optional dispatch to MongoDB notifications for Phase 6 backwards compatibility
            if input_data.dispatch_notifications:
                try:
                    from app.services.monitoring_engine import monitoring_engine
                    eng_stats = await monitoring_engine.monitor_family_member(
                        user_id=target_user_id,
                        member=m,
                        reference_date=ref_date,
                        user_prefs={"reminder_lead_days": lead_days},
                    )
                    assessment.notifications_created = eng_stats.get("notifications_created", 0)
                    assessment.notifications_skipped_duplicate = eng_stats.get("notifications_skipped_duplicate", 0)
                    assessment.resolved_notifications = eng_stats.get("resolved_notifications", 0)
                except Exception as e:
                    logger.warning(f"Could not persist notifications for member {m_id}: {e}")

            member_assessments.append(assessment)
            all_actionable_events.extend(assessment.actionable_events)
            all_data_quality_issues.extend(assessment.data_quality_issues)

            # Aggregate stats
            s = assessment.summary
            total_doses_evaluated += s.get("total_doses", 0)
            status_distribution[VaccinationStatus.COMPLETED.value] += s.get("completed_count", 0)
            status_distribution[VaccinationStatus.DUE.value] += s.get("due_count", 0)
            status_distribution[VaccinationStatus.OVERDUE.value] += s.get("overdue_count", 0)
            status_distribution[VaccinationStatus.UPCOMING.value] += s.get("upcoming_count", 0)
            status_distribution[VaccinationStatus.MISSED.value] += s.get("missed_count", 0)
            status_distribution[VaccinationStatus.CATCH_UP_REQUIRED.value] += s.get("catch_up_count", 0)
            status_distribution[VaccinationStatus.CLINICAL_REVIEW.value] += s.get("clinical_review_count", 0)

        return MonitoringAgentResult(
            agent_id=self.agent_id,
            timestamp=datetime.utcnow(),
            evaluated_users_count=1,
            evaluated_members_count=len(members),
            member_assessments=member_assessments,
            total_doses_evaluated=total_doses_evaluated,
            status_distribution=status_distribution,
            total_actionable_events=len(all_actionable_events),
            actionable_events=all_actionable_events,
            total_data_quality_issues=len(all_data_quality_issues),
            data_quality_issues=all_data_quality_issues,
        )


monitoring_agent = MonitoringAgent()
