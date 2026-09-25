from enum import Enum
from typing import Optional
from pydantic import EmailStr, Field
from app.models.base import MongoBaseModel


class UserRole(str, Enum):
    PATIENT = "PATIENT"
    HEALTHCARE_WORKER = "HEALTHCARE_WORKER"
    ADMIN = "ADMIN"


class AccountStatus(str, Enum):
    ACTIVE = "ACTIVE"
    PENDING = "PENDING"
    REJECTED = "REJECTED"
    INACTIVE = "INACTIVE"


# Keep UserStatus alias for backward compatibility if referenced
UserStatus = AccountStatus


class User(MongoBaseModel):
    name: str = Field(..., description="User's full name")
    email: EmailStr = Field(..., description="Unique email address")
    hashed_password: str = Field(..., description="Salted and hashed password")
    role: UserRole = Field(default=UserRole.PATIENT, description="System role")
    account_status: AccountStatus = Field(default=AccountStatus.ACTIVE, description="Lifecycle status")
    license_number: Optional[str] = Field(default=None, description="Medical license number for HEALTHCARE_WORKER")
    clinic_or_hospital: Optional[str] = Field(default=None, description="Affiliated clinic or hospital name")
    status_reason: Optional[str] = Field(default=None, description="Reason for rejection or deactivation")
