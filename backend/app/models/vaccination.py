from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import date
from pydantic import Field
from app.models.base import MongoBaseModel


class VaccinationStatus(str, Enum):
    UPCOMING = "UPCOMING"
    DUE = "DUE"
    COMPLETED = "COMPLETED"
    OVERDUE = "OVERDUE"
    MISSED = "MISSED"


class VaccinationRecord(MongoBaseModel):
    member_id: str = Field(..., description="ID of the FamilyMember")
    vaccine_name: str
    vaccine_code: Optional[str] = None  # e.g. 'BCG', 'MMR', 'COVID-19'
    dose_number: int = Field(default=1, ge=1)
    status: VaccinationStatus = VaccinationStatus.UPCOMING
    administered_date: Optional[date] = None
    due_date: Optional[date] = None
    next_due_date: Optional[date] = None
    administered_by_worker_id: Optional[str] = None  # Healthcare worker ID if verified
    healthcare_provider: Optional[str] = None  # Clinic/hospital name
    batch_number: Optional[str] = None
    manufacturer: Optional[str] = None
    notes: Optional[str] = None
    certificate_url: Optional[str] = None
    is_verified: bool = False


class VaccinationSchedule(MongoBaseModel):
    vaccine_name: str
    vaccine_code: str
    target_disease: str
    total_doses: int
    dose_rules: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Deterministic offset definitions (e.g. min_age_days, interval_days)"
    )
    guideline_source: str = Field(default="WHO / National Immunization Schedule")
    is_mandatory: bool = True
