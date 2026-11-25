"""Admissions pipeline and dual-table (admission_applications vs admissions) ERP tools."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field

from app.integrations.mysql_reader import get_mysql_reader
from app.schemas.chat import VisualArtifact
from app.schemas.security import AiSecurityContext
from app.tools.base import BaseErpTool, ToolOutput
from app.tools.erp_helpers import join_where, resolve_scope_filters


class AdmissionsOverviewInput(BaseModel):
    branch_name: Optional[str] = None
    academic_year: Optional[str] = None
    status: Optional[str] = Field(default=None, description="e.g. Enrolled, Pending, Approved, Rejected")
    limit: int = Field(default=25, ge=1, le=100)


class AdmissionsOverviewTool(BaseErpTool):
    name = "admissions_overview"
    description = (
        "Analyzes admissions across both `admission_applications` and legacy `admissions` tables, "
        "transport/hostel demand among applicants, scholarship/discount opt-ins, and active student discrepancies."
    )
    module = "admissions"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Receptionist", "Accountant")
    input_model = AdmissionsOverviewInput

    async def _run(self, ctx: AiSecurityContext, params: AdmissionsOverviewInput) -> ToolOutput:
        mysql = get_mysql_reader()
        scope = await resolve_scope_filters(ctx, requested_branch_name=params.branch_name, reader=mysql)
        branch_name = scope.get("branch_name")
        year_name = params.academic_year or scope.get("academic_year_name")

        app_where = ["TenantId = :tid"]
        qparams: dict[str, object] = {"tid": scope["tenant_id"], "lim": params.limit}
        if branch_name:
            app_where.append("LOWER(BranchName) = LOWER(:bname)")
            qparams["bname"] = branch_name
        if year_name:
            app_where.append("AcademicYear = :yname")
            qparams["yname"] = year_name
        if params.status:
            app_where.append("LOWER(Status) = LOWER(:st)")
            qparams["st"] = params.status

        apps_summary = await mysql.fetch_all(
            f"""
            SELECT Status, IsDeleted, COUNT(*) AS count,
                   SUM(CASE WHEN TransportRequired = 1 THEN 1 ELSE 0 END) AS transport_requested,
                   SUM(CASE WHEN Scholarship = 1 THEN 1 ELSE 0 END) AS with_scholarship,
                   SUM(CASE WHEN Discount = 1 THEN 1 ELSE 0 END) AS with_discount,
                   COALESCE(SUM(SecurityDepositAmount), 0) AS security_deposit_total,
                   COALESCE(SUM(AdmissionFeeAmount), 0) AS admission_fee_total
            FROM admission_applications
            WHERE {join_where(app_where)}
            GROUP BY Status, IsDeleted
            """,
            qparams,
        )

        legacy_where = ["TenantId = :tid"]
        legacy_params: dict[str, object] = {"tid": scope["tenant_id"]}
        if scope.get("branch_id") is not None:
            legacy_where.append("branch_id = :bid")
            legacy_params["bid"] = int(scope["branch_id"])
        legacy_summary = await mysql.fetch_all(
            f"""
            SELECT status, is_deleted, admission_type, COUNT(*) AS count
            FROM admissions
            WHERE {join_where(legacy_where)}
            GROUP BY status, is_deleted, admission_type
            """,
            legacy_params,
        )

        recent_apps = await mysql.fetch_all(
            f"""
            SELECT Id, RegistrationNo, AdmissionNo, CONCAT(FirstName, ' ', LastName) AS student_name,
                   BranchName, AcademicYear, StudentType, TransportRequired, HostelBlock, Status, CreatedAt
            FROM admission_applications
            WHERE {join_where(app_where)} AND IsDeleted = 0
            ORDER BY CreatedAt DESC
            LIMIT :lim
            """,
            qparams,
        )

        total_apps = sum(int(r["count"] or 0) for r in apps_summary)
        total_legacy = sum(int(r["count"] or 0) for r in legacy_summary)
        contradictions: list[str] = []
        if total_apps != total_legacy:
            contradictions.append(
                f"Admissions dual-table divergence: `admission_applications` has {total_apps} rows while legacy `admissions` has {total_legacy} rows."
            )

        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=total_apps,
            summary=(
                f"Admissions pipeline: {total_apps} rows in admission_applications, {total_legacy} rows in legacy admissions."
            ),
            data={
                "admission_applications_breakdown": apps_summary,
                "legacy_admissions_breakdown": legacy_summary,
                "recent_applications": recent_apps,
            },
            contradictions=contradictions,
            visuals=[VisualArtifact(visual_type="table", title="Admissions Status Breakdown", data={"rows": apps_summary})],
        )
