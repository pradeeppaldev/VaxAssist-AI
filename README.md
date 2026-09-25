# VaxAssist AI — Digital Vaccination Tracking, Reminder and AI Assistance System

VaxAssist AI is a full-stack, role-based digital vaccination tracking and care coordination platform designed for families, healthcare professionals, and system administrators. It combines deterministic schedule calculation with a multi-agent AI system and trusted RAG knowledge retrieval.

---

## 📌 Development Status

- **Phase 1: Project Foundation** — Completed ✅
- **Phase 2: Authentication & Role System** — Completed ✅
  - **JWT Authentication & Role-Based Access Control (RBAC)** across 3 roles: `PATIENT`, `HEALTHCARE_WORKER`, `ADMIN`.
  - **Lifecycle Account Statuses**: `ACTIVE`, `PENDING`, `REJECTED`, `INACTIVE`.
  - **PBKDF2-HMAC-SHA256 Password Hashing** (600,000 iterations, per-user salt).
  - **Safe System Administrator Bootstrap** mechanism seeding initial admin from config.
  - **Protected Frontend Routing & AuthContext** restoring sessions and guarding dashboards.
  - **Interactive Dashboard Shells** for Patient, Healthcare Worker, and Administrator.
  - **Automated Integration Test Suite** validating all 12 security & workflow scenarios against live MongoDB Atlas.

---

## 📂 Project Structure

```
VaxAssist AI/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   └── health.py          # GET /api/v1/health with DB ping
│   │   │       └── api.py                 # Router aggregation
│   │   ├── database/
│   │   │   └── mongodb.py                 # Async Motor connection manager & ping
│   │   ├── models/                        # Extensible Pydantic & Mongo schemas
│   │   │   ├── base.py                    # MongoBaseModel with timestamps & ObjectId
│   │   │   ├── user.py                    # User, UserRole, UserStatus
│   │   │   ├── family.py                  # Family, FamilyMember, Gender
│   │   │   ├── vaccination.py             # VaccinationRecord, VaccinationSchedule
│   │   │   ├── notification.py            # Notification, Channel, Type, Status
│   │   │   ├── knowledge.py               # KnowledgeDocument (for RAG)
│   │   │   ├── report.py                  # Report, ReportType
│   │   │   └── audit.py                   # AuditLog
│   │   ├── schemas/
│   │   │   └── common.py                  # HealthCheckResponse, APIResponse
│   │   ├── services/                      # Business logic (for future phases)
│   │   ├── utils/                         # Helper utilities
│   │   ├── config.py                      # Pydantic BaseSettings configuration
│   │   └── main.py                        # FastAPI app, CORS, lifespan handlers
│   ├── .env.example                       # Backend environment template
│   ├── .env                               # Local environment configuration
│   ├── requirements.txt                   # Backend Python dependencies
│   └── run.py                             # Development server runner
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── common/
│   │   │       ├── Navbar.jsx             # Top bar with live backend status indicator
│   │   │       └── Footer.jsx
│   │   ├── hooks/
│   │   │   └── useHealthCheck.js          # Reactive health hook with latency tracking
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx             # App layout shell
│   │   ├── lib/
│   │   │   └── utils.js                   # Class merging utility (clsx + twMerge)
│   │   ├── pages/
│   │   │   ├── HomePage.jsx               # System overview, 3 roles & 5 agents
│   │   │   ├── SystemTestPage.jsx         # Live frontend ↔ backend diagnostics
│   │   │   └── NotFoundPage.jsx
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx              # Central router configuration
│   │   ├── services/
│   │   │   └── api.js                     # API client for health queries
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── .env.example
│   └── .env
├── .gitignore
└── README.md
```

---

## ⚙️ Environment Configuration

### Backend (`backend/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PROJECT_NAME` | Name of the project | `"VaxAssist AI"` |
| `API_V1_STR` | Base prefix for v1 endpoints | `"/api/v1"` |
| `ENVIRONMENT` | Environment name | `"development"` |
| `DEBUG` | Enable auto-reload & verbose logging | `True` |
| `HOST` | Backend bind host | `"127.0.0.1"` |
| `PORT` | Backend port | `8000` |
| `BACKEND_CORS_ORIGINS` | Allowed frontend origins (JSON list or comma-separated) | `["http://localhost:5173","http://127.0.0.1:5173"]` |
| `MONGODB_URI` | MongoDB connection URI | `"mongodb://localhost:27017"` |
| `MONGODB_DB_NAME` | Database name | `"vaxassist_db"` |
| `JWT_SECRET_KEY` | Secret for Phase 2 JWT signing | (placeholder) |
| `LLM_PROVIDER` | AI provider for Phase 7 & 8 | `"gemini"` |
| `GEMINI_API_KEY` | Google Gemini API Key | `""` |

### Frontend (`frontend/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL of FastAPI v1 endpoints | `"http://localhost:8000/api/v1"` |

---

## 🚀 Running the Application

### 1. Prerequisites
- **Python 3.10+ / 3.11+ / 3.13**
- **Node.js v18+ or v20+** and `npm`
- **MongoDB** (Local instance or MongoDB Atlas cluster)

---

### 2. Backend Setup & Run

Open a terminal in the project directory:

```bash
# Navigate to backend
cd backend

# Create virtual environment (if not already created)
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Windows Command Prompt:
.\.venv\Scripts\activate.bat
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python run.py
```

The FastAPI backend will start at:
- **API URL**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Health Check Endpoint**: `http://localhost:8000/api/v1/health`

---

### 3. Frontend Setup & Run

Open a second terminal:

```bash
# Navigate to frontend
cd frontend

# Install npm dependencies
npm install

# Start development server
npm run dev
```

The React frontend will be available at:
- `http://localhost:5173`

---

## 🧪 Verifying the Foundation

1. Open `http://localhost:5173` in your browser.
2. Verify the live status indicator in the top navbar says **Backend: Online**.
3. Navigate to **System Test** (`http://localhost:5173/system-test`).
4. Click **Retest Connection** to test real-time latency and view the raw JSON payload returned by the FastAPI server.
5. Visit `http://localhost:8000/docs` to view the auto-generated Swagger OpenAPI schema.

---

## 🗄️ MongoDB Configuration Guidance

If the health check reports `database.status: "disconnected"`:
- **Local MongoDB**: Ensure MongoDB service is started via Windows Services or run `mongod` in a terminal.
- **MongoDB Atlas (Cloud)**:
  1. Create a free cluster on [cloud.mongodb.com](https://cloud.mongodb.com).
  2. Obtain your connection string: `mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/?retryWrites=true&w=majority`.
  3. Update `backend/.env` with `MONGODB_URI="your-atlas-uri"`.
  4. Restart or re-test the backend.

---

## 🗺️ Development Roadmap

- **Phase 1: Project Foundation** *(Current - Completed)*
- **Phase 2**: Authentication & Role Authorization (JWT, RBAC for 3 roles)
- **Phase 3**: Family & Patient Management
- **Phase 4**: Vaccination Records & Deterministic Schedule Engine
- **Phase 5**: Role-Specific Dashboards (Family, Healthcare Worker, Admin)
- **Phase 6**: Proactive Monitoring & Notification Engine
- **Phase 7**: Knowledge Base, Vector Store (ChromaDB) & RAG
- **Phase 8**: 5 Specialized AI Agents
- **Phase 9**: Multi-Agent Orchestration & Real Workflows
- **Phase 10**: Reports, Certificates, Offline Support & Deployment
