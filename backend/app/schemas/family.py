from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field, field_validator
from app.models.family import Gender, FamilyRelationship

VALID_BLOOD_GROUPS = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "UNKNOWN", "OTHER"}


class FamilyCreateRequest(BaseModel):
    family_name: str = Field(..., min_length=2, max_length=100, description="Name of the family or household")
    description: Optional[str] = Field(default=None, max_length=500, description="Optional description or address")

    @field_validator("family_name")
    def validate_name_not_whitespace(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Family name must be at least 2 non-whitespace characters long.")
        return cleaned


class FamilyUpdateRequest(BaseModel):
    family_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)

    @field_validator("family_name")
    def validate_name_not_whitespace(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            if len(cleaned) < 2:
                raise ValueError("Family name must be at least 2 non-whitespace characters long.")
            return cleaned
        return v


class FamilyResponse(BaseModel):
    id: str
    family_name: str
    owner_user_id: str
    description: Optional[str] = None
    member_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FamilyMemberCreateRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100, description="Full name of family member")
    date_of_birth: date = Field(..., description="Date of birth (YYYY-MM-DD)")
    gender: Gender = Field(..., description="Gender (MALE, FEMALE, OTHER)")
    relationship: FamilyRelationship = Field(..., description="Relationship to family account owner")
    blood_group: Optional[str] = Field(default=None, description="e.g. O+, A+, B-, etc.")
    allergies: List[str] = Field(default_factory=list, description="List of known drug or vaccine allergies")
    notes: Optional[str] = Field(default=None, max_length=1000, description="Medical notes or special conditions")

    @field_validator("full_name")
    def validate_name_not_whitespace(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Full name must be at least 2 non-whitespace characters long.")
        return cleaned

    @field_validator("date_of_birth")
    def validate_dob_not_future(cls, v: date) -> date:
        today = date.today()
        if v > today:
            raise ValueError(f"Date of birth cannot be in the future (provided: {v}, today: {today}).")
        # Sanity check: reasonably not older than 125 years
        if today.year - v.year > 125:
            raise ValueError(f"Date of birth cannot be more than 125 years in the past (provided: {v}).")
        return v

    @field_validator("blood_group")
    def validate_blood_group(cls, v: Optional[str]) -> Optional[str]:
        if v:
            clean = v.strip().upper()
            if clean not in VALID_BLOOD_GROUPS:
                raise ValueError(f"Invalid blood group '{v}'. Must be one of: {sorted(list(VALID_BLOOD_GROUPS))}")
            return clean
        return None


class FamilyMemberUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    relationship: Optional[FamilyRelationship] = None
    blood_group: Optional[str] = None
    allergies: Optional[List[str]] = None
    notes: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("full_name")
    def validate_name_not_whitespace(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            if len(cleaned) < 2:
                raise ValueError("Full name must be at least 2 non-whitespace characters long.")
            return cleaned
        return v

    @field_validator("date_of_birth")
    def validate_dob_not_future(cls, v: Optional[date]) -> Optional[date]:
        if v is not None:
            today = date.today()
            if v > today:
                raise ValueError(f"Date of birth cannot be in the future (provided: {v}, today: {today}).")
            if today.year - v.year > 125:
                raise ValueError(f"Date of birth cannot be more than 125 years in the past (provided: {v}).")
        return v

    @field_validator("blood_group")
    def validate_blood_group(cls, v: Optional[str]) -> Optional[str]:
        if v:
            clean = v.strip().upper()
            if clean not in VALID_BLOOD_GROUPS:
                raise ValueError(f"Invalid blood group '{v}'. Must be one of: {sorted(list(VALID_BLOOD_GROUPS))}")
            return clean
        return None


class FamilyMemberResponse(BaseModel):
    id: str
    family_id: str
    full_name: str
    date_of_birth: date
    gender: Gender
    relationship: FamilyRelationship
    blood_group: Optional[str] = None
    allergies: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
