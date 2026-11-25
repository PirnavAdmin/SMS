"""Verified security and scope schemas passed from ASP.NET Core."""

from typing import Literal, Optional
from pydantic import BaseModel, Field


CanonicalRole = Literal[
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
]


class AiSecurityContext(BaseModel):
    """Authoritative user identity & scope minted by ASP.NET Core."""

    user_id: int = Field(gt=0)
    user_name: str = Field(min_length=1)
    user_email: str = ""
    raw_role: str = Field(min_length=1)
    role: CanonicalRole
    tenant_id: str = Field(default="tenant-default", min_length=1)
    school_id: Optional[int] = None

    # Verified branch & academic year scope (never trusted directly from unverified client headers)
    allowed_branch_ids: list[int] = Field(default_factory=list)
    active_branch_id: Optional[int] = None
    active_branch_name: Optional[str] = None
    academic_year_id: Optional[int] = None
    academic_year_name: Optional[str] = None

    # Role-specific resolved entities
    staff_id: Optional[int] = None
    student_id: Optional[int] = None
    linked_child_student_ids: list[int] = Field(default_factory=list)
    assigned_class_ids: list[int] = Field(default_factory=list)
    assigned_section_ids: list[int] = Field(default_factory=list)

    # Signed token metadata
    issued_at: int = 0
    nonce: str = ""


class ExecutionBudget(BaseModel):
    max_iterations: int = Field(default=8, ge=1, le=20)
    max_tool_calls: int = Field(default=15, ge=1, le=50)
    max_tokens: int = Field(default=32000, ge=500, le=200000)
    timeout_seconds: float = Field(default=45.0, ge=2.0, le=180.0)
    max_parallel_tools: int = Field(default=4, ge=1, le=10)
