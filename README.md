# VaxAssist AI — Digital Vaccination Tracking, Clinical Reminder & Multi-Agent AI Assistance System

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)](https://github.com/pradeeppaldev/VaxAssist-AI)
[![Python Version](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-blue.svg)](https://python.org)
[![React Version](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-teal.svg)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

VaxAssist AI is an intelligent, full-stack, role-based digital immunization tracking, reminder, and clinical guidance platform designed to support families, healthcare professionals, and public health administrators. The system aligns with India's **Universal Immunization Programme (UIP)** guidelines, combining a deterministic clinical schedule engine, offline-first progressive web app capabilities, and a 5-agent generative AI architecture powered by Google Gemini and ChromaDB vector search.

---

## 🚀 Key Highlights & Architecture

```
                                  ┌───────────────────────────────┐
                                  │      React 18 + Vite PWA      │
                                  │ (Offline Cache & Sync Queue)  │
                                  └──────────────┬────────────────┘
                                                 │ HTTPS / REST
                                                 ▼
                                  ┌───────────────────────────────┐
                                  │      FastAPI Backend API      │
                                  │   (JWT Auth, RBAC, Tenancy)   │
                                  └──────────────┬────────────────┘
                                                 │
         ┌───────────────────────────────────────┼────────────────────────────────────────┐
         ▼                                       ▼                                        ▼
┌─────────────────────────┐           ┌───────────────────────┐            ┌─────────────────────────┐
│   MongoDB Atlas Cloud   │           │ ChromaDB Vector Store │            │    Multi-Agent Engine   │
│ (Users, Families, Doses)│           │ (UIP Chunks & Embeds) │            │ (5 Specialized Agents)  │
└─────────────────────────┘           └──────────┬────────────┘            └────────────┬────────────┘
                                                 │                                      │
                                                 └───────────────┬──────────────────────┘
                                                                 │
                                                                 ▼
                                                  ┌─────────────────────────────┐
                                                  │   Google Gemini 2.0 / Flash  │
                                                  │ (Grounded Clinical Insights)│
                                                  └─────────────────────────────┘
```

1. **Deterministic UIP Clinical Schedule Engine:**
   - Evaluates mandatory UIP milestone vaccines from birth to 16 years.
   - Strictly enforces clinical cutoffs: Hepatitis B birth dose within 24 hours, OPV Zero within 15 days, Rotavirus 1-year cutoff, and Pentavalent catch-up rules.
   - Prevents medical chronology violations (e.g. dose $N$ cannot precede dose $N-1$).
2. **Multi-Agent Orchestration System:**
   - **Monitoring Agent:** Proactively identifies overdue, due-soon, and missed immunization milestones.
   - **Reminder Agent:** Automates multi-channel notifications (In-App, Email, SMS via Brevo).
   - **Knowledge Agent (RAG):** Contextual semantic inquiry grounded strictly in MoHFW and WHO official guidelines using ChromaDB vector store.
   - **Recommendation Agent:** Generates catch-up immunization pathways while clearly separating free UIP vaccines from optional private vaccines.
   - **Report Agent:** Synthesizes verified clinical records and exports tamper-evident JSON records with SHA-256 seals and downloadable vector PDF certificates.
   - **Multi-Agent Orchestrator:** Coordinated lifecycle manager executing multi-agent pipelines for patient enrollment, post-vaccination follow-ups, and clinical audits.
3. **Role-Based Access Control (RBAC) & IDOR Protection:**
   - **Patient / Household:** Manage family profiles, record personal immunization milestones, view schedules, receive reminders, and export records.
   - **Healthcare Worker:** Access patient schedules across households, log clinically-verified vaccine administrations, and perform immunization reviews.
   - **System Administrator:** Manage user accounts, verify clinician credentials, inspect platform telemetry, and upload/re-index knowledge base guidelines.
4. **Offline Resilience & PWA Support:**
   - User-scoped offline caching in `localStorage` and `IndexedDB`.
   - Mutation queueing for offline member creations and dose submissions with duplicate detection upon online reconnection.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, shadcn/ui, Lucide Icons | Responsive user interface, interactive dashboards, accessible components |
| **Backend** | Python 3.13, FastAPI, Pydantic v2, Motor (AsyncIO) | High-performance asynchronous REST API, request validation, business logic |
| **Database** | MongoDB Atlas (Motor driver) | Multi-tenant persistent document storage (Users, Families, Records, Notifications) |
| **Vector DB** | ChromaDB (Local persistent) | Vector storage and cosine similarity retrieval for clinical guidelines |
| **AI / LLM** | Google Gemini (`gemini-flash-latest`, `gemini-embedding-2`) | Evidence-based clinical inquiry, personalized recommendations, automated summaries |
| **Notifications** | Brevo (Sendinblue) API | Transactional notification delivery (Email & SMS) |
| **PDF Generation** | ReportLab | Cryptographically sealed clinical certificates and immunization history exports |

---

## 📂 Project Structure

```
VaxAssist AI/
├── backend/
│   ├── app/
│   │   ├── agents/                   # Multi-agent architecture & Orchestrator
│   │   │   ├── monitoring/           # Proactive Milestone Monitoring Agent
│   │   │   ├── reminder/             # Multi-Channel Reminder Agent
│   │   │   ├── knowledge/            # Knowledge Base RAG Agent
│   │   │   ├── recommendation/       # Catch-up & Clinical Recommendation Agent
│   │   │   ├── report/               # Cryptographic Report & PDF Agent
│   │   │   └── orchestrator/         # Multi-Agent Workflow Coordinator
│   │   ├── api/                      # FastAPI REST Routes & Dependency Injection
│   │   │   ├── deps.py               # Current user, active user, role dependencies
│   │   │   └── v1/                   # API Version 1 endpoints (auth, families, vax, etc.)
│   │   ├── database/                 # Async MongoDB Motor connection manager
│   │   ├── models/                   # Domain entities and Mongo document models
│   │   ├── schemas/                  # Pydantic validation request/response schemas
│   │   ├── services/                 # Core domain services (Schedule engine, RAG, etc.)
│   │   ├── config.py                 # Pydantic BaseSettings environment config
│   │   └── main.py                   # FastAPI application initialization & lifespan
│   ├── data/
│   │   ├── chroma/                   # ChromaDB persistent vector database directory
│   │   └── knowledge/                # Raw uploaded guideline documents
│   ├── .env.example                  # Template environment file
│   └── requirements.txt              # Backend dependencies
├── frontend/
│   ├── public/                       # Static assets, web manifest, service worker
│   ├── src/
│   │   ├── components/               # Common, Healthcare, AI, and shadcn UI widgets
│   │   ├── context/                  # AuthContext (JWT session restoration, RBAC)
│   │   ├── pages/                    # Role-specific dashboard & workspace views
│   │   │   ├── dashboards/           # Patient, Healthcare Worker, Admin Dashboards
│   │   │   ├── patient/              # Family, Schedule, AIAssistant, Reports pages
│   │   │   ├── healthcare/           # Patient registry, clinical schedules, logging
│   │   │   └── admin/                # User management, HCW verification, KB pages
│   │   ├── routes/                   # Protected and role-guarded route definitions
│   │   └── services/                 # Axios API clients & offlineSync service
│   ├── package.json                  # Frontend dependencies and Vite scripts
│   └── vite.config.js                # Vite build and development configuration
├── ENVIRONMENT_SETUP.md              # Detailed local configuration and env guide
├── USER_GUIDE.md                     # Comprehensive step-by-step role walkthrough
├── FINAL_TEST_REPORT.md              # Verification report across all test suites
└── README.md                         # This file
```

---

## ⚡ Quickstart & Local Installation

### Prerequisites
- **Python:** 3.11, 3.12, or 3.13
- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **MongoDB:** Active MongoDB Atlas URI or local MongoDB instance (port 27017)
- **Gemini API Key:** Free Google AI Studio API key

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env
# Edit .env with your MONGODB_URI and GEMINI_API_KEY
```

### 2. Frontend Setup

```bash
# In a separate terminal, navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Start development server
npm run dev
```

The frontend will be accessible at `http://localhost:5173`, and the FastAPI backend documentation will be accessible at `http://localhost:8000/docs`.

---

## 🧪 Testing & Verification

The system includes automated test suites covering all architectural layers:

```bash
# Run Phase G Final Integration Suite (Patient, HCW, Admin E2E journeys)
python -m unittest backend/test_phase_g_final_integration.py

# Run Phase F Security & Clinical Validation Suite
python -m unittest backend/test_phase_f_security_clinical.py

# Run Phase E Dashboard, UX & Reports Suite
python -m unittest backend/test_phase_e_dashboard_reports.py

# Run Phase D Multi-Agent & Orchestrator Suite
python -m unittest backend/test_phase_d_agent_orchestrator.py

# Run Phase B Offline Support & Synchronization Suite
python -m unittest backend/test_phase_b_offline_sync.py

# Build frontend production bundle
npm --prefix frontend run build
```

---

## 👥 Demo Credentials

For testing and demonstration, use the following pre-seeded demo accounts:

| Role | Email | Password | Primary Purpose |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@vaxassist.demo` | `Admin@Vax2026!` | Telemetry, user moderation, KB document management |
| **Healthcare Worker** | `dr.anjali.deshmukh@vaxassist.demo` | `DrAnjali@Vax2026!` | Cross-household clinical schedule review, dose logging |
| **Patient (Household)**| `rajesh.sharma@vaxassist.demo` | `Rajesh@Vax2026!` | Family management, schedule viewing, AI assistant |

---

## 📄 License & Attribution

This project is developed for educational and academic demonstration purposes as a digital health tracking system under the Universal Immunization Programme (UIP) India framework.
