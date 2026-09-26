"""
Proactive Vaccination Monitoring Engine.
Continuously turns deterministic vaccination schedule calculations into actionable,
idempotent notifications and reminders across all patient family members.
"""
import asyncio
import logging
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any
from app.models.notification import (
    NotificationChannel,
    NotificationType,
    NotificationPriority,
)
from app.models.vaccination import VaccinationStatus
from app.models.user import UserRole, AccountStatus
from app.services.family_service import family_service, format_doc
from app.services.schedule_engine import calculate_member_schedule
from app.services.notification_service import notification_service

logger = logging.getLogger("vaxassist.monitoring.engine")


class MonitoringEngine:
    """
    Evaluates vaccination timelines and dispatches clinical alerts & reminders.
    Utilizes the deterministic schedule engine as the authoritative source of truth.
    """

    async def monitor_family_member(
        self,
        user_id: str,
        member: Dict[str, Any],
        reference_date: Optional[date] = None,
        user_prefs: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Monitors a single family member.
        Calculates current schedule state, checks for transitions, and generates notifications.
        Returns execution statistics for this member.
        """
        today = reference_date or date.today()
        member_id = str(member.get("id") or member.get("_id"))
        member_name = member.get("full_name", "Family Member")

        dob_raw = member.get("date_of_birth")
        if isinstance(dob_raw, str):
            dob = date.fromisoformat(dob_raw.split("T")[0])
        elif isinstance(dob_raw, datetime):
            dob = dob_raw.date()
        else:
            dob = dob_raw

        # 1. Retrieve member's existing vaccination records
        from app.services.vaccination_service import vaccination_service
        v_coll = vaccination_service.get_collection()
        cursor = v_coll.find({"family_member_id": member_id})
        records = []
        async for doc in cursor:
            records.append(format_doc(doc))

        # 2. Run deterministic schedule calculation
        schedule_eval = calculate_member_schedule(
            date_of_birth=dob,
            existing_records=records,
            reference_date=today,
        )

        # 3. Retrieve user reminder preferences (default: [7, 3, 1] days lead time)
        if user_prefs is None:
            user_prefs = await notification_service.get_preferences(user_id)

        lead_days: List[int] = user_prefs.get("reminder_lead_days", [7, 3, 1])
        channels = user_prefs.get("channels_enabled", [NotificationChannel.IN_APP])
        primary_channel = channels[0] if channels else NotificationChannel.IN_APP

        stats = {
            "member_id": member_id,
            "member_name": member_name,
            "evaluated_doses": len(schedule_eval["schedule_items"]),
            "notifications_created": 0,
            "notifications_skipped_duplicate": 0,
            "resolved_notifications": 0,
        }

        # Pre-fetch existing notifications for this member in a single remote query
        # to eliminate hundreds of sequential round trips to remote MongoDB Atlas.
        n_coll = notification_service.get_collection()
        existing_notifs_cursor = n_coll.find(
            {"family_member_id": member_id},
            {"dedup_key": 1, "vaccine_code": 1, "is_read": 1, "_id": 0}
        )
        existing_dedup_keys = set()
        active_vaccine_codes = set()
        async for doc in existing_notifs_cursor:
            k = doc.get("dedup_key")
            if k:
                existing_dedup_keys.add(k)
            if not doc.get("is_read"):
                vc = doc.get("vaccine_code")
                if vc:
                    active_vaccine_codes.add(vc.strip().upper())

        # 4. Process each schedule item
        for item in schedule_eval["schedule_items"]:
            status = item["status"]
            rule_code = item["code"]
            dose_number = item["dose_number"]
            dose_name = item["dose_name"]
            vaccine_name = item["name"]
            calculated_due = item["calculated_due_date"]
            status_reason = item["status_reason"]

            # --- A. COMPLETED: resolve open alerts and skip creation ---
            if status == VaccinationStatus.COMPLETED:
                v_code = item.get("vaccine_code", rule_code).strip().upper()
                if v_code in active_vaccine_codes:
                    resolved_count = await notification_service.resolve_dose_notifications(
                        user_id=user_id,
                        member_id=member_id,
                        vaccine_code=v_code,
                        dose_number=dose_number,
                    )
                    stats["resolved_notifications"] += resolved_count
                continue

            # --- B. UPCOMING: Configurable lead-day reminders ---
            elif status == VaccinationStatus.UPCOMING:
                days_until_due = (calculated_due - today).days

                # Check if today matches or falls within an un-notified lead day window
                # We identify which lead day buckets are applicable (e.g. 7, 3, 1)
                applicable_buckets = [d for d in lead_days if days_until_due <= d and days_until_due >= 0]
                if applicable_buckets:
                    # Choose the closest/most urgent applicable bucket
                    lead_bucket = min(applicable_buckets)
                    dedup_key = f"{user_id}:{member_id}:{rule_code}:REMINDER:{calculated_due.isoformat()}:{lead_bucket}d"
                    if dedup_key in existing_dedup_keys:
                        stats["notifications_skipped_duplicate"] += 1
                        continue

                    due_str = calculated_due.strftime("%b %d, %Y")
                    days_text = "today" if days_until_due == 0 else f"in {days_until_due} day{'s' if days_until_due != 1 else ''}"
                    title = f"Upcoming Vaccination: {vaccine_name}"
                    message = (
                        f"{member_name} is scheduled for {vaccine_name} ({dose_name}) on {due_str} "
                        f"({item['recommended_age_display']}). Due {days_text}."
                    )

                    _, created = await notification_service.create_notification(
                        user_id=user_id,
                        family_member_id=member_id,
                        member_name=member_name,
                        vaccine_code=item.get("vaccine_code", rule_code),
                        vaccine_name=vaccine_name,
                        dose_number=dose_number,
                        dose_name=dose_name,
                        due_date=calculated_due,
                        vaccination_status=VaccinationStatus.UPCOMING.value,
                        title=title,
                        message=message,
                        channel=primary_channel,
                        notif_type=NotificationType.REMINDER,
                        priority=NotificationPriority.MEDIUM if days_until_due > 1 else NotificationPriority.HIGH,
                        dedup_key=dedup_key,
                        metadata={
                            "days_until_due": days_until_due,
                            "lead_bucket": lead_bucket,
                            "rule_code": rule_code,
                        },
                    )
                    if created:
                        existing_dedup_keys.add(dedup_key)
                        stats["notifications_created"] += 1
                    else:
                        stats["notifications_skipped_duplicate"] += 1

            # --- C. DUE: Vaccination currently due for administration ---
            elif status == VaccinationStatus.DUE:
                dedup_key = f"{user_id}:{member_id}:{rule_code}:DUE:{calculated_due.isoformat()}"
                if dedup_key in existing_dedup_keys:
                    stats["notifications_skipped_duplicate"] += 1
                    continue

                due_str = calculated_due.strftime("%b %d, %Y")
                title = f"Vaccination Due: {vaccine_name}"
                message = (
                    f"{vaccine_name} ({dose_name}) is currently due for {member_name} "
                    f"(target date: {due_str}). Please book an appointment with your healthcare provider."
                )

                _, created = await notification_service.create_notification(
                    user_id=user_id,
                    family_member_id=member_id,
                    member_name=member_name,
                    vaccine_code=item.get("vaccine_code", rule_code),
                    vaccine_name=vaccine_name,
                    dose_number=dose_number,
                    dose_name=dose_name,
                    due_date=calculated_due,
                    vaccination_status=VaccinationStatus.DUE.value,
                    title=title,
                    message=message,
                    channel=primary_channel,
                    notif_type=NotificationType.DUE_ALERT,
                    priority=NotificationPriority.HIGH,
                    dedup_key=dedup_key,
                    metadata={"rule_code": rule_code, "status": "DUE"},
                )
                if created:
                    existing_dedup_keys.add(dedup_key)
                    stats["notifications_created"] += 1
                else:
                    stats["notifications_skipped_duplicate"] += 1

            # --- D. OVERDUE: Exceeded grace period ---
            elif status == VaccinationStatus.OVERDUE:
                days_overdue = (today - calculated_due).days
                dedup_key = f"{user_id}:{member_id}:{rule_code}:OVERDUE:{calculated_due.isoformat()}"
                if dedup_key in existing_dedup_keys:
                    stats["notifications_skipped_duplicate"] += 1
                    continue

                title = f"Vaccination Overdue: {vaccine_name}"
                message = (
                    f"{vaccine_name} ({dose_name}) for {member_name} is overdue by {days_overdue} days "
                    f"(was due {calculated_due.strftime('%b %d, %Y')}). Please arrange administration promptly."
                )

                _, created = await notification_service.create_notification(
                    user_id=user_id,
                    family_member_id=member_id,
                    member_name=member_name,
                    vaccine_code=item.get("vaccine_code", rule_code),
                    vaccine_name=vaccine_name,
                    dose_number=dose_number,
                    dose_name=dose_name,
                    due_date=calculated_due,
                    vaccination_status=VaccinationStatus.OVERDUE.value,
                    title=title,
                    message=message,
                    channel=primary_channel,
                    notif_type=NotificationType.OVERDUE_ALERT,
                    priority=NotificationPriority.HIGH,
                    dedup_key=dedup_key,
                    metadata={
                        "days_overdue": days_overdue,
                        "rule_code": rule_code,
                        "status": "OVERDUE",
                    },
                )
                if created:
                    existing_dedup_keys.add(dedup_key)
                    stats["notifications_created"] += 1
                else:
                    stats["notifications_skipped_duplicate"] += 1

            # --- E. MISSED: Hard clinical administration window expired ---
            elif status == VaccinationStatus.MISSED:
                dedup_key = f"{user_id}:{member_id}:{rule_code}:MISSED"
                if dedup_key in existing_dedup_keys:
                    stats["notifications_skipped_duplicate"] += 1
                    continue

                title = f"Vaccination Window Expired: {vaccine_name}"
                message = f"{vaccine_name} ({dose_name}) for {member_name}: {status_reason}"

                _, created = await notification_service.create_notification(
                    user_id=user_id,
                    family_member_id=member_id,
                    member_name=member_name,
                    vaccine_code=item.get("vaccine_code", rule_code),
                    vaccine_name=vaccine_name,
                    dose_number=dose_number,
                    dose_name=dose_name,
                    due_date=calculated_due,
                    vaccination_status=VaccinationStatus.MISSED.value,
                    title=title,
                    message=message,
                    channel=primary_channel,
                    notif_type=NotificationType.MISSED_ALERT,
                    priority=NotificationPriority.HIGH,
                    dedup_key=dedup_key,
                    metadata={"rule_code": rule_code, "status": "MISSED"},
                )
                if created:
                    existing_dedup_keys.add(dedup_key)
                    stats["notifications_created"] += 1
                else:
                    stats["notifications_skipped_duplicate"] += 1

            # --- F. CATCH_UP_REQUIRED: Routine cutoff exceeded, catch-up protocol applies ---
            elif status == VaccinationStatus.CATCH_UP_REQUIRED:
                dedup_key = f"{user_id}:{member_id}:{rule_code}:CATCH_UP"
                if dedup_key in existing_dedup_keys:
                    stats["notifications_skipped_duplicate"] += 1
                    continue

                title = f"Catch-Up Protocol Required: {vaccine_name}"
                message = f"{vaccine_name} for {member_name}: {status_reason}"

                _, created = await notification_service.create_notification(
                    user_id=user_id,
                    family_member_id=member_id,
                    member_name=member_name,
                    vaccine_code=item.get("vaccine_code", rule_code),
                    vaccine_name=vaccine_name,
                    dose_number=dose_number,
                    dose_name=dose_name,
                    due_date=calculated_due,
                    vaccination_status=VaccinationStatus.CATCH_UP_REQUIRED.value,
                    title=title,
                    message=message,
                    channel=primary_channel,
                    notif_type=NotificationType.CATCH_UP_ALERT,
                    priority=NotificationPriority.HIGH,
                    dedup_key=dedup_key,
                    metadata={"rule_code": rule_code, "status": "CATCH_UP_REQUIRED"},
                )
                if created:
                    existing_dedup_keys.add(dedup_key)
                    stats["notifications_created"] += 1
                else:
                    stats["notifications_skipped_duplicate"] += 1

            # --- G. CLINICAL_REVIEW: Evaluation by physician mandatory ---
            elif status == VaccinationStatus.CLINICAL_REVIEW:
                dedup_key = f"{user_id}:{member_id}:{rule_code}:CLINICAL_REVIEW"
                if dedup_key in existing_dedup_keys:
                    stats["notifications_skipped_duplicate"] += 1
                    continue

                title = f"Clinical Review Mandatory: {vaccine_name}"
                message = f"{vaccine_name} for {member_name}: {status_reason}"

                _, created = await notification_service.create_notification(
                    user_id=user_id,
                    family_member_id=member_id,
                    member_name=member_name,
                    vaccine_code=item.get("vaccine_code", rule_code),
                    vaccine_name=vaccine_name,
                    dose_number=dose_number,
                    dose_name=dose_name,
                    due_date=calculated_due,
                    vaccination_status=VaccinationStatus.CLINICAL_REVIEW.value,
                    title=title,
                    message=message,
                    channel=primary_channel,
                    notif_type=NotificationType.CLINICAL_REVIEW_ALERT,
                    priority=NotificationPriority.URGENT,
                    dedup_key=dedup_key,
                    metadata={"rule_code": rule_code, "status": "CLINICAL_REVIEW"},
                )
                if created:
                    existing_dedup_keys.add(dedup_key)
                    stats["notifications_created"] += 1
                else:
                    stats["notifications_skipped_duplicate"] += 1

        return stats

    async def monitor_user_family(
        self,
        user_id: str,
        reference_date: Optional[date] = None,
        family_member_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Monitors the entire family (or a specific member) for a given user.
        """
        # Retrieve user preferences
        prefs = await notification_service.get_preferences(user_id)

        # Retrieve family members
        members = await family_service.list_members(owner_user_id=user_id)
        if family_member_id:
            members = [m for m in members if str(m.get("id")) == str(family_member_id)]

        total_doses = 0
        total_created = 0
        total_skipped = 0
        total_resolved = 0
        member_summaries = []

        for m in members:
            m_stats = await self.monitor_family_member(
                user_id=user_id,
                member=m,
                reference_date=reference_date,
                user_prefs=prefs,
            )
            total_doses += m_stats["evaluated_doses"]
            total_created += m_stats["notifications_created"]
            total_skipped += m_stats["notifications_skipped_duplicate"]
            total_resolved += m_stats["resolved_notifications"]
            member_summaries.append(m_stats)

        return {
            "user_id": user_id,
            "scanned_members": len(members),
            "evaluated_doses": total_doses,
            "notifications_created": total_created,
            "notifications_skipped_duplicate": total_skipped,
            "resolved_notifications": total_resolved,
            "details": member_summaries,
        }

    async def monitor_all_active_users(
        self,
        reference_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        """
        Periodic engine routine: scans all active patient accounts and recalculates status.
        Gracefully handles exceptions per-user so one failure does not halt the cycle.
        """
        from app.services.user_service import user_service
        u_coll = user_service.get_collection()

        cursor = u_coll.find({
            "account_status": AccountStatus.ACTIVE.value,
            "role": UserRole.PATIENT.value,
        })

        total_users = 0
        total_members = 0
        total_doses = 0
        total_created = 0
        total_skipped = 0
        total_resolved = 0
        details = []

        async for user_doc in cursor:
            user_id = str(user_doc["_id"])
            total_users += 1
            try:
                res = await self.monitor_user_family(user_id=user_id, reference_date=reference_date)
                total_members += res["scanned_members"]
                total_doses += res["evaluated_doses"]
                total_created += res["notifications_created"]
                total_skipped += res["notifications_skipped_duplicate"]
                total_resolved += res["resolved_notifications"]
                if res["notifications_created"] > 0:
                    details.append({
                        "user_id": user_id,
                        "created": res["notifications_created"],
                        "members": res["scanned_members"],
                    })
                await asyncio.sleep(0.02)
            except Exception as e:
                # Log without exposing PII
                logger.error(f"Error executing monitoring for user {user_id}: {type(e).__name__}")

        logger.info(
            f"Monitoring cycle completed: scanned {total_users} users, {total_members} members, "
            f"evaluated {total_doses} doses, created {total_created} notifications, "
            f"skipped {total_skipped} duplicates, resolved {total_resolved}."
        )

        return {
            "scanned_users": total_users,
            "scanned_members": total_members,
            "evaluated_doses": total_doses,
            "notifications_created": total_created,
            "notifications_skipped_duplicate": total_skipped,
            "resolved_notifications": total_resolved,
            "details": details,
        }


monitoring_engine = MonitoringEngine()
