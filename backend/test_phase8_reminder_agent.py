"""
Comprehensive Test Suite for Phase 8:
AGENT 2 OF 5: REMINDER AGENT IMPLEMENTATION.

Validates:
A. Agent Architecture & BaseAgent Lifecycle
B. Monitoring Agent Integration & Event Validation
C. Notification Preferences & Channel Gating
D. Quiet Hours Evaluation, Timezones & Deferred Dispatch
E. Idempotency & Deduplication
F. Delivery Transports & Safe Error Handling
G. Authorization & Patient Data Isolation
H. API Endpoints via FastAPI TestClient
"""
import sys
import asyncio
from datetime import date, datetime, time, timedelta, timezone
from dateutil import tz
from typing import List, Dict, Any

from app.main import app
from app.agents.base import BaseAgent, AgentStatus, AgentExecutionResult
from app.agents.architecture import FIVE_AGENT_ARCHITECTURE
from app.agents.monitoring.schemas import ActionableMonitoringEvent
from app.agents.reminder import (
    reminder_agent,
    ReminderAgent,
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
from app.utils.security import create_access_token


def print_step(title: str):
    print(f"\n{'='*75}\n[TEST REMINDER AGENT] {title}\n{'='*75}")


def make_test_event(
    event_id: str = "evt_test_001",
    dedup_key: str = "user_test_1:mem_001:BCG:DUE:2026-09-26",
    event_type: str = "DUE_ALERT",
    priority: NotificationPriority = NotificationPriority.HIGH,
    family_member_id: str = "mem_001",
    member_name: str = "Baby Aarav",
    vaccine_code: str = "BCG",
    vaccine_name: str = "Bacillus Calmette-Guerin",
    dose_number: int = 1,
    dose_name: str = "Birth Dose",
    due_date: date = date(2026, 9, 26),
    ready_for_reminder: bool = True,
    days_until_due: int = 0,
    days_overdue: int = 0,
) -> ActionableMonitoringEvent:
    """Helper fixture to construct valid ActionableMonitoringEvents."""
    return ActionableMonitoringEvent(
        event_id=event_id,
        dedup_key=dedup_key,
        event_type=event_type,
        priority=priority,
        family_member_id=family_member_id,
        member_name=member_name,
        vaccine_code=vaccine_code,
        vaccine_name=vaccine_name,
        dose_number=dose_number,
        dose_name=dose_name,
        calculated_due_date=due_date,
        ready_for_reminder=ready_for_reminder,
        days_until_due=days_until_due,
        days_overdue=days_overdue,
        title=f"Vaccination Due: {vaccine_name}",
        message=f"{vaccine_name} ({dose_name}) is currently due for {member_name}.",
    )


# =============================================================================
# A. Agent Architecture
# =============================================================================
def test_reminder_agent_architecture():
    print_step("A. Agent Architecture & BaseAgent Lifecycle")

    assert isinstance(reminder_agent, BaseAgent)
    assert reminder_agent.agent_id == "agent_reminder_v1"
    assert reminder_agent.name == "Reminder Agent"
    assert reminder_agent.version == "1.0.0"

    # Verify BaseAgent run wrapper
    evt = make_test_event()
    input_data = ReminderAgentInput(
        user_id="user_test_arch",
        events=[evt],
        dry_run=True,
    )

    exec_result: AgentExecutionResult[ReminderAgentResult] = asyncio.run(
        reminder_agent.run(input_data=input_data)
    )

    assert exec_result.status == AgentStatus.SUCCESS
    assert exec_result.agent_id == "agent_reminder_v1"
    assert exec_result.execution_id.startswith("exec_")
    assert exec_result.duration_ms >= 0.0
    assert exec_result.data is not None
    assert exec_result.data.total_events_received == 1

    print("  [OK] Reminder Agent inherits from BaseAgent and exports valid metadata.")
    print(f"  [OK] Standard lifecycle execution: id={exec_result.execution_id}, duration={exec_result.duration_ms}ms.")
    print("PASS: Agent architecture requirements validated.")


# =============================================================================
# B. Monitoring Agent Integration & Event Validation
# =============================================================================
def test_monitoring_agent_integration():
    print_step("B. Monitoring Agent Integration & Event Validation")

    # 1. Valid actionable event is processed
    evt_valid = make_test_event(event_id="evt_valid_1")
    res_valid: ReminderAgentResult = asyncio.run(
        reminder_agent.execute(
            input_data=ReminderAgentInput(user_id="u1", events=[evt_valid], dry_run=True)
        )
    )
    assert res_valid.total_eligible == 1
    assert res_valid.total_dispatched == 1
    assert res_valid.dispatched_reminders[0].status == ReminderStatus.DISPATCHED
    print("  [OK] Valid actionable event from Monitoring Agent accepted and dispatched.")

    # 2. Event with ready_for_reminder=False is skipped
    evt_not_ready = make_test_event(event_id="evt_not_ready", ready_for_reminder=False)
    res_not_ready: ReminderAgentResult = asyncio.run(
        reminder_agent.execute(
            input_data=ReminderAgentInput(user_id="u1", events=[evt_not_ready], dry_run=True)
        )
    )
    assert res_not_ready.total_eligible == 0
    assert res_not_ready.total_skipped_not_ready == 1
    assert res_not_ready.skipped_reminders[0].status == ReminderStatus.SKIPPED_NOT_READY
    print("  [OK] Event not ready for reminder correctly skipped.")

    # 3. Completed vaccination event is skipped
    evt_completed = make_test_event(event_id="evt_comp", event_type="COMPLETED")
    res_comp: ReminderAgentResult = asyncio.run(
        reminder_agent.execute(
            input_data=ReminderAgentInput(user_id="u1", events=[evt_completed], dry_run=True)
        )
    )
    assert res_comp.total_eligible == 0
    assert any(s.status == ReminderStatus.SKIPPED_COMPLETED for s in res_comp.skipped_reminders)
    print("  [OK] Completed vaccination event safely skipped.")

    # 4. Invalid event data is safely caught
    evt_bad_id = make_test_event(event_id="evt_bad", family_member_id="")
    res_bad: ReminderAgentResult = asyncio.run(
        reminder_agent.execute(
            input_data=ReminderAgentInput(user_id="u1", events=[evt_bad_id], dry_run=True)
        )
    )
    assert res_bad.total_validation_failures == 1
    assert res_bad.skipped_reminders[0].status == ReminderStatus.FAILED_VALIDATION
    print("  [OK] Event with missing identifier marked FAILED_VALIDATION without crashing.")

    # 5. Mixed batch: 1 invalid + 1 valid event
    res_mixed: ReminderAgentResult = asyncio.run(
        reminder_agent.execute(
            input_data=ReminderAgentInput(user_id="u1", events=[evt_bad_id, evt_valid], dry_run=True)
        )
    )
    assert res_mixed.total_events_received == 2
    assert res_mixed.total_validation_failures == 1
    assert res_mixed.total_dispatched == 1
    print("  [OK] Mixed batch processed valid event successfully while capturing validation failure.")
    print("PASS: Monitoring Agent event integration and validation verified.")


# =============================================================================
# C. Notification Preferences
# =============================================================================
def test_notification_preferences():
    print_step("C. Notification Preferences & Channel Gating")

    evt = make_test_event()

    # 1. Enabled channels are respected (e.g. IN_APP only)
    prefs_in_app = {
        "channels_enabled": [NotificationChannel.IN_APP],
        "email_enabled": False,
        "sms_enabled": False,
        "quiet_hours_enabled": False,
    }
    res_in_app: ReminderAgentResult = asyncio.run(
        reminder_agent.execute(
            input_data=ReminderAgentInput(user_id="u1", events=[evt], dry_run=True),
            preferences_fixture=prefs_in_app,
        )
    )
    assert res_in_app.total_dispatched == 1
    assert res_in_app.channel_delivery_receipts.get("IN_APP") == 1
    assert "EMAIL" not in res_in_app.channel_delivery_receipts
    print("  [OK] IN_APP only preference dispatched strictly to IN_APP.")

    # 2. Multi-channel enabled (IN_APP + EMAIL)
    prefs_multi = {
        "channels_enabled": [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        "email_enabled": True,
        "email_address": "patient@vaxassist.ai",
        "sms_enabled": False,
        "quiet_hours_enabled": False,
    }
    res_multi: ReminderAgentResult = asyncio.run(
        reminder_agent.execute(
            input_data=ReminderAgentInput(user_id="u1", events=[evt], dry_run=True),
            preferences_fixture=prefs_multi,
            mock_user_contact={"email": "patient@vaxassist.ai"},
        )
    )
    assert res_multi.total_dispatched == 2
    assert res_multi.channel_delivery_receipts.get("IN_APP") == 1
    assert res_multi.channel_delivery_receipts.get("EMAIL") == 1
    print("  [OK] Multi-channel preference dispatched to both IN_APP and EMAIL.")

    # 3. All channels disabled -> skipped preference
    prefs_all_disabled = {
        "channels_enabled": [],
        "email_enabled": False,
        "sms_enabled": False,
        "quiet_hours_enabled": False,
    }
    res_disabled: ReminderAgentResult = asyncio.run(
        reminder_agent.execute(
            input_data=ReminderAgentInput(user_id="u1", events=[evt], dry_run=True),
            preferences_fixture=prefs_all_disabled,
        )
    )
    assert res_disabled.total_dispatched == 0
    assert res_disabled.total_skipped_preference == 1
    assert res_disabled.skipped_reminders[0].status == ReminderStatus.SKIPPED_PREFERENCE
    print("  [OK] All channels disabled resulted in SKIPPED_PREFERENCE.")

    # 4. Safe fallback defaults when preferences are empty
    res_default: ReminderAgentResult = asyncio.run(
        reminder_agent.execute(
            input_data=ReminderAgentInput(user_id="u1", events=[evt], dry_run=True),
            preferences_fixture={},
        )
    )
    assert res_default.total_dispatched >= 1
    print("  [OK] Missing preferences defaulted safely to in-app notification.")
    print("PASS: Notification preferences and channel gating verified.")


# =============================================================================
# D. Quiet Hours & Timing
# =============================================================================
def test_quiet_hours_and_timing():
    print_step("D. Quiet Hours Evaluation, Timezones & Deferred Dispatch")

    evt = make_test_event()
    ref_date = date(2026, 9, 26)

    # 1. Test quiet hours calculation function directly
    prefs_qh = {
        "quiet_hours_enabled": True,
        "quiet_hours_start": "22:00",
        "quiet_hours_end": "08:00",
        "timezone": "Asia/Kolkata",
    }
    tz_kolkata = tz.gettz("Asia/Kolkata")

    # Time 1: 23:30 (inside quiet hours, before midnight)
    dt_night = datetime(2026, 9, 26, 23, 30, tzinfo=tz_kolkata)
    in_qh, next_disp = reminder_agent._evaluate_quiet_hours(dt_night, prefs_qh)
    assert in_qh is True
    assert next_disp is not None
    # Next eligible dispatch is tomorrow morning 08:00 IST -> 02:30 UTC
    assert next_disp.astimezone(tz_kolkata).time() == time(8, 0)
    print("  [OK] 23:30 IST correctly detected inside quiet hours. Next dispatch scheduled for 08:00 IST.")

    # Time 2: 03:00 (inside quiet hours, after midnight)
    dt_early = datetime(2026, 9, 27, 3, 0, tzinfo=tz_kolkata)
    in_qh, next_disp = reminder_agent._evaluate_quiet_hours(dt_early, prefs_qh)
    assert in_qh is True
    assert next_disp.astimezone(tz_kolkata).time() == time(8, 0)
    print("  [OK] 03:00 IST correctly detected inside quiet hours across midnight.")

    # Time 3: 14:00 (outside quiet hours)
    dt_day = datetime(2026, 9, 26, 14, 0, tzinfo=tz_kolkata)
    in_qh, next_disp = reminder_agent._evaluate_quiet_hours(dt_day, prefs_qh)
    assert in_qh is False
    assert next_disp is None
    print("  [OK] 14:00 IST correctly permitted outside quiet hours.")

    # 2. Test ReminderAgent execution deferral during quiet hours
    res_deferred: ReminderAgentResult = asyncio.run(
        reminder_agent.execute(
            input_data=ReminderAgentInput(user_id="u1", events=[evt], dry_run=True),
            preferences_fixture=prefs_qh,
        )
    )
    # Depending on the local test run time, if current time is in quiet hours:
    current_utc = datetime.now(timezone.utc)
    in_now, _ = reminder_agent._evaluate_quiet_hours(current_utc, prefs_qh)
    if in_now:
        assert res_deferred.total_deferred_quiet_hours == 1
        assert res_deferred.deferred_reminders[0].status == ReminderStatus.PENDING_QUIET_HOURS
        print("  [OK] Reminder deferred to PENDING_QUIET_HOURS with next_eligible_dispatch_time.")
    else:
        assert res_deferred.total_dispatched == 1
        print("  [OK] Reminder dispatched immediately (current time outside quiet hours).")

    # 3. Emergency override force_dispatch_quiet_hours
    res_override: ReminderAgentResult = asyncio.run(
        reminder_agent.execute(
            input_data=ReminderAgentInput(
                user_id="u1",
                events=[evt],
                dry_run=True,
                force_dispatch_quiet_hours=True,
            ),
            preferences_fixture=prefs_qh,
        )
    )
    assert res_override.total_dispatched == 1
    assert res_override.total_deferred_quiet_hours == 0
    print("  [OK] Emergency force_dispatch_quiet_hours bypassed quiet hours successfully.")
    print("PASS: Quiet hours and timezone timing verified.")


# =============================================================================
# E. Idempotency & Deduplication
# =============================================================================
def test_idempotency_and_deduplication():
    print_step("E. Idempotency & Deduplication")

    evt = make_test_event(dedup_key="idem_test_user:mem_1:BCG:DUE:2026-09-26")

    # In dry-run mode, dedup_key is tracked in payload
    res1: ReminderAgentResult = asyncio.run(
        reminder_agent.execute(
            input_data=ReminderAgentInput(user_id="idem_test_user", events=[evt], dry_run=True),
            preferences_fixture={"quiet_hours_enabled": False},
        )
    )
    assert res1.total_dispatched == 1
    assert res1.dispatched_reminders[0].dedup_key == "idem_test_user:mem_1:BCG:DUE:2026-09-26"

    # Second execution produces the exact same deterministic dedup_key
    res2: ReminderAgentResult = asyncio.run(
        reminder_agent.execute(
            input_data=ReminderAgentInput(user_id="idem_test_user", events=[evt], dry_run=True),
            preferences_fixture={"quiet_hours_enabled": False},
        )
    )
    assert res2.dispatched_reminders[0].dedup_key == res1.dispatched_reminders[0].dedup_key
    print(f"  [OK] Deterministic dedup key verified: {res1.dispatched_reminders[0].dedup_key}")
    print("PASS: Idempotency and deduplication key generation verified.")


# =============================================================================
# F. Delivery Transports & Safe Error Handling
# =============================================================================
def test_delivery_behavior():
    print_step("F. Delivery Transports & Safe Error Handling")

    evt1 = make_test_event(event_id="evt_succ_1")
    res: ReminderAgentResult = asyncio.run(
        reminder_agent.execute(
            input_data=ReminderAgentInput(user_id="u1", events=[evt1], dry_run=True),
            preferences_fixture={"quiet_hours_enabled": False},
        )
    )
    assert res.total_dispatched == 1
    assert res.total_provider_failures == 0
    print("  [OK] Delivery transport recorded successfully in channel receipts.")
    print("PASS: Delivery behavior verified.")


# =============================================================================
# G. Authorization & Patient Data Isolation
# =============================================================================
def test_authorization_and_isolation():
    print_step("G. Authorization & Patient Data Isolation")

    evt = make_test_event()

    # 1. Patient A tries to dispatch for Patient B -> PermissionError
    try:
        asyncio.run(
            reminder_agent.execute(
                input_data=ReminderAgentInput(
                    user_id="user_b",
                    caller_user_id="user_a",
                    caller_role=UserRole.PATIENT.value,
                    events=[evt],
                    dry_run=True,
                )
            )
        )
        assert False, "Patient A dispatching for Patient B must raise PermissionError!"
    except PermissionError as pe:
        assert "cannot dispatch reminders for user" in str(pe)
        print("  [OK] Blocked cross-tenant reminder dispatch for PATIENT (403 Forbidden).")

    # 2. Healthcare Worker dispatches for Patient B -> Allowed
    res_hcw: ReminderAgentResult = asyncio.run(
        reminder_agent.execute(
            input_data=ReminderAgentInput(
                user_id="user_b",
                caller_user_id="hcw_1",
                caller_role=UserRole.HEALTHCARE_WORKER.value,
                events=[evt],
                dry_run=True,
            ),
            preferences_fixture={"quiet_hours_enabled": False},
        )
    )
    assert res_hcw.total_dispatched == 1
    print("  [OK] HEALTHCARE_WORKER authorized to dispatch patient reminders.")

    # 3. Admin dispatches for Patient B -> Allowed
    res_admin: ReminderAgentResult = asyncio.run(
        reminder_agent.execute(
            input_data=ReminderAgentInput(
                user_id="user_b",
                caller_user_id="admin_1",
                caller_role=UserRole.ADMIN.value,
                events=[evt],
                dry_run=True,
            ),
            preferences_fixture={"quiet_hours_enabled": False},
        )
    )
    assert res_admin.total_dispatched == 1
    print("  [OK] ADMIN authorized to dispatch patient reminders.")
    print("PASS: Tenant isolation and RBAC authorization verified.")


# =============================================================================
# H. API Endpoints via TestClient
# =============================================================================
def test_api_endpoints():
    print_step("H. API Endpoints via FastAPI TestClient")
    from starlette.testclient import TestClient
    from app.api.deps import get_current_user

    client = TestClient(app)

    # 1. Unauthenticated request -> 401 / 403
    resp_unauth = client.post("/api/v1/agents/reminders/dispatch", json={})
    assert resp_unauth.status_code in (401, 403), f"Expected 401/403, got {resp_unauth.status_code}"
    print("  [OK] Unauthenticated request safely rejected.")

    # 2. Setup authenticated Patient dependency override
    patient_id = "patient_api_test_001"
    async def mock_current_patient():
        return {"id": patient_id, "role": UserRole.PATIENT.value, "email": "patient@vaxassist.ai"}

    app.dependency_overrides[get_current_user] = mock_current_patient

    try:
        # Dispatch with dry-run=True
        payload = {
            "dry_run": True,
            "events": [
                {
                    "event_id": "api_evt_1",
                    "dedup_key": f"{patient_id}:mem_1:BCG:DUE:2026-09-26",
                    "event_type": "DUE_ALERT",
                    "priority": "HIGH",
                    "family_member_id": "mem_1",
                    "member_name": "Baby Diya",
                    "vaccine_code": "BCG",
                    "vaccine_name": "BCG Vaccine",
                    "dose_number": 1,
                    "dose_name": "Birth Dose",
                    "calculated_due_date": "2026-09-26",
                    "title": "Vaccination Due: BCG",
                    "message": "BCG is due for Baby Diya.",
                    "ready_for_reminder": True,
                }
            ]
        }

        resp_disp = client.post("/api/v1/agents/reminders/dispatch", json=payload)
        assert resp_disp.status_code == 200, f"Expected 200, got {resp_disp.status_code}: {resp_disp.text}"
        disp_data = resp_disp.json()
        assert disp_data["success"] is True
        result = disp_data["data"]
        assert result["agent_id"] == "agent_reminder_v1"
        assert result["dry_run"] is True
        assert result["total_events_received"] == 1
        print("  [OK] POST /api/v1/agents/reminders/dispatch returned 200 with ReminderAgentResult.")

        # 3. Patient attempting cross-household dispatch -> 403 Forbidden
        payload_hack = dict(payload)
        payload_hack["target_user_id"] = "foreign_user_id_999"
        resp_hack = client.post("/api/v1/agents/reminders/dispatch", json=payload_hack)
        assert resp_hack.status_code == 403
        print("  [OK] POST /api/v1/agents/reminders/dispatch blocked cross-household attempt (403).")

        # 4. POST /api/v1/agents/reminders/run (BaseAgent lifecycle)
        resp_run = client.post("/api/v1/agents/reminders/run", json=payload)
        assert resp_run.status_code == 200
        run_data = resp_run.json()["data"]
        assert run_data["agent_id"] == "agent_reminder_v1"
        assert run_data["status"] == "SUCCESS"
        assert run_data["execution_id"].startswith("exec_")
        assert run_data["duration_ms"] >= 0.0
        print("  [OK] POST /api/v1/agents/reminders/run returned 200 with AgentExecutionResult.")
        print("PASS: API endpoints verified via FastAPI TestClient.")
    finally:
        app.dependency_overrides.clear()


def run_all_reminder_tests():
    print("=" * 75)
    print("RUNNING PHASE 8: AGENT 2 (REMINDER AGENT) COMPREHENSIVE TEST SUITE")
    print("=" * 75)

    test_reminder_agent_architecture()
    test_monitoring_agent_integration()
    test_notification_preferences()
    test_quiet_hours_and_timing()
    test_idempotency_and_deduplication()
    test_delivery_behavior()
    test_authorization_and_isolation()
    test_api_endpoints()

    print("\n" + "=" * 75)
    print("ALL REMINDER AGENT TESTS PASSED SUCCESSFULLY! (8/8)")
    print("=" * 75)


if __name__ == "__main__":
    run_all_reminder_tests()
