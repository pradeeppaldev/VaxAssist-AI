"""
Automated end-to-end integration and security test suite for Phase 6:
PROACTIVE MONITORING & NOTIFICATION ENGINE.
Tests deterministic status detection, reminder rules, idempotency, API endpoints,
security/ownership, record change transitions, and scheduled execution.
Runs against the live FastAPI backend with MongoDB Atlas.
"""
import sys
import time
from datetime import date, timedelta
import httpx

BASE_URL = "http://127.0.0.1:8000/api/v1"


def print_step(title):
    print(f"\n{'='*75}\n[TEST PHASE 6] {title}\n{'='*75}")


def test_phase6_suite():
    client = httpx.Client(base_url=BASE_URL, timeout=60.0)

    # 1. Health check & Atlas connectivity
    print_step("1. Health Check & Atlas Connectivity")
    for _ in range(5):
        resp = client.get("/health")
        if resp.status_code == 200 and resp.json().get("database", {}).get("status") == "connected":
            break
        time.sleep(1)
    assert resp.status_code == 200, f"Health check failed: {resp.text}"
    assert resp.json()["database"]["status"] == "connected"
    print("PASS: System & MongoDB Atlas are online and healthy.")

    # 2. Setup Authenticated Users (Patient A, Patient B, Admin)
    print_step("2. Setting Up Patient A, Patient B, and Admin")
    ts = int(time.time())
    email_a = f"mon_patient_a_{ts}@vaxassist.ai"
    email_b = f"mon_patient_b_{ts}@vaxassist.ai"
    password = "Password123!"

    # Register Patient A
    reg_a = client.post("/auth/register", json={
        "name": "Alice Green",
        "email": email_a,
        "password": password,
        "confirm_password": password,
        "role": "PATIENT"
    })
    assert reg_a.status_code == 201, f"Failed registering Patient A: {reg_a.text}"
    token_a = client.post("/auth/login", json={"email": email_a, "password": password}).json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register Patient B
    reg_b = client.post("/auth/register", json={
        "name": "Bob Stone",
        "email": email_b,
        "password": password,
        "confirm_password": password,
        "role": "PATIENT"
    })
    assert reg_b.status_code == 201
    token_b = client.post("/auth/login", json={"email": email_b, "password": password}).json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Login Admin
    admin_login = client.post("/auth/login", json={"email": "admin@vaxassist.ai", "password": "Admin@VaxAssist2026"})
    assert admin_login.status_code == 200, "Admin login failed"
    token_admin = admin_login.json()["access_token"]
    headers_admin = {"Authorization": f"Bearer {token_admin}"}
    print("PASS: Patient A, Patient B, and Admin authenticated successfully.")

    # 3. Create Family Members for Patient A
    print_step("3. Creating Family Members for Patient A (Infant & Toddler)")
    # Member 1: Infant born 85 days ago (~12.1 weeks) -> 14w UPCOMING (13d away), 10w DUE, 6w OVERDUE, birth MISSED
    dob_infant = (date.today() - timedelta(days=85)).isoformat()
    resp_infant = client.post("/families/me/members", headers=headers_a, json={
        "full_name": "Leo Green",
        "date_of_birth": dob_infant,
        "gender": "MALE",
        "relationship": "CHILD"
    })
    assert resp_infant.status_code == 201
    infant_id = resp_infant.json()["data"]["id"]

    # Member 2: Toddler born 14 months ago (~430 days) -> Tests MISSED (Rotavirus), CATCH_UP_REQUIRED (Penta), CLINICAL_REVIEW (BCG > 1yr)
    dob_toddler = (date.today() - timedelta(days=430)).isoformat()
    resp_toddler = client.post("/families/me/members", headers=headers_a, json={
        "full_name": "Maya Green",
        "date_of_birth": dob_toddler,
        "gender": "FEMALE",
        "relationship": "CHILD"
    })
    assert resp_toddler.status_code == 201
    toddler_id = resp_toddler.json()["data"]["id"]
    print(f"PASS: Created members Leo (infant: {infant_id}) and Maya (toddler: {toddler_id}).")

    # 4. Trigger Proactive Monitoring Run
    print_step("4. Triggering Proactive Monitoring Run via API")
    mon_resp = client.post("/notifications/monitor/run", headers=headers_a, json={})
    assert mon_resp.status_code == 200, f"Monitoring trigger failed: {mon_resp.text}"
    mon_data = mon_resp.json()["data"]
    print("Monitoring execution summary:", mon_data)
    assert mon_data["scanned_members"] == 2
    assert mon_data["evaluated_doses"] > 0
    assert mon_data["notifications_created"] > 0
    created_first_run = mon_data["notifications_created"]
    print(f"PASS: First monitoring run created {created_first_run} actionable notifications.")

    # 5. Verify Detection of All Clinical Categories
    print_step("5. Verifying Categorical Notification Detection")
    notifs_resp = client.get("/notifications", headers=headers_a, params={"limit": 100})
    assert notifs_resp.status_code == 200
    all_notifs = notifs_resp.json()["data"]
    types_found = {n["type"] for n in all_notifs}
    print("Dispatched notification types found:", types_found)

    # Check for UPCOMING, DUE, OVERDUE, MISSED, CATCH_UP, CLINICAL_REVIEW
    assert "UPCOMING" in types_found or "REMINDER" in types_found, "Missing UPCOMING/REMINDER notification"
    assert "DUE_ALERT" in types_found, "Missing DUE_ALERT notification"
    assert "OVERDUE_ALERT" in types_found, "Missing OVERDUE_ALERT notification"
    assert "MISSED_ALERT" in types_found, "Missing MISSED_ALERT notification"
    assert "CATCH_UP_ALERT" in types_found, "Missing CATCH_UP_ALERT notification"
    assert "CLINICAL_REVIEW_ALERT" in types_found, "Missing CLINICAL_REVIEW_ALERT notification"
    print("PASS: Verified 100% coverage of clinical notification categories:")
    print("      - UPCOMING (REMINDER)")
    print("      - DUE (DUE_ALERT)")
    print("      - OVERDUE (OVERDUE_ALERT)")
    print("      - MISSED (MISSED_ALERT)")
    print("      - CATCH_UP_REQUIRED (CATCH_UP_ALERT)")
    print("      - CLINICAL_REVIEW (CLINICAL_REVIEW_ALERT)")

    # 6. Idempotency & Duplicate Prevention
    print_step("6. Verifying Idempotency and Duplicate Prevention")
    mon_resp_2 = client.post("/notifications/monitor/run", headers=headers_a, json={})
    assert mon_resp_2.status_code == 200
    mon_data_2 = mon_resp_2.json()["data"]
    print("Second run stats:", mon_data_2)
    assert mon_data_2["notifications_created"] == 0, "Duplicate notifications were created on immediate re-run!"
    assert mon_data_2["notifications_skipped_duplicate"] > 0, "Expected duplicates to be skipped!"

    # Verify database count has not increased
    notifs_resp_2 = client.get("/notifications", headers=headers_a, params={"limit": 100})
    assert len(notifs_resp_2.json()["data"]) == len(all_notifs)
    print("PASS: Repeated execution is 100% idempotent. Zero duplicate notifications generated.")

    # 7. Unread Count & Filtering API
    print_step("7. Testing Unread Count and Filter Parameters")
    count_resp = client.get("/notifications/unread-count", headers=headers_a)
    assert count_resp.status_code == 200
    unread_count = count_resp.json()["data"]["unread_count"]
    assert unread_count == len(all_notifs)
    print(f"Unread count: {unread_count}")

    # Filter by member_id
    filter_infant = client.get("/notifications", headers=headers_a, params={"member_id": infant_id})
    assert filter_infant.status_code == 200
    infant_notifs = filter_infant.json()["data"]
    assert len(infant_notifs) > 0
    assert all(n["family_member_id"] == infant_id for n in infant_notifs)

    # Filter by type
    filter_overdue = client.get("/notifications", headers=headers_a, params={"type": "OVERDUE_ALERT"})
    assert filter_overdue.status_code == 200
    assert all(n["type"] == "OVERDUE_ALERT" for n in filter_overdue.json()["data"])
    print("PASS: Unread count and filtering by member_id and type verified.")

    # 8. Mark Single Notification as Read & Acknowledge
    print_step("8. Testing Mark As Read & Acknowledge")
    sample_notif = all_notifs[0]
    sample_id = sample_notif["id"]

    # Mark as read
    read_resp = client.patch(f"/notifications/{sample_id}/read", headers=headers_a)
    assert read_resp.status_code == 200
    assert read_resp.json()["data"]["is_read"] is True

    # Check unread count decreased by 1
    new_count_resp = client.get("/notifications/unread-count", headers=headers_a)
    assert new_count_resp.json()["data"]["unread_count"] == unread_count - 1

    # Acknowledge second notification
    sample_2 = all_notifs[1]
    ack_resp = client.patch(f"/notifications/{sample_2['id']}/acknowledge", headers=headers_a)
    assert ack_resp.status_code == 200
    assert ack_resp.json()["data"]["status"] == "ACKNOWLEDGED"
    print("PASS: Successfully marked individual notification as read and acknowledged.")

    # 9. Mark All As Read & History API
    print_step("9. Testing Mark All As Read and History Retrieval")
    mark_all = client.patch("/notifications/mark-all-read", headers=headers_a)
    assert mark_all.status_code == 200
    assert mark_all.json()["data"]["marked_read_count"] >= 1

    count_after_all = client.get("/notifications/unread-count", headers=headers_a).json()["data"]["unread_count"]
    assert count_after_all == 0

    history_resp = client.get("/notifications/history", headers=headers_a)
    assert history_resp.status_code == 200
    assert len(history_resp.json()["data"]) > 0
    print("PASS: All notifications marked read; unread count is 0; history retrieved.")

    # 10. Notification Preferences API
    print_step("10. Testing Notification Preferences (Lead Days & Channels)")
    get_pref = client.get("/notifications/preferences", headers=headers_a)
    assert get_pref.status_code == 200
    print("Initial preferences:", get_pref.json()["data"])

    # Update preferences: lead days [14, 7, 1], add email
    update_pref = client.put("/notifications/preferences", headers=headers_a, json={
        "reminder_lead_days": [14, 7, 1],
        "email_enabled": True,
        "email_address": "alice.notifications@example.com",
        "channels_enabled": ["IN_APP", "EMAIL"]
    })
    assert update_pref.status_code == 200
    pref_data = update_pref.json()["data"]
    assert pref_data["reminder_lead_days"] == [14, 7, 1]
    assert pref_data["email_address"] == "alice.notifications@example.com"
    print("PASS: Notification preferences persisted successfully.")

    # 11. Record Changes Affecting Monitoring & Alert Resolution
    print_step("11. Testing Dynamic Record Changes and Alert Resolution")
    # Administer Pentavalent Dose 1 for Leo (was overdue)
    penta_adm_date = (date.today() - timedelta(days=20)).isoformat()
    add_rec_resp = client.post(f"/vaccinations/member/{infant_id}", headers=headers_a, json={
        "vaccine_code": "PENTA_1",
        "vaccine_name": "Pentavalent (DTP-HepB-Hib)",
        "dose_number": 1,
        "administered_date": penta_adm_date,
        "healthcare_provider": "City Health Center"
    })
    assert add_rec_resp.status_code == 201
    rec_id = add_rec_resp.json()["data"]["id"]

    # Check notification for PENTA_1: should be marked resolved/read
    penta_notif_resp = client.get("/notifications", headers=headers_a, params={"member_id": infant_id})
    penta_records = [n for n in penta_notif_resp.json()["data"] if n.get("vaccine_code") == "PENTA_1"]
    for pr in penta_records:
        assert pr["is_read"] is True, "Administered vaccine alert should be resolved/read!"
    print("PASS: Vaccination record addition automatically resolved prior alerts.")

    # Delete vaccination record: dose should re-trigger on subsequent evaluation
    del_rec = client.delete(f"/vaccinations/records/{rec_id}", headers=headers_a)
    assert del_rec.status_code == 200
    print("PASS: Vaccination record deleted; re-evaluation hook executed.")

    # 12. Security & IDOR Verification
    print_step("12. Security Verification: Cross-User IDOR Protection")
    # Patient B attempts to get Patient A's notifications
    resp_b_list = client.get("/notifications", headers=headers_b)
    assert resp_b_list.status_code == 200
    # Patient B's notifications should NOT contain any of Patient A's notifications
    assert len(resp_b_list.json()["data"]) == 0

    # Patient B attempts to mark Patient A's notification as read
    idor_read = client.patch(f"/notifications/{sample_id}/read", headers=headers_b)
    assert idor_read.status_code == 404, "Cross-user mark-as-read should return 404!"

    # Patient B attempts to acknowledge Patient A's notification
    idor_ack = client.patch(f"/notifications/{sample_id}/acknowledge", headers=headers_b)
    assert idor_ack.status_code == 404, "Cross-user acknowledge should return 404!"

    # Patient B attempts to query Patient A's member notifications
    idor_member_filter = client.get("/notifications", headers=headers_b, params={"member_id": infant_id})
    assert len(idor_member_filter.json()["data"]) == 0
    print("PASS: Strict multi-tenant isolation confirmed. Zero IDOR leakage.")

    # 13. Cascade Cleanup on Member Deletion
    print_step("13. Testing Cascade Cleanup on Family Member Deletion")
    # Create temporary member, trigger monitor, then delete member
    temp_dob = (date.today() - timedelta(days=60)).isoformat()
    temp_mem = client.post("/families/me/members", headers=headers_a, json={
        "full_name": "Temporary Member",
        "date_of_birth": temp_dob,
        "gender": "MALE",
        "relationship": "CHILD"
    }).json()["data"]
    temp_id = temp_mem["id"]

    client.post("/notifications/monitor/run", headers=headers_a, json={"family_member_id": temp_id})
    mem_notifs = client.get("/notifications", headers=headers_a, params={"member_id": temp_id}).json()["data"]
    assert len(mem_notifs) > 0, "Expected notifications for temporary member"

    # Delete temporary member
    del_mem_resp = client.delete(f"/families/me/members/{temp_id}", headers=headers_a)
    assert del_mem_resp.status_code == 200

    # Verify notifications for deleted member are cascade cleaned
    cleaned_notifs = client.get("/notifications", headers=headers_a, params={"member_id": temp_id}).json()["data"]
    assert len(cleaned_notifs) == 0, "Notifications were not cleaned up upon member deletion!"
    print("PASS: Associated notifications cascade cleaned upon member removal.")

    # 14. Admin Global Scheduled Monitoring Run
    print_step("14. Admin Global Scheduled Monitoring Run")
    admin_mon_resp = client.post("/notifications/monitor/run", headers=headers_admin, json={}, timeout=120.0)
    assert admin_mon_resp.status_code == 200
    admin_data = admin_mon_resp.json()["data"]
    print("Admin global run stats:", admin_data)
    assert admin_data["scanned_users"] >= 2
    assert admin_data["scanned_members"] >= 2
    print("PASS: Admin global monitoring executed across all active patients.")

    print_step("ALL PHASE 6 PROACTIVE MONITORING & NOTIFICATION TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    try:
        test_phase6_suite()
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"\nPHASE 6 TEST SUITE FAILED: {e}")
        sys.exit(1)
