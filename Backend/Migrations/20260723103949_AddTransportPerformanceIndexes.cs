using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    public partial class AddTransportPerformanceIndexes : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_VehMaint_Vehicle_ServiceDate_Deleted",
                table: "transport_vehicle_maintenance",
                columns: new[]
                {
                    "vehicle_id",
                    "service_date",
                    "is_deleted"
                });

            migrationBuilder.CreateIndex(
                name: "IX_TVA_Vehicle_Driver_Route",
                table: "transport_vehicle_assignments",
                columns: new[]
                {
                    "vehicle_id",
                    "driver_id",
                    "route_id",
                    "status",
                    "is_deleted"
                });

            migrationBuilder.CreateIndex(
                name: "IX_STA_Route_Pickup_Vehicle",
                table: "student_transport_assignments",
                columns: new[]
                {
                    "route_id",
                    "pickup_point_id",
                    "vehicle_assignment_id",
                    "status",
                    "is_deleted"
                });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_VehMaint_Vehicle_ServiceDate_Deleted",
                table: "transport_vehicle_maintenance");

            migrationBuilder.DropIndex(
                name: "IX_TVA_Vehicle_Driver_Route",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropIndex(
                name: "IX_STA_Route_Pickup_Vehicle",
                table: "student_transport_assignments");
        }
    }
}