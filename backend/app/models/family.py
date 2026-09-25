from enum import Enum
from typing import Optional, List
from datetime import date
from pydantic import Field
from app.models.base import MongoBaseModel


class Gender(str, Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"


class FamilyRelationship(str, Enum):
    SELF = "SELF"
    CHILD = "CHILD"
    SPOUSE = "SPOUSE"
    PARENT = "PARENT"
    SIBLING = "SIBLING"
    OTHER = "OTHER"


class Family(MongoBaseModel):
    name: str = Field(..., description="Family or household name, e.g. 'Smith Family'")
    primary_user_id: str = Field(..., description="ID of the user managing this family")
    description: Optional[str] = None


class FamilyMember(MongoBaseModel):
    family_id: str
    first_name: str
    last_name: str
    date_of_birth: date
    gender: Gender
    relationship: FamilyRelationship
    blood_group: Optional[str] = None
    allergies: List[str] = Field(default_factory=list)
    medical_notes: Optional[str] = None
    created_by_user_id: str
