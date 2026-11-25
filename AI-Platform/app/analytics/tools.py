"""Tool wrappers exposing the Python Pandas/NumPy/Decimal analytical engine."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field

from app.analytics.cross_module_engine import (
    analyze_dues_and_low_attendance,
    reconcile_admissions_and_students,
)
from app.analytics.financial_engine import compute_school_financial_health
from app.analytics.operational_engine import (
    analyze_hostel_occupancy_and_revenue,
    analyze_transport_usage_and_compliance,
    generate_executive_school_report,
)
from app.schemas.chat import VisualArtifact
from app.schemas.security import AiSecurityContext
from app.tools.base import BaseErpTool, ToolOutput


class FinancialHealthInput(BaseModel):
    branch_id: Optional[int] = None
    branch_name: Optional[str] = None


class AnalyticsFinancialHealthTool(BaseErpTool):
    name = "analytics_financial_health"
    description = (
        "Performs Decimal-safe school financial intelligence analysis: billed obligations, assigned credits, "
        "actual payment receipts, receivables, hostel/transport/uniform revenues, expenses, budgets, and ledger variances."
    )
    module = "analytics"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Accountant")
    input_model = FinancialHealthInput

    async def _run(self, ctx: AiSecurityContext, params: FinancialHealthInput) -> ToolOutput:
        res = await compute_school_financial_health(ctx, branch_id=params.branch_id, branch_name=params.branch_name)
        m = res["metrics"]
        kpis = [
            {"Measure": "Total Fee Billed Demand", "Amount (INR)": m["total_billed_demand_inr"]},
            {"Measure": "Assigned PaidAmount (SFA)", "Amount (INR)": m["assigned_paid_amount_inr"]},
            {"Measure": "Actual Collected Receipts (FeePayments)", "Amount (INR)": m["actual_receipts_collected_inr"]},
            {"Measure": "Outstanding Receivables (DueAmount)", "Amount (INR)": m["outstanding_receivables_inr"]},
            {"Measure": "Hostel Annual Capacity Potential", "Amount (INR)": m["hostel_annual_fee_potential_inr"]},
            {"Measure": "Transport Monthly Run-Rate", "Amount (INR)": m["transport_monthly_runrate_inr"]},
            {"Measure": "Uniform Distribution Total", "Amount (INR)": m["uniform_distribution_total_inr"]},
            {"Measure": "Operational Expenses", "Amount (INR)": m["operational_expenses_inr"]},
        ]
        return ToolOutput(
            success=True,
            module=self.module,
            source_type="ANALYTICS_ENGINE",
            record_count=m["fee_assignment_count"] + m["receipt_count"],
            summary=(
                f"Financial Intelligence: Billed INR {m['total_billed_demand_inr']:,.2f}, "
                f"Receipts Collected INR {m['actual_receipts_collected_inr']:,.2f} ({m['receipt_collection_rate_pct']}%), "
                f"Receivables INR {m['outstanding_receivables_inr']:,.2f}. "
                f"Detected {len(res['contradictions'])} reconciliation note(s)."
            ),
            data=res,
            contradictions=res["contradictions"],
            visuals=[
                VisualArtifact(visual_type="table", title="Financial Health Reconciliation Table", data={"rows": kpis}),
                VisualArtifact(
                    visual_type="chart",
                    title="Fee Demand vs Receipts vs Receivables",
                    data={
                        "chartType": "bar",
                        "labels": ["Billed Demand", "Receipts Collected", "Outstanding Due"],
                        "datasets": [
                            {
                                "label": "INR",
                                "data": [
                                    m["total_billed_demand_inr"],
                                    m["actual_receipts_collected_inr"],
                                    m["outstanding_receivables_inr"],
                                ],
                            }
                        ],
                    },
                ),
            ],
        )


class CrossModuleDuesAttendanceInput(BaseModel):
    attendance_threshold_pct: float = Field(default=75.0, ge=0.0, le=100.0)
    min_due_amount: float = Field(default=1.0, ge=0.0)
    min_sessions: int = Field(default=3, ge=1, le=50)
    branch_id: Optional[int] = None
    branch_name: Optional[str] = None


class AnalyticsCrossModuleDuesAttendanceTool(BaseErpTool):
    name = "analytics_cross_module_dues_attendance"
    description = (
        "Cross-module Pandas investigation joining active students, fee dues (`studentfeeassignments`), and attendance "
        "percentages (`student_attendances`) to pinpoint students who BOTH owe fees AND have attendance below threshold."
    )
    module = "analytics"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Accountant", "Teacher", "Parent", "Student")
    input_model = CrossModuleDuesAttendanceInput

    async def _run(self, ctx: AiSecurityContext, params: CrossModuleDuesAttendanceInput) -> ToolOutput:
        res = await analyze_dues_and_low_attendance(
            ctx,
            attendance_threshold_pct=params.attendance_threshold_pct,
            min_due_amount=params.min_due_amount,
            min_sessions=params.min_sessions,
            branch_id=params.branch_id,
            branch_name=params.branch_name,
        )
        cs = res["cohort_summary"]
        rows = res["matched_students"]
        return ToolOutput(
            success=True,
            module=self.module,
            source_type="ANALYTICS_ENGINE",
            record_count=len(rows),
            summary=(
                f"Cross-module risk analysis: {cs['matched_students_count']} student(s) satisfy BOTH "
                f"due >= INR {params.min_due_amount:,.0f} AND attendance < {params.attendance_threshold_pct}% "
                f"(out of {cs['authorized_active_students']} active students, total overdue INR {cs.get('total_due_among_matched_inr', 0):,.2f})."
            ),
            data=res,
            visuals=[
                VisualArtifact(
                    visual_type="table",
                    title=f"Students with Fee Dues >= {params.min_due_amount} & Attendance < {params.attendance_threshold_pct}%",
                    data={"rows": rows[:50]},
                )
            ]
            if rows
            else [],
        )


class AnalyticsReconcileAdmissionsTool(BaseErpTool):
    name = "analytics_reconcile_admissions_students"
    description = (
        "Reconciles `admission_applications`, legacy `admissions`, and active `students` cohorts "
        "to detect unlinked enrollments, dual-table drift, and inactive/deleted variances."
    )
    module = "analytics"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Receptionist")

    async def _run(self, ctx: AiSecurityContext, params: BaseModel) -> ToolOutput:
        res = await reconcile_admissions_and_students(ctx)
        c = res["counts"]
        return ToolOutput(
            success=True,
            module=self.module,
            source_type="ANALYTICS_ENGINE",
            record_count=c["admission_applications_total"],
            summary=(
                f"Admissions vs Students reconciliation: admission_applications={c['admission_applications_total']} "
                f"({c['admission_applications_enrolled']} Enrolled), legacy admissions={c['legacy_admissions_total']}, "
                f"active students={c['students_active']}."
            ),
            data=res,
            contradictions=res["contradictions"],
            visuals=[VisualArtifact(visual_type="table", title="Cohort Count Reconciliation", data={"rows": [c]})],
        )


class AnalyticsHostelOccupancyTool(BaseErpTool):
    name = "analytics_hostel_financial_occupancy"
    description = "Calculates block-level bed utilization, vacant capacity, and hostel annual revenue run-rate."
    module = "analytics"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Hostel Warden", "Accountant")

    async def _run(self, ctx: AiSecurityContext, params: BaseModel) -> ToolOutput:
        res = await analyze_hostel_occupancy_and_revenue(ctx)
        s = res["summary"]
        return ToolOutput(
            success=True,
            module=self.module,
            source_type="ANALYTICS_ENGINE",
            record_count=s["hostel_blocks"],
            summary=(
                f"Hostel occupancy: {s['occupied_beds']}/{s['total_beds']} beds ({s['occupancy_pct']}%); "
                f"occupied annual fee run-rate INR {s['estimated_occupied_annual_runrate_inr']:,.2f} vs "
                f"full capacity potential INR {s['full_capacity_annual_potential_inr']:,.2f}."
            ),
            data=res,
            visuals=[VisualArtifact(visual_type="table", title="Hostel Occupancy & Revenue Analytics", data={"rows": res["blocks"]})],
        )


class AnalyticsTransportTool(BaseErpTool):
    name = "analytics_transport_usage_dues"
    description = "Analyzes route utilization, monthly transport revenue run-rate, fleet capacity, and expiry compliance alerts."
    module = "analytics"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Transport Manager", "Accountant")

    async def _run(self, ctx: AiSecurityContext, params: BaseModel) -> ToolOutput:
        res = await analyze_transport_usage_and_compliance(ctx)
        s = res["summary"]
        return ToolOutput(
            success=True,
            module=self.module,
            source_type="ANALYTICS_ENGINE",
            record_count=s["routes_count"],
            summary=(
                f"Transport utilization: {s['active_student_riders']}/{s['total_fleet_seat_capacity']} seats ({s['fleet_utilization_pct']}%), "
                f"monthly revenue run-rate INR {s['monthly_transport_revenue_runrate_inr']:,.2f}, "
                f"{s['compliance_alerts_count']} compliance alert(s)."
            ),
            data=res,
            visuals=[VisualArtifact(visual_type="table", title="Route Utilization & Monthly Run-Rate", data={"rows": res["route_stats"]})],
        )


class AnalyticsSchoolReportTool(BaseErpTool):
    name = "analytics_school_management_report"
    description = (
        "Generates an enterprise executive school management report spanning students, staff, attendance, "
        "fees, admissions reconciliation, hostel occupancy, transport utilization, and exams."
    )
    module = "analytics"
    allowed_roles = ("Super Admin", "Admin", "Principal")

    async def _run(self, ctx: AiSecurityContext, params: BaseModel) -> ToolOutput:
        res = await generate_executive_school_report(ctx)
        k = res["executive_kpis"]
        return ToolOutput(
            success=True,
            module=self.module,
            source_type="ANALYTICS_ENGINE",
            record_count=k["active_students"],
            summary=(
                f"Executive School Report: {k['active_students']} active students, {k['active_staff']} active staff, "
                f"attendance {k['overall_attendance_pct']}%, fee receipts INR {k['actual_fee_collected_inr']:,.2f} / "
                f"INR {k['total_fee_billed_inr']:,.2f}, hostel {k['hostel_occupancy_pct']}%, exam pass rate {k['exam_pass_rate_pct']}%."
            ),
            data=res,
            contradictions=res["contradictions"],
            visuals=[
                VisualArtifact(visual_type="table", title="Executive School KPIs", data={"rows": [k]}),
                VisualArtifact(visual_type="report", title="School Management Intelligence Report", data=res),
            ],
        )


def get_analytics_tools():
    return [
        AnalyticsFinancialHealthTool(),
        AnalyticsCrossModuleDuesAttendanceTool(),
        AnalyticsReconcileAdmissionsTool(),
        AnalyticsHostelOccupancyTool(),
        AnalyticsTransportTool(),
        AnalyticsSchoolReportTool(),
    ]
