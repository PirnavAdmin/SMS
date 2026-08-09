using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentUniformDistributionExtraFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CategoryName",
                table: "uniform_types",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "MinThreshold",
                table: "uniform_types",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "OpeningStock",
                table: "uniform_types",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ReorderPoint",
                table: "uniform_types",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "GstNumber",
                table: "uniform_suppliers",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ClassName",
                table: "student_uniform_distributions",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "student_uniform_distributions",
                type: "varchar(255)",
                maxLength: 255,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "SizeSpec",
                table: "student_uniform_distributions",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "TransactionType",
                table: "student_uniform_distributions",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CategoryName",
                table: "uniform_types");

            migrationBuilder.DropColumn(
                name: "MinThreshold",
                table: "uniform_types");

            migrationBuilder.DropColumn(
                name: "OpeningStock",
                table: "uniform_types");

            migrationBuilder.DropColumn(
                name: "ReorderPoint",
                table: "uniform_types");

            migrationBuilder.DropColumn(
                name: "GstNumber",
                table: "uniform_suppliers");

            migrationBuilder.DropColumn(
                name: "ClassName",
                table: "student_uniform_distributions");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "student_uniform_distributions");

            migrationBuilder.DropColumn(
                name: "SizeSpec",
                table: "student_uniform_distributions");

            migrationBuilder.DropColumn(
                name: "TransactionType",
                table: "student_uniform_distributions");
        }
    }
}
