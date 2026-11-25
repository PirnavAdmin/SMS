"""Stage 5 tests: LangGraph multi-step investigation, budget limits, RBAC filtering, and SSE progress tracing."""

import time
import pytest
from pydantic import BaseModel

from app.agents.autonomous_agent import AutonomousErpAgent
from app.config.settings import Settings
from app.llm.router import ModelRouter
from app.schemas.chat import AiChatRequest, VisualArtifact
from app.schemas.security import AiSecurityContext, ExecutionBudget
from app.tools.base import BaseErpTool, EmptyToolInput, ToolOutput
from app.tools.registry import ToolRegistry


class _StudentOverviewStub(BaseErpTool):
    name = "student_get_overview"
    description = "Get student enrollment overview"
    module = "students"
    allowed_roles = ("Admin", "Principal", "Teacher")
    input_model = EmptyToolInput

    async def _run(self, ctx: AiSecurityContext, params: BaseModel) -> ToolOutput:
        return ToolOutput(
            success=True,
            module="students",
            summary="415 active students verified.",
            record_count=415,
            data={"total": 415},
            visuals=[VisualArtifact(visual_type="table", title="Students", data={"columns": ["Total"], "rows": [{"Total": 415}]})],
        )


class _FinanceHealthStub(BaseErpTool):
    name = "analytics_financial_health"
    description = "Get school financial health and fee collection metrics"
    module = "finance"
    allowed_roles = ("Admin", "Principal", "Accountant")
    input_model = EmptyToolInput

    async def _run(self, ctx: AiSecurityContext, params: BaseModel) -> ToolOutput:
        return ToolOutput(
            success=True,
            module="finance",
            source_type="ANALYTICS_ENGINE",
            summary="Collected ₹103,000 vs assigned paid ₹86,750.",
            record_count=330,
            contradictions=["feepayments sum (103000) differs from studentfeeassignments.PaidAmount sum (86750)"],
        )


@pytest.mark.asyncio
async def test_langgraph_multi_step_investigation_and_trace_events():
    settings = Settings(llm_provider="mock", llm_fallback_provider="none")
    router = ModelRouter(settings)
    registry = ToolRegistry()
    registry.register_many([_StudentOverviewStub(), _FinanceHealthStub()])

    agent = AutonomousErpAgent(settings, router, registry)
    admin_ctx = AiSecurityContext(
        user_id=1,
        user_name="Admin User",
        raw_role="Admin",
        role="Admin",
        tenant_id="tenant-default",
        active_branch_id=6,
        issued_at=int(time.time()),
    )

    events: list[dict] = []

    async def on_progress(ev: dict) -> None:
        events.append(ev)

    response = await agent.investigate(
        admin_ctx,
        AiChatRequest(message="Analyze overall school performance and financial condition"),
        progress_callback=on_progress,
    )

    assert response.investigation_plan is not None
    assert response.investigation_plan.iterations_used >= 2
    assert len(response.tool_calls_executed) == 2
    assert {t.tool_name for t in response.tool_calls_executed} == {"analytics_financial_health", "student_get_overview"}
    assert len(response.evidence) == 2
    assert response.tokens_used > 0
    assert any(e["event"] == "plan" for e in events)
    assert any(e["event"] == "tool_executed" for e in events)
    assert any("feepayments sum" in c for c in response.investigation_plan.contradictions_detected)


@pytest.mark.asyncio
async def test_teacher_cannot_see_finance_tools_and_budget_is_respected():
    settings = Settings(llm_provider="mock", llm_fallback_provider="none")
    router = ModelRouter(settings)
    registry = ToolRegistry()
    registry.register_many([_StudentOverviewStub(), _FinanceHealthStub()])

    agent = AutonomousErpAgent(settings, router, registry)
    teacher_ctx = AiSecurityContext(
        user_id=2,
        user_name="Teacher Rao",
        raw_role="Teacher",
        role="Teacher",
        tenant_id="tenant-default",
        active_branch_id=6,
        assigned_class_ids=[1],
        issued_at=int(time.time()),
    )

    budget = ExecutionBudget(max_iterations=2, max_tool_calls=2, max_tokens=20000, timeout_seconds=15.0)
    resp = await agent.investigate(
        teacher_ctx,
        AiChatRequest(message="Show financial health and student strength"),
        budget=budget,
    )
    executed_names = [t.tool_name for t in resp.tool_calls_executed]
    assert "analytics_financial_health" not in executed_names
    assert len(executed_names) <= 2
