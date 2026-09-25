"""
Comprehensive unit tests for the Deterministic Vaccination Schedule Engine.
Validates authoritative MoHFW UIP/NIS schedule rules, 24h HepB birth dose cutoffs,
OPV-0 15d cutoff, fIPV-3 9-month inclusion, JE conditional logic, and private vaccine classifications.
"""
import sys
from datetime import date, timedelta
from app.services.schedule_engine import calculate_member_schedule
from app.services.schedule_catalog import (
    UNIVERSAL_NIS_SCHEDULE,
    CONDITIONAL_NIS_SCHEDULE,
    PRIVATE_OPTIONAL_SCHEDULE,
    get_catalog,
)
from app.models.vaccination import VaccinationStatus, VaccineCategory


def test_schedule_engine_suite():
    print("=" * 70)
    print("RUNNING AUTHORITATIVE VACCINATION SCHEDULE ENGINE TESTS")
    print("=" * 70)

    # -------------------------------------------------------------------------
    # 1. Universal Newborn Schedule (DOB = Today)
    # -------------------------------------------------------------------------
    print("\n--- 1. Testing Universal Newborn Schedule (DOB = Today) ---")
    today = date(2026, 9, 25)
    result = calculate_member_schedule(date_of_birth=today, existing_records=[], reference_date=today)
    summary = result["summary"]
    items = result["schedule_items"]

    assert summary["total_doses"] == 25, f"Expected 25 universal child doses, got {summary['total_doses']}"
    assert summary["completed_count"] == 0
    assert summary["due_count"] >= 3  # BCG, HepB Birth, OPV-0

    # Verify BCG
    bcg = next(i for i in items if i["code"] == "BCG")
    assert bcg["status"] == VaccinationStatus.DUE
    assert bcg["category"] == VaccineCategory.UNIVERSAL_NIS.value
    assert bcg["route"] == "Intradermal"
    assert bcg["site"] == "Left upper arm"

    # Verify Hepatitis B Birth Dose
    hepb = next(i for i in items if i["code"] == "HEPB_BIRTH")
    assert hepb["status"] == VaccinationStatus.DUE
    assert hepb["route"] == "Intramuscular"
    assert hepb["site"] == "Anterolateral mid-thigh, left"
    assert hepb["dose_amount"] == "0.5 mL"

    # Verify OPV-0
    opv0 = next(i for i in items if i["code"] == "OPV_0")
    assert opv0["status"] == VaccinationStatus.DUE
    assert opv0["route"] == "Oral"
    assert opv0["dose_amount"] == "2 drops"

    # Verify future doses are UPCOMING
    penta1 = next(i for i in items if i["code"] == "PENTA_1")
    assert penta1["status"] == VaccinationStatus.UPCOMING
    assert penta1["calculated_due_date"] == today + timedelta(days=42)

    print("PASS: Universal newborn evaluated with timely birth doses DUE and future doses UPCOMING.")

    # -------------------------------------------------------------------------
    # 2. HepB Birth Dose <24h Window & Missed Status
    # -------------------------------------------------------------------------
    print("\n--- 2. Testing Strict 24h Window for Hepatitis B Birth Dose ---")
    # Case A: Infant is 2 days old (48 hours), HepB was NOT given
    dob_2d = today - timedelta(days=2)
    res_2d = calculate_member_schedule(date_of_birth=dob_2d, existing_records=[], reference_date=today)
    hepb_2d = next(i for i in res_2d["schedule_items"] if i["code"] == "HEPB_BIRTH")

    assert hepb_2d["status"] == VaccinationStatus.MISSED, f"Expected MISSED, got {hepb_2d['status']}"
    assert "strictly within 24 hours" in hepb_2d["status_reason"]
    assert "Pentavalent" in hepb_2d["status_reason"]
    print("PASS: HepB birth dose unadministered after 24h strictly categorized as MISSED (not overdue).")

    # -------------------------------------------------------------------------
    # 3. OPV-0 15-Day Window & Missed Status
    # -------------------------------------------------------------------------
    print("\n--- 3. Testing 15-Day Window for OPV Zero Dose ---")
    dob_20d = today - timedelta(days=20)
    res_20d = calculate_member_schedule(date_of_birth=dob_20d, existing_records=[], reference_date=today)
    opv0_20d = next(i for i in res_20d["schedule_items"] if i["code"] == "OPV_0")

    assert opv0_20d["status"] == VaccinationStatus.MISSED, f"Expected MISSED, got {opv0_20d['status']}"
    assert "within 15 days of birth" in opv0_20d["status_reason"]
    print("PASS: OPV-0 unadministered after 15 days categorized as MISSED.")

    # -------------------------------------------------------------------------
    # 4. Verifying fIPV-3 Inclusion at 9 Months
    # -------------------------------------------------------------------------
    print("\n--- 4. Testing Fractional IPV-3 (fIPV-3) at 9 Months (2023 Update) ---")
    fipv3 = next(i for i in items if i["code"] == "FIPV_3")
    assert fipv3 is not None
    assert fipv3["recommended_age_display"] == "9–12 Months"
    assert fipv3["category"] == VaccineCategory.UNIVERSAL_NIS.value
    assert fipv3["route"] == "Intradermal"
    assert fipv3["site"] == "Left upper arm"
    assert fipv3["dose_amount"] == "0.1 mL"
    assert fipv3["previous_dose_required"] == ("FIPV_2", 2)
    print("PASS: Fractional IPV-3 (9 months) confirmed present in Universal NIS.")

    # -------------------------------------------------------------------------
    # 5. Verifying MR-1 & MR-2 (Measles-Rubella, NOT MMR) in Universal NIS
    # -------------------------------------------------------------------------
    print("\n--- 5. Testing Measles-Rubella (MR) vs MMR Distinction ---")
    mr1 = next(i for i in items if i["code"] == "MR_1")
    assert mr1["vaccine_code"] == "MR_1"
    assert "Measles-Rubella" in mr1["full_name"]
    assert mr1["category"] == VaccineCategory.UNIVERSAL_NIS.value
    assert mr1["route"] == "Subcutaneous"

    mr2 = next(i for i in items if i["code"] == "MR_2")
    assert mr2["vaccine_code"] == "MR_2"
    assert mr2["recommended_age_display"] == "16–24 Months"

    # Verify MMR is NOT in universal schedule
    assert not any(i["code"] == "MMR" and i["category"] == VaccineCategory.UNIVERSAL_NIS.value for i in items)
    print("PASS: MR-1 and MR-2 strictly verified in Universal NIS. MMR not confused with MR.")

    # -------------------------------------------------------------------------
    # 6. Verifying Td-10 and Td-16 (NOT Tdap) in Universal NIS
    # -------------------------------------------------------------------------
    print("\n--- 6. Testing Td-10 and Td-16 vs Tdap Distinction ---")
    td10 = next(i for i in items if i["code"] == "TD_10Y")
    assert td10["category"] == VaccineCategory.UNIVERSAL_NIS.value
    assert "Tetanus and adult Diphtheria" in td10["full_name"]

    td16 = next(i for i in items if i["code"] == "TD_16Y")
    assert td16["category"] == VaccineCategory.UNIVERSAL_NIS.value

    # Verify TDAP is NOT in universal schedule
    assert not any(i["code"] == "TDAP" and i["category"] == VaccineCategory.UNIVERSAL_NIS.value for i in items)
    print("PASS: Td-10 and Td-16 verified in Universal NIS. Tdap preserved for private sector.")

    # -------------------------------------------------------------------------
    # 7. Testing Conditional Japanese Encephalitis (JE) Logic & 28-Day Interval
    # -------------------------------------------------------------------------
    print("\n--- 7. Testing Conditional JE Logic (Endemic Districts Only) & 28-Day Interval ---")
    # Universal child schedule does NOT include JE by default
    assert not any(i["code"] == "JE_1" for i in items), "JE should not be universally present by default"

    # Child residing in endemic district (eligible_for_je = True)
    res_je = calculate_member_schedule(date_of_birth=today, existing_records=[], reference_date=today, eligible_for_je=True)
    items_je = res_je["schedule_items"]

    je1 = next(i for i in items_je if i["code"] == "JE_1")
    assert je1["category"] == VaccineCategory.CONDITIONAL_NIS.value
    assert je1["is_conditional"] is True
    assert je1["condition_tag"] == "eligible_for_je"
    assert je1["recommended_age_display"] == "9–12 Months"

    je2 = next(i for i in items_je if i["code"] == "JE_2")
    assert je2["category"] == VaccineCategory.CONDITIONAL_NIS.value
    assert je2["recommended_age_display"] == "16–24 Months"
    assert je2["minimum_interval_days"] == 28, f"Expected 28-day minimum interval for delayed JE-2, got {je2['minimum_interval_days']}"
    print("PASS: JE-1 and JE-2 verified with authoritative recommended ages and 28-day minimum interval (MoHFW/ITSU).")

    # Testing delayed JE-1 interval shift for JE-2
    dob_je = date(2024, 1, 1)
    # JE-1 administered late at 18 months (approx 550 days)
    adm_je1 = dob_je + timedelta(days=550)
    records_je = [{
        "vaccine_code": "JE_1",
        "dose_number": 1,
        "administered_date": adm_je1,
        "id": "rec_je1"
    }]
    ref_je = adm_je1 + timedelta(days=5)
    res_je_shift = calculate_member_schedule(dob_je, records_je, ref_je, eligible_for_je=True)
    je2_shifted = next(i for i in res_je_shift["schedule_items"] if i["code"] == "JE_2")
    expected_je2_due = adm_je1 + timedelta(days=28)
    assert je2_shifted["calculated_due_date"] == expected_je2_due, f"Expected {expected_je2_due}, got {je2_shifted['calculated_due_date']}"
    print("PASS: Delayed JE-1 correctly shifts JE-2 due date by verified 28-day minimum interval.")

    # -------------------------------------------------------------------------
    # 7b. Testing Source-Grounded MISSED vs CATCH_UP vs CLINICAL_REVIEW
    # -------------------------------------------------------------------------
    print("\n--- 7b. Testing Source-Grounded MISSED vs CATCH_UP vs CLINICAL_REVIEW ---")
    # Case: 14-month-old infant (~425 days old) with NO prior vaccinations
    dob_14m = today - timedelta(days=425)
    res_14m = calculate_member_schedule(date_of_birth=dob_14m, existing_records=[], reference_date=today)
    items_14m = res_14m["schedule_items"]

    # 1. HepB Birth Dose: Strictly MISSED past 24h
    hepb_14m = next(i for i in items_14m if i["code"] == "HEPB_BIRTH")
    assert hepb_14m["status"] == VaccinationStatus.MISSED
    assert "Pentavalent" in hepb_14m["status_reason"]

    # 2. OPV-0: Strictly MISSED past 15 days
    opv0_14m = next(i for i in items_14m if i["code"] == "OPV_0")
    assert opv0_14m["status"] == VaccinationStatus.MISSED

    # 3. Rotavirus: Strictly MISSED past 1 year (cannot be initiated/continued after 1 year)
    rota1_14m = next(i for i in items_14m if i["code"] == "ROTA_1")
    assert rota1_14m["status"] == VaccinationStatus.MISSED
    assert "Rotavirus vaccination window expired" in rota1_14m["status_reason"]

    # 4. Pentavalent-1: CATCH_UP_REQUIRED (NOT MISSED! Under UIP, replaced by DPT + standalone HepB)
    penta1_14m = next(i for i in items_14m if i["code"] == "PENTA_1")
    assert penta1_14m["status"] == VaccinationStatus.CATCH_UP_REQUIRED, f"Expected CATCH_UP_REQUIRED, got {penta1_14m['status']}"
    assert "DPT" in penta1_14m["status_reason"]
    assert "Hepatitis B" in penta1_14m["status_reason"]

    # 5. BCG: CLINICAL_REVIEW past 1 year (requires Mantoux tuberculin test)
    bcg_14m = next(i for i in items_14m if i["code"] == "BCG")
    assert bcg_14m["status"] == VaccinationStatus.CLINICAL_REVIEW, f"Expected CLINICAL_REVIEW, got {bcg_14m['status']}"
    assert "Mantoux" in bcg_14m["status_reason"]

    print("PASS: 14-month infant correctly evaluated: HepB/OPV-0/Rota MISSED, Penta CATCH_UP_REQUIRED, BCG CLINICAL_REVIEW.")

    # Case: 8-year-old child (~2920 days old)
    dob_8y = today - timedelta(days=2920)
    res_8y = calculate_member_schedule(date_of_birth=dob_8y, existing_records=[], reference_date=today)
    items_8y = res_8y["schedule_items"]

    # DPT Booster-2 (>7 years): whole-cell pertussis contraindicated, catch-up with adult Td
    dpt_8y = next(i for i in items_8y if i["code"] == "DPT_BOOSTER_2")
    assert dpt_8y["status"] == VaccinationStatus.CATCH_UP_REQUIRED
    assert "contraindicated" in dpt_8y["status_reason"]

    # MR-1 (>5 years routine, but catch-up up to 15 years in MoHFW/WHO campaign)
    mr1_8y = next(i for i in items_8y if i["code"] == "MR_1")
    assert mr1_8y["status"] == VaccinationStatus.CATCH_UP_REQUIRED
    assert "15 years" in mr1_8y["status_reason"]

    print("PASS: 8-year child correctly evaluated: DPT Booster and MR-1 designated CATCH_UP_REQUIRED.")

    # Case: 18-year-old adolescent / adult (~6600 days old, past 365-day grace period)
    dob_18y = today - timedelta(days=6600)
    res_18y = calculate_member_schedule(date_of_birth=dob_18y, existing_records=[], reference_date=today)
    items_18y = res_18y["schedule_items"]

    # Td-16: Has NO arbitrary maximum age cutoff! Must NOT be falsely marked MISSED
    td16_18y = next(i for i in items_18y if i["code"] == "TD_16Y")
    assert td16_18y["status"] == VaccinationStatus.OVERDUE, f"Expected OVERDUE for adult Td, got {td16_18y['status']}"
    assert td16_18y["status"] != VaccinationStatus.MISSED
    print("PASS: 18-year individual evaluates Td-16 as OVERDUE, never permanently MISSED.")

    # -------------------------------------------------------------------------
    # 8. Testing Private / Optional Vaccines Classification
    # -------------------------------------------------------------------------
    print("\n--- 8. Testing Private / Optional Vaccine Classification ---")
    res_private = calculate_member_schedule(date_of_birth=today, existing_records=[], reference_date=today, include_private_optional=True)
    priv_items = [i for i in res_private["schedule_items"] if i["category"] == VaccineCategory.PRIVATE_OPTIONAL.value]

    priv_codes = {i["code"] for i in priv_items}
    expected_private = {"MMR", "TDAP", "TYPHOID", "VARICELLA", "HEPA", "HPV", "INFLUENZA"}
    assert expected_private.issubset(priv_codes), f"Missing private vaccines: {expected_private - priv_codes}"

    # Verify Influenza has recurring annual property
    flu = next(i for i in priv_items if i["code"] == "INFLUENZA")
    assert "Annual" in flu["recommended_age_display"]
    print("PASS: Private/optional vaccines (MMR, Tdap, Typhoid, Varicella, HepA, HPV, Influenza) classified correctly.")

    # -------------------------------------------------------------------------
    # 9. Dynamic Minimum Interval Shift
    # -------------------------------------------------------------------------
    print("\n--- 9. Testing Dynamic Minimum Interval Shift ---")
    dob = date(2026, 1, 1)
    # Penta-1 given late on day 70 (recommended: day 42)
    adm_date_penta1 = dob + timedelta(days=70)
    records = [{
        "vaccine_code": "PENTA_1",
        "dose_number": 1,
        "administered_date": adm_date_penta1,
        "id": "rec_penta1"
    }]
    ref_date = dob + timedelta(days=75)
    res_shift = calculate_member_schedule(dob, records, ref_date)

    penta2 = next(i for i in res_shift["schedule_items"] if i["code"] == "PENTA_2")
    expected_due = adm_date_penta1 + timedelta(days=28)
    assert penta2["calculated_due_date"] == expected_due
    assert penta2["status"] == VaccinationStatus.UPCOMING
    print("PASS: Late Penta-1 correctly shifted Penta-2 due date by minimum interval.")

    # -------------------------------------------------------------------------
    # 10. Multi-Format Record Matching (Backwards Compatibility)
    # -------------------------------------------------------------------------
    print("\n--- 10. Testing Multi-Format Record Matching ---")
    # Test record saved as legacy "PENTA" with dose_number 1
    legacy_recs = [
        {"vaccine_code": "BCG", "dose_number": 1, "administered_date": dob},
        {"vaccine_code": "HEPB", "dose_number": 1, "administered_date": dob},
        {"vaccine_code": "PENTA", "dose_number": 1, "administered_date": dob + timedelta(days=42)},
    ]
    res_legacy = calculate_member_schedule(dob, legacy_recs, dob + timedelta(days=50))
    items_legacy = res_legacy["schedule_items"]

    assert next(i for i in items_legacy if i["code"] == "BCG")["status"] == VaccinationStatus.COMPLETED
    assert next(i for i in items_legacy if i["code"] == "HEPB_BIRTH")["status"] == VaccinationStatus.COMPLETED
    assert next(i for i in items_legacy if i["code"] == "PENTA_1")["status"] == VaccinationStatus.COMPLETED
    print("PASS: Legacy codes ('HEPB', 'PENTA', 'BCG') match normalized catalog entries seamlessly.")

    # -------------------------------------------------------------------------
    # 11. Pure Determinism & Reproducibility
    # -------------------------------------------------------------------------
    print("\n--- 11. Testing Pure Determinism (Zero Randomness / Zero LLM) ---")
    res_a = calculate_member_schedule(dob, records, ref_date)
    res_b = calculate_member_schedule(dob, records, ref_date)
    assert res_a == res_b
    print("PASS: Identical inputs produce 100% identical schedule output.")

    print("\n" + "=" * 70)
    print("ALL SCHEDULE ENGINE UNIT TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    try:
        test_schedule_engine_suite()
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"\nTEST SUITE FAILED: {e}")
        sys.exit(1)
