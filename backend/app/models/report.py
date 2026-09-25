from enum import Enum
from typing import Optional, Dict, Any
from pydantic import Field
from app.models.base import MongoBaseModel


class ReportType(str, Enum):
    FAMILY_SUMMARY = "FAMILY_SUMMARY"
    UPCOMING_SCHEDULE = "UPCOMING_SCHEDULE"
    OVERDUE_ALERT = "OVERDUE_ALERT"
    VACCINATION_CERTIFICATE = "VACCINATION_CERTIFICATE"
    CLINICAL_AUDIT = "CLINICAL_AUDIT"


class Report(MongoBaseModel):
    title: str
    report_type: ReportType
    generated_by_user_id: str
    target_family_id: Optional[str] = None
    target_member_id: Optional[str] = None
    summary: str
    data: Dict[str, Any] = Field(default_factory=dict)
    file_url: Optional[str] = None
    agent_generated: bool = True
