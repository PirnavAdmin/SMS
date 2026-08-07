using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    public partial class AddStudentManagement : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The previous failed attempt already completed:
            // 1. Student columns and primary key
            // 2. All Student indexes
            // 3. Academic-year foreign key
            //
            // Only these three foreign keys remain.

            migrationBuilder.AddForeignKey(
                name: "FK_students_branches_branch_id",
                table: "students",
                column: "branch_id",
                principalTable: "branches",
                principalColumn: "BranchId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_students_classes_class_id",
                table: "students",
                column: "class_id",
                principalTable: "classes",
                principalColumn: "ClassId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_students_class_sections_section_id",
                table: "students",
                column: "section_id",
                principalTable: "class_sections",
                principalColumn: "SectionId",
                onDelete: ReferentialAction.Restrict);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_students_academic_years_academic_year_id",
                table: "students");

            migrationBuilder.DropForeignKey(
                name: "FK_students_branches_branch_id",
                table: "students");

            migrationBuilder.DropForeignKey(
                name: "FK_students_classes_class_id",
                table: "students");

            migrationBuilder.DropForeignKey(
                name: "FK_students_class_sections_section_id",
                table: "students");

            migrationBuilder.DropIndex(
                name: "IX_students_academic_year_id",
                table: "students");

            migrationBuilder.DropIndex(
                name: "IX_students_branch_id",
                table: "students");

            migrationBuilder.DropIndex(
                name: "IX_students_class_id",
                table: "students");

            migrationBuilder.DropIndex(
                name: "IX_students_section_id",
                table: "students");

            migrationBuilder.DropIndex(
                name: "ix_students_management_filter",
                table: "students");

            migrationBuilder.DropIndex(
                name: "ux_students_admission_number",
                table: "students");

            migrationBuilder.DropIndex(
                name: "ux_students_year_class_section_roll",
                table: "students");

            migrationBuilder.Sql("""
                ALTER TABLE `students`
                    DROP COLUMN `updated_at`,
                    DROP COLUMN `created_at`,
                    DROP COLUMN `section_id`,
                    DROP COLUMN `academic_year_id`,
                    DROP COLUMN `address`,
                    DROP COLUMN `mobile_number`,
                    DROP COLUMN `email`,
                    DROP COLUMN `mother_mobile`,
                    DROP COLUMN `mother_name`,
                    DROP COLUMN `date_of_birth`,
                    DROP COLUMN `roll_number`,
                    DROP COLUMN `admission_number`,
                    DROP PRIMARY KEY,
                    DROP COLUMN `student_id`;
                """);

            migrationBuilder.DropTable(
                name: "academic_years");
        }
    }
}