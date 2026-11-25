"""Organization, Branches, Academic Years, Communication, Certificates, and Alumni tools."""

from __future__ import annotations

import json
from pydantic import BaseModel

from app.integrations.mysql_reader import get_mysql_reader
from app.schemas.chat import VisualArtifact
from app.schemas.security import AiSecurityContext
from app.tools.base import BaseErpTool, ToolOutput


class OrganizationGovernanceTool(BaseErpTool):
    name = "organization_governance"
    description = (
        "Retrieves school configuration (`schools`, `schoolsettings`), active branches (`branches`), "
        "academic years (`academic_years`), circulars, scheduled meetings, school events, and audit activity summary."
    )
    module = "organization"
    allowed_roles = ("Super Admin", "Admin", "Principal", "HR", "Accountant", "Teacher", "Receptionist")

    async def _run(self, ctx: AiSecurityContext, params: BaseModel) -> ToolOutput:
        mysql = get_mysql_reader()
        tid = ctx.tenant_id

        settings_row = await mysql.fetch_one(
            "SELECT SchoolName, Tagline, Email, Phone, Website, PrincipalName, BoardType FROM schoolsettings WHERE TenantId = :tid LIMIT 1",
            {"tid": tid},
        )
        branches = await mysql.fetch_all(
            "SELECT BranchId, BranchName, BranchCode, Address, Phone, Email, Status FROM branches WHERE TenantId = :tid ORDER BY BranchId",
            {"tid": tid},
        )
        years = await mysql.fetch_all(
            "SELECT academic_year_id, academic_year_name, start_date, end_date, is_current, is_active FROM academic_years WHERE TenantId = :tid AND is_deleted = 0 ORDER BY is_current DESC, academic_year_id DESC",
            {"tid": tid},
        )
        circulars = await mysql.fetch_all(
            "SELECT CircularId, Title, Category, TargetAudience, Author, CreatedDate FROM circulars WHERE TenantId = :tid ORDER BY CreatedDate DESC LIMIT 15",
            {"tid": tid},
        )
        meetings = await mysql.fetch_all(
            "SELECT MeetingId, MeetingTitle, ParticipantType, MeetingMode, MeetingDate, StartTime, MeetingStatus FROM meetings WHERE TenantId = :tid ORDER BY MeetingDate DESC LIMIT 15",
            {"tid": tid},
        )
        events = await mysql.fetch_all(
            "SELECT EventId, Title, Category, Venue, StartDate, EndDate, Status, ApplicableBranch FROM school_events WHERE TenantId = :tid ORDER BY StartDate DESC LIMIT 15",
            {"tid": tid},
        )
        audit_summary = await mysql.fetch_all(
            "SELECT Action, COUNT(*) AS count FROM audit_logs WHERE TenantId = :tid GROUP BY Action ORDER BY count DESC LIMIT 15",
            {"tid": tid},
        )

        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=len(branches) + len(years),
            summary=(
                f"Organization '{(settings_row or {}).get('SchoolName', 'Pirnav SMS')}' operates {len(branches)} branch(es), "
                f"{len(years)} active academic year(s), {len(circulars)} recent circular(s), and {len(meetings)} meeting(s)."
            ),
            data={
                "school_settings": settings_row,
                "branches": branches,
                "academic_years": years,
                "circulars": circulars,
                "meetings": meetings,
                "events": events,
                "audit_action_summary": audit_summary,
            },
            visuals=[VisualArtifact(visual_type="table", title="Branches & Academic Years", data={"rows": branches})],
        )


class CertificatesAlumniTool(BaseErpTool):
    name = "certificates_alumni"
    description = (
        "Retrieves certificate templates, faculty training certificates, student promotion histories, "
        "and alumni-eligible graduated/inactive student cohorts from MySQL."
    )
    module = "certificates_alumni"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Teacher", "HR", "Receptionist")

    async def _run(self, ctx: AiSecurityContext, params: BaseModel) -> ToolOutput:
        mysql = get_mysql_reader()
        tid = ctx.tenant_id

        cert_row = await mysql.fetch_one(
            "SELECT CertificateTemplatesJson FROM schoolsettings WHERE TenantId = :tid LIMIT 1",
            {"tid": tid},
        )
        templates = []
        raw_json = (cert_row or {}).get("CertificateTemplatesJson")
        if raw_json and isinstance(raw_json, str):
            try:
                parsed = json.loads(raw_json)
                if isinstance(parsed, list):
                    templates = parsed
            except Exception:
                templates = []

        faculty_certs = await mysql.fetch_all(
            """
            SELECT p.id, p.staff_id, CONCAT(COALESCE(s.FirstName,''), ' ', COALESCE(s.LastName,'')) AS staff_name,
                   w.title AS workshop_title, p.certificate_issued, p.certificate_number, p.issued_date
            FROM faculty_training_participations p
            LEFT JOIN faculty_workshops w ON w.id = p.workshop_id
            LEFT JOIN staff s ON s.StaffId = p.staff_id
            WHERE p.TenantId = :tid AND p.certificate_issued = 1
            """,
            {"tid": tid},
        )

        promotions = await mysql.fetch_all(
            """
            SELECT from_academic_year, to_academic_year, from_class, to_class, final_result, status, COUNT(*) AS count
            FROM student_promotion_histories
            WHERE TenantId = :tid
            GROUP BY from_academic_year, to_academic_year, from_class, to_class, final_result, status
            ORDER BY count DESC
            """,
            {"tid": tid},
        )

        alumni_candidates = await mysql.fetch_all(
            """
            SELECT s.student_id, s.admission_number, s.student_name, c.ClassName AS last_class, s.status
            FROM students s
            LEFT JOIN classes c ON c.id = s.class_id
            WHERE s.TenantId = :tid
              AND (LOWER(s.status) IN ('alumni', 'graduated', 'completed', 'inactive') AND s.is_deleted = 0)
            ORDER BY s.student_id DESC
            LIMIT 50
            """,
            {"tid": tid},
        )

        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=len(templates) + len(faculty_certs) + len(alumni_candidates),
            summary=(
                f"Found {len(templates)} certificate template(s), {len(faculty_certs)} issued faculty training certificate(s), "
                f"{len(promotions)} promotion transition group(s), and {len(alumni_candidates)} non-deleted inactive/alumni candidate(s). "
                "Note: Dedicated alumni directory edits outside student promotion are client-side in the UI."
            ),
            data={
                "certificate_templates": templates,
                "faculty_certificates_issued": faculty_certs,
                "promotion_summary": promotions,
                "alumni_candidates": alumni_candidates,
            },
        )
