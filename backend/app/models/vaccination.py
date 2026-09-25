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
    family_member_id: str = Field(..., description="ID of the FamilyMember")
    vaccine_code: str = Field(..., description="Standard vaccine code, e.g. BCG, HEPB, PENTA, MMR")
    vaccine_name: str = Field(..., description="Full descriptive vaccine name")
    dose_number: int = Field(default=1, ge=1, description="Dose number in sequence (1, 2, 3...)")
    dose_name: Optional[str] = Field(default=None, description="Descriptive dose name, e.g. 'Dose 1' or 'Birth Dose'")
    administered_date: date = Field(..., description="Date the vaccine was administered")
    administered_by: Optional[str] = Field(default=None, description="Administering healthcare worker or clinic name")
    healthcare_provider: Optional[str] = Field(default=None, description="Clinic or hospital location")
    batch_number: Optional[str] = Field(default=None, description="Vaccine vial batch / lot number")
    vaccination_status: VaccinationStatus = Field(default=VaccinationStatus.COMPLETED)
    notes: Optional[str] = Field(default=None, description="Clinical notes or adverse reactions")
    certificate_url: Optional[str] = Field(default=None, description="URL or reference to immunization certificate document")
    is_verified: bool = Field(default=False, description="Whether record is verified by a Healthcare Worker")

    # Compatibility alias for member_id
    @property
    def member_id(self) -> str:
        return self.family_member_id


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
