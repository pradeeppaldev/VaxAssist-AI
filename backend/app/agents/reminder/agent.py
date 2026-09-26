"""
Reminder Agent Implementation (Phase 8 - Agent 2 of 5).
Authoritative, multi-channel reminder composition and dispatch agent.
Consumes structured ActionableMonitoringEvents from Monitoring Agent,
evaluates notification preferences, quiet hours, and idempotency,
and dispatches through existing notification infrastructure.
"""
from typing import Optional, List, Dict, Any, Tuple
from datetime import date, datetime, time, timedelta, timezone
import logging
from dateutil import tz

from app.agents.base import BaseAgent
from app.agents.monitoring import monitoring_agent, MonitoringAgentInput
from app.agents.monitoring.schemas import ActionableMonitoringEvent
from app.agents.reminder.schemas import (
    ReminderAgentInput,
    ReminderAgentResult,
    DispatchedReminderItem,
    ReminderStatus,
)
from app.models.notification import (
    NotificationChannel,
    NotificationType,
    NotificationPriority,
)
from app.models.user import UserRole
from app.services.notification_service import notification_service
from app.services.user_service import user_service

logger = logging.getLogger("vaxassist.agents.reminder")


class ReminderAgent(BaseAgent):
    """
    Reminder Agent:
    - Consumes ActionableMonitoringEvents from Monitoring Agent
    - Validates and normalizes incoming events
    - Determines reminder eligibility (skips completed, not-ready, invalid)
    - Enforces user preferences (channels, lead times, opt-ins)
    - Respects user quiet-hour windows and local timezones
    - Guarantees strict idempotency via deterministic deduplication keys
    - Dispatches through existing notification service and delivery providers
    - Produces structured dispatch summaries for Multi-Agent Orchestrator
    """

    def __init__(self):
        super().__init__(
            agent_id="agent_reminder_v1",
            name="Reminder Agent",
            description="Multi-Channel Intelligent Reminder Dispatcher",
            version="1.0.0",
        )

    def _validate_access(
        self,
        target_user_id: str,
        caller_user_id: Optional[str],
        caller_role: Optional[str],
    ) -> None:
        """Enforces tenant isolation and role-based access restrictions."""
        if not caller_user_id:
            return  # System or internal invocation

        if caller_role == UserRole.PATIENT.value or caller_role == "PATIENT":
            if caller_user_id != target_user_id:
                raise PermissionError(
                    f"Access Denied: Patient {caller_user_id} cannot dispatch reminders for user {target_user_id}."
                )

    def _parse_time_string(self, time_str: str, default: time) -> time:
        """Safely parses HH:MM time string."""
        if not time_str or not isinstance(time_str, str):
            return default
        try:
            parts = time_str.strip().split(":")
            return time(int(parts[0]), int(parts[1]))
        except (ValueError, IndexError):
            return default

    def _evaluate_quiet_hours(
        self,
        current_dt: datetime,
        prefs: Dict[str, Any],
    ) -> Tuple[bool, Optional[datetime]]:
        """
        Determines if current time falls within user quiet hours.
        Returns (in_quiet_hours: bool, next_eligible_dispatch_time_utc: Optional[datetime]).
        Handles midnight-crossing windows (e.g. 22:00 to 08:00) and timezones accurately.
        """
        if not prefs.get("quiet_hours_enabled", False):
            return False, None

        tz_name = prefs.get("timezone") or "UTC"
        target_tz = tz.gettz(tz_name) or timezone.utc

        # Get local time in user's timezone
        now_local = current_dt.astimezone(target_tz)

        start_time = self._parse_time_string(prefs.get("quiet_hours_start", "22:00"), time(22, 0))
        end_time = self._parse_time_string(prefs.get("quiet_hours_end", "08:00"), time(8, 0))

        cur_t = now_local.time()

        if start_time > end_time:
            # Crosses midnight, e.g. 22:00 to 08:00
            in_quiet_hours = cur_t >= start_time or cur_t < end_time
            if not in_quiet_hours:
                return False, None
            # If after midnight (< end_time), end is today. If before midnight (>= start_time), end is tomorrow.
            target_date = now_local.date() if cur_t < end_time else now_local.date() + timedelta(days=1)
        else:
            # Same day window, e.g. 13:00 to 15:00
            in_quiet_hours = start_time <= cur_t < end_time
            if not in_quiet_hours:
                return False, None
            target_date = now_local.date()

        next_local = datetime.combine(target_date, end_time, tzinfo=target_tz)
        next_utc = next_local.astimezone(timezone.utc)
        return True, next_utc

    def _determine_active_channels(
        self,
        prefs: Dict[str, Any],
        channels_override: Optional[List[NotificationChannel]],
    ) -> List[NotificationChannel]:
        """Determines active, permitted delivery channels based on user preferences."""
        if "channels_enabled" in prefs and prefs["channels_enabled"] is not None:
            raw_channels = prefs["channels_enabled"]
        else:
            raw_channels = [NotificationChannel.IN_APP]

        enabled_channels: List[NotificationChannel] = []

        for ch in raw_channels:
            val = ch.value if hasattr(ch, "value") else str(ch)
            if val == NotificationChannel.IN_APP.value:
                enabled_channels.append(NotificationChannel.IN_APP)
            elif val == NotificationChannel.EMAIL.value and prefs.get("email_enabled", True):
                enabled_channels.append(NotificationChannel.EMAIL)
            elif val == NotificationChannel.SMS.value and prefs.get("sms_enabled", False):
                enabled_channels.append(NotificationChannel.SMS)

        if channels_override:
            # Filter to explicitly requested override channels that are also permitted
            override_vals = [c.value if hasattr(c, "value") else str(c) for c in channels_override]
            enabled_channels = [c for c in enabled_channels if c.value in override_vals]

        return enabled_channels

    def _prepare_notification_content(self, event: ActionableMonitoringEvent) -> Tuple[str, str, NotificationType]:
        """
        Formats clear, neutral, clinical notification title and message.
        Zero diagnostic claims. Zero medical advice.
        """
        v_name = event.vaccine_name
        dose_label = event.dose_name or f"Dose {event.dose_number}"
        member_name = event.member_name
        due_str = event.calculated_due_date.strftime("%b %d, %Y")

        evt_type_str = str(event.event_type).upper()

        if "OVERDUE" in evt_type_str:
            title = f"Vaccination Overdue: {v_name}"
            days = event.days_overdue or 0
            message = (
                f"{v_name} ({dose_label}) for {member_name} is overdue by {days} days "
                f"(was due on {due_str}). Please contact your healthcare provider to arrange administration."
            )
            notif_type = NotificationType.OVERDUE_ALERT

        elif "DUE" in evt_type_str:
            title = f"Vaccination Due: {v_name}"
            message = (
                f"{v_name} ({dose_label}) is currently due for {member_name} (target date: {due_str}). "
                f"Please schedule an immunization visit with your healthcare provider."
            )
            notif_type = NotificationType.DUE_ALERT

        elif "MISSED" in evt_type_str:
            title = f"Vaccination Window Expired: {v_name}"
            message = (
                f"The routine administration window for {v_name} ({dose_label}) has expired for {member_name}. "
                f"Consult your pediatrician for subsequent protection options."
            )
            notif_type = NotificationType.MISSED_ALERT

        elif "CATCH_UP" in evt_type_str:
            title = f"Catch-Up Protocol Required: {v_name}"
            message = (
                f"{v_name} for {member_name} requires catch-up immunization. "
                f"Please consult your healthcare provider to initiate the catch-up protocol."
            )
            notif_type = NotificationType.CATCH_UP_ALERT

        elif "CLINICAL_REVIEW" in evt_type_str:
            title = f"Clinical Evaluation Recommended: {v_name}"
            message = (
                f"Vaccination review recommended for {member_name} regarding {v_name}. "
                f"Please schedule a consultation with your pediatrician or healthcare professional."
            )
            notif_type = NotificationType.CLINICAL_REVIEW_ALERT

        else:
            # Routine UPCOMING reminder
            title = f"Upcoming Vaccination: {v_name}"
            days = event.days_until_due
            days_text = "today" if days == 0 else f"in {days} day{'s' if days != 1 else ''}"
            message = (
                f"{member_name} is scheduled for {v_name} ({dose_label}) on {due_str}. "
                f"Due {days_text}."
            )
            notif_type = NotificationType.REMINDER

        return title, message, notif_type

    async def execute(
        self,
        input_data: Optional[ReminderAgentInput] = None,
        **kwargs: Any,
    ) -> ReminderAgentResult:
        """
        Executes Reminder Agent workflow:
        1. Validates caller authorization
        2. Retrieves user preferences & quiet hours
        3. Retrieves or validates actionable monitoring events
        4. Evaluates eligibility, quiet-hour deferrals, and preferences
        5. Formulates neutral clinical messages
        6. Dispatches across active channels with atomic duplicate prevention
        7. Returns structured ReminderAgentResult
        """
        if input_data is None:
            input_data = ReminderAgentInput(**kwargs)

        target_user_id = input_data.user_id
        caller_user_id = input_data.caller_user_id
        caller_role = input_data.caller_role
        correlation_id = input_data.correlation_id
        dry_run = input_data.dry_run

        # 1. Enforce tenant isolation & RBAC
        self._validate_access(
            target_user_id=target_user_id,
            caller_user_id=caller_user_id,
            caller_role=caller_role,
        )

        # 2. Retrieve user notification preferences
        fixture_prefs = kwargs.get("preferences_fixture")
        if fixture_prefs is not None:
            prefs = fixture_prefs
        else:
            try:
                prefs = await notification_service.get_preferences(target_user_id)
            except Exception as e:
                logger.error(f"Failed to fetch preferences for user {target_user_id}: {e}")
                # Safe fallback default: in-app only, quiet hours disabled
                prefs = {
                    "channels_enabled": [NotificationChannel.IN_APP],
                    "reminder_lead_days": [14, 7, 3, 1],
                    "email_enabled": True,
                    "sms_enabled": False,
                    "quiet_hours_enabled": False,
                }

        # 3. Determine active delivery channels
        active_channels = self._determine_active_channels(prefs, input_data.channels_override)

        # 4. Evaluate quiet hours
        ref_dt = datetime.now(timezone.utc)
        if input_data.reference_date:
            # Combine reference date with current UTC time
            ref_dt = datetime.combine(input_data.reference_date, datetime.now(timezone.utc).time(), tzinfo=timezone.utc)

        in_quiet_hours, next_eligible_dt = self._evaluate_quiet_hours(ref_dt, prefs)
        if input_data.force_dispatch_quiet_hours:
            in_quiet_hours = False
            next_eligible_dt = None

        # 5. Acquire actionable events
        events: List[ActionableMonitoringEvent] = []
        if input_data.events is not None:
            events = input_data.events
        else:
            # Internal service invocation of Monitoring Agent
            mon_input = MonitoringAgentInput(
                user_id=target_user_id,
                family_member_id=input_data.family_member_id,
                reference_date=input_data.reference_date,
                caller_user_id=caller_user_id,
                caller_role=caller_role,
                dispatch_notifications=False,  # Decoupled: Reminder Agent handles dispatch
            )
            mon_result = await monitoring_agent.execute(
                input_data=mon_input,
                members_fixture=kwargs.get("members_fixture"),
                records_fixture=kwargs.get("records_fixture"),
            )
            events = mon_result.actionable_events

        # 6. Process events
        dispatched_items: List[DispatchedReminderItem] = []
        deferred_items: List[DispatchedReminderItem] = []
        skipped_items: List[DispatchedReminderItem] = []

        channel_receipts: Dict[str, int] = {ch.value: 0 for ch in active_channels}

        total_eligible = 0
        total_skipped_dup = 0
        total_skipped_pref = 0
        total_skipped_not_ready = 0
        total_val_fail = 0
        total_prov_fail = 0

        # Retrieve user contact info if needed for Email/SMS
        user_contact = {
            "email": prefs.get("email_address"),
            "phone": prefs.get("phone_number"),
            "name": prefs.get("recipient_name"),
        }
        if not user_contact["email"] or not user_contact["name"]:
            if not kwargs.get("mock_user_contact"):
                try:
                    u_doc = await user_service.get_by_id(target_user_id)
                    if u_doc:
                        if not user_contact["email"]:
                            user_contact["email"] = u_doc.get("email")
                        if not user_contact["name"]:
                            user_contact["name"] = u_doc.get("full_name") or u_doc.get("name")
                        if not user_contact["phone"]:
                            user_contact["phone"] = u_doc.get("phone_number")
                except Exception:
                    pass
            elif kwargs.get("mock_user_contact"):
                user_contact.update(kwargs["mock_user_contact"])

        for evt in events:
            # --- Validation check ---
            if not evt.family_member_id or not evt.vaccine_code or not evt.event_id or not evt.dedup_key:
                total_val_fail += 1
                skipped_items.append(DispatchedReminderItem(
                    event_id=evt.event_id or "unknown_evt",
                    dedup_key=evt.dedup_key or "unknown_key",
                    status=ReminderStatus.FAILED_VALIDATION,
                    title="Invalid Event",
                    message="Missing mandatory event identifiers.",
                    skip_reason="Missing mandatory event identifiers (family_member_id, vaccine_code, event_id, dedup_key).",
                ))
                continue

            # --- Check completed vaccination ---
            if "COMPLETED" in str(evt.event_type).upper():
                skipped_items.append(DispatchedReminderItem(
                    event_id=evt.event_id,
                    dedup_key=evt.dedup_key,
                    status=ReminderStatus.SKIPPED_COMPLETED,
                    family_member_id=evt.family_member_id,
                    member_name=evt.member_name,
                    vaccine_code=evt.vaccine_code,
                    vaccine_name=evt.vaccine_name,
                    dose_number=evt.dose_number,
                    dose_name=evt.dose_name,
                    title=evt.title,
                    message=evt.message,
                    skip_reason="Vaccination dose already completed.",
                ))
                continue

            # --- Check ready_for_reminder flag ---
            if not evt.ready_for_reminder:
                total_skipped_not_ready += 1
                skipped_items.append(DispatchedReminderItem(
                    event_id=evt.event_id,
                    dedup_key=evt.dedup_key,
                    status=ReminderStatus.SKIPPED_NOT_READY,
                    family_member_id=evt.family_member_id,
                    member_name=evt.member_name,
                    vaccine_code=evt.vaccine_code,
                    vaccine_name=evt.vaccine_name,
                    dose_number=evt.dose_number,
                    dose_name=evt.dose_name,
                    title=evt.title,
                    message=evt.message,
                    skip_reason="Event not marked ready for reminder (outside lead-time notification window).",
                ))
                continue

            # --- Check if all channels disabled ---
            if not active_channels:
                total_skipped_pref += 1
                skipped_items.append(DispatchedReminderItem(
                    event_id=evt.event_id,
                    dedup_key=evt.dedup_key,
                    status=ReminderStatus.SKIPPED_PREFERENCE,
                    family_member_id=evt.family_member_id,
                    member_name=evt.member_name,
                    vaccine_code=evt.vaccine_code,
                    vaccine_name=evt.vaccine_name,
                    dose_number=evt.dose_number,
                    dose_name=evt.dose_name,
                    title=evt.title,
                    message=evt.message,
                    skip_reason="All notification delivery channels disabled in user preferences.",
                ))
                continue

            total_eligible += 1
            title, message, notif_type = self._prepare_notification_content(evt)

            # --- Check quiet hours deferral ---
            # Routine reminders are deferred during quiet hours
            if in_quiet_hours:
                deferred_items.append(DispatchedReminderItem(
                    event_id=evt.event_id,
                    dedup_key=evt.dedup_key,
                    status=ReminderStatus.PENDING_QUIET_HOURS,
                    family_member_id=evt.family_member_id,
                    member_name=evt.member_name,
                    vaccine_code=evt.vaccine_code,
                    vaccine_name=evt.vaccine_name,
                    dose_number=evt.dose_number,
                    dose_name=evt.dose_name,
                    title=title,
                    message=message,
                    priority=evt.priority,
                    scheduled_for=next_eligible_dt,
                    next_eligible_dispatch_time=next_eligible_dt,
                    skip_reason=f"Deferred due to quiet hours until {next_eligible_dt.isoformat() if next_eligible_dt else 'morning'}",
                ))
                continue

            # --- Dispatch across active channels ---
            for ch in active_channels:
                ch_dedup_key = evt.dedup_key if ch == NotificationChannel.IN_APP else f"{evt.dedup_key}:{ch.value}"
                recipient_val = None
                if ch == NotificationChannel.EMAIL:
                    recipient_val = user_contact.get("email")
                elif ch == NotificationChannel.SMS:
                    recipient_val = user_contact.get("phone")

                # Dry-run handling
                if dry_run:
                    dispatched_items.append(DispatchedReminderItem(
                        event_id=evt.event_id,
                        dedup_key=ch_dedup_key,
                        notification_id=f"dry_run_{evt.event_id}",
                        channel=ch,
                        recipient=recipient_val,
                        status=ReminderStatus.DISPATCHED,
                        family_member_id=evt.family_member_id,
                        member_name=evt.member_name,
                        vaccine_code=evt.vaccine_code,
                        vaccine_name=evt.vaccine_name,
                        dose_number=evt.dose_number,
                        dose_name=evt.dose_name,
                        title=title,
                        message=message,
                        priority=evt.priority,
                        sent_at=ref_dt,
                        metadata={"dry_run": True, "event_type": notif_type.value},
                    ))
                    channel_receipts[ch.value] = channel_receipts.get(ch.value, 0) + 1
                    continue

                # Live dispatch via notification_service with atomic deduplication
                try:
                    notif_doc, was_created = await notification_service.create_notification(
                        user_id=target_user_id,
                        family_member_id=evt.family_member_id,
                        member_name=evt.member_name,
                        vaccine_code=evt.vaccine_code,
                        vaccine_name=evt.vaccine_name,
                        dose_number=evt.dose_number,
                        dose_name=evt.dose_name,
                        due_date=evt.calculated_due_date,
                        vaccination_status=evt.event_type,
                        title=title,
                        message=message,
                        channel=ch,
                        notif_type=notif_type,
                        priority=evt.priority,
                        dedup_key=ch_dedup_key,
                        metadata={
                            "correlation_id": correlation_id,
                            "rule_code": evt.vaccine_code,
                            "recipient": recipient_val,
                            "email": user_contact.get("email"),
                            "phone": user_contact.get("phone"),
                            "recipient_name": user_contact.get("name"),
                        },
                    )

                    if was_created:
                        dispatched_items.append(DispatchedReminderItem(
                            event_id=evt.event_id,
                            dedup_key=ch_dedup_key,
                            notification_id=str(notif_doc.get("id") or notif_doc.get("_id") or ""),
                            channel=ch,
                            recipient=recipient_val,
                            status=ReminderStatus.DISPATCHED,
                            family_member_id=evt.family_member_id,
                            member_name=evt.member_name,
                            vaccine_code=evt.vaccine_code,
                            vaccine_name=evt.vaccine_name,
                            dose_number=evt.dose_number,
                            dose_name=evt.dose_name,
                            title=title,
                            message=message,
                            priority=evt.priority,
                            sent_at=ref_dt,
                        ))
                        channel_receipts[ch.value] = channel_receipts.get(ch.value, 0) + 1
                    else:
                        total_skipped_dup += 1
                        skipped_items.append(DispatchedReminderItem(
                            event_id=evt.event_id,
                            dedup_key=ch_dedup_key,
                            notification_id=str(notif_doc.get("id") or notif_doc.get("_id") or ""),
                            channel=ch,
                            status=ReminderStatus.SKIPPED_DUPLICATE,
                            family_member_id=evt.family_member_id,
                            member_name=evt.member_name,
                            vaccine_code=evt.vaccine_code,
                            vaccine_name=evt.vaccine_name,
                            dose_number=evt.dose_number,
                            dose_name=evt.dose_name,
                            title=title,
                            message=message,
                            skip_reason="Duplicate notification already exists for this reminder window.",
                        ))
                except Exception as exc:
                    total_prov_fail += 1
                    logger.error(f"Provider dispatch error for event {evt.event_id} on {ch.value}: {exc}")
                    skipped_items.append(DispatchedReminderItem(
                        event_id=evt.event_id,
                        dedup_key=ch_dedup_key,
                        channel=ch,
                        status=ReminderStatus.FAILED_PROVIDER,
                        family_member_id=evt.family_member_id,
                        member_name=evt.member_name,
                        vaccine_code=evt.vaccine_code,
                        vaccine_name=evt.vaccine_name,
                        dose_number=evt.dose_number,
                        dose_name=evt.dose_name,
                        title=title,
                        message=message,
                        error_message=str(exc),
                    ))

        return ReminderAgentResult(
            agent_id=self.agent_id,
            timestamp=datetime.utcnow(),
            correlation_id=correlation_id,
            user_id=target_user_id,
            dry_run=dry_run,
            total_events_received=len(events),
            total_eligible=total_eligible,
            total_dispatched=len(dispatched_items),
            total_deferred_quiet_hours=len(deferred_items),
            total_skipped_duplicate=total_skipped_dup,
            total_skipped_preference=total_skipped_pref,
            total_skipped_not_ready=total_skipped_not_ready,
            total_validation_failures=total_val_fail,
            total_provider_failures=total_prov_fail,
            channel_delivery_receipts=channel_receipts,
            dispatched_reminders=dispatched_items,
            deferred_reminders=deferred_items,
            skipped_reminders=skipped_items,
        )


reminder_agent = ReminderAgent()
