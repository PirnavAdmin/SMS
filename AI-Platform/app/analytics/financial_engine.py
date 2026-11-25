"""Financial Intelligence Engine using Pandas and Decimal-safe ERP reconciliations."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

import pandas as pd

from app.analytics.verifier import dec, safe_pct, verify_fee_row_arithmetic
from app.integrations.mysql_reader import get_mysql_reader
from app.schemas.security import AiSecurityContext
from app.tools.erp_helpers import resolve_scope_filters


async def compute_school_financial_health(
    ctx: AiSecurityContext,
    *,
    branch_id: int | None = None,
    branch_name: str | None = None,
) -> dict[str, Any]:
    mysql = get_mysql_reader()
    scope = await resolve_scope_filters(ctx, requested_branch_id=branch_id, requested_branch_name=branch_name, reader=mysql)
    tid = scope["tenant_id"]

    # Fetch assignment rows with branch info
    sfa_rows = await mysql.fetch_all(
        """
        SELECT sfa.Id, sfa.StudentId, sfa.DynamicFeeStructureId,
               sfa.TotalAmount, sfa.PaidAmount, sfa.DueAmount, sfa.Status, sfa.FeePolicy,
               s.branch_id, COALESCE(b.BranchName, dfs.Branch, 'Unassigned') AS branch_name,
               COALESCE(dfs.Name, 'Default Structure') AS structure_name
        FROM studentfeeassignments sfa
        LEFT JOIN students s ON CAST(s.student_id AS CHAR) = sfa.StudentId AND s.TenantId = :tid
        LEFT JOIN branches b ON b.BranchId = s.branch_id
        LEFT JOIN dynamicfeestructures dfs ON dfs.Id = sfa.DynamicFeeStructureId
        WHERE sfa.TenantId = :tid
        """,
        {"tid": tid},
        preserve_decimal=True,
    )

    if scope.get("branch_id") is not None:
        bid = int(scope["branch_id"])
        bname = (scope.get("branch_name") or "").lower()
        sfa_rows = [
            r
            for r in sfa_rows
            if r.get("branch_id") == bid or (bname and str(r.get("branch_name") or "").lower() == bname)
        ]

    fp_rows = await mysql.fetch_all(
        """
        SELECT fp.Id, fp.ReceiptNo, fp.StudentId, fp.Amount, fp.DiscountAmount, fp.FineAmount,
               fp.TransportFee, fp.PaymentDate, fp.PaymentMethod, fp.Status, fp.TermName,
               s.branch_id
        FROM feepayments fp
        LEFT JOIN students s ON CAST(s.student_id AS CHAR) = fp.StudentId AND s.TenantId = :tid
        WHERE fp.TenantId = :tid
        """,
        {"tid": tid},
        preserve_decimal=True,
    )
    if scope.get("branch_id") is not None:
        bid = int(scope["branch_id"])
        fp_rows = [r for r in fp_rows if r.get("branch_id") == bid]

    expenses_rows = await mysql.fetch_all(
        "SELECT Id, ExpenseNo, Category, Amount, Status, BranchId FROM expenses WHERE TenantId = :tid",
        {"tid": tid},
        preserve_decimal=True,
    )
    budget_rows = await mysql.fetch_all(
        "SELECT Id, CategoryName, Department, Branch, AllocatedAmount, Status FROM financial_budgets WHERE TenantId = :tid",
        {"tid": tid},
        preserve_decimal=True,
    )
    hostel_allocs = await mysql.fetch_all(
        """
        SELECT sba.AllocationId, hb.HostelName, hfc.HostelFee, hfc.SecurityDeposit, sba.Status
        FROM student_bed_allocations sba
        LEFT JOIN hostel_blocks hb ON hb.HostelId = sba.HostelId
        LEFT JOIN hostel_fee_configs hfc ON hfc.HostelId = sba.HostelId AND hfc.Status = 'Active'
        WHERE sba.TenantId = :tid AND sba.Status = 'Active'
        """,
        {"tid": tid},
        preserve_decimal=True,
    )
    transport_active = await mysql.fetch_all(
        """
        SELECT sta.StudentTransportAssignmentId, tr.RouteName, tr.MonthlyFee, sta.Status
        FROM student_transport_assignments sta
        LEFT JOIN transport_routes tr ON tr.RouteId = sta.RouteId
        WHERE sta.TenantId = :tid AND sta.IsDeleted = 0
        """,
        {"tid": tid},
        preserve_decimal=True,
    )
    uniform_rows = await mysql.fetch_all(
        "SELECT DistributionId, TotalAmount, PaymentStatus, Status FROM student_uniform_distributions WHERE TenantId = :tid",
        {"tid": tid},
        preserve_decimal=True,
    )
    discounts_rows = await mysql.fetch_all(
        "SELECT Mode, Value, Status FROM student_discounts WHERE TenantId = :tid",
        {"tid": tid},
        preserve_decimal=True,
    )
    scholarships_rows = await mysql.fetch_all(
        "SELECT DiscountType, DiscountValue, Status FROM student_scholarships WHERE TenantId = :tid",
        {"tid": tid},
        preserve_decimal=True,
    )
    concessions_rows = await mysql.fetch_all(
        "SELECT ApprovedAmount, Status FROM studentconcessions WHERE TenantId = :tid",
        {"tid": tid},
        preserve_decimal=True,
    )
    refunds_rows = await mysql.fetch_all(
        "SELECT RefundAmount, Status FROM fee_refund_requests WHERE TenantId = :tid",
        {"tid": tid},
        preserve_decimal=True,
    )

    # Decimal-safe core ledger metrics
    billed_total = sum((dec(r.get("TotalAmount")) for r in sfa_rows), Decimal("0.00"))
    assigned_paid_total = sum((dec(r.get("PaidAmount")) for r in sfa_rows), Decimal("0.00"))
    due_total = sum((dec(r.get("DueAmount")) for r in sfa_rows), Decimal("0.00"))

    valid_receipts = [r for r in fp_rows if str(r.get("Status") or "").lower() != "cancelled"]
    receipts_collected_total = sum((dec(r.get("Amount")) for r in valid_receipts), Decimal("0.00"))
    receipts_discount_total = sum((dec(r.get("DiscountAmount")) for r in valid_receipts), Decimal("0.00"))
    receipts_fine_total = sum((dec(r.get("FineAmount")) for r in valid_receipts), Decimal("0.00"))
    receipts_transport_total = sum((dec(r.get("TransportFee")) for r in valid_receipts), Decimal("0.00"))

    expenses_total = sum((dec(r.get("Amount")) for r in expenses_rows), Decimal("0.00"))
    budgets_total = sum((dec(r.get("AllocatedAmount")) for r in budget_rows), Decimal("0.00"))
    refunds_total = sum((dec(r.get("RefundAmount")) for r in refunds_rows), Decimal("0.00"))
    uniform_total = sum((dec(r.get("TotalAmount")) for r in uniform_rows), Decimal("0.00"))

    active_transport = [r for r in transport_active if str(r.get("Status")) in {"1", "Active", "active", "True", "true"}]
    transport_monthly_runrate = sum((dec(r.get("MonthlyFee")) for r in active_transport), Decimal("0.00"))

    # Deduplicate active allocation against multiple matching fee configs by taking max fee config per allocation
    hostel_alloc_map: dict[Any, Decimal] = {}
    for hr in hostel_allocs:
        aid = hr.get("AllocationId")
        fee_val = dec(hr.get("HostelFee"))
        if aid not in hostel_alloc_map or fee_val > hostel_alloc_map[aid]:
            hostel_alloc_map[aid] = fee_val
    hostel_annual_potential = sum(hostel_alloc_map.values(), Decimal("0.00"))

    # Pandas breakdown by branch & fee status
    sfa_df = pd.DataFrame(
        [
            {
                "branch": str(r.get("branch_name") or "Unassigned"),
                "status": str(r.get("Status") or "Unknown"),
                "billed": float(dec(r.get("TotalAmount"))),
                "paid": float(dec(r.get("PaidAmount"))),
                "due": float(dec(r.get("DueAmount"))),
            }
            for r in sfa_rows
        ]
    )
    by_branch_summary: list[dict[str, Any]] = []
    if not sfa_df.empty:
        grouped = (
            sfa_df.groupby("branch", as_index=False)
            .agg(
                student_accounts=("billed", "count"),
                total_billed=("billed", "sum"),
                total_paid=("paid", "sum"),
                total_due=("due", "sum"),
            )
        )
        grouped["collection_rate_pct"] = grouped.apply(
            lambda x: round((x["total_paid"] / x["total_billed"]) * 100.0, 2) if x["total_billed"] > 0 else 0.0,
            axis=1,
        )
        by_branch_summary = grouped.to_dict(orient="records")

    # Contradictions & programmatic verification
    contradictions = verify_fee_row_arithmetic(sfa_rows)
    variance = receipts_collected_total - assigned_paid_total
    if abs(variance) > Decimal("0.05"):
        contradictions.append(
            f"Collections reconciliation gap: `feepayments` collected receipts = INR {receipts_collected_total:,.2f} "
            f"vs `studentfeeassignments.PaidAmount` = INR {assigned_paid_total:,.2f} (variance = INR {variance:,.2f})."
        )

    unmatched_receipts_total = len([r for r in fp_rows if str(r.get("StudentId")) not in {str(x.get("StudentId")) for x in sfa_rows}])
    if unmatched_receipts_total > 0:
        contradictions.append(
            f"{unmatched_receipts_total} payment receipt(s) reference a StudentId with no matching fee assignment row."
        )

    return {
        "scope": scope,
        "distinction_note": (
            "Distinguishes Billed Demand (studentfeeassignments.TotalAmount), Assigned Credits (PaidAmount), "
            "Actual Cash/Receipt Collections (feepayments.Amount), Outstanding Receivables (DueAmount), "
            "Auxiliary Potential Revenue (Hostel/Transport/Uniform), and Operating Expenses."
        ),
        "metrics": {
            "total_billed_demand_inr": float(billed_total),
            "assigned_paid_amount_inr": float(assigned_paid_total),
            "actual_receipts_collected_inr": float(receipts_collected_total),
            "outstanding_receivables_inr": float(due_total),
            "assigned_collection_rate_pct": safe_pct(assigned_paid_total, billed_total),
            "receipt_collection_rate_pct": safe_pct(receipts_collected_total, billed_total),
            "receipt_discounts_inr": float(receipts_discount_total),
            "receipt_fines_inr": float(receipts_fine_total),
            "receipt_transport_component_inr": float(receipts_transport_total),
            "hostel_annual_fee_potential_inr": float(hostel_annual_potential),
            "transport_monthly_runrate_inr": float(transport_monthly_runrate),
            "uniform_distribution_total_inr": float(uniform_total),
            "operational_expenses_inr": float(expenses_total),
            "allocated_budgets_inr": float(budgets_total),
            "refund_requests_total_inr": float(refunds_total),
            "discount_records_count": len(discounts_rows),
            "scholarship_records_count": len(scholarships_rows),
            "concession_records_count": len(concessions_rows),
            "fee_assignment_count": len(sfa_rows),
            "receipt_count": len(valid_receipts),
        },
        "by_branch": by_branch_summary,
        "contradictions": contradictions,
    }
