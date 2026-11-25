"""Faculty, Staff HR, Attendance, Leave, Payroll, and Workshop tools."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field

from app.integrations.mysql_reader import get_mysql_reader
from app.schemas.chat import VisualArtifact
from app.schemas.security import AiSecurityContext
from app.security.rbac import EXECUTIVE_ROLES
from app.tools.base import BaseErpTool, ToolOutput
from app.tools.erp_helpers import join_where, resolve_scope_filters


class StaffDirectoryInput(BaseModel):
    department: Optional[str] = None
    category: Optional[str] = Field(default=None, description="e.g. 'Teaching Staff' or 'Non-Teaching Staff'")
    search: Optional[str] = None
    active_only: bool = True
    limit: int = Field(default=50, ge=1, le=200)


class StaffDirectoryTool(BaseErpTool):
    name = "staff_directory"
    description = (
        "Retrieves faculty and staff directory counts by department/category/branch, designations, "
        "and primary subjects. Redacts salary/PII columns unless role is HR/Accountant/Executive."
    )
    module = "staff_hr"
    allowed_roles = ("Super Admin", "Admin", "Principal", "HR", "Accountant", "Teacher", "Staff", "Receptionist")
    input_model = StaffDirectoryInput

    async def _run(self, ctx: AiSecurityContext, params: StaffDirectoryInput) -> ToolOutput:
        mysql = get_mysql_reader()
        scope = await resolve_scope_filters(ctx, reader=mysql)
        can_view_compensation = ctx.role in (EXECUTIVE_ROLES | {"HR", "Accountant"})

        where = ["TenantId = :tid"]
        qparams: dict[str, object] = {"tid": scope["tenant_id"], "lim": params.limit}
        if params.active_only:
            where.append("IsActive = 1")
        if scope.get("branch_name") and not scope.get("is_executive"):
            where.append("LOWER(BranchName) = LOWER(:bname)")
            qparams["bname"] = scope["branch_name"]
        if params.department:
            where.append("LOWER(Department) LIKE LOWER(:dept)")
            qparams["dept"] = f"%{params.department.strip()}%"
        if params.category:
            where.append("LOWER(EmployeeCategory) LIKE LOWER(:cat)")
            qparams["cat"] = f"%{params.category.strip()}%"
        if params.search:
            where.append("(LOWER(FirstName) LIKE LOWER(:q) OR LOWER(LastName) LIKE LOWER(:q) OR LOWER(EmployeeId) LIKE LOWER(:q))")
            qparams["q"] = f"%{params.search.strip()}%"

        comp_cols = ", MonthlySalary, GrossSalary, NetSalary" if can_view_compensation else ""
        rows = await mysql.fetch_all(
            f"""
            SELECT StaffId, EmployeeId, EmployeeCategory,
                   CONCAT(COALESCE(FirstName,''), ' ', COALESCE(LastName,'')) AS full_name,
                   Designation, Department, SystemRole, BranchName, PrimarySubject,
                   IsActive, CasualLeaveBalance, SickLeaveBalance, EarnedLeaveBalance
                   {comp_cols}
            FROM staff
            WHERE {join_where(where)}
            ORDER BY StaffId ASC
            LIMIT :lim
            """,
            qparams,
        )

        dept_summary = await mysql.fetch_all(
            f"""
            SELECT COALESCE(Department, 'Unassigned') AS department, COUNT(*) AS staff_count
            FROM staff
            WHERE {join_where(where)}
            GROUP BY Department
            ORDER BY staff_count DESC
            """,
            qparams,
        )

        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=len(rows),
            summary=f"Retrieved {len(rows)} staff record(s) across {len(dept_summary)} departments.",
            data={"staff": rows, "by_department": dept_summary, "compensation_visible": can_view_compensation},
            visuals=[VisualArtifact(visual_type="table", title="Department Staff Summary", data={"rows": dept_summary})],
        )


class StaffAttendanceLeaveInput(BaseModel):
    status: Optional[str] = Field(default=None, description="Leave status e.g. Pending, Approved, Rejected")
    limit: int = Field(default=40, ge=1, le=200)


class StaffAttendanceLeaveTool(BaseErpTool):
    name = "staff_attendance_leave"
    description = (
        "Retrieves staff daily attendance logs (`staff_attendances`) and employee leave applications (`leave_applications`). "
        "Non-privileged teachers/staff only see their own leave records."
    )
    module = "staff_hr"
    allowed_roles = ("Super Admin", "Admin", "Principal", "HR", "Teacher", "Staff")
    input_model = StaffAttendanceLeaveInput

    async def _run(self, ctx: AiSecurityContext, params: StaffAttendanceLeaveInput) -> ToolOutput:
        mysql = get_mysql_reader()
        scope = await resolve_scope_filters(ctx, reader=mysql)
        privileged = ctx.role in (EXECUTIVE_ROLES | {"HR"})

        att_where = ["sa.TenantId = :tid"]
        qparams: dict[str, object] = {"tid": scope["tenant_id"], "lim": params.limit}
        if not privileged:
            att_where.append("sa.StaffId = :auth_staff_id")
            qparams["auth_staff_id"] = ctx.staff_id or -1
        elif scope.get("branch_name") and not scope.get("is_executive"):
            att_where.append("LOWER(sa.Branch) = LOWER(:bname)")
            qparams["bname"] = scope["branch_name"]

        att_summary = await mysql.fetch_all(
            f"""
            SELECT sa.Status, COUNT(*) AS count
            FROM staff_attendances sa
            WHERE {join_where(att_where)}
            GROUP BY sa.Status
            """,
            qparams,
        )

        leave_where = ["la.TenantId = :tid"]
        if not privileged:
            leave_where.append("la.StaffId = :auth_staff_id")
        if params.status:
            leave_where.append("LOWER(la.Status) = LOWER(:lst)")
            qparams["lst"] = params.status.strip()

        leaves = await mysql.fetch_all(
            f"""
            SELECT la.LeaveApplicationId, la.StaffId,
                   CONCAT(COALESCE(s.FirstName,''), ' ', COALESCE(s.LastName,'')) AS staff_name,
                   s.Department, s.Designation, la.FromDate, la.ToDate, la.RequestedDays,
                   la.Reason, la.Status, la.AppliedDate, la.ApprovedBy
            FROM leave_applications la
            LEFT JOIN staff s ON s.StaffId = la.StaffId
            WHERE {join_where(leave_where)}
            ORDER BY la.AppliedDate DESC
            LIMIT :lim
            """,
            qparams,
        )

        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=len(leaves),
            summary=f"Staff attendance groups: {len(att_summary)}; leave applications retrieved: {len(leaves)}.",
            data={"attendance_breakdown": att_summary, "leave_applications": leaves},
            visuals=[VisualArtifact(visual_type="table", title="Staff Leave Applications", data={"rows": leaves})] if leaves else [],
        )


class PayrollSummaryInput(BaseModel):
    month: Optional[int] = Field(default=None, ge=1, le=12)
    year: Optional[int] = None
    limit: int = Field(default=50, ge=1, le=200)


class PayrollSummaryTool(BaseErpTool):
    name = "payroll_summary"
    description = (
        "Analyzes staff payslips, monthly gross earnings, PF/ESI/LOP deductions, net disbursement totals, "
        "and salary structure templates."
    )
    module = "staff_hr"
    allowed_roles = ("Super Admin", "Admin", "Principal", "HR", "Accountant")
    input_model = PayrollSummaryInput

    async def _run(self, ctx: AiSecurityContext, params: PayrollSummaryInput) -> ToolOutput:
        mysql = get_mysql_reader()
        scope = await resolve_scope_filters(ctx, reader=mysql)
        where = ["TenantId = :tid"]
        qparams: dict[str, object] = {"tid": scope["tenant_id"], "lim": params.limit}
        if params.month is not None:
            where.append("Month = :m")
            qparams["m"] = params.month
        if params.year is not None:
            where.append("Year = :y")
            qparams["y"] = params.year
        if scope.get("branch_name") and not scope.get("is_executive"):
            where.append("LOWER(Branch) = LOWER(:bname)")
            qparams["bname"] = scope["branch_name"]

        monthly_totals = await mysql.fetch_all(
            f"""
            SELECT Year, Month, Status, COUNT(*) AS payslip_count,
                   COALESCE(SUM(GrossEarnings), 0) AS total_gross,
                   COALESCE(SUM(TotalDeductions), 0) AS total_deductions,
                   COALESCE(SUM(NetPay), 0) AS total_net_pay
            FROM payslips
            WHERE {join_where(where)}
            GROUP BY Year, Month, Status
            ORDER BY Year DESC, Month DESC
            """,
            qparams,
        )

        structures = await mysql.fetch_all(
            """
            SELECT StructureId, StructureCode, StructureName, Department, Designation,
                   MonthlyGrossSalary, AssignedEmployeesCount, Status
            FROM salary_structures
            WHERE TenantId = :tid
            """,
            {"tid": scope["tenant_id"]},
        )

        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=sum(int(r["payslip_count"] or 0) for r in monthly_totals),
            summary=f"Payroll summary across {len(monthly_totals)} month/status group(s) and {len(structures)} salary structure(s).",
            data={"monthly_totals": monthly_totals, "salary_structures": structures},
            visuals=[VisualArtifact(visual_type="table", title="Payroll Monthly Summary", data={"rows": monthly_totals})],
        )


class FacultyWorkshopsTool(BaseErpTool):
    name = "faculty_workshops"
    description = "Lists faculty development workshops, participant completion metrics, scores, and issued certificates."
    module = "staff_hr"
    allowed_roles = ("Super Admin", "Admin", "Principal", "HR", "Teacher")

    async def _run(self, ctx: AiSecurityContext, params: BaseModel) -> ToolOutput:
        mysql = get_mysql_reader()
        tid = ctx.tenant_id
        workshops = await mysql.fetch_all(
            "SELECT id, title, trainer_name, organization, venue, start_date, end_date, category, branch, status FROM faculty_workshops WHERE TenantId = :tid",
            {"tid": tid},
        )
        participations = await mysql.fetch_all(
            """
            SELECT p.id, p.workshop_id, w.title AS workshop_title, p.staff_id,
                   CONCAT(COALESCE(s.FirstName,''), ' ', COALESCE(s.LastName,'')) AS staff_name,
                   p.registration_status, p.assessment_score, p.certificate_issued, p.certificate_number, p.issued_date
            FROM faculty_training_participations p
            LEFT JOIN faculty_workshops w ON w.id = p.workshop_id
            LEFT JOIN staff s ON s.StaffId = p.staff_id
            WHERE p.TenantId = :tid
            """,
            {"tid": tid},
        )
        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=len(participations),
            summary=f"Found {len(workshops)} workshop(s) and {len(participations)} faculty participation record(s).",
            data={"workshops": workshops, "participations": participations},
        )
