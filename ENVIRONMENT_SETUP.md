# VaxAssist AI — Environment Configuration & Local Setup Guide

This document outlines the step-by-step procedure for configuring, installing, and running **VaxAssist AI** in a local development environment.

---

## 📋 System Prerequisites

| Dependency | Minimum Version | Recommended Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Python** | 3.11+ | 3.13 | `python --version` |
| **Node.js** | 18.0.0+ | 20.x or 22.x LTS | `node --version` |
| **npm** | 9.0.0+ | 10.x | `npm --version` |
| **MongoDB** | MongoDB Atlas or Local 6.0+ | MongoDB Atlas Cloud | `mongosh --version` |
| **ChromaDB** | 0.5.0+ | Installed via pip | `pip show chromadb` |

---

## ⚙️ Environment Variables

### 1. Backend Environment Configuration (`backend/.env`)

Create a `.env` file in the `backend/` directory by copying the template:
```bash
cp backend/.env.example backend/.env
```

| Variable Name | Required | Default / Example | Purpose & Notes |
| :--- | :---: | :--- | :--- |
| `PROJECT_NAME` | No | `"VaxAssist AI"` | Application title displayed in OpenAPI Swagger docs |
| `API_V1_STR` | No | `"/api/v1"` | URL prefix for all v1 API routes |
| `ENVIRONMENT` | No | `"development"` | Environment runtime mode (`development` / `production`) |
| `DEBUG` | No | `True` | Enables verbose logging and interactive FastAPI docs |
| `HOST` | No | `"127.0.0.1"` | Server listening bind interface |
| `PORT` | No | `8000` | Port for the Uvicorn ASGI server |
| `BACKEND_CORS_ORIGINS`| Yes | `["http://localhost:5173"]`| JSON list of authorized frontend origins |
| `MONGODB_URI` | **Yes** | `mongodb+srv://...` | Connection URI for MongoDB Atlas or local MongoDB |
| `MONGODB_DB_NAME` | Yes | `"vaxassist_db"` | Primary database name |
| `JWT_SECRET_KEY` | **Yes** | `min-32-character-secret` | Cryptographic secret for signing HS256 auth tokens |
| `JWT_ALGORITHM` | No | `"HS256"` | Symmetric encryption algorithm for JWT tokens |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `1440` (24 Hours) | Token lifetime duration before expiration |
| `ADMIN_EMAIL` | Yes | `"admin@vaxassist.ai"` | Initial system administrator email for auto-bootstrap |
| `ADMIN_PASSWORD` | Yes | `"ChangeThisAdminPass2026!"`| Password for the bootstrap admin account |
| `ADMIN_NAME` | No | `"System Administrator"` | Display name for bootstrap administrator |
| `AUTO_BOOTSTRAP_ADMIN`| No | `True` | Automatically create admin if none exists in MongoDB |
| `LLM_PROVIDER` | No | `"gemini"` | AI inference provider (`gemini` or `openai`) |
| `GEMINI_API_KEY` | **Yes** | `AIzaSy...` | Google AI Studio API key for RAG & Agent generation |
| `GEMINI_EMBEDDING_MODEL`| No | `"models/gemini-embedding-2"`| Embedding model for ChromaDB vector embeddings |
| `GEMINI_GENERATION_MODEL`| No | `"models/gemini-flash-latest"`| Fast LLM inference model for clinical agents |
| `CHROMA_PERSIST_DIRECTORY`| No | `"data/chroma"` | Filepath on disk for ChromaDB vector storage |
| `KNOWLEDGE_STORAGE_DIRECTORY`| No | `"data/knowledge"` | Storage path for uploaded PDF and TXT guidelines |
| `CHROMA_COLLECTION_NAME`| No | `"vaxassist_knowledge"` | ChromaDB vector collection identifier |
| `BREVO_API_KEY` | Optional | `xkeysib-...` | Brevo API key for real transactional email & SMS |
| `BREVO_SENDER_NAME` | Optional | `"VaxAssist AI"` | From header name for transactional notifications |
| `BREVO_SENDER_EMAIL`| Optional | `"notifications@vaxassist.ai"`| Verified sender email address |
| `BREVO_EMAIL_ENABLED`| No | `True` | Enables automated email dispatch (logs if key absent) |
| `BREVO_SMS_ENABLED` | No | `True` | Enables automated SMS dispatch |

### 2. Frontend Environment Configuration (`frontend/.env`)

Create a `.env` file in the `frontend/` directory:
```bash
cp frontend/.env.example frontend/.env
```

| Variable Name | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | **Yes** | `"http://localhost:8000/api/v1"` | Full URL to the FastAPI backend API |

---

## 🗄️ Database & External Services Setup

### 1. MongoDB Atlas Setup
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Database Access**, create a user with `readWriteAnyDatabase` privileges.
3. Under **Network Access**, whitelist your IP address (or `0.0.0.0/0` for development).
4. Obtain the connection string formatted as:
   ```
   mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/vaxassist_db?retryWrites=true&w=majority
   ```
5. When the backend starts up, it automatically creates required unique indexes on:
   - `users.email` (Unique)
   - `families.owner_user_id` (Unique per owner)
   - `family_members.family_id` + `family_members.full_name` + `family_members.date_of_birth` (Unique duplicate guard)
   - `vaccination_records.family_member_id` + `vaccination_records.vaccine_code` + `vaccination_records.dose_number` (Unique dose guard)

### 2. Google Gemini API Setup
1. Visit [Google AI Studio](https://aistudio.google.com/) and generate an API key.
2. Ensure you have access to models `models/gemini-embedding-2` and `models/gemini-flash-latest`.
3. Add the key to `backend/.env`:
   ```bash
   GEMINI_API_KEY="AIzaSyYourGeneratedApiKeyHere"
   ```
4. If rate limits (HTTP 429) occur during development on the free tier, the system automatically uses exponential backoff and falls back to cached vector excerpts without crashing.

### 3. ChromaDB Vector Store
- ChromaDB runs in persistent embedded mode on disk at `backend/data/chroma`.
- No separate server process is required.
- The collection `vaxassist_knowledge` persists embeddings across application restarts.

---

## 🚀 Running the Application Locally

### Step 1: Start the Backend Server

```bash
cd backend
# Activate virtual environment
.\.venv\Scripts\activate   # Windows
# source .venv/bin/activate # macOS/Linux

# Start FastAPI using python runner or uvicorn
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Verify backend health: `http://127.0.0.1:8000/api/v1/health`  
Interactive Swagger documentation: `http://127.0.0.1:8000/docs`

### Step 2: Start the Frontend Application

```bash
cd frontend
npm run dev
```
Open your browser at: `http://localhost:5173`

---

## 🛠️ Common Setup Troubleshooting

### 1. `CORS Error: No 'Access-Control-Allow-Origin' header`
- Verify that your frontend port in the browser (usually `5173`) is listed in `BACKEND_CORS_ORIGINS` in `backend/.env`:
  ```json
  BACKEND_CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
  ```

### 2. `Pydantic EmailStr: value is not a valid email address`
- In Pydantic v2 with `email-validator`, top-level domains must be valid according to ICANN standards. Synthetic test emails must use standard or demo domains (e.g. `@vaxassist.demo`, `@example.com`, or `@gmail.com`), not unregistered suffixes like `.test`.

### 3. `ChromaDB SQLite / Read-only Lock`
- Ensure that only one backend process is running against the `data/chroma` folder at a time. If a previous background task holds a lock, terminate stale Python processes or remove `data/chroma/chroma.sqlite3-lock`.

### 4. `TypeError: can't compare datetime.datetime to datetime.date`
- This is resolved in the Phase F codebase via type-safe date normalization in `schedule_engine.py`. Always ensure you are running the latest version of `schedule_engine.py`.

### 5. `Brevo API Key Missing / 401 Unauthorized`
- If you do not have a Brevo API key, leave `BREVO_API_KEY=""`. The notification service will log notifications to the application console and persist in-app alerts into MongoDB without interrupting user workflows.
