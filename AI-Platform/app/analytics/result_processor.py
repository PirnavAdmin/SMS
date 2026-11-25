"""Strict result processing and presentation layer.

Transforms raw internal tool evidence into clean, professional,
executive-ready Markdown tables and summaries. Prevents raw JSON dumps in chat.
"""

from __future__ import annotations

import json
from typing import Any


class StrictResultProcessor:
    """Formats and synthesizes ERP tool data into user-facing Markdown."""

    @classmethod
    def format_final_response(
        cls,
        query: str,
        evidence: list[Any],
        executed_summaries: list[Any],
        raw_llm_reply: str | None = None,
    ) -> str:
        q = query.lower()

        # Special formatting for Staff Attendance / Directory queries
        if "staff" in q and ("present" in q or "absent" in q or "attendance" in q):
            formatted_staff = cls._format_staff_attendance(query, evidence)
            if formatted_staff:
                return formatted_staff

        # If LLM generated a coherent answer without raw JSON, prefer it
        if raw_llm_reply and len(raw_llm_reply.strip()) > 30 and not raw_llm_reply.strip().startswith("{") and not raw_llm_reply.strip().startswith("["):
            # Ensure no raw JSON artifacts are present
            if "```json" not in raw_llm_reply and "{" not in raw_llm_reply[:20]:
                return raw_llm_reply.strip()

        # Fallback structured synthesis from evidence
        lines: list[str] = [f"### ERP Evidence Summary for: **{query}**\n"]
        for ev in evidence:
            data = getattr(ev, "data", None)
            summary = getattr(ev, "summary", "")
            tool_name = getattr(ev, "tool_name", "")

            if isinstance(data, list) and data and isinstance(data[0], dict):
                lines.append(f"#### `{tool_name}` Records:")
                table = cls._render_markdown_table(data[:15])
                lines.append(table)
                lines.append("")
            elif isinstance(data, dict):
                lines.append(f"- **{tool_name}**: {summary}")
                for k, v in list(data.items())[:6]:
                    if not isinstance(v, (dict, list)):
                        lines.append(f"  - **{k.replace('_', ' ').title()}**: {v}")
            elif summary:
                lines.append(f"- **{tool_name}**: {summary}")

        return "\n".join(lines).strip()

    @classmethod
    def _format_staff_attendance(cls, query: str, evidence: list[Any]) -> str | None:
        """Specifically formats staff attendance records into a structured executive table."""
        staff_records: list[dict[str, Any]] = []
        is_asking_present = "present" in query.lower()
        is_asking_absent = "absent" in query.lower()

        for ev in evidence:
            data = getattr(ev, "data", None)
            tool_name = getattr(ev, "tool_name", "")

            if tool_name in ("staff_attendance_leave", "staff_directory"):
                if isinstance(data, list):
                    staff_records.extend(data)
                elif isinstance(data, dict):
                    # Check nested records
                    for key in ("present_staff", "records", "staff", "attendance", "absent_staff"):
                        if isinstance(data.get(key), list):
                            staff_records.extend(data[key])

        if not staff_records:
            return None

        # Filter by status if requested
        filtered = staff_records
        if is_asking_present and not is_asking_absent:
            filtered = [
                s for s in staff_records
                if str(s.get("status") or s.get("AttendanceStatus") or "present").lower() in ("present", "active", "in")
            ]
        elif is_asking_absent and not is_asking_present:
            filtered = [
                s for s in staff_records
                if str(s.get("status") or s.get("AttendanceStatus") or "").lower() in ("absent", "leave", "on_leave")
            ]

        if not filtered and staff_records:
            filtered = staff_records

        title = "Staff Members Present Today" if is_asking_present else "Staff Attendance Overview"
        lines = [
            f"### {title}\n",
            f"**Total Records Retrieved:** {len(filtered)}\n",
        ]

        table = cls._render_markdown_table(filtered[:25])
        lines.append(table)

        if len(filtered) > 25:
            lines.append(f"\n*Note: Showing top 25 of {len(filtered)} verified staff records.*")

        return "\n".join(lines)

    @staticmethod
    def _render_markdown_table(rows: list[dict[str, Any]]) -> str:
        if not rows:
            return "_No records found._"

        # Pick clean columns
        preferred_cols = [
            "StaffId", "staff_id", "id",
            "StaffName", "staff_name", "name", "FullName", "full_name",
            "Role", "role", "designation", "Designation",
            "Department", "department", "department_name",
            "Status", "status", "attendance_status",
            "PunchInTime", "check_in_time", "check_in",
        ]
        all_keys = list(rows[0].keys())
        display_cols = [c for c in preferred_cols if any(c in r for r in rows)]
        if not display_cols:
            display_cols = all_keys[:5]

        # Header
        headers = [c.replace("_", " ").title() for c in display_cols]
        header_line = "| " + " | ".join(headers) + " |"
        sep_line = "| " + " | ".join(["---"] * len(headers)) + " |"

        table_lines = [header_line, sep_line]
        for r in rows:
            row_vals = [str(r.get(c, "-")).replace("|", "/") for c in display_cols]
            table_lines.append("| " + " | ".join(row_vals) + " |")

        return "\n".join(table_lines)
