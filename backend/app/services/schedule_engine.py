"""
Deterministic Vaccination Schedule Engine.
Produces reproducible schedule evaluations using clinical rules and member records.
Zero LLM dependencies.
"""
from datetime import date, timedelta
from typing import List, Dict, Any, Optional
from app.models.vaccination import VaccinationStatus
from app.services.schedule_catalog import (
    STANDARD_VACCINATION_SCHEDULE,
    UNIVERSAL_NIS_SCHEDULE,
    get_catalog,
)


def _record_matches_rule(rec: Dict[str, Any], rule: Dict[str, Any]) -> bool:
    """
    Evaluates whether an administered record satisfies a specific schedule catalog rule.
    Supports both precise NIS dose codes (e.g. 'PENTA_1', 'HEPB_BIRTH') and
    generic series codes (e.g. 'PENTA' dose 1, 'HEPB' dose 1, 'OPV' dose 0).
    """
    rec_code = str(rec.get("vaccine_code", "")).strip().upper()
    rec_dose = int(rec.get("dose_number", 1))

    rule_code = rule.get("code", rule.get("vaccine_code", "")).strip().upper()
    rule_series = rule.get("series_code", "").strip().upper()
    rule_dose = int(rule.get("dose_number", 1))

    # 1. Exact code match
    if rec_code == rule_code:
        return True

    # 2. Series code + dose number match
    if rule_series and rec_code == rule_series and rec_dose == rule_dose:
        return True

    # 3. Check aliases
    aliases = rule.get("aliases", [])
    for alias in aliases:
        if isinstance(alias, str) and rec_code == alias.upper():
            # If alias is string and record dose matches rule dose
            if rec_dose == rule_dose:
                return True
        elif isinstance(alias, tuple) and len(alias) == 2:
            alias_code, alias_dose = alias
            if rec_code == str(alias_code).upper() and (alias_dose is None or rec_dose == alias_dose):
                return True

    return False


def calculate_member_schedule(
    date_of_birth: date,
    existing_records: List[Dict[str, Any]],
    reference_date: Optional[date] = None,
    catalog: Optional[List[Dict[str, Any]]] = None,
    eligible_for_je: bool = False,
    include_conditional: bool = False,
    include_private_optional: bool = False,
) -> Dict[str, Any]:
    """
    Deterministic calculation engine:
    Takes member DOB, administered records, reference date, and returns
    structured schedule items with exact due dates and statuses.
    """
    if reference_date is None:
        reference_date = date.today()

    if catalog is None:
        catalog = get_catalog(
            eligible_for_je=eligible_for_je or include_conditional,
            include_private_optional=include_private_optional,
        )

    # Normalize existing records
    normalized_records = []
    for rec in existing_records:
        adm_date = rec.get("administered_date")
        if isinstance(adm_date, str):
            adm_date = date.fromisoformat(adm_date)
        rec_copy = dict(rec)
        rec_copy["administered_date"] = adm_date
        rec_copy["vaccine_code"] = str(rec.get("vaccine_code", "")).strip().upper()
        rec_copy["dose_number"] = int(rec.get("dose_number", 1))
        normalized_records.append(rec_copy)

    schedule_items = []
    completed_count = 0
    due_count = 0
    overdue_count = 0
    upcoming_count = 0
    missed_count = 0
    catch_up_count = 0
    clinical_review_count = 0

    # Map rule codes to matched administered records to calculate subsequent intervals
    completed_rule_records: Dict[str, Dict[str, Any]] = {}

    for rule in catalog:
        rule_code = rule.get("code", rule.get("vaccine_code", "")).strip().upper()
        rule_series = rule.get("series_code", rule_code).strip().upper()
        dose_number = int(rule["dose_number"])
        recommended_offset = timedelta(days=rule["recommended_age_days"])
        recommended_date = date_of_birth + recommended_offset

        # Check if already administered
        matched_rec = next(
            (r for r in normalized_records if _record_matches_rule(r, rule)),
            None,
        )

        if matched_rec:
            adm_date = matched_rec["administered_date"]
            status = VaccinationStatus.COMPLETED
            status_reason = f"Administered on {adm_date.isoformat()}"
            record_id = str(matched_rec.get("id") or matched_rec.get("_id") or "")
            calculated_due_date = recommended_date
            completed_count += 1
            completed_rule_records[rule_code] = matched_rec
            completed_rule_records[rule_series] = matched_rec
        else:
            record_id = None
            adm_date = None

            # Calculate interval constraints from previous dose if required
            prev_req = rule.get("previous_dose_required")
            min_interval_days = rule.get("minimum_interval_days") or 0

            prev_adm_date = None
            if prev_req:
                # prev_req can be a code string or tuple (code, dose)
                if isinstance(prev_req, str) and prev_req.upper() in completed_rule_records:
                    prev_adm_date = completed_rule_records[prev_req.upper()]["administered_date"]
                elif isinstance(prev_req, tuple):
                    req_code, req_dose = prev_req
                    for k, v in completed_rule_records.items():
                        if (k == req_code.upper() or v.get("vaccine_code") == req_code.upper()) and v.get("dose_number") == req_dose:
                            prev_adm_date = v["administered_date"]
                            break

            min_age_days = rule.get("minimum_age_days")
            min_age_date = date_of_birth + timedelta(days=min_age_days) if min_age_days else recommended_date

            if prev_adm_date and min_interval_days > 0:
                interval_due_date = prev_adm_date + timedelta(days=min_interval_days)
                calculated_due_date = max(recommended_date, interval_due_date, min_age_date)
            else:
                calculated_due_date = max(recommended_date, min_age_date)

            # 1. Strict permanent expiration / missed window where specifically indicated by source:
            # Hepatitis B birth dose (< 24 hours)
            if rule_code == "HEPB_BIRTH" or (rule_series == "HEPB" and dose_number == 1 and "Birth" in rule.get("dose_name", "")):
                if reference_date > date_of_birth + timedelta(days=1):
                    status = VaccinationStatus.MISSED
                    status_reason = (
                        "Missed birth dose window (target: strictly within 24 hours of birth). "
                        "Hepatitis B protection will be administered via Pentavalent combination starting at 6 weeks."
                    )
                    missed_count += 1
                elif reference_date < calculated_due_date:
                    status = VaccinationStatus.UPCOMING
                    status_reason = f"Upcoming: scheduled for birth delivery ({rule['recommended_age_display']})"
                    upcoming_count += 1
                else:
                    status = VaccinationStatus.DUE
                    status_reason = "Currently due at birth (within 24 hours of delivery)"
                    due_count += 1

            # OPV Zero dose (< 15 days)
            elif rule_code == "OPV_0" or (rule_series == "OPV" and dose_number == 1 and "Zero" in rule.get("dose_name", "")):
                if reference_date > date_of_birth + timedelta(days=15):
                    status = VaccinationStatus.MISSED
                    status_reason = (
                        "Missed birth dose window (target: within 15 days of birth). "
                        "Routine polio vaccination begins at 6 weeks with OPV-1 and fIPV-1."
                    )
                    missed_count += 1
                elif reference_date < calculated_due_date:
                    status = VaccinationStatus.UPCOMING
                    status_reason = f"Upcoming: scheduled for birth delivery ({rule['recommended_age_display']})"
                    upcoming_count += 1
                else:
                    status = VaccinationStatus.DUE
                    status_reason = "Currently due at birth (within 15 days of delivery)"
                    due_count += 1

            # Rotavirus vaccine (< 1 year) - cannot be initiated or continued past 1 year of age
            elif (rule_series == "ROTA" or "ROTA" in rule_code) and reference_date > date_of_birth + timedelta(days=365):
                status = VaccinationStatus.MISSED
                status_reason = (
                    "Rotavirus vaccination window expired (> 1 year of age). Under UIP/WHO guidelines, "
                    "rotavirus vaccine is not initiated or administered after 1 year."
                )
                missed_count += 1

            # 2. Check if age exceeds routine maximum age:
            elif rule.get("max_age_days") and reference_date > date_of_birth + timedelta(days=rule["max_age_days"]):
                can_catch_up = rule.get("can_catch_up", False)
                catch_up_max = rule.get("catch_up_max_age_days")

                if can_catch_up and (catch_up_max is None or reference_date <= date_of_birth + timedelta(days=catch_up_max)):
                    status = VaccinationStatus.CATCH_UP_REQUIRED
                    status_reason = rule.get(
                        "catch_up_notes",
                        f"Routine age exceeded ({rule['max_age_days']} days). Catch-up vaccination protocol is required as per official guidelines."
                    )
                    catch_up_count += 1
                else:
                    status = VaccinationStatus.CLINICAL_REVIEW
                    status_reason = rule.get(
                        "clinical_review_notes",
                        f"Age exceeds routine administration cutoff ({rule['max_age_days']} days). Clinical evaluation required by healthcare provider for alternative protocol."
                    )
                    clinical_review_count += 1

            # 3. Standard routine schedule evaluation (UPCOMING / DUE / OVERDUE)
            else:
                due_window = timedelta(days=rule.get("due_window_days", 7))
                grace_period = timedelta(days=rule.get("grace_period_days", 30))

                if reference_date < calculated_due_date - due_window:
                    status = VaccinationStatus.UPCOMING
                    status_reason = f"Upcoming: scheduled for {calculated_due_date.isoformat()} ({rule['recommended_age_display']})"
                    upcoming_count += 1
                elif reference_date > calculated_due_date + grace_period:
                    status = VaccinationStatus.OVERDUE
                    days_overdue = (reference_date - calculated_due_date).days
                    status_reason = f"Overdue by {days_overdue} days (was due on {calculated_due_date.isoformat()})"
                    overdue_count += 1
                else:
                    status = VaccinationStatus.DUE
                    status_reason = f"Currently due for administration (recommended on {calculated_due_date.isoformat()})"
                    due_count += 1

        schedule_items.append({
            "code": rule_code,
            "vaccine_code": rule.get("vaccine_code", rule_code),
            "series_code": rule_series,
            "name": rule.get("name", rule.get("vaccine_name", rule.get("full_name", ""))),
            "vaccine_name": rule.get("full_name", rule.get("name", rule.get("vaccine_name", ""))),
            "full_name": rule.get("full_name", rule.get("name", rule.get("vaccine_name", ""))),
            "target_disease": rule["target_disease"],
            "category": rule["category"],
            "dose_number": dose_number,
            "dose_name": rule["dose_name"],
            "recommended_age_display": rule["recommended_age_display"],
            "recommended_date": recommended_date,
            "calculated_due_date": calculated_due_date,
            "status": status,
            "administered_date": adm_date,
            "record_id": record_id,
            "status_reason": status_reason,
            "route": rule.get("route"),
            "site": rule.get("site"),
            "dose_amount": rule.get("dose_amount"),
            "is_conditional": rule.get("is_conditional", False),
            "condition_tag": rule.get("condition_tag"),
            "condition_description": rule.get("condition_description"),
            "source_guideline": rule.get("source_guideline"),
            "previous_dose_required": rule.get("previous_dose_required"),
            "minimum_interval_days": rule.get("minimum_interval_days"),
            "notes": rule.get("notes"),
            "catch_up_notes": rule.get("catch_up_notes"),
            "clinical_review_notes": rule.get("clinical_review_notes"),
        })

    # Sort schedule chronologically by calculated due date, then dose number
    schedule_items.sort(key=lambda item: (item["calculated_due_date"], item["dose_number"]))

    total_doses = len(schedule_items)
    completion_percentage = (
        round((completed_count / total_doses) * 100, 1) if total_doses > 0 else 0.0
    )

    return {
        "summary": {
            "total_doses": total_doses,
            "completed_count": completed_count,
            "due_count": due_count,
            "overdue_count": overdue_count,
            "upcoming_count": upcoming_count,
            "missed_count": missed_count,
            "catch_up_count": catch_up_count,
            "clinical_review_count": clinical_review_count,
            "completion_percentage": completion_percentage,
        },
        "schedule_items": schedule_items,
    }
