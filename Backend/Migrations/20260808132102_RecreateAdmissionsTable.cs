using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class RecreateAdmissionsTable : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS admissions (
    admission_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_no VARCHAR(255) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    dob DATETIME NULL,
    gender VARCHAR(50) NULL,
    father_name VARCHAR(255) NULL,
    father_mobile VARCHAR(50) NULL,
    blood_group VARCHAR(50) NULL,
    caste VARCHAR(50) NULL,
    branch_id BIGINT NOT NULL DEFAULT 1,
    class_id INT NULL,
    section_letter VARCHAR(50) NULL,
    roll_no VARCHAR(50) NULL,
    admission_type VARCHAR(100) NULL DEFAULT 'Regular',
    status VARCHAR(100) NOT NULL DEFAULT 'Pending',
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    created_by BIGINT NULL,
    created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by BIGINT NULL,
    modified_date DATETIME NULL
);
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "admissions");
        }
    }
}
