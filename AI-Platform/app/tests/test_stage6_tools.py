"""Stage 6 verification tests against live read-only MySQL database sms_new_test."""

from __future__ import annotations

import pytest
from sqlalchemy import text

from app.core.exceptions import ReadOnlyViolationError
from app.integrations.mysql_reader import get_mysql_reader, validate_readonly_sql
from app.schemas.security import AiSecurityContext
from app.tools.catalog import build_default_registry


def _make_ctx(
    *,
    role: str = "Admin",
    user_id: int = 1,
    allowed_branch_ids: list[int] | None = None,
    active_branch_id: int | None = None,
    student_id: int | None = None,
    linked_children: list[int] | None = None,
    assigned_class_ids: list[int] | None = None,
    staff_id: int | None = None,
) -> AiSecurityContext:
    return AiSecurityContext(
        user_id=user_id,
        user_name=f"Test {role}",
        user_email=f"{role.lower().replace(' ', '')}@pirnav.edu",
        raw_role=role,
        role=role,  # type: ignore[arg-type]
        tenant_id="tenant-default",
        allowed_branch_ids=allowed_branch_ids or [],
        active_branch_id=active_branch_id,
        student_id=student_id,
        linked_child_student_ids=linked_children or [],
        assigned_class_ids=assigned_class_ids or [],
        staff_id=staff_id,
        issued_at=1_900_000_000,
    )


def test_readonly_sql_validator_rejects_mutations_and_multi_statements():
    assert validate_readonly_sql("SELECT COUNT(*) FROM students") == "SELECT COUNT(*) FROM students"
    assert validate_readonly_sql("WITH cte AS (SELECT 1) SELECT * FROM cte;") == "WITH cte AS (SELECT 1) SELECT * FROM cte"

    dangerous = [
        "INSERT INTO students (student_name) VALUES ('hacked')",
        "UPDATE students SET status='Inactive'",
        "DELETE FROM students WHERE student_id=1",
        "DROP TABLE students",
        "TRUNCATE TABLE feepayments",
        "SELECT 1; DELETE FROM students;",
        "SELECT * FROM students /* UPDATE */ INTO OUTFILE '/tmp/x'",
        "CALL some_proc()",
        "SET GLOBAL read_only = OFF",
    ]
    for q in dangerous:
        with pytest.raises(ReadOnlyViolationError):
            validate_readonly_sql(q)


@pytest.mark.asyncio
async def test_mysql_connection_enforces_session_transaction_read_only():
    reader = get_mysql_reader()
    assert await reader.ping() is True
    # Even if raw engine connection attempts a mutation bypassing validate_readonly_sql, MySQL itself blocks it!
    with reader._engine.connect() as conn:
        with pytest.raises(Exception):
            conn.execute(text("INSERT INTO branches (BranchName, BranchCode) VALUES ('Bad', 'BAD')"))


@pytest.mark.asyncio
async def test_all_17_module_tools_execute_against_live_sms_new_test():
    registry = build_default_registry(include_optional_subsystems=False)
    tools = registry.all_tools()
    assert len(tools) >= 24

    admin_ctx = _make_ctx(role="Super Admin", user_id=1)

    checks = [
        ("student_overview", {}),
        ("student_search", {"limit": 5}),
        ("parent_mappings", {"limit": 10}),
        ("admissions_overview", {}),
        ("staff_directory", {}),
        ("staff_attendance_leave", {}),
        ("payroll_summary", {}),
        ("faculty_workshops", {}),
        ("academic_structure", {}),
        ("timetable_schedule", {}),
        ("homework_assignments", {}),
        ("attendance_overview", {}),
        ("student_low_attendance", {"threshold_pct": 85.0, "min_sessions": 1}),
        ("fee_collections_summary", {}),
        ("student_fee_dues", {"limit": 10}),
        ("finance_adjustments_expenses", {}),
        ("hostel_occupancy_fees", {}),
        ("transport_operations", {}),
        ("examination_results", {}),
        ("library_operations", {}),
        ("uniform_inventory", {}),
        ("organization_governance", {}),
        ("certificates_alumni", {}),
    ]

    results = {}
    for name, args in checks:
        tool = registry.get(name)
        assert tool is not None, f"Missing tool {name}"
        out, _ = await tool.execute(admin_ctx, args)
        assert out.success is True, f"Tool {name} failed: {out.error}"
        results[name] = out

    # Verify authentic sms_new_test baseline figures observed in audit
    assert results["student_overview"].data["totals"]["active_students"] == 408
    assert results["student_overview"].data["totals"]["total_rows"] == 415
    assert len(results["admissions_overview"].contradictions) >= 1  # 418 vs 426
    assert len(results["fee_collections_summary"].contradictions) >= 1  # 103,000 vs 86,750
    assert results["hostel_occupancy_fees"].data["total_occupied"] == 6
    assert results["attendance_overview"].data["overall"]["session_count"] >= 97

    # Student 360 profile against real active student
    sample_student_id = results["student_search"].data["students"][0]["student_id"]
    prof_out, _ = await registry.get("student_profile").execute(admin_ctx, {"student_id": sample_student_id})
    assert prof_out.success is True
    assert prof_out.data["student"]["student_id"] == sample_student_id


@pytest.mark.asyncio
async def test_role_and_entity_isolation_enforced_by_tools():
    registry = build_default_registry(include_optional_subsystems=False)

    # Parent trying to access school-wide fee summary or payroll -> Denied
    parent_ctx = _make_ctx(role="Parent", user_id=999, linked_children=[1119], active_branch_id=6, allowed_branch_ids=[6])
    denied_fee, _ = await registry.get("fee_collections_summary").execute(parent_ctx, {})
    assert denied_fee.success is False
    assert "not authorized" in (denied_fee.error or "").lower()

    denied_payroll, _ = await registry.get("payroll_summary").execute(parent_ctx, {})
    assert denied_payroll.success is False

    # Student trying to inspect another student's 360 profile -> Denied
    student_ctx = _make_ctx(role="Student", user_id=501, student_id=1119, active_branch_id=6, allowed_branch_ids=[6])
    denied_other, _ = await registry.get("student_profile").execute(student_ctx, {"student_id": 1250})
    assert denied_other.success is False
    assert "only access their own records" in (denied_other.error or "").lower()

    # Teacher sees redacted salary compensation in staff_directory
    teacher_ctx = _make_ctx(role="Teacher", user_id=301, active_branch_id=6, allowed_branch_ids=[6], assigned_class_ids=[21])
    staff_res, _ = await registry.get("staff_directory").execute(teacher_ctx, {})
    assert staff_res.success is True
    assert staff_res.data["compensation_visible"] is False

    # Two-phase action creates confirmation token cleanly for Admin, denied for Parent
    admin_ctx = _make_ctx(role="Admin", user_id=1)
    action_ok, _ = await registry.get("action_create_announcement").execute(
        admin_ctx,
        {"title": "Stage 6 Verification Circular", "content": "Preview only; do not write directly from Python tool."},
    )
    assert action_ok.success is True
    assert action_ok.pending_action is not None
    assert action_ok.pending_action.confirmation_token.startswith("ACT_")

    action_denied, _ = await registry.get("action_create_announcement").execute(
        parent_ctx,
        {"title": "Unauthorized", "content": "Should fail."},
    )
    assert action_denied.success is False
