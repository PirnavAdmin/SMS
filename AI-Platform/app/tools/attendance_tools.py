"""Attendance analytics and low-attendance student identification tools."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field

from app.integrations.mysql_reader import get_mysql_reader
from app.schemas.chat import VisualArtifact
from app.schemas.security import AiSecurityContext
from app.tools.base import BaseErpTool, ToolOutput
from app.tools.erp_helpers import apply_branch_in_clause, apply_student_isolation_clause, join_where, resolve_scope_filters


class AttendanceOverviewInput(BaseModel):
    branch_id: Optional[int] = None
    branch_name: Optional[str] = None
    from_date: Optional[str] = Field(default=None, description="Start date YYYY-MM-DD")
    to_date: Optional[str] = Field(default=None, description="End date YYYY-MM-DD")


class AttendanceOverviewTool(BaseErpTool):
    name = "attendance_overview"
    description = (
        "Retrieves live student attendance session metrics, overall present/absent/late rates, "
        "class-wise attendance rates, and date coverage from `student_attendance_sessions` & `student_attendances`."
    )
    module = "attendance"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Teacher", "HR")
    input_model = AttendanceOverviewInput

    async def _run(self, ctx: AiSecurityContext, params: AttendanceOverviewInput) -> ToolOutput:
        mysql = get_mysql_reader()
        scope = await resolve_scope_filters(
            ctx, requested_branch_id=params.branch_id, requested_branch_name=params.branch_name, reader=mysql
        )

        where = ["sess.TenantId = :tid"]
        qparams: dict[str, object] = {"tid": scope["tenant_id"]}
        apply_branch_in_clause(where, qparams, scope, "sess.BranchId")
        if scope.get("academic_year_id") is not None:
            where.append("sess.AcademicYearId = :ay_id")
            qparams["ay_id"] = int(scope["academic_year_id"])
        if ctx.role == "Teacher" and ctx.assigned_class_ids:
            ph = [f":tc_{i}" for i, _ in enumerate(ctx.assigned_class_ids)]
            for i, cid in enumerate(ctx.assigned_class_ids):
                qparams[f"tc_{i}"] = cid
            where.append(f"sess.ClassId IN ({', '.join(ph)})")
        if params.from_date:
            where.append("sess.AttendanceDate >= :fd")
            qparams["fd"] = params.from_date
        if params.to_date:
            where.append("sess.AttendanceDate <= :td")
            qparams["td"] = params.to_date
        wsql = join_where(where)

        overall = await mysql.fetch_one(
            f"""
            SELECT
                COUNT(DISTINCT sess.AttendanceSessionId) AS session_count,
                MIN(sess.AttendanceDate) AS earliest_date,
                MAX(sess.AttendanceDate) AS latest_date,
                COUNT(sa.Id) AS total_marks,
                SUM(CASE WHEN LOWER(sa.Status) = 'present' THEN 1 ELSE 0 END) AS present_marks,
                SUM(CASE WHEN LOWER(sa.Status) = 'absent' THEN 1 ELSE 0 END) AS absent_marks,
                SUM(CASE WHEN LOWER(sa.Status) = 'late' THEN 1 ELSE 0 END) AS late_marks
            FROM student_attendance_sessions sess
            LEFT JOIN student_attendances sa ON sa.AttendanceSessionId = sess.AttendanceSessionId
            WHERE {wsql}
            """,
            qparams,
        )

        by_class = await mysql.fetch_all(
            f"""
            SELECT
                COALESCE(c.ClassName, CONCAT('Class #', sess.ClassId)) AS class_name,
                COUNT(DISTINCT sess.AttendanceSessionId) AS sessions,
                COUNT(sa.Id) AS total_records,
                SUM(CASE WHEN LOWER(sa.Status) = 'present' THEN 1 ELSE 0 END) AS present_count,
                ROUND(100.0 * SUM(CASE WHEN LOWER(sa.Status) = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(sa.Id), 0), 2) AS attendance_pct
            FROM student_attendance_sessions sess
            LEFT JOIN student_attendances sa ON sa.AttendanceSessionId = sess.AttendanceSessionId
            LEFT JOIN classes c ON c.id = sess.ClassId
            WHERE {wsql}
            GROUP BY sess.ClassId, c.ClassName
            ORDER BY attendance_pct ASC
            """,
            qparams,
        )

        total_marks = int((overall or {}).get("total_marks") or 0)
        present_marks = int((overall or {}).get("present_marks") or 0)
        rate = round((present_marks / total_marks) * 100.0, 2) if total_marks > 0 else 0.0

        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=total_marks,
            summary=(
                f"Attendance spans {(overall or {}).get('session_count', 0)} sessions "
                f"({(overall or {}).get('earliest_date')} to {(overall or {}).get('latest_date')}), "
                f"overall present rate {rate}% ({present_marks}/{total_marks} records)."
            ),
            data={"overall": {**(overall or {}), "overall_attendance_pct": rate}, "by_class": by_class},
            visuals=[VisualArtifact(visual_type="table", title="Class-wise Attendance Rates", data={"rows": by_class})],
        )


class LowAttendanceInput(BaseModel):
    threshold_pct: float = Field(default=75.0, ge=0.0, le=100.0, description="Flag students below this percentage")
    min_sessions: int = Field(default=3, ge=1, le=50)
    branch_id: Optional[int] = None
    limit: int = Field(default=50, ge=1, le=200)


class StudentLowAttendanceTool(BaseErpTool):
    name = "student_low_attendance"
    description = (
        "Computes individual student attendance percentages across recorded sessions and returns students "
        "below threshold_pct (e.g. <75%). Honors Teacher, Parent, Student, and Branch scopes."
    )
    module = "attendance"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Teacher", "Parent", "Student")
    input_model = LowAttendanceInput

    async def _run(self, ctx: AiSecurityContext, params: LowAttendanceInput) -> ToolOutput:
        mysql = get_mysql_reader()
        scope = await resolve_scope_filters(ctx, requested_branch_id=params.branch_id, reader=mysql)
        where = ["s.TenantId = :tid", "s.is_deleted = 0"]
        qparams: dict[str, object] = {
            "tid": scope["tenant_id"],
            "min_sess": params.min_sessions,
            "thresh": params.threshold_pct,
            "lim": params.limit,
        }
        apply_branch_in_clause(where, qparams, scope, "s.branch_id")
        apply_student_isolation_clause(where, qparams, ctx, "s.student_id", "s.class_id")

        rows = await mysql.fetch_all(
            f"""
            SELECT
                s.student_id, s.admission_number, s.student_name,
                c.ClassName AS class_name, cs.section_letter AS section,
                COUNT(sa.Id) AS total_sessions,
                SUM(CASE WHEN LOWER(sa.Status) = 'present' THEN 1 ELSE 0 END) AS present_sessions,
                SUM(CASE WHEN LOWER(sa.Status) = 'absent' THEN 1 ELSE 0 END) AS absent_sessions,
                ROUND(100.0 * SUM(CASE WHEN LOWER(sa.Status) = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(sa.Id), 0), 2) AS attendance_pct
            FROM students s
            JOIN student_attendances sa ON sa.StudentId = s.student_id AND sa.TenantId = :tid
            LEFT JOIN classes c ON c.id = s.class_id
            LEFT JOIN class_sections cs ON cs.id = s.section_id
            WHERE {join_where(where)}
            GROUP BY s.student_id, s.admission_number, s.student_name, c.ClassName, cs.section_letter
            HAVING COUNT(sa.Id) >= :min_sess
               AND (100.0 * SUM(CASE WHEN LOWER(sa.Status) = 'present' THEN 1 ELSE 0 END) / COUNT(sa.Id)) < :thresh
            ORDER BY attendance_pct ASC, absent_sessions DESC
            LIMIT :lim
            """,
            qparams,
        )

        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=len(rows),
            summary=f"Identified {len(rows)} student(s) with attendance below {params.threshold_pct}% (min {params.min_sessions} sessions).",
            data={"threshold_pct": params.threshold_pct, "students": rows},
            visuals=[VisualArtifact(visual_type="table", title=f"Students Below {params.threshold_pct}% Attendance", data={"rows": rows})] if rows else [],
        )
