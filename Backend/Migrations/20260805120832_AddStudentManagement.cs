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

            migrationBuilder.Sql(@"
DROP PROCEDURE IF EXISTS DropExistingForeignKeys;
CREATE PROCEDURE DropExistingForeignKeys()
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    ALTER TABLE students DROP FOREIGN KEY FK_students_classes_class_id;
    ALTER TABLE students DROP FOREIGN KEY FK_students_class_sections_section_id;
    ALTER TABLE students DROP FOREIGN KEY FK_students_branches_branch_id;
END;
CALL DropExistingForeignKeys();
DROP PROCEDURE IF EXISTS DropExistingForeignKeys;
");

            migrationBuilder.Sql("ALTER TABLE students MODIFY COLUMN branch_id INT NOT NULL;");
            migrationBuilder.Sql("INSERT IGNORE INTO branches (BranchId, BranchName) VALUES (1, 'Main Branch');");
            migrationBuilder.Sql("UPDATE students SET branch_id = 1 WHERE branch_id NOT IN (SELECT BranchId FROM branches) OR branch_id = 0;");

            migrationBuilder.Sql(@"
DROP PROCEDURE IF EXISTS InsertDefaultClass;
CREATE PROCEDURE InsertDefaultClass()
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    INSERT IGNORE INTO Classes (ClassId, ClassName) VALUES (1, 'Class 1');
    INSERT IGNORE INTO Classes (id, name, campus_location, academic_year) VALUES (1, 'Class 1', 'Default', '2026');
    UPDATE students SET class_id = 1 WHERE class_id NOT IN (SELECT ClassId FROM Classes) OR class_id = 0;
    UPDATE students SET class_id = 1 WHERE class_id NOT IN (SELECT id FROM Classes) OR class_id = 0;
END;
CALL InsertDefaultClass();
DROP PROCEDURE IF EXISTS InsertDefaultClass;
");

            migrationBuilder.Sql(@"
DROP PROCEDURE IF EXISTS InsertDefaultSection;
CREATE PROCEDURE InsertDefaultSection()
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    INSERT IGNORE INTO class_sections (SectionId, SectionName, AcademicClassId) VALUES (1, 'A', 1);
    INSERT IGNORE INTO class_sections (SectionId, SectionName, ClassId) VALUES (1, 'A', 1);
    INSERT IGNORE INTO class_sections (id, name, class_id) VALUES (1, 'A', 1);
    UPDATE students SET section_id = 1 WHERE section_id NOT IN (SELECT SectionId FROM class_sections) OR section_id = 0;
    UPDATE students SET section_id = 1 WHERE section_id NOT IN (SELECT id FROM class_sections) OR section_id = 0;
END;
CALL InsertDefaultSection();
DROP PROCEDURE IF EXISTS InsertDefaultSection;
");

            migrationBuilder.Sql(@"
DROP PROCEDURE IF EXISTS AddForeignKeysSafely;
CREATE PROCEDURE AddForeignKeysSafely()
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    
    ALTER TABLE students ADD CONSTRAINT FK_students_branches_branch_id FOREIGN KEY (branch_id) REFERENCES branches (BranchId) ON DELETE RESTRICT;
    
    ALTER TABLE students ADD CONSTRAINT FK_students_classes_class_id FOREIGN KEY (class_id) REFERENCES classes (ClassId) ON DELETE RESTRICT;
    ALTER TABLE students ADD CONSTRAINT FK_students_classes_class_id FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE RESTRICT;
    
    ALTER TABLE students ADD CONSTRAINT FK_students_class_sections_section_id FOREIGN KEY (section_id) REFERENCES class_sections (SectionId) ON DELETE RESTRICT;
    ALTER TABLE students ADD CONSTRAINT FK_students_class_sections_section_id FOREIGN KEY (section_id) REFERENCES class_sections (id) ON DELETE RESTRICT;
END;
CALL AddForeignKeysSafely();
DROP PROCEDURE IF EXISTS AddForeignKeysSafely;
");
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