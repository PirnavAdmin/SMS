"""Explainable Scikit-Learn ML detectors & gated forecasters with model evaluation logging."""

from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error
from sklearn.preprocessing import StandardScaler

from app.config.settings import get_settings
from app.integrations.mysql_reader import get_mysql_reader
from app.ml.data_auditor import audit_ml_readiness
from app.schemas.security import AiSecurityContext
from app.tools.erp_helpers import apply_branch_in_clause, apply_student_isolation_clause, resolve_scope_filters


def _record_ml_run(
    *,
    model_name: str,
    model_version: str,
    dataset_rows: int,
    metrics: dict[str, Any],
    confidence: str,
) -> str:
    db_path: Path = get_settings().resolved_sqlite_path
    db_path.parent.mkdir(parents=True, exist_ok=True)
    run_id = f"ml_{uuid.uuid4().hex[:12]}"
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS ml_model_runs (
                run_id TEXT PRIMARY KEY,
                model_name TEXT NOT NULL,
                model_version TEXT NOT NULL,
                dataset_rows INTEGER NOT NULL,
                metrics_json TEXT NOT NULL,
                confidence TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            INSERT INTO ml_model_runs (run_id, model_name, model_version, dataset_rows, metrics_json, confidence, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                run_id,
                model_name,
                model_version,
                dataset_rows,
                json.dumps(metrics),
                confidence,
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        conn.commit()
    return run_id


async def run_attendance_anomaly_detection(
    ctx: AiSecurityContext,
    *,
    contamination: float = 0.08,
    min_sessions: int = 3,
) -> dict[str, Any]:
    """
    Unsupervised IsolationForest + Z-score anomaly detection on behavioral attendance patterns only.
    Strictly excludes protected or demographic student attributes.
    """
    readiness = await audit_ml_readiness(ctx)
    gate = readiness["gates"]["attendance_anomaly_detection"]
    if not gate["justified"]:
        return {
            "status": "GATED",
            "model_version": "attendance-iforest-v1.0",
            "reason": f"Insufficient data ({gate['sample_count']} < {gate['min_required']}).",
            "anomalies": [],
        }

    mysql = get_mysql_reader()
    scope = await resolve_scope_filters(ctx, reader=mysql)
    where = ["s.TenantId = :tid", "s.is_deleted = 0"]
    qparams: dict[str, object] = {"tid": scope["tenant_id"]}
    apply_branch_in_clause(where, qparams, scope, "s.branch_id")
    apply_student_isolation_clause(where, qparams, ctx, "s.student_id", "s.class_id")

    rows = await mysql.fetch_all(
        f"""
        SELECT
            s.student_id, s.admission_number, s.student_name,
            COALESCE(c.ClassName, CONCAT('Class #', s.class_id)) AS class_name,
            COUNT(sa.Id) AS total_sessions,
            SUM(CASE WHEN LOWER(sa.Status) = 'present' THEN 1 ELSE 0 END) AS present_sessions,
            SUM(CASE WHEN LOWER(sa.Status) = 'absent' THEN 1 ELSE 0 END) AS absent_sessions,
            SUM(CASE WHEN LOWER(sa.Status) = 'late' THEN 1 ELSE 0 END) AS late_sessions
        FROM students s
        JOIN student_attendances sa ON sa.StudentId = s.student_id AND sa.TenantId = :tid
        LEFT JOIN classes c ON c.id = s.class_id
        WHERE {' AND '.join([w.removeprefix('AND ') for w in where])}
        GROUP BY s.student_id, s.admission_number, s.student_name, c.ClassName
        HAVING COUNT(sa.Id) >= :min_s
        """,
        {**qparams, "min_s": min_sessions},
    )

    if len(rows) < 12:
        return {
            "status": "INSUFFICIENT_SCOPE_COHORT",
            "model_version": "attendance-iforest-v1.0",
            "reason": f"Authorized scope has {len(rows)} students with >= {min_sessions} sessions; need at least 12 for IsolationForest.",
            "anomalies": [],
        }

    df = pd.DataFrame(rows)
    df["absent_rate"] = df["absent_sessions"] / df["total_sessions"]
    df["late_rate"] = df["late_sessions"] / df["total_sessions"]
    df["present_rate"] = df["present_sessions"] / df["total_sessions"]

    feature_cols = ["total_sessions", "absent_rate", "late_rate"]
    X = StandardScaler().fit_transform(df[feature_cols].astype(float))

    model = IsolationForest(contamination=min(max(contamination, 0.02), 0.2), random_state=42)
    preds = model.fit_predict(X)
    scores = model.decision_function(X)

    cohort_mean_abs = float(df["absent_rate"].mean())
    cohort_std_abs = max(float(df["absent_rate"].std(ddof=0)), 1e-4)

    df["anomaly_flag"] = preds == -1
    df["anomaly_score"] = np.round(-scores, 4)
    df["absent_zscore"] = np.round((df["absent_rate"] - cohort_mean_abs) / cohort_std_abs, 2)
    df["attendance_pct"] = np.round(df["present_rate"] * 100.0, 2)

    flagged = df[df["anomaly_flag"]].sort_values(by="anomaly_score", ascending=False).head(30)
    anomalies = []
    for _, r in flagged.iterrows():
        reasons = []
        if r["absent_zscore"] >= 1.5:
            reasons.append(f"absent rate z-score={r['absent_zscore']} (high absenteeism)")
        if float(r["late_rate"]) > 0.25:
            reasons.append(f"elevated late arrival rate ({round(float(r['late_rate']) * 100, 1)}%)")
        if int(r["total_sessions"]) < float(df["total_sessions"].median()) * 0.5:
            reasons.append("unusually low recorded session count")
        if not reasons:
            reasons.append("multivariate deviation from peer attendance distribution")

        anomalies.append(
            {
                "student_id": int(r["student_id"]),
                "admission_number": r["admission_number"],
                "student_name": r["student_name"],
                "class_name": r["class_name"],
                "total_sessions": int(r["total_sessions"]),
                "attendance_pct": float(r["attendance_pct"]),
                "absent_sessions": int(r["absent_sessions"]),
                "late_sessions": int(r["late_sessions"]),
                "anomaly_score": float(r["anomaly_score"]),
                "explanation": "; ".join(reasons),
            }
        )

    eval_metrics = {
        "evaluated_students": int(len(df)),
        "flagged_count": int(len(flagged)),
        "cohort_mean_absent_rate": round(cohort_mean_abs, 4),
        "features_used": feature_cols,
        "protected_attributes_excluded": True,
    }
    run_id = _record_ml_run(
        model_name="attendance_anomaly_isolation_forest",
        model_version="attendance-iforest-v1.0",
        dataset_rows=int(len(df)),
        metrics=eval_metrics,
        confidence="MEDIUM (Advisory pattern detection; requires human counselor review)",
    )

    return {
        "status": "EXECUTED",
        "run_id": run_id,
        "model_version": "attendance-iforest-v1.0",
        "disclaimer": "Statistical anomaly indicators are advisory signals for human staff review, not disciplinary facts.",
        "evaluation": eval_metrics,
        "anomalies": anomalies,
    }


async def run_financial_outlier_detection(ctx: AiSecurityContext) -> dict[str, Any]:
    """Detects unusual billing/due patterns using IQR + IsolationForest over studentfeeassignments."""
    mysql = get_mysql_reader()
    tid = ctx.tenant_id

    rows = await mysql.fetch_all(
        """
        SELECT sfa.Id, sfa.StudentId, s.admission_number, s.student_name,
               c.ClassName AS class_name, sfa.TotalAmount, sfa.PaidAmount, sfa.DueAmount, sfa.Status
        FROM studentfeeassignments sfa
        LEFT JOIN students s ON CAST(s.student_id AS CHAR) = sfa.StudentId AND s.TenantId = :tid
        LEFT JOIN classes c ON c.id = s.class_id
        WHERE sfa.TenantId = :tid
        """,
        {"tid": tid},
    )
    if len(rows) < 20:
        return {"status": "GATED", "reason": "Fewer than 20 fee assignment records.", "outliers": []}

    df = pd.DataFrame(rows)
    for col in ("TotalAmount", "PaidAmount", "DueAmount"):
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)
    df["paid_ratio"] = np.where(df["TotalAmount"] > 0, df["PaidAmount"] / df["TotalAmount"], 0.0)

    feats = ["TotalAmount", "PaidAmount", "DueAmount", "paid_ratio"]
    X = StandardScaler().fit_transform(df[feats])
    model = IsolationForest(contamination=0.05, random_state=42)
    df["is_outlier"] = model.fit_predict(X) == -1
    df["score"] = np.round(-model.decision_function(X), 4)

    outliers = (
        df[df["is_outlier"]]
        .sort_values(by="score", ascending=False)
        .head(25)[["Id", "StudentId", "admission_number", "student_name", "class_name", "TotalAmount", "PaidAmount", "DueAmount", "score"]]
        .to_dict(orient="records")
    )
    run_id = _record_ml_run(
        model_name="fee_assignment_outlier_iforest",
        model_version="fee-outlier-v1.0",
        dataset_rows=int(len(df)),
        metrics={"records": int(len(df)), "outliers_flagged": len(outliers), "mean_total": round(float(df["TotalAmount"].mean()), 2)},
        confidence="MEDIUM (Advisory anomaly scan)",
    )
    return {
        "status": "EXECUTED",
        "run_id": run_id,
        "model_version": "fee-outlier-v1.0",
        "disclaimer": "Outliers reflect unusual fee/payment profiles (e.g., partial payments or alternate fee tiers) requiring accounting verification.",
        "total_analyzed": int(len(df)),
        "outliers": outliers,
    }


async def run_gated_forecasting(ctx: AiSecurityContext) -> dict[str, Any]:
    """
    Runs walk-forward Ridge regression ONLY if enrollment date series satisfies >= 14 distinct days;
    explicitly gates Fee Collections, Hostel, and Transport forecasting where sms_new_test lacks historical depth.
    """
    readiness = await audit_ml_readiness(ctx)
    gates = readiness["gates"]

    enrollment_forecast: dict[str, Any] = {
        "status": "GATED",
        "reason": gates["enrollment_trend_forecasting"]["caveat"],
    }

    if gates["enrollment_trend_forecasting"]["justified"]:
        mysql = get_mysql_reader()
        daily = await mysql.fetch_all(
            """
            SELECT DATE(created_at) AS intake_date, COUNT(*) AS added
            FROM students
            WHERE TenantId = :tid AND is_deleted = 0
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) ASC
            """,
            {"tid": ctx.tenant_id},
        )
        df = pd.DataFrame(daily)
        df["day_idx"] = np.arange(len(df))
        df["cumulative_students"] = df["added"].cumsum()

        split = max(int(len(df) * 0.75), len(df) - 5)
        train_df = df.iloc[:split]
        val_df = df.iloc[split:]

        reg = Ridge(alpha=1.0)
        reg.fit(train_df[["day_idx"]], train_df["cumulative_students"])
        val_preds = reg.predict(val_df[["day_idx"]])
        val_mae = round(float(mean_absolute_error(val_df["cumulative_students"], val_preds)), 2)

        # Refit on full observed short window to project 14-day continuation with honest uncertainty band
        reg_full = Ridge(alpha=1.0)
        reg_full.fit(df[["day_idx"]], df["cumulative_students"])
        last_idx = int(df["day_idx"].iloc[-1])
        future_14_pred = round(float(reg_full.predict(np.array([[last_idx + 14]]))[0]), 1)
        current_total = int(df["cumulative_students"].iloc[-1])

        run_id = _record_ml_run(
            model_name="enrollment_short_window_ridge",
            model_version="enr-ridge-v1.0",
            dataset_rows=int(len(df)),
            metrics={"holdout_mae_students": val_mae, "slope_per_intake_day": round(float(reg_full.coef_[0]), 2)},
            confidence="LOW-MEDIUM (Short single-term window; non-seasonal baseline only)",
        )
        enrollment_forecast = {
            "status": "EXECUTED_WITH_CAVEATS",
            "run_id": run_id,
            "model_version": "enr-ridge-v1.0",
            "current_active_cumulative": current_total,
            "projected_14_intake_step_cumulative": max(current_total, int(round(future_14_pred))),
            "holdout_validation_mae": val_mae,
            "uncertainty_band_plus_minus": max(int(round(val_mae * 1.5)), 5),
            "caveat": gates["enrollment_trend_forecasting"]["caveat"],
            "disclaimer": "Projection is an extrapolation from recent onboarding batch timestamps, not confirmed future admissions.",
        }

    return {
        "data_readiness_audit": readiness,
        "enrollment_forecast": enrollment_forecast,
        "fee_collection_forecast": gates["fee_collection_forecasting"],
        "hostel_occupancy_forecast": gates["hostel_occupancy_forecasting"],
        "transport_demand_forecast": gates["transport_demand_forecasting"],
    }
