"""Centralized dynamic ERP tool catalog assembling all 17 modules, analytics, ML, RAG, and actions."""

from __future__ import annotations

from functools import lru_cache

from app.tools.academic_tools import (
    AcademicStructureTool,
    HomeworkAssignmentsTool,
    TimetableScheduleTool,
)
from app.tools.action_tools import (
    PrepareAnnouncementActionTool,
    PrepareLeaveReviewActionTool,
    PrepareScheduleMeetingActionTool,
)
from app.tools.admission_tools import AdmissionsOverviewTool
from app.tools.attendance_tools import AttendanceOverviewTool, StudentLowAttendanceTool
from app.tools.exam_tools import ExaminationResultsTool
from app.tools.finance_tools import (
    FeeCollectionsSummaryTool,
    FinanceAdjustmentsExpensesTool,
    StudentFeeDuesTool,
)
from app.tools.hostel_tools import HostelOccupancyFeesTool
from app.tools.library_tools import LibraryOperationsTool
from app.tools.organization_certificates_alumni_tools import (
    CertificatesAlumniTool,
    OrganizationGovernanceTool,
)
from app.tools.parent_tools import ParentMappingsTool
from app.tools.registry import ToolRegistry
from app.tools.staff_hr_tools import (
    FacultyWorkshopsTool,
    PayrollSummaryTool,
    StaffAttendanceLeaveTool,
    StaffDirectoryTool,
)
from app.tools.student_tools import (
    StudentOverviewTool,
    StudentProfileTool,
    StudentSearchTool,
)
from app.tools.transport_tools import TransportOperationsTool
from app.tools.uniform_inventory_tools import UniformInventoryTool


def build_default_registry(*, include_optional_subsystems: bool = True) -> ToolRegistry:
    """Builds a fresh ToolRegistry populated with all ERP module tools."""
    registry = ToolRegistry()
    registry.register_many(
        [
            # 1. Students
            StudentOverviewTool(),
            StudentSearchTool(),
            StudentProfileTool(),
            # 2. Parents
            ParentMappingsTool(),
            # 3. Admissions
            AdmissionsOverviewTool(),
            # 4-5. Staff, HR, Attendance, Payroll, Workshops
            StaffDirectoryTool(),
            StaffAttendanceLeaveTool(),
            PayrollSummaryTool(),
            FacultyWorkshopsTool(),
            # 6. Academics, Timetables, Homework
            AcademicStructureTool(),
            TimetableScheduleTool(),
            HomeworkAssignmentsTool(),
            # 7. Student Attendance
            AttendanceOverviewTool(),
            StudentLowAttendanceTool(),
            # 8-9. Finance, Fees, Collections, Discounts, Concessions, Expenses
            FeeCollectionsSummaryTool(),
            StudentFeeDuesTool(),
            FinanceAdjustmentsExpensesTool(),
            # 10. Hostel
            HostelOccupancyFeesTool(),
            # 11. Transport
            TransportOperationsTool(),
            # 12. Examination
            ExaminationResultsTool(),
            # 13. Library
            LibraryOperationsTool(),
            # 14-15. Uniform & General Inventory
            UniformInventoryTool(),
            # 16-17. Organization, Governance, Certificates, Alumni
            OrganizationGovernanceTool(),
            CertificatesAlumniTool(),
            # Two-phase Authorized Write Action Tools
            PrepareAnnouncementActionTool(),
            PrepareScheduleMeetingActionTool(),
            PrepareLeaveReviewActionTool(),
        ]
    )

    if include_optional_subsystems:
        # Optional later-stage subsystems register cleanly when implemented
        try:
            from app.analytics.tools import get_analytics_tools

            registry.register_many(get_analytics_tools())
        except ImportError:
            pass
        try:
            from app.ml.tools import get_ml_tools

            registry.register_many(get_ml_tools())
        except ImportError:
            pass
        try:
            from app.rag.tools import get_rag_tools

            registry.register_many(get_rag_tools())
        except ImportError:
            pass

    return registry


@lru_cache(maxsize=1)
def get_default_registry() -> ToolRegistry:
    return build_default_registry(include_optional_subsystems=True)
