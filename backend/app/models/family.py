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
    family_name: str = Field(..., description="Family or household name, e.g. 'Smith Family'")
    owner_user_id: str = Field(..., description="ID of the authenticated user who owns/manages this family")
    description: Optional[str] = Field(default=None, description="Optional description or address notes")


class FamilyMember(MongoBaseModel):
    family_id: str = Field(..., description="Foreign key reference to Family id")
    full_name: str = Field(..., description="Full name of the family member")
    date_of_birth: date = Field(..., description="Birth date of member")
    gender: Gender = Field(default=Gender.OTHER)
    relationship: FamilyRelationship = Field(default=FamilyRelationship.OTHER)
    blood_group: Optional[str] = Field(default=None)
    allergies: List[str] = Field(default_factory=list)
    notes: Optional[str] = Field(default=None)
