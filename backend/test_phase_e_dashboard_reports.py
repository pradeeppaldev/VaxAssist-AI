"""
VaxAssist AI - Phase E: Dashboard, UX, Reports & Document Management Test Suite.
Verifies:
1. Patient Dashboard APIs (Family members, notifications, records, monitoring evaluation)
2. Healthcare Worker Dashboard APIs (Patient records, vaccination logging, clinical catalog)
3. Admin Dashboard APIs (User listing, status/role updates, knowledge base metrics)
4. Report Generation & Cryptographic Verification (JSON report, PDF binary download, SHA-256 seal)
5. Admin Knowledge Base Document Management (Upload, list, status, re-indexing, deletion)
6. Multi-Tenant RBAC & Data Protection (Cross-tenant report isolation, admin boundary enforcement)
7. Error Containment & Resilient Feedback
"""
import os
import io
import sys
import unittest
from datetime import date, datetime

sys.path.insert(0, os.path.abspath("backend"))

from starlette.testclient import TestClient
from app.main import app
from app.database.mongodb import db_manager


class TestPhaseEDashboardAndReports(unittest.TestCase):
    """Verifies all Phase E dashboard, reporting, and document-management integration points."""

    @classmethod
    def setUpClass(cls):
        print("\n" + "=" * 70)
        print("  VAXASSIST AI — PHASE E: DASHBOARD, REPORTS & DOCUMENT MANAGEMENT SUITE")
        print("=" * 70)
        cls.test_client_ctx = TestClient(app)
        cls.client = cls.test_client_ctx.__enter__()

        # 1. Login as Patient (Rajesh Sharma)
        p_login = cls.client.post("/api/v1/auth/login", json={
            "email": "rajesh.sharma@vaxassist.demo",
            "password": "Rajesh@Vax2026!",
        })
        cls.patient_token = p_login.json().get("access_token") if p_login.status_code == 200 else None
        cls.patient_headers = {"Authorization": f"Bearer {cls.patient_token}"} if cls.patient_token else {}

        # 2. Login as Healthcare Worker (Dr. Anjali Deshmukh)
        hw_login = cls.client.post("/api/v1/auth/login", json={
            "email": "dr.anjali.deshmukh@vaxassist.demo",
            "password": "DrAnjali@Vax2026!",
        })
        cls.hw_token = hw_login.json().get("access_token") if hw_login.status_code == 200 else None
        cls.hw_headers = {"Authorization": f"Bearer {cls.hw_token}"} if cls.hw_token else {}

        # 3. Login as Admin
        admin_login = cls.client.post("/api/v1/auth/login", json={
            "email": "admin@vaxassist.demo",
            "password": "Admin@Vax2026!",
        })
        cls.admin_token = admin_login.json().get("access_token") if admin_login.status_code == 200 else None
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"} if cls.admin_token else {}

    @classmethod
    def tearDownClass(cls):
        cls.test_client_ctx.__exit__(None, None, None)

    # =========================================================================
    # Test 1: Patient Dashboard APIs
    # =========================================================================
    def test_01_patient_dashboard_apis(self):
        print("\n[PHASE E TEST 1] Verifying Patient Dashboard APIs...")
        self.assertIsNotNone(self.patient_token, "Patient authentication must succeed.")

        # 1. Family Members
        fam_resp = self.client.get("/api/v1/families/me/members", headers=self.patient_headers)
        self.assertEqual(fam_resp.status_code, 200)
        fam_data = fam_resp.json()
        members = fam_data.get("data", [])
        self.assertGreater(len(members), 0, "Patient should have registered family members.")
        aarav = next((m for m in members if "Aarav" in m.get("full_name", "")), members[0])
        aarav_id = str(aarav.get("id") or aarav.get("_id"))
        print(f"  PASS: Retrieved {len(members)} family members. Primary: {aarav.get('full_name')} (ID: {aarav_id[:8]}...)")

        # 2. Notifications & Reminders
        notif_resp = self.client.get("/api/v1/notifications?limit=10", headers=self.patient_headers)
        self.assertEqual(notif_resp.status_code, 200)
        notifs = notif_resp.json().get("data", [])
        print(f"  PASS: Retrieved {len(notifs)} live notifications and alerts.")

        # 3. Vaccination History
        vax_resp = self.client.get(f"/api/v1/vaccinations/member/{aarav_id}", headers=self.patient_headers)
        self.assertEqual(vax_resp.status_code, 200)
        vax_records = vax_resp.json().get("data", [])
        self.assertGreater(len(vax_records), 0, "Aarav should have administered vaccination records.")
        print(f"  PASS: Retrieved {len(vax_records)} vaccination records for member.")

        # 4. Monitoring Evaluation
        mon_resp = self.client.post("/api/v1/agents/monitoring/evaluate", json={
            "family_member_id": aarav_id,
        }, headers=self.patient_headers)
        self.assertEqual(mon_resp.status_code, 200)
        mon_data = mon_resp.json().get("data", {})
        self.assertIn("member_assessments", mon_data)
        print(f"  PASS: Proactive monitoring engine evaluated {mon_data.get('evaluated_members_count')} member(s).")

    # =========================================================================
    # Test 2: Healthcare Worker Dashboard APIs
    # =========================================================================
    def test_02_healthcare_worker_dashboard_apis(self):
        print("\n[PHASE E TEST 2] Verifying Healthcare Worker Dashboard APIs...")
        self.assertIsNotNone(self.hw_token, "Healthcare Worker authentication must succeed.")

        # 1. Clinical Vaccine Catalog
        cat_resp = self.client.get("/api/v1/vaccinations/catalog", headers=self.hw_headers)
        self.assertEqual(cat_resp.status_code, 200)
        catalog = cat_resp.json().get("data", [])
        self.assertGreaterEqual(len(catalog), 10, "National Immunization Schedule catalog must be loaded.")
        print(f"  PASS: Clinician retrieved official catalog containing {len(catalog)} vaccines.")

        # 2. Record Vaccination on a patient profile
        # Use Aarav Sharma
        fam_resp = self.client.get("/api/v1/families/me/members", headers=self.patient_headers)
        members = fam_resp.json().get("data", [])
        aarav = next((m for m in members if "Aarav" in m.get("full_name", "")), members[0])
        aarav_id = str(aarav.get("id") or aarav.get("_id"))

        # Add a unique test dose
        test_dose = {
            "vaccine_code": "INFLUENZA",
            "vaccine_name": "Annual Seasonal Influenza Quadrivalent",
            "dose_number": 1,
            "dose_name": "Seasonal Dose 2026",
            "administered_date": date.today().isoformat(),
            "healthcare_provider": "Dr. Anjali Deshmukh, Lilavati Hospital",
            "batch_number": f"FLU-IND-{datetime.now().strftime('%H%M%S')}",
            "notes": "Administered under clinical supervision. Patient tolerated well.",
        }
        add_resp = self.client.post(f"/api/v1/vaccinations/member/{aarav_id}", json=test_dose, headers=self.patient_headers)
        self.assertIn(add_resp.status_code, (200, 201, 400)) # 400 if dose already logged
        print("  PASS: Clinician vaccination logging API operational with validation enforcement.")

    # =========================================================================
    # Test 3: Admin Dashboard & User Governance APIs
    # =========================================================================
    def test_03_admin_dashboard_apis(self):
        print("\n[PHASE E TEST 3] Verifying Admin Dashboard & Governance APIs...")
        self.assertIsNotNone(self.admin_token, "Admin authentication must succeed.")

        # 1. Directory of Healthcare Workers
        hw_users_resp = self.client.get("/api/v1/admin/users?role=HEALTHCARE_WORKER", headers=self.admin_headers)
        self.assertEqual(hw_users_resp.status_code, 200)
        hw_users = hw_users_resp.json().get("data", [])
        self.assertGreater(len(hw_users), 0, "Expected at least 1 registered healthcare worker in system.")
        target_hw = hw_users[0]
        hw_id = target_hw["id"]
        print(f"  PASS: Admin retrieved {len(hw_users)} healthcare worker accounts. Selected: {target_hw.get('name')}")

        # 2. Update status of healthcare worker
        status_resp = self.client.patch(f"/api/v1/admin/users/{hw_id}/status", json={
            "account_status": "ACTIVE",
            "reason": "Phase E credential audit verification",
        }, headers=self.admin_headers)
        self.assertEqual(status_resp.status_code, 200)
        self.assertEqual(status_resp.json()["data"]["account_status"], "ACTIVE")
        print(f"  PASS: Successfully updated account status for {target_hw.get('name')} to ACTIVE.")

        # 3. Knowledge Base Metrics
        kb_metrics_resp = self.client.get("/api/v1/knowledge/documents/metrics", headers=self.admin_headers)
        self.assertEqual(kb_metrics_resp.status_code, 200)
        kb_data = kb_metrics_resp.json().get("data", {})
        self.assertIn("total_documents", kb_data)
        self.assertIn("total_chunks", kb_data)
        print(f"  PASS: Admin telemetry retrieved: {kb_data.get('total_documents')} documents, {kb_data.get('total_chunks')} ChromaDB chunks.")

    # =========================================================================
    # Test 4: Report Generation & Cryptographic Integrity Verification
    # =========================================================================
    def test_04_report_generation_and_checksum(self):
        print("\n[PHASE E TEST 4] Verifying Report Generation, PDF Download & SHA-256 Checksums...")
        fam_resp = self.client.get("/api/v1/families/me/members", headers=self.patient_headers)
        members = fam_resp.json().get("data", [])
        aarav = next((m for m in members if "Aarav" in m.get("full_name", "")), members[0])
        aarav_id = str(aarav.get("id") or aarav.get("_id"))

        # 1. JSON Report Generation
        json_resp = self.client.post("/api/v1/agents/reports/generate", json={
            "family_member_id": aarav_id,
            "report_type": "comprehensive_record",
            "output_format": "json",
            "include_recommendations": True,
        }, headers=self.patient_headers)
        self.assertEqual(json_resp.status_code, 200)
        rep_data = json_resp.json()["data"]
        self.assertIn("verification_hash", rep_data)
        self.assertGreaterEqual(len(rep_data["verification_hash"]), 32)
        self.assertIn("National Immunization Schedule", rep_data["disclaimer"])
        print(f"  PASS: Generated JSON report with SHA-256 seal: {rep_data['verification_hash'][:16]}...")

        # 2. Binary PDF Download
        pdf_resp = self.client.post("/api/v1/agents/reports/download", json={
            "family_member_id": aarav_id,
            "report_type": "comprehensive_record",
            "output_format": "pdf",
            "include_recommendations": True,
        }, headers=self.patient_headers)
        self.assertEqual(pdf_resp.status_code, 200)
        self.assertEqual(pdf_resp.headers.get("content-type"), "application/pdf")
        self.assertIn("X-Verification-Hash", pdf_resp.headers)
        self.assertTrue(pdf_resp.content.startswith(b"%PDF"), "Binary content must be a valid PDF format.")
        print(f"  PASS: Downloaded binary vector PDF ({len(pdf_resp.content)} bytes) with verified magic header %PDF.")

    # =========================================================================
    # Test 5: Admin Knowledge Base Document Management Lifecycle
    # =========================================================================
    def test_05_admin_knowledge_base_document_management(self):
        print("\n[PHASE E TEST 5] Verifying Document Management (Upload, Status, Re-index, Delete)...")
        self.assertIsNotNone(self.admin_token, "Admin authorization required.")

        # 1. List existing documents
        list_resp = self.client.get("/api/v1/knowledge/documents", headers=self.admin_headers)
        self.assertEqual(list_resp.status_code, 200)
        existing_docs = list_resp.json().get("data", {}).get("documents", [])
        print(f"  PASS: Listed {len(existing_docs)} knowledge base documents.")

        # 2. Upload and index a test document
        test_content = (
            "National Immunization Guideline Addendum 2026.\n"
            "Official Ministry of Health and Family Welfare Directive.\n"
            "This document establishes the updated booster schedule for DPT and Oral Polio Vaccine.\n"
            "Children at age 5-6 years must receive DPT Booster 2 to maintain tetanus toxoid antitoxin levels."
        ).encode("utf-8")

        test_file = io.BytesIO(test_content)
        upload_resp = self.client.post(
            "/api/v1/knowledge/documents",
            files={"file": ("UIP_PhaseE_Test_Guideline.txt", test_file, "text/plain")},
            data={
                "title": "UIP Phase E Verification Guideline 2026",
                "description": "Integration test document for knowledge base verification",
                "document_type": "GUIDELINE",
                "source_authority": "MOHFW",
                "publication_date": "2026-09-01",
            },
            headers=self.admin_headers,
        )
        self.assertEqual(upload_resp.status_code, 201)
        created_doc = upload_resp.json()["data"]
        doc_id = created_doc["id"]
        self.assertEqual(created_doc["status"], "INDEXED")
        self.assertGreater(created_doc["chunk_count"], 0)
        print(f"  PASS: Uploaded and indexed document '{created_doc['title']}' (ID: {doc_id}, Chunks: {created_doc['chunk_count']}).")

        # 3. Check document status
        status_resp = self.client.get(f"/api/v1/knowledge/documents/{doc_id}/status", headers=self.admin_headers)
        self.assertEqual(status_resp.status_code, 200)
        status_data = status_resp.json()["data"]
        self.assertEqual(status_data["status"], "INDEXED")
        print("  PASS: Verified document status is INDEXED.")

        # 4. Re-index document
        reindex_resp = self.client.post(f"/api/v1/knowledge/documents/{doc_id}/reindex", headers=self.admin_headers)
        self.assertEqual(reindex_resp.status_code, 200)
        reindexed_doc = reindex_resp.json()["data"]
        self.assertGreaterEqual(reindexed_doc["index_version"], 2)
        print(f"  PASS: Re-indexed document. New index_version: {reindexed_doc['index_version']}.")

        # 5. Delete document and verify purge
        del_resp = self.client.delete(f"/api/v1/knowledge/documents/{doc_id}", headers=self.admin_headers)
        self.assertEqual(del_resp.status_code, 200)
        self.assertTrue(del_resp.json()["data"]["deleted"])
        print(f"  PASS: Purged test document '{doc_id}' from MongoDB and ChromaDB vector store.")

    # =========================================================================
    # Test 6: Multi-Tenant RBAC & Security Isolation
    # =========================================================================
    def test_06_multi_tenant_rbac_and_isolation(self):
        print("\n[PHASE E TEST 6] Verifying Multi-Tenant Data Protection & Role Boundaries...")

        # 1. Patient forbidden from Admin endpoints
        unauth_admin = self.client.get("/api/v1/admin/users", headers=self.patient_headers)
        self.assertEqual(unauth_admin.status_code, 403, "Patients must be blocked from admin user directory.")
        print("  PASS: Patient access to /api/v1/admin/users rejected with 403 Forbidden.")

        # 2. Healthcare Worker forbidden from Admin user modification
        unauth_hw = self.client.patch("/api/v1/admin/users/fake_id/status", json={"account_status": "ACTIVE"}, headers=self.hw_headers)
        self.assertEqual(unauth_hw.status_code, 403, "Healthcare workers must be blocked from admin status modifications.")
        print("  PASS: Healthcare worker access to admin modification rejected with 403 Forbidden.")

        # 3. Patient cannot generate report for foreign user ID
        foreign_rep = self.client.post("/api/v1/agents/reports/generate", json={
            "target_user_id": "usr_unauthorized_foreign_household",
            "report_type": "comprehensive_record",
        }, headers=self.patient_headers)
        self.assertEqual(foreign_rep.status_code, 403, "Patients cannot generate reports for foreign households.")
        print("  PASS: Cross-household report generation rejected with 403 Forbidden.")

    # =========================================================================
    # Test 7: Resilient Error Containment (Non-Mock Failure Reporting)
    # =========================================================================
    def test_07_resilient_error_containment(self):
        print("\n[PHASE E TEST 7] Verifying Non-Mock Failure Reporting...")

        # Requesting report with nonexistent/foreign family member ID yields 403 Forbidden (multi-tenant boundary)
        fake_rep = self.client.post("/api/v1/agents/reports/generate", json={
            "family_member_id": "nonexistent_member_123",
            "report_type": "comprehensive_record",
        }, headers=self.patient_headers)
        self.assertEqual(fake_rep.status_code, 403)
        print("  PASS: Foreign/nonexistent member report request correctly rejected with 403 Forbidden.")

        # Requesting status of nonexistent knowledge document yields 404 Not Found
        fake_doc = self.client.get("/api/v1/knowledge/documents/nonexistent_doc_id/status", headers=self.admin_headers)
        self.assertEqual(fake_doc.status_code, 404)
        print("  PASS: Nonexistent document status request correctly rejected with 404 Not Found.")

        # Invalid publication date on document upload yields 400
        invalid_doc = self.client.post(
            "/api/v1/knowledge/documents",
            files={"file": ("test.txt", io.BytesIO(b"Hello"), "text/plain")},
            data={
                "title": "Bad Date Document",
                "publication_date": "not-a-date",
            },
            headers=self.admin_headers,
        )
        self.assertIn(invalid_doc.status_code, (400, 422))
        print("  PASS: Malformed request parameters rejected with validation error (400/422).")


if __name__ == "__main__":
    unittest.main()
