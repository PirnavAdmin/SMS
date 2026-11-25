"""Automated 10+ scenario enterprise evaluation runner against live sms_new_test."""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

from app.agents.autonomous_agent import AutonomousErpAgent
from app.config.settings import Settings
from app.llm.router import ModelRouter
from app.schemas.chat import AiChatRequest, AiChatResponse
from app.schemas.security import AiSecurityContext
from app.tools.catalog import build_default_registry


@dataclass
class EvaluationScenario:
    scenario_id: str
    title: str
    role: str
    prompt: str
    expected_modules: list[str] = field(default_factory=list)
    expected_tools_any: list[str] = field(default_factory=list)
    validator: Callable[[AiChatResponse], tuple[bool, str]] | None = None


def _build_ctx(role: str = "Super Admin") -> AiSecurityContext:
    return AiSecurityContext(
        user_id=1,
        user_name=f"Eval {role}",
        user_email=f"eval_{role.lower().replace(' ', '_')}@pirnav.edu",
        raw_role=role,
        role=role,  # type: ignore[arg-type]
        tenant_id="tenant-default",
        issued_at=int(time.time()),
        nonce="evalsuite",
    )


def build_standard_scenarios() -> list[EvaluationScenario]:
    return [
        EvaluationScenario(
            scenario_id="S01_CROSS_DUES_ATTENDANCE",
            title="Cross-Module Dues & Poor Attendance",
            role="Super Admin",
            prompt="Analyze students who have financial dues and poor attendance",
            expected_modules=["analytics"],
            expected_tools_any=["analytics_cross_module_dues_attendance", "student_low_attendance", "student_fee_dues"],
        ),
        EvaluationScenario(
            scenario_id="S02_FINANCIAL_HEALTH",
            title="School Financial Health & Reconciliation",
            role="Principal",
            prompt="Analyze the school's financial condition",
            expected_modules=["analytics", "finance"],
            expected_tools_any=["analytics_financial_health", "fee_collections_summary"],
        ),
        EvaluationScenario(
            scenario_id="S03_ADMISSIONS_VS_STUDENTS",
            title="Admissions vs Active Students Reconciliation",
            role="Admin",
            prompt="Reconcile admissions applications against active students across branches and check inconsistencies",
            expected_modules=["analytics", "admissions", "students"],
            expected_tools_any=["analytics_reconcile_admissions_students", "admissions_overview", "student_overview"],
        ),
        EvaluationScenario(
            scenario_id="S04_HOSTEL_OCCUPANCY",
            title="Hostel Bed Occupancy & Revenue Run-Rate",
            role="Hostel Warden",
            prompt="What is the current hostel occupancy, vacant beds, and annual hostel revenue potential?",
            expected_modules=["hostel", "analytics"],
            expected_tools_any=["analytics_hostel_financial_occupancy", "hostel_occupancy_fees"],
        ),
        EvaluationScenario(
            scenario_id="S05_TRANSPORT_FLEET",
            title="Transport Route Utilization & Compliance",
            role="Transport Manager",
            prompt="Analyze transport routes, active student riders, fleet capacity, and vehicle compliance alerts",
            expected_modules=["transport", "analytics"],
            expected_tools_any=["analytics_transport_usage_dues", "transport_operations"],
        ),
        EvaluationScenario(
            scenario_id="S06_HR_STAFF_PAYROLL",
            title="Staff Directory, Leaves & Monthly Payroll",
            role="HR",
            prompt="Summarize staff directory, pending leave applications, and monthly payroll totals",
            expected_modules=["staff_hr"],
            expected_tools_any=["staff_directory", "staff_attendance_leave", "payroll_summary"],
        ),
        EvaluationScenario(
            scenario_id="S07_ML_ATTENDANCE_ANOMALIES",
            title="Ethical ML Attendance Anomaly Detection",
            role="Principal",
            prompt="Detect student behavioral attendance anomalies using machine learning and audit data readiness",
            expected_modules=["ml"],
            expected_tools_any=["ml_attendance_anomaly_detection", "ml_data_readiness_audit"],
        ),
        EvaluationScenario(
            scenario_id="S08_RAG_POLICY_RETRIEVAL",
            title="RAG Policy & Circular Retrieval",
            role="Admin",
            prompt="Search school policy documents for attendance percentage regulations and fee reconciliation policy",
            expected_modules=["rag"],
            expected_tools_any=["rag_search_documents"],
        ),
        EvaluationScenario(
            scenario_id="S09_TWO_PHASE_ACTION",
            title="Two-Phase Confirmed Circular Preparation",
            role="Admin",
            prompt="Create announcement circular titled Term Exam Notice with content Exams start next Monday for Parents",
            expected_modules=["communication"],
            expected_tools_any=["action_create_announcement"],
            validator=lambda r: (
                r.pending_action is not None and r.pending_action.action_type == "create_announcement",
                "Expected PendingActionPreview without direct DB write",
            ),
        ),
        EvaluationScenario(
            scenario_id="S10_UNSEEN_MULTI_DOMAIN",
            title="Unseen Multi-Domain Exam + Finance + Library Audit",
            role="Super Admin",
            prompt="Generate school management report covering exam results, student overview, and library circulation",
            expected_modules=["analytics", "examination", "library", "students"],
            expected_tools_any=["analytics_school_management_report", "examination_results", "library_operations"],
        ),
    ]


async def run_evaluation_suite(
    settings: Settings,
    *,
    scenarios: list[EvaluationScenario] | None = None,
    report_path: Path | None = None,
) -> dict[str, Any]:
    """Executes every benchmark scenario cleanly and computes pass metrics & full traces."""
    suite = scenarios or build_standard_scenarios()
    router = ModelRouter(settings)
    registry = build_default_registry(include_optional_subsystems=True)
    agent = AutonomousErpAgent(settings, router, registry)

    results: list[dict[str, Any]] = []
    passed = 0
    for sc in suite:
        ctx = _build_ctx(sc.role)
        req = AiChatRequest(message=sc.prompt)
        t0 = time.perf_counter()
        err: str | None = None
        resp: AiChatResponse | None = None
        ok = False
        note = "passed"

        try:
            resp = await agent.investigate(ctx, req)
            tools_used = [t.tool_name for t in resp.tool_calls_executed if t.success]
            has_expected_tool = (not sc.expected_tools_any) or any(t in tools_used for t in sc.expected_tools_any)
            has_reply = bool(resp.reply and len(resp.reply.strip()) >= 15)
            no_raw_cot = "<thought>" not in resp.reply.lower() and "chain-of-thought" not in resp.reply.lower()
            custom_ok = True
            if sc.validator is not None:
                custom_ok, note = sc.validator(resp)
            ok = has_expected_tool and has_reply and no_raw_cot and custom_ok
            if not has_expected_tool:
                note = f"Expected any tool in {sc.expected_tools_any}, got {tools_used}"
            elif not has_reply:
                note = "Empty reply generated"
            elif not no_raw_cot:
                note = "Detected restricted CoT marker in final reply"
        except Exception as exc:
            err = str(exc)
            note = err

        elapsed = round((time.perf_counter() - t0) * 1000.0, 2)
        if ok:
            passed += 1

        results.append(
            {
                "scenario_id": sc.scenario_id,
                "title": sc.title,
                "role": sc.role,
                "prompt": sc.prompt,
                "passed": ok,
                "note": note,
                "error": err,
                "latency_ms": elapsed,
                "provider_used": resp.provider_used if resp else "",
                "tokens_used": resp.tokens_used if resp else 0,
                "plan": resp.investigation_plan.model_dump() if (resp and resp.investigation_plan) else None,
                "tools_executed": [t.model_dump() for t in resp.tool_calls_executed] if resp else [],
                "evidence_count": len(resp.evidence) if resp else 0,
                "reply_excerpt": resp.reply[:400] if resp else "",
            }
        )

    summary = {
        "total_scenarios": len(suite),
        "passed": passed,
        "failed": len(suite) - passed,
        "pass_rate_pct": round((passed / len(suite)) * 100.0, 2) if suite else 0.0,
        "results": results,
    }

    if report_path is not None:
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(summary, indent=2, default=str), encoding="utf-8")

    return summary
