"""High-level autonomous agent facade assembling chat requests, budgets, and LangGraph execution."""

from __future__ import annotations

import time
import uuid
from typing import Optional

from app.config.settings import Settings
from app.llm.base import LLMMessage
from app.llm.router import ModelRouter
from app.orchestration.graph import AutonomousErpGraph
from app.orchestration.state import ProgressCallback
from app.schemas.chat import AiChatRequest, AiChatResponse, InvestigationPlanSummary
from app.schemas.security import AiSecurityContext, ExecutionBudget
from app.tools.registry import ToolRegistry


class AutonomousErpAgent:
    """Coordinates security context, execution budget, LangGraph investigation, and response packaging."""

    def __init__(self, settings: Settings, router: ModelRouter, registry: ToolRegistry) -> None:
        self._settings = settings
        self._graph = AutonomousErpGraph(router, registry)

    def default_budget(self) -> ExecutionBudget:
        return ExecutionBudget(
            max_iterations=self._settings.agent_max_iterations,
            max_tool_calls=self._settings.agent_max_tool_calls,
            max_tokens=self._settings.agent_max_tokens,
            timeout_seconds=self._settings.agent_timeout_seconds,
            max_parallel_tools=self._settings.agent_max_parallel_tools,
        )

    async def investigate(
        self,
        ctx: AiSecurityContext,
        request: AiChatRequest,
        *,
        history: Optional[list[LLMMessage]] = None,
        memory_summary: str = "",
        budget: Optional[ExecutionBudget] = None,
        progress_callback: Optional[ProgressCallback] = None,
    ) -> AiChatResponse:
        start = time.perf_counter()
        conv_id = request.conversation_id or uuid.uuid4().hex
        msg_id = uuid.uuid4().hex
        active_budget = budget or self.default_budget()

        final_state = await self._graph.run(
            {
                "security_context": ctx,
                "budget": active_budget,
                "conversation_id": conv_id,
                "user_query": request.message,
                "history": history or [],
                "memory_summary": memory_summary,
                "start_monotonic": time.monotonic(),
                "progress_callback": progress_callback,
            }
        )

        visuals = list(final_state.get("visuals") or [])
        primary_visual_type = visuals[0].visual_type if visuals else None
        primary_visual_data = visuals[0].data if visuals else None
        if final_state.get("pending_action") is not None and primary_visual_type is None:
            primary_visual_type = "action_preview"

        plan_summary = InvestigationPlanSummary(
            objective=final_state.get("objective", request.message),
            modules_involved=list(final_state.get("modules_involved") or []),
            steps=list(final_state.get("planned_steps") or []),
            completed_steps=len(final_state.get("executed_tools") or []),
            iterations_used=int(final_state.get("iteration", 1)),
            contradictions_detected=list(final_state.get("contradictions_detected") or []),
        )

        elapsed_ms = round((time.perf_counter() - start) * 1000.0, 2)
        return AiChatResponse(
            conversation_id=conv_id,
            message_id=msg_id,
            reply=final_state.get("final_reply", ""),
            visual_type=primary_visual_type,
            visual_data=primary_visual_data,
            additional_visuals=visuals[1:] if len(visuals) > 1 else [],
            tool_calls_executed=list(final_state.get("executed_tools") or []),
            evidence=list(final_state.get("evidence") or []),
            investigation_plan=plan_summary,
            follow_up_questions=list(final_state.get("follow_up_questions") or []),
            pending_action=final_state.get("pending_action"),
            tokens_used=int(final_state.get("tokens_used", 0)),
            latency_ms=elapsed_ms,
            provider_used=final_state.get("provider_used", ""),
        )
