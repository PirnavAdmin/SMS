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
            migrationBuilder.Sql(@"
DROP PROCEDURE IF EXISTS AddMissingColumnsSafely;
CREATE PROCEDURE AddMissingColumnsSafely()
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    ALTER TABLE salary_structures ADD COLUMN PayrollFrequency varchar(50) NOT NULL DEFAULT 'Monthly';
    ALTER TABLE salary_structures ADD COLUMN SalaryPaymentDay varchar(50) NOT NULL DEFAULT '5';
    ALTER TABLE salary_structures ADD COLUMN PfApplicable tinyint(1) NOT NULL DEFAULT 0;
    ALTER TABLE salary_structures ADD COLUMN PfPercentage decimal(5,2) NOT NULL DEFAULT 0.00;
    ALTER TABLE salary_structures ADD COLUMN EsiApplicable tinyint(1) NOT NULL DEFAULT 0;
    ALTER TABLE salary_structures ADD COLUMN EsiPercentage decimal(5,2) NOT NULL DEFAULT 0.00;
    ALTER TABLE salary_structures ADD COLUMN ProfessionalTaxApplicable tinyint(1) NOT NULL DEFAULT 0;
    ALTER TABLE salary_structures ADD COLUMN ProfessionalTaxAmount decimal(18,2) NOT NULL DEFAULT 0.00;
    ALTER TABLE salary_structures ADD COLUMN RoundOffRule varchar(50) NOT NULL DEFAULT 'No Round Off';
END;
CALL AddMissingColumnsSafely();
DROP PROCEDURE IF EXISTS AddMissingColumnsSafely;
");
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