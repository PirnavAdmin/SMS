"""LLM provider registry & router with automatic fallback and OTel/metrics tracking."""

from __future__ import annotations

import logging
from typing import Optional, Type

from app.config.settings import Settings
from app.core.exceptions import LlmProviderError
from app.llm.base import (
    BaseLLMProvider,
    LLMMessage,
    LLMResponse,
    LLMToolDefinition,
    ModelTier,
    TModel,
)
from app.llm.gemini_provider import GoogleGeminiProvider
from app.llm.mock_provider import MockAutonomousLLMProvider
from app.llm.openai_provider import OpenAICompatibleProvider
from app.monitoring.telemetry import metrics_collector, traced_span

logger = logging.getLogger(__name__)


class ModelRouter:
    """Routes requests across configured LLM providers by capability, cost, and availability."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._providers: dict[str, BaseLLMProvider] = {
            "gemini": GoogleGeminiProvider(settings),
            "openai_compatible": OpenAICompatibleProvider(settings),
            "mock": MockAutonomousLLMProvider(),
        }

    def get_provider(self, name: Optional[str] = None) -> BaseLLMProvider:
        key = (name or self._settings.llm_provider).lower()
        provider = self._providers.get(key)
        if provider is None:
            raise LlmProviderError(f"Unsupported LLM provider '{key}'.")
        return provider

    def get_active_provider_chain(self) -> list[BaseLLMProvider]:
        chain: list[BaseLLMProvider] = []
        primary = self.get_provider(self._settings.llm_provider)
        if primary.is_configured():
            chain.append(primary)
        else:
            logger.warning("Primary LLM provider '%s' is not configured; checking fallback.", primary.provider_name)

        fb_name = self._settings.llm_fallback_provider
        if fb_name and fb_name != "none":
            fb = self.get_provider(fb_name)
            if fb.is_configured() and fb not in chain:
                chain.append(fb)

        if not chain:
            raise LlmProviderError("No configured LLM provider available (check GEMINI_API_KEY or fallback settings).")
        return chain

    async def generate(
        self,
        messages: list[LLMMessage],
        *,
        system_prompt: str = "",
        tools: Optional[list[LLMToolDefinition]] = None,
        response_schema: Optional[Type[TModel]] = None,
        tier: ModelTier = "reasoning",
        temperature: float = 0.1,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        chain = self.get_active_provider_chain()
        last_err: Optional[Exception] = None

        for provider in chain:
            with traced_span("llm.generate", {"provider": provider.provider_name, "tier": tier}):
                try:
                    resp = await provider.generate(
                        messages,
                        system_prompt=system_prompt,
                        tools=tools,
                        response_schema=response_schema,
                        tier=tier,
                        temperature=temperature,
                        max_tokens=max_tokens,
                    )
                    metrics_collector.inc("llm_calls_total")
                    metrics_collector.inc("llm_tokens_total", resp.usage.total_tokens)
                    return resp
                except Exception as exc:
                    last_err = exc
                    logger.warning("Provider '%s' failed (%s); trying next provider in chain.", provider.provider_name, exc)

        raise LlmProviderError(f"All LLM providers failed: {last_err}")
