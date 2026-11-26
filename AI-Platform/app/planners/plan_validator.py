"""Execution plan validator and guardrails engine.

Validates proposed tool calls before any tool executes.
Rejects unrelated tools, duplicates, unauthorized calls, and unbounded loops.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

from app.llm.base import LLMToolCall
from app.schemas.security import AiSecurityContext
from app.tools.base import BaseErpTool

logger = logging.getLogger(__name__)


@dataclass
class PlanValidationResult:
    is_valid: bool
    approved_calls: list[LLMToolCall]
    rejected_calls: list[tuple[LLMToolCall, str]] = field(default_factory=list)
    diagnostics: list[str] = field(default_factory=list)


class ExecutionPlanValidator:
    """Validates and enforces guardrails on proposed tool executions."""

    @staticmethod
    def validate_plan(
        ctx: AiSecurityContext,
        proposed_calls: list[LLMToolCall],
        discovered_tools: list[BaseErpTool],
        already_executed: set[str],
        depth: str = "SIMPLE",
        max_calls_for_depth: int = 2,
    ) -> PlanValidationResult:
        discovered_map = {t.name: t for t in discovered_tools}
        approved: list[LLMToolCall] = []
        rejected: list[tuple[LLMToolCall, str]] = []
        diagnostics: list[str] = []

        seen_in_batch: set[str] = set()

        for call in proposed_calls:
            # 1. Check if tool is in discovered candidate set
            if call.name not in discovered_map:
                reason = (
                    f"Tool '{call.name}' rejected: Not in discovered relevant capabilities "
                    f"for request depth '{depth}'"
                )
                rejected.append((call, reason))
                diagnostics.append(reason)
                continue

            tool = discovered_map[call.name]

            # 2. Check RBAC permissions
            if "All" not in tool.allowed_roles and ctx.role not in tool.allowed_roles:
                reason = f"Tool '{call.name}' rejected: User role '{ctx.role}' is not authorized"
                rejected.append((call, reason))
                diagnostics.append(reason)
                continue

            # 3. Check duplicate execution
            if call.name in already_executed:
                reason = f"Tool '{call.name}' rejected: Already executed in previous pass"
                rejected.append((call, reason))
                diagnostics.append(reason)
                continue

            if call.name in seen_in_batch:
                reason = f"Tool '{call.name}' rejected: Duplicate call in current batch"
                rejected.append((call, reason))
                diagnostics.append(reason)
                continue

            # 4. Check depth capacity limits
            if len(approved) >= max_calls_for_depth:
                reason = (
                    f"Tool '{call.name}' rejected: Exceeds maximum tool capacity ({max_calls_for_depth}) "
                    f"for '{depth}' request"
                )
                rejected.append((call, reason))
                diagnostics.append(reason)
                continue

            # Approved
            seen_in_batch.add(call.name)
            approved.append(call)
            diagnostics.append(f"Tool '{call.name}' approved for module '{tool.module}'")

        is_valid = len(approved) > 0 or len(proposed_calls) == 0
        return PlanValidationResult(
            is_valid=is_valid,
            approved_calls=approved,
            rejected_calls=rejected,
            diagnostics=diagnostics,
        )
