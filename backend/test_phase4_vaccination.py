"""
Automated end-to-end integration test suite for Phase 4:
Vaccination Management + Deterministic Vaccination Schedule Engine.
Runs against the live FastAPI backend with MongoDB Atlas.
"""
import sys
import time
from datetime import date, timedelta
import httpx

BASE_URL = "http://127.0.0.1:8000/api/v1"

def print_step(title):
    print(f"\n{'='*70}\n[TEST] {title}\n{'='*70}")

def test_phase4_suite():
    client = httpx.Client(base_url=BASE_URL, timeout=30.0)

    # 1. Health check & Atlas connectivity
    print_step("1. Health Check & Atlas Connectivity")
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["database"]["status"] == "connected"
    print("PASS: System & MongoDB Atlas are online.")

    # 2. Setup Patient A & Patient B
    print_step("2. Setting Up Patient A and Patient B")
    ts = int(time.time())
    email_a = f"vax_patient_a_{ts}@vaxassist.ai"
    email_b = f"vax_patient_b_{ts}@vaxassist.ai"

    # Patient A
    client.post("/auth/register", json={
        "name": "David Miller",
        "email": email_a,
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "PATIENT"
    })
    token_a = client.post("/auth/login", json={"email": email_a, "password": "Password123!"}).json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Patient B
    client.post("/auth/register", json={
        "name": "Claire Vance",
        "email": email_b,
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "PATIENT"
    })
    token_b = client.post("/auth/login", json={"email": email_b, "password": "Password123!"}).json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Patient A creates child member: born 10 weeks ago (~70 days)
    dob_child = (date.today() - timedelta(days=70)).isoformat()
    child_resp = client.post("/families/me/members", headers=headers_a, json={
        "full_name": "Tommy Miller",
        "date_of_birth": dob_child,
        "gender": "MALE",
        "relationship": "CHILD"
    })
    assert child_resp.status_code == 201
    child_id = child_resp.json()["data"]["id"]
    print(f"PASS: Created child member Tommy (ID: {child_id}, DOB: {dob_child}).")

    # 3. Validation: Future Administration Date
    print_step("3. Validation: Future Administration Date Rejection")
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    resp = client.post(f"/vaccinations/member/{child_id}", headers=headers_a, json={
        "vaccine_code": "BCG",
        "vaccine_name": "Bacillus Calmette-Guérin",
        "dose_number": 1,
        "administered_date": tomorrow
    })
    assert resp.status_code in [400, 422]
    print(f"PASS: Future administration date rejected with {resp.status_code}.")

    # 4. Validation: Administered Date Prior to Member DOB
    print_step("4. Validation: Date Prior to Member DOB Rejection")
    prior_dob = (date.today() - timedelta(days=100)).isoformat()
    resp = client.post(f"/vaccinations/member/{child_id}", headers=headers_a, json={
        "vaccine_code": "BCG",
        "vaccine_name": "Bacillus Calmette-Guérin",
        "dose_number": 1,
        "administered_date": prior_dob
    })
    assert resp.status_code == 400
    print("PASS: Administration date before DOB rejected with 400.")

    # 5. Record Creation: Birth Dose (BCG)
    print_step("5. Recording Valid Administered Doses (BCG & HepB)")
    resp_bcg = client.post(f"/vaccinations/member/{child_id}", headers=headers_a, json={
        "vaccine_code": "BCG",
        "vaccine_name": "Bacillus Calmette-Guérin",
        "dose_number": 1,
        "dose_name": "Birth Dose",
        "administered_date": dob_child,
        "healthcare_provider": "City Memorial Hospital",
        "batch_number": "BCG-2026-X1"
    })
    assert resp_bcg.status_code == 201
    bcg_rec_id = resp_bcg.json()["data"]["id"]
    print(f"PASS: Recorded BCG Birth Dose (ID: {bcg_rec_id}).")

    # 6. Duplicate Dose Rejection
    print_step("6. Validation: Duplicate Dose Rejection")
    resp_dup = client.post(f"/vaccinations/member/{child_id}", headers=headers_a, json={
        "vaccine_code": "BCG",
        "vaccine_name": "Bacillus Calmette-Guérin",
        "dose_number": 1,
        "administered_date": dob_child
    })
    assert resp_dup.status_code == 400
    print("PASS: Duplicate BCG dose 1 correctly rejected with 400.")

    # 7. Record Creation: 6-Week Dose (Penta-1)
    print_step("7. Recording 6-Week Vaccine (Penta-1)")
    penta1_date = (date.today() - timedelta(days=28)).isoformat()
    resp_penta = client.post(f"/vaccinations/member/{child_id}", headers=headers_a, json={
        "vaccine_code": "PENTA",
        "vaccine_name": "Pentavalent (DTP-HepB-Hib)",
        "dose_number": 1,
        "dose_name": "Dose 1",
        "administered_date": penta1_date,
        "healthcare_provider": "Pediatric Clinic North",
        "batch_number": "PEN-9942B"
    })
    assert resp_penta.status_code == 201
    penta1_rec_id = resp_penta.json()["data"]["id"]
    print(f"PASS: Recorded Penta-1 (ID: {penta1_rec_id}).")

    # 8. List Records for Member
    print_step("8. Listing Vaccination History for Member")
    resp_list = client.get(f"/vaccinations/member/{child_id}", headers=headers_a)
    assert resp_list.status_code == 200
    records = resp_list.json()["data"]
    assert len(records) == 2
    print(f"PASS: Retrieved {len(records)} records for Tommy.")

    # 9. Get and Update Individual Record
    print_step("9. Retrieve and Update Specific Vaccination Record")
    rec_detail = client.get(f"/vaccinations/records/{penta1_rec_id}", headers=headers_a)
    assert rec_detail.status_code == 200
    assert rec_detail.json()["data"]["batch_number"] == "PEN-9942B"

    rec_patch = client.patch(f"/vaccinations/records/{penta1_rec_id}", headers=headers_a, json={
        "notes": "Mild low-grade fever observed on day 1 post vaccination."
    })
    assert rec_patch.status_code == 200
    assert "low-grade fever" in rec_patch.json()["data"]["notes"]
    print("PASS: Updated record details successfully.")

    # 10. Deterministic Schedule Calculation Endpoint
    print_step("10. Testing Deterministic Schedule Calculation Endpoint")
    sched_resp = client.get(f"/vaccinations/member/{child_id}/schedule", headers=headers_a)
    if sched_resp.status_code != 200:
        print(f"FAILED sched_resp: status={sched_resp.status_code}, body={sched_resp.text}")
    assert sched_resp.status_code == 200
    sched_data = sched_resp.json()["data"]
    summary = sched_data["summary"]
    items = sched_data["schedule_items"]

    print("Schedule summary:", summary)
    assert summary["completed_count"] >= 2  # BCG and Penta-1 completed
    assert summary["completion_percentage"] > 0

    # Verify BCG is COMPLETED
    bcg_sched = next(i for i in items if i["vaccine_code"] == "BCG" and i["dose_number"] == 1)
    assert bcg_sched["status"] == "COMPLETED"
    assert bcg_sched["administered_date"] == dob_child

    # Verify Penta-1 is COMPLETED
    penta1_sched = next(i for i in items if (i["vaccine_code"] == "PENTA_1" or i.get("series_code") == "PENTA") and i["dose_number"] == 1)
    assert penta1_sched["status"] == "COMPLETED"

    # Verify HepB Birth Dose is MISSED (infant is 70 days old; target is strictly within 24 hours)
    hepb_sched = next(i for i in items if i["vaccine_code"] == "HEPB_BIRTH" or (i.get("series_code") == "HEPB") and i["dose_number"] == 1)
    assert hepb_sched["status"] == "MISSED"
    assert "strictly within 24 hours" in hepb_sched["status_reason"]

    # Verify Penta-2 is evaluated with sequence and interval awareness
    penta2_sched = next(i for i in items if (i["vaccine_code"] == "PENTA_2" or i.get("series_code") == "PENTA") and i["dose_number"] == 2)
    assert penta2_sched["status"] in ["DUE", "UPCOMING", "OVERDUE"]

    print("PASS: Deterministic schedule correctly categorized COMPLETED, MISSED, and DUE doses.")

    # 11. IDOR & Cross-User Security Check
    print_step("11. IDOR & Cross-User Security Check (Patient B vs Patient A Data)")
    # Patient B attempts to get Tommy's records
    resp_b_recs = client.get(f"/vaccinations/member/{child_id}", headers=headers_b)
    assert resp_b_recs.status_code == 404

    # Patient B attempts to get Tommy's schedule
    resp_b_sched = client.get(f"/vaccinations/member/{child_id}/schedule", headers=headers_b)
    assert resp_b_sched.status_code == 404

    # Patient B attempts to add record to Tommy
    resp_b_add = client.post(f"/vaccinations/member/{child_id}", headers=headers_b, json={
        "vaccine_code": "OPV",
        "vaccine_name": "Oral Polio",
        "dose_number": 1,
        "administered_date": dob_child
    })
    assert resp_b_add.status_code == 404

    # Patient B attempts to delete Tommy's BCG record
    resp_b_del = client.delete(f"/vaccinations/records/{bcg_rec_id}", headers=headers_b)
    assert resp_b_del.status_code == 404

    print("PASS: Cross-user access strictly blocked with 404. Zero IDOR leakage.")

    # 12. Delete Vaccination Record
    print_step("12. Deleting a Vaccination Record and Recalculating Schedule")
    del_resp = client.delete(f"/vaccinations/records/{bcg_rec_id}", headers=headers_a)
    assert del_resp.status_code == 200

    # Verify BCG record is gone
    check_del = client.get(f"/vaccinations/records/{bcg_rec_id}", headers=headers_a)
    assert check_del.status_code == 404

    # Re-check schedule: BCG should no longer be COMPLETED!
    sched_resp_after = client.get(f"/vaccinations/member/{child_id}/schedule", headers=headers_a)
    bcg_after = next(i for i in sched_resp_after.json()["data"]["schedule_items"] if i["vaccine_code"] == "BCG" and i["dose_number"] == 1)
    assert bcg_after["status"] != "COMPLETED"
    print("PASS: Record deleted; schedule dynamically reflects status change.")

    print_step("ALL PHASE 4 INTEGRATION & SECURITY TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    try:
        test_phase4_suite()
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"\nPHASE 4 TEST FAILED: {e}")
        sys.exit(1)
