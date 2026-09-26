"""
Brevo Transactional Email & SMS Integration Service for VaxAssist AI.
Implements real delivery of customized, mobile-friendly vaccination reminders via the official Brevo SDK.
Includes phone validation (Indian E.164 without symbols), branded HTML/text templates,
dynamic payload escaping, error containment, and delivery status tracking.
"""
import re
import html
import logging
import uuid
from typing import Optional, Dict, Any, Tuple, List
from datetime import datetime, date

from app.config import settings

logger = logging.getLogger("vaxassist.services.brevo")

# Clinical Healthcare Disclaimer attached to all VaxAssist AI notifications
HEALTHCARE_DISCLAIMER_TEXT = (
    "Disclaimer: This notification is an informational reminder from VaxAssist AI based on your recorded "
    "National Immunization Schedule (UIP/NIS) data. It does not substitute for certified clinical advice, "
    "physical examination, or professional consultation with a qualified pediatrician. Please consult your "
    "healthcare provider to confirm immunization eligibility and schedule."
)


def format_e164_phone(phone: Optional[str], default_country_code: str = "91") -> Tuple[Optional[str], Optional[str]]:
    """
    Cleans and converts phone numbers to E.164 without symbols (e.g. 919876543210 or 14155552671).
    Validates Indian 10-digit mobile numbers (starting with 6, 7, 8, or 9).
    Also supports numbers already prefixed with +91, 91, or international codes.
    Returns (cleaned_digits, error_message).
    """
    if not phone or not isinstance(phone, str):
        return None, "Phone number is empty or missing."

    # Strip all non-digit characters (+, spaces, dashes, brackets)
    digits = re.sub(r"\D", "", phone.strip())
    if not digits:
        return None, "Phone number contains no valid digits."

    # 1. 10-digit Indian mobile number
    if len(digits) == 10:
        if digits[0] in "6789":
            return f"{default_country_code}{digits}", None
        return None, f"Invalid 10-digit Indian phone number: mobile numbers must start with 6, 7, 8, or 9 (got '{digits}')."

    # 2. 11-digit number starting with 0 (e.g. 09876543210)
    if len(digits) == 11 and digits.startswith("0") and digits[1] in "6789":
        return f"{default_country_code}{digits[1:]}", None

    # 3. 12-digit Indian number with 91 country code (e.g. 919876543210)
    if len(digits) == 12 and digits.startswith("91") and digits[2] in "6789":
        return digits, None

    # 4. Standard international numbers (10 to 15 digits according to ITU-T E.164 standard)
    if 10 <= len(digits) <= 15:
        return digits, None

    return None, f"Invalid phone number length ({len(digits)} digits). Must be between 10 and 15 digits."


def build_vaccination_reminder_email(
    recipient_name: Optional[str] = None,
    member_name: Optional[str] = None,
    vaccine_name: Optional[str] = None,
    dose_name: Optional[str] = None,
    due_date_str: Optional[str] = None,
    vaccination_status: Optional[str] = None,
    portal_url: Optional[str] = None,
) -> Tuple[str, str]:
    """
    Constructs a professional, mobile-friendly responsive HTML email with VaxAssist AI branding.
    Safely escapes all dynamic parameters to eliminate HTML injection risks.
    Returns (subject, html_content).
    """
    rec_name_clean = html.escape((recipient_name or "Parent / Guardian").strip())
    mem_name_clean = html.escape((member_name or rec_name_clean).strip())
    vac_name_clean = html.escape((vaccine_name or "Scheduled Vaccination").strip())
    dose_clean = html.escape((dose_name or "Routine Dose").strip())
    due_clean = html.escape((due_date_str or "Upcoming Milestone").strip())
    status_clean = html.escape((vaccination_status or "DUE").replace("_", " ").upper())
    base_url = (portal_url or "http://localhost:5173").rstrip("/")

    # Dynamic status badge color
    status_upper = status_clean.upper()
    if "OVERDUE" in status_upper or "MISSED" in status_upper:
        badge_bg = "#FEE2E2"
        badge_color = "#DC2626"
        badge_border = "#FCA5A5"
        headline = "Vaccination Overdue Alert"
    elif "DUE" in status_upper:
        badge_bg = "#FEF3C7"
        badge_color = "#D97706"
        badge_border = "#FCD34D"
        headline = "Vaccination Due Reminder"
    else:
        badge_bg = "#DBEAFE"
        badge_color = "#2563EB"
        badge_border = "#93C5FD"
        headline = "Upcoming Vaccination Reminder"

    # Subject line
    if mem_name_clean and mem_name_clean != rec_name_clean:
        subject = f"[VaxAssist AI] {headline}: {vac_name_clean} for {mem_name_clean}"
    else:
        subject = f"[VaxAssist AI] {headline}: {vac_name_clean}"

    # HTML Body
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #F1F5F9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      -webkit-font-smoothing: antialiased;
    }}
    table {{
      border-collapse: collapse;
    }}
    .email-container {{
      max-width: 600px;
      margin: 20px auto;
      background-color: #FFFFFF;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border: 1px solid #E2E8F0;
    }}
    .header-banner {{
      background: linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%);
      padding: 24px 28px;
      text-align: left;
      border-bottom: 3px solid #0D9488;
    }}
    .header-title {{
      color: #FFFFFF;
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 4px 0;
      letter-spacing: -0.02em;
    }}
    .header-sub {{
      color: #94A3B8;
      font-size: 12px;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}
    .content-body {{
      padding: 28px 28px 20px 28px;
    }}
    .greeting {{
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #0F172A;
    }}
    .message-intro {{
      font-size: 14px;
      line-height: 1.6;
      color: #334155;
      margin-bottom: 20px;
    }}
    .details-box {{
      background-color: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }}
    .detail-row {{
      padding: 6px 0;
      border-bottom: 1px solid #EDF2F7;
      font-size: 13px;
    }}
    .detail-row:last-child {{
      border-bottom: none;
    }}
    .detail-label {{
      font-weight: 600;
      color: #64748B;
      width: 140px;
      display: inline-block;
    }}
    .detail-value {{
      font-weight: 500;
      color: #0F172A;
    }}
    .badge {{
      display: inline-block;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 4px;
      background-color: {badge_bg};
      color: {badge_color};
      border: 1px solid {badge_border};
      text-transform: uppercase;
    }}
    .cta-container {{
      text-align: center;
      margin: 28px 0;
    }}
    .cta-button {{
      background-color: #0D9488;
      color: #FFFFFF !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 12px 28px;
      border-radius: 6px;
      display: inline-block;
      letter-spacing: 0.01em;
    }}
    .advice-box {{
      background-color: #F0FDF4;
      border-left: 4px solid #16A34A;
      padding: 12px 16px;
      border-radius: 4px;
      margin-bottom: 24px;
      font-size: 12.5px;
      line-height: 1.5;
      color: #166534;
    }}
    .disclaimer-box {{
      border-top: 1px solid #E2E8F0;
      padding: 16px 28px;
      background-color: #F8FAFC;
      font-size: 11px;
      line-height: 1.5;
      color: #64748B;
      font-style: italic;
    }}
    .footer {{
      padding: 16px 28px;
      text-align: center;
      font-size: 11px;
      color: #94A3B8;
      border-top: 1px solid #E2E8F0;
      background-color: #FFFFFF;
    }}
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header-banner">
      <h1 class="header-title">VaxAssist AI</h1>
      <p class="header-sub">Digital Vaccination Tracking & National Immunization Schedule</p>
    </div>

    <div class="content-body">
      <div class="greeting">Dear {rec_name_clean},</div>
      <p class="message-intro">
        This is an automated immunization alert regarding the scheduled vaccination for <strong>{mem_name_clean}</strong>.
        Timely immunization ensures continuous protection against preventable infectious diseases.
      </p>

      <div class="details-box">
        <div class="detail-row">
          <span class="detail-label">Patient Name:</span>
          <span class="detail-value"><strong>{mem_name_clean}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Vaccine / Antigen:</span>
          <span class="detail-value">{vac_name_clean}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Dose Milestone:</span>
          <span class="detail-value">{dose_clean}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Scheduled Due Date:</span>
          <span class="detail-value">{due_clean}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Current Status:</span>
          <span class="detail-value"><span class="badge">{status_clean}</span></span>
        </div>
      </div>

      <div class="advice-box">
        <strong>Next Steps:</strong> Please schedule an appointment with your qualified pediatrician or visit your nearest primary health center. Remember to carry your child's immunization record card for verification.
      </div>

      <div class="cta-container">
        <a href="{base_url}/dashboard" class="cta-button" target="_blank">View Official Vaccination Schedule &rarr;</a>
      </div>
    </div>

    <div class="disclaimer-box">
      <strong>Medical Disclaimer:</strong> {html.escape(HEALTHCARE_DISCLAIMER_TEXT)}
    </div>

    <div class="footer">
      &copy; 2026 VaxAssist AI • Digital Immunization Tracking Platform<br>
      MoHFW UIP/NIS Deterministic Schedule Compliance
    </div>
  </div>
</body>
</html>"""
    return subject, html_content


def build_vaccination_reminder_sms(
    recipient_name: Optional[str] = None,
    member_name: Optional[str] = None,
    vaccine_name: Optional[str] = None,
    dose_name: Optional[str] = None,
    due_date_str: Optional[str] = None,
) -> str:
    """
    Constructs a concise, professional SMS reminder fitting within practical SMS limits (<= 160 characters).
    Avoids unnecessary sensitive medical details while delivering unambiguous clinical guidance.
    """
    mem = (member_name or recipient_name or "Patient").strip()
    vac = (vaccine_name or "Vaccine").strip()
    due = (due_date_str or "soon").strip()

    # Shorten dose label if present
    dose_tag = f" ({dose_name})" if dose_name and len(dose_name) <= 10 else ""

    # Primary concise format
    sms_text = f"VaxAssist AI: Reminder for {mem} - {vac}{dose_tag} is due on {due}. Please check your schedule at VaxAssist AI."

    # If exceeding 160 chars, trim gracefully
    if len(sms_text) > 160:
        sms_text = f"VaxAssist AI: Reminder for {mem} - {vac} is due on {due}. Please check your schedule at VaxAssist AI."

    if len(sms_text) > 160:
        sms_text = f"VaxAssist: {mem}'s {vac} is due {due}. View schedule at VaxAssist AI."

    return sms_text


class BrevoService:
    """
    Service managing Brevo Transactional Email & SMS operations.
    Handles authentication, SDK interactions, templating, fallback logging,
    and safe delivery reporting.
    """

    def __init__(self):
        self._client = None
        self._init_client()

    def _init_client(self):
        """Initializes the official Brevo SDK client if API key is configured."""
        api_key = (settings.BREVO_API_KEY or "").strip()
        if api_key:
            try:
                from brevo import Brevo
                self._client = Brevo(api_key=api_key)
                logger.info("Brevo SDK client initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Brevo SDK: {e}")
                self._client = None
        else:
            self._client = None
            logger.info("Brevo API key not set. BrevoService operating in simulated dev mode.")

    @property
    def is_configured(self) -> bool:
        """Returns True if Brevo SDK client is initialized with an API key."""
        return self._client is not None

    async def send_email(
        self,
        recipient_email: str,
        recipient_name: Optional[str] = None,
        subject: Optional[str] = None,
        html_content: Optional[str] = None,
        template_id: Optional[int] = None,
        params: Optional[Dict[str, Any]] = None,
        sender_email: Optional[str] = None,
        sender_name: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Sends a transactional email via Brevo.
        Supports inline HTML and Brevo template IDs with dynamic parameter mapping.
        """
        sender_email = sender_email or settings.BREVO_SENDER_EMAIL or "notifications@vaxassist.ai"
        sender_name = sender_name or settings.BREVO_SENDER_NAME or "VaxAssist AI"
        recipient_name = recipient_name or "Parent / Guardian"
        subject = subject or "VaxAssist AI Vaccination Reminder"
        template_id = template_id or settings.BREVO_EMAIL_TEMPLATE_ID

        # 1. Check if disabled or in unconfigured simulated dev mode
        if not settings.BREVO_EMAIL_ENABLED or not self.is_configured:
            sim_id = f"sim_email_{uuid.uuid4().hex[:12]}"
            logger.info(
                f"[Brevo:SimulatedEmail] Simulated email dispatch to '{recipient_email}' "
                f"(Subject: '{subject}', Message ID: {sim_id})"
            )
            return {
                "success": True,
                "simulated": True,
                "message_id": sim_id,
                "provider": "brevo",
                "recipient": recipient_email,
                "timestamp": datetime.utcnow().isoformat(),
            }

        # 2. Prepare payload and dispatch via Brevo SDK
        try:
            email_kwargs = {
                "sender": {"name": sender_name, "email": sender_email},
                "to": [{"email": recipient_email, "name": recipient_name}],
            }

            if template_id:
                email_kwargs["template_id"] = template_id
                if params:
                    email_kwargs["params"] = params
            else:
                email_kwargs["subject"] = subject
                email_kwargs["html_content"] = html_content or "<p>VaxAssist AI Vaccination Reminder</p>"

            if tags:
                email_kwargs["tags"] = tags

            response = self._client.transactional_emails.send_transac_email(**email_kwargs)
            msg_id = getattr(response, "message_id", None) or getattr(response, "message_ids", ["sent"])[0]

            logger.info(
                f"[Brevo:Email] Email accepted by Brevo for '{recipient_email}'. "
                f"Subject: '{subject}' | Message ID: {msg_id}"
            )
            return {
                "success": True,
                "simulated": False,
                "message_id": str(msg_id),
                "provider": "brevo",
                "recipient": recipient_email,
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as exc:
            status_code = getattr(exc, "status_code", 500)
            err_msg = str(exc)
            logger.error(
                f"[Brevo:Email:Error] Failed to send email to '{recipient_email}': "
                f"HTTP {status_code} - {err_msg}"
            )
            return {
                "success": False,
                "simulated": False,
                "error": err_msg,
                "status_code": status_code,
                "provider": "brevo",
                "recipient": recipient_email,
            }

    async def send_sms(
        self,
        recipient_phone: str,
        message_content: str,
        sender_name: Optional[str] = None,
        tag: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Sends a transactional SMS via Brevo.
        Validates and converts phone number to E.164 (without symbols) format.
        Enforces 11-character maximum for alphanumeric sender name.
        """
        # Validate and format recipient phone to E.164
        formatted_phone, phone_err = format_e164_phone(recipient_phone)
        if phone_err or not formatted_phone:
            logger.warning(f"[Brevo:SMS:ValidationFailed] Recipient phone rejected: {phone_err}")
            return {
                "success": False,
                "simulated": False,
                "error": f"Invalid phone format: {phone_err}",
                "provider": "brevo",
                "recipient": recipient_phone,
            }

        # Sender name: alphanumeric, max 11 chars
        sender = (sender_name or settings.BREVO_SMS_SENDER_NAME or "VaxAssist")[:11]

        # 1. Check if disabled or in unconfigured simulated dev mode
        if not settings.BREVO_SMS_ENABLED or not self.is_configured:
            sim_ref = f"sim_sms_{uuid.uuid4().hex[:12]}"
            logger.info(
                f"[Brevo:SimulatedSMS] Simulated SMS dispatch to '{formatted_phone}' "
                f"(Sender: '{sender}', Ref: {sim_ref}, Chars: {len(message_content)})"
            )
            return {
                "success": True,
                "simulated": True,
                "reference": sim_ref,
                "message_id": sim_ref,
                "provider": "brevo",
                "recipient": formatted_phone,
                "timestamp": datetime.utcnow().isoformat(),
            }

        # 2. Dispatch via Brevo SDK
        try:
            sms_kwargs = {
                "sender": sender,
                "recipient": formatted_phone,
                "content": message_content,
                "type": "transactional",
            }
            if tag:
                sms_kwargs["tag"] = tag[:50]

            response = self._client.transactional_sms.send_transac_sms(**sms_kwargs)
            ref = getattr(response, "reference", None) or getattr(response, "message_id", "sent")

            logger.info(
                f"[Brevo:SMS] Transactional SMS accepted by Brevo for '{formatted_phone}'. "
                f"Reference: {ref} | Remaining Credits: {getattr(response, 'remaining_credits', 'N/A')}"
            )
            return {
                "success": True,
                "simulated": False,
                "reference": str(ref),
                "message_id": str(getattr(response, "message_id", ref)),
                "remaining_credits": getattr(response, "remaining_credits", None),
                "provider": "brevo",
                "recipient": formatted_phone,
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as exc:
            status_code = getattr(exc, "status_code", 500)
            err_msg = str(exc)
            logger.error(
                f"[Brevo:SMS:Error] Failed to send SMS to '{formatted_phone}': "
                f"HTTP {status_code} - {err_msg}"
            )
            return {
                "success": False,
                "simulated": False,
                "error": err_msg,
                "status_code": status_code,
                "provider": "brevo",
                "recipient": formatted_phone,
            }


# Global singleton instance
brevo_service = BrevoService()
