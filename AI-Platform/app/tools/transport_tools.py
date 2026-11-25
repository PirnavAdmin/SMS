"""Transport routes, vehicles, drivers, assignments, and maintenance tools."""

from __future__ import annotations

from pydantic import BaseModel

from app.integrations.mysql_reader import get_mysql_reader
from app.schemas.chat import VisualArtifact
from app.schemas.security import AiSecurityContext
from app.tools.base import BaseErpTool, ToolOutput


class TransportOperationsTool(BaseErpTool):
    name = "transport_operations"
    description = (
        "Retrieves transport routes, bus fleet, drivers, pickup points, vehicle-route assignments, "
        "enrolled student transport subscriptions, and maintenance records."
    )
    module = "transport"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Transport Manager", "Driver", "Accountant")

    async def _run(self, ctx: AiSecurityContext, params: BaseModel) -> ToolOutput:
        mysql = get_mysql_reader()
        tid = ctx.tenant_id

        routes = await mysql.fetch_all(
            """
            SELECT RouteId, RouteCode, RouteName, StartLocation, EndLocation, DistanceKm, MonthlyFee, Status
            FROM transport_routes
            WHERE TenantId = :tid AND IsDeleted = 0
            ORDER BY RouteId ASC
            """,
            {"tid": tid},
        )
        vehicles = await mysql.fetch_all(
            """
            SELECT VehicleId, VehicleNumber, RegistrationNumber, VehicleName, VehicleType,
                   Capacity, IsAC, InsuranceExpiry, PollutionExpiry, FitnessExpiry, Status
            FROM transport_vehicles
            WHERE TenantId = :tid AND IsDeleted = 0
            """,
            {"tid": tid},
        )
        drivers = await mysql.fetch_all(
            """
            SELECT DriverId, DriverName, LicenceNumber, LicenceExpiry, MobileNumber, AssignedVehicleId, Status
            FROM transport_drivers
            WHERE TenantId = :tid AND IsDeleted = 0
            """,
            {"tid": tid},
        )
        student_assignments = await mysql.fetch_all(
            """
            SELECT sta.StudentTransportAssignmentId, sta.StudentId, sta.AdmissionNo,
                   s.student_name, tr.RouteName, tr.MonthlyFee, tpp.PickupPointName,
                   sta.TransportType, sta.Status
            FROM student_transport_assignments sta
            LEFT JOIN students s ON s.student_id = sta.StudentId
            LEFT JOIN transport_routes tr ON tr.RouteId = sta.RouteId
            LEFT JOIN transport_pickup_points tpp ON tpp.PickupPointId = sta.PickupPointId
            WHERE sta.TenantId = :tid AND sta.IsDeleted = 0
            """,
            {"tid": tid},
        )
        maintenances = await mysql.fetch_all(
            """
            SELECT m.maintenance_id, v.VehicleNumber, m.service_type, m.service_date, m.cost, m.next_service_due, m.status
            FROM transport_vehicle_maintenances m
            LEFT JOIN transport_vehicles v ON v.VehicleId = m.vehicle_id
            WHERE m.TenantId = :tid AND m.is_deleted = 0
            """,
            {"tid": tid},
        )

        active_students = [a for a in student_assignments if str(a.get("Status")) in {"1", "Active", "active", "True", "true"}]

        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=len(routes) + len(vehicles) + len(student_assignments),
            summary=(
                f"Transport fleet: {len(routes)} routes, {len(vehicles)} vehicles, {len(drivers)} drivers, "
                f"{len(student_assignments)} student transport rows ({len(active_students)} active), "
                f"{len(maintenances)} maintenance log(s)."
            ),
            data={
                "routes": routes,
                "vehicles": vehicles,
                "drivers": drivers,
                "student_assignments": student_assignments,
                "active_student_assignments_count": len(active_students),
                "maintenances": maintenances,
            },
            visuals=[
                VisualArtifact(visual_type="table", title="Transport Routes", data={"rows": routes}),
                VisualArtifact(visual_type="table", title="Transport Vehicles & Compliance", data={"rows": vehicles}),
            ],
        )
