"""
Delivery provider architecture for VaxAssist AI notifications.
Decouples core monitoring & reminder logic from transport channels (In-App, Email, SMS).
Integrates real Brevo Transactional Email and SMS delivery with dynamic templates and safety checks.
"""
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from app.config import settings
from app.models.notification import NotificationChannel
from app.services.brevo_service import (
    brevo_service,
    build_vaccination_reminder_email,
    build_vaccination_reminder_sms,
    format_e164_phone,
)

logger = logging.getLogger("vaxassist.notifications.delivery")


class BaseDeliveryProvider(ABC):
    """Abstract base class for notification delivery transports."""

    @abstractmethod
    async def send(self, notification: Dict[str, Any]) -> bool:
        """
        Dispatches the notification.
        Returns True if delivered or successfully accepted by gateway, False otherwise.
        """
        pass


class InAppDeliveryProvider(BaseDeliveryProvider):
    """
    In-App delivery provider:
    In-app notifications are stored directly in MongoDB for web/app retrieval.
    """

    async def send(self, notification: Dict[str, Any]) -> bool:
        # In-app notifications are persisted in the database; always succeeds
        return True


class EmailDeliveryProvider(BaseDeliveryProvider):
    """
    Transactional Email provider powered by Brevo.
    Falls back gracefully to SMTP or simulated dev mode when unconfigured.
    """

    def __init__(self):
        self.enabled = settings.BREVO_EMAIL_ENABLED or settings.EMAIL_NOTIFICATIONS_ENABLED
        self.smtp_host = settings.SMTP_HOST

    async def send(self, notification: Dict[str, Any]) -> bool:
        metadata = notification.get("metadata") or {}
        user_id = notification.get("user_id")

        # 1. Resolve recipient email address
        recipient_email = metadata.get("email") or notification.get("email")
        if not recipient_email and metadata.get("recipient") and "@" in str(metadata.get("recipient")):
            recipient_email = str(metadata["recipient"])

        if not recipient_email and user_id:
            try:
                from app.services.user_service import user_service
                u_doc = await user_service.get_by_id(user_id)
                if u_doc:
                    recipient_email = u_doc.get("email")
            except Exception as e:
                logger.debug(f"Could not load user doc for email recipient: {e}")

        title = notification.get("title", "Vaccination Alert")

        if not recipient_email:
            logger.warning(f"[EmailDeliveryProvider] Cannot send email: recipient address missing for user {user_id}")
            return False

        # 2. Extract dynamic template attributes
        recipient_name = metadata.get("recipient_name") or notification.get("member_name") or "Parent / Guardian"
        member_name = notification.get("member_name")
        vaccine_name = notification.get("vaccine_name") or notification.get("vaccine_code", "Vaccine")
        dose_num = notification.get("dose_number")
        dose_name = notification.get("dose_name") or (f"Dose {dose_num}" if dose_num else "Routine Dose")
        due_date_str = str(notification.get("due_date") or "Upcoming Milestone")
        status_label = notification.get("vaccination_status") or notification.get("type", "DUE")

        # 3. Build customized VaxAssist AI responsive email template
        subject, html_content = build_vaccination_reminder_email(
            recipient_name=recipient_name,
            member_name=member_name,
            vaccine_name=vaccine_name,
            dose_name=dose_name,
            due_date_str=due_date_str,
            vaccination_status=str(status_label),
        )

        # 4. Dispatch via Brevo Service
        template_id = settings.BREVO_EMAIL_TEMPLATE_ID
        params = None
        if template_id:
            params = {
                "RECIPIENT_NAME": recipient_name,
                "MEMBER_NAME": member_name or recipient_name,
                "VACCINE_NAME": vaccine_name,
                "DOSE_NAME": dose_name,
                "DUE_DATE": due_date_str,
                "STATUS": str(status_label),
            }

        res = await brevo_service.send_email(
            recipient_email=recipient_email,
            recipient_name=recipient_name,
            subject=subject,
            html_content=html_content,
            template_id=template_id,
            params=params,
            tags=["vaxassist_reminder"],
        )

        success = res.get("success", False)
        if success:
            logger.info(f"[EmailDeliveryProvider] Email accepted for '{recipient_email}' (Message ID: {res.get('message_id')})")
        else:
            logger.warning(f"[EmailDeliveryProvider] Email dispatch failed for '{recipient_email}': {res.get('error')}")

        return success


class SMSDeliveryProvider(BaseDeliveryProvider):
    """
    Transactional SMS delivery provider powered by Brevo.
    Validates Indian/international phone numbers into E.164 without symbols.
    """

    def __init__(self):
        self.enabled = settings.BREVO_SMS_ENABLED

    async def send(self, notification: Dict[str, Any]) -> bool:
        metadata = notification.get("metadata") or {}
        user_id = notification.get("user_id")

        # 1. Resolve recipient phone number
        recipient_phone = metadata.get("phone") or notification.get("phone")
        if not recipient_phone and metadata.get("recipient") and not "@" in str(metadata.get("recipient")):
            recipient_phone = str(metadata["recipient"])

        if not recipient_phone and user_id:
            try:
                from app.services.notification_service import notification_service
                prefs = await notification_service.get_preferences(user_id)
                recipient_phone = prefs.get("phone_number")
                if not recipient_phone:
                    from app.services.user_service import user_service
                    u_doc = await user_service.get_by_id(user_id)
                    if u_doc:
                        recipient_phone = u_doc.get("phone_number")
            except Exception as e:
                logger.debug(f"Could not load phone number for user {user_id}: {e}")

        if not recipient_phone:
            logger.warning(f"[SMSDeliveryProvider] Cannot send SMS: phone number missing for user {user_id}")
            return False

        # 2. Extract dynamic template parameters
        recipient_name = metadata.get("recipient_name") or "Parent"
        member_name = notification.get("member_name")
        vaccine_name = notification.get("vaccine_name") or notification.get("vaccine_code", "Vaccine")
        dose_num = notification.get("dose_number")
        dose_name = notification.get("dose_name") or (f"Dose {dose_num}" if dose_num else None)
        due_date_str = str(notification.get("due_date") or "soon")

        # 3. Build concise SMS text (<= 160 characters)
        sms_content = build_vaccination_reminder_sms(
            recipient_name=recipient_name,
            member_name=member_name,
            vaccine_name=vaccine_name,
            dose_name=dose_name,
            due_date_str=due_date_str,
        )

        # 4. Dispatch via Brevo Service
        res = await brevo_service.send_sms(
            recipient_phone=recipient_phone,
            message_content=sms_content,
            sender_name=settings.BREVO_SMS_SENDER_NAME,
            tag="vaxassist_reminder",
        )

        success = res.get("success", False)
        if success:
            logger.info(f"[SMSDeliveryProvider] SMS accepted for '{res.get('recipient')}' (Ref: {res.get('reference')})")
        else:
            logger.warning(f"[SMSDeliveryProvider] SMS dispatch failed for '{recipient_phone}': {res.get('error')}")

        return success


class NotificationDispatcher:
    """
    Routes notifications to registered channel providers according to preferences.
    """

    def __init__(self):
        self._providers: Dict[NotificationChannel, BaseDeliveryProvider] = {
            NotificationChannel.IN_APP: InAppDeliveryProvider(),
            NotificationChannel.EMAIL: EmailDeliveryProvider(),
            NotificationChannel.SMS: SMSDeliveryProvider(),
        }

    def register_provider(self, channel: NotificationChannel, provider: BaseDeliveryProvider):
        """Allows registering custom or mock providers for testing or production."""
        self._providers[channel] = provider

    async def dispatch(self, notification: Dict[str, Any]) -> Dict[str, bool]:
        """
        Dispatches notification to its designated channel or multiple channels.
        """
        channel = notification.get("channel", NotificationChannel.IN_APP)
        if isinstance(channel, str):
            try:
                channel = NotificationChannel(channel)
            except ValueError:
                channel = NotificationChannel.IN_APP

        provider = self._providers.get(channel)
        if not provider:
            logger.warning(f"No delivery provider registered for channel {channel}")
            return {str(channel): False}

        success = await provider.send(notification)
        return {str(channel): success}


notification_dispatcher = NotificationDispatcher()
