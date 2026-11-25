"""Dynamic centralized ERP tool registry with RBAC filtering."""

from __future__ import annotations

from typing import Iterable

from app.llm.base import LLMToolDefinition
from app.schemas.security import AiSecurityContext
from app.security.rbac import normalize_role
from app.tools.base import BaseErpTool


class ToolRegistry:
    """Central registry holding all ERP, Analytics, ML, RAG, and Action tools."""

    def __init__(self) -> None:
        self._tools: dict[str, BaseErpTool] = {}

    def register(self, tool: BaseErpTool) -> None:
        if tool.name in self._tools:
            raise ValueError(f"Duplicate tool identifier registered: '{tool.name}'")
        self._tools[tool.name] = tool

    def register_many(self, tools: Iterable[BaseErpTool]) -> None:
        for tool in tools:
            self.register(tool)

    def get(self, name: str) -> BaseErpTool | None:
        return self._tools.get(name)

    def all_tools(self) -> list[BaseErpTool]:
        return list(self._tools.values())

    def authorized_tools(self, ctx: AiSecurityContext) -> list[BaseErpTool]:
        allowed: list[BaseErpTool] = []
        for tool in self._tools.values():
            if "All" in tool.allowed_roles:
                allowed.append(tool)
                continue
            roles = {normalize_role(r) for r in tool.allowed_roles}
            if ctx.role in roles:
                allowed.append(tool)
        return allowed

    def to_llm_definitions(self, ctx: AiSecurityContext) -> list[LLMToolDefinition]:
        return [
            LLMToolDefinition(
                name=t.name,
                description=f"[{t.module}] {t.description}",
                parameters_schema=t.json_schema(),
            )
            for t in self.authorized_tools(ctx)
        ]

    def metadata_catalog(self) -> list[dict[str, object]]:
        return [
            {
                "name": t.name,
                "module": t.module,
                "description": t.description,
                "allowed_roles": list(t.allowed_roles),
                "is_write_action": t.is_write_action,
                "input_schema": t.json_schema(),
                "output_description": t.output_description,
            }
            for t in self._tools.values()
        ]
