"""Stage 9 tests: Gated Machine Learning Engine + Permissioned RAG Document Engine."""

from __future__ import annotations

import time
import pytest
from fastapi.testclient import TestClient

from app.config.settings import get_settings
from app.main import app
from app.schemas.security import AiSecurityContext
from app.security.context import sign_ai_context
from app.tools.catalog import build_default_registry


def _ctx(role: str = "Super Admin") -> AiSecurityContext:
    return AiSecurityContext(
        user_id=1,
        user_name=f"Stage9 {role}",
        user_email=f"{role.lower()}@pirnav.edu",
        raw_role=role,
        role=role,  # type: ignore[arg-type]
        tenant_id="tenant-default",
        issued_at=int(time.time()),
    )


def _auth(user_id: int, role: str) -> dict[str, str]:
    settings = get_settings()
    token = sign_ai_context(
        {
            "user_id": user_id,
            "user_name": f"U{user_id}",
            "user_email": f"u{user_id}@pirnav.edu",
            "raw_role": role,
            "role": role,
            "tenant_id": "tenant-default",
            "issued_at": int(time.time()),
            "nonce": "s9",
        },
        settings.ai_context_hmac_secret,
    )
    return {"X-AI-Context": token}


@pytest.mark.asyncio
async def test_ml_tools_audit_data_sufficiency_and_detect_anomalies_without_sensitive_attrs():
    registry = build_default_registry(include_optional_subsystems=True)
    admin = _ctx("Super Admin")

    readiness, _ = await registry.get("ml_data_readiness_audit").execute(admin, {})
    assert readiness.success is True
    assert readiness.source_type == "ML_PREDICTION"
    gates = readiness.data["gates"]
    assert gates["attendance_anomaly_detection"]["justified"] is True
    assert gates["fee_collection_forecasting"]["justified"] is False

    att_ml, _ = await registry.get("ml_attendance_anomaly_detection").execute(admin, {"min_sessions": 3})
    assert att_ml.success is True
    assert att_ml.data["status"] == "EXECUTED"
    assert att_ml.data["evaluation"]["protected_attributes_excluded"] is True
    assert "advisory" in att_ml.data["disclaimer"].lower()

    fee_ml, _ = await registry.get("ml_financial_outlier_detection").execute(admin, {})
    assert fee_ml.success is True
    assert fee_ml.data["status"] == "EXECUTED"

    fc_ml, _ = await registry.get("ml_gated_forecasting").execute(admin, {})
    assert fc_ml.success is True
    assert fc_ml.data["fee_collection_forecast"]["status"] == "INSUFFICIENT_DATA"


@pytest.mark.asyncio
async def test_rag_permission_isolation_and_circular_sync():
    client = TestClient(app)
    admin_h = _auth(1, "Super Admin")
    parent_h = _auth(555, "Parent")

    # Upload Admin/HR-only policy document
    up = client.post(
        "/api/v1/ai/documents",
        headers=admin_h,
        files={"file": ("confidential_compensation.txt", b"Secret compensation audit guideline for HR only.", "text/plain")},
        data={"category": "hr_confidential", "allowed_roles": "Super Admin,HR"},
    )
    assert up.status_code == 200, up.text
    doc_id = up.json()["document"]["doc_id"]

    # Sync live circulars from sms_new_test
    sync_r = client.post("/api/v1/ai/documents/sync-circulars", headers=admin_h)
    assert sync_r.status_code == 200
    assert sync_r.json()["circulars_synced"] >= 1

    # Admin CAN search confidential doc; Parent CANNOT see confidential HR doc
    registry = build_default_registry(include_optional_subsystems=True)
    rag_tool = registry.get("rag_search_documents")
    assert rag_tool is not None

    admin_res, _ = await rag_tool.execute(_ctx("Admin"), {"query": "Secret compensation audit guideline"})
    assert admin_res.success is True
    assert admin_res.source_type == "DOCUMENT_RAG"
    assert any(m["doc_id"] == doc_id for m in admin_res.data["matches"])

    parent_res, _ = await rag_tool.execute(_ctx("Parent"), {"query": "Secret compensation audit guideline"})
    assert parent_res.success is True
    assert not any(m["doc_id"] == doc_id for m in parent_res.data["matches"])
    # Parent CANNOT see hr payroll handbook either
    assert not any(m["doc_id"] == "policy_hr_payroll_confidentiality" for m in parent_res.data["matches"])

    # Cleanup synthetic test upload
    del_r = client.delete(f"/api/v1/ai/documents/{doc_id}", headers=admin_h)
    assert del_r.status_code == 200
