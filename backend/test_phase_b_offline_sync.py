"""
Phase B End-to-End Offline Support & Synchronization Integration Test Suite.
Verifies backend synchronization endpoints, duplicate prevention, idempotency,
user authorization re-check, and PWA manifest/service worker integrity.
"""
import os
import json
import uuid
import unittest
from datetime import date
from starlette.testclient import TestClient

from app.main import app
from app.models.user import UserRole


class TestPhaseBOfflineSync(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.test_client_ctx = TestClient(app)
        cls.client = cls.test_client_ctx.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.test_client_ctx.__exit__(None, None, None)

    # -------------------------------------------------------------
    # Scenario 1: Baseline Session & Data Retrieval
    # -------------------------------------------------------------
    def test_01_baseline_session_and_cache_read(self):
        print("\n[PHASE B - SCENARIO 1] Testing Baseline Session & Record Cacheability...")
        login_resp = self.client.post(
            "/api/v1/auth/login",
            json={"email": "rajesh.sharma@vaxassist.demo", "password": "Rajesh@Vax2026!"},
        )
        self.assertEqual(login_resp.status_code, 200)
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Retrieve members
        members_resp = self.client.get("/api/v1/families/me/members", headers=headers)
        self.assertEqual(members_resp.status_code, 200)
        members = members_resp.json()["data"]
        self.assertGreaterEqual(len(members), 4)

        # Retrieve notifications
        notifs_resp = self.client.get("/api/v1/notifications?limit=10", headers=headers)
        self.assertEqual(notifs_resp.status_code, 200)
        notifs = notifs_resp.json()["data"]
        self.assertIsInstance(notifs, list)

        print(f"  PASS: Retrieved {len(members)} baseline members and {len(notifs)} notifications for offline caching.")

    # -------------------------------------------------------------
    # Scenario 2 & 3: Replay Queued Member & Idempotency Duplicate Rejection
    # -------------------------------------------------------------
    def test_02_and_03_replay_member_and_prevent_duplicate(self):
        print("\n[PHASE B - SCENARIOS 2 & 3] Testing Queued Member Replay & Duplicate Prevention...")
        login_resp = self.client.post(
            "/api/v1/auth/login",
            json={"email": "rajesh.sharma@vaxassist.demo", "password": "Rajesh@Vax2026!"},
        )
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Unique demo member name with random tag to avoid colliding with previous test runs
        unique_tag = uuid.uuid4().hex[:6]
        test_member_name = f"Test Child {unique_tag}"
        test_dob = "2024-02-14"

        member_payload = {
            "full_name": test_member_name,
            "date_of_birth": test_dob,
            "gender": "MALE",
            "relationship": "CHILD",
            "blood_group": "B+",
            "allergies": ["None"],
            "notes": "Added during offline queue verification test",
        }

        # First synchronization replay (Simulating online restoration)
        sync_resp_1 = self.client.post(
            "/api/v1/families/me/members",
            headers=headers,
            json=member_payload,
        )
        self.assertEqual(sync_resp_1.status_code, 201)
        created_member = sync_resp_1.json()["data"]
        created_member_id = created_member["id"]
        self.assertEqual(created_member["full_name"], test_member_name)
        print(f"  PASS: Successfully synchronized queued member '{test_member_name}' (ID: {created_member_id})")

        # Second synchronization replay (Simulating network retry of the same operation)
        sync_resp_2 = self.client.post(
            "/api/v1/families/me/members",
            headers=headers,
            json=member_payload,
        )
        # Must be rejected by backend to prevent duplicate member record creation
        self.assertEqual(sync_resp_2.status_code, 400)
        self.assertIn("already exists", sync_resp_2.json()["detail"].lower())
        print(f"  PASS: Idempotency enforced. Duplicate member replay rejected: '{sync_resp_2.json()['detail']}'")

        # -------------------------------------------------------------
        # Scenario 4: Replay Queued Vaccination Dose & Duplicate Dose Rejection
        # -------------------------------------------------------------
        print("\n[PHASE B - SCENARIO 4] Testing Queued Vaccination Dose Replay & Idempotency...")
        dose_payload = {
            "vaccine_code": "BCG",
            "vaccine_name": "Bacillus Calmette–Guérin",
            "dose_number": 1,
            "dose_name": "Birth Dose",
            "administered_date": "2024-02-15",
            "healthcare_provider": "Lilavati Hospital, Mumbai",
            "batch_number": f"BATCH-{unique_tag.upper()}",
            "notes": "Administered post-birth, verified by clinical nurse.",
        }

        # First dose sync
        vax_sync_1 = self.client.post(
            f"/api/v1/vaccinations/member/{created_member_id}",
            headers=headers,
            json=dose_payload,
        )
        self.assertEqual(vax_sync_1.status_code, 201)
        created_record = vax_sync_1.json()["data"]
        print(f"  PASS: Synchronized queued vaccination dose '{created_record['vaccine_name']}' for member {created_member_id}")

        # Duplicate dose sync (Retry simulation)
        vax_sync_2 = self.client.post(
            f"/api/v1/vaccinations/member/{created_member_id}",
            headers=headers,
            json=dose_payload,
        )
        self.assertEqual(vax_sync_2.status_code, 400)
        self.assertIn("already been recorded", vax_sync_2.json()["detail"].lower())
        print(f"  PASS: Idempotency enforced. Duplicate vaccination dose replay rejected: '{vax_sync_2.json()['detail']}'")

    # -------------------------------------------------------------
    # Scenario 5: Replay Queued Notification Preferences Update
    # -------------------------------------------------------------
    def test_05_replay_notification_preferences(self):
        print("\n[PHASE B - SCENARIO 5] Testing Queued Notification Preferences Sync...")
        login_resp = self.client.post(
            "/api/v1/auth/login",
            json={"email": "rajesh.sharma@vaxassist.demo", "password": "Rajesh@Vax2026!"},
        )
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        pref_payload = {
            "email_enabled": True,
            "sms_enabled": True,
            "phone_number": "+919820099881",
            "email_address": "rajesh.sharma@vaxassist.demo",
            "advance_notice_days": 3,
            "quiet_hours_start": "21:00",
            "quiet_hours_end": "07:00",
        }

        pref_resp = self.client.put(
            "/api/v1/notifications/preferences",
            headers=headers,
            json=pref_payload,
        )
        self.assertEqual(pref_resp.status_code, 200)
        updated_prefs = pref_resp.json()["data"]
        self.assertEqual(updated_prefs["phone_number"], "+919820099881")
        print(f"  PASS: Synchronized queued notification preferences (Phone: {updated_prefs['phone_number']})")

    # -------------------------------------------------------------
    # Scenario 6: Re-checking Authorization & Cross-Household Security
    # -------------------------------------------------------------
    def test_06_authorization_recheck_on_sync(self):
        print("\n[PHASE B - SCENARIO 6] Testing Backend Authorization Re-check on Sync Replay...")
        # Unauthenticated request (expired or stolen token)
        invalid_headers = {"Authorization": "Bearer expired_or_tampered_token"}
        bad_resp = self.client.get("/api/v1/families/me/members", headers=invalid_headers)
        self.assertEqual(bad_resp.status_code, 401)
        print("  PASS: Queued requests without valid active token are blocked (401 Unauthorized).")

        # Cross-household access attempt
        login_resp = self.client.post(
            "/api/v1/auth/login",
            json={"email": "rajesh.sharma@vaxassist.demo", "password": "Rajesh@Vax2026!"},
        )
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Attempt to access non-existent or other household member
        foreign_id = "6ab000000000000000000099"
        foreign_resp = self.client.get(f"/api/v1/families/me/members/{foreign_id}", headers=headers)
        self.assertIn(foreign_resp.status_code, [403, 404])
        print("  PASS: Replaying synchronization against unauthorized tenant member is blocked.")

    # -------------------------------------------------------------
    # Scenario 7: Verify PWA Service Worker & Manifest Files
    # -------------------------------------------------------------
    def test_07_pwa_service_worker_and_manifest(self):
        print("\n[PHASE B - SCENARIO 7] Verifying PWA Assets & Service Worker Configuration...")
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        sw_path = os.path.join(base_dir, "frontend", "public", "sw.js")
        manifest_path = os.path.join(base_dir, "frontend", "public", "manifest.json")

        self.assertTrue(os.path.exists(sw_path), "Service Worker sw.js exists in public directory")
        self.assertTrue(os.path.exists(manifest_path), "Web App Manifest manifest.json exists in public directory")

        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest_data = json.load(f)
        self.assertEqual(manifest_data["name"], "VaxAssist AI — Digital Vaccination Management")
        self.assertEqual(manifest_data["display"], "standalone")
        print(f"  PASS: PWA manifest is valid JSON with standalone display mode.")

        with open(sw_path, "r", encoding="utf-8") as f:
            sw_content = f.read()
        self.assertIn("vaxassist-app-shell", sw_content)
        self.assertIn("caches.open", sw_content)
        print(f"  PASS: Service Worker script verified ({len(sw_content)} bytes).")


if __name__ == "__main__":
    unittest.main()
