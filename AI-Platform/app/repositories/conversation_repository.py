"""SQLite persistence repository for AI conversations, rich investigation messages, and snapshots."""

from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.schemas.chat import AiChatResponse
from app.schemas.security import AiSecurityContext


class ConversationRepository:
    """Strictly user- and tenant-isolated persistence in AI-Platform's SQLite store."""

    def __init__(self, db_path: Path) -> None:
        self._db_path = db_path
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self._db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_schema(self) -> None:
        with self._connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS conversations (
                    id TEXT PRIMARY KEY,
                    tenant_id TEXT NOT NULL,
                    user_id INTEGER NOT NULL,
                    user_role TEXT NOT NULL,
                    title TEXT NOT NULL,
                    branch_id INTEGER,
                    academic_year_id INTEGER,
                    is_pinned INTEGER NOT NULL DEFAULT 0,
                    is_deleted INTEGER NOT NULL DEFAULT 0,
                    memory_summary_json TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations (tenant_id, user_id, is_deleted, updated_at);

                CREATE TABLE IF NOT EXISTS conversation_messages (
                    id TEXT PRIMARY KEY,
                    conversation_id TEXT NOT NULL,
                    tenant_id TEXT NOT NULL,
                    sender TEXT NOT NULL,
                    content TEXT NOT NULL,
                    visual_type TEXT,
                    visual_data_json TEXT,
                    additional_visuals_json TEXT,
                    tool_calls_json TEXT,
                    evidence_json TEXT,
                    investigation_plan_json TEXT,
                    follow_up_questions_json TEXT,
                    pending_action_json TEXT,
                    is_action_executed INTEGER,
                    tokens_used INTEGER NOT NULL DEFAULT 0,
                    latency_ms REAL NOT NULL DEFAULT 0.0,
                    provider_used TEXT,
                    created_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_msg_conv ON conversation_messages (conversation_id, created_at);
                """
            )
            conn.commit()

    def create_conversation(
        self,
        ctx: AiSecurityContext,
        title: str | None = None,
        conv_id: str | None = None,
    ) -> dict[str, Any]:
        cid = conv_id or f"conv_{uuid.uuid4().hex[:16]}"
        now = datetime.now(timezone.utc).isoformat()
        clean_title = (title or "New Investigation").strip()[:120] or "New Investigation"
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO conversations (
                    id, tenant_id, user_id, user_role, title, branch_id, academic_year_id,
                    is_pinned, is_deleted, memory_summary_json, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)
                """,
                (
                    cid,
                    ctx.tenant_id,
                    ctx.user_id,
                    ctx.role,
                    clean_title,
                    ctx.active_branch_id,
                    ctx.academic_year_id,
                    json.dumps({}),
                    now,
                    now,
                ),
            )
            conn.commit()
        return {
            "id": cid,
            "title": clean_title,
            "user_role": ctx.role,
            "created_at": now,
            "updated_at": now,
            "last_message": None,
            "message_count": 0,
            "is_pinned": False,
        }

    def list_conversations(self, ctx: AiSecurityContext, limit: int = 50) -> list[dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT c.*,
                       (SELECT COUNT(*) FROM conversation_messages m WHERE m.conversation_id = c.id) AS message_count,
                       (SELECT content FROM conversation_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message
                FROM conversations c
                WHERE c.tenant_id = ? AND c.user_id = ? AND c.is_deleted = 0
                ORDER BY c.is_pinned DESC, c.updated_at DESC
                LIMIT ?
                """,
                (ctx.tenant_id, ctx.user_id, limit),
            ).fetchall()
        return [
            {
                "id": r["id"],
                "title": r["title"],
                "user_role": r["user_role"],
                "created_at": r["created_at"],
                "updated_at": r["updated_at"],
                "last_message": (r["last_message"] or "")[:140] if r["last_message"] else None,
                "message_count": int(r["message_count"] or 0),
                "is_pinned": bool(r["is_pinned"]),
            }
            for r in rows
        ]

    def get_conversation(self, ctx: AiSecurityContext, conv_id: str) -> dict[str, Any] | None:
        with self._connect() as conn:
            conv = conn.execute(
                """
                SELECT * FROM conversations
                WHERE id = ? AND tenant_id = ? AND user_id = ? AND is_deleted = 0
                """,
                (conv_id, ctx.tenant_id, ctx.user_id),
            ).fetchone()
            if not conv:
                return None

            msgs = conn.execute(
                """
                SELECT * FROM conversation_messages
                WHERE conversation_id = ? AND tenant_id = ?
                ORDER BY created_at ASC
                """,
                (conv_id, ctx.tenant_id),
            ).fetchall()

        formatted_msgs = []
        for m in msgs:
            formatted_msgs.append(
                {
                    "id": m["id"],
                    "sender": m["sender"],
                    "content": m["content"],
                    "visual_type": m["visual_type"],
                    "visual_data": json.loads(m["visual_data_json"]) if m["visual_data_json"] else None,
                    "additional_visuals": json.loads(m["additional_visuals_json"]) if m["additional_visuals_json"] else [],
                    "tool_calls": json.loads(m["tool_calls_json"]) if m["tool_calls_json"] else None,
                    "evidence": json.loads(m["evidence_json"]) if m["evidence_json"] else [],
                    "investigation_plan": json.loads(m["investigation_plan_json"]) if m["investigation_plan_json"] else None,
                    "follow_up_questions": json.loads(m["follow_up_questions_json"]) if m["follow_up_questions_json"] else [],
                    "pending_action": json.loads(m["pending_action_json"]) if m["pending_action_json"] else None,
                    "is_action_executed": bool(m["is_action_executed"]) if m["is_action_executed"] is not None else None,
                    "tokens_used": m["tokens_used"],
                    "latency_ms": m["latency_ms"],
                    "provider_used": m["provider_used"],
                    "created_at": m["created_at"],
                }
            )

        return {
            "conversation": {
                "id": conv["id"],
                "title": conv["title"],
                "user_role": conv["user_role"],
                "created_at": conv["created_at"],
                "updated_at": conv["updated_at"],
                "is_pinned": bool(conv["is_pinned"]),
                "memory_summary": json.loads(conv["memory_summary_json"]) if conv["memory_summary_json"] else {},
            },
            "messages": formatted_msgs,
        }

    def rename_conversation(self, ctx: AiSecurityContext, conv_id: str, new_title: str) -> bool:
        clean = new_title.strip()[:120]
        if not clean:
            return False
        now = datetime.now(timezone.utc).isoformat()
        with self._connect() as conn:
            cur = conn.execute(
                """
                UPDATE conversations
                SET title = ?, updated_at = ?
                WHERE id = ? AND tenant_id = ? AND user_id = ? AND is_deleted = 0
                """,
                (clean, now, conv_id, ctx.tenant_id, ctx.user_id),
            )
            conn.commit()
            return cur.rowcount > 0

    def delete_conversation(self, ctx: AiSecurityContext, conv_id: str) -> bool:
        now = datetime.now(timezone.utc).isoformat()
        with self._connect() as conn:
            cur = conn.execute(
                """
                UPDATE conversations
                SET is_deleted = 1, updated_at = ?
                WHERE id = ? AND tenant_id = ? AND user_id = ? AND is_deleted = 0
                """,
                (now, conv_id, ctx.tenant_id, ctx.user_id),
            )
            conn.commit()
            return cur.rowcount > 0

    def append_user_message(self, ctx: AiSecurityContext, conv_id: str, content: str) -> str:
        msg_id = f"msg_u_{uuid.uuid4().hex[:14]}"
        now = datetime.now(timezone.utc).isoformat()
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO conversation_messages (id, conversation_id, tenant_id, sender, content, created_at)
                VALUES (?, ?, ?, 'user', ?, ?)
                """,
                (msg_id, conv_id, ctx.tenant_id, content, now),
            )
            conn.execute(
                """
                UPDATE conversations
                SET updated_at = ?,
                    title = CASE WHEN title = 'New Investigation' THEN ? ELSE title END
                WHERE id = ? AND tenant_id = ? AND user_id = ?
                """,
                (now, content.strip()[:72] or "Investigation", conv_id, ctx.tenant_id, ctx.user_id),
            )
            conn.commit()
        return msg_id

    def append_assistant_response(self, ctx: AiSecurityContext, response: AiChatResponse) -> None:
        now = response.timestamp.isoformat()
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO conversation_messages (
                    id, conversation_id, tenant_id, sender, content,
                    visual_type, visual_data_json, additional_visuals_json,
                    tool_calls_json, evidence_json, investigation_plan_json,
                    follow_up_questions_json, pending_action_json,
                    tokens_used, latency_ms, provider_used, created_at
                ) VALUES (?, ?, ?, 'assistant', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    response.message_id,
                    response.conversation_id,
                    ctx.tenant_id,
                    response.reply,
                    response.visual_type,
                    json.dumps(response.visual_data, default=str) if response.visual_data is not None else None,
                    json.dumps([v.model_dump() for v in response.additional_visuals], default=str),
                    json.dumps([t.model_dump() for t in response.tool_calls_executed], default=str),
                    json.dumps([e.model_dump() for e in response.evidence], default=str),
                    json.dumps(response.investigation_plan.model_dump(), default=str) if response.investigation_plan else None,
                    json.dumps(response.follow_up_questions, default=str),
                    json.dumps(response.pending_action.model_dump(), default=str) if response.pending_action else None,
                    response.tokens_used,
                    response.latency_ms,
                    response.provider_used,
                    now,
                ),
            )
            conn.execute(
                "UPDATE conversations SET updated_at = ? WHERE id = ? AND tenant_id = ? AND user_id = ?",
                (now, response.conversation_id, ctx.tenant_id, ctx.user_id),
            )
            conn.commit()

    def update_memory_summary(self, ctx: AiSecurityContext, conv_id: str, snapshot: dict[str, Any]) -> None:
        now = datetime.now(timezone.utc).isoformat()
        with self._connect() as conn:
            conn.execute(
                """
                UPDATE conversations
                SET memory_summary_json = ?, updated_at = ?
                WHERE id = ? AND tenant_id = ? AND user_id = ?
                """,
                (json.dumps(snapshot, default=str), now, conv_id, ctx.tenant_id, ctx.user_id),
            )
            conn.commit()

    def mark_pending_action_in_messages(self, ctx: AiSecurityContext, token: str, executed: bool) -> None:
        val = 1 if executed else 0
        with self._connect() as conn:
            conn.execute(
                """
                UPDATE conversation_messages
                SET is_action_executed = ?
                WHERE tenant_id = ? AND pending_action_json LIKE ?
                """,
                (val, ctx.tenant_id, f"%{token}%"),
            )
            conn.commit()
