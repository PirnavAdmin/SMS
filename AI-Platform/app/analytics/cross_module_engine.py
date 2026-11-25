"""Cross-module investigation engines combining Attendance, Fees, Admissions, and Students."""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from app.analytics.verifier import dec
from app.integrations.mysql_reader import get_mysql_reader
from app.schemas.security import AiSecurityContext
from app.tools.erp_helpers import apply_branch_in_clause, apply_student_isolation_clause, join_where, resolve_scope_filters


async def analyze_dues_and_low_attendance(
    ctx: AiSecurityContext,
    *,
    attendance_threshold_pct: float = 75.0,
    min_due_amount: float = 1.0,
    min_sessions: int = 3,
    branch_id: int | None = None,
    branch_name: str | None = None,
) -> dict[str, Any]:
    """
    Correlates verified student fee obligations with verified attendance session percentages
    in Pandas, enforcing role and branch scoping.
    """
    mysql = get_mysql_reader()
    scope = await resolve_scope_filters(ctx, requested_branch_id=branch_id, requested_branch_name=branch_name, reader=mysql)
    tid = scope["tenant_id"]

    where = ["s.TenantId = :tid", "s.is_deleted = 0"]
    qparams: dict[str, object] = {"tid": tid}
    apply_branch_in_clause(where, qparams, scope, "s.branch_id")
    apply_student_isolation_clause(where, qparams, ctx, "s.student_id", "s.class_id")

    students = await mysql.fetch_all(
        f"""
        SELECT s.student_id, s.admission_number, s.student_name, s.branch_id,
               b.BranchName AS branch_name, s.class_id,
               COALESCE(c.ClassName, CONCAT('Class #', s.class_id)) AS class_name,
               cs.section_letter AS section, s.father_name, s.father_mobile
        FROM students s
        LEFT JOIN classes c ON c.id = s.class_id
        LEFT JOIN class_sections cs ON cs.id = s.section_id
        LEFT JOIN branches b ON b.BranchId = s.branch_id
        WHERE {join_where(where)}
        """,
        qparams,
    )

    fees = await mysql.fetch_all(
        """
        SELECT StudentId, TotalAmount, PaidAmount, DueAmount, Status
        FROM studentfeeassignments
        WHERE TenantId = :tid
        """,
        {"tid": tid},
        preserve_decimal=True,
    )

    attendance = await mysql.fetch_all(
        """
        SELECT sa.StudentId, sa.Status
        FROM student_attendances sa
        WHERE sa.TenantId = :tid
        """,
        {"tid": tid},
    )

    if not students:
        return {
            "scope": scope,
            "criteria": {
                "attendance_threshold_pct": attendance_threshold_pct,
                "min_due_amount": min_due_amount,
                "min_sessions": min_sessions,
            },
            "matched_students": [],
            "cohort_summary": {"authorized_students": 0, "matched_count": 0},
        }

    stu_df = pd.DataFrame(students)
    stu_df["student_id_int"] = pd.to_numeric(stu_df["student_id"], errors="coerce").fillna(-1).astype(int)

    # Aggregate fees by numeric student_id safely
    fee_records = []
    for f in fees:
        sid_raw = str(f.get("StudentId") or "").strip()
        if sid_raw.isdigit():
            fee_records.append(
                {
                    "student_id_int": int(sid_raw),
                    "total_fee": float(dec(f.get("TotalAmount"))),
                    "paid_fee": float(dec(f.get("PaidAmount"))),
                    "due_amount": float(dec(f.get("DueAmount"))),
                }
            )
    if fee_records:
        fee_df = (
            pd.DataFrame(fee_records)
            .groupby("student_id_int", as_index=False)
            .agg(total_fee=("total_fee", "sum"), paid_fee=("paid_fee", "sum"), due_amount=("due_amount", "sum"))
        )
    else:
        fee_df = pd.DataFrame(columns=["student_id_int", "total_fee", "paid_fee", "due_amount"])

    # Aggregate attendance strictly from actual attendance rows
    if attendance:
        att_df = pd.DataFrame(attendance)
        att_df["student_id_int"] = pd.to_numeric(att_df["StudentId"], errors="coerce").fillna(-1).astype(int)
        att_df["status_clean"] = att_df["Status"].astype(str).str.strip().str.lower()
        att_df["is_present"] = (att_df["status_clean"] == "present").astype(int)
        att_df["is_absent"] = (att_df["status_clean"] == "absent").astype(int)
        att_summary = (
            att_df.groupby("student_id_int", as_index=False)
            .agg(
                total_sessions=("status_clean", "count"),
                present_sessions=("is_present", "sum"),
                absent_sessions=("is_absent", "sum"),
            )
        )
        att_summary["attendance_pct"] = np.round(
            (att_summary["present_sessions"] / att_summary["total_sessions"]) * 100.0, 2
        )
    else:
        att_summary = pd.DataFrame(
            columns=["student_id_int", "total_sessions", "present_sessions", "absent_sessions", "attendance_pct"]
        )

    merged = stu_df.merge(fee_df, on="student_id_int", how="left").merge(att_summary, on="student_id_int", how="left")
    merged["total_fee"] = merged["total_fee"].fillna(0.0)
    merged["paid_fee"] = merged["paid_fee"].fillna(0.0)
    merged["due_amount"] = merged["due_amount"].fillna(0.0)
    merged["total_sessions"] = merged["total_sessions"].fillna(0).astype(int)
    merged["present_sessions"] = merged["present_sessions"].fillna(0).astype(int)
    merged["absent_sessions"] = merged["absent_sessions"].fillna(0).astype(int)
    merged["attendance_pct"] = merged["attendance_pct"].astype(float)

    with_attendance = merged[merged["total_sessions"] >= min_sessions]
    with_dues = merged[merged["due_amount"] >= min_due_amount]
    matched = merged[
        (merged["due_amount"] >= min_due_amount)
        & (merged["total_sessions"] >= min_sessions)
        & (merged["attendance_pct"] < attendance_threshold_pct)
    ].sort_values(by=["attendance_pct", "due_amount"], ascending=[True, False])

    cols = [
        "student_id",
        "admission_number",
        "student_name",
        "class_name",
        "section",
        "branch_name",
        "total_sessions",
        "present_sessions",
        "absent_sessions",
        "attendance_pct",
        "total_fee",
        "paid_fee",
        "due_amount",
        "father_mobile",
    ]
    matched_list = matched[cols].to_dict(orient="records")

    class_breakdown: list[dict[str, Any]] = []
    if not matched.empty:
        grp = (
            matched.groupby("class_name", as_index=False)
            .agg(
                flagged_students=("student_id", "count"),
                avg_attendance_pct=("attendance_pct", "mean"),
                total_due_inr=("due_amount", "sum"),
            )
            .sort_values(by="total_due_inr", ascending=False)
        )
        grp["avg_attendance_pct"] = grp["avg_attendance_pct"].round(2)
        class_breakdown = grp.to_dict(orient="records")

    return {
        "scope": scope,
        "criteria": {
            "attendance_threshold_pct": attendance_threshold_pct,
            "min_due_amount": min_due_amount,
            "min_sessions": min_sessions,
        },
        "cohort_summary": {
            "authorized_active_students": int(len(merged)),
            "students_with_fee_dues": int(len(with_dues)),
            "students_with_min_attendance_sessions": int(len(with_attendance)),
            "matched_students_count": int(len(matched)),
            "total_due_among_matched_inr": round(float(matched["due_amount"].sum()), 2) if not matched.empty else 0.0,
            "mean_attendance_among_matched_pct": round(float(matched["attendance_pct"].mean()), 2) if not matched.empty else None,
        },
        "by_class": class_breakdown,
        "matched_students": matched_list,
    }


async def reconcile_admissions_and_students(ctx: AiSecurityContext) -> dict[str, Any]:
    """Reconciles admission_applications, legacy admissions, and active students tables."""
    mysql = get_mysql_reader()
    tid = ctx.tenant_id

    apps = await mysql.fetch_all(
        """
        SELECT Id, RegistrationNo, AdmissionNo, CONCAT(COALESCE(FirstName,''), ' ', COALESCE(LastName,'')) AS full_name,
               BranchName, AcademicYear, Status, IsDeleted
        FROM admission_applications
        WHERE TenantId = :tid
        """,
        {"tid": tid},
    )
    legacy = await mysql.fetch_all(
        """
        SELECT admission_id, application_no, student_name, admission_type, status, is_deleted
        FROM admissions
        WHERE TenantId = :tid
        """,
        {"tid": tid},
    )
    students = await mysql.fetch_all(
        """
        SELECT student_id, admission_number, student_name, status, is_deleted, branch_id
        FROM students
        WHERE TenantId = :tid
        """,
        {"tid": tid},
    )

    apps_df = pd.DataFrame(apps)
    leg_df = pd.DataFrame(legacy)
    stu_df = pd.DataFrame(students)

    stu_active = stu_df[(stu_df["is_deleted"] == 0) & (stu_df["status"].str.lower() == "active")] if not stu_df.empty else stu_df
    apps_enrolled = apps_df[(apps_df["IsDeleted"] == 0) & (apps_df["Status"].str.lower() == "enrolled")] if not apps_df.empty else apps_df

    stu_adm_set = set(stu_active["admission_number"].dropna().astype(str).str.strip()) if not stu_active.empty else set()
    app_adm_set = set(apps_enrolled["AdmissionNo"].dropna().astype(str).str.strip()) if not apps_enrolled.empty else set()
    leg_adm_set = set(leg_df[leg_df["is_deleted"] == 0]["application_no"].dropna().astype(str).str.strip()) if not leg_df.empty else set()

    enrolled_without_active_student = sorted(list(app_adm_set - stu_adm_set))
    active_student_without_app = sorted(list(stu_adm_set - app_adm_set))

    contradictions: list[str] = []
    if len(apps_df) != len(leg_df) or len(apps_enrolled) != len(stu_active):
        contradictions.append(
            f"Record count divergence: admission_applications={len(apps_df)} ({len(apps_enrolled)} Enrolled), "
            f"legacy admissions={len(leg_df)}, students={len(stu_df)} ({len(stu_active)} Active)."
        )
    if enrolled_without_active_student:
        contradictions.append(
            f"{len(enrolled_without_active_student)} enrolled application AdmissionNo(s) are missing from active students."
        )
    if active_student_without_app:
        contradictions.append(
            f"{len(active_student_without_app)} active student admission_number(s) lack a matching Enrolled row in admission_applications."
        )

    return {
        "counts": {
            "admission_applications_total": int(len(apps_df)),
            "admission_applications_enrolled": int(len(apps_enrolled)),
            "legacy_admissions_total": int(len(leg_df)),
            "legacy_admissions_active_set_count": int(len(leg_adm_set)),
            "students_total_rows": int(len(stu_df)),
            "students_active": int(len(stu_active)),
        },
        "reconciliation_gaps": {
            "enrolled_without_active_student_count": len(enrolled_without_active_student),
            "enrolled_without_active_student_sample": enrolled_without_active_student[:20],
            "active_student_without_app_count": len(active_student_without_app),
            "active_student_without_app_sample": active_student_without_app[:20],
        },
        "contradictions": contradictions,
    }
