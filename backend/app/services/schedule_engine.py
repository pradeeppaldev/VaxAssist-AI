"""
Deterministic Vaccination Schedule Engine.
Produces reproducible schedule evaluations using clinical rules and member records.
Zero LLM dependencies.
"""
from datetime import date, timedelta
from typing import List, Dict, Any, Optional
from app.models.vaccination import VaccinationStatus
from app.services.schedule_catalog import STANDARD_VACCINATION_SCHEDULE


def calculate_member_schedule(
    date_of_birth: date,
    existing_records: List[Dict[str, Any]],
    reference_date: Optional[date] = None,
    catalog: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Deterministic calculation engine:
    Takes member DOB, administered records, reference date, and returns
    structured schedule items with exact due dates and statuses.
    """
    if reference_date is None:
        reference_date = date.today()

    if catalog is None:
        catalog = STANDARD_VACCINATION_SCHEDULE

    # Index existing records by (vaccine_code, dose_number)
    administered_map: Dict[tuple, Dict[str, Any]] = {}
    for rec in existing_records:
        code = str(rec.get("vaccine_code", "")).strip().upper()
        dose = int(rec.get("dose_number", 1))
        # Ensure administered_date is a date object
        adm_date = rec.get("administered_date")
        if isinstance(adm_date, str):
            adm_date = date.fromisoformat(adm_date)
        
        rec_copy = dict(rec)
        rec_copy["administered_date"] = adm_date
        administered_map[(code, dose)] = rec_copy

    schedule_items = []
    completed_count = 0
    due_count = 0
    overdue_count = 0
    upcoming_count = 0

    for rule in catalog:
        vaccine_code = rule["vaccine_code"].upper()
        dose_number = rule["dose_number"]
        recommended_offset = timedelta(days=rule["recommended_age_days"])
        recommended_date = date_of_birth + recommended_offset

        # Check if already administered
        record_key = (vaccine_code, dose_number)
        if record_key in administered_map:
            rec = administered_map[record_key]
            adm_date = rec["administered_date"]
            status = VaccinationStatus.COMPLETED
            status_reason = f"Administered on {adm_date.isoformat()}"
            record_id = str(rec.get("id") or rec.get("_id") or "")
            calculated_due_date = recommended_date
            completed_count += 1
        else:
            record_id = None
            adm_date = None

            # Calculate interval constraints from previous dose if required
            prev_req = rule.get("previous_dose_required")
            min_interval_days = rule.get("minimum_interval_days") or 0

            if prev_req and prev_req in administered_map:
                prev_rec = administered_map[prev_req]
                prev_adm_date = prev_rec["administered_date"]
                # Must be at least min_interval_days after previous dose was given
                interval_due_date = prev_adm_date + timedelta(days=min_interval_days)
                calculated_due_date = max(recommended_date, interval_due_date)
            else:
                calculated_due_date = recommended_date

            # Determine status based on reference date
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
            "vaccine_code": vaccine_code,
            "vaccine_name": rule["vaccine_name"],
            "target_disease": rule["target_disease"],
            "dose_number": dose_number,
            "dose_name": rule["dose_name"],
            "recommended_age_display": rule["recommended_age_display"],
            "recommended_date": recommended_date,
            "calculated_due_date": calculated_due_date,
            "status": status,
            "administered_date": adm_date,
            "record_id": record_id,
            "status_reason": status_reason,
            "category": rule["category"],
        })

    # Sort schedule by calculated due date, then dose number
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
            "completion_percentage": completion_percentage,
        },
        "schedule_items": schedule_items,
    }
