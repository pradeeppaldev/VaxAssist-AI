from enum import Enum
from typing import Optional
from pydantic import EmailStr, Field
from app.models.base import MongoBaseModel


class UserRole(str, Enum):
    PATIENT = "PATIENT"
    HEALTHCARE_WORKER = "HEALTHCARE_WORKER"
    ADMIN = "ADMIN"


class UserStatus(str, Enum):
    ACTIVE = "ACTIVE"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    SUSPENDED = "SUSPENDED"


class User(MongoBaseModel):
    email: EmailStr
    hashed_password: str
    full_name: str
    role: UserRole = UserRole.PATIENT
    status: UserStatus = UserStatus.ACTIVE
    phone_number: Optional[str] = None
    is_email_verified: bool = False
    license_number: Optional[str] = None  # Relevant for HEALTHCARE_WORKER
    clinic_or_hospital: Optional[str] = None  # Relevant for HEALTHCARE_WORKER
