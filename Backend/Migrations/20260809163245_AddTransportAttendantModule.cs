using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddTransportAttendantModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "transport_attendants",
                columns: table => new
                {
                    AttendantId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    AttendantName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MobileNumber = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AlternateMobileNumber = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Address = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BloodGroup = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EmergencyContactName = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EmergencyContactNumber = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AssignedVehicleId = table.Column<long>(type: "bigint", nullable: true),
                    Status = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    IsDeleted = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    CreatedBy = table.Column<long>(type: "bigint", nullable: true),
                    UpdatedBy = table.Column<long>(type: "bigint", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transport_attendants", x => x.AttendantId);
                    table.ForeignKey(
                        name: "FK_transport_attendants_transport_vehicles_AssignedVehicleId",
                        column: x => x.AssignedVehicleId,
                        principalTable: "transport_vehicles",
                        principalColumn: "VehicleId");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<long>(
                name: "AttendantId",
                table: "transport_vehicle_assignments",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_transport_vehicle_assignments_AttendantId",
                table: "transport_vehicle_assignments",
                column: "AttendantId");

            migrationBuilder.CreateIndex(
                name: "IX_transport_attendants_AssignedVehicleId",
                table: "transport_attendants",
                column: "AssignedVehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_transport_attendants_MobileNumber",
                table: "transport_attendants",
                column: "MobileNumber");

            migrationBuilder.AddForeignKey(
                name: "FK_transport_vehicle_assignments_transport_attendants_AttendantId",
                table: "transport_vehicle_assignments",
                column: "AttendantId",
                principalTable: "transport_attendants",
                principalColumn: "AttendantId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_transport_vehicle_assignments_transport_attendants_AttendantId",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropTable(
                name: "transport_attendants");

            migrationBuilder.DropIndex(
                name: "IX_transport_vehicle_assignments_AttendantId",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropColumn(
                name: "AttendantId",
                table: "transport_vehicle_assignments");
        }
    }
}
