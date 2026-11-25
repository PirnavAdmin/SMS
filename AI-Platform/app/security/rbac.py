"""Canonical RBAC normalization and tool/data scope authorization."""

from __future__ import annotations

from app.core.exceptions import AuthorizationDeniedError
from app.schemas.security import AiSecurityContext, CanonicalRole


_ROLE_ALIASES: dict[str, CanonicalRole] = {
    "superadmin": "Super Admin",
    "super admin": "Super Admin",
    "admin": "Admin",
    "principal": "Principal",
    "teacher": "Teacher",
    "faculty": "Teacher",
    "class teacher": "Teacher",
    "hr": "HR",
    "accountant": "Accountant",
    "finance": "Accountant",
    "librarian": "Librarian",
    "transport manager": "Transport Manager",
    "transportmanager": "Transport Manager",
    "transport": "Transport Manager",
    "driver": "Driver",
    "bus driver": "Driver",
    "bus attendant": "Driver",
    "chauffeur": "Driver",
    "hostel warden": "Hostel Warden",
    "hostelwarden": "Hostel Warden",
    "warden": "Hostel Warden",
    "receptionist": "Receptionist",
    "parent": "Parent",
    "student": "Student",
    "staff": "Staff",
    "non teaching": "Staff",
    "non-teaching": "Staff",
}

ALL_ROLES: tuple[CanonicalRole, ...] = (
    "Super Admin",
    "Admin",
    "Principal",
    "Teacher",
    "HR",
    "Accountant",
    "Librarian",
    "Transport Manager",
    "Driver",
    "Hostel Warden",
    "Receptionist",
    "Parent",
    "Student",
    "Staff",
)

EXECUTIVE_ROLES: frozenset[CanonicalRole] = frozenset({"Super Admin", "Admin", "Principal"})
FINANCE_ROLES: frozenset[CanonicalRole] = frozenset({"Super Admin", "Admin", "Principal", "Accountant"})
STAFF_READ_ROLES: frozenset[CanonicalRole] = frozenset(
    {"Super Admin", "Admin", "Principal", "HR", "Accountant", "Teacher", "Staff"}
)


def normalize_role(raw_role: str | None) -> CanonicalRole:
    """Normalizes role strings safely. Unknown or empty roles ALWAYS default to least-privilege 'Staff' (never 'Admin')."""
    if not raw_role:
        return "Staff"
    clean = " ".join(raw_role.lower().replace("_", " ").replace("-", " ").split())
    return _ROLE_ALIASES.get(clean, "Staff")


def assert_tool_role(ctx: AiSecurityContext, allowed_roles: tuple[str, ...] | frozenset[str] | list[str]) -> None:
    if "All" in allowed_roles:
        return
    normalized_allowed = {normalize_role(r) for r in allowed_roles}
    if ctx.role not in normalized_allowed:
        raise AuthorizationDeniedError(
            f"Role '{ctx.role}' is not authorized to invoke this operation.",
            details={"role": ctx.role},
        )


def resolve_authorized_branch_id(ctx: AiSecurityContext, requested_branch_id: int | None) -> int | None:
    """
    Validates branch scope against server-verified allowed_branch_ids.
    - Executive roles with empty allowed_branch_ids have cross-branch access.
    - Non-executive roles or users restricted to specific branches cannot escape their allowed_branch_ids.
    """
    if requested_branch_id is None:
        return ctx.active_branch_id

    if not ctx.allowed_branch_ids:
        if ctx.role in EXECUTIVE_ROLES:
            return requested_branch_id
        if ctx.active_branch_id is not None and requested_branch_id != ctx.active_branch_id:
            raise AuthorizationDeniedError(
                f"Branch ID {requested_branch_id} is outside your authorized branch scope.",
                details={"requested_branch_id": requested_branch_id, "allowed": [ctx.active_branch_id]},
            )
        return requested_branch_id

    if requested_branch_id not in ctx.allowed_branch_ids:
        raise AuthorizationDeniedError(
            f"Branch ID {requested_branch_id} is not permitted for this account.",
            details={"requested_branch_id": requested_branch_id, "allowed_branch_ids": ctx.allowed_branch_ids},
        )
    return requested_branch_id


def resolve_authorized_student_id(ctx: AiSecurityContext, requested_student_id: int | None) -> int | None:
    """Enforces strict student/parent data isolation."""
    if ctx.role == "Student":
        if not ctx.student_id:
            raise AuthorizationDeniedError("Authenticated student account is not linked to an active student record.")
        if requested_student_id is not None and requested_student_id != ctx.student_id:
            raise AuthorizationDeniedError("Students may only access their own records.")
        return ctx.student_id

    if ctx.role == "Parent":
        if not ctx.linked_child_student_ids:
            raise AuthorizationDeniedError("No linked children found for this parent account.")
        if requested_student_id is not None:
            if requested_student_id not in ctx.linked_child_student_ids:
                raise AuthorizationDeniedError("Parents may only access records for their own linked children.")
            return requested_student_id
        return ctx.linked_child_student_ids[0]

    return requested_student_id


def assert_class_scope(ctx: AiSecurityContext, class_id: int | None) -> None:
    """Teachers are restricted to their assigned_class_ids when assigned classes exist."""
    if ctx.role == "Teacher" and class_id is not None:
        if ctx.assigned_class_ids and class_id not in ctx.assigned_class_ids:
            raise AuthorizationDeniedError(
                f"Teachers may only access classes assigned to them (denied class_id={class_id})."
            )
