using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SMS.Api.Data;

#nullable disable

namespace Backend.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260806123000_AddMissingSalaryStructureColumns")]
    public partial class AddMissingSalaryStructureColumns : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PayrollFrequency",
                table: "salary_structures",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Monthly");

            migrationBuilder.AddColumn<string>(
                name: "SalaryPaymentDay",
                table: "salary_structures",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "5");

            migrationBuilder.AddColumn<bool>(
                name: "PfApplicable",
                table: "salary_structures",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "PfPercentage",
                table: "salary_structures",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "EsiApplicable",
                table: "salary_structures",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "EsiPercentage",
                table: "salary_structures",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "ProfessionalTaxApplicable",
                table: "salary_structures",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "ProfessionalTaxAmount",
                table: "salary_structures",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "RoundOffRule",
                table: "salary_structures",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "No Round Off");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "PayrollFrequency", table: "salary_structures");
            migrationBuilder.DropColumn(name: "SalaryPaymentDay", table: "salary_structures");
            migrationBuilder.DropColumn(name: "PfApplicable", table: "salary_structures");
            migrationBuilder.DropColumn(name: "PfPercentage", table: "salary_structures");
            migrationBuilder.DropColumn(name: "EsiApplicable", table: "salary_structures");
            migrationBuilder.DropColumn(name: "EsiPercentage", table: "salary_structures");
            migrationBuilder.DropColumn(name: "ProfessionalTaxApplicable", table: "salary_structures");
            migrationBuilder.DropColumn(name: "ProfessionalTaxAmount", table: "salary_structures");
            migrationBuilder.DropColumn(name: "RoundOffRule", table: "salary_structures");
        }
    }
}