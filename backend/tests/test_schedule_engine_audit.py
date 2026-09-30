"""
Comprehensive Schedule Engine & Clinical UIP Rule Audit Tests.
Verifies temporal classification, dose alias resolution, prerequisite cascades,
and birth-dose validity constraints according to Indian UIP standards.
"""
from datetime import date, timedelta
import pytest

from app.services.schedule_engine import calculate_member_schedule
from app.models.vaccination import VaccinationStatus


def test_aarav_sharma_dpt_booster_overdue():
    """
    Aarav Sharma:
    DOB: 2020-07-10 (Age 6 years on 2026-10-01).
    Administered DPT Booster 1 on 2022-01-20 (at ~18 months).
    DPT Booster 2 is recommended at age 5-6 years (due 2026-07-10).
    On reference_date 2026-10-01:
    - DPT Booster 1 must be COMPLETED.
    - DPT Booster 2 must be OVERDUE (not masked as UPCOMING).
    """
    dob = date(2020, 7, 10)
    ref_date = date(2026, 10, 1)

    existing_records = [
        # Primary series
        {"vaccine_code": "BCG", "dose_number": 1, "administered_date": date(2020, 7, 12)},
        {"vaccine_code": "HEPB_BIRTH", "dose_number": 1, "administered_date": date(2020, 7, 11)},
        {"vaccine_code": "OPV_0", "dose_number": 0, "administered_date": date(2020, 7, 12)},
        {"vaccine_code": "PENTA_1", "dose_number": 1, "administered_date": date(2020, 8, 22)},
        {"vaccine_code": "PENTA_2", "dose_number": 2, "administered_date": date(2020, 9, 20)},
        {"vaccine_code": "PENTA_3", "dose_number": 3, "administered_date": date(2020, 10, 25)},
        {"vaccine_code": "MR_1", "dose_number": 1, "administered_date": date(2021, 4, 15)},
        # Booster 1 with alias DPT_BOOSTER
        {"vaccine_code": "DPT_BOOSTER", "dose_number": 1, "administered_date": date(2022, 1, 20)},
        {"vaccine_code": "MR_2", "dose_number": 2, "administered_date": date(2022, 1, 20)},
    ]

    result = calculate_member_schedule(
        date_of_birth=dob,
        existing_records=existing_records,
        reference_date=ref_date,
    )

    items = result["schedule_items"]
    items_by_code = {item["vaccine_code"]: item for item in items}

    # Verify DPT Booster 1 is completed
    assert "DPT_BOOSTER_1" in items_by_code
    assert items_by_code["DPT_BOOSTER_1"]["status"] == VaccinationStatus.COMPLETED.value

    # Verify DPT Booster 2 is strictly OVERDUE
    assert "DPT_BOOSTER_2" in items_by_code
    dpt2 = items_by_code["DPT_BOOSTER_2"]
    assert dpt2["status"] == VaccinationStatus.OVERDUE.value, f"Expected OVERDUE, got {dpt2['status']}"
    assert dpt2["calculated_due_date"] == date(2025, 7, 9)
    assert dpt2["days_overdue"] == (ref_date - date(2025, 7, 9)).days


def test_ananya_sharma_14_week_milestone_overdue():
    """
    Ananya Sharma:
    DOB: 2026-06-12 (Age 15 weeks / 111 days on 2026-10-01).
    Birth, 6w, 10w completed.
    14w milestone (Pentavalent 3, OPV 3, Rotavirus 3) due 2026-09-18 (98 days from DOB).
    On 2026-10-01 (13 days later), all 14-week doses must be OVERDUE.
    """
    dob = date(2026, 6, 12)
    ref_date = date(2026, 10, 1)

    existing_records = [
        {"vaccine_code": "BCG", "dose_number": 1, "administered_date": date(2026, 6, 13)},
        {"vaccine_code": "HEPB_BIRTH", "dose_number": 1, "administered_date": date(2026, 6, 13)},
        {"vaccine_code": "OPV_0", "dose_number": 0, "administered_date": date(2026, 6, 13)},
        {"vaccine_code": "PENTA_1", "dose_number": 1, "administered_date": date(2026, 7, 24)},
        {"vaccine_code": "OPV_1", "dose_number": 1, "administered_date": date(2026, 7, 24)},
        {"vaccine_code": "ROTA_1", "dose_number": 1, "administered_date": date(2026, 7, 24)},
        {"vaccine_code": "PENTA_2", "dose_number": 2, "administered_date": date(2026, 8, 21)},
        {"vaccine_code": "OPV_2", "dose_number": 2, "administered_date": date(2026, 8, 21)},
        {"vaccine_code": "ROTA_2", "dose_number": 2, "administered_date": date(2026, 8, 21)},
    ]

    result = calculate_member_schedule(
        date_of_birth=dob,
        existing_records=existing_records,
        reference_date=ref_date,
    )

    items = result["schedule_items"]
    items_by_code = {item["vaccine_code"]: item for item in items}

    # 14-week milestone doses must be OVERDUE
    for code in ["PENTA_3", "OPV_3", "ROTA_3"]:
        assert code in items_by_code, f"Missing {code} in schedule"
        item = items_by_code[code]
        assert item["status"] == VaccinationStatus.OVERDUE.value, f"{code} expected OVERDUE, got {item['status']}"
        assert item["calculated_due_date"] == date(2026, 9, 18)
        assert item["days_overdue"] == 13

    # Subsequent doses (e.g. MR 1 at 9 months) must be UPCOMING
    assert items_by_code["MR_1"]["status"] == VaccinationStatus.UPCOMING.value


def test_sequential_dose_prerequisite_cascade():
    """
    If Dose 1 is unadministered and overdue, Dose 2 and Dose 3 must NOT be marked
    as overdue infant dates. They must cascade forward to reference_date + min_wait
    and remain UPCOMING.
    """
    dob = date(2026, 1, 1)
    ref_date = date(2026, 10, 1)

    # Completely unvaccinated child at 9 months
    result = calculate_member_schedule(
        date_of_birth=dob,
        existing_records=[],
        reference_date=ref_date,
    )

    items = result["schedule_items"]
    items_by_code = {item["vaccine_code"]: item for item in items}

    # Penta 1 was due at 6 weeks (Feb 12) -> OVERDUE
    assert items_by_code["PENTA_1"]["status"] == VaccinationStatus.OVERDUE.value

    # Penta 2 requires Penta 1 with min interval of 28 days
    # Its calculated due date must cascade to ref_date + 28 days = 2026-10-29
    penta2 = items_by_code["PENTA_2"]
    assert penta2["calculated_due_date"] == ref_date + timedelta(days=28)
    assert penta2["status"] == VaccinationStatus.UPCOMING.value

    # Penta 3 cascades after Penta 2 (+ 28 more days) -> UPCOMING
    penta3 = items_by_code["PENTA_3"]
    assert penta3["calculated_due_date"] == ref_date + timedelta(days=56)
    assert penta3["status"] == VaccinationStatus.UPCOMING.value


def test_birth_dose_expiry_constraints():
    """
    Verify strict UIP temporal cutoffs:
    - HepB Birth Dose: strictly <= 24 hours. If missed past 24h -> MISSED.
    - OPV-0: strictly <= 15 days. If missed past 15 days -> MISSED.
    """
    dob = date(2026, 6, 1)
    ref_date = date(2026, 10, 1)  # 4 months old, no birth doses given

    result = calculate_member_schedule(
        date_of_birth=dob,
        existing_records=[],
        reference_date=ref_date,
    )

    items = result["schedule_items"]
    items_by_code = {item["vaccine_code"]: item for item in items}

    # HepB Birth Dose must be MISSED
    assert items_by_code["HEPB_BIRTH"]["status"] == VaccinationStatus.MISSED.value
    assert "24 hours" in items_by_code["HEPB_BIRTH"]["status_reason"]

    # OPV-0 must be MISSED
    assert items_by_code["OPV_0"]["status"] == VaccinationStatus.MISSED.value
    assert "15 days" in items_by_code["OPV_0"]["status_reason"]
