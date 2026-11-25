"""OpenAI-compatible LLM provider (works with OpenAI, OpenRouter, Azure OpenAI, vLLM, Ollama)."""

from __future__ import annotations

import json
import time
import uuid
from typing import Any, Optional, Type

import httpx

from app.config.settings import Settings
from app.core.exceptions import LlmProviderError
from app.llm.base import (
    BaseLLMProvider,
    LLMMessage,
    LLMResponse,
    LLMToolCall,
    LLMToolDefinition,
    ModelTier,
    TModel,
    TokenUsage,
)


class OpenAICompatibleProvider(BaseLLMProvider):
    provider_name = "openai_compatible"

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def is_configured(self) -> bool:
        return bool(self._settings.openai_api_key and self._settings.openai_api_key.strip())

    def select_model(self, tier: ModelTier = "reasoning") -> str:
        return self._settings.openai_model

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
        if not self.is_configured():
            raise LlmProviderError("OPENAI_API_KEY is not configured for openai_compatible provider.")

        model_name = self.select_model(tier)
        api_messages: list[dict[str, Any]] = []
        if system_prompt:
            api_messages.append({"role": "system", "content": system_prompt})

        for msg in messages:
            if msg.role == "tool":
                api_messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": msg.tool_call_id or "call_0",
                        "content": msg.content,
                    }
                )
            elif msg.role == "assistant" and msg.tool_calls:
                api_messages.append(
                    {
                        "role": "assistant",
                        "content": msg.content or None,
                        "tool_calls": [
                            {
                                "id": tc.call_id,
                                "type": "function",
                                "function": {"name": tc.name, "arguments": json.dumps(tc.arguments)},
                            }
                            for tc in msg.tool_calls
                        ],
                    }
                )
            else:
                api_messages.append({"role": msg.role, "content": msg.content})

        payload: dict[str, Any] = {
            "model": model_name,
            "messages": api_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        if tools:
            payload["tools"] = [
                {
                    "type": "function",
                    "function": {
                        "name": t.name,
                        "description": t.description,
                        "parameters": t.parameters_schema,
                    },
                }
                for t in tools
            ]
        elif response_schema is not None:
            payload["response_format"] = {"type": "json_object"}

        base = self._settings.openai_base_url.rstrip("/")
        headers = {
            "Authorization": f"Bearer {self._settings.openai_api_key.strip()}",
            "Content-Type": "application/json",
        }

        start = time.perf_counter()
        async with httpx.AsyncClient(timeout=self._settings.llm_request_timeout_seconds) as client:
            res = await client.post(f"{base}/chat/completions", headers=headers, json=payload)
        elapsed_ms = round((time.perf_counter() - start) * 1000.0, 2)

        if res.status_code >= 400:
            raise LlmProviderError(f"OpenAI-compatible provider returned {res.status_code}: {res.text[:400]}")

        body = res.json()
        choice = (body.get("choices") or [{}])[0]
        message = choice.get("message") or {}
        content = (message.get("content") or "").strip()

        tool_calls: list[LLMToolCall] = []
        for tc in message.get("tool_calls") or []:
            fn = tc.get("function") or {}
            raw_args = fn.get("arguments") or "{}"
            try:
                args_dict = json.loads(raw_args) if isinstance(raw_args, str) else dict(raw_args)
            except Exception:
                args_dict = {}
            tool_calls.append(
                LLMToolCall(
                    call_id=tc.get("id") or f"call_{uuid.uuid4().hex[:12]}",
                    name=fn.get("name", ""),
                    arguments=args_dict,
                )
            )

        structured_data = None
        if response_schema is not None and content:
            try:
                structured_data = response_schema.model_validate_json(content).model_dump()
            except Exception:
                try:
                    structured_data = json.loads(content)
                except Exception:
                    structured_data = None

        raw_usage = body.get("usage") or {}
        usage = TokenUsage(
            prompt_tokens=int(raw_usage.get("prompt_tokens", 0)),
            completion_tokens=int(raw_usage.get("completion_tokens", 0)),
            total_tokens=int(raw_usage.get("total_tokens", 0)),
        )

        return LLMResponse(
            content=content,
            tool_calls=tool_calls,
            structured_data=structured_data,
            usage=usage,
            provider=self.provider_name,
            model=model_name,
            latency_ms=elapsed_ms,
            finish_reason=choice.get("finish_reason") or "stop",
        )
