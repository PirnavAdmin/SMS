"""Finance, Fee Assignments, Fee Collections, Discounts, Concessions, Expenses, and Refunds tools."""

from __future__ import annotations

from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field

from app.integrations.erp_bridge import get_erp_bridge
from app.integrations.mysql_reader import get_mysql_reader
from app.schemas.chat import VisualArtifact
from app.schemas.security import AiSecurityContext
from app.tools.base import BaseErpTool, ToolOutput
from app.tools.erp_helpers import apply_branch_in_clause, apply_student_isolation_clause, join_where, resolve_scope_filters


class FeeCollectionsSummaryInput(BaseModel):
    branch_id: Optional[int] = None
    branch_name: Optional[str] = None
    academic_year: Optional[str] = None


class FeeCollectionsSummaryTool(BaseErpTool):
    name = "fee_collections_summary"
    description = (
        "Retrieves live fee demand vs collections vs receivables from `studentfeeassignments`, `feepayments`, "
        "`ledgerentries`, `financialaccounts`, and authoritative ERP bridge, highlighting reconciliation variances."
    )
    module = "finance"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Accountant")
    input_model = FeeCollectionsSummaryInput

    async def _run(self, ctx: AiSecurityContext, params: FeeCollectionsSummaryInput) -> ToolOutput:
        mysql = get_mysql_reader()
        scope = await resolve_scope_filters(
            ctx, requested_branch_id=params.branch_id, requested_branch_name=params.branch_name, reader=mysql
        )
        tid = scope["tenant_id"]

        sfa_where = ["sfa.TenantId = :tid"]
        qparams: dict[str, object] = {"tid": tid}
        if scope.get("branch_id") is not None:
            sfa_where.append("(s.branch_id = :bid OR (:bid IS NOT NULL AND dfs.Branch = :bname))")
            qparams["bid"] = int(scope["branch_id"])
            qparams["bname"] = scope.get("branch_name") or ""

        assignments_agg = await mysql.fetch_one(
            f"""
            SELECT
                COUNT(*) AS assignment_count,
                COALESCE(SUM(sfa.TotalAmount), 0) AS total_billed,
                COALESCE(SUM(sfa.PaidAmount), 0) AS assigned_paid_amount,
                COALESCE(SUM(sfa.DueAmount), 0) AS total_due_receivable,
                SUM(CASE WHEN sfa.DueAmount > 0 THEN 1 ELSE 0 END) AS accounts_with_dues,
                SUM(CASE WHEN sfa.PaidAmount > 0 AND sfa.DueAmount > 0 THEN 1 ELSE 0 END) AS partial_payment_accounts
            FROM studentfeeassignments sfa
            LEFT JOIN students s ON CAST(s.student_id AS CHAR) = sfa.StudentId AND s.TenantId = :tid
            LEFT JOIN dynamicfeestructures dfs ON dfs.Id = sfa.DynamicFeeStructureId
            WHERE {join_where(sfa_where)}
            """,
            qparams,
            preserve_decimal=True,
        )

        payments_agg = await mysql.fetch_one(
            """
            SELECT
                COUNT(*) AS receipt_count,
                COALESCE(SUM(Amount), 0) AS receipts_total_collected,
                COALESCE(SUM(DiscountAmount), 0) AS receipts_discount_total,
                COALESCE(SUM(FineAmount), 0) AS receipts_fine_total,
                COALESCE(SUM(TransportFee), 0) AS receipts_transport_total
            FROM feepayments
            WHERE TenantId = :tid AND LOWER(COALESCE(Status, '')) <> 'cancelled'
            """,
            {"tid": tid},
            preserve_decimal=True,
        )

        by_method = await mysql.fetch_all(
            """
            SELECT COALESCE(PaymentMethod, 'Unknown') AS payment_method,
                   COUNT(*) AS receipts,
                   COALESCE(SUM(Amount), 0) AS collected_amount
            FROM feepayments
            WHERE TenantId = :tid AND LOWER(COALESCE(Status, '')) <> 'cancelled'
            GROUP BY PaymentMethod
            """,
            {"tid": tid},
        )

        accounts = await mysql.fetch_all(
            """
            SELECT Id, Name, Type, BankName, OpeningBalance, CurrentBalance, Status
            FROM financialaccounts
            WHERE TenantId = :tid
            """,
            {"tid": tid},
        )

        ledger = await mysql.fetch_one(
            """
            SELECT COUNT(*) AS entry_count,
                   COALESCE(SUM(Debit), 0) AS total_debit,
                   COALESCE(SUM(Credit), 0) AS total_credit
            FROM ledgerentries
            WHERE TenantId = :tid
            """,
            {"tid": tid},
            preserve_decimal=True,
        )

        # Call authoritative ASP.NET Core ERP bridge if online
        bridge_stats = None
        bridge_status = "offline"
        try:
            bridge_stats = await get_erp_bridge().get_fee_collection_summary(
                ctx, branch_id=scope.get("branch_id"), academic_year_id=scope.get("academic_year_id")
            )
            bridge_status = "connected"
        except Exception as exc:
            bridge_status = f"unavailable ({exc})"

        billed = Decimal(str((assignments_agg or {}).get("total_billed") or 0))
        assigned_paid = Decimal(str((assignments_agg or {}).get("assigned_paid_amount") or 0))
        due = Decimal(str((assignments_agg or {}).get("total_due_receivable") or 0))
        receipts_collected = Decimal(str((payments_agg or {}).get("receipts_total_collected") or 0))

        contradictions: list[str] = []
        if abs(receipts_collected - assigned_paid) > Decimal("0.01"):
            contradictions.append(
                f"Ledger reconciliation variance: `feepayments` collected receipts total INR {receipts_collected:,.2f} "
                f"while `studentfeeassignments.PaidAmount` sums to INR {assigned_paid:,.2f} "
                f"(difference INR {receipts_collected - assigned_paid:,.2f})."
            )

        summary_rows = [
            {"Metric": "Total Fee Obligations Billed", "Amount (INR)": float(billed)},
            {"Metric": "Assigned PaidAmount (StudentFeeAssignments)", "Amount (INR)": float(assigned_paid)},
            {"Metric": "Actual Receipts Collected (FeePayments)", "Amount (INR)": float(receipts_collected)},
            {"Metric": "Outstanding Receivables (DueAmount)", "Amount (INR)": float(due)},
        ]

        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=int((assignments_agg or {}).get("assignment_count") or 0),
            summary=(
                f"Fee summary: Total Billed INR {billed:,.2f}, Due INR {due:,.2f}, "
                f"Assigned PaidAmount INR {assigned_paid:,.2f}, FeePayments Receipts INR {receipts_collected:,.2f}."
            ),
            data={
                "assignments_aggregate": {k: float(v) if isinstance(v, Decimal) else v for k, v in (assignments_agg or {}).items()},
                "receipts_aggregate": {k: float(v) if isinstance(v, Decimal) else v for k, v in (payments_agg or {}).items()},
                "by_payment_method": by_method,
                "financial_accounts": accounts,
                "ledger_summary": {k: float(v) if isinstance(v, Decimal) else v for k, v in (ledger or {}).items()},
                "erp_bridge_status": bridge_status,
                "erp_bridge_stats": bridge_stats,
            },
            contradictions=contradictions,
            visuals=[VisualArtifact(visual_type="table", title="School Fee Obligations vs Collections", data={"rows": summary_rows})],
        )


class StudentFeeDuesInput(BaseModel):
    min_due_amount: float = Field(default=1.0, ge=0.0)
    class_name: Optional[str] = None
    student_id: Optional[int] = None
    limit: int = Field(default=50, ge=1, le=200)


class StudentFeeDuesTool(BaseErpTool):
    name = "student_fee_dues"
    description = (
        "Lists students with outstanding fee balances, paid amounts, fee status, and fee structure details. "
        "Respects Student, Parent, and Branch data isolation."
    )
    module = "finance"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Accountant", "Parent", "Student")
    input_model = StudentFeeDuesInput

    async def _run(self, ctx: AiSecurityContext, params: StudentFeeDuesInput) -> ToolOutput:
        mysql = get_mysql_reader()
        scope = await resolve_scope_filters(ctx, reader=mysql)
        where = ["sfa.TenantId = :tid", "sfa.DueAmount >= :min_due"]
        qparams: dict[str, object] = {"tid": scope["tenant_id"], "min_due": params.min_due_amount, "lim": params.limit}

        apply_branch_in_clause(where, qparams, scope, "s.branch_id")
        apply_student_isolation_clause(where, qparams, ctx, "s.student_id", "s.class_id")

        if params.student_id is not None and ctx.role not in {"Parent", "Student"}:
            where.append("s.student_id = :req_sid")
            qparams["req_sid"] = params.student_id
        if params.class_name:
            where.append("LOWER(c.ClassName) LIKE LOWER(:cname)")
            qparams["cname"] = f"%{params.class_name.strip()}%"

        rows = await mysql.fetch_all(
            f"""
            SELECT
                s.student_id, s.admission_number, s.student_name,
                c.ClassName AS class_name, cs.section_letter AS section,
                b.BranchName AS branch_name, s.father_mobile,
                dfs.Name AS fee_structure_name, sfa.TotalAmount, sfa.PaidAmount, sfa.DueAmount, sfa.Status
            FROM studentfeeassignments sfa
            JOIN students s ON CAST(s.student_id AS CHAR) = sfa.StudentId AND s.TenantId = :tid
            LEFT JOIN classes c ON c.id = s.class_id
            LEFT JOIN class_sections cs ON cs.id = s.section_id
            LEFT JOIN branches b ON b.BranchId = s.branch_id
            LEFT JOIN dynamicfeestructures dfs ON dfs.Id = sfa.DynamicFeeStructureId
            WHERE {join_where(where)} AND s.is_deleted = 0
            ORDER BY sfa.DueAmount DESC
            LIMIT :lim
            """,
            qparams,
        )

        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=len(rows),
            summary=f"Retrieved {len(rows)} student fee due record(s) with DueAmount >= {params.min_due_amount}.",
            data={"dues": rows},
            visuals=[VisualArtifact(visual_type="table", title="Student Fee Dues", data={"rows": rows})] if rows else [],
        )


class FinanceAdjustmentsExpensesTool(BaseErpTool):
    name = "finance_adjustments_expenses"
    description = (
        "Inspects fee heads, fee structures, discounts, scholarships, concessions, refunds, "
        "operational expenses, and department budgets."
    )
    module = "finance"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Accountant")

    async def _run(self, ctx: AiSecurityContext, params: BaseModel) -> ToolOutput:
        mysql = get_mysql_reader()
        tid = ctx.tenant_id

        fee_heads = await mysql.fetch_all(
            "SELECT Id, Name, Frequency, DefaultAmount, Category, Status, Mandatory FROM feeheads WHERE TenantId = :tid",
            {"tid": tid},
        )
        structures = await mysql.fetch_all(
            "SELECT Id, Name, AcademicYear, Branch, ClassName, StudentCategory, TotalAmount, Status FROM dynamicfeestructures WHERE TenantId = :tid",
            {"tid": tid},
        )
        discounts = await mysql.fetch_all(
            "SELECT Id, DiscountName, AdmissionNo, StudentName, Mode, Value, Status FROM student_discounts WHERE TenantId = :tid",
            {"tid": tid},
        )
        scholarships = await mysql.fetch_all(
            "SELECT Id, ScholarshipName, AdmissionNo, StudentName, DiscountType, DiscountValue, Status FROM student_scholarships WHERE TenantId = :tid",
            {"tid": tid},
        )
        concessions = await mysql.fetch_all(
            """
            SELECT sc.Id, cr.Name AS RuleName, sc.StudentId, sc.AdmissionNo, cr.DiscountType AS ConcessionType, sc.ApprovedAmount AS ConcessionValue, sc.Status
            FROM studentconcessions sc
            LEFT JOIN concessionrules cr ON cr.Id = sc.ConcessionRuleId
            WHERE sc.TenantId = :tid
            """,
            {"tid": tid},
        )
        expenses = await mysql.fetch_all(
            "SELECT Id, ExpenseNo, Date, Category, Vendor, Amount, PaymentMethod, Status FROM expenses WHERE TenantId = :tid ORDER BY Date DESC",
            {"tid": tid},
        )
        budgets = await mysql.fetch_all(
            "SELECT Id, CategoryName, Department, AcademicYear, Branch, AllocatedAmount, Status FROM financial_budgets WHERE TenantId = :tid",
            {"tid": tid},
        )
        refunds = await mysql.fetch_all(
            "SELECT Id, RefundNo, ReceiptNo, StudentName, RefundAmount, Reason, Status FROM fee_refund_requests WHERE TenantId = :tid",
            {"tid": tid},
        )

        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=len(fee_heads) + len(expenses) + len(discounts) + len(scholarships) + len(concessions),
            summary=(
                f"Fee configs: {len(fee_heads)} fee heads, {len(structures)} structures; "
                f"Adjustments: {len(discounts)} discounts, {len(scholarships)} scholarships, {len(concessions)} concessions; "
                f"Expenses: {len(expenses)}, Budgets: {len(budgets)}, Refunds: {len(refunds)}."
            ),
            data={
                "fee_heads": fee_heads,
                "dynamic_fee_structures": structures,
                "student_discounts": discounts,
                "student_scholarships": scholarships,
                "student_concessions": concessions,
                "expenses": expenses,
                "budgets": budgets,
                "refund_requests": refunds,
            },
        )
