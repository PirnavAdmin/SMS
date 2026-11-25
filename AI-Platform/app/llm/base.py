"""Provider-agnostic LLM data contracts and abstract base class."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, AsyncIterator, Literal, Optional, Type, TypeVar
from pydantic import BaseModel, Field


ModelTier = Literal["fast", "reasoning"]
TModel = TypeVar("TModel", bound=BaseModel)


class LLMToolDefinition(BaseModel):
    name: str
    description: str
    parameters_schema: dict[str, Any]


class LLMToolCall(BaseModel):
    call_id: str
    name: str
    arguments: dict[str, Any] = Field(default_factory=dict)
    thought_signature_b64: Optional[str] = None


class LLMMessage(BaseModel):
    role: Literal["system", "user", "assistant", "tool"]
    content: str = ""
    tool_calls: list[LLMToolCall] = Field(default_factory=list)
    tool_call_id: Optional[str] = None
    tool_name: Optional[str] = None


class TokenUsage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


class LLMResponse(BaseModel):
    content: str = ""
    tool_calls: list[LLMToolCall] = Field(default_factory=list)
    structured_data: Optional[dict[str, Any]] = None
    usage: TokenUsage = Field(default_factory=TokenUsage)
    provider: str = ""
    model: str = ""
    latency_ms: float = 0.0
    finish_reason: str = "stop"

    @property
    def has_tool_calls(self) -> bool:
        return len(self.tool_calls) > 0


class BaseLLMProvider(ABC):
    """Abstract interface implemented by Gemini, OpenAI-compatible, and Test LLM providers."""

    provider_name: str = "base"

    @abstractmethod
    def is_configured(self) -> bool:
        """Returns True if credentials / runtime requirements for this provider are ready."""

    @abstractmethod
    def select_model(self, tier: ModelTier = "reasoning") -> str:
        """Selects model identifier for cost/latency/capability tier."""

    @abstractmethod
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
        """Executes a chat/reasoning/tool-calling/structured generation call."""

    async def stream_text(
        self,
        messages: list[LLMMessage],
        *,
        system_prompt: str = "",
        tier: ModelTier = "reasoning",
        temperature: float = 0.2,
    ) -> AsyncIterator[str]:
        """Default streaming implementation falls back to chunked generate()."""
        resp = await self.generate(
            messages,
            system_prompt=system_prompt,
            tier=tier,
            temperature=temperature,
        )
        if resp.content:
            words = resp.content.split(" ")
            chunk: list[str] = []
            for w in words:
                chunk.append(w)
                if len(chunk) >= 6:
                    yield " ".join(chunk) + " "
                    chunk = []
            if chunk:
                yield " ".join(chunk)
