from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, model_validator
from app.models.user import UserRole, AccountStatus


class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name of user")
    email: EmailStr = Field(..., description="Valid unique email address")
    password: str = Field(..., min_length=8, description="Password (at least 8 characters)")
    confirm_password: str = Field(..., min_length=8, description="Password confirmation")
    role: UserRole = Field(
        default=UserRole.PATIENT,
        description="Desired account role (PATIENT or HEALTHCARE_WORKER)"
    )
    license_number: Optional[str] = Field(default=None, description="Required for HEALTHCARE_WORKER")
    clinic_or_hospital: Optional[str] = Field(default=None, description="Affiliated clinic for HEALTHCARE_WORKER")

    @model_validator(mode="after")
    def validate_registration(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        if self.role == UserRole.ADMIN:
            raise ValueError("Administrator accounts cannot be created through public registration")
        if self.role == UserRole.HEALTHCARE_WORKER and not self.license_number:
            raise ValueError("Medical license number is required for Healthcare Worker registration")
        return self


class UserLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered user email")
    password: str = Field(..., description="Account password")


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: UserRole
    account_status: AccountStatus
    license_number: Optional[str] = None
    clinic_or_hospital: Optional[str] = None
    status_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserStatusUpdateRequest(BaseModel):
    account_status: AccountStatus = Field(..., description="Target status: ACTIVE, PENDING, REJECTED, INACTIVE")
    reason: Optional[str] = Field(default=None, description="Optional note explaining the status change")


class UserRoleUpdateRequest(BaseModel):
    role: UserRole = Field(..., description="New role for the user")
