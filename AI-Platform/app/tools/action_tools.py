"""Two-phase confirmed ERP write action preparation tools."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Literal
from pydantic import BaseModel, Field

from app.config.settings import get_settings
from app.integrations.mysql_reader import get_mysql_reader
from app.schemas.chat import PendingActionPreview, VisualArtifact
from app.schemas.security import AiSecurityContext
from app.security.action_store import PendingActionStore
from app.tools.base import BaseErpTool, ToolOutput


class CreateAnnouncementInput(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    content: str = Field(min_length=5, max_length=3000)
    target_audience: str = Field(default="ALL", description="ALL, STUDENTS, PARENTS, or TEACHERS")
    category: str = Field(default="GENERAL", description="ACADEMIC, URGENT, EXAM, SPORTS, HOLIDAY, GENERAL")


class PrepareAnnouncementActionTool(BaseErpTool):
    name = "action_create_announcement"
    description = (
        "Prepares a school announcement/circular for explicit admin/principal confirmation before writing "
        "to the ERP via ASP.NET Core."
    )
    module = "communication"
    allowed_roles = ("Super Admin", "Admin", "Principal")
    input_model = CreateAnnouncementInput
    is_write_action = True

    async def _run(self, ctx: AiSecurityContext, params: CreateAnnouncementInput) -> ToolOutput:
        store = PendingActionStore(get_settings().resolved_sqlite_path)
        payload = {
            "title": params.title.strip(),
            "content": params.content.strip(),
            "audience": params.target_audience.strip().upper(),
            "category": params.category.strip().upper(),
        }
        token, expires = store.create_action(
            ctx,
            action_type="create_announcement",
            title=f"Publish Circular: {payload['title']}",
            description=f"Broadcast '{payload['title']}' to {payload['audience']} ({payload['category']}).",
            parameters=payload,
        )
        preview = PendingActionPreview(
            action_type="create_announcement",
            title=f"Publish Circular: {payload['title']}",
            description=f"Broadcast '{payload['title']}' to {payload['audience']} ({payload['category']}).",
            parameters=payload,
            confirmation_token=token,
            expires_at=expires,
        )
        return ToolOutput(
            success=True,
            module=self.module,
            source_type="SYSTEM",
            record_count=1,
            summary=f"Action preview prepared for announcement '{payload['title']}' ({payload['audience']}). Confirmation required.",
            data={"preview": payload, "status": "AWAITING_USER_CONFIRMATION"},
            pending_action=preview,
            visuals=[VisualArtifact(visual_type="action_preview", title="Confirm Circular Publication", data={"details": payload})],
        )


class ScheduleMeetingInput(BaseModel):
    meeting_title: str = Field(min_length=3, max_length=200)
    meeting_date: str = Field(default_factory=lambda: (datetime.now(timezone.utc) + timedelta(days=2)).strftime("%Y-%m-%d"))
    meeting_time: str = Field(default="10:00")
    audience: str = Field(default="Parent", description="Parent, Staff, or All Audiences")
    mode: str = Field(default="In-Person", description="In-Person, Online, or Hybrid")
    agenda: str = Field(default="Academic performance and operational review.")


class PrepareScheduleMeetingActionTool(BaseErpTool):
    name = "action_schedule_meeting"
    description = (
        "Prepares a meeting or Parent-Teacher conference preview requiring explicit user confirmation "
        "before ASP.NET Core creates it."
    )
    module = "communication"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Teacher")
    input_model = ScheduleMeetingInput
    is_write_action = True

    async def _run(self, ctx: AiSecurityContext, params: ScheduleMeetingInput) -> ToolOutput:
        store = PendingActionStore(get_settings().resolved_sqlite_path)
        payload = {
            "meetingTitle": params.meeting_title.strip(),
            "meetingDate": params.meeting_date.strip(),
            "meetingTime": params.meeting_time.strip(),
            "audience": params.audience.strip(),
            "mode": params.mode.strip(),
            "agenda": params.agenda.strip(),
        }
        token, expires = store.create_action(
            ctx,
            action_type="schedule_meeting",
            title=f"Schedule Meeting: {payload['meetingTitle']}",
            description=f"{payload['mode']} meeting on {payload['meetingDate']} at {payload['meetingTime']} ({payload['audience']}).",
            parameters=payload,
        )
        preview = PendingActionPreview(
            action_type="schedule_meeting",
            title=f"Schedule Meeting: {payload['meetingTitle']}",
            description=f"{payload['mode']} meeting on {payload['meetingDate']} at {payload['meetingTime']} ({payload['audience']}).",
            parameters=payload,
            confirmation_token=token,
            expires_at=expires,
        )
        return ToolOutput(
            success=True,
            module=self.module,
            source_type="SYSTEM",
            record_count=1,
            summary=f"Action preview prepared for meeting '{payload['meetingTitle']}' on {payload['meetingDate']}. Confirmation required.",
            data={"preview": payload, "status": "AWAITING_USER_CONFIRMATION"},
            pending_action=preview,
            visuals=[VisualArtifact(visual_type="action_preview", title="Confirm Meeting Schedule", data={"details": payload})],
        )


class ReviewLeaveInput(BaseModel):
    leave_application_id: int = Field(gt=0)
    decision: Literal["Approved", "Rejected", "Send Back"] = "Approved"
    remarks: str = Field(default="Reviewed via Pirnav AI intelligence workflow.", min_length=2, max_length=500)


class PrepareLeaveReviewActionTool(BaseErpTool):
    name = "action_review_leave"
    description = (
        "Validates an existing staff leave application in MySQL and prepares an Approve/Reject/Send Back "
        "preview requiring confirmation before ASP.NET Core commits it."
    )
    module = "staff_hr"
    allowed_roles = ("Super Admin", "Admin", "Principal", "HR")
    input_model = ReviewLeaveInput
    is_write_action = True

    async def _run(self, ctx: AiSecurityContext, params: ReviewLeaveInput) -> ToolOutput:
        mysql = get_mysql_reader()
        leave = await mysql.fetch_one(
            """
            SELECT la.LeaveApplicationId, la.StaffId, la.FromDate, la.ToDate, la.RequestedDays, la.Status, la.Reason,
                   CONCAT(COALESCE(s.FirstName,''), ' ', COALESCE(s.LastName,'')) AS staff_name
            FROM leave_applications la
            LEFT JOIN staff s ON s.StaffId = la.StaffId
            WHERE la.TenantId = :tid AND la.LeaveApplicationId = :lid
            LIMIT 1
            """,
            {"tid": ctx.tenant_id, "lid": params.leave_application_id},
        )
        if not leave:
            return ToolOutput(
                success=False,
                module=self.module,
                summary=f"Leave application #{params.leave_application_id} does not exist for tenant {ctx.tenant_id}.",
                error="Leave application not found.",
            )

        store = PendingActionStore(get_settings().resolved_sqlite_path)
        payload = {
            "leaveApplicationId": params.leave_application_id,
            "staffName": leave.get("staff_name"),
            "currentStatus": leave.get("Status"),
            "decision": params.decision,
            "remarks": params.remarks.strip(),
        }
        token, expires = store.create_action(
            ctx,
            action_type="review_leave_application",
            title=f"{params.decision} Leave #{params.leave_application_id} ({leave.get('staff_name')})",
            description=f"Transition leave #{params.leave_application_id} from {leave.get('Status')} to {params.decision}.",
            parameters=payload,
        )
        preview = PendingActionPreview(
            action_type="review_leave_application",
            title=f"{params.decision} Leave #{params.leave_application_id}",
            description=f"Transition leave #{params.leave_application_id} ({leave.get('staff_name')}) to {params.decision}.",
            parameters=payload,
            confirmation_token=token,
            expires_at=expires,
        )
        return ToolOutput(
            success=True,
            module=self.module,
            source_type="SYSTEM",
            record_count=1,
            summary=f"Action preview prepared to mark leave #{params.leave_application_id} as {params.decision}.",
            data={"preview": payload, "leave_record": leave},
            pending_action=preview,
            visuals=[VisualArtifact(visual_type="action_preview", title="Confirm Leave Review", data={"details": payload})],
        )
