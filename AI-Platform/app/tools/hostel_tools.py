"""Hostel blocks, rooms, bed occupancy, and fee configuration tools."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel

from app.integrations.mysql_reader import get_mysql_reader
from app.schemas.chat import VisualArtifact
from app.schemas.security import AiSecurityContext
from app.tools.base import BaseErpTool, ToolOutput
from app.tools.erp_helpers import join_where


class HostelOccupancyInput(BaseModel):
    hostel_name: Optional[str] = None


class HostelOccupancyFeesTool(BaseErpTool):
    name = "hostel_occupancy_fees"
    description = (
        "Analyzes hostel blocks, configured rooms, bed capacities, active student bed allocations, "
        "occupancy percentages, vacant beds, and hostel fee structures."
    )
    module = "hostel"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Hostel Warden", "Accountant")
    input_model = HostelOccupancyInput

    async def _run(self, ctx: AiSecurityContext, params: HostelOccupancyInput) -> ToolOutput:
        mysql = get_mysql_reader()
        tid = ctx.tenant_id

        where = ["hb.TenantId = :tid"]
        qparams: dict[str, object] = {"tid": tid}
        if params.hostel_name:
            where.append("LOWER(hb.HostelName) LIKE LOWER(:hname)")
            qparams["hname"] = f"%{params.hostel_name.strip()}%"

        blocks = await mysql.fetch_all(
            f"""
            SELECT
                hb.HostelId, hb.HostelName, hb.HostelCode, hb.HostelType, hb.WardenName, hb.Status,
                COUNT(DISTINCT rm.RoomId) AS total_rooms,
                COALESCE(SUM(rtc.BedCapacity), 0) AS total_bed_capacity,
                COUNT(DISTINCT CASE WHEN sba.Status = 'Active' THEN sba.AllocationId END) AS occupied_beds
            FROM hostel_blocks hb
            LEFT JOIN room_masters rm ON rm.HostelId = hb.HostelId AND rm.TenantId = :tid
            LEFT JOIN room_type_configs rtc ON rtc.RoomTypeId = rm.RoomTypeId
            LEFT JOIN student_bed_allocations sba ON sba.HostelId = hb.HostelId AND sba.TenantId = :tid
            WHERE {join_where(where)}
            GROUP BY hb.HostelId, hb.HostelName, hb.HostelCode, hb.HostelType, hb.WardenName, hb.Status
            ORDER BY hb.HostelId ASC
            """,
            qparams,
        )

        # Notice student_bed_allocations.StudentId references admission_applications.Id in MySQL FK
        allocations = await mysql.fetch_all(
            """
            SELECT
                sba.AllocationId, sba.RegistrationNo, sba.StudentName, sba.StudentId,
                hb.HostelName, rm.RoomNumber, rm.FloorLevel, sba.BedNumber,
                sba.JoiningDate, sba.Status,
                COALESCE(aa.AdmissionNo, s.admission_number) AS admission_number
            FROM student_bed_allocations sba
            LEFT JOIN hostel_blocks hb ON hb.HostelId = sba.HostelId
            LEFT JOIN room_masters rm ON rm.RoomId = sba.RoomId
            LEFT JOIN admission_applications aa ON aa.Id = sba.StudentId
            LEFT JOIN students s ON s.student_id = sba.StudentId OR s.admission_number = sba.RegistrationNo
            WHERE sba.TenantId = :tid
            ORDER BY sba.AllocationId DESC
            """,
            {"tid": tid},
        )

        fee_configs = await mysql.fetch_all(
            """
            SELECT Id, HostelName, RoomTypeName, RoomNo, AcademicYear, Branch, FeePlan, HostelFee, SecurityDeposit, Status
            FROM hostel_fee_configs
            WHERE TenantId = :tid
            """,
            {"tid": tid},
        )

        for b in blocks:
            cap = int(b.get("total_bed_capacity") or 0)
            occ = int(b.get("occupied_beds") or 0)
            b["vacant_beds"] = max(cap - occ, 0)
            b["occupancy_pct"] = round((occ / cap) * 100.0, 2) if cap > 0 else 0.0

        total_cap = sum(int(b.get("total_bed_capacity") or 0) for b in blocks)
        total_occ = sum(int(b.get("occupied_beds") or 0) for b in blocks)
        overall_pct = round((total_occ / total_cap) * 100.0, 2) if total_cap > 0 else 0.0

        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=len(allocations),
            summary=(
                f"Hostel network has {len(blocks)} block(s), total capacity {total_cap} beds, "
                f"{total_occ} active occupied ({overall_pct}% occupancy), {max(total_cap - total_occ, 0)} vacant."
            ),
            data={
                "blocks": blocks,
                "allocations": allocations,
                "fee_configs": fee_configs,
                "total_capacity": total_cap,
                "total_occupied": total_occ,
                "overall_occupancy_pct": overall_pct,
            },
            visuals=[
                VisualArtifact(visual_type="table", title="Hostel Block Occupancy", data={"rows": blocks}),
                VisualArtifact(
                    visual_type="chart",
                    title="Hostel Capacity vs Occupied Beds",
                    data={
                        "chartType": "bar",
                        "labels": [b["HostelName"] for b in blocks],
                        "datasets": [
                            {"label": "Total Capacity", "data": [int(b["total_bed_capacity"] or 0) for b in blocks]},
                            {"label": "Occupied Beds", "data": [int(b["occupied_beds"] or 0) for b in blocks]},
                        ],
                    },
                ),
            ],
        )
