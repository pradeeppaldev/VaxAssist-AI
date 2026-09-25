"""
Unit tests for the Deterministic Vaccination Schedule Engine.
Tests medical rules, boundary dates, age calculations, and interval shifts.
"""
import sys
from datetime import date, timedelta
from app.services.schedule_engine import calculate_member_schedule
from app.models.vaccination import VaccinationStatus

def test_engine():
    print("\n--- 1. Testing Newborn Schedule (DOB = Today) ---")
    today = date(2026, 9, 25)
    result = calculate_member_schedule(date_of_birth=today, existing_records=[], reference_date=today)
    summary = result["summary"]
    items = result["schedule_items"]

    assert summary["total_doses"] > 0
    assert summary["completed_count"] == 0
    assert summary["due_count"] >= 3  # BCG, HepB, OPV-0 are due at birth

    bcg_item = next(i for i in items if i["vaccine_code"] == "BCG" and i["dose_number"] == 1)
    assert bcg_item["status"] == VaccinationStatus.DUE
    assert bcg_item["calculated_due_date"] == today

    penta_item = next(i for i in items if i["vaccine_code"] == "PENTA" and i["dose_number"] == 1)
    assert penta_item["status"] == VaccinationStatus.UPCOMING
    assert penta_item["calculated_due_date"] == today + timedelta(days=42)
    print("PASS: Newborn correctly evaluated with birth doses DUE and future doses UPCOMING.")

    print("\n--- 2. Testing Infant at 12 Weeks (No Vaccines Administered) ---")
    dob_12w = today - timedelta(days=84)
    result_12w = calculate_member_schedule(date_of_birth=dob_12w, existing_records=[], reference_date=today)
    items_12w = result_12w["schedule_items"]

    # HepB birth dose (grace period 30 days) should now be OVERDUE
    hepb_birth = next(i for i in items_12w if i["vaccine_code"] == "HEPB" and i["dose_number"] == 1)
    assert hepb_birth["status"] == VaccinationStatus.OVERDUE
    assert "Overdue by" in hepb_birth["status_reason"]

    # 6-week Penta-1 was due at 42 days; today is 84 days. Grace is 28 days (42+28=70). So it is OVERDUE!
    penta_1 = next(i for i in items_12w if i["vaccine_code"] == "PENTA" and i["dose_number"] == 1)
    assert penta_1["status"] == VaccinationStatus.OVERDUE

    print("PASS: Overdue doses accurately detected based on grace periods.")

    print("\n--- 3. Testing Minimum Interval Shift (Dose 1 Given Late) ---")
    # Child born on 2026-01-01.
    dob = date(2026, 1, 1)
    # Penta-1 is recommended at 42 days (2026-02-12).
    # Suppose child got Penta-1 late at day 70 (2026-03-12).
    adm_date_penta1 = dob + timedelta(days=70)
    records = [{
        "vaccine_code": "PENTA",
        "dose_number": 1,
        "administered_date": adm_date_penta1,
        "id": "rec_penta1"
    }]

    # Reference date is day 75 (2026-03-17)
    ref_date = dob + timedelta(days=75)
    result_shift = calculate_member_schedule(date_of_birth=dob, existing_records=records, reference_date=ref_date)
    items_shift = result_shift["schedule_items"]

    penta_1_res = next(i for i in items_shift if i["vaccine_code"] == "PENTA" and i["dose_number"] == 1)
    assert penta_1_res["status"] == VaccinationStatus.COMPLETED
    assert penta_1_res["administered_date"] == adm_date_penta1

    penta_2_res = next(i for i in items_shift if i["vaccine_code"] == "PENTA" and i["dose_number"] == 2)
    # Penta-2 recommended date was 70 days, but because Penta-1 was given on day 70,
    # the minimum interval of 28 days must push Penta-2 due date to day 70 + 28 = 98 days!
    expected_due = adm_date_penta1 + timedelta(days=28)
    assert penta_2_res["calculated_due_date"] == expected_due, f"Expected {expected_due}, got {penta_2_res['calculated_due_date']}"
    assert penta_2_res["status"] == VaccinationStatus.UPCOMING
    print("PASS: Dynamic minimum interval shift correctly adjusted Dose 2 due date.")

    print("\n--- 4. Testing Pure Determinism (Same Input = Identical Output) ---")
    res_a = calculate_member_schedule(dob, records, ref_date)
    res_b = calculate_member_schedule(dob, records, ref_date)
    assert res_a == res_b
    print("PASS: Schedule calculation is 100% deterministic and reproducible.")

if __name__ == "__main__":
    try:
        test_engine()
        print("\nALL SCHEDULE ENGINE UNIT TESTS PASSED!")
    except Exception as e:
        print(f"\nENGINE TEST FAILED: {e}")
        sys.exit(1)
