"""LangGraph state definition for autonomous multi-step ERP investigation."""

from __future__ import annotations

from typing import Any, Awaitable, Callable, Optional, TypedDict

from app.llm.base import LLMMessage, LLMToolCall
from app.schemas.chat import (
    EvidenceItem,
    PendingActionPreview,
    ToolExecutionSummary,
    VisualArtifact,
)
from app.schemas.security import AiSecurityContext, ExecutionBudget


ProgressCallback = Callable[[dict[str, Any]], Awaitable[None]]


class AgentState(TypedDict, total=False):
    # Identity & context
    security_context: AiSecurityContext
    budget: ExecutionBudget
    conversation_id: str
    user_query: str
    history: list[LLMMessage]
    memory_summary: str

    # Investigation lifecycle state
    phase: str
    objective: str
    investigation_depth: str
    modules_involved: list[str]
    planned_steps: list[str]
    requires_cross_module: bool
    discovered_tools: list[Any]
    plan_validation_diagnostics: list[str]

    # Iteration & budget counters
    iteration: int
    tool_calls_count: int
    tokens_used: int
    start_monotonic: float

    # Working memory across loop iterations
    working_messages: list[LLMMessage]
    pending_tool_calls: list[LLMToolCall]
    executed_tools: list[ToolExecutionSummary]
    evidence: list[EvidenceItem]
    visuals: list[VisualArtifact]
    contradictions_detected: list[str]
    pending_action: Optional[PendingActionPreview]

    # Validation & completion
    last_pass_executed_count: int
    is_sufficient: bool
    missing_information: list[str]
    should_continue: bool
    budget_exhausted_reason: Optional[str]

    # Final output
    final_reply: str
    follow_up_questions: list[str]
    provider_used: str
    progress_callback: Optional[ProgressCallback]
