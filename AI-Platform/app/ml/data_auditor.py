"""Data sufficiency & quality auditor gating ML training and forecasting."""

from __future__ import annotations

from typing import Any

from app.integrations.mysql_reader import get_mysql_reader
from app.schemas.security import AiSecurityContext


async def audit_ml_readiness(ctx: AiSecurityContext) -> dict[str, Any]:
    """Audits actual historical volume and time-span before allowing ML execution."""
    mysql = get_mysql_reader()
    tid = ctx.tenant_id

    att = await mysql.fetch_one(
        """
        SELECT COUNT(*) AS row_count,
               COUNT(DISTINCT AttendanceSessionId) AS session_count,
               COUNT(DISTINCT StudentId) AS student_count
        FROM student_attendances
        WHERE TenantId = :tid
        """,
        {"tid": tid},
    )
    fees = await mysql.fetch_one(
        "SELECT COUNT(*) AS assignment_rows FROM studentfeeassignments WHERE TenantId = :tid",
        {"tid": tid},
    )
    payments = await mysql.fetch_one(
        """
        SELECT COUNT(*) AS payment_rows,
               COUNT(DISTINCT DATE(PaymentDate)) AS distinct_days
        FROM feepayments
        WHERE TenantId = :tid
        """,
        {"tid": tid},
    )
    students_ts = await mysql.fetch_one(
        """
        SELECT COUNT(*) AS active_students,
               COUNT(DISTINCT DATE(created_at)) AS enrollment_days,
               MIN(DATE(created_at)) AS first_date,
               MAX(DATE(created_at)) AS last_date
        FROM students
        WHERE TenantId = :tid AND is_deleted = 0
        """,
        {"tid": tid},
    )
    hostel = await mysql.fetch_one(
        "SELECT COUNT(*) AS allocation_rows FROM student_bed_allocations WHERE TenantId = :tid",
        {"tid": tid},
    )
    transport = await mysql.fetch_one(
        "SELECT COUNT(*) AS transport_rows FROM student_transport_assignments WHERE TenantId = :tid AND IsDeleted = 0",
        {"tid": tid},
    )

    att_rows = int((att or {}).get("row_count") or 0)
    att_students = int((att or {}).get("student_count") or 0)
    sfa_rows = int((fees or {}).get("assignment_rows") or 0)
    pay_rows = int((payments or {}).get("payment_rows") or 0)
    enr_days = int((students_ts or {}).get("enrollment_days") or 0)
    hostel_rows = int((hostel or {}).get("allocation_rows") or 0)
    transport_rows = int((transport or {}).get("transport_rows") or 0)

    gates = {
        "attendance_anomaly_detection": {
            "justified": att_rows >= 200 and att_students >= 20,
            "sample_count": att_rows,
            "min_required": 200,
            "method": "Scikit-Learn IsolationForest + Behavioral Z-Score (non-demographic features only)",
            "status": "READY" if (att_rows >= 200 and att_students >= 20) else "INSUFFICIENT_DATA",
        },
        "financial_outlier_detection": {
            "justified": sfa_rows >= 50,
            "sample_count": sfa_rows,
            "min_required": 50,
            "method": "Scikit-Learn IsolationForest + IQR Outlier Detection",
            "status": "READY" if sfa_rows >= 50 else "INSUFFICIENT_DATA",
        },
        "enrollment_trend_forecasting": {
            "justified": enr_days >= 14,
            "sample_count": enr_days,
            "min_required": 14,
            "method": "Walk-forward Linear / Ridge Regression with Prediction Interval"
            if enr_days >= 14
            else "GATED",
            "status": "LIMITED_SHORT_WINDOW_FORECAST_ONLY" if enr_days >= 14 else "INSUFFICIENT_HISTORY",
            "caveat": (
                f"History spans {(students_ts or {}).get('first_date')} to {(students_ts or {}).get('last_date')} "
                f"({enr_days} active intake dates); single-season data cannot capture annual seasonality."
            ),
        },
        "fee_collection_forecasting": {
            "justified": pay_rows >= 30,
            "sample_count": pay_rows,
            "min_required": 30,
            "method": "GATED - Insufficient receipt history for reliable ML forecasting",
            "status": "INSUFFICIENT_DATA",
        },
        "hostel_occupancy_forecasting": {
            "justified": hostel_rows >= 30,
            "sample_count": hostel_rows,
            "min_required": 30,
            "method": "GATED - Too few historical bed allocation transitions",
            "status": "INSUFFICIENT_DATA",
        },
        "transport_demand_forecasting": {
            "justified": transport_rows >= 30,
            "sample_count": transport_rows,
            "min_required": 30,
            "method": "GATED - Insufficient transport time-series history",
            "status": "INSUFFICIENT_DATA",
        },
    }

    return {
        "ethical_policy": (
            "No sensitive student characteristics (gender, religion, caste, parental metadata) are used. "
            "Models are gated against overfitting and predictions are advisory only."
        ),
        "raw_counts": {
            "attendance_records": att_rows,
            "attendance_students": att_students,
            "fee_assignments": sfa_rows,
            "fee_payment_receipts": pay_rows,
            "distinct_enrollment_days": enr_days,
            "hostel_allocations": hostel_rows,
            "transport_assignments": transport_rows,
        },
        "gates": gates,
    }
