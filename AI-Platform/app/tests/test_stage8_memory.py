"""Stage 8 tests: Persistent Conversation Memory, User/Tenant Isolation, Multi-Turn Continuity & Chat Endpoints."""

from __future__ import annotations

from pathlib import Path
from fastapi.testclient import TestClient

from app.config.settings import get_settings
from app.main import app
from app.security.context import sign_ai_context


def _auth_header(user_id: int, role: str = "Super Admin", tenant_id: str = "tenant-default", **extra) -> dict[str, str]:
    import time

    settings = get_settings()
    payload = {
        "user_id": user_id,
        "user_name": f"User {user_id}",
        "user_email": f"u{user_id}@pirnav.edu",
        "raw_role": role,
        "role": role,
        "tenant_id": tenant_id,
        "allowed_branch_ids": extra.get("allowed_branch_ids", []),
        "active_branch_id": extra.get("active_branch_id"),
        "linked_child_student_ids": extra.get("linked_child_student_ids", []),
        "issued_at": int(time.time()),
        "nonce": "stage8nonce",
    }
    return {"X-AI-Context": sign_ai_context(payload, settings.ai_context_hmac_secret)}


def test_chat_multi_turn_memory_and_strict_user_tenant_isolation(tmp_path: Path):
    client = TestClient(app)

    admin_hdrs = _auth_header(user_id=9101, role="Super Admin", tenant_id="tenant-default")
    other_user_hdrs = _auth_header(user_id=9102, role="Admin", tenant_id="tenant-default")
    other_tenant_hdrs = _auth_header(user_id=9101, role="Super Admin", tenant_id="tenant-other")

    # 1. Create conversation & run Turn 1 (cross-module dues + attendance)
    resp1 = client.post(
        "/api/v1/ai/chat",
        headers=admin_hdrs,
        json={"message": "Analyze students who have financial dues and poor attendance"},
    )
    assert resp1.status_code == 200, resp1.text
    d1 = resp1.json()
    conv_id = d1["conversation_id"]
    assert conv_id
    assert len(d1["tool_calls_executed"]) >= 1
    assert d1["investigation_plan"]["completed_steps"] >= 1

    # 2. Follow-up turn in same conversation preserves memory & history
    resp2 = client.post(
        "/api/v1/ai/chat",
        headers=admin_hdrs,
        json={
            "conversation_id": conv_id,
            "message": "Now summarize the school's financial condition",
        },
    )
    assert resp2.status_code == 200, resp2.text
    d2 = resp2.json()
    assert d2["conversation_id"] == conv_id

    # 3. Verify conversation history persisted cleanly
    hist = client.get(f"/api/v1/ai/conversations/{conv_id}", headers=admin_hdrs)
    assert hist.status_code == 200
    assert len(hist.json()["messages"]) == 4  # 2 user + 2 assistant

    # 4. Different user in SAME tenant MUST NOT access user 9101's conversation
    denied_user = client.get(f"/api/v1/ai/conversations/{conv_id}", headers=other_user_hdrs)
    assert denied_user.status_code == 404

    # 5. Same user_id in DIFFERENT tenant MUST NOT access tenant-default's conversation
    denied_tenant = client.get(f"/api/v1/ai/conversations/{conv_id}", headers=other_tenant_hdrs)
    assert denied_tenant.status_code == 404

    # 6. Verify SSE streaming endpoint emits expected events
    with client.stream(
        "POST",
        "/api/v1/ai/chat/stream",
        headers=admin_hdrs,
        json={"conversation_id": conv_id, "message": "Analyze hostel occupancy"},
    ) as sresp:
        assert sresp.status_code == 200
        body = "".join(sresp.iter_text())
        assert "event: started" in body
        assert "event: complete" in body

    # 7. Cleanup synthetic conversation in sqlite
    del_res = client.delete(f"/api/v1/ai/conversations/{conv_id}", headers=admin_hdrs)
    assert del_res.status_code == 200
