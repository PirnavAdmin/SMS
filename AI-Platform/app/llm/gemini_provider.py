"""Google Gemini provider built on the official google-genai SDK."""

from __future__ import annotations

import base64
import json
import logging
import time
import uuid
from typing import Any, AsyncIterator, Optional, Type

from google import genai
from google.genai import types
from pydantic import BaseModel

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

logger = logging.getLogger(__name__)


class GoogleGeminiProvider(BaseLLMProvider):
    provider_name = "gemini"

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client: Optional[genai.Client] = None

    def is_configured(self) -> bool:
        return bool(self._settings.gemini_api_key and self._settings.gemini_api_key.strip())

    def select_model(self, tier: ModelTier = "reasoning") -> str:
        if tier == "fast":
            return self._settings.gemini_model_fast
        return self._settings.gemini_model_reasoning

    def _get_client(self) -> genai.Client:
        if not self.is_configured():
            raise LlmProviderError("GEMINI_API_KEY is not configured.")
        if self._client is None:
            self._client = genai.Client(api_key=self._settings.gemini_api_key.strip())
        return self._client

    @staticmethod
    def _build_contents(messages: list[LLMMessage]) -> list[types.Content]:
        contents: list[types.Content] = []
        for msg in messages:
            if msg.role == "system":
                continue
            parts: list[types.Part] = []
            if msg.role == "tool":
                try:
                    parsed_resp = json.loads(msg.content) if msg.content else {}
                    if not isinstance(parsed_resp, dict):
                        parsed_resp = {"result": parsed_resp}
                except Exception:
                    parsed_resp = {"result": msg.content}
                parts.append(
                    types.Part.from_function_response(
                        name=msg.tool_name or "erp_tool",
                        response=parsed_resp,
                    )
                )
                contents.append(types.Content(role="user", parts=parts))
            elif msg.role == "assistant":
                if msg.content:
                    parts.append(types.Part.from_text(text=msg.content))
                for tc in msg.tool_calls:
                    sig_bytes: Optional[bytes] = None
                    if tc.thought_signature_b64:
                        try:
                            sig_bytes = base64.b64decode(tc.thought_signature_b64)
                        except Exception:
                            sig_bytes = None
                    fc = types.FunctionCall(name=tc.name, args=tc.arguments or {})
                    parts.append(types.Part(function_call=fc, thought_signature=sig_bytes))
                if parts:
                    contents.append(types.Content(role="model", parts=parts))
            else:
                if msg.content:
                    parts.append(types.Part.from_text(text=msg.content))
                if parts:
                    contents.append(types.Content(role="user", parts=parts))
        return contents

    @staticmethod
    def _build_tools(tools: Optional[list[LLMToolDefinition]]) -> Optional[list[types.Tool]]:
        if not tools:
            return None
        declarations = [
            types.FunctionDeclaration(
                name=t.name,
                description=t.description,
                parameters_json_schema=t.parameters_schema,
            )
            for t in tools
        ]
        return [types.Tool(function_declarations=declarations)]

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
        client = self._get_client()
        primary_model = self.select_model(tier)
        fallback_models = (
            [
                "gemini-3.5-flash-lite",
                "gemini-flash-lite-latest",
                "gemini-3.8-flash",
            ]
            if tier == "fast"
            else [
                "gemini-3.8-flash",
                "gemini-3.5-flash",
                "gemini-3.5-flash-lite",
                "gemini-flash-lite-latest",
            ]
        )
        candidates = list(
            dict.fromkeys(
                [
                    primary_model,
                    self._settings.gemini_model_fast,
                    self._settings.gemini_model_reasoning,
                    *fallback_models,
                ]
            )
        )

        config_kwargs: dict[str, Any] = {
            "temperature": temperature,
            "max_output_tokens": max_tokens,
        }
        if system_prompt:
            config_kwargs["system_instruction"] = system_prompt
        built_tools = self._build_tools(tools)
        if built_tools:
            config_kwargs["tools"] = built_tools
        if response_schema is not None and not built_tools:
            config_kwargs["response_mime_type"] = "application/json"
            config_kwargs["response_schema"] = response_schema

        gen_config = types.GenerateContentConfig(**config_kwargs)
        contents = self._build_contents(messages)

        last_err: Optional[Exception] = None
        for model_name in candidates:
            start = time.perf_counter()
            try:
                resp = await client.aio.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=gen_config,
                )
                elapsed_ms = round((time.perf_counter() - start) * 1000.0, 2)
                text_parts: list[str] = []
                tool_calls: list[LLMToolCall] = []

                if resp.candidates:
                    cand = resp.candidates[0]
                    if cand.content and cand.content.parts:
                        for part in cand.content.parts:
                            if getattr(part, "text", None):
                                text_parts.append(part.text)
                            fn_call = getattr(part, "function_call", None)
                            if fn_call is not None and getattr(fn_call, "name", None):
                                raw_args = dict(fn_call.args) if getattr(fn_call, "args", None) else {}
                                sig = getattr(part, "thought_signature", None)
                                sig_b64: Optional[str] = None
                                if isinstance(sig, (bytes, bytearray)):
                                    sig_b64 = base64.b64encode(bytes(sig)).decode("ascii")
                                elif isinstance(sig, str) and sig:
                                    sig_b64 = sig
                                tool_calls.append(
                                    LLMToolCall(
                                        call_id=f"call_{uuid.uuid4().hex[:12]}",
                                        name=fn_call.name,
                                        arguments=raw_args,
                                        thought_signature_b64=sig_b64,
                                    )
                                )

                full_text = "".join(text_parts).strip()
                structured_data = None
                if response_schema is not None and full_text:
                    try:
                        parsed_obj = response_schema.model_validate_json(full_text)
                        structured_data = parsed_obj.model_dump()
                    except Exception:
                        try:
                            structured_data = json.loads(full_text)
                        except Exception:
                            structured_data = None

                usage_meta = getattr(resp, "usage_metadata", None)
                usage = TokenUsage(
                    prompt_tokens=int(getattr(usage_meta, "prompt_token_count", 0) or 0),
                    completion_tokens=int(getattr(usage_meta, "candidates_token_count", 0) or 0),
                    total_tokens=int(getattr(usage_meta, "total_token_count", 0) or 0),
                )

                return LLMResponse(
                    content=full_text,
                    tool_calls=tool_calls,
                    structured_data=structured_data,
                    usage=usage,
                    provider=self.provider_name,
                    model=model_name,
                    latency_ms=elapsed_ms,
                    finish_reason="tool_calls" if tool_calls else "stop",
                )
            except Exception as exc:
                last_err = exc
                logger.warning("Gemini model '%s' failed: %s", model_name, exc)

        raise LlmProviderError(f"All Gemini candidate models failed: {last_err}")

    async def stream_text(
        self,
        messages: list[LLMMessage],
        *,
        system_prompt: str = "",
        tier: ModelTier = "reasoning",
        temperature: float = 0.2,
    ) -> AsyncIterator[str]:
        client = self._get_client()
        model_name = self.select_model(tier)
        config = types.GenerateContentConfig(
            system_instruction=system_prompt or None,
            temperature=temperature,
        )
        contents = self._build_contents(messages)
        async for chunk in await client.aio.models.generate_content_stream(
            model=model_name,
            contents=contents,
            config=config,
        ):
            txt = getattr(chunk, "text", None)
            if txt:
                yield txt
