using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddDepartmentAndSubjectRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_student_transport_assignments_TransportRoutes_route_id",
                table: "student_transport_assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_student_transport_assignments_transport_pickup_points_pickup~",
                table: "student_transport_assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_transport_pickup_points_TransportRoutes_route_id",
                table: "transport_pickup_points");

            migrationBuilder.DropForeignKey(
                name: "FK_transport_vehicle_assignments_TransportDrivers_driver_id",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_transport_vehicle_assignments_TransportRoutes_route_id",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_transport_vehicle_assignments_TransportVehicles_vehicle_id",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_TransportDrivers_TransportVehicles_AssignedVehicleId",
                table: "TransportDrivers");

            migrationBuilder.DropForeignKey(
                name: "FK_TransportRoutes_TransportVehicles_VehicleId",
                table: "TransportRoutes");

            migrationBuilder.DropForeignKey(
                name: "FK_VehicleMaintenances_TransportVehicles_VehicleId",
                table: "VehicleMaintenances");

            migrationBuilder.DropPrimaryKey(
                name: "PK_VehicleMaintenances",
                table: "VehicleMaintenances");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TransportVehicles",
                table: "TransportVehicles");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TransportRoutes",
                table: "TransportRoutes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TransportDrivers",
                table: "TransportDrivers");

            migrationBuilder.DropColumn(
                name: "assignment_date",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropColumn(
                name: "created_at",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropColumn(
                name: "created_by",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropColumn(
                name: "shift",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropColumn(
                name: "updated_by",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropColumn(
                name: "created_by",
                table: "transport_pickup_points");

            migrationBuilder.DropColumn(
                name: "updated_by",
                table: "transport_pickup_points");

            migrationBuilder.DropColumn(
                name: "created_at",
                table: "student_transport_assignments");

            migrationBuilder.DropColumn(
                name: "created_by",
                table: "student_transport_assignments");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "student_transport_assignments");

            migrationBuilder.DropColumn(
                name: "updated_by",
                table: "student_transport_assignments");

            migrationBuilder.DropColumn(
                name: "LicenseNumber",
                table: "TransportDrivers");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "TransportDrivers");

            migrationBuilder.RenameTable(
                name: "VehicleMaintenances",
                newName: "transport_vehicle_maintenance");

            migrationBuilder.RenameTable(
                name: "TransportVehicles",
                newName: "transport_vehicles");

            migrationBuilder.RenameTable(
                name: "TransportRoutes",
                newName: "transport_routes");

            migrationBuilder.RenameTable(
                name: "TransportDrivers",
                newName: "transport_drivers");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "transport_vehicle_assignments",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "remarks",
                table: "transport_vehicle_assignments",
                newName: "Remarks");

            migrationBuilder.RenameColumn(
                name: "vehicle_id",
                table: "transport_vehicle_assignments",
                newName: "VehicleId");

            migrationBuilder.RenameColumn(
                name: "route_id",
                table: "transport_vehicle_assignments",
                newName: "RouteId");

            migrationBuilder.RenameColumn(
                name: "is_deleted",
                table: "transport_vehicle_assignments",
                newName: "IsDeleted");

            migrationBuilder.RenameColumn(
                name: "effective_to",
                table: "transport_vehicle_assignments",
                newName: "EffectiveTo");

            migrationBuilder.RenameColumn(
                name: "effective_from",
                table: "transport_vehicle_assignments",
                newName: "EffectiveFrom");

            migrationBuilder.RenameColumn(
                name: "driver_id",
                table: "transport_vehicle_assignments",
                newName: "DriverId");

            migrationBuilder.RenameColumn(
                name: "assignment_id",
                table: "transport_vehicle_assignments",
                newName: "AssignmentId");

            migrationBuilder.RenameIndex(
                name: "IX_transport_vehicle_assignments_vehicle_id",
                table: "transport_vehicle_assignments",
                newName: "IX_transport_vehicle_assignments_VehicleId");

            migrationBuilder.RenameIndex(
                name: "IX_transport_vehicle_assignments_route_id",
                table: "transport_vehicle_assignments",
                newName: "IX_transport_vehicle_assignments_RouteId");

            migrationBuilder.RenameIndex(
                name: "IX_transport_vehicle_assignments_driver_id",
                table: "transport_vehicle_assignments",
                newName: "IX_transport_vehicle_assignments_DriverId");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "transport_pickup_points",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "landmark",
                table: "transport_pickup_points",
                newName: "Landmark");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "transport_pickup_points",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "sequence_no",
                table: "transport_pickup_points",
                newName: "SequenceNo");

            migrationBuilder.RenameColumn(
                name: "route_id",
                table: "transport_pickup_points",
                newName: "RouteId");

            migrationBuilder.RenameColumn(
                name: "pickup_time",
                table: "transport_pickup_points",
                newName: "PickupTime");

            migrationBuilder.RenameColumn(
                name: "pickup_point_name",
                table: "transport_pickup_points",
                newName: "PickupPointName");

            migrationBuilder.RenameColumn(
                name: "is_deleted",
                table: "transport_pickup_points",
                newName: "IsDeleted");

            migrationBuilder.RenameColumn(
                name: "distance_from_start",
                table: "transport_pickup_points",
                newName: "DistanceFromStart");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "transport_pickup_points",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "pickup_point_id",
                table: "transport_pickup_points",
                newName: "PickupPointId");

            migrationBuilder.RenameIndex(
                name: "IX_transport_pickup_points_route_id",
                table: "transport_pickup_points",
                newName: "IX_transport_pickup_points_RouteId");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "student_transport_assignments",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "remarks",
                table: "student_transport_assignments",
                newName: "Remarks");

            migrationBuilder.RenameColumn(
                name: "vehicle_assignment_id",
                table: "student_transport_assignments",
                newName: "VehicleAssignmentId");

            migrationBuilder.RenameColumn(
                name: "transport_type",
                table: "student_transport_assignments",
                newName: "TransportType");

            migrationBuilder.RenameColumn(
                name: "student_id",
                table: "student_transport_assignments",
                newName: "StudentId");

            migrationBuilder.RenameColumn(
                name: "route_id",
                table: "student_transport_assignments",
                newName: "RouteId");

            migrationBuilder.RenameColumn(
                name: "pickup_point_id",
                table: "student_transport_assignments",
                newName: "PickupPointId");

            migrationBuilder.RenameColumn(
                name: "is_deleted",
                table: "student_transport_assignments",
                newName: "IsDeleted");

            migrationBuilder.RenameColumn(
                name: "effective_to",
                table: "student_transport_assignments",
                newName: "EffectiveTo");

            migrationBuilder.RenameColumn(
                name: "effective_from",
                table: "student_transport_assignments",
                newName: "EffectiveFrom");

            migrationBuilder.RenameColumn(
                name: "student_transport_assignment_id",
                table: "student_transport_assignments",
                newName: "StudentTransportAssignmentId");

            migrationBuilder.RenameIndex(
                name: "IX_student_transport_assignments_vehicle_assignment_id",
                table: "student_transport_assignments",
                newName: "IX_student_transport_assignments_VehicleAssignmentId");

            migrationBuilder.RenameIndex(
                name: "IX_student_transport_assignments_route_id",
                table: "student_transport_assignments",
                newName: "IX_student_transport_assignments_RouteId");

            migrationBuilder.RenameIndex(
                name: "IX_student_transport_assignments_pickup_point_id",
                table: "student_transport_assignments",
                newName: "IX_student_transport_assignments_PickupPointId");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "transport_vehicle_maintenance",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Remarks",
                table: "transport_vehicle_maintenance",
                newName: "remarks");

            migrationBuilder.RenameColumn(
                name: "Cost",
                table: "transport_vehicle_maintenance",
                newName: "cost");

            migrationBuilder.RenameColumn(
                name: "VendorCenter",
                table: "transport_vehicle_maintenance",
                newName: "vendor_center");

            migrationBuilder.RenameColumn(
                name: "VehicleId",
                table: "transport_vehicle_maintenance",
                newName: "vehicle_id");

            migrationBuilder.RenameColumn(
                name: "UpdatedBy",
                table: "transport_vehicle_maintenance",
                newName: "updated_by");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "transport_vehicle_maintenance",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "ServiceType",
                table: "transport_vehicle_maintenance",
                newName: "service_type");

            migrationBuilder.RenameColumn(
                name: "ServiceDate",
                table: "transport_vehicle_maintenance",
                newName: "service_date");

            migrationBuilder.RenameColumn(
                name: "NextServiceDue",
                table: "transport_vehicle_maintenance",
                newName: "next_service_due");

            migrationBuilder.RenameColumn(
                name: "IsDeleted",
                table: "transport_vehicle_maintenance",
                newName: "is_deleted");

            migrationBuilder.RenameColumn(
                name: "CreatedBy",
                table: "transport_vehicle_maintenance",
                newName: "created_by");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "transport_vehicle_maintenance",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "MaintenanceId",
                table: "transport_vehicle_maintenance",
                newName: "maintenance_id");

            migrationBuilder.RenameIndex(
                name: "IX_VehicleMaintenances_VehicleId",
                table: "transport_vehicle_maintenance",
                newName: "IX_transport_vehicle_maintenance_vehicle_id");

            migrationBuilder.RenameIndex(
                name: "IX_TransportRoutes_VehicleId",
                table: "transport_routes",
                newName: "IX_transport_routes_VehicleId");

            migrationBuilder.RenameIndex(
                name: "IX_TransportDrivers_AssignedVehicleId",
                table: "transport_drivers",
                newName: "IX_transport_drivers_AssignedVehicleId");

            migrationBuilder.AddColumn<int>(
                name: "DepartmentId",
                table: "Subjects",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "VehicleType",
                table: "transport_vehicles",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "VehicleName",
                table: "transport_vehicles",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "Model",
                table: "transport_vehicles",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "Manufacturer",
                table: "transport_vehicles",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "InsuranceNumber",
                table: "transport_vehicles",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ChassisNumber",
                table: "transport_vehicles",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "EngineNumber",
                table: "transport_vehicles",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "GpsDeviceId",
                table: "transport_vehicles",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "StartLocation",
                table: "transport_routes",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "PickupPoint",
                table: "transport_routes",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "EndLocation",
                table: "transport_routes",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "DropPoint",
                table: "transport_routes",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "transport_routes",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "EmergencyContactNumber",
                table: "transport_drivers",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "EmergencyContactName",
                table: "transport_drivers",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "BloodGroup",
                table: "transport_drivers",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "AlternateMobileNumber",
                table: "transport_drivers",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "Address",
                table: "transport_drivers",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddPrimaryKey(
                name: "PK_transport_vehicle_maintenance",
                table: "transport_vehicle_maintenance",
                column: "maintenance_id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_transport_vehicles",
                table: "transport_vehicles",
                column: "VehicleId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_transport_routes",
                table: "transport_routes",
                column: "RouteId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_transport_drivers",
                table: "transport_drivers",
                column: "DriverId");

            migrationBuilder.CreateTable(
                name: "admissions",
                columns: table => new
                {
                    admission_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    application_no = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    student_name = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    dob = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    gender = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    father_name = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    father_mobile = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    blood_group = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    caste = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    branch_id = table.Column<long>(type: "bigint", nullable: false),
                    class_id = table.Column<long>(type: "bigint", nullable: false),
                    admission_type = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    is_deleted = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    created_date = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    modified_by = table.Column<long>(type: "bigint", nullable: true),
                    modified_date = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_admissions", x => x.admission_id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Departments",
                columns: table => new
                {
                    DepartmentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    DepartmentName = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DepartmentCode = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedDate = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Departments", x => x.DepartmentId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Subjects_DepartmentId",
                table: "Subjects",
                column: "DepartmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_student_transport_assignments_transport_pickup_points_Pickup~",
                table: "student_transport_assignments",
                column: "PickupPointId",
                principalTable: "transport_pickup_points",
                principalColumn: "PickupPointId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_student_transport_assignments_transport_routes_RouteId",
                table: "student_transport_assignments",
                column: "RouteId",
                principalTable: "transport_routes",
                principalColumn: "RouteId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Subjects_Departments_DepartmentId",
                table: "Subjects",
                column: "DepartmentId",
                principalTable: "Departments",
                principalColumn: "DepartmentId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_transport_drivers_transport_vehicles_AssignedVehicleId",
                table: "transport_drivers",
                column: "AssignedVehicleId",
                principalTable: "transport_vehicles",
                principalColumn: "VehicleId");

            migrationBuilder.AddForeignKey(
                name: "FK_transport_pickup_points_transport_routes_RouteId",
                table: "transport_pickup_points",
                column: "RouteId",
                principalTable: "transport_routes",
                principalColumn: "RouteId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_transport_routes_transport_vehicles_VehicleId",
                table: "transport_routes",
                column: "VehicleId",
                principalTable: "transport_vehicles",
                principalColumn: "VehicleId");

            migrationBuilder.AddForeignKey(
                name: "FK_transport_vehicle_assignments_transport_drivers_DriverId",
                table: "transport_vehicle_assignments",
                column: "DriverId",
                principalTable: "transport_drivers",
                principalColumn: "DriverId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_transport_vehicle_assignments_transport_routes_RouteId",
                table: "transport_vehicle_assignments",
                column: "RouteId",
                principalTable: "transport_routes",
                principalColumn: "RouteId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_transport_vehicle_assignments_transport_vehicles_VehicleId",
                table: "transport_vehicle_assignments",
                column: "VehicleId",
                principalTable: "transport_vehicles",
                principalColumn: "VehicleId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_transport_vehicle_maintenance_transport_vehicles_vehicle_id",
                table: "transport_vehicle_maintenance",
                column: "vehicle_id",
                principalTable: "transport_vehicles",
                principalColumn: "VehicleId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_student_transport_assignments_transport_pickup_points_Pickup~",
                table: "student_transport_assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_student_transport_assignments_transport_routes_RouteId",
                table: "student_transport_assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_Subjects_Departments_DepartmentId",
                table: "Subjects");

            migrationBuilder.DropForeignKey(
                name: "FK_transport_drivers_transport_vehicles_AssignedVehicleId",
                table: "transport_drivers");

            migrationBuilder.DropForeignKey(
                name: "FK_transport_pickup_points_transport_routes_RouteId",
                table: "transport_pickup_points");

            migrationBuilder.DropForeignKey(
                name: "FK_transport_routes_transport_vehicles_VehicleId",
                table: "transport_routes");

            migrationBuilder.DropForeignKey(
                name: "FK_transport_vehicle_assignments_transport_drivers_DriverId",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_transport_vehicle_assignments_transport_routes_RouteId",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_transport_vehicle_assignments_transport_vehicles_VehicleId",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_transport_vehicle_maintenance_transport_vehicles_vehicle_id",
                table: "transport_vehicle_maintenance");

            migrationBuilder.DropTable(
                name: "admissions");

            migrationBuilder.DropTable(
                name: "Departments");

            migrationBuilder.DropIndex(
                name: "IX_Subjects_DepartmentId",
                table: "Subjects");

            migrationBuilder.DropPrimaryKey(
                name: "PK_transport_vehicles",
                table: "transport_vehicles");

            migrationBuilder.DropPrimaryKey(
                name: "PK_transport_vehicle_maintenance",
                table: "transport_vehicle_maintenance");

            migrationBuilder.DropPrimaryKey(
                name: "PK_transport_routes",
                table: "transport_routes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_transport_drivers",
                table: "transport_drivers");

            migrationBuilder.DropColumn(
                name: "DepartmentId",
                table: "Subjects");

            migrationBuilder.DropColumn(
                name: "ChassisNumber",
                table: "transport_vehicles");

            migrationBuilder.DropColumn(
                name: "EngineNumber",
                table: "transport_vehicles");

            migrationBuilder.DropColumn(
                name: "GpsDeviceId",
                table: "transport_vehicles");

            migrationBuilder.RenameTable(
                name: "transport_vehicles",
                newName: "TransportVehicles");

            migrationBuilder.RenameTable(
                name: "transport_vehicle_maintenance",
                newName: "VehicleMaintenances");

            migrationBuilder.RenameTable(
                name: "transport_routes",
                newName: "TransportRoutes");

            migrationBuilder.RenameTable(
                name: "transport_drivers",
                newName: "TransportDrivers");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "transport_vehicle_assignments",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Remarks",
                table: "transport_vehicle_assignments",
                newName: "remarks");

            migrationBuilder.RenameColumn(
                name: "VehicleId",
                table: "transport_vehicle_assignments",
                newName: "vehicle_id");

            migrationBuilder.RenameColumn(
                name: "RouteId",
                table: "transport_vehicle_assignments",
                newName: "route_id");

            migrationBuilder.RenameColumn(
                name: "IsDeleted",
                table: "transport_vehicle_assignments",
                newName: "is_deleted");

            migrationBuilder.RenameColumn(
                name: "EffectiveTo",
                table: "transport_vehicle_assignments",
                newName: "effective_to");

            migrationBuilder.RenameColumn(
                name: "EffectiveFrom",
                table: "transport_vehicle_assignments",
                newName: "effective_from");

            migrationBuilder.RenameColumn(
                name: "DriverId",
                table: "transport_vehicle_assignments",
                newName: "driver_id");

            migrationBuilder.RenameColumn(
                name: "AssignmentId",
                table: "transport_vehicle_assignments",
                newName: "assignment_id");

            migrationBuilder.RenameIndex(
                name: "IX_transport_vehicle_assignments_VehicleId",
                table: "transport_vehicle_assignments",
                newName: "IX_transport_vehicle_assignments_vehicle_id");

            migrationBuilder.RenameIndex(
                name: "IX_transport_vehicle_assignments_RouteId",
                table: "transport_vehicle_assignments",
                newName: "IX_transport_vehicle_assignments_route_id");

            migrationBuilder.RenameIndex(
                name: "IX_transport_vehicle_assignments_DriverId",
                table: "transport_vehicle_assignments",
                newName: "IX_transport_vehicle_assignments_driver_id");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "transport_pickup_points",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Landmark",
                table: "transport_pickup_points",
                newName: "landmark");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "transport_pickup_points",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "SequenceNo",
                table: "transport_pickup_points",
                newName: "sequence_no");

            migrationBuilder.RenameColumn(
                name: "RouteId",
                table: "transport_pickup_points",
                newName: "route_id");

            migrationBuilder.RenameColumn(
                name: "PickupTime",
                table: "transport_pickup_points",
                newName: "pickup_time");

            migrationBuilder.RenameColumn(
                name: "PickupPointName",
                table: "transport_pickup_points",
                newName: "pickup_point_name");

            migrationBuilder.RenameColumn(
                name: "IsDeleted",
                table: "transport_pickup_points",
                newName: "is_deleted");

            migrationBuilder.RenameColumn(
                name: "DistanceFromStart",
                table: "transport_pickup_points",
                newName: "distance_from_start");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "transport_pickup_points",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "PickupPointId",
                table: "transport_pickup_points",
                newName: "pickup_point_id");

            migrationBuilder.RenameIndex(
                name: "IX_transport_pickup_points_RouteId",
                table: "transport_pickup_points",
                newName: "IX_transport_pickup_points_route_id");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "student_transport_assignments",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Remarks",
                table: "student_transport_assignments",
                newName: "remarks");

            migrationBuilder.RenameColumn(
                name: "VehicleAssignmentId",
                table: "student_transport_assignments",
                newName: "vehicle_assignment_id");

            migrationBuilder.RenameColumn(
                name: "TransportType",
                table: "student_transport_assignments",
                newName: "transport_type");

            migrationBuilder.RenameColumn(
                name: "StudentId",
                table: "student_transport_assignments",
                newName: "student_id");

            migrationBuilder.RenameColumn(
                name: "RouteId",
                table: "student_transport_assignments",
                newName: "route_id");

            migrationBuilder.RenameColumn(
                name: "PickupPointId",
                table: "student_transport_assignments",
                newName: "pickup_point_id");

            migrationBuilder.RenameColumn(
                name: "IsDeleted",
                table: "student_transport_assignments",
                newName: "is_deleted");

            migrationBuilder.RenameColumn(
                name: "EffectiveTo",
                table: "student_transport_assignments",
                newName: "effective_to");

            migrationBuilder.RenameColumn(
                name: "EffectiveFrom",
                table: "student_transport_assignments",
                newName: "effective_from");

            migrationBuilder.RenameColumn(
                name: "StudentTransportAssignmentId",
                table: "student_transport_assignments",
                newName: "student_transport_assignment_id");

            migrationBuilder.RenameIndex(
                name: "IX_student_transport_assignments_VehicleAssignmentId",
                table: "student_transport_assignments",
                newName: "IX_student_transport_assignments_vehicle_assignment_id");

            migrationBuilder.RenameIndex(
                name: "IX_student_transport_assignments_RouteId",
                table: "student_transport_assignments",
                newName: "IX_student_transport_assignments_route_id");

            migrationBuilder.RenameIndex(
                name: "IX_student_transport_assignments_PickupPointId",
                table: "student_transport_assignments",
                newName: "IX_student_transport_assignments_pickup_point_id");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "VehicleMaintenances",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "remarks",
                table: "VehicleMaintenances",
                newName: "Remarks");

            migrationBuilder.RenameColumn(
                name: "cost",
                table: "VehicleMaintenances",
                newName: "Cost");

            migrationBuilder.RenameColumn(
                name: "vendor_center",
                table: "VehicleMaintenances",
                newName: "VendorCenter");

            migrationBuilder.RenameColumn(
                name: "vehicle_id",
                table: "VehicleMaintenances",
                newName: "VehicleId");

            migrationBuilder.RenameColumn(
                name: "updated_by",
                table: "VehicleMaintenances",
                newName: "UpdatedBy");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "VehicleMaintenances",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "service_type",
                table: "VehicleMaintenances",
                newName: "ServiceType");

            migrationBuilder.RenameColumn(
                name: "service_date",
                table: "VehicleMaintenances",
                newName: "ServiceDate");

            migrationBuilder.RenameColumn(
                name: "next_service_due",
                table: "VehicleMaintenances",
                newName: "NextServiceDue");

            migrationBuilder.RenameColumn(
                name: "is_deleted",
                table: "VehicleMaintenances",
                newName: "IsDeleted");

            migrationBuilder.RenameColumn(
                name: "created_by",
                table: "VehicleMaintenances",
                newName: "CreatedBy");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "VehicleMaintenances",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "maintenance_id",
                table: "VehicleMaintenances",
                newName: "MaintenanceId");

            migrationBuilder.RenameIndex(
                name: "IX_transport_vehicle_maintenance_vehicle_id",
                table: "VehicleMaintenances",
                newName: "IX_VehicleMaintenances_VehicleId");

            migrationBuilder.RenameIndex(
                name: "IX_transport_routes_VehicleId",
                table: "TransportRoutes",
                newName: "IX_TransportRoutes_VehicleId");

            migrationBuilder.RenameIndex(
                name: "IX_transport_drivers_AssignedVehicleId",
                table: "TransportDrivers",
                newName: "IX_TransportDrivers_AssignedVehicleId");

            migrationBuilder.AddColumn<DateTime>(
                name: "assignment_date",
                table: "transport_vehicle_assignments",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "created_at",
                table: "transport_vehicle_assignments",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<long>(
                name: "created_by",
                table: "transport_vehicle_assignments",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "shift",
                table: "transport_vehicle_assignments",
                type: "varchar(20)",
                maxLength: 20,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "updated_at",
                table: "transport_vehicle_assignments",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "updated_by",
                table: "transport_vehicle_assignments",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "created_by",
                table: "transport_pickup_points",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "updated_by",
                table: "transport_pickup_points",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "created_at",
                table: "student_transport_assignments",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<long>(
                name: "created_by",
                table: "student_transport_assignments",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "updated_at",
                table: "student_transport_assignments",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "updated_by",
                table: "student_transport_assignments",
                type: "bigint",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "TransportVehicles",
                keyColumn: "VehicleType",
                keyValue: null,
                column: "VehicleType",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "VehicleType",
                table: "TransportVehicles",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "TransportVehicles",
                keyColumn: "VehicleName",
                keyValue: null,
                column: "VehicleName",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "VehicleName",
                table: "TransportVehicles",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "TransportVehicles",
                keyColumn: "Model",
                keyValue: null,
                column: "Model",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "Model",
                table: "TransportVehicles",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "TransportVehicles",
                keyColumn: "Manufacturer",
                keyValue: null,
                column: "Manufacturer",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "Manufacturer",
                table: "TransportVehicles",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "TransportVehicles",
                keyColumn: "InsuranceNumber",
                keyValue: null,
                column: "InsuranceNumber",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "InsuranceNumber",
                table: "TransportVehicles",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "TransportRoutes",
                keyColumn: "StartLocation",
                keyValue: null,
                column: "StartLocation",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "StartLocation",
                table: "TransportRoutes",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "TransportRoutes",
                keyColumn: "PickupPoint",
                keyValue: null,
                column: "PickupPoint",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "PickupPoint",
                table: "TransportRoutes",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "TransportRoutes",
                keyColumn: "EndLocation",
                keyValue: null,
                column: "EndLocation",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "EndLocation",
                table: "TransportRoutes",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "TransportRoutes",
                keyColumn: "DropPoint",
                keyValue: null,
                column: "DropPoint",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "DropPoint",
                table: "TransportRoutes",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "TransportRoutes",
                keyColumn: "Description",
                keyValue: null,
                column: "Description",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "TransportRoutes",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "TransportDrivers",
                keyColumn: "EmergencyContactNumber",
                keyValue: null,
                column: "EmergencyContactNumber",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "EmergencyContactNumber",
                table: "TransportDrivers",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "TransportDrivers",
                keyColumn: "EmergencyContactName",
                keyValue: null,
                column: "EmergencyContactName",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "EmergencyContactName",
                table: "TransportDrivers",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "TransportDrivers",
                keyColumn: "BloodGroup",
                keyValue: null,
                column: "BloodGroup",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "BloodGroup",
                table: "TransportDrivers",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "TransportDrivers",
                keyColumn: "AlternateMobileNumber",
                keyValue: null,
                column: "AlternateMobileNumber",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "AlternateMobileNumber",
                table: "TransportDrivers",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "TransportDrivers",
                keyColumn: "Address",
                keyValue: null,
                column: "Address",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "Address",
                table: "TransportDrivers",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "LicenseNumber",
                table: "TransportDrivers",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "TransportDrivers",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddPrimaryKey(
                name: "PK_TransportVehicles",
                table: "TransportVehicles",
                column: "VehicleId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_VehicleMaintenances",
                table: "VehicleMaintenances",
                column: "MaintenanceId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_TransportRoutes",
                table: "TransportRoutes",
                column: "RouteId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_TransportDrivers",
                table: "TransportDrivers",
                column: "DriverId");

            migrationBuilder.AddForeignKey(
                name: "FK_student_transport_assignments_TransportRoutes_route_id",
                table: "student_transport_assignments",
                column: "route_id",
                principalTable: "TransportRoutes",
                principalColumn: "RouteId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_student_transport_assignments_transport_pickup_points_pickup~",
                table: "student_transport_assignments",
                column: "pickup_point_id",
                principalTable: "transport_pickup_points",
                principalColumn: "pickup_point_id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_transport_pickup_points_TransportRoutes_route_id",
                table: "transport_pickup_points",
                column: "route_id",
                principalTable: "TransportRoutes",
                principalColumn: "RouteId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_transport_vehicle_assignments_TransportDrivers_driver_id",
                table: "transport_vehicle_assignments",
                column: "driver_id",
                principalTable: "TransportDrivers",
                principalColumn: "DriverId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_transport_vehicle_assignments_TransportRoutes_route_id",
                table: "transport_vehicle_assignments",
                column: "route_id",
                principalTable: "TransportRoutes",
                principalColumn: "RouteId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_transport_vehicle_assignments_TransportVehicles_vehicle_id",
                table: "transport_vehicle_assignments",
                column: "vehicle_id",
                principalTable: "TransportVehicles",
                principalColumn: "VehicleId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TransportDrivers_TransportVehicles_AssignedVehicleId",
                table: "TransportDrivers",
                column: "AssignedVehicleId",
                principalTable: "TransportVehicles",
                principalColumn: "VehicleId");

            migrationBuilder.AddForeignKey(
                name: "FK_TransportRoutes_TransportVehicles_VehicleId",
                table: "TransportRoutes",
                column: "VehicleId",
                principalTable: "TransportVehicles",
                principalColumn: "VehicleId");

            migrationBuilder.AddForeignKey(
                name: "FK_VehicleMaintenances_TransportVehicles_VehicleId",
                table: "VehicleMaintenances",
                column: "VehicleId",
                principalTable: "TransportVehicles",
                principalColumn: "VehicleId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
