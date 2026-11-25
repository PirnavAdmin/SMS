"""Student management ERP read-only tools backed by sms_new_test."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field

from app.integrations.mysql_reader import get_mysql_reader
from app.schemas.chat import VisualArtifact
from app.schemas.security import AiSecurityContext
from app.security.rbac import resolve_authorized_student_id
from app.tools.base import BaseErpTool, ToolOutput
from app.tools.erp_helpers import apply_branch_in_clause, apply_student_isolation_clause, join_where, resolve_scope_filters


class StudentOverviewInput(BaseModel):
    branch_id: Optional[int] = Field(default=None, description="Optional Branch ID filter")
    branch_name: Optional[str] = Field(default=None, description="Optional Branch name e.g. 'Madhapur Branch'")
    academic_year_id: Optional[int] = Field(default=None, description="Optional Academic Year ID")
    include_inactive: bool = Field(default=True, description="Include inactive/soft-deleted breakdown")


class StudentOverviewTool(BaseErpTool):
    name = "student_overview"
    description = (
        "Retrieves live student enrollment totals, active vs inactive counts, branch breakdown, "
        "class-wise and section-wise distribution, and gender mix from MySQL."
    )
    module = "students"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Teacher", "HR", "Accountant", "Receptionist")
    input_model = StudentOverviewInput

    async def _run(self, ctx: AiSecurityContext, params: StudentOverviewInput) -> ToolOutput:
        mysql = get_mysql_reader()
        scope = await resolve_scope_filters(
            ctx,
            requested_branch_id=params.branch_id,
            requested_branch_name=params.branch_name,
            requested_academic_year_id=params.academic_year_id,
            reader=mysql,
        )

        where = ["s.TenantId = :tenant_id"]
        qparams: dict[str, object] = {"tenant_id": scope["tenant_id"]}
        apply_branch_in_clause(where, qparams, scope, "s.branch_id")
        if scope.get("academic_year_id") is not None:
            where.append("s.academic_year_id = :ay_id")
            qparams["ay_id"] = int(scope["academic_year_id"])
        apply_student_isolation_clause(where, qparams, ctx, "s.student_id", "s.class_id")
        where_sql = join_where(where)

        totals = await mysql.fetch_one(
            f"""
            SELECT
                COUNT(*) AS total_rows,
                SUM(CASE WHEN s.is_deleted = 0 AND s.status = 'Active' THEN 1 ELSE 0 END) AS active_students,
                SUM(CASE WHEN s.is_deleted = 0 AND s.status <> 'Active' THEN 1 ELSE 0 END) AS non_active_not_deleted,
                SUM(CASE WHEN s.is_deleted = 1 THEN 1 ELSE 0 END) AS soft_deleted_rows,
                SUM(CASE WHEN s.is_deleted = 0 AND LOWER(s.gender) = 'male' THEN 1 ELSE 0 END) AS male_count,
                SUM(CASE WHEN s.is_deleted = 0 AND LOWER(s.gender) = 'female' THEN 1 ELSE 0 END) AS female_count
            FROM students s
            WHERE {where_sql}
            """,
            qparams,
        )

        by_branch = await mysql.fetch_all(
            f"""
            SELECT
                COALESCE(b.BranchName, CONCAT('Branch #', s.branch_id)) AS branch_name,
                s.branch_id,
                COUNT(*) AS total_rows,
                SUM(CASE WHEN s.is_deleted = 0 AND s.status = 'Active' THEN 1 ELSE 0 END) AS active_students
            FROM students s
            LEFT JOIN branches b ON b.BranchId = s.branch_id
            WHERE {where_sql}
            GROUP BY s.branch_id, b.BranchName
            ORDER BY active_students DESC
            """,
            qparams,
        )

        by_class = await mysql.fetch_all(
            f"""
            SELECT
                COALESCE(c.ClassName, CONCAT('Class #', s.class_id)) AS class_name,
                c.Capacity AS configured_capacity,
                SUM(CASE WHEN s.is_deleted = 0 AND s.status = 'Active' THEN 1 ELSE 0 END) AS active_students
            FROM students s
            LEFT JOIN classes c ON c.id = s.class_id
            WHERE {where_sql} AND s.is_deleted = 0
            GROUP BY s.class_id, c.ClassName, c.Capacity
            ORDER BY c.DisplayOrder ASC, active_students DESC
            """,
            qparams,
        )

        active_count = int((totals or {}).get("active_students") or 0)
        total_rows = int((totals or {}).get("total_rows") or 0)

        chart = VisualArtifact(
            visual_type="chart",
            title="Active Students by Class",
            data={
                "chartType": "bar",
                "labels": [r["class_name"] for r in by_class],
                "datasets": [{"label": "Active Students", "data": [int(r["active_students"] or 0) for r in by_class]}],
            },
        )
        table = VisualArtifact(
            visual_type="table",
            title="Class-wise Enrollment & Capacity",
            data={"rows": by_class},
        )

        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=total_rows,
            summary=(
                f"Live student registry has {active_count} active students "
                f"(out of {total_rows} total rows including inactive/deleted) across {len(by_branch)} branch(es) "
                f"and {len(by_class)} classes."
            ),
            data={
                "scope": scope,
                "totals": totals,
                "by_branch": by_branch,
                "by_class": by_class,
            },
            visuals=[chart, table],
        )


class StudentSearchInput(BaseModel):
    query: Optional[str] = Field(default=None, description="Student name, admission number, or father name")
    class_name: Optional[str] = Field(default=None, description="Filter by class name e.g. 'Class 10'")
    status: str = Field(default="Active", description="Filter by status: Active, Inactive, or All")
    branch_id: Optional[int] = None
    limit: int = Field(default=25, ge=1, le=100)


class StudentSearchTool(BaseErpTool):
    name = "student_search"
    description = (
        "Searches individual student records by name, admission number, class, status, or parent contact. "
        "Respects Parent, Student, Teacher, and Branch isolation."
    )
    module = "students"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Teacher", "HR", "Accountant", "Receptionist", "Parent", "Student", "Hostel Warden")
    input_model = StudentSearchInput

    async def _run(self, ctx: AiSecurityContext, params: StudentSearchInput) -> ToolOutput:
        mysql = get_mysql_reader()
        scope = await resolve_scope_filters(ctx, requested_branch_id=params.branch_id, reader=mysql)

        where = ["s.TenantId = :tenant_id", "s.is_deleted = 0"]
        qparams: dict[str, object] = {"tenant_id": scope["tenant_id"], "lim": params.limit}
        apply_branch_in_clause(where, qparams, scope, "s.branch_id")
        apply_student_isolation_clause(where, qparams, ctx, "s.student_id", "s.class_id")

        if params.status and params.status.lower() != "all":
            where.append("LOWER(s.status) = LOWER(:status)")
            qparams["status"] = params.status
        if params.class_name:
            where.append("LOWER(c.ClassName) LIKE LOWER(:cls)")
            qparams["cls"] = f"%{params.class_name.strip()}%"
        if params.query:
            where.append(
                "(LOWER(s.student_name) LIKE LOWER(:q) OR LOWER(s.admission_number) LIKE LOWER(:q) "
                "OR LOWER(s.father_name) LIKE LOWER(:q) OR s.father_mobile LIKE :q)"
            )
            qparams["q"] = f"%{params.query.strip()}%"

        rows = await mysql.fetch_all(
            f"""
            SELECT
                s.student_id, s.admission_number, s.roll_number, s.student_name, s.gender,
                c.ClassName AS class_name, cs.section_letter AS section,
                b.BranchName AS branch_name, s.father_name, s.father_mobile, s.email, s.status
            FROM students s
            LEFT JOIN classes c ON c.id = s.class_id
            LEFT JOIN class_sections cs ON cs.id = s.section_id
            LEFT JOIN branches b ON b.BranchId = s.branch_id
            WHERE {join_where(where)}
            ORDER BY s.student_id DESC
            LIMIT :lim
            """,
            qparams,
        )

        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=len(rows),
            summary=f"Found {len(rows)} matching student record(s).",
            data={"students": rows},
            visuals=[VisualArtifact(visual_type="table", title="Student Search Results", data={"rows": rows})] if rows else [],
        )


class StudentProfileInput(BaseModel):
    student_id: Optional[int] = Field(default=None, description="Numeric student_id")
    admission_number: Optional[str] = Field(default=None, description="Admission number e.g. 'ADM-2026-0393'")
    student_name: Optional[str] = Field(default=None, description="Exact or partial student name")


class StudentProfileTool(BaseErpTool):
    name = "student_profile"
    description = (
        "Retrieves a comprehensive 360-degree profile for a specific student: demographics, parent contacts, "
        "attendance summary, fee balances, payments, exams, hostel bed allocation, transport, and promotions."
    )
    module = "students"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Teacher", "Accountant", "Hostel Warden", "Parent", "Student")
    input_model = StudentProfileInput

    async def _run(self, ctx: AiSecurityContext, params: StudentProfileInput) -> ToolOutput:
        mysql = get_mysql_reader()
        resolved_sid = resolve_authorized_student_id(ctx, params.student_id)
        scope = await resolve_scope_filters(ctx, reader=mysql)

        where = ["s.TenantId = :tenant_id"]
        qparams: dict[str, object] = {"tenant_id": scope["tenant_id"]}
        apply_branch_in_clause(where, qparams, scope, "s.branch_id")
        apply_student_isolation_clause(where, qparams, ctx, "s.student_id", "s.class_id")

        if resolved_sid is not None:
            where.append("s.student_id = :target_sid")
            qparams["target_sid"] = resolved_sid
        elif params.admission_number:
            where.append("LOWER(s.admission_number) = LOWER(:adm)")
            qparams["adm"] = params.admission_number.strip()
        elif params.student_name:
            where.append("LOWER(s.student_name) LIKE LOWER(:sname)")
            qparams["sname"] = f"%{params.student_name.strip()}%"
        else:
            return ToolOutput(
                success=False,
                module=self.module,
                summary="Provide student_id, admission_number, or student_name.",
                error="Missing student identifier.",
            )

        student = await mysql.fetch_one(
            f"""
            SELECT s.*, c.ClassName AS class_name, cs.section_letter AS section, b.BranchName AS branch_name
            FROM students s
            LEFT JOIN classes c ON c.id = s.class_id
            LEFT JOIN class_sections cs ON cs.id = s.section_id
            LEFT JOIN branches b ON b.BranchId = s.branch_id
            WHERE {join_where(where)}
            ORDER BY s.is_deleted ASC, s.student_id DESC
            LIMIT 1
            """,
            qparams,
        )
        if not student:
            return ToolOutput(
                success=False,
                module=self.module,
                summary="No matching authorized student record found.",
                error="Student not found or outside authorized scope.",
            )

        sid = int(student["student_id"])
        adm = str(student.get("admission_number") or "")

        attendance = await mysql.fetch_one(
            """
            SELECT
                COUNT(*) AS total_sessions,
                SUM(CASE WHEN LOWER(sa.Status) = 'present' THEN 1 ELSE 0 END) AS present_count,
                SUM(CASE WHEN LOWER(sa.Status) = 'absent' THEN 1 ELSE 0 END) AS absent_count,
                SUM(CASE WHEN LOWER(sa.Status) = 'late' THEN 1 ELSE 0 END) AS late_count
            FROM student_attendances sa
            WHERE sa.TenantId = :tid AND sa.StudentId = :sid
            """,
            {"tid": scope["tenant_id"], "sid": sid},
        )
        fees = await mysql.fetch_all(
            """
            SELECT Id, DynamicFeeStructureId, TotalAmount, PaidAmount, DueAmount, Status, FeePolicy
            FROM studentfeeassignments
            WHERE TenantId = :tid AND StudentId = :sid_str
            """,
            {"tid": scope["tenant_id"], "sid_str": str(sid)},
        )
        payments = await mysql.fetch_all(
            """
            SELECT ReceiptNo, Amount, PaymentDate, PaymentMethod, Status, TermName, FeeHeadName
            FROM feepayments
            WHERE TenantId = :tid AND StudentId = :sid_str
            ORDER BY PaymentDate DESC
            """,
            {"tid": scope["tenant_id"], "sid_str": str(sid)},
        )
        exams = await mysql.fetch_all(
            """
            SELECT r.exam_id, e.exam_name, r.total_marks_obtained, r.total_max_marks, r.percentage, r.grade, r.rank, r.result_status
            FROM new_student_exam_results r
            LEFT JOIN new_examinations e ON e.exam_id = r.exam_id
            WHERE r.TenantId = :tid AND (r.student_id = :sid OR r.admission_no = :adm)
            ORDER BY r.calculated_at DESC
            """,
            {"tid": scope["tenant_id"], "sid": sid, "adm": adm},
        )
        hostel = await mysql.fetch_all(
            """
            SELECT sba.AllocationId, hb.HostelName, rm.RoomNumber, sba.BedNumber, sba.Status, sba.JoiningDate
            FROM student_bed_allocations sba
            LEFT JOIN hostel_blocks hb ON hb.HostelId = sba.HostelId
            LEFT JOIN room_masters rm ON rm.RoomId = sba.RoomId
            WHERE sba.TenantId = :tid AND (sba.StudentId = :sid OR sba.RegistrationNo = :adm)
            """,
            {"tid": scope["tenant_id"], "sid": sid, "adm": adm},
        )
        transport = await mysql.fetch_all(
            """
            SELECT sta.StudentTransportAssignmentId, tr.RouteName, tpp.PickupPointName, sta.TransportType, sta.Status
            FROM student_transport_assignments sta
            LEFT JOIN transport_routes tr ON tr.RouteId = sta.RouteId
            LEFT JOIN transport_pickup_points tpp ON tpp.PickupPointId = sta.PickupPointId
            WHERE sta.TenantId = :tid AND sta.IsDeleted = 0 AND (sta.StudentId = :sid OR sta.AdmissionNo = :adm)
            """,
            {"tid": scope["tenant_id"], "sid": sid, "adm": adm},
        )

        total_att = int((attendance or {}).get("total_sessions") or 0)
        present_att = int((attendance or {}).get("present_count") or 0)
        att_pct = round((present_att / total_att) * 100.0, 2) if total_att > 0 else None

        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=1,
            summary=(
                f"360° profile for {student['student_name']} ({adm}, {student.get('class_name')} {student.get('section') or ''}): "
                f"attendance={att_pct if att_pct is not None else 'N/A'}% ({present_att}/{total_att}), "
                f"fee assignments={len(fees)}, payments={len(payments)}, exam results={len(exams)}."
            ),
            data={
                "student": student,
                "attendance_summary": {**(attendance or {}), "attendance_pct": att_pct},
                "fee_assignments": fees,
                "fee_payments": payments,
                "exam_results": exams,
                "hostel_allocations": hostel,
                "transport_assignments": transport,
            },
        )
