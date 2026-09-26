"""
VaxAssist AI - Multi-Agent Architecture Specification (Phase 8 & 9 Foundation).

Defines the formal architectural specification, responsibilities, input/output schemas,
dependencies, backend invocation points, and multi-agent orchestration coordination
protocols for the five specialized agents:

1. Monitoring Agent (Clinical Assessment & Milestone Detection)
2. Reminder Agent (Empathetic Multi-Channel Notification Dispatcher)
3. Knowledge/RAG Agent (Authoritative Clinical Inquiries & Guideline Citations)
4. Recommendation Agent (Personalized Advisory & Catch-Up Pathway Guidance)
5. Report Generation Agent (Immunization Passports, Compliance & Official Summaries)

All agents are implemented as modular, independently testable Python components
within the existing FastAPI backend architecture.
"""
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field


class AgentSpec(BaseModel):
    agent_id: str
    name: str
    role_type: str
    responsibility: str
    primary_inputs: List[str]
    primary_outputs: List[str]
    upstream_dependencies: List[str]
    downstream_consumers: List[str]
    backend_invocation: str
    orchestration_phase9_role: str
    zero_llm_rules_enforced: bool = True
    llm_capabilities_used: Optional[str] = None


FIVE_AGENT_ARCHITECTURE: Dict[str, Dict[str, Any]] = {
    "monitoring_agent": {
        "agent_id": "agent_monitoring_v1",
        "name": "Monitoring Agent",
        "role_type": "Deterministic Clinical Assessment & Milestone Detection",
        "responsibility": (
            "Authoritatively evaluates patient and household vaccination timelines using the "
            "authoritative UIP/NIS deterministic schedule engine. Discovers upcoming, due, overdue, "
            "missed, catch-up required, and clinical review vaccination states. Performs clinical data "
            "quality auditing (conflicts, missing dates, corrupted values) and produces standardized, "
            "actionable monitoring events for the Reminder Agent and future orchestrator."
        ),
        "primary_inputs": [
            "user_id: str (household owner)",
            "family_member_id: Optional[str] (specific member or all household members)",
            "reference_date: Optional[date] (simulation or evaluation reference date)",
            "caller_user_id: Optional[str] (for strict tenant ownership verification)",
            "caller_role: Optional[str] (for RBAC authorization)",
            "include_private_optional: bool (whether to evaluate private sector optional vaccines)",
            "eligible_for_je: bool (Japanese Encephalitis endemic district flag)",
            "dispatch_notifications: bool (whether to persist notifications immediately)",
        ],
        "primary_outputs": [
            "MonitoringAgentResult containing:",
            "- member_assessments: List[MemberMonitoringAssessment] (itemized dose states)",
            "- actionable_events: List[ActionableMonitoringEvent] (deduplicated events ready for reminders)",
            "- data_quality_issues: List[DataQualityIssue] (corrupted/missing/conflicting records)",
            "- status_distribution: Dict[str, int] (counts of upcoming, due, overdue, missed, catch_up, review)",
            "- execution_duration_ms: float",
        ],
        "upstream_dependencies": [
            "app.services.schedule_engine.calculate_member_schedule (authoritative UIP/NIS rules)",
            "app.services.family_service (patient and household data access)",
            "app.services.vaccination_service (administered vaccination records)",
            "app.services.notification_service (dedup checking and optional notification dispatch)",
        ],
        "downstream_consumers": [
            "Reminder Agent (consumes actionable_events to compose and dispatch reminders)",
            "Recommendation Agent (consumes categorized_doses to suggest catch-up or optional vaccines)",
            "Report Generation Agent (consumes member_assessments for compliance cards)",
            "Phase 9 Multi-Agent Orchestrator (coordinates automated workflow runs)",
        ],
        "backend_invocation": (
            "1. HTTP REST Endpoint: POST /api/v1/agents/monitoring/evaluate\n"
            "2. Periodic Background Scheduler: MonitoringScheduler worker loop\n"
            "3. Event-Driven Triggers: Vaccination record creation or profile updates\n"
            "4. Programmatic API: Direct call by Phase 9 Orchestrator"
        ),
        "orchestration_phase9_role": (
            "Acts as the Primary Sensory Agent in the multi-agent graph. Triggered first in any "
            "routine cycle. Its structured output forms the baseline state payload passed to the "
            "Reminder, Recommendation, and Report agents."
        ),
        "zero_llm_rules_enforced": True,
        "llm_capabilities_used": None,
    },

    "reminder_agent": {
        "agent_id": "agent_reminder_v1",
        "name": "Reminder Agent",
        "role_type": "Multi-Channel Intelligent Reminder Dispatcher",
        "responsibility": (
            "Consumes actionable monitoring events from the Monitoring Agent. Checks user channel "
            "preferences, lead-day milestones (e.g. 14, 7, 3, 1 days before due date), quiet hours, "
            "and frequency caps. Formulates clear, empathetic, culturally appropriate reminders, "
            "and dispatches them across In-App, Email, and SMS delivery channels with strict idempotency."
        ),
        "primary_inputs": [
            "actionable_events: List[ActionableMonitoringEvent] (from Monitoring Agent)",
            "user_preferences: NotificationPreference (channels, lead times, quiet hours)",
            "recipient_contact: Dict[str, str] (email, phone, name)",
        ],
        "primary_outputs": [
            "ReminderAgentResult containing:",
            "- dispatched_notifications: List[NotificationRecord]",
            "- skipped_duplicate_count: int",
            "- channel_delivery_receipts: Dict[str, int]",
            "- scheduled_followups: List[ScheduledReminderItem]",
        ],
        "upstream_dependencies": [
            "Monitoring Agent (source of truth for actionable vaccination events)",
            "app.services.notification_service (database persistence & preferences)",
            "app.services.delivery_providers (In-App, Mock/Live Email, Mock/Live SMS)",
        ],
        "downstream_consumers": [
            "FastAPI WebSocket / In-App Notification Feed",
            "User Mobile/Email Inboxes",
            "Phase 9 Multi-Agent Orchestrator",
        ],
        "backend_invocation": (
            "1. Automatically chained following Monitoring Agent execution\n"
            "2. Direct invocation: POST /api/v1/agents/reminders/dispatch\n"
            "3. Scheduled reminder dispatch sweeps"
        ),
        "orchestration_phase9_role": (
            "Acts as the Outbound Communication Agent. Receives filtered events from the Orchestrator "
            "and ensures timely delivery without message fatigue or duplicates."
        ),
        "zero_llm_rules_enforced": True,
        "llm_capabilities_used": "Optional formatting/templating for polite empathetic language variations without altering dates.",
    },

    "knowledge_rag_agent": {
        "agent_id": "agent_knowledge_rag_v1",
        "name": "Knowledge / RAG Agent",
        "role_type": "Authoritative Grounded Clinical Q&A Agent",
        "responsibility": (
            "Answers user, parent, and clinician clinical questions exclusively grounded in the "
            "verified vector Knowledge Base (MoHFW UIP, WHO, IAP guidelines). Provides verifiable "
            "citations, source excerpts, and mandatory clinical disclaimers. Never calculates or overrides "
            "personalized schedule dates."
        ),
        "primary_inputs": [
            "query: str (clinical question or guideline inquiry)",
            "filters: Optional[Dict[str, Any]] (vaccine_code, target_disease, authority)",
            "conversation_history: Optional[List[Dict[str, str]]]",
        ],
        "primary_outputs": [
            "RAGAgentResult containing:",
            "- grounded_answer: str",
            "- sources: List[RAGSourceCitation] (document title, authority, page, excerpt)",
            "- confidence_score: float",
            "- disclaimer: str",
            "- follow_up_suggestions: List[str]",
        ],
        "upstream_dependencies": [
            "app.services.vector_store.vector_store (ChromaDB persistent vectors)",
            "app.services.embedding_service.embedding_service (Gemini Embedding 2)",
            "app.services.rag_service.rag_service (context assembly & prompt guardrails)",
            "Gemini Generative LLM (gemini-2.5-flash / gemini-1.5-flash)",
        ],
        "downstream_consumers": [
            "Public and Authenticated Patient Q&A Chat UI",
            "Recommendation Agent (for clinical contraindication lookups)",
            "Phase 9 Multi-Agent Orchestrator",
        ],
        "backend_invocation": (
            "1. HTTP REST Endpoint: POST /api/v1/agents/knowledge/query\n"
            "2. Interactive Chat Endpoint: POST /api/v1/knowledge/rag/query\n"
            "3. Sub-routine call by Recommendation Agent"
        ),
        "orchestration_phase9_role": (
            "Acts as the Consultative Clinical Knowledge Resource in the multi-agent graph. Consulted "
            "when complex clinical questions or guideline interpretations are required."
        ),
        "zero_llm_rules_enforced": False,
        "llm_capabilities_used": "Gemini LLM generation with strict evidence-only clinical guardrails.",
    },

    "recommendation_agent": {
        "agent_id": "agent_recommendation_v1",
        "name": "Recommendation Agent",
        "role_type": "Personalized Clinical Advisory & Catch-Up Guide",
        "responsibility": (
            "Synthesizes patient clinical status (from Monitoring Agent), demographic context (age, "
            "allergies, previous adverse reactions), and regional risk factors (JE endemic districts, "
            "travel risks, seasonal flu) to generate structured, non-prescriptive advisory guidance. "
            "Outlines catch-up pathways for missed vaccines and highlights optional private vaccines "
            "(e.g. Varicella, MMRV, HPV) to discuss with the pediatrician."
        ),
        "primary_inputs": [
            "patient_profile: Dict[str, Any] (age, gender, allergies, state/district)",
            "monitoring_assessment: MemberMonitoringAssessment (from Monitoring Agent)",
            "clinical_history: List[Dict[str, Any]] (past reactions, chronic conditions)",
        ],
        "primary_outputs": [
            "RecommendationAgentResult containing:",
            "- prioritized_recommendations: List[ClinicalRecommendationItem]",
            "- catch_up_pathways: List[CatchUpPathwayGuidance]",
            "- optional_vaccine_advisories: List[OptionalVaccineGuidance]",
            "- pediatric_discussion_points: List[str]",
            "- clinical_disclaimer: str",
        ],
        "upstream_dependencies": [
            "Monitoring Agent (evaluates existing schedule & overdue/missed items)",
            "Knowledge / RAG Agent (retrieves authoritative catch-up protocols and contraindications)",
            "app.services.schedule_catalog (official intervals and rules)",
        ],
        "downstream_consumers": [
            "Patient Dashboard Advisory Cards",
            "Healthcare Worker Patient Consultation View",
            "Report Generation Agent (for personalized action plans)",
        ],
        "backend_invocation": (
            "1. HTTP REST Endpoint: POST /api/v1/agents/recommendations/evaluate\n"
            "2. Triggered on dashboard load or profile change\n"
            "3. Phase 9 Multi-Agent Orchestrator"
        ),
        "orchestration_phase9_role": (
            "Acts as the Advisory Decision Support Agent in the multi-agent graph, bridging "
            "raw monitoring states into actionable healthcare advice."
        ),
        "zero_llm_rules_enforced": False,
        "llm_capabilities_used": "Contextual synthesis of deterministic rules with clinical communication.",
    },

    "report_agent": {
        "agent_id": "agent_report_generation_v1",
        "name": "Report Generation Agent",
        "role_type": "Immunization Documentation & Compliance Auditor",
        "responsibility": (
            "Generates comprehensive immunization records, official compliance summaries, "
            "school admission certificates, and international travel vaccination passports in "
            "structured JSON, printable HTML, and PDF formats. Includes cryptographic verification "
            "checksums and administrative sign-off metadata."
        ),
        "primary_inputs": [
            "user_id: str",
            "family_member_id: str",
            "report_format: str ('summary', 'school_entry', 'comprehensive_passport', 'clinical_audit')",
            "include_recommendations: bool (include advice from Recommendation Agent)",
        ],
        "primary_outputs": [
            "ReportAgentResult containing:",
            "- document_metadata: ReportDocumentMetadata (id, timestamp, hash, issuer)",
            "- member_identity: Dict[str, Any]",
            "- verified_administrations: List[VerifiedVaccineDoseItem]",
            "- compliance_status: Dict[str, Any] (NIS compliance percentage, missing items)",
            "- formatted_output: Dict[str, str] (json, markdown, html_preview_url)",
        ],
        "upstream_dependencies": [
            "app.services.vaccination_service (official verified administered records)",
            "app.services.family_service (member demographics)",
            "Monitoring Agent (current compliance & scheduled items)",
            "Recommendation Agent (optional catch-up action steps)",
        ],
        "downstream_consumers": [
            "User Export & Download (PDF/Print)",
            "School / Daycare Administrators",
            "Healthcare Providers / Clinics",
        ],
        "backend_invocation": (
            "1. HTTP REST Endpoint: POST /api/v1/agents/reports/generate\n"
            "2. Triggered on user 'Download Immunization Card' button\n"
            "3. Triggered by Healthcare Worker during clinical audit"
        ),
        "orchestration_phase9_role": (
            "Acts as the Synthesis & Artifact Generation Agent in the multi-agent graph. Compiles "
            "outputs from all upstream agents into permanent, exportable records."
        ),
        "zero_llm_rules_enforced": True,
        "llm_capabilities_used": "None for clinical records; optional templated natural language executive summary.",
    },
}


def get_agent_architecture_spec() -> Dict[str, Any]:
    """Returns the full architectural specification of the five specialized agents."""
    return FIVE_AGENT_ARCHITECTURE
