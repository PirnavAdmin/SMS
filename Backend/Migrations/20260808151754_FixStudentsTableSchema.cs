using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class FixStudentsTableSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Drop existing FKs on students if any to allow alters
DROP PROCEDURE IF EXISTS DropFKs;
CREATE PROCEDURE DropFKs()
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    ALTER TABLE students DROP FOREIGN KEY FK_students_classes_class_id;
    ALTER TABLE students DROP FOREIGN KEY FK_students_class_sections_section_id;
    ALTER TABLE students DROP FOREIGN KEY FK_students_branches_branch_id;
    ALTER TABLE students DROP FOREIGN KEY FK_students_academic_years_academic_year_id;
END;
CALL DropFKs();
DROP PROCEDURE IF EXISTS DropFKs;

-- 2. Modify and Rename columns
ALTER TABLE students MODIFY COLUMN admission_id INT NOT NULL AUTO_INCREMENT;
ALTER TABLE students CHANGE COLUMN admission_id student_id INT NOT NULL AUTO_INCREMENT;
ALTER TABLE students CHANGE COLUMN dob date_of_birth DATE NULL;
ALTER TABLE students CHANGE COLUMN roll_no roll_number VARCHAR(30) NOT NULL DEFAULT '';
ALTER TABLE students CHANGE COLUMN application_no admission_number VARCHAR(50) NOT NULL DEFAULT '';
ALTER TABLE students CHANGE COLUMN created_date created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE students CHANGE COLUMN modified_date updated_at DATETIME NULL;

-- 3. Add missing columns safely
DROP PROCEDURE IF EXISTS AddCols;
CREATE PROCEDURE AddCols()
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    ALTER TABLE students ADD COLUMN mother_name VARCHAR(150) NULL;
    ALTER TABLE students ADD COLUMN mother_mobile VARCHAR(20) NULL;
    ALTER TABLE students ADD COLUMN email VARCHAR(150) NULL;
    ALTER TABLE students ADD COLUMN mobile_number VARCHAR(20) NULL;
    ALTER TABLE students ADD COLUMN address VARCHAR(500) NULL;
    ALTER TABLE students ADD COLUMN academic_year_id INT NOT NULL DEFAULT 1;
    ALTER TABLE students ADD COLUMN section_id INT NOT NULL DEFAULT 1;
END;
CALL AddCols();
DROP PROCEDURE IF EXISTS AddCols;

-- 4. Recreate foreign keys
ALTER TABLE students ADD CONSTRAINT FK_students_branches_branch_id FOREIGN KEY (branch_id) REFERENCES branches (BranchId) ON DELETE RESTRICT;
ALTER TABLE students ADD CONSTRAINT FK_students_classes_class_id FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE RESTRICT;
ALTER TABLE students ADD CONSTRAINT FK_students_class_sections_section_id FOREIGN KEY (section_id) REFERENCES class_sections (id) ON DELETE RESTRICT;
ALTER TABLE students ADD CONSTRAINT FK_students_academic_years_academic_year_id FOREIGN KEY (academic_year_id) REFERENCES academic_years (AcademicYearId) ON DELETE RESTRICT;

SET FOREIGN_KEY_CHECKS = 1;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
