from typing import Optional, Dict, Any
from pydantic import Field
from app.models.base import MongoBaseModel


class AuditLog(MongoBaseModel):
    user_id: Optional[str] = None
    action: str = Field(..., description="Action performed, e.g. 'USER_LOGIN', 'RECORD_CREATED', 'ROLE_UPDATED'")
    entity_name: str = Field(..., description="Entity affected, e.g. 'VaccinationRecord', 'User'")
    entity_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
