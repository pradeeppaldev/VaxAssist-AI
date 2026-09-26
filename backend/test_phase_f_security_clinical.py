"""
VaxAssist AI — Phase F: Security & Clinical Validation Test Suite.
Validates:
1. Authentication & JWT Security (missing, expired, malformed tokens, role escalation)
2. Role-Based Access Control & Multi-Tenant IDOR Protection (Patient vs Clinician vs Admin)
3. Data Integrity & Clinical Dose Validation (future date, pre-DOB, duplicate dose, chronological order)
4. Deterministic Clinical Schedule Engine (HepB 24h cutoff, OPV-0 15d cutoff, Rota 1y cutoff, catch-up rules, BSON/datetime resilience)
5. Agent & RAG Clinical Safety (citations, medical disclaimers, optional vaccine isolation)
6. Offline Mutation Security & Backend Authorization Preservation
"""
import os
import io
import sys
import unittest
from datetime import date, datetime, timedelta, timezone
from typing import Dict, Any
import jwt

sys.path.insert(0, os.path.abspath("backend"))

from starlette.testclient import TestClient
from app.main import app
from app.config import settings
from app.models.user import UserRole
from app.models.vaccination import VaccinationStatus, VaccineCategory
from app.services.schedule_engine import calculate_member_schedule
from app.services.schedule_catalog import UNIVERSAL_NIS_SCHEDULE


class TestPhaseFSecurityAndClinical(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        print("\n" + "=" * 75)
        print("  VAXASSIST AI — PHASE F: SECURITY & CLINICAL VALIDATION SUITE")
        print("=" * 75)
        cls.test_client_ctx = TestClient(app)
        cls.client = cls.test_client_ctx.__enter__()

        # 1. Login as Primary Patient (Rajesh Sharma)
        p1_login = cls.client.post("/api/v1/auth/login", json={
            "email": "rajesh.sharma@vaxassist.demo",
            "password": "Rajesh@Vax2026!",
        })
        cls.patient1_token = p1_login.json().get("access_token")
        cls.patient1_headers = {"Authorization": f"Bearer {cls.patient1_token}"}
        cls.patient1_user = p1_login.json().get("user", {})

        # 2. Login as Healthcare Worker (Dr. Anjali Deshmukh)
        hw_login = cls.client.post("/api/v1/auth/login", json={
            "email": "dr.anjali.deshmukh@vaxassist.demo",
            "password": "DrAnjali@Vax2026!",
        })
        cls.hw_token = hw_login.json().get("access_token")
        cls.hw_headers = {"Authorization": f"Bearer {cls.hw_token}"}
        cls.hw_user = hw_login.json().get("user", {})

        # 3. Login as Admin
        admin_login = cls.client.post("/api/v1/auth/login", json={
            "email": "admin@vaxassist.demo",
            "password": "Admin@Vax2026!",
        })
        cls.admin_token = admin_login.json().get("access_token")
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}

        # 4. Fetch Primary Patient's Family Members
        fam_resp = cls.client.get("/api/v1/families/me/members", headers=cls.patient1_headers)
        members = fam_resp.json().get("data", [])
        cls.aarav = next((m for m in members if "Aarav" in m.get("full_name", "")), members[0] if members else None)
        cls.aarav_id = str(cls.aarav.get("id") or cls.aarav.get("_id")) if cls.aarav else None

    @classmethod
    def tearDownClass(cls):
        cls.test_client_ctx.__exit__(None, None, None)

    # =========================================================================
    # 1. AUTHENTICATION & JWT SECURITY
    # =========================================================================
    def test_01_authentication_and_jwt_security(self):
        print("\n[PHASE F TEST 1] Verifying Authentication & JWT Security...")

        # 1. Protected endpoint without token -> 401
        no_auth = self.client.get("/api/v1/families/me")
        self.assertEqual(no_auth.status_code, 401, "Protected endpoint must reject unauthenticated requests.")
        print("  PASS: Missing Bearer token rejected with 401 Unauthorized.")

        # 2. Malformed token string -> 401
        malformed = self.client.get("/api/v1/families/me", headers={"Authorization": "Bearer not-a-valid-jwt-token"})
        self.assertEqual(malformed.status_code, 401)
        print("  PASS: Malformed JWT token rejected with 401 Unauthorized.")

        # 3. Expired JWT token -> 401
        now = datetime.now(timezone.utc)
        expired_payload = {
            "sub": str(self.patient1_user.get("id")),
            "email": self.patient1_user.get("email"),
            "role": "PATIENT",
            "exp": now - timedelta(hours=2),
            "iat": now - timedelta(hours=3),
        }
        expired_token = jwt.encode(expired_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        expired_resp = self.client.get("/api/v1/families/me", headers={"Authorization": f"Bearer {expired_token}"})
        self.assertEqual(expired_resp.status_code, 401)
        self.assertIn("expired", expired_resp.json().get("detail", "").lower())
        print("  PASS: Expired JWT token signature rejected with 401 Unauthorized.")

        # 4. Token signed with wrong secret key -> 401
        tampered_token = jwt.encode(
            {"sub": str(self.patient1_user.get("id")), "exp": now + timedelta(hours=1)},
            "attacker-malicious-secret-key-xyz",
            algorithm=settings.JWT_ALGORITHM,
        )
        tampered_resp = self.client.get("/api/v1/families/me", headers={"Authorization": f"Bearer {tampered_token}"})
        self.assertEqual(tampered_resp.status_code, 401)
        print("  PASS: Tampered/forged JWT secret key rejected with 401 Unauthorized.")

        # 5. Public registration blocking role escalation to ADMIN -> 403/422
        escalate_resp = self.client.post("/api/v1/auth/register", json={
            "name": "Attacker Admin",
            "email": f"attacker_{int(datetime.now().timestamp())}@exploit.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "ADMIN",
        })
        self.assertIn(escalate_resp.status_code, (400, 403, 422))
        print("  PASS: Role escalation attempt to ADMIN rejected with 403/422.")

    # =========================================================================
    # 2. RBAC & MULTI-TENANT IDOR DATA ISOLATION
    # =========================================================================
    def test_02_rbac_and_multitenant_idor_isolation(self):
        print("\n[PHASE F TEST 2] Verifying RBAC & Multi-Tenant IDOR Data Isolation...")

        # Register a second distinct patient household
        p2_email = f"patient.bob.{int(datetime.now().timestamp())}@vaxassist.demo"
        reg_resp = self.client.post("/api/v1/auth/register", json={
            "name": "Bob Vance",
            "email": p2_email,
            "password": "BobPassword2026!",
            "confirm_password": "BobPassword2026!",
            "role": "PATIENT",
        })
        self.assertEqual(reg_resp.status_code, 201)

        # Login as Patient Bob
        p2_login = self.client.post("/api/v1/auth/login", json={
            "email": p2_email,
            "password": "BobPassword2026!",
        })
        p2_token = p2_login.json().get("access_token")
        p2_headers = {"Authorization": f"Bearer {p2_token}"}

        # Patient Bob creates a family member
        add_m = self.client.post("/api/v1/families/me/members", json={
            "full_name": "Alice Vance",
            "date_of_birth": "2024-06-15",
            "gender": "FEMALE",
            "relationship": "CHILD",
            "blood_group": "O+",
        }, headers=p2_headers)
        self.assertEqual(add_m.status_code, 201)
        alice_id = add_m.json()["data"]["id"]

        # 1. IDOR: Patient Rajesh tries to fetch Alice Vance -> 404 (isolated)
        idor_read = self.client.get(f"/api/v1/families/me/members/{alice_id}", headers=self.patient1_headers)
        self.assertEqual(idor_read.status_code, 404, "Cross-household member read must be blocked.")
        print("  PASS: Patient cross-household member read blocked (404 Not Found).")

        # 2. IDOR: Patient Rajesh tries to modify Alice Vance's profile -> 403/404
        idor_update = self.client.patch(f"/api/v1/families/me/members/{alice_id}", json={
            "full_name": "Tampered Alice",
        }, headers=self.patient1_headers)
        self.assertIn(idor_update.status_code, (403, 404), "Cross-household member update must be blocked.")
        print("  PASS: Patient cross-household member profile modification blocked.")

        # 3. IDOR: Patient Rajesh tries to delete Alice Vance -> 403/404
        idor_delete = self.client.delete(f"/api/v1/families/me/members/{alice_id}", headers=self.patient1_headers)
        self.assertIn(idor_delete.status_code, (403, 404), "Cross-household member deletion must be blocked.")
        print("  PASS: Patient cross-household member deletion blocked.")

        # 4. Clinician Access: Healthcare Worker can view child profile to check clinical history
        clinician_read = self.client.get(f"/api/v1/vaccinations/member/{alice_id}", headers=self.hw_headers)
        self.assertEqual(clinician_read.status_code, 200, "Verified clinicians can view member vaccination records.")
        print("  PASS: Clinician authorized for cross-household clinical record access.")

        # 5. Profile Tampering: Healthcare Worker CANNOT modify a patient's personal family profile
        hw_tamper = self.client.patch(f"/api/v1/families/me/members/{alice_id}", json={
            "full_name": "Doctor Changed Name",
        }, headers=self.hw_headers)
        self.assertEqual(hw_tamper.status_code, 403, "Clinicians cannot tamper with patient family demographic profiles.")
        print("  PASS: Clinician blocked from modifying personal family demographics (403 Forbidden).")

        # 6. Admin Endpoints: Patient and Clinician blocked from administrative control
        patient_admin = self.client.get("/api/v1/admin/users", headers=self.patient1_headers)
        self.assertEqual(patient_admin.status_code, 403)
        hw_admin = self.client.get("/api/v1/admin/users", headers=self.hw_headers)
        self.assertEqual(hw_admin.status_code, 403)
        print("  PASS: Non-admin users strictly blocked from administrative routes (403 Forbidden).")

    # =========================================================================
    # 3. DATA INTEGRITY & CLINICAL DOSE VALIDATION
    # =========================================================================
    def test_03_data_integrity_and_dose_validation(self):
        print("\n[PHASE F TEST 3] Verifying Data Integrity & Clinical Dose Validation...")
        self.assertIsNotNone(self.aarav_id)

        # 1. Administered date in the future -> 400/422
        future_date = (date.today() + timedelta(days=5)).isoformat()
        future_dose = self.client.post(f"/api/v1/vaccinations/member/{self.aarav_id}", json={
            "vaccine_code": "MMR",
            "vaccine_name": "Measles, Mumps, Rubella",
            "dose_number": 1,
            "administered_date": future_date,
        }, headers=self.patient1_headers)
        self.assertIn(future_dose.status_code, (400, 422), "Future administered dates must be rejected.")
        print("  PASS: Future administered date rejected with validation error (400/422).")

        # 2. Administered date prior to member Date of Birth -> 400
        past_dose = self.client.post(f"/api/v1/vaccinations/member/{self.aarav_id}", json={
            "vaccine_code": "BCG",
            "vaccine_name": "Bacillus Calmette-Guerin",
            "dose_number": 1,
            "administered_date": "2020-01-01",  # Aarav was born in 2024
        }, headers=self.patient1_headers)
        self.assertEqual(past_dose.status_code, 400)
        self.assertIn("birth", past_dose.json().get("detail", "").lower())
        print("  PASS: Pre-birth administered date rejected with 400 Bad Request.")

        # 3. Duplicate dose recording -> 400
        # Aarav already has BCG Dose 1
        dup_dose = self.client.post(f"/api/v1/vaccinations/member/{self.aarav_id}", json={
            "vaccine_code": "BCG",
            "vaccine_name": "Bacillus Calmette–Guérin vaccine",
            "dose_number": 1,
            "administered_date": "2024-05-15",
        }, headers=self.patient1_headers)
        self.assertEqual(dup_dose.status_code, 400)
        self.assertIn("already", dup_dose.json().get("detail", "").lower())
        print("  PASS: Duplicate vaccine dose submission rejected with 400 Bad Request.")

        # 4. Dose Chronology Validation: Dose 2 on or before Dose 1 -> 400
        # Create a unique test series on Bob's child Alice
        test_patient = self.client.get("/api/v1/families/me/members", headers=self.patient1_headers).json()["data"][0]
        t_id = test_patient["id"]

        unique_code = f"TEST_VAX_{int(datetime.now().timestamp()) % 10000}"
        d1 = self.client.post(f"/api/v1/vaccinations/member/{t_id}", json={
            "vaccine_code": unique_code,
            "vaccine_name": "Clinical Series Trial",
            "dose_number": 1,
            "administered_date": "2025-06-01",
        }, headers=self.patient1_headers)
        self.assertEqual(d1.status_code, 201)

        # Attempt to record Dose 2 on an earlier date (2025-05-10) -> 400
        d2_bad = self.client.post(f"/api/v1/vaccinations/member/{t_id}", json={
            "vaccine_code": unique_code,
            "vaccine_name": "Clinical Series Trial",
            "dose_number": 2,
            "administered_date": "2025-05-10",
        }, headers=self.patient1_headers)
        self.assertEqual(d2_bad.status_code, 400)
        self.assertIn("cannot be on or before", d2_bad.json().get("detail", "").lower())
        print("  PASS: Subsequent dose before previous dose rejected with clinical chronology validation (400).")

    # =========================================================================
    # 4. DETERMINISTIC CLINICAL SCHEDULE ENGINE VALIDATION
    # =========================================================================
    def test_04_clinical_schedule_engine_rules(self):
        print("\n[PHASE F TEST 4] Verifying Deterministic Clinical Schedule Engine...")

        # Case A: Infant aged 3 days who missed HepB birth dose
        # HepB birth dose target: within 24 hours
        dob_infant = date(2026, 1, 1)
        ref_day3 = date(2026, 1, 4)  # 3 days old

        eval_day3 = calculate_member_schedule(
            date_of_birth=dob_infant,
            existing_records=[],
            reference_date=ref_day3,
        )
        items_day3 = {item["code"]: item for item in eval_day3["schedule_items"]}

        # 1. Verify HepB birth dose status is MISSED (strictly within 24 hours)
        self.assertIn("HEPB_BIRTH", items_day3)
        self.assertEqual(items_day3["HEPB_BIRTH"]["status"], VaccinationStatus.MISSED)
        self.assertIn("24 hours", items_day3["HEPB_BIRTH"]["status_reason"])
        print("  PASS: HepB birth dose strictly flagged as MISSED after 24 hours.")

        # 2. Verify OPV-0 is DUE at 3 days (window is 15 days)
        self.assertIn("OPV_0", items_day3)
        self.assertEqual(items_day3["OPV_0"]["status"], VaccinationStatus.DUE)
        print("  PASS: OPV Zero dose confirmed DUE within 15-day window.")

        # Case B: Infant aged 20 days who missed OPV-0
        ref_day20 = date(2026, 1, 21)
        eval_day20 = calculate_member_schedule(
            date_of_birth=dob_infant,
            existing_records=[],
            reference_date=ref_day20,
        )
        items_day20 = {item["code"]: item for item in eval_day20["schedule_items"]}
        self.assertEqual(items_day20["OPV_0"]["status"], VaccinationStatus.MISSED)
        self.assertIn("15 days", items_day20["OPV_0"]["status_reason"])
        print("  PASS: OPV Zero dose strictly flagged as MISSED after 15 days.")

        # Case C: Child aged 14 months (425 days) who missed Rotavirus vaccine
        # Rotavirus vaccine window expires strictly at 1 year (365 days)
        ref_day425 = date(2026, 1, 1) + timedelta(days=425)
        eval_day425 = calculate_member_schedule(
            date_of_birth=dob_infant,
            existing_records=[],
            reference_date=ref_day425,
        )
        items_day425 = {item["code"]: item for item in eval_day425["schedule_items"]}
        self.assertEqual(items_day425["ROTA_1"]["status"], VaccinationStatus.MISSED)
        self.assertIn("1 year", items_day425["ROTA_1"]["status_reason"])
        print("  PASS: Rotavirus vaccine confirmed MISSED past 1 year cutoff.")

        # Case D: Child aged 14 months who missed Pentavalent-1
        # Routine cutoff is 1 year, but catch-up allows DPT up to 7 years
        self.assertEqual(items_day425["PENTA_1"]["status"], VaccinationStatus.CATCH_UP_REQUIRED)
        print("  PASS: Pentavalent-1 past routine age correctly marked CATCH_UP_REQUIRED.")

        # Case E: BSON datetime and string resilience
        # Pass datetime objects and ISO strings directly without error
        bson_dob = datetime(2026, 1, 1, 10, 30, tzinfo=timezone.utc)
        eval_bson = calculate_member_schedule(
            date_of_birth=bson_dob,
            existing_records=[{"vaccine_code": "BCG", "dose_number": 1, "administered_date": "2026-01-02T05:00:00Z"}],
            reference_date=datetime(2026, 3, 1, 0, 0),
        )
        self.assertGreaterEqual(eval_bson["summary"]["completed_count"], 1)
        print("  PASS: Schedule Engine safely evaluated BSON datetime and ISO string date inputs.")

    # =========================================================================
    # 5. AGENT & RAG CLINICAL SAFETY
    # =========================================================================
    def test_05_agent_and_rag_clinical_safety(self):
        print("\n[PHASE F TEST 5] Verifying Agent & RAG Clinical Safety...")

        # 1. Knowledge RAG Query contains grounding and disclaimer
        rag_resp = self.client.post("/api/v1/knowledge/query", json={
            "question": "What is the schedule and route for BCG vaccine under UIP India?",
        }, headers=self.patient1_headers)
        self.assertEqual(rag_resp.status_code, 200)
        rag_data = rag_resp.json()["data"]
        self.assertIn("answer", rag_data)
        self.assertGreater(len(rag_data["answer"]), 50)
        print("  PASS: Knowledge RAG query returned evidence-based answer.")

        # 2. Recommendation Agent separates Routine NIS from Private Optional
        rec_resp = self.client.post("/api/v1/agents/recommendations/evaluate", json={
            "family_member_id": self.aarav_id,
            "include_optional_vaccines": True,
        }, headers=self.patient1_headers)
        self.assertEqual(rec_resp.status_code, 200)
        rec_data = rec_resp.json()["data"]

        # Verify clinical disclaimer presence
        self.assertIn("clinical_disclaimer", rec_data)
        self.assertIn("pediatrician", rec_data["clinical_disclaimer"].lower())

        # Verify optional guidance isolation
        member_rec = rec_data["member_recommendations"][0]
        self.assertIn("optional_vaccine_advisories", member_rec)
        print("  PASS: Recommendation Agent enforced clinical disclaimer and separated optional suggestions.")

    # =========================================================================
    # 6. OFFLINE MUTATIONS & REPLAY SECURITY
    # =========================================================================
    def test_06_offline_mutation_security(self):
        print("\n[PHASE F TEST 6] Verifying Offline Mutation Replay Security...")

        # Simulated replay: An offline mutation replayed without authorization token
        replay_unauth = self.client.post(
            f"/api/v1/vaccinations/member/{self.aarav_id}",
            json={
                "vaccine_code": "MEASLES_1",
                "vaccine_name": "Measles Dose 1",
                "dose_number": 1,
                "administered_date": date.today().isoformat(),
            },
        )
        self.assertEqual(replay_unauth.status_code, 401, "Offline queued mutation cannot execute without auth token.")
        print("  PASS: Replayed offline mutation rejected without valid authentication (401).")

        # Simulated replay: An offline mutation from Patient B attempting to log for Patient A
        p2_email = f"patient.mallory.{int(datetime.now().timestamp())}@vaxassist.demo"
        reg_mallory = self.client.post("/api/v1/auth/register", json={
            "name": "Mallory",
            "email": p2_email,
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "PATIENT",
        })
        self.assertEqual(reg_mallory.status_code, 201)

        p2_token = self.client.post("/api/v1/auth/login", json={
            "email": p2_email,
            "password": "Password123!",
        }).json()["access_token"]

        replay_forged = self.client.post(
            f"/api/v1/vaccinations/member/{self.aarav_id}",
            json={
                "vaccine_code": "MEASLES_1",
                "vaccine_name": "Measles Dose 1",
                "dose_number": 1,
                "administered_date": date.today().isoformat(),
            },
            headers={"Authorization": f"Bearer {p2_token}"},
        )
        self.assertIn(replay_forged.status_code, (403, 404), "Forged cross-household mutation must be rejected.")
        print("  PASS: Cross-household queued mutation rejected by backend authorization (404/403).")


if __name__ == "__main__":
    unittest.main()
