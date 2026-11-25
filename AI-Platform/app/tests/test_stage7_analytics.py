"""Stage 7 verification tests for Pandas/NumPy/Decimal analytical engines on live sms_new_test."""

from __future__ import annotations

import pytest

from app.schemas.security import AiSecurityContext
from app.tools.catalog import build_default_registry


def _ctx(role: str = "Super Admin", **kwargs) -> AiSecurityContext:
    return AiSecurityContext(
        user_id=kwargs.pop("user_id", 1),
        user_name=f"Stage7 {role}",
        user_email=f"{role.lower()}@pirnav.edu",
        raw_role=role,
        role=role,  # type: ignore[arg-type]
        tenant_id="tenant-default",
        issued_at=1_900_000_000,
        **kwargs,
    )


@pytest.mark.asyncio
async def test_analytics_tools_registered_and_verified_against_live_sms_new_test():
    registry = build_default_registry(include_optional_subsystems=True)
    for tool_name in (
        "analytics_financial_health",
        "analytics_cross_module_dues_attendance",
        "analytics_reconcile_admissions_students",
        "analytics_hostel_financial_occupancy",
        "analytics_transport_usage_dues",
        "analytics_school_management_report",
    ):
        assert registry.get(tool_name) is not None, f"Missing analytics tool {tool_name}"

    admin = _ctx("Super Admin")

    # 1. Financial health reconciliation (16.5M billed, 103k receipts vs 86,750 SFA paid)
    fin_out, _ = await registry.get("analytics_financial_health").execute(admin, {})
    assert fin_out.success is True, fin_out.error
    metrics = fin_out.data["metrics"]
    assert metrics["total_billed_demand_inr"] == 16500000.0
    assert metrics["assigned_paid_amount_inr"] == 86750.0
    assert metrics["actual_receipts_collected_inr"] == 103000.0
    assert metrics["outstanding_receivables_inr"] == 16413250.0
    assert any("103,000" in c or "86,750" in c for c in fin_out.contradictions)

    # 2. Cross-module dues + low attendance correlation
    cross_out, _ = await registry.get("analytics_cross_module_dues_attendance").execute(
        admin,
        {"attendance_threshold_pct": 85.0, "min_due_amount": 1.0, "min_sessions": 1},
    )
    assert cross_out.success is True, cross_out.error
    cs = cross_out.data["cohort_summary"]
    assert cs["authorized_active_students"] == 408
    assert cs["students_with_fee_dues"] > 0
    assert cs["matched_students_count"] >= 0

    # 3. Admissions vs students reconciliation (418 vs 426 vs 415/408)
    adm_out, _ = await registry.get("analytics_reconcile_admissions_students").execute(admin, {})
    assert adm_out.success is True, adm_out.error
    assert adm_out.data["counts"]["admission_applications_total"] == 418
    assert adm_out.data["counts"]["legacy_admissions_total"] == 426
    assert adm_out.data["counts"]["students_active"] == 408
    assert len(adm_out.contradictions) >= 1

    # 4. Hostel analytics
    hostel_out, _ = await registry.get("analytics_hostel_financial_occupancy").execute(admin, {})
    assert hostel_out.success is True, hostel_out.error
    assert hostel_out.data["summary"]["occupied_beds"] == 6
    assert hostel_out.data["summary"]["total_beds"] > 0

    # 5. Transport analytics (9 total rows in DB, 4 active non-deleted)
    trans_out, _ = await registry.get("analytics_transport_usage_dues").execute(admin, {})
    assert trans_out.success is True, trans_out.error
    assert trans_out.data["summary"]["routes_count"] == 4
    assert trans_out.data["summary"]["vehicles_count"] >= 4

    # 6. Executive management report
    exec_out, _ = await registry.get("analytics_school_management_report").execute(admin, {})
    assert exec_out.success is True, exec_out.error
    assert exec_out.data["executive_kpis"]["active_students"] == 408


@pytest.mark.asyncio
async def test_cross_module_analytics_enforces_parent_isolation():
    registry = build_default_registry(include_optional_subsystems=True)
    parent = _ctx("Parent", user_id=777, linked_child_student_ids=[1119], allowed_branch_ids=[6], active_branch_id=6)
    res, _ = await registry.get("analytics_cross_module_dues_attendance").execute(
        parent,
        {"attendance_threshold_pct": 100.0, "min_due_amount": 0.0, "min_sessions": 1},
    )
    assert res.success is True
    assert res.data["cohort_summary"]["authorized_active_students"] <= 1
    for s in res.data["matched_students"]:
        assert s["student_id"] == 1119
