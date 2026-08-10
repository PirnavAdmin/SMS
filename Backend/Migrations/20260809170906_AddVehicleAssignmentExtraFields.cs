using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddVehicleAssignmentExtraFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AcademicYear",
                table: "transport_vehicle_assignments",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "BranchName",
                table: "transport_vehicle_assignments",
                type: "varchar(150)",
                maxLength: 150,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "EveningTripTime",
                table: "transport_vehicle_assignments",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "MorningTripTime",
                table: "transport_vehicle_assignments",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AcademicYear",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropColumn(
                name: "BranchName",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropColumn(
                name: "EveningTripTime",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropColumn(
                name: "MorningTripTime",
                table: "transport_vehicle_assignments");
        }
    }
}
