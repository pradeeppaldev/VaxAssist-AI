"""
Automated end-to-end test suite for Phase 3: Family & Patient Management.
Runs against the live FastAPI backend with MongoDB Atlas.
"""
import sys
import time
from datetime import date, timedelta
import httpx

BASE_URL = "http://127.0.0.1:8000/api/v1"

def print_step(title):
    print(f"\n{'='*70}\n[TEST] {title}\n{'='*70}")

def test_phase3_suite():
    client = httpx.Client(base_url=BASE_URL, timeout=15.0)

    # 1. Health check
    print_step("1. Health Check & MongoDB Connectivity")
    resp = client.get("/health")
    assert resp.status_code == 200, f"Health check failed: {resp.text}"
    health_data = resp.json()
    assert health_data["status"] == "healthy"
    assert health_data["database"]["status"] == "connected"
    print("PASS: System and Atlas DB are healthy.")

    # 2. Register two separate patient users for tenancy isolation testing
    print_step("2. Setting Up Patient A & Patient B")
    ts = int(time.time())
    email_a = f"patient_a_{ts}@vaxassist.ai"
    email_b = f"patient_b_{ts}@vaxassist.ai"

    # Register User A
    resp_a = client.post("/auth/register", json={
        "name": "John Connor",
        "email": email_a,
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "PATIENT"
    })
    assert resp_a.status_code == 201
    user_a = resp_a.json()["data"]

    # Login User A
    login_a = client.post("/auth/login", json={"email": email_a, "password": "Password123!"}).json()
    token_a = login_a["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register User B
    resp_b = client.post("/auth/register", json={
        "name": "Mary Vance",
        "email": email_b,
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "PATIENT"
    })
    assert resp_b.status_code == 201
    user_b = resp_b.json()["data"]

    # Login User B
    login_b = client.post("/auth/login", json={"email": email_b, "password": "Password123!"}).json()
    token_b = login_b["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    print(f"PASS: Created Patient A ({email_a}) and Patient B ({email_b}).")

    # 3. User A: Retrieve / Create Family
    print_step("3. Patient A Family Initialization")
    resp = client.get("/families/me", headers=headers_a)
    assert resp.status_code == 200, f"Get family failed: {resp.text}"
    family_a = resp.json()["data"]
    print("Default Family A initialized:", family_a)
    assert family_a["owner_user_id"] == user_a["id"]
    assert family_a["member_count"] == 0
    family_a_id = family_a["id"]
    print("PASS: Patient A default family retrieved successfully.")

    # 4. User A: Update Family Details
    print_step("4. Patient A Updates Family Name & Description")
    resp = client.patch(
        "/families/me",
        headers=headers_a,
        json={"family_name": "Connor Household", "description": "Primary residence in Metro City"}
    )
    assert resp.status_code == 200, f"Update family failed: {resp.text}"
    updated_family = resp.json()["data"]
    assert updated_family["family_name"] == "Connor Household"
    assert updated_family["description"] == "Primary residence in Metro City"
    print("PASS: Family details updated successfully.")

    # 5. Validation & Edge Cases on Member Creation
    print_step("5. Validations: Future DOB & Invalid Inputs")
    # Future DOB
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    resp = client.post("/families/me/members", headers=headers_a, json={
        "full_name": "Time Traveler",
        "date_of_birth": tomorrow,
        "gender": "MALE",
        "relationship": "CHILD"
    })
    assert resp.status_code in [400, 422], f"Future DOB should be rejected: {resp.text}"
    print(f"PASS: Future DOB rejected with {resp.status_code}")

    # Blank / whitespace name
    resp = client.post("/families/me/members", headers=headers_a, json={
        "full_name": "   ",
        "date_of_birth": "2020-01-01",
        "gender": "FEMALE",
        "relationship": "CHILD"
    })
    assert resp.status_code in [400, 422], f"Blank name should be rejected: {resp.text}"
    print(f"PASS: Blank name rejected with {resp.status_code}")

    # Invalid blood group
    resp = client.post("/families/me/members", headers=headers_a, json={
        "full_name": "Test Blood",
        "date_of_birth": "2020-01-01",
        "gender": "FEMALE",
        "relationship": "CHILD",
        "blood_group": "XYZ_INVALID"
    })
    assert resp.status_code in [400, 422], f"Invalid blood group should be rejected: {resp.text}"
    print(f"PASS: Invalid blood group rejected with {resp.status_code}")

    # 6. Patient A Adds Valid Family Members
    print_step("6. Patient A Adds 3 Family Members")
    # Member 1: Self
    resp1 = client.post("/families/me/members", headers=headers_a, json={
        "full_name": "John Connor",
        "date_of_birth": "1985-05-15",
        "gender": "MALE",
        "relationship": "SELF",
        "blood_group": "O+"
    })
    assert resp1.status_code == 201, f"Failed to add self: {resp1.text}"
    member1 = resp1.json()["data"]

    # Member 2: Child
    resp2 = client.post("/families/me/members", headers=headers_a, json={
        "full_name": "Leo Connor",
        "date_of_birth": "2022-08-10",
        "gender": "MALE",
        "relationship": "CHILD",
        "blood_group": "A+",
        "allergies": ["Penicillin", "Peanuts"],
        "notes": "Born 3 weeks premature"
    })
    assert resp2.status_code == 201, f"Failed to add child: {resp2.text}"
    member2 = resp2.json()["data"]
    leo_id = member2["id"]

    # Member 3: Spouse
    resp3 = client.post("/families/me/members", headers=headers_a, json={
        "full_name": "Sarah Connor",
        "date_of_birth": "1987-11-20",
        "gender": "FEMALE",
        "relationship": "SPOUSE",
        "blood_group": "O-"
    })
    assert resp3.status_code == 201, f"Failed to add spouse: {resp3.text}"
    member3 = resp3.json()["data"]
    spouse_id = member3["id"]

    print(f"PASS: Added Self ({member1['id']}), Child ({leo_id}), and Spouse ({spouse_id}).")

    # 7. Duplicate Member Detection
    print_step("7. Duplicate Family Member Guard")
    resp_dup = client.post("/families/me/members", headers=headers_a, json={
        "full_name": "Leo Connor",
        "date_of_birth": "2022-08-10",
        "gender": "MALE",
        "relationship": "CHILD"
    })
    assert resp_dup.status_code == 400, f"Duplicate member should be rejected with 400: {resp_dup.text}"
    print(f"PASS: Duplicate member rejected with 400: {resp_dup.json().get('detail')}")

    # 8. List Family Members & Verify Member Count
    print_step("8. Listing Family Members for Patient A")
    resp_list = client.get("/families/me/members", headers=headers_a)
    assert resp_list.status_code == 200
    members_list = resp_list.json()["data"]
    assert len(members_list) == 3, f"Expected 3 members, got {len(members_list)}"
    print(f"PASS: Retrieved {len(members_list)} family members for Patient A.")

    # Verify family member_count updated
    resp_fam = client.get("/families/me", headers=headers_a)
    assert resp_fam.json()["data"]["member_count"] == 3
    print("PASS: Family member_count correctly reflects 3.")

    # 9. Get and Update Specific Member
    print_step("9. Retrieve and Update Specific Member Details")
    resp_get = client.get(f"/families/me/members/{leo_id}", headers=headers_a)
    assert resp_get.status_code == 200
    assert resp_get.json()["data"]["full_name"] == "Leo Connor"

    resp_patch = client.patch(
        f"/families/me/members/{leo_id}",
        headers=headers_a,
        json={"notes": "Born 3 weeks premature. Pediatrician advised 4-week booster checkup."}
    )
    assert resp_patch.status_code == 200
    assert "Pediatrician advised" in resp_patch.json()["data"]["notes"]
    print("PASS: Specific member details retrieved and updated.")

    # 10. Cross-User Tenancy & IDOR Isolation
    print_step("10. IDOR & Cross-User Isolation (Patient B vs Patient A Data)")
    # Patient B attempts to view Patient A's member
    resp_b_view = client.get(f"/families/me/members/{leo_id}", headers=headers_b)
    assert resp_b_view.status_code == 404, f"Patient B should get 404 for Patient A's member: {resp_b_view.text}"

    # Patient B attempts to update Patient A's member
    resp_b_update = client.patch(
        f"/families/me/members/{leo_id}",
        headers=headers_b,
        json={"full_name": "Hacked Leo"}
    )
    assert resp_b_update.status_code == 404, f"Patient B should get 404 updating Patient A's member: {resp_b_update.text}"

    # Patient B attempts to delete Patient A's member
    resp_b_del = client.delete(f"/families/me/members/{leo_id}", headers=headers_b)
    assert resp_b_del.status_code == 404, f"Patient B should get 404 deleting Patient A's member: {resp_b_del.text}"

    # Patient B's member list must be completely empty (zero leakage of Patient A data)
    resp_b_list = client.get("/families/me/members", headers=headers_b)
    assert resp_b_list.status_code == 200
    assert len(resp_b_list.json()["data"]) == 0, "Patient B should have 0 members!"
    print("PASS: Cross-user access strictly blocked with 404. Zero data leakage.")

    # 11. Delete Family Member
    print_step("11. Patient A Deletes Family Member")
    resp_del = client.delete(f"/families/me/members/{spouse_id}", headers=headers_a)
    assert resp_del.status_code == 200, f"Delete failed: {resp_del.text}"

    # Confirm member is deleted
    resp_chk = client.get(f"/families/me/members/{spouse_id}", headers=headers_a)
    assert resp_chk.status_code == 404, "Deleted member should return 404"

    # Member count should now be 2
    resp_fam_after = client.get("/families/me", headers=headers_a)
    assert resp_fam_after.json()["data"]["member_count"] == 2
    print("PASS: Member deleted and member_count decremented to 2.")

    print_step("ALL 11 PHASE 3 INTEGRATION & SECURITY TESTS PASSED!")

if __name__ == "__main__":
    try:
        test_phase3_suite()
    except Exception as e:
        print(f"\nFAILED: {e}")
        sys.exit(1)
