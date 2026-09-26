# VaxAssist AI — Comprehensive User Guide

Welcome to **VaxAssist AI**, an intelligent digital vaccination tracking and clinical decision support system designed under the framework of India's **Universal Immunization Programme (UIP)**.

---

## 👥 User Roles Overview

The system provides three distinct, role-tailored experiences:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VaxAssist AI User Roles                         │
├────────────────────┬─────────────────────────────┬─────────────────────┤
│ 👨‍👩‍👧 Patient / Family│ 🩺 Healthcare Worker (HCW)  │ 🛡️ System Admin     │
├────────────────────┼─────────────────────────────┼─────────────────────┤
│ • Household Profiles│ • Outpatient Clinic Registry│ • User Moderation   │
│ • Schedule Timeline│ • Cross-Household Records   │ • HCW Verification  │
│ • Dose Logging     │ • Verified Dose Recording   │ • Vector Telemetry  │
│ • AI Assistant     │ • Clinical AEFI Tracking    │ • KB Document RAG   │
│ • PDF Certificates │ • Clinical Certifications   │ • System Settings   │
└────────────────────┴─────────────────────────────┴─────────────────────┘
```

---

## 👨‍👩‍👧 1. Patient & Family User Guide

### 1.1 Account Access
- **Register a New Account:** Navigate to `/register`, provide your full name, email, phone number, and a secure password. New self-registrations automatically receive the `PATIENT` role.
- **Log In:** Navigate to `/login` and submit your credentials.
- **Demo Account:**
  - **Email:** `rajesh.sharma@vaxassist.demo`
  - **Password:** `Rajesh@Vax2026!`

### 1.2 Patient Dashboard (`/dashboard`)
Upon logging in, you will see:
- **Immunization Progress Bar:** Aggregated compliance rate for your family.
- **Family Member Cards:** Quick profile cards showing age, blood group, upcoming vaccines, and overdue alerts.
- **Proactive Notification Feed:** Live alerts for milestone vaccines scheduled for upcoming weeks.
- **Quick Action Buttons:** "Add Family Member" and "Record Dose".

### 1.3 Family Management (`/family`)
- **Add a Member:** Click **"Add Family Member"**. Enter full name, relationship (`CHILD`, `SPOUSE`, `PARENT`, `SELF`), birth date, gender, blood group, and known drug/vaccine allergies.
- **Edit Member:** Update demographic information or add special medical notes.
- **Data Protection:** The system prevents adding duplicate members with identical names and birth dates within your household.

### 1.4 Viewing Vaccination Schedules (`/schedule`)
- Select any family member to view their complete UIP schedule timeline.
- **Milestone Categories:**
  - **At Birth:** BCG, Hepatitis B Birth Dose (< 24h), OPV Zero (< 15d).
  - **6 Weeks:** Pentavalent-1, OPV-1, Rotavirus-1, Fractional IPV-1, PCV-1.
  - **10 Weeks:** Pentavalent-2, OPV-2, Rotavirus-2.
  - **14 Weeks:** Pentavalent-3, OPV-3, Rotavirus-3, Fractional IPV-2, PCV-2.
  - **9–12 Months:** Measles-Rubella (MR-1), PCV Booster, Fractional IPV-3.
  - **16–24 Months:** DPT Booster-1, MR-2, OPV Booster.
  - **5–6 Years:** DPT Booster-2.
  - **10 & 16 Years:** Td (Tetanus & adult Diphtheria).
- **Status Badges:**
  - `COMPLETED`: Dose successfully administered and logged.
  - `DUE`: Milestone is currently within its active administration window.
  - `OVERDUE`: Routine target date passed without a logged dose.
  - `UPCOMING`: Scheduled for a future date.
  - `MISSED`: Strict medical window expired (e.g. HepB birth dose past 24h; Rotavirus past 1 year).
  - `CATCH_UP_REQUIRED`: Delayed milestone eligible for immediate catch-up protocol.

### 1.5 Recording a Vaccination Dose (`/vaccinations`)
- Click **"Record Vaccination"** from the dashboard or vaccinations page.
- Select the family member and vaccine from the catalog.
- Specify the dose number (Dose 1, Dose 2, Booster), administered date, healthcare provider or hospital name, and vaccine batch/lot number.
- **Integrity Validation:**
  - Administered date cannot be in the future.
  - Administered date cannot precede the member's birth date.
  - Duplicate doses for the same vaccine series are rejected.
  - Multi-dose series must be in chronological order (Dose 2 cannot precede Dose 1).

### 1.6 AI Clinical Assistant (`/assistant`)
- Access **AI Assistant** to ask immunization questions grounded in official MoHFW and WHO guidelines.
- **Interactive Multi-Agent Workflows:**
  - **Catch-up Analysis:** Evaluate catch-up pathways for delayed infant schedules.
  - **General Inquiries:** Learn about vaccine side effects, contraindications, and normal post-vaccination fever management.
  - **Medical Disclaimer:** All AI outputs clearly emphasize that AI guidance does not replace consultation with a licensed pediatrician or medical officer.

### 1.7 Generating & Downloading Reports (`/reports`)
- Select the family member and report format (**Comprehensive Record**, **Official Immunization Certificate**, or **School Admission Card**).
- **JSON Export:** Download machine-readable clinical data sealed with a cryptographic **SHA-256 integrity hash**.
- **PDF Download:** Generate an official print-ready vector PDF document with immunization history, clinical notes, and verification seal.

### 1.8 Offline Support & Synchronization
- If your internet connection drops, VaxAssist AI switches to offline mode indicated by a yellow banner.
- You can continue viewing previously loaded family members, vaccination schedules, and reminders from the local cache.
- Adding a member or recording a dose while offline automatically queues the change. Upon reconnecting, the offline sync engine replays queued mutations against the backend and notifies you when synced.

---

## 🩺 2. Healthcare Worker User Guide

### 2.1 Clinician Login
- **Demo Account:**
  - **Email:** `dr.anjali.deshmukh@vaxassist.demo`
  - **Password:** `DrAnjali@Vax2026!`

### 2.2 Clinician Dashboard (`/healthcare/dashboard`)
- Review daily immunization clinic priorities, pending verification reviews, and outpatient appointments.
- Quick metrics on doses administered, pending child reviews, and clinic AEFI surveillance.

### 2.3 Patient Record Access
- Clinicians have clinical read access to patients across households for outpatient consultations and immunization drives.
- Search for a child by name or registry ID to inspect past dose history, allergies, and deterministic schedule calculations.

### 2.4 Administering Clinician-Verified Doses
- Open the patient's record and click **"Record Dose"**.
- Enter vaccine batch number, anatomical administration site (e.g. *Left Deltoid, IM* or *Anterolateral Thigh*), and clinical observation notes.
- When logged by a verified clinician, the record is tagged with `is_verified: true` and includes the clinician's medical council license registration number.

---

## 🛡️ 3. System Administrator User Guide

### 3.1 Admin Login
- **Demo Account:**
  - **Email:** `admin@vaxassist.demo`
  - **Password:** `Admin@Vax2026!`

### 3.2 Administrator Dashboard (`/admin/dashboard`)
- Real-time telemetry: total registered users, active family households, verified healthcare workers, and ChromaDB vector chunk counts.
- System health status and database ping latency.

### 3.3 Managing Users & Healthcare Worker Approvals (`/admin/users`, `/admin/healthcare-workers`)
- Filter accounts by role (`PATIENT`, `HEALTHCARE_WORKER`, `ADMIN`) or status (`ACTIVE`, `PENDING_VERIFICATION`, `REJECTED`).
- **Verifying Clinicians:** When doctors register, their account status starts as `PENDING_VERIFICATION`. Administrators inspect medical council registration details and click **"Approve & Activate"** or **"Reject"** with a clinical reason.

### 3.4 Knowledge Base & Document Management (`/admin/knowledge-base`)
- **Upload Guideline:** Upload official PDF, DOCX, or TXT documents (e.g. *MoHFW National Immunization Schedule Addendum 2026*).
- **Automated Ingestion:** The backend parses text, chunks content into semantic segments, computes vector embeddings via Gemini, and indexes them into ChromaDB.
- **Document Management:**
  - Check indexing progress: status transitions from `PROCESSING` to `INDEXED`.
  - **Re-index:** Recompute vector embeddings when updating knowledge chunks.
  - **Purge:** Delete obsolete documents to keep RAG answers aligned with active public health policy.

---

## 💡 Best Practices & Clinical Tips

1. **Birth Dose Urgency:** Administer Hepatitis B within 24 hours of delivery. If missed past 24 hours, do not administer standalone HepB-0; protection will begin at 6 weeks with Pentavalent.
2. **Polio Zero Dose:** OPV-0 must be administered within the first 15 days of life.
3. **Rotavirus Limit:** Under UIP guidelines, Rotavirus vaccination should not be initiated or continued past 1 year of age.
4. **Offline Queue Sync:** Ensure you do not clear browser cache while offline mutations are pending sync.
