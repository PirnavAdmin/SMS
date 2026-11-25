"""Offline/Test multi-step reasoning LLM provider for deterministic CI & local evaluation without API keys."""

from __future__ import annotations

import json
import time
import uuid
from typing import Any, Optional, Type

from pydantic import BaseModel

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


class MockAutonomousLLMProvider(BaseLLMProvider):
    """
    Simulates multi-step LLM planning, structured output, tool selection, observation,
    and evidence-grounded synthesis using actual observed tool outputs (never fabricates ERP data).
    """

    provider_name = "mock"

    def is_configured(self) -> bool:
        return True

    def select_model(self, tier: ModelTier = "reasoning") -> str:
        return f"mock-erp-reasoning-{tier}-v2"

    @staticmethod
    def _estimate_tokens(text: str) -> int:
        return max(12, len(text) // 4)

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
        start = time.perf_counter()
        user_messages = [m.content for m in messages if m.role == "user"]
        latest_query = user_messages[-1] if user_messages else ""
        tool_messages = [m for m in messages if m.role == "tool"]
        executed_tools = [m.tool_name for m in tool_messages if m.tool_name]

        # 1. Structured output mode (used by planner, anomaly critic, or follow-up generator)
        if response_schema is not None and not tools:
            structured = self._build_structured_response(response_schema, latest_query, executed_tools, tool_messages)
            raw_json = json.dumps(structured)
            elapsed = round((time.perf_counter() - start) * 1000.0, 2)
            p_tok = self._estimate_tokens(system_prompt + latest_query)
            c_tok = self._estimate_tokens(raw_json)
            return LLMResponse(
                content=raw_json,
                structured_data=structured,
                usage=TokenUsage(prompt_tokens=p_tok, completion_tokens=c_tok, total_tokens=p_tok + c_tok),
                provider=self.provider_name,
                model=self.select_model(tier),
                latency_ms=elapsed,
            )

        # 2. Tool-selection mode: dynamically pick relevant tools that haven't been executed yet
        if tools:
            planned_calls = self._select_next_tool_calls(latest_query, tools, set(executed_tools), tool_messages)
            if planned_calls:
                elapsed = round((time.perf_counter() - start) * 1000.0, 2)
                p_tok = self._estimate_tokens(system_prompt + latest_query)
                c_tok = 40 * len(planned_calls)
                return LLMResponse(
                    content="",
                    tool_calls=planned_calls,
                    usage=TokenUsage(prompt_tokens=p_tok, completion_tokens=c_tok, total_tokens=p_tok + c_tok),
                    provider=self.provider_name,
                    model=self.select_model(tier),
                    latency_ms=elapsed,
                    finish_reason="tool_calls",
                )

        # 3. Synthesis mode: compose concise evidence-backed response strictly from observed tool results
        reply = self._synthesize_from_observations(latest_query, tool_messages)
        elapsed = round((time.perf_counter() - start) * 1000.0, 2)
        p_tok = self._estimate_tokens(system_prompt + latest_query + "".join(m.content[:500] for m in tool_messages))
        c_tok = self._estimate_tokens(reply)
        return LLMResponse(
            content=reply,
            usage=TokenUsage(prompt_tokens=p_tok, completion_tokens=c_tok, total_tokens=p_tok + c_tok),
            provider=self.provider_name,
            model=self.select_model(tier),
            latency_ms=elapsed,
        )

    @staticmethod
    def _infer_relevant_modules(query: str) -> list[str]:
        q = query.lower()
        modules: list[str] = []
        if any(k in q for k in ("overall", "management report", "school performance", "operational improvement", "executive")):
            return ["organization", "students", "admissions", "attendance", "finance", "examination", "hostel", "transport", "analytics", "ml"]
        if any(k in q for k in ("student", "enrollment", "enroll", "strength", "class", "alumni", "promotion", "record")):
            modules.append("students")
        if any(k in q for k in ("admission", "applicant", "application", "difference")):
            modules.append("admissions")
        if any(k in q for k in ("fee", "due", "dues", "financial", "finance", "collection", "revenue", "discount", "concession", "refund", "transaction", "unusual", "payment")):
            modules.append("finance")
        if any(k in q for k in ("attendance", "absent", "present", "poor attendance")):
            modules.append("attendance")
        if any(k in q for k in ("hostel", "occupancy", "room", "bed", "warden")):
            modules.append("hostel")
        if any(k in q for k in ("transport", "bus", "route", "driver", "vehicle", "pickup")):
            modules.append("transport")
        if any(k in q for k in ("exam", "marks", "result", "grade", "report card")):
            modules.append("examination")
        if any(k in q for k in ("staff", "teacher", "faculty", "payroll", "salary", "leave", "training")):
            modules.append("staff")
        if any(k in q for k in ("library", "book", "overdue")):
            modules.append("library")
        if any(k in q for k in ("uniform", "inventory", "stock")):
            modules.append("uniform")
        if any(k in q for k in ("policy", "rule", "circular", "guideline", "regulation", "procedure", "document")):
            modules.append("rag")
        if any(k in q for k in ("forecast", "predict", "anomaly", "unusual", "outlier", "trend")):
            modules.append("ml")
        if any(k in q for k in ("announce", "broadcast", "circular")) and any(k in q for k in ("create", "send", "publish", "draft")):
            modules.append("action_announcement")
        if any(k in q for k in ("schedule", "meeting", "ptm")):
            modules.append("action_meeting")
        if any(k in q for k in ("branch", "campus", "academic year", "organization", "school")):
            modules.append("organization")
        return list(dict.fromkeys(modules)) or ["organization", "students"]

    def _build_structured_response(
        self,
        schema: Type[BaseModel],
        query: str,
        executed_tools: list[str],
        tool_messages: list[LLMMessage],
    ) -> dict[str, Any]:
        fields = set(schema.model_fields.keys())
        modules = self._infer_relevant_modules(query)

        # Investigation plan schema
        if {"objective", "modules_involved", "steps"}.issubset(fields):
            steps = [f"Investigate {m} records within authorized tenant and branch scope" for m in modules]
            if len(modules) > 1:
                steps.append("Cross-correlate records and validate arithmetic via Pandas/NumPy engine")
            steps.append("Verify evidence completeness and synthesize actionable findings")
            return {
                "objective": f"Evidence-based ERP investigation for: {query[:160]}",
                "modules_involved": modules,
                "steps": steps,
                "requires_cross_module_analysis": len(modules) > 1 or "overall" in query.lower(),
                "requires_ml": "ml" in modules or any(w in query.lower() for w in ("anomaly", "unusual", "forecast", "predict")),
                "requires_rag": "rag" in modules or any(w in query.lower() for w in ("policy", "rule", "regulation", "circular")),
            }

        # Validation / continuation decision schema
        if {"is_sufficient", "next_focus"}.issubset(fields):
            has_errors = any('"error"' in (m.content or "") and '"success": false' in (m.content or "") for m in tool_messages)
            return {
                "is_sufficient": len(executed_tools) > 0 and not (len(modules) > 1 and len(executed_tools) < 2),
                "confidence": 0.86 if executed_tools and not has_errors else 0.55,
                "missing_information": [] if executed_tools else ["Initial ERP records not yet retrieved"],
                "next_focus": "Synthesize validated findings" if executed_tools else "Retrieve primary ERP records",
            }

        # Follow-up recommendations schema
        if "follow_up_questions" in fields:
            return {
                "follow_up_questions": [
                    "Break down these metrics by class and branch",
                    "Compare current figures against the previous academic year",
                    "Identify outliers or records needing immediate administrative action",
                ]
            }

        return {}

    def _select_next_tool_calls(
        self,
        query: str,
        tools: list[LLMToolDefinition],
        already_called: set[str],
        _tool_messages: list[LLMMessage],
    ) -> list[LLMToolCall]:
        q = query.lower()
        available = {t.name: t for t in tools}
        calls: list[LLMToolCall] = []

        def add_if(name: str, args: dict[str, Any] | None = None) -> None:
            if name in available and name not in already_called and len(calls) < 4:
                calls.append(
                    LLMToolCall(
                        call_id=f"call_{uuid.uuid4().hex[:10]}",
                        name=name,
                        arguments=args or {},
                    )
                )

        # Action intents
        if any(k in q for k in ("create announcement", "publish announcement", "broadcast circular", "create a school announcement")):
            add_if("action_create_announcement", {"title": "School Announcement", "content": query, "targetAudience": "All", "category": "GENERAL"})
            if calls:
                return calls
        if any(k in q for k in ("schedule meeting", "schedule a parent-teacher", "schedule ptm")):
            add_if("action_schedule_meeting", {"meetingTitle": "Parent-Teacher Meeting", "audience": "Parent", "mode": "In-Person"})
            if calls:
                return calls

        # Cross-module & specialized composite investigations
        if ("fee" in q or "due" in q or "financial" in q) and ("attendance" in q or "poor attendance" in q):
            add_if("analytics_cross_module_dues_attendance", {"max_attendance_pct": 85.0})
            add_if("fee_get_collection_stats")
            if calls:
                return calls

        if ("admission" in q and "student" in q) and any(k in q for k in ("difference", "reconcile", "mismatch", "discrepancy", "compare")):
            add_if("analytics_reconcile_admissions_students")
            add_if("admissions_get_summary")
            add_if("student_get_overview")
            if calls:
                return calls

        if "hostel" in q and any(k in q for k in ("finance", "fee", "revenue", "occupancy")):
            add_if("analytics_hostel_financial_occupancy")
            add_if("hostel_get_occupancy_overview")
            if calls:
                return calls

        if "transport" in q and any(k in q for k in ("due", "fee", "usage", "utilization", "revenue")):
            add_if("analytics_transport_usage_dues")
            add_if("transport_get_fleet_info")
            if calls:
                return calls

        if any(k in q for k in ("unusual", "anomaly", "outlier", "suspicious")) and any(k in q for k in ("transaction", "fee", "financial", "payment", "refund", "discount")):
            add_if("ml_detect_financial_anomalies")
            add_if("analytics_financial_health")
            if calls:
                return calls

        if any(k in q for k in ("unusual", "anomaly", "outlier", "drop")) and "attendance" in q:
            add_if("ml_detect_attendance_anomalies")
            add_if("attendance_get_daily_summary")
            if calls:
                return calls

        if any(k in q for k in ("overall school performance", "management report", "operational improvement", "school performance", "executive report")):
            add_if("school_get_overview")
            add_if("analytics_financial_health")
            add_if("analytics_cross_module_dues_attendance", {"max_attendance_pct": 85.0})
            add_if("analytics_reconcile_admissions_students")
            if calls:
                return calls

        if any(k in q for k in ("financial condition", "financial health", "increasing outstanding", "outstanding fees", "fee collection", "pending fees", "dues")):
            add_if("analytics_financial_health")
            add_if("fee_get_collection_stats")
            add_if("fee_get_defaulters")
            if calls:
                return calls

        if any(k in q for k in ("compare", "across academic year", "last year", "year over year")) and any(k in q for k in ("enroll", "student", "admission")):
            add_if("analytics_enrollment_trends")
            add_if("ml_forecast_enrollment")
            if calls:
                return calls

        if any(k in q for k in ("policy", "rule", "circular", "procedure", "guideline", "regulation")):
            add_if("rag_search_documents", {"query": query})

        # General module routing fallback based on tool descriptions
        modules = self._infer_relevant_modules(query)
        module_tool_hints = {
            "students": ["student_get_overview", "student_search"],
            "admissions": ["admissions_get_summary"],
            "finance": ["analytics_financial_health", "fee_get_collection_stats", "fee_get_defaulters"],
            "attendance": ["attendance_get_daily_summary", "attendance_get_class_comparison"],
            "hostel": ["hostel_get_occupancy_overview", "hostel_get_room_availability"],
            "transport": ["transport_get_fleet_info", "transport_get_student_assignments"],
            "examination": ["exam_get_results_overview", "exam_get_schedules"],
            "staff": ["admin_get_staff_list", "hr_payroll_leave_summary"],
            "library": ["library_search_catalog"],
            "uniform": ["uniform_get_stock_overview"],
            "organization": ["school_get_overview"],
            "ml": ["ml_detect_attendance_anomalies", "ml_forecast_enrollment"],
            "rag": ["rag_search_documents"],
        }
        for mod in modules:
            for tname in module_tool_hints.get(mod, []):
                add_if(tname)

        # Dynamic schema-description fallback so any newly registered tool is discoverable without hardcoded mappings
        if not calls:
            q_tokens = {tok for tok in q.replace("_", " ").replace("-", " ").split() if len(tok) > 2}
            scored: list[tuple[int, str]] = []
            for t in tools:
                if t.name in already_called:
                    continue
                haystack = f"{t.name.replace('_', ' ')} {t.description}".lower()
                score = sum(1 for tok in q_tokens if tok in haystack)
                if score > 0:
                    scored.append((score, t.name))
            scored.sort(reverse=True)
            for _sc, tname in scored[:3]:
                add_if(tname)

        return calls

    @staticmethod
    def _synthesize_from_observations(query: str, tool_messages: list[LLMMessage]) -> str:
        if not tool_messages:
            return (
                "No authorized ERP tools returned data for this query. "
                "Please verify your role permissions or narrow your request to a specific school module."
            )

        sections: list[str] = [f"### Investigation Summary\nFor your request: **{query}**\n"]
        for tm in tool_messages:
            name = tm.tool_name or "erp_tool"
            try:
                payload = json.loads(tm.content)
            except Exception:
                payload = {"summary": tm.content}

            if isinstance(payload, dict):
                summary = payload.get("summary") or payload.get("message") or payload.get("error") or ""
                if summary:
                    sections.append(f"- **`{name}`**: {summary}")
                contradictions = payload.get("contradictions") or []
                for c in contradictions:
                    sections.append(f"  - ⚠️ **Data Consistency Note:** {c}")
            else:
                sections.append(f"- **`{name}`**: {str(payload)[:300]}")

        return "\n".join(sections)
