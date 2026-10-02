import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status
from app.config import settings
from app.database.mongodb import db_manager
from app.models.user import UserRole, AccountStatus
from app.utils.security import hash_password, verify_password

logger = logging.getLogger("vaxassist.services.user")


def format_user_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Helper to ensure MongoDB document is formatted properly for Pydantic."""
    if not doc:
        return doc
    doc_copy = dict(doc)
    if "_id" in doc_copy:
        doc_copy["id"] = str(doc_copy.pop("_id"))
    return doc_copy


class UserService:
    collection_name = "users"

    def get_collection(self):
        return db_manager.get_collection(self.collection_name)

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        collection = self.get_collection()
        doc = await collection.find_one({"email": email.lower().strip()})
        return format_user_doc(doc) if doc else None

    async def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        collection = self.get_collection()
        try:
            oid = ObjectId(user_id)
            doc = await collection.find_one({"_id": oid})
        except Exception:
            doc = await collection.find_one({"id": user_id})
        return format_user_doc(doc) if doc else None

    async def register_user(
        self,
        name: str,
        email: str,
        password: str,
        role: UserRole = UserRole.PATIENT,
        license_number: Optional[str] = None,
        clinic_or_hospital: Optional[str] = None,
    ) -> Dict[str, Any]:
        collection = self.get_collection()
        email_clean = email.lower().strip()

        # Check for existing email
        existing = await collection.find_one({"email": email_clean})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An account with email '{email_clean}' already exists.",
            )

        # Enforce registration rules
        if role == UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Administrator accounts cannot be created via public registration.",
            )

        # Healthcare workers begin as PENDING until approved by admin
        initial_status = (
            AccountStatus.PENDING if role == UserRole.HEALTHCARE_WORKER else AccountStatus.ACTIVE
        )

        now = datetime.now(timezone.utc)
        user_doc = {
            "name": name.strip(),
            "email": email_clean,
            "hashed_password": hash_password(password),
            "role": role.value,
            "account_status": initial_status.value,
            "license_number": license_number.strip() if license_number else None,
            "clinic_or_hospital": clinic_or_hospital.strip() if clinic_or_hospital else None,
            "status_reason": None,
            "created_at": now,
            "updated_at": now,
        }

        result = await collection.insert_one(user_doc)
        user_doc["id"] = str(result.inserted_id)
        if "_id" in user_doc:
            user_doc.pop("_id")

        logger.info(f"Registered new user '{email_clean}' with role '{role.value}' and status '{initial_status.value}'")
        return user_doc

    async def authenticate(self, email: str, password: str) -> Dict[str, Any]:
        user = await self.get_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not verify_password(password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Role & Status Checks
        account_status = user.get("account_status")

        if account_status == AccountStatus.INACTIVE.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated. Please contact support.",
            )

        if account_status == AccountStatus.REJECTED.value:
            reason = user.get("status_reason")
            msg = f"Your account registration was rejected."
            if reason:
                msg += f" Reason: {reason}"
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=msg,
            )

        if user.get("role") == UserRole.HEALTHCARE_WORKER.value and account_status == AccountStatus.PENDING.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your healthcare worker account is pending administrator approval. You will receive access once approved.",
            )

        return user

    async def list_users(
        self,
        role: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        collection = self.get_collection()
        query: Dict[str, Any] = {}

        if role:
            query["role"] = role
        if status:
            query["account_status"] = status
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"license_number": {"$regex": search, "$options": "i"}},
            ]

        cursor = collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        users = []
        async for doc in cursor:
            users.append(format_user_doc(doc))
        return users

    async def update_status(
        self,
        user_id: str,
        new_status: AccountStatus,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        collection = self.get_collection()
        now = datetime.now(timezone.utc)

        try:
            oid = ObjectId(user_id)
            query = {"_id": oid}
        except Exception:
            query = {"id": user_id}

        update_fields: Dict[str, Any] = {
            "account_status": new_status.value,
            "updated_at": now,
        }
        if reason is not None:
            update_fields["status_reason"] = reason

        result = await collection.find_one_and_update(
            query,
            {"$set": update_fields},
            return_document=True,
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID '{user_id}' was not found.",
            )

        logger.info(f"Updated status for user {user_id} to '{new_status.value}'")
        return format_user_doc(result)

    async def update_role(
        self,
        user_id: str,
        new_role: UserRole,
    ) -> Dict[str, Any]:
        collection = self.get_collection()
        now = datetime.now(timezone.utc)

        try:
            oid = ObjectId(user_id)
            query = {"_id": oid}
        except Exception:
            query = {"id": user_id}

        result = await collection.find_one_and_update(
            query,
            {"$set": {"role": new_role.value, "updated_at": now}},
            return_document=True,
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID '{user_id}' was not found.",
            )

        logger.info(f"Updated role for user {user_id} to '{new_role.value}'")
        return format_user_doc(result)

    async def bootstrap_admin(self) -> Optional[Dict[str, Any]]:
        """Safe bootstrap mechanism to initialize the first admin account if none exists."""
        if not settings.AUTO_BOOTSTRAP_ADMIN:
            return None

        try:
            collection = self.get_collection()
            # Check if any admin already exists
            admin_count = await collection.count_documents({"role": UserRole.ADMIN.value})
            if admin_count > 0:
                logger.info(f"System administrator account(s) already exist ({admin_count} found). Skipping bootstrap.")
                return None

            admin_email = settings.ADMIN_EMAIL.lower().strip()
            # Check if this email is already registered with another role
            existing = await collection.find_one({"email": admin_email})
            now = datetime.now(timezone.utc)

            if existing:
                # Elevate to admin
                await collection.update_one(
                    {"_id": existing["_id"]},
                    {"$set": {"role": UserRole.ADMIN.value, "account_status": AccountStatus.ACTIVE.value, "updated_at": now}},
                )
                logger.info(f"Elevated existing user '{admin_email}' to system administrator.")
                existing["role"] = UserRole.ADMIN.value
                existing["account_status"] = AccountStatus.ACTIVE.value
                return format_user_doc(existing)

            # Insert initial admin account
            admin_doc = {
                "name": settings.ADMIN_NAME,
                "email": admin_email,
                "hashed_password": hash_password(settings.ADMIN_PASSWORD),
                "role": UserRole.ADMIN.value,
                "account_status": AccountStatus.ACTIVE.value,
                "license_number": None,
                "clinic_or_hospital": None,
                "status_reason": "System bootstrap",
                "created_at": now,
                "updated_at": now,
            }
            res = await collection.insert_one(admin_doc)
            admin_doc["id"] = str(res.inserted_id)
            if "_id" in admin_doc:
                admin_doc.pop("_id")

            logger.info(f"Bootstrapped initial system administrator: '{admin_email}'")
            return admin_doc
        except Exception as exc:
            logger.warning(f"Could not bootstrap initial admin: {exc}")
            return None

    async def bootstrap_demo_accounts(self) -> None:
        """
        Safely seeds or ensures all 4 official demo accounts exist and are active:
        - Patient: rajesh.sharma@vaxassist.demo / Rajesh@Vax2026!
        - Healthcare Worker: dr.anjali.deshmukh@vaxassist.demo / DrAnjali@Vax2026!
        - Alt Healthcare Worker: dr.vikram.patil@vaxassist.demo / DrVikram@Vax2026!
        - Admin: admin@vaxassist.demo / Admin@Vax2026!
        """
        demo_specs = [
            {
                "email": "admin@vaxassist.demo",
                "password": "Admin@Vax2026!",
                "name": "Dr. Sunita Rao (MoHFW Admin)",
                "role": UserRole.ADMIN.value,
                "account_status": AccountStatus.ACTIVE.value,
                "clinic_or_hospital": "State Immunization HQ / MoHFW",
                "license_number": "MCI-ADMIN-001",
                "phone_number": "+91 99000 11223",
            },
            {
                "email": "dr.anjali.deshmukh@vaxassist.demo",
                "password": "DrAnjali@Vax2026!",
                "name": "Dr. Anjali Deshmukh",
                "role": UserRole.HEALTHCARE_WORKER.value,
                "account_status": AccountStatus.ACTIVE.value,
                "clinic_or_hospital": "Lilavati Hospital",
                "license_number": "MMC-2012-08492",
                "phone_number": "+91 98450 12890",
            },
            {
                "email": "dr.vikram.patil@vaxassist.demo",
                "password": "DrVikram@Vax2026!",
                "name": "Dr. Vikram Patil",
                "role": UserRole.HEALTHCARE_WORKER.value,
                "account_status": AccountStatus.ACTIVE.value,
                "clinic_or_hospital": "KEM Hospital",
                "license_number": "MMC-2008-01234",
                "phone_number": "+91 98200 44512",
            },
            {
                "email": "rajesh.sharma@vaxassist.demo",
                "password": "Rajesh@Vax2026!",
                "name": "Rajesh Sharma",
                "role": UserRole.PATIENT.value,
                "account_status": AccountStatus.ACTIVE.value,
                "clinic_or_hospital": "Sharma Family Household",
                "license_number": None,
                "phone_number": "+91 98112 45901",
            },
        ]

        try:
            collection = self.get_collection()
            now = datetime.now(timezone.utc)
            for spec in demo_specs:
                email = spec["email"].lower().strip()
                existing = await collection.find_one({"email": email})
                if existing:
                    # Update password and ensure active status
                    await collection.update_one(
                        {"_id": existing["_id"]},
                        {
                            "$set": {
                                "hashed_password": hash_password(spec["password"]),
                                "role": spec["role"],
                                "account_status": AccountStatus.ACTIVE.value,
                                "clinic_or_hospital": spec["clinic_or_hospital"],
                                "license_number": spec.get("license_number"),
                                "updated_at": now,
                            }
                        },
                    )
                else:
                    new_doc = {
                        "name": spec["name"],
                        "email": email,
                        "hashed_password": hash_password(spec["password"]),
                        "role": spec["role"],
                        "account_status": AccountStatus.ACTIVE.value,
                        "license_number": spec.get("license_number"),
                        "clinic_or_hospital": spec["clinic_or_hospital"],
                        "phone_number": spec.get("phone_number"),
                        "status_reason": "Pre-configured demo account",
                        "created_at": now,
                        "updated_at": now,
                    }
                    await collection.insert_one(new_doc)
            logger.info("Verified and bootstrapped all 4 official demo accounts successfully.")
        except Exception as exc:
            logger.warning(f"Could not bootstrap demo accounts: {exc}")


user_service = UserService()
