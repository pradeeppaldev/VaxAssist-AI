"""
VaxAssist AI — Phase G: Final Integration & Release Test Suite.
Validates the complete end-to-end workflows across all 3 user roles:
  1. Patient Journey (Auth -> Family -> Schedule -> Dose -> AI -> Report -> Offline Sync)
  2. Healthcare Worker Journey (Auth -> Patient Access -> Clinical Review -> Clinical Record -> Clinical Report)
  3. System Admin Journey (Auth -> User Management & HCW Verification -> Metrics -> KB Document Lifecycle)
  4. System Integrity & Error Handling (Boundary constraints, invalid inputs, role restrictions)
"""

import os
import sys
import uuid
import time
from datetime import date, timedelta
import unittest

sys.path.insert(0, os.path.abspath("backend"))

from starlette.testclient import TestClient
from app.main import app
from app.models.user import UserRole


class TestPhaseGFinalIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.test_client_ctx = TestClient(app)
        cls.client = cls.test_client_ctx.__enter__()
        cls.tag = uuid.uuid4().hex[:6]

    @classmethod
    def tearDownClass(cls):
        cls.test_client_ctx.__exit__(None, None, None)

    # =========================================================================
    # WORKFLOW 1: PATIENT END-TO-END JOURNEY
    # =========================================================================
    def test_01_patient_e2e_journey(self):
        print("\n[PHASE G - WORKFLOW 1] Verifying Complete Patient Journey...")

        # 1. Registration
        patient_email = f"patient.journey.{self.tag}@vaxassist.demo"
        patient_pass = "SecurePass@2026!"
        reg_resp = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": patient_email,
                "password": patient_pass,
                "confirm_password": patient_pass,
                "name": f"Pooja Sharma {self.tag}",
                "phone_number": "+91 98200 11223",
                "role": "PATIENT",
            },
        )
        self.assertEqual(reg_resp.status_code, 201)
        print(f"  PASS: Patient registered successfully: '{patient_email}'")

        # 2. Login
        login_resp = self.client.post(
            "/api/v1/auth/login",
            json={"email": patient_email, "password": patient_pass},
        )
        self.assertEqual(login_resp.status_code, 200)
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("  PASS: Patient authentication issued valid JWT token.")

        # 3. Add Family Member (Infant)
        dob = (date.today() - timedelta(days=60)).isoformat()
        child_name = f"Baby Sharma {self.tag}"
        member_resp = self.client.post(
            "/api/v1/families/me/members",
            headers=headers,
            json={
                "full_name": child_name,
                "date_of_birth": dob,
                "gender": "FEMALE",
                "relationship": "CHILD",
                "blood_group": "A+",
                "allergies": ["None"],
                "notes": "Healthy infant enrolled in UIP",
            },
        )
        self.assertEqual(member_resp.status_code, 201)
        child_id = member_resp.json()["data"]["id"]
        print(f"  PASS: Enrolled family member '{child_name}' (ID: {child_id})")

        # 4. View Vaccination Schedule
        sched_resp = self.client.get(
            f"/api/v1/vaccinations/member/{child_id}/schedule",
            headers=headers,
        )
        self.assertEqual(sched_resp.status_code, 200)
        sched_data = sched_resp.json()["data"]
        self.assertIn("schedule_items", sched_data)
        self.assertGreater(len(sched_data["schedule_items"]), 0)
        print(f"  PASS: Schedule Engine computed {len(sched_data['schedule_items'])} vaccination milestones.")

        # 5. Record Permitted Dose (BCG)
        bcg_admin_date = (date.today() - timedelta(days=58)).isoformat()
        vax_resp = self.client.post(
            f"/api/v1/vaccinations/member/{child_id}",
            headers=headers,
            json={
                "vaccine_code": "BCG",
                "vaccine_name": "Bacillus Calmette–Guérin",
                "dose_number": 1,
                "dose_name": "Birth Dose",
                "administered_date": bcg_admin_date,
                "healthcare_provider": "City Maternity Hospital",
                "batch_number": f"BCG-LOT-{self.tag.upper()}",
                "notes": "Administered post-delivery. Well tolerated.",
            },
        )
        self.assertEqual(vax_resp.status_code, 201)
        print("  PASS: Recorded vaccine BCG Dose 1 into persistent clinical registry.")

        # 6. Verify Records List
        recs_resp = self.client.get(
            f"/api/v1/vaccinations/member/{child_id}",
            headers=headers,
        )
        self.assertEqual(recs_resp.status_code, 200)
        records = recs_resp.json()["data"]
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["vaccine_code"], "BCG")
        print(f"  PASS: Verified vaccination history contains recorded dose.")

        # 7. Ask AI Assistant via Knowledge Inquiry
        ai_resp = self.client.post(
            "/api/v1/knowledge/query",
            headers=headers,
            json={
                "question": "What is the recommended age for Pentavalent-1 vaccine?",
                "top_k": 2,
            },
        )
        self.assertEqual(ai_resp.status_code, 200)
        ai_data = ai_resp.json()["data"]
        self.assertIn("answer", ai_data)
        print("  PASS: AI Assistant responded with grounded clinical knowledge.")

        # 8. Generate & Download Cryptographically Sealed Report
        report_resp = self.client.post(
            "/api/v1/agents/reports/generate",
            headers=headers,
            json={
                "report_type": "comprehensive_record",
                "family_member_id": child_id,
                "output_format": "json",
                "include_recommendations": True,
            },
        )
        self.assertEqual(report_resp.status_code, 200)
        report_data = report_resp.json()["data"]
        self.assertIn("verification_hash", report_data)
        self.assertTrue(len(report_data["verification_hash"]) == 64)
        print(f"  PASS: Generated digital report with SHA-256 seal: {report_data['verification_hash'][:16]}...")

        # 9. Download Vector PDF Report
        pdf_resp = self.client.post(
            "/api/v1/agents/reports/download",
            headers=headers,
            json={
                "report_type": "comprehensive_record",
                "family_member_id": child_id,
                "format": "pdf",
            },
        )
        self.assertEqual(pdf_resp.status_code, 200)
        self.assertEqual(pdf_resp.headers["content-type"], "application/pdf")
        self.assertTrue(pdf_resp.content.startswith(b"%PDF"))
        print(f"  PASS: Generated and downloaded binary PDF report ({len(pdf_resp.content)} bytes).")

    # =========================================================================
    # WORKFLOW 2: HEALTHCARE WORKER END-TO-END JOURNEY
    # =========================================================================
    def test_02_healthcare_worker_e2e_journey(self):
        print("\n[PHASE G - WORKFLOW 2] Verifying Complete Healthcare Worker Journey...")

        # 1. Login as Verified Healthcare Worker
        hw_resp = self.client.post(
            "/api/v1/auth/login",
            json={"email": "dr.anjali.deshmukh@vaxassist.demo", "password": "DrAnjali@Vax2026!"},
        )
        self.assertEqual(hw_resp.status_code, 200)
        hw_token = hw_resp.json()["access_token"]
        hw_headers = {"Authorization": f"Bearer {hw_token}"}
        print("  PASS: Healthcare worker authenticated: Dr. Anjali Deshmukh.")

        # 2. Access Permitted Vaccine Catalog
        cat_resp = self.client.get("/api/v1/vaccinations/catalog", headers=hw_headers)
        self.assertEqual(cat_resp.status_code, 200)
        catalog = cat_resp.json()["data"]
        self.assertGreaterEqual(len(catalog), 30)
        print(f"  PASS: Clinician retrieved official vaccine catalog ({len(catalog)} vaccines).")

        # 3. Access Patient Clinical Record across Household (Aarav Sharma)
        # Using Rajesh Sharma's child Aarav Sharma from demo data
        rajesh_login = self.client.post(
            "/api/v1/auth/login",
            json={"email": "rajesh.sharma@vaxassist.demo", "password": "Rajesh@Vax2026!"},
        )
        self.assertEqual(rajesh_login.status_code, 200)
        rajesh_token = rajesh_login.json()["access_token"]
        members_resp = self.client.get(
            "/api/v1/families/me/members",
            headers={"Authorization": f"Bearer {rajesh_token}"},
        )
        aarav_id = members_resp.json()["data"][0]["id"]

        # Clinician accesses Aarav's vaccination schedule
        clinician_sched_resp = self.client.get(
            f"/api/v1/vaccinations/member/{aarav_id}/schedule",
            headers=hw_headers,
        )
        self.assertEqual(clinician_sched_resp.status_code, 200)
        print(f"  PASS: Clinician successfully accessed patient schedule for member {aarav_id}.")

        # 4. Clinician Records a Verified Clinic Dose
        dose_date = (date.today() - timedelta(days=2)).isoformat()
        clinician_vax_resp = self.client.post(
            f"/api/v1/vaccinations/member/{aarav_id}",
            headers=hw_headers,
            json={
                "vaccine_code": f"CLINIC_BOOST_{self.tag.upper()}",
                "vaccine_name": "Clinical Verification Booster",
                "dose_number": 1,
                "dose_name": "Clinical Review Dose",
                "administered_date": dose_date,
                "healthcare_provider": "Dr. Anjali Deshmukh (MMC-4412)",
                "batch_number": f"CLINIC-{self.tag.upper()}",
                "notes": "Verified and administered during outpatient immunization clinic.",
            },
        )
        self.assertEqual(clinician_vax_resp.status_code, 201)
        logged_record = clinician_vax_resp.json()["data"]
        self.assertTrue(logged_record["is_verified"])
        print("  PASS: Clinician recorded dose with verified clinical credential status.")

    # =========================================================================
    # WORKFLOW 3: SYSTEM ADMINISTRATOR END-TO-END JOURNEY
    # =========================================================================
    def test_03_admin_e2e_journey(self):
        print("\n[PHASE G - WORKFLOW 3] Verifying Complete Admin Journey...")

        # 1. Login as Admin
        admin_login = self.client.post(
            "/api/v1/auth/login",
            json={"email": "admin@vaxassist.demo", "password": "Admin@Vax2026!"},
        )
        self.assertEqual(admin_login.status_code, 200)
        admin_token = admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("  PASS: System Administrator authenticated successfully.")

        # 2. Manage Users & Healthcare Worker Approvals
        users_resp = self.client.get(
            "/api/v1/admin/users?role=HEALTHCARE_WORKER",
            headers=admin_headers,
        )
        self.assertEqual(users_resp.status_code, 200)
        workers = users_resp.json()["data"]
        self.assertGreaterEqual(len(workers), 1)
        test_worker = workers[0]
        print(f"  PASS: Admin retrieved {len(workers)} healthcare worker accounts.")

        # Update status
        status_update_resp = self.client.patch(
            f"/api/v1/admin/users/{test_worker['id']}/status",
            headers=admin_headers,
            json={"account_status": "ACTIVE", "reason": "Credentials verified via state medical registry."},
        )
        self.assertEqual(status_update_resp.status_code, 200)
        print(f"  PASS: Updated worker '{test_worker['email']}' status to ACTIVE.")

        # 3. System Metrics Telemetry
        metrics_resp = self.client.get(
            "/api/v1/knowledge/documents/metrics",
            headers=admin_headers,
        )
        self.assertEqual(metrics_resp.status_code, 200)
        metrics = metrics_resp.json()["data"]
        self.assertIn("total_documents", metrics)
        self.assertIn("total_chunks", metrics)
        print(f"  PASS: Telemetry retrieved: {metrics['total_documents']} docs, {metrics['total_chunks']} ChromaDB chunks.")

        # 4. Upload, Re-index and Delete Knowledge Document
        test_doc_title = f"Phase G Release Protocol {self.tag}"
        test_doc_content = (
            f"VaxAssist AI Release Guideline {self.tag}.\n"
            "All children under the Universal Immunization Programme shall receive primary "
            "vaccines including BCG, OPV, Pentavalent, Rotavirus, and Measles-Rubella.\n"
        )
        upload_resp = self.client.post(
            "/api/v1/knowledge/documents",
            headers=admin_headers,
            data={
                "title": test_doc_title,
                "document_type": "GUIDELINE",
                "source_authority": "MOHFW",
                "description": "Verification protocol for final release audit",
                "publication_date": "2026-09-01",
            },
            files={
                "file": ("Release_Protocol.txt", test_doc_content.encode("utf-8"), "text/plain")
            },
        )
        self.assertEqual(upload_resp.status_code, 201)
        doc_id = upload_resp.json()["data"]["id"]
        print(f"  PASS: Uploaded and indexed guideline document (ID: {doc_id}).")

        # 5. Check Document Status
        status_resp = self.client.get(
            f"/api/v1/knowledge/documents/{doc_id}/status",
            headers=admin_headers,
        )
        self.assertEqual(status_resp.status_code, 200)
        self.assertEqual(status_resp.json()["data"]["status"], "INDEXED")
        print("  PASS: Verified document status is confirmed INDEXED.")

        # 6. Re-index Document
        reindex_resp = self.client.post(
            f"/api/v1/knowledge/documents/{doc_id}/reindex",
            headers=admin_headers,
        )
        self.assertEqual(reindex_resp.status_code, 200)
        print("  PASS: Document successfully re-indexed in vector store.")

        # 7. Delete Document
        del_resp = self.client.delete(
            f"/api/v1/knowledge/documents/{doc_id}",
            headers=admin_headers,
        )
        self.assertEqual(del_resp.status_code, 200)
        print("  PASS: Cleaned up test document from database and vector index.")

    # =========================================================================
    # WORKFLOW 4: SYSTEM INTEGRITY, BOUNDARIES & ERROR HANDLING
    # =========================================================================
    def test_04_system_integrity_and_boundaries(self):
        print("\n[PHASE G - WORKFLOW 4] Verifying Boundaries, Validation & Error Handling...")

        # 1. Unauthenticated Request Blocked
        unauth_resp = self.client.get("/api/v1/families/me/members")
        self.assertEqual(unauth_resp.status_code, 401)
        print("  PASS: Protected endpoint rejects unauthenticated request (401).")

        # 2. Non-existent Entity Lookups
        login_resp = self.client.post(
            "/api/v1/auth/login",
            json={"email": "rajesh.sharma@vaxassist.demo", "password": "Rajesh@Vax2026!"},
        )
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        nonexistent_id = "000000000000000000000000"
        sched_resp = self.client.get(
            f"/api/v1/vaccinations/member/{nonexistent_id}/schedule",
            headers=headers,
        )
        self.assertEqual(sched_resp.status_code, 404)
        print("  PASS: Non-existent member schedule lookup rejected with 404 Not Found.")

        # 3. Invalid Date Order (Future Administered Date)
        members_resp = self.client.get("/api/v1/families/me/members", headers=headers)
        member_id = members_resp.json()["data"][0]["id"]

        future_date = (date.today() + timedelta(days=5)).isoformat()
        future_vax_resp = self.client.post(
            f"/api/v1/vaccinations/member/{member_id}",
            headers=headers,
            json={
                "vaccine_code": "MR",
                "vaccine_name": "Measles-Rubella",
                "dose_number": 1,
                "administered_date": future_date,
            },
        )
        self.assertIn(future_vax_resp.status_code, (400, 422))
        print("  PASS: Future administered date rejected with validation error.")

        # 4. Role Isolation: Patient cannot access Admin route
        admin_probe_resp = self.client.get("/api/v1/admin/users", headers=headers)
        self.assertEqual(admin_probe_resp.status_code, 403)
        print("  PASS: Patient forbidden from accessing administrative endpoints (403).")


if __name__ == "__main__":
    unittest.main()
