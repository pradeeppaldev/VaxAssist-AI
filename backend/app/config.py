from typing import List, Union, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "VaxAssist AI"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Server settings
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # CORS settings
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        import json
        try:
            return json.loads(v)
        except Exception:
            return ["http://localhost:5173", "http://127.0.0.1:5173"]

    # MongoDB settings
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "vaxassist_db"
    MONGODB_SERVER_SELECTION_TIMEOUT_MS: int = 15000

    # Authentication & JWT
    JWT_SECRET_KEY: str = "vaxassist-ai-dev-secret-key-phase-2-auth-security-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Initial Admin Bootstrap (Phase 2)
    ADMIN_EMAIL: str = "admin@vaxassist.ai"
    ADMIN_PASSWORD: str = "Admin@VaxAssist2026"
    ADMIN_NAME: str = "System Administrator"
    AUTO_BOOTSTRAP_ADMIN: bool = True

    # Monitoring & Notification Engine (Phase 6)
    MONITORING_INTERVAL_MINUTES: int = 60
    ENABLE_BACKGROUND_SCHEDULER: bool = True
    DEFAULT_REMINDER_LEAD_DAYS: List[int] = [14, 7, 3, 1]
    EMAIL_NOTIFICATIONS_ENABLED: bool = False
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "notifications@vaxassist.ai"

    # Brevo Transactional Email & SMS Integration
    BREVO_API_KEY: str = ""
    BREVO_SENDER_NAME: str = "VaxAssist AI"
    BREVO_SENDER_EMAIL: str = "pradeep817181@gmail.com"
    BREVO_SMS_SENDER_NAME: str = "VaxAssist"
    BREVO_EMAIL_TEMPLATE_ID: Optional[int] = None
    BREVO_EMAIL_ENABLED: bool = True
    BREVO_SMS_ENABLED: bool = True

    # LLM & Knowledge Base Settings (Phase 7 RAG & Phase 8 Agents)
    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GEMINI_EMBEDDING_MODEL: str = "models/gemini-embedding-2"
    GEMINI_GENERATION_MODEL: str = "models/gemini-flash-latest"

    # Knowledge Base & Vector Store Settings (Phase 7)
    CHROMA_PERSIST_DIRECTORY: str = "data/chroma"
    KNOWLEDGE_STORAGE_DIRECTORY: str = "data/knowledge"
    CHROMA_COLLECTION_NAME: str = "vaxassist_knowledge"
    CHUNK_SIZE_CHARS: int = 1000
    CHUNK_OVERLAP_CHARS: int = 150
    RAG_TOP_K: int = 4
    MAX_UPLOAD_FILE_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
    ALLOWED_DOCUMENT_EXTENSIONS: List[str] = [".pdf", ".docx", ".txt", ".md"]

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
