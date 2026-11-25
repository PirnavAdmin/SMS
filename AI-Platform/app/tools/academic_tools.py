"""Academic structure, timetables, and homework ERP tools."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field

from app.integrations.mysql_reader import get_mysql_reader
from app.schemas.chat import VisualArtifact
from app.schemas.security import AiSecurityContext
from app.security.rbac import assert_class_scope
from app.tools.base import BaseErpTool, ToolOutput
from app.tools.erp_helpers import join_where, resolve_scope_filters


class AcademicStructureInput(BaseModel):
    academic_year: Optional[str] = None


class AcademicStructureTool(BaseErpTool):
    name = "academic_structure"
    description = "Lists configured classes, sections, seat capacities, active enrolled counts, and curriculum subjects."
    module = "academics"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Teacher", "HR", "Receptionist", "Parent", "Student")
    input_model = AcademicStructureInput

    async def _run(self, ctx: AiSecurityContext, params: AcademicStructureInput) -> ToolOutput:
        mysql = get_mysql_reader()
        scope = await resolve_scope_filters(ctx, reader=mysql)
        tid = scope["tenant_id"]

        classes = await mysql.fetch_all(
            """
            SELECT c.id, c.ClassName, c.CampusLocation, c.AcademicYear, c.Capacity, c.ClassTeacher, c.status,
                   COUNT(DISTINCT cs.id) AS section_count,
                   COUNT(DISTINCT CASE WHEN s.is_deleted = 0 AND s.status = 'Active' THEN s.student_id END) AS active_students
            FROM classes c
            LEFT JOIN class_sections cs ON cs.class_id = c.id
            LEFT JOIN students s ON s.class_id = c.id AND s.TenantId = :tid
            WHERE c.TenantId = :tid
            GROUP BY c.id, c.ClassName, c.CampusLocation, c.AcademicYear, c.Capacity, c.ClassTeacher, c.status, c.DisplayOrder
            ORDER BY c.DisplayOrder ASC, c.id ASC
            """,
            {"tid": tid},
        )
        subjects = await mysql.fetch_all(
            "SELECT SubjectId, SubjectCode, SubjectName, CourseCode, AcademicClassId, DepartmentId FROM subjects WHERE TenantId = :tid ORDER BY SubjectName",
            {"tid": tid},
        )
        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=len(classes),
            summary=f"Retrieved {len(classes)} configured classes and {len(subjects)} curriculum subjects.",
            data={"classes": classes, "subjects": subjects},
            visuals=[VisualArtifact(visual_type="table", title="Academic Classes & Enrollment", data={"rows": classes})],
        )


class TimetableInput(BaseModel):
    class_id: Optional[int] = None
    day_of_week: Optional[str] = Field(default=None, description="e.g. Monday, Tuesday")


class TimetableScheduleTool(BaseErpTool):
    name = "timetable_schedule"
    description = "Retrieves class timetable headers and assigned period slots with teachers, subjects, and rooms."
    module = "academics"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Teacher", "Student", "Parent")
    input_model = TimetableInput

    async def _run(self, ctx: AiSecurityContext, params: TimetableInput) -> ToolOutput:
        assert_class_scope(ctx, params.class_id)
        mysql = get_mysql_reader()
        tid = ctx.tenant_id

        where = ["th.TenantId = :tid"]
        qparams: dict[str, object] = {"tid": tid}
        if params.class_id is not None:
            where.append("th.ClassId = :cid")
            qparams["cid"] = params.class_id
        elif ctx.role == "Teacher" and ctx.assigned_class_ids:
            ph = [f":tc_{i}" for i, _ in enumerate(ctx.assigned_class_ids)]
            for i, cid in enumerate(ctx.assigned_class_ids):
                qparams[f"tc_{i}"] = cid
            where.append(f"th.ClassId IN ({', '.join(ph)})")

        if params.day_of_week:
            where.append("LOWER(ts.DayOfWeek) = LOWER(:dow)")
            qparams["dow"] = params.day_of_week.strip()

        slots = await mysql.fetch_all(
            f"""
            SELECT th.HeaderId, th.AcademicYear, th.BranchName, c.ClassName, cs.section_letter,
                   ts.DayOfWeek, ts.StartTime, ts.EndTime, sub.SubjectName,
                   CONCAT(COALESCE(st.FirstName,''), ' ', COALESCE(st.LastName,'')) AS teacher_name,
                   ts.RoomNo, th.Status
            FROM timetable_headers th
            JOIN timetable_slots ts ON ts.HeaderId = th.HeaderId
            LEFT JOIN classes c ON c.id = th.ClassId
            LEFT JOIN class_sections cs ON cs.id = th.SectionId
            LEFT JOIN subjects sub ON sub.SubjectId = ts.SubjectId
            LEFT JOIN staff st ON st.StaffId = ts.TeacherId
            WHERE {join_where(where)}
            ORDER BY c.DisplayOrder ASC, ts.DayOfWeek, ts.StartTime
            LIMIT 120
            """,
            qparams,
        )
        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=len(slots),
            summary=f"Retrieved {len(slots)} timetable slot(s).",
            data={"timetable_slots": slots},
            visuals=[VisualArtifact(visual_type="table", title="Class Timetable Slots", data={"rows": slots})] if slots else [],
        )


class HomeworkInput(BaseModel):
    class_name: Optional[str] = None
    limit: int = Field(default=30, ge=1, le=100)


class HomeworkAssignmentsTool(BaseErpTool):
    name = "homework_assignments"
    description = "Lists published homework assignments by class, subject, due date, and submission counts."
    module = "academics"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Teacher", "Student", "Parent")
    input_model = HomeworkInput

    async def _run(self, ctx: AiSecurityContext, params: HomeworkInput) -> ToolOutput:
        mysql = get_mysql_reader()
        where = ["TenantId = :tid"]
        qparams: dict[str, object] = {"tid": ctx.tenant_id, "lim": params.limit}
        if params.class_name:
            where.append("LOWER(ClassName) LIKE LOWER(:cname)")
            qparams["cname"] = f"%{params.class_name.strip()}%"
        rows = await mysql.fetch_all(
            f"""
            SELECT HomeworkId, ClassName, ClassRoom, SubjectName, Title, Topic, DueDate,
                   TeacherName, SubmissionsCount, Status, CreatedAt
            FROM homeworks
            WHERE {join_where(where)}
            ORDER BY CreatedAt DESC
            LIMIT :lim
            """,
            qparams,
        )
        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=len(rows),
            summary=f"Retrieved {len(rows)} homework assignment(s).",
            data={"homeworks": rows},
        )
