"""Library catalog, issue/return records, overdue fines, and library timetable tools."""

from __future__ import annotations

from pydantic import BaseModel

from app.integrations.mysql_reader import get_mysql_reader
from app.schemas.chat import VisualArtifact
from app.schemas.security import AiSecurityContext
from app.tools.base import BaseErpTool, ToolOutput
from app.tools.erp_helpers import join_where


class LibraryOperationsTool(BaseErpTool):
    name = "library_operations"
    description = (
        "Retrieves library book catalog inventory, copies available, issued/overdue book records, "
        "and library timetable slots."
    )
    module = "library"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Librarian", "Teacher", "Student")

    async def _run(self, ctx: AiSecurityContext, params: BaseModel) -> ToolOutput:
        mysql = get_mysql_reader()
        tid = ctx.tenant_id

        books = await mysql.fetch_all(
            "SELECT BookId, Title, Author, Category, RackLocation, TotalCopies, AvailableCopies FROM librarybooks WHERE TenantId = :tid",
            {"tid": tid},
        )
        where_issue = ["TenantId = :tid"]
        qparams: dict[str, object] = {"tid": tid}
        if ctx.role == "Student":
            where_issue.append("StudentId = :sid")
            qparams["sid"] = ctx.student_id or -1

        issues = await mysql.fetch_all(
            f"""
            SELECT IssueId, BookId, BookTitle, BorrowerName, BorrowerRole, BorrowerIdCode,
                   IssueDate, DueDate, ReturnDate, FineAmount, Status
            FROM libraryissuerecords
            WHERE {join_where(where_issue)}
            ORDER BY IssueDate DESC
            """,
            qparams,
        )
        slots = await mysql.fetch_all(
            "SELECT DayOfWeek, PeriodNumber, ClassName, Section, AssignedLibrarian FROM library_timetable_slots WHERE TenantId = :tid",
            {"tid": tid},
        )

        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=len(books) + len(issues),
            summary=f"Library catalog has {len(books)} title(s), {len(issues)} issue/return record(s), and {len(slots)} timetable slot(s).",
            data={"books": books, "issue_records": issues, "timetable_slots": slots},
            visuals=[VisualArtifact(visual_type="table", title="Library Book Inventory", data={"rows": books})] if books else [],
        )
