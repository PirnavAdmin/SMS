"""Stage 4 tests: Multi-LLM abstraction, structured output, tool calling, and provider fallback routing."""

import pytest
from pydantic import BaseModel

from app.config.settings import Settings
from app.llm.base import LLMMessage, LLMToolDefinition
from app.llm.gemini_provider import GoogleGeminiProvider
from app.llm.openai_provider import OpenAICompatibleProvider
from app.llm.router import ModelRouter


class SamplePlanSchema(BaseModel):
    objective: str
    modules_involved: list[str]
    steps: list[str]


@pytest.mark.asyncio
async def test_mock_provider_structured_output_and_tool_calling():
    settings = Settings(llm_provider="mock", llm_fallback_provider="none")
    router = ModelRouter(settings)

    # 1. Structured planning call on fast tier
    plan_resp = await router.generate(
        [LLMMessage(role="user", content="Analyze students who have financial dues and poor attendance")],
        response_schema=SamplePlanSchema,
        tier="fast",
    )
    assert plan_resp.provider == "mock"
    assert plan_resp.structured_data is not None
    assert "finance" in plan_resp.structured_data["modules_involved"]
    assert "attendance" in plan_resp.structured_data["modules_involved"]
    assert plan_resp.usage.total_tokens > 0

    # 2. Tool calling call
    tools = [
        LLMToolDefinition(
            name="analytics_cross_module_dues_attendance",
            description="Find students with pending fees and poor attendance",
            parameters_schema={"type": "object", "properties": {"max_attendance_pct": {"type": "number"}}},
        ),
        LLMToolDefinition(
            name="fee_get_collection_stats",
            description="Get school fee stats",
            parameters_schema={"type": "object", "properties": {}},
        ),
    ]
    tool_resp = await router.generate(
        [LLMMessage(role="user", content="Analyze students who have financial dues and poor attendance")],
        tools=tools,
        tier="reasoning",
    )
    assert tool_resp.has_tool_calls
    names = [tc.name for tc in tool_resp.tool_calls]
    assert "analytics_cross_module_dues_attendance" in names


@pytest.mark.asyncio
async def test_gemini_unconfigured_falls_back_to_configured_fallback():
    settings = Settings(llm_provider="gemini", gemini_api_key="", llm_fallback_provider="mock")
    router = ModelRouter(settings)

    gemini = GoogleGeminiProvider(settings)
    assert gemini.is_configured() is False
    assert gemini.select_model("fast") == settings.gemini_model_fast
    assert gemini.select_model("reasoning") == settings.gemini_model_reasoning

    openai_p = OpenAICompatibleProvider(settings)
    assert openai_p.is_configured() is False

    resp = await router.generate([LLMMessage(role="user", content="Show hostel occupancy")])
    assert resp.provider == "mock"
    assert resp.content
