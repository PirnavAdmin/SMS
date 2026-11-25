"""Centralized dynamic tool contracts and execution wrappers."""

from __future__ import annotations

import logging
import time
from abc import ABC, abstractmethod
from typing import Any, Optional, Type

from pydantic import BaseModel, Field, ValidationError

from app.core.exceptions import AuthorizationDeniedError
from app.monitoring.telemetry import metrics_collector, traced_span
from app.schemas.chat import EvidenceItem, PendingActionPreview, SourceCategory, VisualArtifact
from app.schemas.security import AiSecurityContext
from app.security.rbac import assert_tool_role

logger = logging.getLogger(__name__)


class EmptyToolInput(BaseModel):
    """Default schema for tools that accept no required arguments."""


class ToolOutput(BaseModel):
    success: bool = True
    summary: str = ""
    data: Any = None
    record_count: int = 0
    source_type: SourceCategory = "LIVE_ERP"
    module: str = "general"
    visuals: list[VisualArtifact] = Field(default_factory=list)
    pending_action: Optional[PendingActionPreview] = None
    contradictions: list[str] = Field(default_factory=list)
    follow_up_hints: list[str] = Field(default_factory=list)
    error: Optional[str] = None

    def to_evidence(self, tool_name: str) -> EvidenceItem:
        return EvidenceItem(
            source_type=self.source_type,
            module=self.module,
            tool_name=tool_name,
            record_count=self.record_count,
            summary=self.summary or (self.error or ""),
            verified=self.success,
        )


class BaseErpTool(ABC):
    """Base class for all ERP, Analytics, ML, RAG, and Action tools."""

    name: str
    description: str
    module: str
    allowed_roles: tuple[str, ...] = ("Super Admin", "Admin", "Principal")
    input_model: Type[BaseModel] = EmptyToolInput
    output_description: str = "Structured ToolOutput with verified records and summary"
    is_write_action: bool = False

    def json_schema(self) -> dict[str, Any]:
        schema = self.input_model.model_json_schema()
        schema.pop("title", None)
        return schema

    @abstractmethod
    async def _run(self, ctx: AiSecurityContext, params: BaseModel) -> ToolOutput:
        """Executes the tool after role authorization and input validation."""

    async def execute(self, ctx: AiSecurityContext, raw_args: dict[str, Any] | None = None) -> tuple[ToolOutput, float]:
        start = time.perf_counter()
        with traced_span("tool.execute", {"tool": self.name, "module": self.module, "role": ctx.role}):
            try:
                assert_tool_role(ctx, self.allowed_roles)
                validated = self.input_model.model_validate(raw_args or {})
                output = await self._run(ctx, validated)
                if not output.module:
                    output.module = self.module
                metrics_collector.inc("tool_calls_total")
                elapsed = round((time.perf_counter() - start) * 1000.0, 2)
                return output, elapsed
            except AuthorizationDeniedError as exc:
                metrics_collector.inc("security_denials_total")
                elapsed = round((time.perf_counter() - start) * 1000.0, 2)
                return (
                    ToolOutput(
                        success=False,
                        module=self.module,
                        summary=f"Authorization denied: {exc.message}",
                        error=exc.message,
                    ),
                    elapsed,
                )
            except ValidationError as exc:
                elapsed = round((time.perf_counter() - start) * 1000.0, 2)
                return (
                    ToolOutput(
                        success=False,
                        module=self.module,
                        summary=f"Invalid tool input for {self.name}: {exc.errors()}",
                        error=str(exc),
                    ),
                    elapsed,
                )
            except Exception as exc:
                logger.exception("Tool '%s' failed with unexpected error", self.name)
                metrics_collector.inc("tool_errors_total")
                elapsed = round((time.perf_counter() - start) * 1000.0, 2)
                return (
                    ToolOutput(
                        success=False,
                        module=self.module,
                        summary=f"Tool '{self.name}' failed: {exc}",
                        error=str(exc),
                    ),
                    elapsed,
                )
