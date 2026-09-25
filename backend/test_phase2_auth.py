"""
Automated end-to-end test suite for Phase 2: Authentication & Role System.
Runs against the live FastAPI backend with MongoDB Atlas.
"""
import sys
import time
import httpx

BASE_URL = "http://127.0.0.1:8000/api/v1"

def print_step(title):
    print(f"\n{'='*70}\n[TEST] {title}\n{'='*70}")

def test_suite():
    client = httpx.Client(base_url=BASE_URL, timeout=15.0)

    # 1. Health check
    print_step("1. Verifying System Health & Database Connectivity")
    resp = client.get("/health")
    assert resp.status_code == 200, f"Health check failed: {resp.text}"
    health_data = resp.json()
    print("Health check response:", health_data)
    assert health_data["status"] == "healthy", "System status is not healthy"
    assert health_data["database"]["status"] == "connected", "Database is not connected"
    print("PASS: System and MongoDB Atlas are healthy and connected.")

    # 2. Prevent Public Admin Registration
    print_step("2. Verifying Public Admin Registration is Blocked")
    resp = client.post("/auth/register", json={
        "name": "Malicious Admin",
        "email": "hacker_admin@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "ADMIN"
    })
    print(f"Status Code: {resp.status_code}, Response: {resp.text}")
    assert resp.status_code in [400, 403, 422], "Admin registration was not blocked!"
    print("PASS: Public registration of ADMIN accounts is strictly rejected.")

    # 3. Patient Registration
    print_step("3. Registering a Patient Account")
    patient_email = f"patient_{int(time.time())}@vaxassist.ai"
    resp = client.post("/auth/register", json={
        "name": "Sarah Connor",
        "email": patient_email,
        "password": "SecurePassword2026!",
        "confirm_password": "SecurePassword2026!",
        "role": "PATIENT"
    })
    assert resp.status_code == 201, f"Patient registration failed: {resp.text}"
    reg_data = resp.json()
    print("Registration response:", reg_data)
    assert reg_data["data"]["account_status"] == "ACTIVE", "Patient should be ACTIVE immediately"
    assert reg_data["data"]["role"] == "PATIENT"
    patient_id = reg_data["data"]["id"]
    print(f"PASS: Patient registered successfully with ACTIVE status. ID: {patient_id}")

    # 3b. Duplicate Email Check
    print_step("3b. Verifying Duplicate Email Registration is Blocked")
    resp = client.post("/auth/register", json={
        "name": "Duplicate Sarah",
        "email": patient_email,
        "password": "SecurePassword2026!",
        "confirm_password": "SecurePassword2026!",
        "role": "PATIENT"
    })
    assert resp.status_code == 400, f"Duplicate registration should return 400: {resp.text}"
    print("PASS: Duplicate email correctly blocked.")

    # 4. Patient Login
    print_step("4. Testing Patient Login & JWT Generation")
    # Bad password
    resp = client.post("/auth/login", json={
        "email": patient_email,
        "password": "WrongPassword!"
    })
    assert resp.status_code == 401, f"Wrong password should fail with 401: {resp.text}"
    print("PASS: Incorrect password rejected with 401.")

    # Good password
    resp = client.post("/auth/login", json={
        "email": patient_email,
        "password": "SecurePassword2026!"
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    login_data = resp.json()
    patient_token = login_data["access_token"]
    assert patient_token, "No access token returned"
    assert login_data["user"]["email"] == patient_email
    print(f"PASS: Patient logged in successfully. Token generated: {patient_token[:25]}...")

    # 5. Access /auth/me
    print_step("5. Accessing /auth/me Profile Endpoint")
    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {patient_token}"})
    assert resp.status_code == 200, f"Failed to get profile: {resp.text}"
    profile_data = resp.json()
    assert profile_data["data"]["email"] == patient_email
    assert "hashed_password" not in profile_data["data"], "Hashed password must not be exposed!"
    print(f"PASS: /auth/me returned profile for {profile_data['data']['name']}. Passwords hidden.")

    # 6. Role Authorization: Patient blocked from Admin endpoints
    print_step("6. Verifying Patient Cannot Access Admin Endpoints (RBAC)")
    resp = client.get("/admin/users", headers={"Authorization": f"Bearer {patient_token}"})
    assert resp.status_code == 403, f"Patient should be forbidden from admin users: {resp.text}"
    print(f"PASS: Patient was forbidden with 403: {resp.json().get('detail')}")

    # 7. Healthcare Worker Registration (Pending Approval)
    print_step("7. Registering a Healthcare Worker Account")
    hw_email = f"dr_smith_{int(time.time())}@hospital.org"
    resp = client.post("/auth/register", json={
        "name": "Dr. Alice Smith",
        "email": hw_email,
        "password": "DoctorPassword2026!",
        "confirm_password": "DoctorPassword2026!",
        "role": "HEALTHCARE_WORKER",
        "license_number": "MED-NY-984210",
        "clinic_or_hospital": "St. Jude Memorial Hospital"
    })
    assert resp.status_code == 201, f"Healthcare worker registration failed: {resp.text}"
    hw_data = resp.json()
    assert hw_data["data"]["account_status"] == "PENDING", "Healthcare worker must start as PENDING"
    hw_id = hw_data["data"]["id"]
    print(f"PASS: Healthcare Worker registered with PENDING status. ID: {hw_id}")

    # 8. Pending Healthcare Worker Login Attempt
    print_step("8. Verifying Pending Healthcare Worker Cannot Login")
    resp = client.post("/auth/login", json={
        "email": hw_email,
        "password": "DoctorPassword2026!"
    })
    assert resp.status_code == 403, f"Pending healthcare worker login should be 403: {resp.text}"
    print(f"PASS: Login blocked with 403: {resp.json().get('detail')}")

    # 9. Admin Login (Bootstrapped Admin)
    print_step("9. Authenticating as System Administrator")
    resp = client.post("/auth/login", json={
        "email": "admin@vaxassist.ai",
        "password": "Admin@VaxAssist2026"
    })
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    admin_data = resp.json()
    admin_token = admin_data["access_token"]
    assert admin_data["user"]["role"] == "ADMIN"
    print(f"PASS: System Administrator authenticated. Role: {admin_data['user']['role']}")

    # 10. Admin List Users & Approve Healthcare Worker
    print_step("10. Admin Approving Healthcare Worker Account")
    resp = client.get("/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200, f"Admin listing users failed: {resp.text}"
    all_users = resp.json()["data"]
    print(f"Total users found in database: {len(all_users)}")

    # Approve HW
    resp = client.patch(
        f"/admin/users/{hw_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"account_status": "ACTIVE", "reason": "License verified through state board"}
    )
    assert resp.status_code == 200, f"Admin status update failed: {resp.text}"
    updated_hw = resp.json()["data"]
    assert updated_hw["account_status"] == "ACTIVE"
    print(f"PASS: Healthcare Worker {hw_id} approved to ACTIVE.")

    # 11. Healthcare Worker Login After Approval
    print_step("11. Verifying Healthcare Worker Can Now Login After Approval")
    resp = client.post("/auth/login", json={
        "email": hw_email,
        "password": "DoctorPassword2026!"
    })
    assert resp.status_code == 200, f"Approved healthcare worker should now be able to login: {resp.text}"
    hw_login = resp.json()
    hw_token = hw_login["access_token"]
    assert hw_token, "No access token returned for healthcare worker"
    print("PASS: Approved Healthcare Worker successfully logged in and obtained access token.")

    # 12. Deactivation Test
    print_step("12. Testing Account Deactivation and Access Blocking")
    # Deactivate patient
    resp = client.patch(
        f"/admin/users/{patient_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"account_status": "INACTIVE", "reason": "User requested account pause"}
    )
    assert resp.status_code == 200
    print("Patient marked INACTIVE.")

    # Patient tries to log in
    resp = client.post("/auth/login", json={
        "email": patient_email,
        "password": "SecurePassword2026!"
    })
    assert resp.status_code == 403, f"Deactivated user login must return 403: {resp.text}"
    print(f"PASS: Deactivated user login blocked with 403: {resp.json().get('detail')}")

    # Patient tries to call /me with existing token
    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {patient_token}"})
    assert resp.status_code == 403, f"Deactivated user token call must return 403: {resp.text}"
    print(f"PASS: Deactivated user existing token blocked with 403: {resp.json().get('detail')}")

    # Reactivate patient
    client.patch(
        f"/admin/users/{patient_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"account_status": "ACTIVE"}
    )
    print("Patient reactivated.")

    print_step("ALL PHASE 2 AUTOMATED INTEGRATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    try:
        test_suite()
    except Exception as e:
        print(f"\nFAILED: {e}")
        sys.exit(1)
