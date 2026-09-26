"""
Report Generation Agent Package (Phase 8, Agent 5).
"""
from app.agents.report.schemas import (
    ReportType,
    ReportOutputFormat,
    ReportAgentInput,
    ReportAgentResult,
    PatientDemographicsReportItem,
    AdministeredRecordReportItem,
    ScheduledDoseReportItem,
    ProgressSummaryReportItem,
    RecommendationReportItem,
    DataQualityReportItem,
    ReportDocumentMetadata,
    MANDATORY_REPORT_DISCLAIMER,
)
from app.agents.report.pdf_builder import (
    VaccinationPDFBuilder,
    vaccination_pdf_builder,
)
from app.agents.report.agent import (
    ReportAgent,
    report_agent,
)

__all__ = [
    "ReportType",
    "ReportOutputFormat",
    "ReportAgentInput",
    "ReportAgentResult",
    "PatientDemographicsReportItem",
    "AdministeredRecordReportItem",
    "ScheduledDoseReportItem",
    "ProgressSummaryReportItem",
    "RecommendationReportItem",
    "DataQualityReportItem",
    "ReportDocumentMetadata",
    "MANDATORY_REPORT_DISCLAIMER",
    "VaccinationPDFBuilder",
    "vaccination_pdf_builder",
    "ReportAgent",
    "report_agent",
]
