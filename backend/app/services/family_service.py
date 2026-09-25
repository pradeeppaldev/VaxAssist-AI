import logging
from datetime import datetime, date, timezone
from typing import Optional, List, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status
from app.database.mongodb import db_manager
from app.models.user import UserRole
from app.schemas.family import (
    FamilyCreateRequest,
    FamilyUpdateRequest,
    FamilyMemberCreateRequest,
    FamilyMemberUpdateRequest,
)

logger = logging.getLogger("vaxassist.services.family")


def format_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Format MongoDB document: converts _id to id string."""
    if not doc:
        return None
    d = dict(doc)
    if "_id" in d:
        d["id"] = str(d.pop("_id"))
    return d


class FamilyService:
    families_collection_name = "families"
    members_collection_name = "family_members"

    def get_families_collection(self):
        return db_manager.get_collection(self.families_collection_name)

    def get_members_collection(self):
        return db_manager.get_collection(self.members_collection_name)

    async def init_indexes(self):
        """Create helpful performance and uniqueness indexes."""
        try:
            f_coll = self.get_families_collection()
            m_coll = self.get_members_collection()
            # Index on owner_user_id
            await f_coll.create_index("owner_user_id", unique=True)
            # Index on family_id for members query
            await m_coll.create_index("family_id")
            logger.info("Family and FamilyMember indexes initialized.")
        except Exception as e:
            logger.warning(f"Note: Could not ensure indexes on families/members: {e}")

    async def get_family_by_owner_id(self, owner_user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch the family belonging to a user and count its members."""
        f_coll = self.get_families_collection()
        family_doc = await f_coll.find_one({"owner_user_id": owner_user_id})
        if not family_doc:
            return None

        formatted = format_doc(family_doc)
        # Attach member count
        m_coll = self.get_members_collection()
        count = await m_coll.count_documents({"family_id": formatted["id"]})
        formatted["member_count"] = count
        return formatted

    async def get_family_by_id(self, family_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a family document by its ObjectId string."""
        f_coll = self.get_families_collection()
        try:
            oid = ObjectId(family_id)
            doc = await f_coll.find_one({"_id": oid})
        except Exception:
            doc = await f_coll.find_one({"id": family_id})

        if not doc:
            return None

        formatted = format_doc(doc)
        m_coll = self.get_members_collection()
        count = await m_coll.count_documents({"family_id": formatted["id"]})
        formatted["member_count"] = count
        return formatted

    async def create_family(
        self,
        owner_user_id: str,
        owner_name: str,
        req: FamilyCreateRequest,
    ) -> Dict[str, Any]:
        """Create a new family household for the user."""
        f_coll = self.get_families_collection()

        # Enforce 1 family per primary user account
        existing = await f_coll.find_one({"owner_user_id": owner_user_id})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have an existing family account. Each user can manage one household.",
            )

        now = datetime.now(timezone.utc)
        family_doc = {
            "family_name": req.family_name.strip(),
            "owner_user_id": owner_user_id,
            "description": req.description.strip() if req.description else None,
            "created_at": now,
            "updated_at": now,
        }

        res = await f_coll.insert_one(family_doc)
        family_doc["id"] = str(res.inserted_id)
        if "_id" in family_doc:
            family_doc.pop("_id")
        family_doc["member_count"] = 0

        logger.info(f"Created family '{family_doc['family_name']}' for user {owner_user_id}")
        return family_doc

    async def get_or_create_default_family(
        self,
        owner_user_id: str,
        owner_name: str,
    ) -> Dict[str, Any]:
        """Get existing family or automatically provision default 'Name Family'."""
        family = await self.get_family_by_owner_id(owner_user_id)
        if family:
            return family

        default_name = f"{owner_name}'s Family"
        return await self.create_family(
            owner_user_id=owner_user_id,
            owner_name=owner_name,
            req=FamilyCreateRequest(family_name=default_name),
        )

    async def update_family(
        self,
        owner_user_id: str,
        req: FamilyUpdateRequest,
    ) -> Dict[str, Any]:
        """Update the current user's family profile."""
        f_coll = self.get_families_collection()
        family = await f_coll.find_one({"owner_user_id": owner_user_id})
        if not family:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Family profile not found. Please create your family account first.",
            )

        update_fields: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
        if req.family_name is not None:
            update_fields["family_name"] = req.family_name.strip()
        if req.description is not None:
            update_fields["description"] = req.description.strip() if req.description else None

        updated = await f_coll.find_one_and_update(
            {"_id": family["_id"]},
            {"$set": update_fields},
            return_document=True,
        )

        formatted = format_doc(updated)
        m_coll = self.get_members_collection()
        formatted["member_count"] = await m_coll.count_documents({"family_id": formatted["id"]})
        return formatted

    # =========================================================================
    # Family Members Management
    # =========================================================================

    async def add_member(
        self,
        owner_user_id: str,
        req: FamilyMemberCreateRequest,
    ) -> Dict[str, Any]:
        """Add a family member to the current user's family."""
        family = await self.get_family_by_owner_id(owner_user_id)
        if not family:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Family profile not found. Please create your family profile before adding members.",
            )

        family_id = family["id"]
        m_coll = self.get_members_collection()

        # Duplicate check: same full_name (case-insensitive) and same date_of_birth in this family
        clean_name = req.full_name.strip()
        # Convert date to string or ISO for consistent query/storage
        dob_str = req.date_of_birth.isoformat()

        duplicate = await m_coll.find_one({
            "family_id": family_id,
            "full_name": {"$regex": f"^{clean_name}$", "$options": "i"},
            "date_of_birth": dob_str,
        })
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A family member named '{clean_name}' with birth date {req.date_of_birth} already exists in your family.",
            )

        now = datetime.now(timezone.utc)
        member_doc = {
            "family_id": family_id,
            "full_name": clean_name,
            "date_of_birth": dob_str,
            "gender": req.gender.value,
            "relationship": req.relationship.value,
            "blood_group": req.blood_group,
            "allergies": [a.strip() for a in req.allergies if a.strip()],
            "notes": req.notes.strip() if req.notes else None,
            "created_at": now,
            "updated_at": now,
        }

        res = await m_coll.insert_one(member_doc)
        member_doc["id"] = str(res.inserted_id)
        if "_id" in member_doc:
            member_doc.pop("_id")

        logger.info(f"Added member '{clean_name}' to family {family_id}")
        return member_doc

    async def list_members(self, owner_user_id: str) -> List[Dict[str, Any]]:
        """List all family members for the user's family."""
        family = await self.get_family_by_owner_id(owner_user_id)
        if not family:
            return []

        m_coll = self.get_members_collection()
        cursor = m_coll.find({"family_id": family["id"]}).sort("created_at", 1)
        members = []
        async for doc in cursor:
            members.append(format_doc(doc))
        return members

    async def get_member(
        self,
        owner_user_id: str,
        member_id: str,
        user_role: str = UserRole.PATIENT.value,
    ) -> Dict[str, Any]:
        """
        Get an individual family member.
        Strictly verifies that the member belongs to the current user's family (or Admin).
        """
        m_coll = self.get_members_collection()
        try:
            oid = ObjectId(member_id)
            member = await m_coll.find_one({"_id": oid})
        except Exception:
            member = await m_coll.find_one({"id": member_id})

        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Family member with ID '{member_id}' was not found.",
            )

        # Cross-user tenancy check
        if user_role != UserRole.ADMIN.value:
            family = await self.get_family_by_id(member["family_id"])
            if not family or family["owner_user_id"] != owner_user_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Family member not found in your family records.",
                )

        return format_doc(member)

    async def update_member(
        self,
        owner_user_id: str,
        member_id: str,
        req: FamilyMemberUpdateRequest,
        user_role: str = UserRole.PATIENT.value,
    ) -> Dict[str, Any]:
        """Update an existing family member, enforcing tenancy check."""
        # Tenancy check
        existing = await self.get_member(owner_user_id, member_id, user_role)

        m_coll = self.get_members_collection()
        try:
            oid = ObjectId(member_id)
            query = {"_id": oid}
        except Exception:
            query = {"id": member_id}

        update_fields: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
        if req.full_name is not None:
            update_fields["full_name"] = req.full_name.strip()
        if req.date_of_birth is not None:
            update_fields["date_of_birth"] = req.date_of_birth.isoformat()
        if req.gender is not None:
            update_fields["gender"] = req.gender.value
        if req.relationship is not None:
            update_fields["relationship"] = req.relationship.value
        if req.blood_group is not None:
            update_fields["blood_group"] = req.blood_group
        if req.allergies is not None:
            update_fields["allergies"] = [a.strip() for a in req.allergies if a.strip()]
        if req.notes is not None:
            update_fields["notes"] = req.notes.strip() if req.notes else None

        updated = await m_coll.find_one_and_update(
            query,
            {"$set": update_fields},
            return_document=True,
        )

        logger.info(f"Updated member {member_id}")
        return format_doc(updated)

    async def delete_member(
        self,
        owner_user_id: str,
        member_id: str,
        user_role: str = UserRole.PATIENT.value,
    ) -> bool:
        """Delete a family member, enforcing tenancy check."""
        # Tenancy check verifies ownership
        await self.get_member(owner_user_id, member_id, user_role)

        m_coll = self.get_members_collection()
        try:
            oid = ObjectId(member_id)
            query = {"_id": oid}
        except Exception:
            query = {"id": member_id}

        res = await m_coll.delete_one(query)
        logger.info(f"Deleted member {member_id} (deleted count: {res.deleted_count})")
        return res.deleted_count > 0


family_service = FamilyService()
