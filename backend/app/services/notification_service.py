import logging
from datetime import datetime, date, timezone
from typing import Optional, List, Dict, Any, Tuple
from bson import ObjectId
from fastapi import HTTPException, status
from app.config import settings
from app.database.mongodb import db_manager
from app.models.notification import (
    Notification,
    NotificationChannel,
    NotificationType,
    NotificationPriority,
    NotificationStatus,
    NotificationPreference,
)
from app.schemas.notification import (
    NotificationPreferenceUpdateRequest,
)
from app.services.family_service import format_doc
from app.services.delivery_providers import notification_dispatcher

logger = logging.getLogger("vaxassist.services.notification")


class NotificationService:
    collection_name = "notifications"
    prefs_collection_name = "notification_preferences"

    def get_collection(self):
        return db_manager.get_collection(self.collection_name)

    def get_prefs_collection(self):
        return db_manager.get_collection(self.prefs_collection_name)

    async def init_indexes(self):
        """Create database indexes for notifications and preferences."""
        try:
            coll = self.get_collection()
            # Unique dedup_key prevents duplicate alerts at database level
            await coll.create_index("dedup_key", unique=True)
            # Query indexes
            await coll.create_index([("user_id", 1), ("is_read", 1)])
            await coll.create_index([("user_id", 1), ("created_at", -1)])
            await coll.create_index("family_member_id")

            # Preferences index
            p_coll = self.get_prefs_collection()
            await p_coll.create_index("user_id", unique=True)
            logger.info("Notification indexes initialized.")
        except Exception as e:
            logger.warning(f"Note: Could not ensure indexes on notifications: {e}")

    async def create_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        dedup_key: str,
        family_member_id: Optional[str] = None,
        member_name: Optional[str] = None,
        vaccine_code: Optional[str] = None,
        vaccine_name: Optional[str] = None,
        dose_number: Optional[int] = None,
        dose_name: Optional[str] = None,
        due_date: Optional[date] = None,
        vaccination_status: Optional[str] = None,
        channel: NotificationChannel = NotificationChannel.IN_APP,
        notif_type: NotificationType = NotificationType.REMINDER,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Tuple[Optional[Dict[str, Any]], bool]:
        """
        Creates an actionable notification idempotently.
        Returns (notification_dict, was_created: bool).
        If a notification with this dedup_key exists, returns (existing_doc, False).
        """
        coll = self.get_collection()

        # Check existing by dedup_key
        existing = await coll.find_one({"dedup_key": dedup_key})
        if existing:
            return format_doc(existing), False

        now = datetime.now(timezone.utc)
        doc = {
            "user_id": user_id,
            "family_member_id": family_member_id,
            "member_name": member_name,
            "vaccine_code": vaccine_code,
            "vaccine_name": vaccine_name,
            "dose_number": dose_number,
            "dose_name": dose_name,
            "due_date": due_date.isoformat() if due_date else None,
            "vaccination_status": vaccination_status,
            "title": title,
            "message": message,
            "channel": channel.value if hasattr(channel, "value") else channel,
            "type": notif_type.value if hasattr(notif_type, "value") else notif_type,
            "priority": priority.value if hasattr(priority, "value") else priority,
            "status": NotificationStatus.SENT.value,
            "is_read": False,
            "scheduled_for": now,
            "sent_at": now,
            "read_at": None,
            "dedup_key": dedup_key,
            "metadata": metadata or {},
            "created_at": now,
            "updated_at": now,
        }

        try:
            insert_result = await coll.insert_one(doc)
            doc["_id"] = insert_result.inserted_id
            formatted = format_doc(doc)

            # Dispatch via delivery provider (InApp, Email, SMS)
            await notification_dispatcher.dispatch(formatted)
            return formatted, True
        except Exception as exc:
            # Handle potential race condition on unique dedup_key
            existing_after = await coll.find_one({"dedup_key": dedup_key})
            if existing_after:
                return format_doc(existing_after), False
            logger.error(f"Failed to insert notification: {exc}")
            raise

    async def get_user_notifications(
        self,
        user_id: str,
        member_id: Optional[str] = None,
        notif_type: Optional[str] = None,
        priority: Optional[str] = None,
        is_read: Optional[bool] = None,
        limit: int = 50,
        skip: int = 0,
    ) -> List[Dict[str, Any]]:
        """Fetch notifications belonging to a specific user with filtering."""
        coll = self.get_collection()
        query: Dict[str, Any] = {"user_id": user_id}

        if member_id:
            query["family_member_id"] = member_id
        if notif_type:
            query["type"] = notif_type.upper()
        if priority:
            query["priority"] = priority.upper()
        if is_read is not None:
            query["is_read"] = is_read

        cursor = coll.find(query).sort("created_at", -1).skip(skip).limit(limit)
        results = []
        async for doc in cursor:
            results.append(format_doc(doc))
        return results

    async def get_unread_count(self, user_id: str) -> int:
        """Count unread notifications for a user."""
        coll = self.get_collection()
        return await coll.count_documents({"user_id": user_id, "is_read": False})

    async def mark_as_read(
        self,
        user_id: str,
        notification_id: str,
        is_admin: bool = False,
    ) -> Dict[str, Any]:
        """Mark an individual notification as read. Validates user ownership."""
        coll = self.get_collection()

        try:
            oid = ObjectId(notification_id)
            query = {"_id": oid}
        except Exception:
            query = {"id": notification_id}

        if not is_admin:
            query["user_id"] = user_id

        doc = await coll.find_one(query)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Notification '{notification_id}' not found or access denied.",
            )

        now = datetime.now(timezone.utc)
        updated = await coll.find_one_and_update(
            query,
            {
                "$set": {
                    "is_read": True,
                    "read_at": now,
                    "status": NotificationStatus.READ.value,
                    "updated_at": now,
                }
            },
            return_document=True,
        )
        return format_doc(updated)

    async def acknowledge_notification(
        self,
        user_id: str,
        notification_id: str,
        is_admin: bool = False,
    ) -> Dict[str, Any]:
        """Mark an individual notification as ACKNOWLEDGED. Validates user ownership."""
        coll = self.get_collection()

        try:
            oid = ObjectId(notification_id)
            query = {"_id": oid}
        except Exception:
            query = {"id": notification_id}

        if not is_admin:
            query["user_id"] = user_id

        doc = await coll.find_one(query)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Notification '{notification_id}' not found or access denied.",
            )

        now = datetime.now(timezone.utc)
        updated = await coll.find_one_and_update(
            query,
            {
                "$set": {
                    "is_read": True,
                    "read_at": doc.get("read_at") or now,
                    "status": NotificationStatus.ACKNOWLEDGED.value,
                    "updated_at": now,
                }
            },
            return_document=True,
        )
        return format_doc(updated)

    async def mark_all_as_read(self, user_id: str) -> int:
        """Mark all unread notifications for a user as read."""
        coll = self.get_collection()
        now = datetime.now(timezone.utc)
        result = await coll.update_many(
            {"user_id": user_id, "is_read": False},
            {
                "$set": {
                    "is_read": True,
                    "read_at": now,
                    "status": NotificationStatus.READ.value,
                    "updated_at": now,
                }
            },
        )
        return result.modified_count

    async def get_history(
        self,
        user_id: str,
        member_id: Optional[str] = None,
        limit: int = 50,
        skip: int = 0,
    ) -> List[Dict[str, Any]]:
        """Fetch notification history for a user."""
        coll = self.get_collection()
        query: Dict[str, Any] = {"user_id": user_id}
        if member_id:
            query["family_member_id"] = member_id

        cursor = coll.find(query).sort("created_at", -1).skip(skip).limit(limit)
        results = []
        async for doc in cursor:
            results.append(format_doc(doc))
        return results

    async def get_preferences(self, user_id: str) -> Dict[str, Any]:
        """Fetch user notification preferences or return defaults."""
        p_coll = self.get_prefs_collection()
        prefs = await p_coll.find_one({"user_id": user_id})
        if not prefs:
            return {
                "channels_enabled": [NotificationChannel.IN_APP],
                "reminder_lead_days": list(settings.DEFAULT_REMINDER_LEAD_DAYS),
                "email_enabled": True,
                "email_address": None,
                "sms_enabled": False,
                "phone_number": None,
                "quiet_hours_enabled": False,
                "quiet_hours_start": "22:00",
                "quiet_hours_end": "08:00",
                "timezone": "UTC",
            }
        return format_doc(prefs)

    async def update_preferences(
        self,
        user_id: str,
        req: NotificationPreferenceUpdateRequest,
    ) -> Dict[str, Any]:
        """Update notification preferences for a user."""
        p_coll = self.get_prefs_collection()
        update_fields: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}

        if req.channels_enabled is not None:
            update_fields["channels_enabled"] = [c.value if hasattr(c, "value") else c for c in req.channels_enabled]
        if req.reminder_lead_days is not None:
            update_fields["reminder_lead_days"] = sorted(list(set(req.reminder_lead_days)), reverse=True)
        if req.email_enabled is not None:
            update_fields["email_enabled"] = req.email_enabled
        if req.email_address is not None:
            update_fields["email_address"] = req.email_address.strip() if req.email_address else None
        if req.sms_enabled is not None:
            update_fields["sms_enabled"] = req.sms_enabled
        if req.phone_number is not None:
            update_fields["phone_number"] = req.phone_number.strip() if req.phone_number else None
        if req.quiet_hours_enabled is not None:
            update_fields["quiet_hours_enabled"] = req.quiet_hours_enabled
        if req.quiet_hours_start is not None:
            update_fields["quiet_hours_start"] = req.quiet_hours_start.strip()
        if req.quiet_hours_end is not None:
            update_fields["quiet_hours_end"] = req.quiet_hours_end.strip()
        if req.timezone is not None:
            update_fields["timezone"] = req.timezone.strip()

        insert_defaults = {
            "user_id": user_id,
            "channels_enabled": [NotificationChannel.IN_APP.value],
            "reminder_lead_days": list(settings.DEFAULT_REMINDER_LEAD_DAYS),
            "email_enabled": True,
            "sms_enabled": False,
            "phone_number": None,
            "quiet_hours_enabled": False,
            "quiet_hours_start": "22:00",
            "quiet_hours_end": "08:00",
            "timezone": "UTC",
            "created_at": datetime.now(timezone.utc),
        }
        for k in update_fields.keys():
            insert_defaults.pop(k, None)

        updated = await p_coll.find_one_and_update(
            {"user_id": user_id},
            {
                "$set": update_fields,
                "$setOnInsert": insert_defaults,
            },
            upsert=True,
            return_document=True,
        )
        return format_doc(updated)

    async def delete_notifications_for_member(self, member_id: str) -> int:
        """Removes notifications associated with a deleted family member."""
        coll = self.get_collection()
        res = await coll.delete_many({"family_member_id": member_id})
        logger.info(f"Deleted {res.deleted_count} notifications for removed member {member_id}")
        return res.deleted_count

    async def resolve_dose_notifications(
        self,
        user_id: str,
        member_id: str,
        vaccine_code: str,
        dose_number: int,
    ) -> int:
        """
        When a vaccination dose is administered, marks any active pending/unread
        reminders or overdue alerts for this specific dose as resolved.
        """
        coll = self.get_collection()
        now = datetime.now(timezone.utc)
        res = await coll.update_many(
            {
                "user_id": user_id,
                "family_member_id": member_id,
                "vaccine_code": vaccine_code.strip().upper(),
                "dose_number": dose_number,
                "is_read": False,
            },
            {
                "$set": {
                    "is_read": True,
                    "read_at": now,
                    "status": NotificationStatus.READ.value,
                    "metadata.resolved_by_administration": True,
                    "updated_at": now,
                }
            },
        )
        return res.modified_count


notification_service = NotificationService()
