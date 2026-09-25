import logging
from datetime import datetime, date, timezone
from typing import Optional, List, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status
from app.database.mongodb import db_manager
from app.models.vaccination import VaccinationStatus
from app.models.user import UserRole
from app.schemas.vaccination import (
    VaccinationRecordCreateRequest,
    VaccinationRecordUpdateRequest,
)
from app.services.family_service import family_service, format_doc
from app.services.schedule_engine import calculate_member_schedule

logger = logging.getLogger("vaxassist.services.vaccination")


class VaccinationService:
    collection_name = "vaccination_records"

    def get_collection(self):
        return db_manager.get_collection(self.collection_name)

    async def init_indexes(self):
        """Create database indexes for vaccination records."""
        try:
            coll = self.get_collection()
            # Index by family_member_id
            await coll.create_index("family_member_id")
            # Compound index for uniqueness: one record per member per vaccine dose
            await coll.create_index(
                [("family_member_id", 1), ("vaccine_code", 1), ("dose_number", 1)],
                unique=True,
            )
            # Index by administered date
            await coll.create_index("administered_date")
            logger.info("Vaccination record indexes initialized.")
        except Exception as e:
            logger.warning(f"Note: Could not ensure indexes on vaccination_records: {e}")

    async def _verify_member_access(
        self,
        owner_user_id: str,
        member_id: str,
        user_role: str = UserRole.PATIENT.value,
    ) -> Dict[str, Any]:
        """
        Validates that member exists and belongs to a family owned by owner_user_id (or admin).
        Returns the member document if authorized; raises 404 otherwise.
        """
        member = await family_service.get_member(
            owner_user_id=owner_user_id,
            member_id=member_id,
            user_role=user_role,
        )
        return member

    async def add_record(
        self,
        owner_user_id: str,
        member_id: str,
        req: VaccinationRecordCreateRequest,
        user_role: str = UserRole.PATIENT.value,
    ) -> Dict[str, Any]:
        """Add an administered vaccination record for a family member."""
        # 1. Tenancy check
        member = await self._verify_member_access(owner_user_id, member_id, user_role)

        # 2. Medical consistency: administered_date vs member date_of_birth
        member_dob_raw = member.get("date_of_birth")
        member_dob = (
            date.fromisoformat(member_dob_raw)
            if isinstance(member_dob_raw, str)
            else member_dob_raw
        )

        if req.administered_date < member_dob:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Administered date ({req.administered_date}) cannot be prior to member's date of birth ({member_dob}).",
            )

        today = date.today()
        if req.administered_date > today:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Administered date ({req.administered_date}) cannot be in the future.",
            )

        coll = self.get_collection()

        # 3. Duplicate check: same member + vaccine_code + dose_number
        existing = await coll.find_one({
            "family_member_id": member_id,
            "vaccine_code": req.vaccine_code,
            "dose_number": req.dose_number,
        })
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Dose {req.dose_number} for vaccine '{req.vaccine_code}' has already been recorded for {member['full_name']}.",
            )

        now = datetime.now(timezone.utc)
        record_doc = {
            "family_member_id": member_id,
            "vaccine_code": req.vaccine_code,
            "vaccine_name": req.vaccine_name,
            "dose_number": req.dose_number,
            "dose_name": req.dose_name or f"Dose {req.dose_number}",
            "administered_date": req.administered_date.isoformat(),
            "healthcare_provider": req.healthcare_provider.strip() if req.healthcare_provider else None,
            "batch_number": req.batch_number.strip() if req.batch_number else None,
            "vaccination_status": VaccinationStatus.COMPLETED.value,
            "notes": req.notes.strip() if req.notes else None,
            "is_verified": user_role == UserRole.HEALTHCARE_WORKER.value,
            "created_at": now,
            "updated_at": now,
        }

        res = await coll.insert_one(record_doc)
        record_doc["id"] = str(res.inserted_id)
        if "_id" in record_doc:
            record_doc.pop("_id")

        logger.info(f"Recorded vaccine {req.vaccine_code} Dose {req.dose_number} for member {member_id}")
        return record_doc

    async def list_records_for_member(
        self,
        owner_user_id: str,
        member_id: str,
        user_role: str = UserRole.PATIENT.value,
    ) -> List[Dict[str, Any]]:
        """List all administered vaccination records for a family member."""
        await self._verify_member_access(owner_user_id, member_id, user_role)

        coll = self.get_collection()
        cursor = coll.find({"family_member_id": member_id}).sort("administered_date", 1)
        records = []
        async for doc in cursor:
            records.append(format_doc(doc))
        return records

    async def get_record(
        self,
        owner_user_id: str,
        record_id: str,
        user_role: str = UserRole.PATIENT.value,
    ) -> Dict[str, Any]:
        """Fetch a specific vaccination record, verifying family ownership."""
        coll = self.get_collection()
        try:
            oid = ObjectId(record_id)
            doc = await coll.find_one({"_id": oid})
        except Exception:
            doc = await coll.find_one({"id": record_id})

        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vaccination record with ID '{record_id}' was not found.",
            )

        # Enforce tenancy through member -> family -> owner
        await self._verify_member_access(owner_user_id, doc["family_member_id"], user_role)
        return format_doc(doc)

    async def update_record(
        self,
        owner_user_id: str,
        record_id: str,
        req: VaccinationRecordUpdateRequest,
        user_role: str = UserRole.PATIENT.value,
    ) -> Dict[str, Any]:
        """Update an existing vaccination record, verifying ownership."""
        existing = await self.get_record(owner_user_id, record_id, user_role)
        coll = self.get_collection()

        member = await self._verify_member_access(
            owner_user_id, existing["family_member_id"], user_role
        )
        member_dob_raw = member.get("date_of_birth")
        member_dob = (
            date.fromisoformat(member_dob_raw)
            if isinstance(member_dob_raw, str)
            else member_dob_raw
        )

        update_fields: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}

        if req.administered_date is not None:
            if req.administered_date < member_dob:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Administered date cannot be prior to member's date of birth ({member_dob}).",
                )
            if req.administered_date > date.today():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Administered date cannot be in the future.",
                )
            update_fields["administered_date"] = req.administered_date.isoformat()

        if req.vaccine_name is not None:
            update_fields["vaccine_name"] = req.vaccine_name.strip()
        if req.dose_number is not None:
            update_fields["dose_number"] = req.dose_number
        if req.dose_name is not None:
            update_fields["dose_name"] = req.dose_name.strip()
        if req.healthcare_provider is not None:
            update_fields["healthcare_provider"] = (
                req.healthcare_provider.strip() if req.healthcare_provider else None
            )
        if req.batch_number is not None:
            update_fields["batch_number"] = (
                req.batch_number.strip() if req.batch_number else None
            )
        if req.notes is not None:
            update_fields["notes"] = req.notes.strip() if req.notes else None

        try:
            oid = ObjectId(record_id)
            query = {"_id": oid}
        except Exception:
            query = {"id": record_id}

        updated = await coll.find_one_and_update(
            query,
            {"$set": update_fields},
            return_document=True,
        )

        logger.info(f"Updated vaccination record {record_id}")
        return format_doc(updated)

    async def delete_record(
        self,
        owner_user_id: str,
        record_id: str,
        user_role: str = UserRole.PATIENT.value,
    ) -> bool:
        """Delete a vaccination record, verifying ownership."""
        await self.get_record(owner_user_id, record_id, user_role)
        coll = self.get_collection()

        try:
            oid = ObjectId(record_id)
            query = {"_id": oid}
        except Exception:
            query = {"id": record_id}

        res = await coll.delete_one(query)
        logger.info(f"Deleted vaccination record {record_id}")
        return res.deleted_count > 0

    async def get_member_schedule(
        self,
        owner_user_id: str,
        member_id: str,
        reference_date: Optional[date] = None,
        user_role: str = UserRole.PATIENT.value,
    ) -> Dict[str, Any]:
        """
        Calculates and returns the complete deterministic vaccination schedule
        and current completion summary for a family member.
        """
        # 1. Tenancy check
        member = await self._verify_member_access(owner_user_id, member_id, user_role)

        # 2. Parse DOB
        dob_raw = member.get("date_of_birth")
        dob = (
            date.fromisoformat(dob_raw)
            if isinstance(dob_raw, str)
            else dob_raw
        )

        # 3. Retrieve all existing records for this member
        coll = self.get_collection()
        cursor = coll.find({"family_member_id": member_id})
        records = []
        async for doc in cursor:
            records.append(format_doc(doc))

        # 4. Run deterministic schedule engine
        calc_result = calculate_member_schedule(
            date_of_birth=dob,
            existing_records=records,
            reference_date=reference_date or date.today(),
        )

        # 5. Format current age display
        today = reference_date or date.today()
        years = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        age_str = f"{years} years" if years >= 2 else f"{(today - dob).days // 30} months"

        return {
            "member_id": member_id,
            "member_name": member["full_name"],
            "date_of_birth": dob,
            "current_age_display": age_str,
            "summary": calc_result["summary"],
            "schedule_items": calc_result["schedule_items"],
        }


vaccination_service = VaccinationService()
