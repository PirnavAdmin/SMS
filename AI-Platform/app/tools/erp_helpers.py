"""Shared RBAC SQL scoping and formatting helpers for ERP tools."""

from __future__ import annotations

from typing import Any

from app.integrations.mysql_reader import MySqlReadOnlyReader, get_mysql_reader
from app.schemas.security import AiSecurityContext
from app.security.rbac import EXECUTIVE_ROLES, resolve_authorized_branch_id


async def resolve_scope_filters(
    ctx: AiSecurityContext,
    *,
    requested_branch_id: int | None = None,
    requested_branch_name: str | None = None,
    requested_academic_year_id: int | None = None,
    reader: MySqlReadOnlyReader | None = None,
) -> dict[str, Any]:
    """Resolves verified tenant, branch_id, branch_name, and academic_year_id filters."""
    mysql = reader or get_mysql_reader()

    resolved_branch_id = requested_branch_id
    if resolved_branch_id is None and requested_branch_name:
        row = await mysql.fetch_one(
            """
            SELECT BranchId, BranchName
            FROM branches
            WHERE TenantId = :tenant_id
              AND Status = 'Active'
              AND (LOWER(BranchName) = LOWER(:bname) OR LOWER(BranchCode) = LOWER(:bname))
            LIMIT 1
            """,
            {"tenant_id": ctx.tenant_id, "bname": requested_branch_name.strip()},
        )
        if row:
            resolved_branch_id = int(row["BranchId"])

    authorized_branch_id = resolve_authorized_branch_id(ctx, resolved_branch_id)
    branch_name = ctx.active_branch_name
    if authorized_branch_id is not None and not branch_name:
        row = await mysql.fetch_one(
            "SELECT BranchName FROM branches WHERE TenantId = :tenant_id AND BranchId = :bid LIMIT 1",
            {"tenant_id": ctx.tenant_id, "bid": authorized_branch_id},
        )
        if row:
            branch_name = str(row["BranchName"])

    year_id = requested_academic_year_id if requested_academic_year_id is not None else ctx.academic_year_id
    year_name = ctx.academic_year_name
    if year_id is not None and not year_name:
        yrow = await mysql.fetch_one(
            "SELECT academic_year_name FROM academic_years WHERE TenantId = :tenant_id AND academic_year_id = :yid LIMIT 1",
            {"tenant_id": ctx.tenant_id, "yid": year_id},
        )
        if yrow:
            year_name = str(yrow["academic_year_name"])

    return {
        "tenant_id": ctx.tenant_id,
        "branch_id": authorized_branch_id,
        "branch_name": branch_name,
        "allowed_branch_ids": list(ctx.allowed_branch_ids),
        "academic_year_id": year_id,
        "academic_year_name": year_name,
        "is_executive": ctx.role in EXECUTIVE_ROLES,
    }


def join_where(parts: list[str]) -> str:
    """Safely joins SQL WHERE predicates with AND, stripping any accidental leading AND."""
    cleaned: list[str] = []
    for part in parts:
        p = part.strip()
        if not p:
            continue
        if p.upper().startswith("AND "):
            p = p[4:].strip()
        cleaned.append(p)
    return " AND ".join(cleaned)


def apply_branch_in_clause(
    sql_parts: list[str],
    params: dict[str, Any],
    scope: dict[str, Any],
    column_expr: str = "s.branch_id",
) -> None:
    """Adds parameterized branch filter respecting executive cross-branch vs restricted scopes."""
    branch_id = scope.get("branch_id")
    allowed = scope.get("allowed_branch_ids") or []
    if branch_id is not None:
        sql_parts.append(f"{column_expr} = :branch_id")
        params["branch_id"] = int(branch_id)
    elif allowed and not scope.get("is_executive"):
        placeholders = []
        for idx, bid in enumerate(allowed):
            key = f"abid_{idx}"
            placeholders.append(f":{key}")
            params[key] = int(bid)
        sql_parts.append(f"{column_expr} IN ({', '.join(placeholders)})")


def apply_student_isolation_clause(
    sql_parts: list[str],
    params: dict[str, Any],
    ctx: AiSecurityContext,
    column_expr: str = "s.student_id",
    class_column_expr: str = "s.class_id",
) -> None:
    """Enforces Student, Parent, and Teacher row-level isolation at query time."""
    if ctx.role == "Student":
        sid = ctx.student_id or -1
        sql_parts.append(f"{column_expr} = :iso_student_id")
        params["iso_student_id"] = int(sid)
    elif ctx.role == "Parent":
        child_ids = ctx.linked_child_student_ids or [-1]
        ph = []
        for idx, cid in enumerate(child_ids):
            key = f"child_{idx}"
            ph.append(f":{key}")
            params[key] = int(cid)
        sql_parts.append(f"{column_expr} IN ({', '.join(ph)})")
    elif ctx.role == "Teacher" and ctx.assigned_class_ids:
        ph = []
        for idx, cid in enumerate(ctx.assigned_class_ids):
            key = f"tcls_{idx}"
            ph.append(f":{key}")
            params[key] = int(cid)
        sql_parts.append(f"{class_column_expr} IN ({', '.join(ph)})")
