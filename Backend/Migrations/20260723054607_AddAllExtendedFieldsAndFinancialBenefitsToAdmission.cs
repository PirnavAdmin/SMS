using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAllExtendedFieldsAndFinancialBenefitsToAdmission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AlternateMobileNumber",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Discount",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "HostelRoom",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "MotherMobileNumber",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ParentEmail",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ProfilePhotoUrl",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Scholarship",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AlternateMobileNumber",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "Discount",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "HostelRoom",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "MotherMobileNumber",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "ParentEmail",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "ProfilePhotoUrl",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "Scholarship",
                table: "AdmissionApplications");
        }
    }
}
