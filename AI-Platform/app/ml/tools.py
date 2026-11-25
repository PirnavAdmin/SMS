"""Tool wrappers exposing the data-sufficiency auditor and ML models cleanly."""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.ml.data_auditor import audit_ml_readiness
from app.ml.models import (
    run_attendance_anomaly_detection,
    run_financial_outlier_detection,
    run_gated_forecasting,
)
from app.schemas.chat import VisualArtifact
from app.schemas.security import AiSecurityContext
from app.tools.base import BaseErpTool, ToolOutput


class MlDataReadinessTool(BaseErpTool):
    name = "ml_data_readiness_audit"
    description = (
        "Audits historical ERP data volume, time-span, and completeness to decide which ML models "
        "are statistically justified vs gated."
    )
    module = "ml"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Accountant", "HR")

    async def _run(self, ctx: AiSecurityContext, params: BaseModel) -> ToolOutput:
        res = await audit_ml_readiness(ctx)
        rows = [{"Model": k, **v} for k, v in res["gates"].items()]
        return ToolOutput(
            success=True,
            module=self.module,
            source_type="ML_PREDICTION",
            record_count=len(rows),
            summary="Audited ERP dataset readiness across 6 ML candidates; gated under-sampled forecasting targets.",
            data=res,
            visuals=[VisualArtifact(visual_type="table", title="ML Data Sufficiency Gates", data={"rows": rows})],
        )


class AttendanceAnomalyInput(BaseModel):
    min_sessions: int = Field(default=3, ge=1, le=30)


class MlAttendanceAnomalyTool(BaseErpTool):
    name = "ml_attendance_anomaly_detection"
    description = (
        "Runs IsolationForest and behavioral Z-score anomaly detection on non-demographic attendance patterns "
        "to surface unusual absenteeism or lateness for human counselor review."
    )
    module = "ml"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Teacher", "HR")
    input_model = AttendanceAnomalyInput

    async def _run(self, ctx: AiSecurityContext, params: AttendanceAnomalyInput) -> ToolOutput:
        res = await run_attendance_anomaly_detection(ctx, min_sessions=params.min_sessions)
        anomalies = res.get("anomalies", [])
        return ToolOutput(
            success=True,
            module=self.module,
            source_type="ML_PREDICTION",
            record_count=len(anomalies),
            summary=(
                f"Attendance ML scan ({res.get('model_version')}): flagged {len(anomalies)} behavioral anomaly profile(s). "
                f"Advisory only — requires staff verification."
            ),
            data=res,
            visuals=[VisualArtifact(visual_type="table", title="Attendance Behavioral Anomalies (Advisory)", data={"rows": anomalies})]
            if anomalies
            else [],
        )


class MlFinancialOutlierTool(BaseErpTool):
    name = "ml_financial_outlier_detection"
    description = (
        "Runs Scikit-Learn IsolationForest on fee assignment balances to identify unusual billing or partial-payment profiles."
    )
    module = "ml"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Accountant")

    async def _run(self, ctx: AiSecurityContext, params: BaseModel) -> ToolOutput:
        res = await run_financial_outlier_detection(ctx)
        outliers = res.get("outliers", [])
        return ToolOutput(
            success=True,
            module=self.module,
            source_type="ML_PREDICTION",
            record_count=len(outliers),
            summary=f"Financial ML scan analyzed {res.get('total_analyzed', 0)} accounts and flagged {len(outliers)} outlier profile(s).",
            data=res,
            visuals=[VisualArtifact(visual_type="table", title="Fee Account Outliers (Advisory)", data={"rows": outliers})]
            if outliers
            else [],
        )


class MlForecastingTool(BaseErpTool):
    name = "ml_gated_forecasting"
    description = (
        "Evaluates longitudinal data sufficiency and executes walk-forward short-window enrollment forecasting "
        "with MAE metrics while honestly gating sparse modules."
    )
    module = "ml"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Accountant")

    async def _run(self, ctx: AiSecurityContext, params: BaseModel) -> ToolOutput:
        res = await run_gated_forecasting(ctx)
        enr = res["enrollment_forecast"]
        return ToolOutput(
            success=True,
            module=self.module,
            source_type="ML_PREDICTION",
            record_count=1,
            summary=(
                f"Gated Forecasting: enrollment status={enr.get('status')} "
                f"(holdout MAE={enr.get('holdout_validation_mae', 'N/A')}); "
                "fee collection, hostel, and transport forecasting gated due to insufficient longitudinal history."
            ),
            data=res,
        )


def get_ml_tools():
    return [
        MlDataReadinessTool(),
        MlAttendanceAnomalyTool(),
        MlFinancialOutlierTool(),
        MlForecastingTool(),
    ]
