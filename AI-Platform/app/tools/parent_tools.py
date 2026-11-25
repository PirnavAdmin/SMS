"""Parent management and parent-student mapping tools."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field

from app.integrations.mysql_reader import get_mysql_reader
from app.schemas.chat import VisualArtifact
from app.schemas.security import AiSecurityContext
from app.tools.base import BaseErpTool, ToolOutput
from app.tools.erp_helpers import apply_branch_in_clause, join_where, resolve_scope_filters


class ParentMappingsInput(BaseModel):
    parent_user_id: Optional[int] = None
    onboarding_status: Optional[str] = Field(default=None, description="e.g. 'Account Ready', 'Email Sent', 'Email Failed'")
    limit: int = Field(default=30, ge=1, le=100)


class ParentMappingsTool(BaseErpTool):
    name = "parent_mappings"
    description = (
        "Retrieves parent-student relationships, linked wards, onboarding email delivery status, "
        "and primary guardian contacts."
    )
    module = "parents"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Teacher", "Receptionist", "Parent")
    input_model = ParentMappingsInput

    async def _run(self, ctx: AiSecurityContext, params: ParentMappingsInput) -> ToolOutput:
        mysql = get_mysql_reader()
        scope = await resolve_scope_filters(ctx, reader=mysql)

        where = ["pm.TenantId = :tenant_id"]
        qparams: dict[str, object] = {"tenant_id": scope["tenant_id"], "lim": params.limit}
        apply_branch_in_clause(where, qparams, scope, "s.branch_id")

        if ctx.role == "Parent":
            where.append("pm.ParentUserId = :auth_parent_uid")
            qparams["auth_parent_uid"] = ctx.user_id
        elif params.parent_user_id is not None:
            where.append("pm.ParentUserId = :req_puid")
            qparams["req_puid"] = params.parent_user_id

        if params.onboarding_status:
            where.append("LOWER(pm.OnboardingStatus) = LOWER(:ob)")
            qparams["ob"] = params.onboarding_status.strip()

        rows = await mysql.fetch_all(
            f"""
            SELECT
                pm.Id, pm.ParentUserId, u.FullName AS parent_name, u.Email AS parent_email,
                pm.StudentId, s.student_name, s.admission_number,
                c.ClassName AS class_name, pm.RelationshipType, pm.IsPrimaryContact,
                pm.Status, pm.OnboardingStatus
            FROM parent_student_mappings pm
            LEFT JOIN users u ON u.UserId = pm.ParentUserId
            LEFT JOIN students s ON s.student_id = pm.StudentId
            LEFT JOIN classes c ON c.id = s.class_id
            WHERE {join_where(where)}
            ORDER BY pm.Id DESC
            LIMIT :lim
            """,
            qparams,
        )

        status_counts = await mysql.fetch_all(
            f"""
            SELECT pm.OnboardingStatus AS status, COUNT(*) AS count
            FROM parent_student_mappings pm
            LEFT JOIN students s ON s.student_id = pm.StudentId
            WHERE {join_where(where)}
            GROUP BY pm.OnboardingStatus
            """,
            qparams,
        )

        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=len(rows),
            summary=f"Retrieved {len(rows)} parent-student mapping record(s).",
            data={"mappings": rows, "onboarding_breakdown": status_counts},
            visuals=[VisualArtifact(visual_type="table", title="Parent-Student Mappings", data={"rows": rows})] if rows else [],
        )
