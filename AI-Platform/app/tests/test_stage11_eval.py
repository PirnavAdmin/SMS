"""Stage 11 Comprehensive Enterprise Evaluation & Security Penetration Verification."""

from __future__ import annotations

import time
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config.settings import get_settings
from app.evaluation.runner import run_evaluation_suite
from app.main import app
from app.security.context import sign_ai_context, verify_signed_ai_context
from app.core.exceptions import SecurityContextError


@pytest.mark.asyncio
async def test_10_enterprise_evaluation_scenarios_against_live_sms_new_test(tmp_path: Path):
    # Use deterministic Mock provider for reproducible CI benchmark across live sms_new_test data
    settings = get_settings().model_copy(update={"llm_provider": "mock"})
    report_file = settings.resolved_sqlite_path.parent / "stage11_eval_report.json"
    summary = await run_evaluation_suite(settings, report_path=report_file)

    assert summary["total_scenarios"] == 10
    for item in summary["results"]:
        assert item["passed"] is True, f"Scenario {item['scenario_id']} failed: {item['note']}"
    assert summary["pass_rate_pct"] == 100.0


def test_security_penetration_spoofing_tampering_and_role_escalation():
    settings = get_settings()
    client = TestClient(app)

    # 1. Missing authentication header -> 401
    r_noauth = client.post("/api/v1/ai/chat", json={"message": "Analyze students"})
    assert r_noauth.status_code == 401

    # 2. Tampered X-AI-Context signature -> 401
    valid_token = sign_ai_context(
        {
            "user_id": 5,
            "user_name": "Teacher User",
            "raw_role": "Teacher",
            "role": "Teacher",
            "tenant_id": "tenant-default",
            "issued_at": int(time.time()),
            "nonce": "sec1",
        },
        settings.ai_context_hmac_secret,
    )
    tampered = valid_token[:-4] + ("0000" if not valid_token.endswith("0000") else "1111")
    r_tamper = client.post(
        "/api/v1/ai/chat",
        headers={"X-AI-Context": tampered},
        json={"message": "Analyze finance"},
    )
    assert r_tamper.status_code == 401

    # 3. Expired token -> rejected
    expired = sign_ai_context(
        {
            "user_id": 1,
            "user_name": "Old Admin",
            "raw_role": "Admin",
            "role": "Admin",
            "tenant_id": "tenant-default",
            "issued_at": int(time.time()) - 600,
        },
        settings.ai_context_hmac_secret,
    )
    with pytest.raises(SecurityContextError):
        verify_signed_ai_context(expired, settings)

    # 4. Parent attempting to upload RAG document -> 403 Forbidden
    parent_tok = sign_ai_context(
        {
            "user_id": 700,
            "user_name": "Parent",
            "raw_role": "Parent",
            "role": "Parent",
            "tenant_id": "tenant-default",
            "linked_child_student_ids": [1119],
            "issued_at": int(time.time()),
        },
        settings.ai_context_hmac_secret,
    )
    r_upload = client.post(
        "/api/v1/ai/documents",
        headers={"X-AI-Context": parent_tok},
        files={"file": ("hack.txt", b"unauthorized", "text/plain")},
    )
    assert r_upload.status_code == 403

    # 5. Restricted single-branch Teacher attempting to override into branch 13 -> 403
    teacher_tok = sign_ai_context(
        {
            "user_id": 200,
            "user_name": "Madhapur Teacher",
            "raw_role": "Teacher",
            "role": "Teacher",
            "tenant_id": "tenant-default",
            "allowed_branch_ids": [6],
            "active_branch_id": 6,
            "assigned_class_ids": [21],
            "issued_at": int(time.time()),
        },
        settings.ai_context_hmac_secret,
    )
    r_escape = client.post(
        "/api/v1/ai/chat",
        headers={"X-AI-Context": teacher_tok},
        json={"message": "Show attendance overview", "requested_branch_id": 13},
    )
    assert r_escape.status_code == 403
