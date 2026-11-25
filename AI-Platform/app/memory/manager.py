"""User- and tenant-scoped conversation memory manager with optional Redis cache and freshness checks."""

from __future__ import annotations

import json
import logging
import time
from typing import Any

from app.config.settings import Settings
from app.llm.base import LLMMessage
from app.repositories.conversation_repository import ConversationRepository
from app.schemas.chat import AiChatResponse
from app.schemas.security import AiSecurityContext

logger = logging.getLogger(__name__)


class ConversationMemoryManager:
    """Loads bounded conversation history and investigation snapshots without cross-user leakage."""

    def __init__(self, settings: Settings, repo: ConversationRepository) -> None:
        self._settings = settings
        self._repo = repo
        self._redis = None
        if settings.redis_url:
            try:
                import redis  # type: ignore

                self._redis = redis.from_url(settings.redis_url, decode_responses=True, socket_timeout=1.5)
            except Exception as exc:
                logger.warning("Redis unavailable (%s); using SQLite memory only.", exc)

    def _redis_key(self, ctx: AiSecurityContext, conv_id: str) -> str:
        return f"ai_mem:{ctx.tenant_id}:{ctx.user_id}:{conv_id}"

    def load_context(
        self,
        ctx: AiSecurityContext,
        conv_id: str,
        *,
        max_turns: int = 8,
    ) -> tuple[list[LLMMessage], str]:
        detail = self._repo.get_conversation(ctx, conv_id)
        if not detail:
            return [], ""

        msgs = detail["messages"]
        history: list[LLMMessage] = [
            LLMMessage(
                role="user" if m["sender"] == "user" else "assistant",
                content=str(m["content"])[:1500],
            )
            for m in msgs[-(max_turns * 2) :]
        ]

        snapshot = detail["conversation"].get("memory_summary") or {}
        if self._redis is not None:
            try:
                cached = self._redis.get(self._redis_key(ctx, conv_id))
                if cached:
                    snapshot = json.loads(cached)
            except Exception:
                pass

        if not snapshot:
            return history, ""

        captured_at = int(snapshot.get("captured_at", 0))
        age_sec = int(time.time()) - captured_at if captured_at else 999999
        if age_sec > self._settings.memory_ttl_seconds:
            return history, ""

        freshness_note = (
            "fresh (<5m; still verify critical numbers via tools)"
            if age_sec <= self._settings.data_freshness_seconds
            else f"cached snapshot is {age_sec}s old; MUST refresh ERP facts via live tools"
        )
        summary_text = (
            f"Previous objective: {snapshot.get('last_objective', '')}; "
            f"Modules investigated: {', '.join(snapshot.get('modules', []))}; "
            f"Active branch={snapshot.get('branch_id')}; "
            f"Metrics freshness: {freshness_note}."
        )
        return history, summary_text

    def save_turn_snapshot(
        self,
        ctx: AiSecurityContext,
        conv_id: str,
        objective: str,
        response: AiChatResponse,
    ) -> None:
        modules = sorted({tc.module for tc in response.tool_calls_executed if tc.success})
        snapshot: dict[str, Any] = {
            "captured_at": int(time.time()),
            "last_objective": objective[:200],
            "modules": modules,
            "branch_id": ctx.active_branch_id,
            "academic_year_id": ctx.academic_year_id,
            "last_tools": [tc.tool_name for tc in response.tool_calls_executed],
        }
        self._repo.update_memory_summary(ctx, conv_id, snapshot)
        if self._redis is not None:
            try:
                self._redis.setex(
                    self._redis_key(ctx, conv_id),
                    self._settings.memory_ttl_seconds,
                    json.dumps(snapshot),
                )
            except Exception:
                pass
