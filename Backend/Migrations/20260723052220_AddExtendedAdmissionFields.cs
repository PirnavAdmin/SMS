using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddExtendedAdmissionFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AreaLocality",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "AvailableBed",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "BusRoute",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "District",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "DropPoint",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ExistingSiblingLookup",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "FloorLevel",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "HostelBlock",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "HouseNo",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "MotherName",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "NumberOfSiblings",
                table: "AdmissionApplications",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "PickupPoint",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "PinCode",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Religion",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "State",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Street",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<bool>(
                name: "TransportRequired",
                table: "AdmissionApplications",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TransportType",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AreaLocality",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "AvailableBed",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "BusRoute",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "City",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "District",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "DropPoint",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "ExistingSiblingLookup",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "FloorLevel",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "HostelBlock",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "HouseNo",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "MotherName",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "NumberOfSiblings",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "PickupPoint",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "PinCode",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "Religion",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "State",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "Street",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "TransportRequired",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "TransportType",
                table: "AdmissionApplications");
        }
    }
}
