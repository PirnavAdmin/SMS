"""Stage 3 tests: FastAPI core, config, telemetry, HMAC security context, and RBAC isolation."""

import time
import pytest
from fastapi.testclient import TestClient

from app.config.settings import Settings
from app.core.exceptions import AuthorizationDeniedError, SecurityContextError
from app.main import create_app
from app.schemas.security import AiSecurityContext
from app.security.context import sign_ai_context, verify_signed_ai_context
from app.security.rbac import (
    assert_class_scope,
    assert_tool_role,
    normalize_role,
    resolve_authorized_branch_id,
    resolve_authorized_student_id,
)


def test_health_ready_metrics():
    app = create_app()
    with TestClient(app) as client:
        res = client.get("/health")
        assert res.status_code == 200
        body = res.json()
        assert body["status"] == "ok"
        assert body["mysql_readonly"] is True
        assert "X-Trace-Id" in res.headers

        ready_res = client.get("/ready")
        assert ready_res.status_code == 200

        metrics_res = client.get("/metrics")
        assert metrics_res.status_code == 200
        assert metrics_res.json()["metrics"]["counters"]["requests_total"] >= 2


def test_role_normalization_defaults_to_least_privilege_staff():
    assert normalize_role(None) == "Staff"
    assert normalize_role("") == "Staff"
    assert normalize_role("unknown_role") == "Staff"
    assert normalize_role("superadmin") == "Super Admin"
    assert normalize_role("Finance") == "Accountant"
    assert normalize_role("warden") == "Hostel Warden"


def test_hmac_context_verification_and_tamper_rejection():
    settings = Settings(ai_context_hmac_secret="test-secret-minimum-32-characters-long!!")
    payload = {
        "user_id": 10,
        "user_name": "Principal Sharma",
        "user_email": "principal@pirnav.edu",
        "raw_role": "Principal",
        "tenant_id": "tenant-default",
        "allowed_branch_ids": [6],
        "active_branch_id": 6,
        "issued_at": int(time.time()),
    }
    token = sign_ai_context(payload, settings.ai_context_hmac_secret)
    ctx = verify_signed_ai_context(token, settings)
    assert ctx.role == "Principal"
    assert ctx.active_branch_id == 6

    # Tamper payload
    body, sig = token.split(".", 1)
    tampered = f"{body}A.{sig}"
    with pytest.raises(SecurityContextError):
        verify_signed_ai_context(tampered, settings)

    # Expired token
    expired_payload = {**payload, "issued_at": int(time.time()) - 500}
    expired_token = sign_ai_context(expired_payload, settings.ai_context_hmac_secret)
    with pytest.raises(SecurityContextError):
        verify_signed_ai_context(expired_token, settings)


def test_branch_student_teacher_scope_enforcement():
    parent_ctx = AiSecurityContext(
        user_id=55,
        user_name="Parent Rao",
        raw_role="Parent",
        role="Parent",
        tenant_id="tenant-default",
        allowed_branch_ids=[6],
        active_branch_id=6,
        linked_child_student_ids=[101, 102],
        issued_at=int(time.time()),
    )
    assert resolve_authorized_student_id(parent_ctx, 101) == 101
    with pytest.raises(AuthorizationDeniedError):
        resolve_authorized_student_id(parent_ctx, 999)
    with pytest.raises(AuthorizationDeniedError):
        resolve_authorized_branch_id(parent_ctx, 13)

    teacher_ctx = AiSecurityContext(
        user_id=22,
        user_name="Teacher Priya",
        raw_role="Teacher",
        role="Teacher",
        tenant_id="tenant-default",
        allowed_branch_ids=[6],
        active_branch_id=6,
        assigned_class_ids=[4, 5],
        issued_at=int(time.time()),
    )
    assert_class_scope(teacher_ctx, 4)
    with pytest.raises(AuthorizationDeniedError):
        assert_class_scope(teacher_ctx, 10)
    with pytest.raises(AuthorizationDeniedError):
        assert_tool_role(teacher_ctx, ("Admin", "Accountant"))
