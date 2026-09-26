"""
PDF Report Builder for VaxAssist AI Report Generation Agent (Phase 8, Agent 5).
Generates multi-page, publication-grade immunization passports and clinical status reports
using ReportLab with precise typography, data grids, running footers, and verification hashes.
"""
from io import BytesIO
from datetime import datetime
from typing import Dict, Any, List, Optional

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)
from reportlab.pdfgen import canvas

# Palette constants
COLOR_NAVY = colors.HexColor("#1E3A8A")
COLOR_TEAL = colors.HexColor("#0D9488")
COLOR_SLATE_DARK = colors.HexColor("#0F172A")
COLOR_SLATE_MUTED = colors.HexColor("#64748B")
COLOR_BG_LIGHT = colors.HexColor("#F8FAFC")
COLOR_BORDER = colors.HexColor("#CBD5E1")
COLOR_GREEN = colors.HexColor("#16A34A")
COLOR_AMBER = colors.HexColor("#D97706")
COLOR_RED = colors.HexColor("#DC2626")
COLOR_BLUE = colors.HexColor("#2563EB")


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas that computes total page count dynamically
    and draws uniform running headers/footers on all pages.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states: List[Dict[str, Any]] = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        page_width, page_height = letter

        # Running Top Header (pages 2+)
        if self._pageNumber > 1:
            self.setFont("Helvetica", 7)
            self.setFillColor(COLOR_SLATE_MUTED)
            self.drawString(36, page_height - 25, "VaxAssist AI — Digital Vaccination Tracking System | Immunization Record")
            self.drawRightString(page_width - 36, page_height - 25, "Confidential Medical Information")
            self.setStrokeColor(COLOR_BORDER)
            self.setLineWidth(0.5)
            self.line(36, page_height - 30, page_width - 36, page_height - 30)

        # Running Bottom Footer (all pages)
        self.setStrokeColor(COLOR_BORDER)
        self.setLineWidth(0.5)
        self.line(36, 42, page_width - 36, 42)

        self.setFont("Helvetica", 7.5)
        self.setFillColor(COLOR_SLATE_MUTED)
        self.drawString(36, 30, "VaxAssist AI • UIP/NIS Compliant Digital Record • Consult Healthcare Provider")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(page_width - 36, 30, page_str)

        self.restoreState()


class VaccinationPDFBuilder:
    """
    Renders structured report data into high-resolution, multi-page vector PDF documents.
    """

    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._init_custom_styles()

    def _init_custom_styles(self):
        self.style_title = ParagraphStyle(
            "DocTitle",
            parent=self.styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=18,
            textColor=COLOR_NAVY,
            alignment=1,  # Center
            spaceAfter=4,
        )
        self.style_subtitle = ParagraphStyle(
            "DocSubtitle",
            parent=self.styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            textColor=COLOR_SLATE_MUTED,
            alignment=1,
            spaceAfter=6,
        )
        self.style_h2 = ParagraphStyle(
            "SectionH2",
            parent=self.styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=10.5,
            leading=13,
            textColor=COLOR_NAVY,
            spaceBefore=8,
            spaceAfter=4,
        )
        self.style_body = ParagraphStyle(
            "BodySmall",
            parent=self.styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=COLOR_SLATE_DARK,
        )
        self.style_bold = ParagraphStyle(
            "BodyBold",
            parent=self.styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=COLOR_SLATE_DARK,
        )
        self.style_th = ParagraphStyle(
            "TableHeader",
            parent=self.styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=9,
            textColor=colors.whitesmoke,
            alignment=0,
        )
        self.style_cell = ParagraphStyle(
            "TableCell",
            parent=self.styles["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=9,
            textColor=COLOR_SLATE_DARK,
        )
        self.style_disclaimer = ParagraphStyle(
            "DisclaimerText",
            parent=self.styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=6.5,
            leading=8.5,
            textColor=COLOR_SLATE_MUTED,
        )

    def build_pdf(self, report_data: Dict[str, Any]) -> bytes:
        """
        Compiles report data dictionary into PDF bytes.
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=36,
            rightMargin=36,
            topMargin=40,
            bottomMargin=52,
        )

        story: List[Any] = []
        metadata = report_data.get("metadata", {})
        patient = report_data.get("patient", {})
        progress = report_data.get("progress", {})
        history = report_data.get("history", [])
        scheduled = report_data.get("scheduled_doses", [])
        recommendations = report_data.get("recommendations", [])
        data_quality = report_data.get("data_quality", [])
        report_type = report_data.get("report_type", "comprehensive_record")

        # 1. Document Header
        self._add_header(story, metadata)

        # 2. Patient Demographics Box
        self._add_patient_box(story, patient, metadata)

        # 3. Progress Summary (if applicable)
        if report_type in ("progress_summary", "comprehensive_record", "vaccination_status"):
            self._add_progress_summary(story, progress)

        # 4. Administered Vaccination History Table (if applicable)
        if report_type in ("vaccination_history", "comprehensive_record"):
            self._add_history_table(story, history)

        # 5. Scheduled & Pending Vaccinations Table (if applicable)
        if report_type in ("vaccination_status", "comprehensive_record"):
            self._add_scheduled_table(story, scheduled)

        # 6. Clinical Recommendations Section (if applicable and present)
        if report_type == "comprehensive_record" and recommendations:
            self._add_recommendations_section(story, recommendations)

        # 7. Data Quality & Discrepancies Section (if present)
        if data_quality:
            self._add_data_quality_section(story, data_quality)

        # 8. Clinical Disclaimer & Verification Hash Block
        self._add_verification_footer(story, metadata)

        # Build document with NumberedCanvas
        doc.build(story, canvasmaker=NumberedCanvas)
        return buffer.getvalue()

    def _add_header(self, story: List[Any], metadata: Dict[str, Any]):
        title_text = "<b>VAXASSIST AI — OFFICIAL IMMUNIZATION RECORD</b>"
        report_label = metadata.get("report_type", "Comprehensive Vaccination Passport").replace("_", " ").title()
        subtitle_text = f"National Immunization Schedule (UIP/NIS) Tracked Record • Document Type: {report_label}"

        story.append(Paragraph(title_text, self.style_title))
        story.append(Paragraph(subtitle_text, self.style_subtitle))
        story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_NAVY, spaceAfter=8))

    def _add_patient_box(self, story: List[Any], patient: Dict[str, Any], metadata: Dict[str, Any]):
        dob_display = patient.get("date_of_birth") or "Not Specified"
        age_display = patient.get("age_display") or "Unknown"
        allergies_list = patient.get("allergies") or []
        allergies_display = ", ".join(allergies_list) if allergies_list else "None Documented"

        grid_data = [
            [
                Paragraph("<b>Patient Name:</b>", self.style_bold),
                Paragraph(patient.get("full_name", "Unknown"), self.style_body),
                Paragraph("<b>Date of Birth:</b>", self.style_bold),
                Paragraph(dob_display, self.style_body),
            ],
            [
                Paragraph("<b>Relationship:</b>", self.style_bold),
                Paragraph(patient.get("relationship", "Self").title(), self.style_body),
                Paragraph("<b>Calculated Age:</b>", self.style_bold),
                Paragraph(age_display, self.style_body),
            ],
            [
                Paragraph("<b>Gender:</b>", self.style_bold),
                Paragraph(str(patient.get("gender") or "Not Specified").title(), self.style_body),
                Paragraph("<b>Blood Group:</b>", self.style_bold),
                Paragraph(patient.get("blood_group") or "Unknown", self.style_body),
            ],
            [
                Paragraph("<b>Documented Allergies:</b>", self.style_bold),
                Paragraph(allergies_display, self.style_body),
                Paragraph("<b>Reference Date:</b>", self.style_bold),
                Paragraph(metadata.get("reference_date", "Today"), self.style_body),
            ],
        ]

        table = Table(grid_data, colWidths=[110, 160, 110, 160])
        table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), COLOR_BG_LIGHT),
                ("BOX", (0, 0), (-1, -1), 0.75, COLOR_BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E2E8F0")),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ])
        )
        story.append(table)
        story.append(Spacer(1, 8))

    def _add_progress_summary(self, story: List[Any], progress: Dict[str, Any]):
        story.append(Paragraph("<b>Immunization Progress & NIS Compliance Summary</b>", self.style_h2))

        compliance = progress.get("compliance_percentage", 0.0)
        is_up_to_date = progress.get("is_up_to_date", True)
        status_label = "UP TO DATE" if is_up_to_date else "CATCH-UP REQUIRED"
        status_color = COLOR_GREEN if is_up_to_date else COLOR_AMBER

        summary_metrics = [
            [
                Paragraph("<b>Total Doses Evaluated:</b>", self.style_bold),
                Paragraph(str(progress.get("total_required_doses", 0)), self.style_body),
                Paragraph("<b>Completed Doses:</b>", self.style_bold),
                Paragraph(str(progress.get("completed_doses", 0)), self.style_body),
                Paragraph("<b>Due Now:</b>", self.style_bold),
                Paragraph(str(progress.get("due_doses", 0)), self.style_body),
            ],
            [
                Paragraph("<b>Overdue Doses:</b>", self.style_bold),
                Paragraph(str(progress.get("overdue_doses", 0)), self.style_body),
                Paragraph("<b>NIS Compliance Rate:</b>", self.style_bold),
                Paragraph(f"{compliance:.1f}%", self.style_body),
                Paragraph("<b>Schedule Status:</b>", self.style_bold),
                Paragraph(f"<b>{status_label}</b>", ParagraphStyle("StatTag", parent=self.style_bold, textColor=status_color)),
            ],
        ]

        table = Table(summary_metrics, colWidths=[100, 80, 100, 80, 90, 90])
        table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), COLOR_BG_LIGHT),
                ("BOX", (0, 0), (-1, -1), 0.75, COLOR_BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E2E8F0")),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ])
        )
        story.append(table)
        story.append(Spacer(1, 8))

    def _add_history_table(self, story: List[Any], history: List[Dict[str, Any]]):
        story.append(Paragraph("<b>Administered Immunization History (Verified Records)</b>", self.style_h2))

        # Col widths sum to 540 pt
        col_widths = [115, 45, 75, 75, 160, 70]
        headers = [
            Paragraph("<b>Vaccine Name</b>", self.style_th),
            Paragraph("<b>Dose</b>", self.style_th),
            Paragraph("<b>Date Given</b>", self.style_th),
            Paragraph("<b>Batch No.</b>", self.style_th),
            Paragraph("<b>Healthcare Facility / Provider</b>", self.style_th),
            Paragraph("<b>Status</b>", self.style_th),
        ]
        table_rows = [headers]

        if not history:
            msg_cell = Paragraph("<i>No administered vaccination records documented for this individual.</i>", self.style_cell)
            table_rows.append([msg_cell, "", "", "", "", ""])
            table = Table(table_rows, colWidths=col_widths)
            table.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), COLOR_NAVY),
                    ("SPAN", (0, 1), (-1, 1)),
                    ("ALIGN", (0, 1), (-1, 1), "CENTER"),
                    ("BOX", (0, 0), (-1, -1), 0.75, COLOR_BORDER),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ])
            )
        else:
            for row in history:
                vac_name = row.get("vaccine_name", row.get("vaccine_code", "Unknown"))
                dose_str = f"Dose {row.get('dose_number', 1)}"
                admin_date = str(row.get("administered_date", ""))
                batch_no = row.get("batch_number") or "—"
                provider = row.get("healthcare_provider") or "Authorized Center"
                verif = "Verified" if row.get("is_verified", True) else "Recorded"

                table_rows.append([
                    Paragraph(vac_name, self.style_cell),
                    Paragraph(dose_str, self.style_cell),
                    Paragraph(admin_date, self.style_cell),
                    Paragraph(batch_no, self.style_cell),
                    Paragraph(provider, self.style_cell),
                    Paragraph(f"<b>{verif}</b>", ParagraphStyle("VerCell", parent=self.style_cell, textColor=COLOR_GREEN)),
                ])

            table = Table(table_rows, colWidths=col_widths, repeatRows=1)
            table.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), COLOR_NAVY),
                    ("BOX", (0, 0), (-1, -1), 0.75, COLOR_BORDER),
                    ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E2E8F0")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, COLOR_BG_LIGHT]),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("LEFTPADDING", (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ])
            )

        story.append(table)
        story.append(Spacer(1, 8))

    def _add_scheduled_table(self, story: List[Any], scheduled: List[Dict[str, Any]]):
        story.append(Paragraph("<b>Scheduled & Pending Vaccinations (UIP Schedule Engine)</b>", self.style_h2))

        # Col widths sum to 540 pt
        col_widths = [120, 45, 105, 85, 85, 100]
        headers = [
            Paragraph("<b>Vaccine</b>", self.style_th),
            Paragraph("<b>Dose</b>", self.style_th),
            Paragraph("<b>Recommended Age</b>", self.style_th),
            Paragraph("<b>Target Due</b>", self.style_th),
            Paragraph("<b>Overdue After</b>", self.style_th),
            Paragraph("<b>Current Status</b>", self.style_th),
        ]
        table_rows = [headers]

        if not scheduled:
            msg_cell = Paragraph("<i>No scheduled doses pending. All routine schedule milestones evaluated.</i>", self.style_cell)
            table_rows.append([msg_cell, "", "", "", "", ""])
            table = Table(table_rows, colWidths=col_widths)
            table.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), COLOR_NAVY),
                    ("SPAN", (0, 1), (-1, 1)),
                    ("ALIGN", (0, 1), (-1, 1), "CENTER"),
                    ("BOX", (0, 0), (-1, -1), 0.75, COLOR_BORDER),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ])
            )
        else:
            for item in scheduled:
                vac_name = item.get("vaccine_name", item.get("vaccine_code", "Unknown"))
                dose_str = f"Dose {item.get('dose_number', 1)}"
                milestone = item.get("milestone") or "Standard NIS"
                target_due = str(item.get("due_date") or item.get("target_date") or "—")
                overdue = str(item.get("overdue_date") or "—")
                st = str(item.get("status", "upcoming")).lower()

                # Status color coding
                if st == "overdue":
                    st_color = COLOR_RED
                    st_text = "OVERDUE"
                elif st in ("due", "due_now"):
                    st_color = COLOR_AMBER
                    st_text = "DUE NOW"
                elif st in ("completed", "administered"):
                    st_color = COLOR_GREEN
                    st_text = "COMPLETED"
                elif st in ("missed", "catch_up"):
                    st_color = COLOR_RED
                    st_text = "CATCH-UP NEEDED"
                else:
                    st_color = COLOR_BLUE
                    st_text = "UPCOMING"

                table_rows.append([
                    Paragraph(vac_name, self.style_cell),
                    Paragraph(dose_str, self.style_cell),
                    Paragraph(milestone, self.style_cell),
                    Paragraph(target_due, self.style_cell),
                    Paragraph(overdue, self.style_cell),
                    Paragraph(f"<b>{st_text}</b>", ParagraphStyle("StatCell", parent=self.style_cell, textColor=st_color)),
                ])

            table = Table(table_rows, colWidths=col_widths, repeatRows=1)
            table.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), COLOR_NAVY),
                    ("BOX", (0, 0), (-1, -1), 0.75, COLOR_BORDER),
                    ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E2E8F0")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, COLOR_BG_LIGHT]),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("LEFTPADDING", (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ])
            )

        story.append(table)
        story.append(Spacer(1, 8))

    def _add_recommendations_section(self, story: List[Any], recommendations: List[Dict[str, Any]]):
        recs_content: List[Any] = [
            Paragraph("<b>Clinical Catch-Up Recommendations & Guidance</b>", self.style_h2)
        ]

        for rec in recommendations[:5]:  # limit to top 5 most actionable
            priority = rec.get("priority", "medium").upper()
            title = rec.get("title", "Clinical Recommendation")
            summary = rec.get("summary", "")
            rationale = rec.get("clinical_rationale", "")
            pri_color = COLOR_RED if priority == "CRITICAL" else (COLOR_AMBER if priority == "HIGH" else COLOR_BLUE)

            rec_block = [
                [
                    Paragraph(f"<b>[{priority}] {title}</b>", ParagraphStyle("RecTitle", parent=self.style_bold, textColor=pri_color)),
                ],
                [
                    Paragraph(f"<b>Summary:</b> {summary}", self.style_body),
                ],
                [
                    Paragraph(f"<b>Clinical Rationale:</b> {rationale}", self.style_disclaimer),
                ],
            ]

            t = Table(rec_block, colWidths=[540])
            t.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), COLOR_BG_LIGHT),
                    ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                    ("TOPPADDING", (0, 0), (-1, -1), 2),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ])
            )
            recs_content.append(t)
            recs_content.append(Spacer(1, 4))

        story.append(KeepTogether(recs_content))
        story.append(Spacer(1, 4))

    def _add_data_quality_section(self, story: List[Any], issues: List[Dict[str, Any]]):
        dq_content: List[Any] = [
            Paragraph("<b>Clinical Data Quality Discrepancies & Audit Findings</b>", self.style_h2)
        ]

        rows = [
            [
                Paragraph("<b>Issue Type</b>", self.style_th),
                Paragraph("<b>Vaccine</b>", self.style_th),
                Paragraph("<b>Severity</b>", self.style_th),
                Paragraph("<b>Description / Resolution Required</b>", self.style_th),
            ]
        ]

        for issue in issues:
            rows.append([
                Paragraph(str(issue.get("issue_type", "Discrepancy")).replace("_", " ").title(), self.style_cell),
                Paragraph(issue.get("vaccine_code") or "General", self.style_cell),
                Paragraph(f"<b>{str(issue.get('severity', 'Warning')).upper()}</b>", ParagraphStyle("Sev", parent=self.style_cell, textColor=COLOR_AMBER)),
                Paragraph(issue.get("message", ""), self.style_cell),
            ])

        table = Table(rows, colWidths=[110, 80, 70, 280])
        table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#78350F")),  # Warm brown/amber header for audit
                ("BOX", (0, 0), (-1, -1), 0.75, COLOR_BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E2E8F0")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, COLOR_BG_LIGHT]),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ])
        )
        dq_content.append(table)
        dq_content.append(Spacer(1, 6))
        story.append(KeepTogether(dq_content))

    def _add_verification_footer(self, story: List[Any], metadata: Dict[str, Any]):
        footer_block: List[Any] = []
        footer_block.append(Spacer(1, 6))
        footer_block.append(HRFlowable(width="100%", thickness=0.75, color=COLOR_BORDER, spaceAfter=4))

        disclaimer_text = metadata.get("disclaimer", (
            "VaxAssist AI vaccination reports are generated from recorded immunization data and official "
            "National Immunization Schedule guidelines for informational and tracking purposes. This document "
            "does not substitute for certified clinical advice or official government-issued vaccination certificates."
        ))

        hash_str = metadata.get("verification_hash", "UNVERIFIED")
        report_id = metadata.get("report_id", "—")
        generated_at = metadata.get("generated_at", datetime.now().isoformat())

        verification_table = Table([
            [
                Paragraph("<b>Tamper-Evident SHA-256 Verification Checksum:</b>", self.style_bold),
                Paragraph(f"<font face='Courier' size=6.5>{hash_str}</font>", self.style_body),
            ],
            [
                Paragraph("<b>Document Reference ID:</b>", self.style_bold),
                Paragraph(f"{report_id} • Generated: {generated_at} • Agent: agent_report_generation_v1", self.style_body),
            ],
            [
                Paragraph("<b>Mandatory Clinical Notice:</b>", self.style_bold),
                Paragraph(disclaimer_text, self.style_disclaimer),
            ],
        ], colWidths=[160, 380])

        verification_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), COLOR_BG_LIGHT),
                ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ])
        )
        footer_block.append(verification_table)
        story.append(KeepTogether(footer_block))


# Global builder singleton
vaccination_pdf_builder = VaccinationPDFBuilder()
