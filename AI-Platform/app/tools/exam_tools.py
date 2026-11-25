"""Examinations, marks, and student result analytics tools."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field

from app.integrations.mysql_reader import get_mysql_reader
from app.schemas.chat import VisualArtifact
from app.schemas.security import AiSecurityContext
from app.tools.base import BaseErpTool, ToolOutput
from app.tools.erp_helpers import apply_student_isolation_clause, join_where, resolve_scope_filters


class ExaminationResultsInput(BaseModel):
    exam_name: Optional[str] = None
    class_name: Optional[str] = None
    student_id: Optional[int] = None
    limit: int = Field(default=40, ge=1, le=200)


class ExaminationResultsTool(BaseErpTool):
    name = "examination_results"
    description = (
        "Retrieves examination schedules, timetable slots, student overall exam results (percentage, grade, rank, pass/fail), "
        "and subject-wise marks. Honors Student, Parent, and Teacher isolation."
    )
    module = "examination"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Teacher", "Parent", "Student")
    input_model = ExaminationResultsInput

    async def _run(self, ctx: AiSecurityContext, params: ExaminationResultsInput) -> ToolOutput:
        mysql = get_mysql_reader()
        scope = await resolve_scope_filters(ctx, reader=mysql)
        tid = scope["tenant_id"]

        exams = await mysql.fetch_all(
            "SELECT exam_id, exam_name, assessment_type, academic_term, start_date, end_date, applicable_classes, status FROM new_examinations WHERE TenantId = :tid ORDER BY start_date DESC",
            {"tid": tid},
        )

        res_where = ["r.TenantId = :tid"]
        qparams: dict[str, object] = {"tid": tid, "lim": params.limit}
        if params.exam_name:
            res_where.append("LOWER(e.exam_name) LIKE LOWER(:ename)")
            qparams["ename"] = f"%{params.exam_name.strip()}%"
        if params.class_name:
            res_where.append("LOWER(r.class_name) LIKE LOWER(:cname)")
            qparams["cname"] = f"%{params.class_name.strip()}%"

        if ctx.role in {"Student", "Parent"}:
            apply_student_isolation_clause(res_where, qparams, ctx, "r.student_id", "s.class_id")
        elif ctx.role == "Teacher" and ctx.assigned_class_ids:
            ph = [f":tc_{i}" for i, _ in enumerate(ctx.assigned_class_ids)]
            for i, cid in enumerate(ctx.assigned_class_ids):
                qparams[f"tc_{i}"] = cid
            res_where.append(f"s.class_id IN ({', '.join(ph)})")
        elif params.student_id is not None:
            res_where.append("r.student_id = :rsid")
            qparams["rsid"] = params.student_id

        results = await mysql.fetch_all(
            f"""
            SELECT r.result_id, e.exam_name, r.class_name, r.section_name, r.student_id,
                   r.admission_no, r.student_name, r.total_marks_obtained, r.total_max_marks,
                   r.percentage, r.grade, r.rank, r.result_status
            FROM new_student_exam_results r
            LEFT JOIN new_examinations e ON e.exam_id = r.exam_id
            LEFT JOIN students s ON s.student_id = r.student_id
            WHERE {join_where(res_where)}
            ORDER BY r.percentage DESC
            LIMIT :lim
            """,
            qparams,
        )

        class_perf = await mysql.fetch_all(
            f"""
            SELECT e.exam_name, r.class_name, COUNT(*) AS evaluated_students,
                   ROUND(AVG(r.percentage), 2) AS avg_percentage,
                   SUM(CASE WHEN LOWER(r.result_status) = 'pass' THEN 1 ELSE 0 END) AS pass_count
            FROM new_student_exam_results r
            LEFT JOIN new_examinations e ON e.exam_id = r.exam_id
            LEFT JOIN students s ON s.student_id = r.student_id
            WHERE {join_where(res_where)}
            GROUP BY e.exam_name, r.class_name
            ORDER BY avg_percentage DESC
            """,
            qparams,
        )

        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=len(results),
            summary=f"Found {len(exams)} examination(s), {len(results)} student result record(s) retrieved.",
            data={"examinations": exams, "class_performance": class_perf, "results": results},
            visuals=[VisualArtifact(visual_type="table", title="Examination Performance Summary", data={"rows": class_perf or results})],
        )
