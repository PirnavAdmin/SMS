"""FastAPI endpoints for Autonomous AI Chat, SSE Streaming, Memory/Conversations, Actions, and Capabilities."""

from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime, timezone
from functools import lru_cache
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.agents.autonomous_agent import AutonomousErpAgent
from app.config.settings import Settings, get_settings
from app.integrations.erp_bridge import get_erp_bridge
from app.integrations.mysql_reader import get_mysql_reader
from app.llm.router import ModelRouter
from app.memory.manager import ConversationMemoryManager
from app.repositories.conversation_repository import ConversationRepository
from app.schemas.chat import AiChatRequest, AiChatResponse
from app.schemas.security import AiSecurityContext
from app.security.action_store import PendingActionStore
from app.security.context import get_security_context
from app.security.rbac import EXECUTIVE_ROLES, resolve_authorized_branch_id
from app.tools.catalog import get_default_registry

router = APIRouter(prefix="/api/v1/ai", tags=["Autonomous School AI Platform"])


@lru_cache(maxsize=1)
def get_conversation_repo() -> ConversationRepository:
    return ConversationRepository(get_settings().resolved_sqlite_path)


@lru_cache(maxsize=1)
def get_memory_manager() -> ConversationMemoryManager:
    settings = get_settings()
    return ConversationMemoryManager(settings, get_conversation_repo())


@lru_cache(maxsize=1)
def get_autonomous_agent() -> AutonomousErpAgent:
    settings = get_settings()
    return AutonomousErpAgent(settings, ModelRouter(settings), get_default_registry())


class CreateConversationInput(BaseModel):
    title: Optional[str] = Field(default="New Investigation", max_length=120)


class RenameConversationInput(BaseModel):
    title: str = Field(min_length=1, max_length=120)


class ConfirmActionInput(BaseModel):
    confirmation_token: str = Field(min_length=4)
    confirmed: bool = True


async def _apply_scope_overrides(
    ctx: AiSecurityContext,
    body: AiChatRequest,
) -> AiSecurityContext:
    """Validates any requested branch or academic year override against DB and RBAC."""
    branch_id = body.requested_branch_id
    branch_name = ctx.active_branch_name

    if branch_id is None and body.requested_branch_name:
        mysql = get_mysql_reader()
        row = await mysql.fetch_one(
            """
            SELECT BranchId, BranchName FROM branches
            WHERE TenantId = :tid AND Status = 'Active'
              AND (LOWER(BranchName) = LOWER(:bn) OR LOWER(BranchCode) = LOWER(:bn))
            LIMIT 1
            """,
            {"tid": ctx.tenant_id, "bn": body.requested_branch_name.strip()},
        )
        if row:
            branch_id = int(row["BranchId"])
            branch_name = str(row["BranchName"])

    authorized_bid = resolve_authorized_branch_id(ctx, branch_id)
    if authorized_bid != ctx.active_branch_id and authorized_bid is not None and not branch_name:
        mysql = get_mysql_reader()
        row = await mysql.fetch_one(
            "SELECT BranchName FROM branches WHERE TenantId = :tid AND BranchId = :bid LIMIT 1",
            {"tid": ctx.tenant_id, "bid": authorized_bid},
        )
        if row:
            branch_name = str(row["BranchName"])

    ay_id = body.requested_academic_year_id if body.requested_academic_year_id is not None else ctx.academic_year_id
    ay_name = body.requested_academic_year or ctx.academic_year_name
    if body.requested_academic_year and body.requested_academic_year_id is None:
        mysql = get_mysql_reader()
        yrow = await mysql.fetch_one(
            "SELECT academic_year_id, academic_year_name FROM academic_years WHERE TenantId = :tid AND is_deleted = 0 AND academic_year_name = :yn LIMIT 1",
            {"tid": ctx.tenant_id, "yn": body.requested_academic_year.strip()},
        )
        if yrow:
            ay_id = int(yrow["academic_year_id"])
            ay_name = str(yrow["academic_year_name"])

    return ctx.model_copy(
        update={
            "active_branch_id": authorized_bid,
            "active_branch_name": branch_name,
            "academic_year_id": ay_id,
            "academic_year_name": ay_name,
        }
    )


@router.get("/capabilities")
async def get_capabilities(ctx: AiSecurityContext = Depends(get_security_context)) -> dict[str, Any]:
    settings = get_settings()
    registry = get_default_registry()
    authorized = registry.authorized_tools(ctx)
    return {
        "role": ctx.role,
        "tenant_id": ctx.tenant_id,
        "active_branch_id": ctx.active_branch_id,
        "active_branch_name": ctx.active_branch_name,
        "academic_year_name": ctx.academic_year_name,
        "llm_provider": settings.llm_provider,
        "authorized_tool_count": len(authorized),
        "tools": [
            {
                "name": t.name,
                "module": t.module,
                "description": t.description,
                "is_write_action": t.is_write_action,
            }
            for t in authorized
        ],
    }


@router.get("/conversations")
async def list_conversations(ctx: AiSecurityContext = Depends(get_security_context)) -> dict[str, Any]:
    repo = get_conversation_repo()
    return {"conversations": repo.list_conversations(ctx)}


@router.post("/conversations")
async def create_conversation(
    body: CreateConversationInput,
    ctx: AiSecurityContext = Depends(get_security_context),
) -> dict[str, Any]:
    repo = get_conversation_repo()
    conv = repo.create_conversation(ctx, title=body.title)
    return {"conversation": conv}


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    ctx: AiSecurityContext = Depends(get_security_context),
) -> dict[str, Any]:
    repo = get_conversation_repo()
    detail = repo.get_conversation(ctx, conversation_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Conversation not found or access denied.")
    return detail


@router.patch("/conversations/{conversation_id}")
async def rename_conversation(
    conversation_id: str,
    body: RenameConversationInput,
    ctx: AiSecurityContext = Depends(get_security_context),
) -> dict[str, Any]:
    repo = get_conversation_repo()
    ok = repo.rename_conversation(ctx, conversation_id, body.title)
    if not ok:
        raise HTTPException(status_code=404, detail="Conversation not found or access denied.")
    return {"success": True}


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    ctx: AiSecurityContext = Depends(get_security_context),
) -> dict[str, Any]:
    repo = get_conversation_repo()
    ok = repo.delete_conversation(ctx, conversation_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Conversation not found or access denied.")
    return {"success": True}


@router.post("/chat", response_model=AiChatResponse)
async def post_chat(
    body: AiChatRequest,
    ctx: AiSecurityContext = Depends(get_security_context),
) -> AiChatResponse:
    scoped_ctx = await _apply_scope_overrides(ctx, body)
    repo = get_conversation_repo()
    memory = get_memory_manager()
    agent = get_autonomous_agent()

    conv_id = body.conversation_id
    if conv_id:
        existing = repo.get_conversation(scoped_ctx, conv_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Conversation not found or access denied.")
    else:
        created = repo.create_conversation(scoped_ctx, title=body.message[:72])
        conv_id = created["id"]

    history, mem_summary = memory.load_context(scoped_ctx, conv_id)
    repo.append_user_message(scoped_ctx, conv_id, body.message)

    req = body.model_copy(update={"conversation_id": conv_id})
    response = await agent.investigate(
        scoped_ctx,
        req,
        history=history,
        memory_summary=mem_summary,
    )
    repo.append_assistant_response(scoped_ctx, response)
    memory.save_turn_snapshot(scoped_ctx, conv_id, body.message, response)
    return response


@router.post("/chat/stream")
async def stream_chat(
    body: AiChatRequest,
    request: Request,
    ctx: AiSecurityContext = Depends(get_security_context),
) -> StreamingResponse:
    scoped_ctx = await _apply_scope_overrides(ctx, body)
    repo = get_conversation_repo()
    memory = get_memory_manager()
    agent = get_autonomous_agent()

    conv_id = body.conversation_id
    if conv_id:
        existing = repo.get_conversation(scoped_ctx, conv_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Conversation not found or access denied.")
    else:
        created = repo.create_conversation(scoped_ctx, title=body.message[:72])
        conv_id = created["id"]

    history, mem_summary = memory.load_context(scoped_ctx, conv_id)
    repo.append_user_message(scoped_ctx, conv_id, body.message)
    req = body.model_copy(update={"conversation_id": conv_id})

    queue: asyncio.Queue[dict[str, Any] | None] = asyncio.Queue()

    async def on_progress(event: dict[str, Any]) -> None:
        await queue.put({"event": event.get("stage", "status"), "data": event})

    async def runner() -> None:
        try:
            response = await agent.investigate(
                scoped_ctx,
                req,
                history=history,
                memory_summary=mem_summary,
                progress_callback=on_progress,
            )
            repo.append_assistant_response(scoped_ctx, response)
            memory.save_turn_snapshot(scoped_ctx, conv_id, body.message, response)
            await queue.put({"event": "complete", "data": response.model_dump(mode="json")})
        except Exception as exc:
            await queue.put({"event": "error", "data": {"message": str(exc)}})
        finally:
            await queue.put(None)

    async def event_stream():
        task = asyncio.create_task(runner())
        try:
            yield f"event: started\ndata: {json.dumps({'conversation_id': conv_id})}\n\n"
            while True:
                if await request.is_disconnected():
                    task.cancel()
                    break
                item = await queue.get()
                if item is None:
                    break
                ev_name = item["event"]
                payload = json.dumps(item["data"], default=str)
                yield f"event: {ev_name}\ndata: {payload}\n\n"
        finally:
            if not task.done():
                task.cancel()

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/actions/confirm")
async def confirm_action(
    body: ConfirmActionInput,
    ctx: AiSecurityContext = Depends(get_security_context),
) -> dict[str, Any]:
    store = PendingActionStore(get_settings().resolved_sqlite_path)
    repo = get_conversation_repo()
    action = store.get_action(body.confirmation_token, ctx)
    if not action:
        raise HTTPException(status_code=404, detail="Pending action token not found for your account.")
    if action["status"] != "PENDING":
        return {"success": False, "message": f"Action token was already processed ({action['status']}).", "result_details": None}

    expires_at = datetime.fromisoformat(action["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        store.mark_status(body.confirmation_token, "EXPIRED")
        return {"success": False, "message": "Confirmation token has expired.", "result_details": None}

    if not body.confirmed:
        store.mark_status(body.confirmation_token, "CANCELLED")
        repo.mark_pending_action_in_messages(ctx, body.confirmation_token, False)
        return {"success": True, "message": "Action cancelled cleanly. No ERP records modified.", "result_details": {"status": "CANCELLED"}}

    params = json.loads(action["parameters_json"])
    bridge_result = await get_erp_bridge().execute_write_action(
        ctx,
        action_type=action["action_type"],
        parameters=params,
    )
    store.mark_status(body.confirmation_token, "EXECUTED", bridge_result)
    repo.mark_pending_action_in_messages(ctx, body.confirmation_token, True)
    return {
        "success": bool(bridge_result.get("success", True)),
        "message": str(bridge_result.get("message", "Confirmed action executed through ASP.NET Core ERP.")),
        "result_details": bridge_result.get("resultDetails") or bridge_result,
    }


@router.get("/suggested-prompts")
async def get_suggested_prompts(ctx: AiSecurityContext = Depends(get_security_context)) -> dict[str, Any]:
    if ctx.role in EXECUTIVE_ROLES:
        prompts = [
            {
                "category": "Cross-Module Risk",
                "prompt": "Analyze students who have financial dues and poor attendance",
                "description": "Correlates fee receivables with session attendance across classes.",
                "icon": "AlertTriangle",
            },
            {
                "category": "Financial Intelligence",
                "prompt": "Analyze the school's financial condition",
                "description": "Reconciles fee demand, receipts, receivables, hostel, transport, and expenses.",
                "icon": "DollarSign",
            },
            {
                "category": "Data Integrity",
                "prompt": "Identify admissions and student record inconsistencies",
                "description": "Cross-checks admission_applications, legacy admissions, and active students.",
                "icon": "GitCompare",
            },
            {
                "category": "Operations",
                "prompt": "Analyze hostel occupancy and transport route utilization",
                "description": "Reviews block bed capacity, occupancy rate, fleet compliance, and run-rate.",
                "icon": "Building",
            },
        ]
    elif ctx.role == "Accountant":
        prompts = [
            {
                "category": "Finance",
                "prompt": "Analyze the school's financial condition and highlight payment variances",
                "description": "Checks receipts vs fee assignments, receivables, expenses, and discounts.",
                "icon": "DollarSign",
            },
            {
                "category": "Collections",
                "prompt": "List top students with outstanding fee dues",
                "description": "Prioritizes fee receivables for follow-up.",
                "icon": "FileText",
            },
        ]
    elif ctx.role == "Teacher":
        prompts = [
            {
                "category": "Attendance",
                "prompt": "Show attendance summary and students below 75% attendance",
                "description": "Reviews assigned class attendance rates.",
                "icon": "Users",
            },
            {
                "category": "Examinations",
                "prompt": "Summarize recent exam results and class averages",
                "description": "Inspects class pass rates and score distributions.",
                "icon": "Award",
            },
        ]
    elif ctx.role in {"Parent", "Student"}:
        prompts = [
            {
                "category": "Academics & Attendance",
                "prompt": "Show attendance summary, exam results, and fee dues for my ward/account",
                "description": "Retrieves personal authorized ERP profile.",
                "icon": "GraduationCap",
            },
            {
                "category": "School Policies",
                "prompt": "What are the school fee and attendance rules?",
                "description": "Searches school policy and circular documents.",
                "icon": "BookOpen",
            },
        ]
    else:
        prompts = [
            {
                "category": "Operations",
                "prompt": f"Summarize authorized {ctx.role} metrics from the school ERP",
                "description": "Investigates live module data within your permitted scope.",
                "icon": "Sparkles",
            }
        ]
    return {"prompts": prompts}
