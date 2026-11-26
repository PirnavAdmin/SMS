"""Structured investigation planner and sufficiency critic."""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.llm.base import LLMMessage, LLMToolDefinition
from app.llm.router import ModelRouter
from app.schemas.security import AiSecurityContext


class StructuredInvestigationPlan(BaseModel):
    objective: str
    investigation_depth: str = "SIMPLE"  # SIMPLE | ANALYTICAL | COMPLEX
    modules_involved: list[str] = Field(default_factory=list)
    steps: list[str] = Field(default_factory=list)
    planned_tools: list[str] = Field(default_factory=list)
    requires_cross_module_analysis: bool = False
    requires_ml: bool = False
    requires_rag: bool = False


class InvestigationAssessment(BaseModel):
    is_sufficient: bool = True
    confidence: float = 0.8
    missing_information: list[str] = Field(default_factory=list)
    next_focus: str = ""


class FollowUpSuggestions(BaseModel):
    follow_up_questions: list[str] = Field(default_factory=list)


class InvestigationPlanner:
    """Uses the fast LLM tier to decompose user requests and assess investigation sufficiency."""

    def __init__(self, router: ModelRouter) -> None:
        self._router = router

    async def build_plan(
        self,
        ctx: AiSecurityContext,
        query: str,
        history: list[LLMMessage],
        available_tools: list[LLMToolDefinition],
        depth: str = "SIMPLE",
    ) -> tuple[StructuredInvestigationPlan, int]:
        tool_summary = "\n".join(f"- {t.name}: {t.description}" for t in available_tools)
        system_prompt = (
            "You are the ERP Investigation Planner for Pirnav School Management System.\n"
            f"User Role: {ctx.role}, Tenant: {ctx.tenant_id}, BranchId: {ctx.active_branch_id}, AcademicYear: {ctx.academic_year_name or 'All'}.\n"
            f"Assessed Investigation Depth: {depth}\n"
            "Discovered Candidate Tools (Only select from these):\n"
            f"{tool_summary or 'None available'}\n\n"
            "Rules:\n"
            "1. If Investigation Depth is 'SIMPLE', plan at most 1-2 tools directly answering the request (e.g. 'List Staff Present Today' -> ONLY staff attendance tool).\n"
            "2. Never plan unrelated tools from other modules (e.g. no student fees or exams for a staff query).\n"
            "3. Identify required modules and planned tools precisely."
        )
        msgs = [*history[-6:], LLMMessage(role="user", content=query)]
        resp = await self._router.generate(
            msgs,
            system_prompt=system_prompt,
            response_schema=StructuredInvestigationPlan,
            tier="fast",
            temperature=0.0,
        )
        if resp.structured_data:
            plan = StructuredInvestigationPlan.model_validate(resp.structured_data)
            plan.investigation_depth = depth
        else:
            plan = StructuredInvestigationPlan(
                objective=f"Investigate: {query[:120]}",
                investigation_depth=depth,
                modules_involved=[],
                steps=["Retrieve relevant authorized ERP records", "Validate and synthesize evidence"],
            )
        return plan, resp.usage.total_tokens

    async def assess_sufficiency(
        self,
        query: str,
        plan: StructuredInvestigationPlan,
        executed_tools: list[str],
        observations_summary: str,
    ) -> tuple[InvestigationAssessment, int]:
        system_prompt = (
            "Assess whether the retrieved ERP observations sufficiently and accurately answer the user's request. "
            "If cross-module verification or missing details are still required, mark is_sufficient=false and explain missing_information concisely."
        )
        prompt = (
            f"Objective: {plan.objective}\n"
            f"Planned modules: {', '.join(plan.modules_involved)}\n"
            f"Tools already executed: {', '.join(executed_tools) or 'None'}\n"
            f"Observed summaries:\n{observations_summary[:2500]}\n"
            f"Original query: {query}"
        )
        resp = await self._router.generate(
            [LLMMessage(role="user", content=prompt)],
            system_prompt=system_prompt,
            response_schema=InvestigationAssessment,
            tier="fast",
            temperature=0.0,
        )
        if resp.structured_data:
            assessment = InvestigationAssessment.model_validate(resp.structured_data)
        else:
            assessment = InvestigationAssessment(is_sufficient=len(executed_tools) > 0, confidence=0.7)
        return assessment, resp.usage.total_tokens

    async def suggest_follow_ups(self, query: str, reply: str, modules: list[str]) -> tuple[list[str], int]:
        resp = await self._router.generate(
            [LLMMessage(role="user", content=f"Query: {query}\nModules: {modules}\nSummary: {reply[:800]}")],
            system_prompt="Generate 3 concise, actionable follow-up questions an ERP user might ask next.",
            response_schema=FollowUpSuggestions,
            tier="fast",
            temperature=0.2,
        )
        if resp.structured_data:
            parsed = FollowUpSuggestions.model_validate(resp.structured_data)
            return parsed.follow_up_questions[:3], resp.usage.total_tokens
        return [], resp.usage.total_tokens
