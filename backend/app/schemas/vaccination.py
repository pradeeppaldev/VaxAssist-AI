from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field, field_validator
from app.models.vaccination import VaccinationStatus


class VaccinationRecordCreateRequest(BaseModel):
    vaccine_code: str = Field(..., min_length=2, max_length=25, description="Standard vaccine code e.g. BCG, HEPB, PENTA, MMR")
    vaccine_name: str = Field(..., min_length=2, max_length=150, description="Full descriptive vaccine name")
    dose_number: int = Field(default=1, ge=1, le=20, description="Dose number in series")
    dose_name: Optional[str] = Field(default=None, max_length=50, description="Descriptive dose label e.g. Dose 1, Birth Dose, Booster")
    administered_date: date = Field(..., description="Date the vaccine was administered")
    healthcare_provider: Optional[str] = Field(default=None, max_length=200, description="Administering clinic or doctor")
    batch_number: Optional[str] = Field(default=None, max_length=100, description="Vaccine vial lot/batch number")
    notes: Optional[str] = Field(default=None, max_length=1000, description="Optional clinical notes or reactions")

    @field_validator("vaccine_code")
    def clean_vaccine_code(cls, v: str) -> str:
        clean = v.strip().upper()
        if not clean:
            raise ValueError("Vaccine code cannot be empty.")
        return clean

    @field_validator("vaccine_name")
    def clean_vaccine_name(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Vaccine name cannot be empty.")
        return clean

    @field_validator("administered_date")
    def validate_not_future(cls, v: date) -> date:
        today = date.today()
        if v > today:
            raise ValueError(f"Administered date cannot be in the future (provided: {v}, today: {today}).")
        return v


class VaccinationRecordUpdateRequest(BaseModel):
    vaccine_name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    dose_number: Optional[int] = Field(default=None, ge=1, le=20)
    dose_name: Optional[str] = Field(default=None, max_length=50)
    administered_date: Optional[date] = None
    healthcare_provider: Optional[str] = Field(default=None, max_length=200)
    batch_number: Optional[str] = Field(default=None, max_length=100)
    notes: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("administered_date")
    def validate_not_future(cls, v: Optional[date]) -> Optional[date]:
        if v is not None:
            today = date.today()
            if v > today:
                raise ValueError(f"Administered date cannot be in the future (provided: {v}, today: {today}).")
        return v


class VaccinationRecordResponse(BaseModel):
    id: str
    family_member_id: str
    vaccine_code: str
    vaccine_name: str
    dose_number: int
    dose_name: Optional[str] = None
    administered_date: date
    healthcare_provider: Optional[str] = None
    batch_number: Optional[str] = None
    vaccination_status: VaccinationStatus
    notes: Optional[str] = None
    is_verified: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ScheduledDoseResponse(BaseModel):
    vaccine_code: str
    vaccine_name: str
    target_disease: str
    dose_number: int
    dose_name: str
    recommended_age_display: str
    recommended_date: date
    calculated_due_date: date
    status: VaccinationStatus
    administered_date: Optional[date] = None
    record_id: Optional[str] = None
    status_reason: str
    category: str


class MemberScheduleSummary(BaseModel):
    total_doses: int
    completed_count: int
    due_count: int
    overdue_count: int
    upcoming_count: int
    completion_percentage: float


class MemberScheduleResponse(BaseModel):
    member_id: str
    member_name: str
    date_of_birth: date
    current_age_display: str
    summary: MemberScheduleSummary
    schedule_items: List[ScheduledDoseResponse]
