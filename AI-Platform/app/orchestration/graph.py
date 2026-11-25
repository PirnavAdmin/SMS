"""Stateful LangGraph Autonomous Investigation Engine.

Lifecycle:
UNDERSTAND -> PLAN -> INVESTIGATE -> SELECT_TOOLS -> EXECUTE -> OBSERVE -> ANALYZE -> VALIDATE -> CONTINUE_OR_COMPLETE -> RESPOND
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Any

from langgraph.graph import END, START, StateGraph

from app.analytics.result_processor import StrictResultProcessor
from app.llm.base import LLMMessage, LLMToolCall, LLMToolDefinition
from app.llm.router import ModelRouter
from app.orchestration.state import AgentState
from app.planners.investigation_planner import InvestigationPlanner
from app.planners.plan_validator import ExecutionPlanValidator
from app.schemas.chat import ToolExecutionSummary
from app.tools.discovery import SemanticToolDiscovery
from app.tools.registry import ToolRegistry

logger = logging.getLogger(__name__)


class AutonomousErpGraph:
    """Compiles and runs the LangGraph state machine for autonomous ERP investigations."""

    def __init__(self, router: ModelRouter, registry: ToolRegistry) -> None:
        self._router = router
        self._registry = registry
        self._planner = InvestigationPlanner(router)
        self._discovery = SemanticToolDiscovery(registry)
        self._validator = ExecutionPlanValidator()
        self._graph = self._compile_graph()

    @staticmethod
    async def _emit(state: AgentState, event_type: str, data: dict[str, Any]) -> None:
        cb = state.get("progress_callback")
        if cb is not None:
            try:
                await cb({"event": event_type, "data": data})
            except Exception as exc:
                logger.debug("Progress callback failed: %s", exc)

    def _check_budget(self, state: AgentState) -> str | None:
        budget = state["budget"]
        elapsed = time.monotonic() - state.get("start_monotonic", time.monotonic())
        if elapsed >= budget.timeout_seconds:
            return f"Execution timeout reached ({budget.timeout_seconds}s)"
        if state.get("iteration", 0) >= budget.max_iterations:
            return f"Max investigation iterations reached ({budget.max_iterations})"
        if state.get("tool_calls_count", 0) >= budget.max_tool_calls:
            return f"Max tool calls reached ({budget.max_tool_calls})"
        if state.get("tokens_used", 0) >= budget.max_tokens:
            return f"Token budget reached ({budget.max_tokens})"
        return None

    async def _node_understand(self, state: AgentState) -> dict[str, Any]:
        ctx = state["security_context"]
        await self._emit(
            state,
            "stage",
            {"stage": "UNDERSTAND", "message": f"Interpreting request for role {ctx.role}"},
        )
        history = list(state.get("history") or [])
        memory_summary = state.get("memory_summary") or ""
        working = list(history)
        if memory_summary:
            working.append(
                LLMMessage(
                    role="system",
                    content=f"Previous verified investigation context:\n{memory_summary}",
                )
            )
        working.append(LLMMessage(role="user", content=state["user_query"]))

        # Phase 2: Separate Tool Discovery from Tool Execution
        discovery = self._discovery.discover(ctx, state["user_query"])
        return {
            "phase": "UNDERSTAND",
            "working_messages": working,
            "investigation_depth": discovery.depth,
            "discovered_tools": discovery.candidate_tools,
            "iteration": 0,
            "tool_calls_count": 0,
            "tokens_used": 0,
            "executed_tools": [],
            "evidence": [],
            "visuals": [],
            "contradictions_detected": [],
            "missing_information": [],
            "pending_tool_calls": [],
            "pending_action": None,
            "budget_exhausted_reason": None,
        }

    async def _node_plan(self, state: AgentState) -> dict[str, Any]:
        ctx = state["security_context"]
        depth = state.get("investigation_depth", "SIMPLE")
        discovered = state.get("discovered_tools") or self._discovery.discover(ctx, state["user_query"]).candidate_tools
        tool_defs = [
            LLMToolDefinition(
                name=t.name,
                description=f"[{t.module}] {t.description}",
                parameters_schema=t.json_schema(),
            )
            for t in discovered
        ]
        plan, tokens = await self._planner.build_plan(
            ctx,
            state["user_query"],
            list(state.get("history") or []),
            tool_defs,
            depth=depth,
        )
        await self._emit(
            state,
            "plan",
            {
                "stage": "PLAN",
                "objective": plan.objective,
                "depth": depth,
                "modules": plan.modules_involved,
                "steps": plan.steps,
            },
        )
        return {
            "phase": "PLAN",
            "objective": plan.objective,
            "modules_involved": plan.modules_involved,
            "planned_steps": plan.steps,
            "requires_cross_module": plan.requires_cross_module_analysis,
            "tokens_used": state.get("tokens_used", 0) + tokens,
        }

    async def _node_investigate(self, state: AgentState) -> dict[str, Any]:
        iteration = state.get("iteration", 0) + 1
        await self._emit(
            state,
            "stage",
            {
                "stage": "INVESTIGATE",
                "iteration": iteration,
                "modules": state.get("modules_involved", []),
                "message": f"Investigation pass {iteration}",
            },
        )
        return {
            "phase": "INVESTIGATE",
            "iteration": iteration,
            "last_pass_executed_count": 0,
        }

    async def _node_select_tools(self, state: AgentState) -> dict[str, Any]:
        ctx = state["security_context"]
        budget = state["budget"]
        depth = state.get("investigation_depth", "SIMPLE")
        discovered = state.get("discovered_tools") or self._discovery.discover(ctx, state["user_query"]).candidate_tools
        tool_defs = [
            LLMToolDefinition(
                name=t.name,
                description=f"[{t.module}] {t.description}",
                parameters_schema=t.json_schema(),
            )
            for t in discovered
        ]
        if not tool_defs:
            return {"phase": "SELECT_TOOLS", "pending_tool_calls": []}

        max_allowed = 2 if depth == "SIMPLE" else (4 if depth == "ANALYTICAL" else budget.max_tool_calls)
        sys_prompt = (
            "You are an autonomous School ERP Investigation Agent.\n"
            f"Authenticated User: {ctx.user_name} | Role: {ctx.role} | Tenant: {ctx.tenant_id} | "
            f"BranchId: {ctx.active_branch_id} | AcademicYear: {ctx.academic_year_name or 'All'}.\n"
            f"Assessed Request Depth: {depth}\n"
            f"Investigation Objective: {state.get('objective', state['user_query'])}\n"
            f"Planned Steps: {state.get('planned_steps', [])}\n"
            "Rules:\n"
            f"- Select AT MOST {max_allowed} tool call(s) strictly needed to answer the request.\n"
            "- ONLY select from the provided candidate tools. Never request unrelated tools.\n"
            "- Do NOT repeat identical tool calls unnecessarily.\n"
            "- Never fabricate numbers or claim records you have not retrieved.\n"
            "- If you already have complete verified evidence across all needed modules, return NO tool calls and summarize."
        )
        resp = await self._router.generate(
            list(state.get("working_messages") or []),
            system_prompt=sys_prompt,
            tools=tool_defs,
            tier="reasoning",
            temperature=0.0,
        )
        remaining_calls = min(max_allowed, max(0, budget.max_tool_calls - state.get("tool_calls_count", 0)))
        selected = list(resp.tool_calls[:remaining_calls])
        working = list(state.get("working_messages") or [])
        if selected:
            working.append(LLMMessage(role="assistant", content=resp.content or "", tool_calls=selected))
        elif resp.content:
            working.append(LLMMessage(role="assistant", content=resp.content))

        await self._emit(
            state,
            "tools_selected",
            {"stage": "SELECT_TOOLS", "tools": [tc.name for tc in selected]},
        )
        return {
            "phase": "SELECT_TOOLS",
            "pending_tool_calls": selected,
            "working_messages": working,
            "tokens_used": state.get("tokens_used", 0) + resp.usage.total_tokens,
            "provider_used": resp.provider,
        }

    async def _node_execute(self, state: AgentState) -> dict[str, Any]:
        ctx = state["security_context"]
        budget = state["budget"]
        pending: list[LLMToolCall] = list(state.get("pending_tool_calls") or [])
        if not pending:
            return {"phase": "EXECUTE"}

        # Phase 4: Enforce Execution Plan Validation and Depth Guardrails
        depth = state.get("investigation_depth", "SIMPLE")
        max_for_depth = 2 if depth == "SIMPLE" else (4 if depth == "ANALYTICAL" else budget.max_tool_calls)
        executed_names = {t.tool_name for t in state.get("executed_tools") or []}

        validation = self._validator.validate_plan(
            ctx,
            pending,
            state.get("discovered_tools") or [],
            executed_names,
            depth=depth,
            max_calls_for_depth=max_for_depth,
        )
        approved_pending = validation.approved_calls
        if not approved_pending:
            logger.info("Plan Validator: No tool calls approved. Diagnostics: %s", validation.diagnostics)
            return {
                "phase": "EXECUTE",
                "pending_tool_calls": [],
                "plan_validation_diagnostics": validation.diagnostics,
            }

        semaphore = asyncio.Semaphore(budget.max_parallel_tools)

        async def run_one(tc: LLMToolCall):
            async with semaphore:
                tool = self._registry.get(tc.name)
                if tool is None:
                    from app.tools.base import ToolOutput

                    return tc, ToolOutput(success=False, module="system", summary=f"Unknown tool '{tc.name}'", error="Not registered"), 0.0
                out, dur = await tool.execute(ctx, tc.arguments)
                return tc, out, dur

        results = await asyncio.gather(*(run_one(tc) for tc in approved_pending))

        working = list(state.get("working_messages") or [])
        executed = list(state.get("executed_tools") or [])
        evidence = list(state.get("evidence") or [])
        visuals = list(state.get("visuals") or [])
        contradictions = list(state.get("contradictions_detected") or [])
        pending_action = state.get("pending_action")

        for tc, out, dur in results:
            executed.append(
                ToolExecutionSummary(
                    tool_name=tc.name,
                    module=out.module,
                    description=f"Executed {tc.name}",
                    success=out.success,
                    duration_ms=dur,
                    record_count=out.record_count,
                    summary=out.summary,
                    error=out.error,
                )
            )
            evidence.append(out.to_evidence(tc.name))
            visuals.extend(out.visuals)
            contradictions.extend(out.contradictions)
            if out.pending_action is not None:
                pending_action = out.pending_action

            tool_payload = {
                "success": out.success,
                "module": out.module,
                "summary": out.summary,
                "record_count": out.record_count,
                "data": out.data,
                "contradictions": out.contradictions,
                "error": out.error,
            }
            working.append(
                LLMMessage(
                    role="tool",
                    tool_call_id=tc.call_id,
                    tool_name=tc.name,
                    content=json.dumps(tool_payload, default=str)[:12000],
                )
            )
            await self._emit(
                state,
                "tool_executed",
                {
                    "stage": "EXECUTE",
                    "tool_name": tc.name,
                    "module": out.module,
                    "success": out.success,
                    "record_count": out.record_count,
                    "duration_ms": dur,
                    "summary": out.summary,
                },
            )

        return {
            "phase": "EXECUTE",
            "pending_tool_calls": [],
            "working_messages": working,
            "executed_tools": executed,
            "evidence": evidence,
            "visuals": visuals,
            "contradictions_detected": list(dict.fromkeys(contradictions)),
            "pending_action": pending_action,
            "tool_calls_count": state.get("tool_calls_count", 0) + len(results),
            "last_pass_executed_count": len(results),
            "plan_validation_diagnostics": validation.diagnostics,
        }

    async def _node_observe(self, state: AgentState) -> dict[str, Any]:
        await self._emit(
            state,
            "stage",
            {
                "stage": "OBSERVE",
                "tools_completed": len(state.get("executed_tools") or []),
                "evidence_count": len(state.get("evidence") or []),
            },
        )
        return {"phase": "OBSERVE"}

    async def _node_analyze(self, state: AgentState) -> dict[str, Any]:
        contradictions = list(state.get("contradictions_detected") or [])
        await self._emit(
            state,
            "stage",
            {
                "stage": "ANALYZE",
                "contradictions_count": len(contradictions),
                "message": "Analyzing retrieved ERP metrics and consistency checks",
            },
        )
        return {"phase": "ANALYZE"}

    async def _node_validate(self, state: AgentState) -> dict[str, Any]:
        budget_msg = self._check_budget(state)
        executed_names = [t.tool_name for t in state.get("executed_tools") or []]
        if budget_msg:
            return {
                "phase": "VALIDATE",
                "is_sufficient": True,
                "budget_exhausted_reason": budget_msg,
                "should_continue": False,
            }

        depth = state.get("investigation_depth", "SIMPLE")

        # Phase 5 & 8: Investigation Depth Guardrails & Loop Termination
        # 1. SIMPLE requests MUST terminate after 1 pass. Zero runaway loops!
        if depth == "SIMPLE":
            return {
                "phase": "VALIDATE",
                "is_sufficient": True,
                "should_continue": False,
            }

        # 2. ANALYTICAL requests terminate after iteration 1 if tools executed
        if depth == "ANALYTICAL" and state.get("iteration", 0) >= 1 and executed_names:
            return {
                "phase": "VALIDATE",
                "is_sufficient": True,
                "should_continue": False,
            }

        # 3. COMPLEX investigations terminate after iteration 2
        if state.get("iteration", 0) >= 2:
            return {
                "phase": "VALIDATE",
                "is_sufficient": True,
                "should_continue": False,
            }

        # If no tools were selected on the last select step, the agent believes it has enough information
        if not executed_names and state.get("iteration", 0) >= 1:
            return {"phase": "VALIDATE", "is_sufficient": True, "should_continue": False}

        obs_text = "\n".join(
            f"- {t.tool_name} ({'ok' if t.success else 'err'}, rows={t.record_count}): {t.summary}"
            for t in state.get("executed_tools") or []
        )
        plan_obj = {
            "objective": state.get("objective", state["user_query"]),
            "modules_involved": state.get("modules_involved", []),
            "steps": state.get("planned_steps", []),
        }
        from app.planners.investigation_planner import StructuredInvestigationPlan

        assessment, tokens = await self._planner.assess_sufficiency(
            state["user_query"],
            StructuredInvestigationPlan(**plan_obj),
            executed_names,
            obs_text,
        )

        ctx = state["security_context"]
        discovered = state.get("discovered_tools") or self._discovery.discover(ctx, state["user_query"]).candidate_tools
        unexecuted = [t.name for t in discovered if t.name not in executed_names]

        should_continue = (
            depth in ("ANALYTICAL", "COMPLEX")
            and not assessment.is_sufficient
            and bool(unexecuted)
            and state.get("iteration", 0) < 2
        )

        await self._emit(
            state,
            "stage",
            {
                "stage": "VALIDATE",
                "is_sufficient": assessment.is_sufficient,
                "should_continue": should_continue,
                "missing_information": assessment.missing_information,
            },
        )
        return {
            "phase": "VALIDATE",
            "is_sufficient": assessment.is_sufficient,
            "missing_information": assessment.missing_information,
            "should_continue": should_continue,
            "tokens_used": state.get("tokens_used", 0) + tokens,
        }

    def _route_after_select(self, state: AgentState) -> str:
        if state.get("pending_tool_calls"):
            return "execute"
        return "observe"

    def _route_continue_or_complete(self, state: AgentState) -> str:
        if state.get("should_continue"):
            return "investigate"
        return "respond"

    async def _node_respond(self, state: AgentState) -> dict[str, Any]:
        ctx = state["security_context"]
        await self._emit(state, "stage", {"stage": "RESPOND", "message": "Synthesizing verified report"})

        evidence_lines = "\n".join(
            f"- [{e.source_type}] {e.module}.{e.tool_name} (records={e.record_count}): {e.summary}"
            for e in state.get("evidence") or []
        )
        contradictions = state.get("contradictions_detected") or []
        contradiction_note = (
            "\nData Consistency Findings:\n" + "\n".join(f"- {c}" for c in contradictions)
            if contradictions
            else ""
        )
        budget_note = (
            f"\nNote: Investigation stopped at safety limit ({state['budget_exhausted_reason']})."
            if state.get("budget_exhausted_reason")
            else ""
        )

        sys_prompt = (
            "You are the Pirnav School Management System Autonomous ERP Analyst.\n"
            f"User: {ctx.user_name} ({ctx.role}) | Tenant: {ctx.tenant_id} | BranchId: {ctx.active_branch_id}.\n"
            "Synthesize an executive, evidence-backed response strictly from the observed tool data.\n"
            "- Never fabricate or extrapolate unretrieved numbers.\n"
            "- Distinguish Live ERP metrics, Analytical calculations, ML predictions (include confidence/caveats), and Document RAG policies.\n"
            "- Highlight anomalies, contradictions, and concrete operational recommendations.\n"
            "- Do NOT expose internal chain-of-thought."
        )
        synthesis_msgs = [
            *list(state.get("working_messages") or []),
            LLMMessage(
                role="system",
                content=(
                    f"Verified Evidence Summary:\n{evidence_lines or 'No tool evidence collected.'}"
                    f"{contradiction_note}{budget_note}"
                ),
            ),
        ]
        resp = await self._router.generate(
            synthesis_msgs,
            system_prompt=sys_prompt,
            tier="reasoning",
            temperature=0.1,
        )
        follow_ups, fu_tokens = await self._planner.suggest_follow_ups(
            state["user_query"],
            resp.content,
            list(state.get("modules_involved") or []),
        )

        # Phase 6: Strict Result Processing Layer (clean Markdown tables, NO raw JSON)
        final_presentation = StrictResultProcessor.format_final_response(
            state["user_query"],
            state.get("evidence") or [],
            state.get("executed_tools") or [],
            resp.content,
        )

        return {
            "phase": "RESPOND",
            "final_reply": final_presentation,
            "follow_up_questions": follow_ups,
            "tokens_used": state.get("tokens_used", 0) + resp.usage.total_tokens + fu_tokens,
            "provider_used": resp.provider or state.get("provider_used", ""),
        }

    def _compile_graph(self):
        builder = StateGraph(AgentState)
        builder.add_node("understand", self._node_understand)
        builder.add_node("plan", self._node_plan)
        builder.add_node("investigate", self._node_investigate)
        builder.add_node("select_tools", self._node_select_tools)
        builder.add_node("execute", self._node_execute)
        builder.add_node("observe", self._node_observe)
        builder.add_node("analyze", self._node_analyze)
        builder.add_node("validate", self._node_validate)
        builder.add_node("respond", self._node_respond)

        builder.add_edge(START, "understand")
        builder.add_edge("understand", "plan")
        builder.add_edge("plan", "investigate")
        builder.add_edge("investigate", "select_tools")
        builder.add_conditional_edges(
            "select_tools",
            self._route_after_select,
            {"execute": "execute", "observe": "observe"},
        )
        builder.add_edge("execute", "observe")
        builder.add_edge("observe", "analyze")
        builder.add_edge("analyze", "validate")
        builder.add_conditional_edges(
            "validate",
            self._route_continue_or_complete,
            {"investigate": "investigate", "respond": "respond"},
        )
        builder.add_edge("respond", END)
        return builder.compile()

    async def run(self, initial_state: AgentState) -> AgentState:
        budget = initial_state["budget"]
        rec_limit = max(35, budget.max_iterations * 8 + 10)
        return await self._graph.ainvoke(initial_state, config={"recursion_limit": rec_limit})
