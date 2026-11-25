"""Semantic capability discovery and tool narrowing layer.

Separates Tool Discovery from Tool Execution. Never passes the entire 35-tool
registry to the LLM or execution nodes. Dynamically identifies candidate tools
based on query semantics, user role, and request investigation depth.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Literal

from app.schemas.security import AiSecurityContext
from app.tools.base import BaseErpTool
from app.tools.registry import ToolRegistry

logger = logging.getLogger(__name__)

InvestigationDepth = Literal["SIMPLE", "ANALYTICAL", "COMPLEX"]


@dataclass
class DiscoveredToolsResult:
    depth: InvestigationDepth
    primary_modules: list[str]
    candidate_tools: list[BaseErpTool]
    justifications: dict[str, str] = field(default_factory=dict)
    excluded_count: int = 0


# Module keyword signatures for high-precision semantic discovery
MODULE_SEMANTIC_SIGNATURES: dict[str, list[str]] = {
    "staff_hr": [
        "staff", "teacher", "faculty", "employee", "payroll", "salary",
        "leave", "workshop", "training", "present staff", "absent staff",
        "staff attendance", "hr", "workforce", "educator", "teaching staff"
    ],
    "attendance": [
        "attendance", "present", "absent", "attendance percentage",
        "roll call", "student attendance", "low attendance", "truant"
    ],
    "students": [
        "student", "pupil", "enrollment", "enrolled", "strength", "class strength",
        "student directory", "student profile", "admission number", "roll number"
    ],
    "admissions": [
        "admission", "applicant", "application", "entrance", "prospective student",
        "admission status", "application form"
    ],
    "finance": [
        "fee", "fees", "due", "dues", "defaulter", "balance", "collection",
        "receipt", "payment", "revenue", "tuition", "arrears", "scholarship",
        "discount", "concession", "financial"
    ],
    "transport": [
        "transport", "bus", "route", "driver", "vehicle", "fleet", "pickup stop",
        "transit", "commute", "bus route", "van"
    ],
    "hostel": [
        "hostel", "dormitory", "room", "bed", "warden", "occupancy", "boarding",
        "hostel room", "vacant bed"
    ],
    "examination": [
        "exam", "examination", "marks", "grade", "score", "result", "report card",
        "timetable exam", "midterm", "annual exam"
    ],
    "academics": [
        "class", "section", "subject", "curriculum", "timetable", "period",
        "homework", "syllabus", "schedule"
    ],
    "library": [
        "library", "book", "author", "isbn", "circulation", "borrowed", "reading"
    ],
    "uniform": [
        "uniform", "inventory", "stock", "size", "shirt", "pant", "blazer"
    ],
    "parents": [
        "parent", "guardian", "father", "mother", "family", "parent mapping"
    ],
    "organization": [
        "school", "campus", "branch", "academic year", "governance", "organization",
        "alumni", "certificate"
    ],
    "communication": [
        "announcement", "circular", "notice", "publish", "broadcast", "meeting", "ptm"
    ],
    "analytics": [
        "compare", "trend", "reconcile", "health", "audit", "cross-module",
        "performance report", "management report"
    ],
    "ml": [
        "predict", "forecast", "anomaly", "unusual", "outlier", "risk model"
    ],
    "rag": [
        "policy", "rule", "circular pdf", "handbook", "regulation", "guideline"
    ]
}


class SemanticToolDiscovery:
    """Discovers and narrows candidate tools before planning and execution."""

    def __init__(self, registry: ToolRegistry) -> None:
        self._registry = registry

    @staticmethod
    def classify_investigation_depth(query: str) -> InvestigationDepth:
        """Determines the required investigation depth from user intent.
        
        SIMPLE: Single-domain factual lookup or listing (e.g. 'List Staff Present Today').
        ANALYTICAL: Comparative, mathematical, or trend query within 1-2 domains.
        COMPLEX: Broad multi-module investigation or cross-correlation.
        """
        q = query.lower()
        
        # Complex multi-domain triggers
        complex_triggers = [
            "cross-module", "cross reference", "overall school", "management report",
            "comprehensive audit", "operational improvement", "reconcile",
            "correlate", "discrepanc"
        ]
        if any(t in q for t in complex_triggers):
            return "COMPLEX"

        # Check if query asks to correlate two distinct domains
        matched_domains = 0
        domain_keys = ["fee", "attendance", "hostel", "transport", "exam", "staff", "student"]
        for dk in domain_keys:
            if dk in q:
                matched_domains += 1
        if matched_domains >= 2 and any(w in q for w in ("and", "who also", "with", "having")):
            return "COMPLEX"

        # Analytical triggers
        analytical_triggers = [
            "compare", "versus", "vs", "trend", "forecast", "predict",
            "financial health", "analysis", "breakdown by", "monthly change"
        ]
        if any(t in q for t in analytical_triggers):
            return "ANALYTICAL"

        # Default to SIMPLE for targeted lookups and lists
        return "SIMPLE"

    def discover(self, ctx: AiSecurityContext, query: str) -> DiscoveredToolsResult:
        """Discovers candidate tools strictly relevant to the query and user role."""
        authorized_tools = self._registry.authorized_tools(ctx)
        depth = self.classify_investigation_depth(query)
        q = query.lower().strip()

        # If the authorized toolset is small (e.g., test fixtures or scoped stubs), all are candidates
        if len(authorized_tools) <= 4:
            return DiscoveredToolsResult(
                depth=depth,
                primary_modules=list({t.module for t in authorized_tools}),
                candidate_tools=authorized_tools,
                justifications={t.name: f"Authorized scoped tool in module {t.module}" for t in authorized_tools},
                excluded_count=0,
            )

        # Check for school-wide / executive cross-module requests
        is_school_wide = any(k in q for k in (
            "overall", "school performance", "management report", "executive report",
            "operational improvement", "comprehensive audit", "school health"
        ))

        # Score modules based on semantic signatures
        module_scores: dict[str, int] = {}
        for mod, sigs in MODULE_SEMANTIC_SIGNATURES.items():
            score = 0
            for sig in sigs:
                if sig in q:
                    # Longer phrase matches get higher weight
                    score += 5 if " " in sig else 2
            if score > 0:
                module_scores[mod] = score

        if is_school_wide:
            for core_mod in ("students", "finance", "attendance", "staff_hr", "analytics"):
                module_scores[core_mod] = module_scores.get(core_mod, 0) + 10

        # Determine primary modules
        if not module_scores:
            # Fallback if no specific signature matched: general query
            primary_modules = ["staff_hr" if "staff" in q or "teacher" in q else "students"]
        else:
            sorted_mods = sorted(module_scores.items(), key=lambda x: x[1], reverse=True)
            if depth == "SIMPLE":
                # For simple queries, take ONLY the top 1 (or 2 if closely tied) module
                top_score = sorted_mods[0][1]
                primary_modules = [m for m, s in sorted_mods if s >= top_score * 0.7][:2]
            elif depth == "ANALYTICAL":
                primary_modules = [m for m, s in sorted_mods[:3]]
            else:
                primary_modules = [m for m, s in sorted_mods[:5]]

        # Score and filter candidate tools from authorized tools
        tool_scores: list[tuple[int, BaseErpTool, str]] = []
        for tool in authorized_tools:
            t_name = tool.name.lower()
            t_desc = tool.description.lower()
            t_mod = tool.module.lower()

            is_in_primary = any(pm in t_mod or t_mod in pm for pm in primary_modules)

            # Strict exclusion for SIMPLE requests: reject tools not in primary modules
            if depth == "SIMPLE" and not is_in_primary:
                continue

            score = 0
            justification = ""

            if is_in_primary:
                score += 20
                justification = f"Belongs to primary relevant module '{tool.module}'"

            # Check tool name tokens
            for tok in q.replace("_", " ").split():
                if len(tok) > 2 and tok in t_name:
                    score += 10
                    justification += f"; matches entity token '{tok}'"
                elif len(tok) > 3 and tok in t_desc:
                    score += 3

            # Special case matching for staff attendance queries
            if "staff" in q and ("present" in q or "absent" in q or "attendance" in q):
                if tool.name == "staff_attendance_leave":
                    score += 50
                    justification = "Directly queries staff daily attendance, presence, and leaves"
                elif tool.name == "staff_directory":
                    score += 30
                    justification = "Provides staff directory and profiles for present staff"

            if score > 0:
                tool_scores.append((score, tool, justification))

        # Sort by relevance score
        tool_scores.sort(key=lambda x: x[0], reverse=True)

        # Cap candidates strictly based on depth
        if depth == "SIMPLE":
            max_candidates = 2
        elif depth == "ANALYTICAL":
            max_candidates = 4
        else:
            max_candidates = 7

        selected = tool_scores[:max_candidates]
        candidate_tools = [t for _, t, _ in selected]
        justifications = {t.name: j for _, t, j in selected}

        # Safety fallback: If zero tools scored, provide top 1 module-matched tool
        if not candidate_tools:
            for t in authorized_tools:
                if any(pm in t.module.lower() for pm in primary_modules):
                    candidate_tools.append(t)
                    justifications[t.name] = f"Module fallback for '{t.module}'"
                    if len(candidate_tools) >= (1 if depth == "SIMPLE" else 2):
                        break

        excluded_count = len(authorized_tools) - len(candidate_tools)
        logger.info(
            "Tool Discovery for query '%s' [Depth=%s]: Discovered %d tools (%s), Excluded %d tools",
            query[:60],
            depth,
            len(candidate_tools),
            [t.name for t in candidate_tools],
            excluded_count,
        )

        return DiscoveredToolsResult(
            depth=depth,
            primary_modules=primary_modules,
            candidate_tools=candidate_tools,
            justifications=justifications,
            excluded_count=excluded_count,
        )
