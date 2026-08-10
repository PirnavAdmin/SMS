using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAcademicManagementProperties : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DROP PROCEDURE IF EXISTS AddAcademicManagementPropertiesSafely;
CREATE PROCEDURE AddAcademicManagementPropertiesSafely()
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    
    -- Drop constraints from Admin
    ALTER TABLE Admin DROP FOREIGN KEY FK_Admin_schools_SchoolId;
    ALTER TABLE admin_roles_junction DROP FOREIGN KEY FK_admin_roles_junction_Admin_AdminId;
    ALTER TABLE otp_verifications DROP FOREIGN KEY FK_otp_verifications_Admin_AdminId;
    ALTER TABLE classes DROP INDEX IX_classes_name_campus_location_academic_year;
    ALTER TABLE Admin DROP KEY AK_Admin_TempId;
    ALTER TABLE Admin DROP KEY AK_Admin_TempId1;
    ALTER TABLE Admin DROP COLUMN TempId;
    
    -- Rename table Admin to admins
    RENAME TABLE Admin TO admins;
    
    -- Create admins table if neither Admin nor admins exists
    CREATE TABLE IF NOT EXISTS admins (
        AdminId INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        FullName LONGTEXT NOT NULL,
        MobileNumber VARCHAR(255) NOT NULL,
        PasswordHash LONGTEXT NOT NULL,
        Role LONGTEXT NOT NULL,
        CreatedAt DATETIME(6) NOT NULL,
        IsEmailVerified TINYINT(1) NOT NULL DEFAULT 0,
        IsMobileVerified TINYINT(1) NOT NULL DEFAULT 0,
        Email LONGTEXT NULL,
        SchoolId INT NULL
    ) CHARACTER SET=utf8mb4;
    
    -- Rename column TempId1 to AdminId
    ALTER TABLE admins RENAME COLUMN TempId1 TO AdminId;
    
    -- Alter AdminId in admins
    ALTER TABLE admins MODIFY COLUMN AdminId INT NOT NULL AUTO_INCREMENT;
    
    -- Add columns to admins (if they don't exist)
    ALTER TABLE admins ADD COLUMN CreatedAt DATETIME(6) NOT NULL;
    ALTER TABLE admins ADD COLUMN Email LONGTEXT NULL;
    ALTER TABLE admins ADD COLUMN FullName LONGTEXT NOT NULL;
    ALTER TABLE admins ADD COLUMN IsEmailVerified TINYINT(1) NOT NULL DEFAULT 0;
    ALTER TABLE admins ADD COLUMN IsMobileVerified TINYINT(1) NOT NULL DEFAULT 0;
    ALTER TABLE admins ADD COLUMN MobileNumber VARCHAR(255) NOT NULL;
    ALTER TABLE admins ADD COLUMN PasswordHash LONGTEXT NOT NULL;
    ALTER TABLE admins ADD COLUMN Role LONGTEXT NOT NULL;
    ALTER TABLE admins ADD COLUMN SchoolId INT NULL;
    
    -- Rename class_sections columns
    ALTER TABLE class_sections RENAME COLUMN SectionName TO section_letter;
    ALTER TABLE class_sections RENAME INDEX IX_class_sections_class_id_SectionName TO IX_class_sections_class_id_section_letter;
    
    -- Alter columns in classes/class_sections
    ALTER TABLE classes MODIFY COLUMN name VARCHAR(100) NOT NULL;
    ALTER TABLE class_sections MODIFY COLUMN section_letter VARCHAR(50) NOT NULL;
    
    -- Add missing columns to classes (academic management properties)
    ALTER TABLE classes ADD COLUMN campus_location VARCHAR(150) NOT NULL DEFAULT 'Main Campus';
    ALTER TABLE classes ADD COLUMN academic_year VARCHAR(50) NOT NULL DEFAULT '2026';
    ALTER TABLE classes ADD COLUMN display_order INT NULL;
    ALTER TABLE classes ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'Active';
    ALTER TABLE classes ADD COLUMN remarks TEXT NULL;
    ALTER TABLE classes ADD COLUMN created_at DATETIME NOT NULL DEFAULT '2026-08-08 00:00:00';
    ALTER TABLE classes ADD COLUMN updated_at DATETIME NULL;
    
    -- Create teacher_assignments table if it doesn't exist
    CREATE TABLE IF NOT EXISTS teacher_assignments (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        class_id INT NOT NULL,
        section_letter VARCHAR(50) NOT NULL,
        subject_id INT NOT NULL,
        teacher_id INT NOT NULL,
        role VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Active'
    ) CHARACTER SET=utf8mb4;
    
    -- Create teacher_attendance_corrections table if it doesn't exist
    CREATE TABLE IF NOT EXISTS teacher_attendance_corrections (
        CorrectionId INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        StaffId INT NOT NULL,
        AttendanceDate DATE NOT NULL,
        CurrentInTime VARCHAR(20) NULL,
        CurrentOutTime VARCHAR(20) NULL,
        RequestedInTime VARCHAR(20) NULL,
        RequestedOutTime VARCHAR(20) NULL,
        Reason VARCHAR(500) NOT NULL,
        Status VARCHAR(20) NOT NULL DEFAULT 'Pending',
        ApprovedRemarks VARCHAR(500) NULL,
        ApprovedBy INT NULL,
        ApprovedAt DATETIME(6) NULL,
        CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME NULL
    ) CHARACTER SET=utf8mb4;
    
    -- Create indexes and foreign keys
    CREATE UNIQUE INDEX IX_admins_MobileNumber ON admins (MobileNumber);
    CREATE INDEX IX_admins_SchoolId ON admins (SchoolId);
    CREATE INDEX IX_teacher_assignments_subject_id ON teacher_assignments (subject_id);
    CREATE INDEX IX_teacher_assignments_teacher_id ON teacher_assignments (teacher_id);
    CREATE INDEX ux_teacher_assignments_class_sec_role ON teacher_assignments (class_id, section_letter, role);
    CREATE INDEX ix_teacher_attendance_corrections_staff_date ON teacher_attendance_corrections (StaffId, AttendanceDate);
    
    ALTER TABLE admins ADD CONSTRAINT FK_admins_schools_SchoolId FOREIGN KEY (SchoolId) REFERENCES schools (SchoolId) ON DELETE SET NULL;
    ALTER TABLE admin_roles_junction ADD CONSTRAINT FK_admin_roles_junction_admins_AdminId FOREIGN KEY (AdminId) REFERENCES admins (AdminId) ON DELETE CASCADE;
    ALTER TABLE otp_verifications ADD CONSTRAINT FK_otp_verifications_admins_AdminId FOREIGN KEY (AdminId) REFERENCES admins (AdminId) ON DELETE CASCADE;
    
    ALTER TABLE teacher_assignments ADD CONSTRAINT FK_teacher_assignments_classes_class_id FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE;
    ALTER TABLE teacher_assignments ADD CONSTRAINT FK_teacher_assignments_staff_teacher_id FOREIGN KEY (teacher_id) REFERENCES staff (StaffId) ON DELETE RESTRICT;
    ALTER TABLE teacher_assignments ADD CONSTRAINT FK_teacher_assignments_subjects_subject_id FOREIGN KEY (subject_id) REFERENCES subjects (SubjectId) ON DELETE CASCADE;
    
    ALTER TABLE teacher_attendance_corrections ADD CONSTRAINT FK_teacher_attendance_corrections_staff_StaffId FOREIGN KEY (StaffId) REFERENCES staff (StaffId) ON DELETE RESTRICT;
    
    ALTER TABLE student_attendances ADD CONSTRAINT FK_student_attendances_students_StudentId FOREIGN KEY (StudentId) REFERENCES students (student_id) ON DELETE CASCADE;
END;
CALL AddAcademicManagementPropertiesSafely();
DROP PROCEDURE IF EXISTS AddAcademicManagementPropertiesSafely;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_admin_roles_junction_admins_AdminId",
                table: "admin_roles_junction");

            migrationBuilder.DropForeignKey(
                name: "FK_admins_schools_SchoolId",
                table: "admins");

            migrationBuilder.DropForeignKey(
                name: "FK_otp_verifications_admins_AdminId",
                table: "otp_verifications");

            migrationBuilder.DropForeignKey(
                name: "FK_student_attendances_students_StudentId",
                table: "student_attendances");

            migrationBuilder.DropTable(
                name: "teacher_assignments");

            migrationBuilder.DropTable(
                name: "teacher_attendance_corrections");

            migrationBuilder.DropPrimaryKey(
                name: "PK_admins",
                table: "admins");

            migrationBuilder.DropIndex(
                name: "IX_admins_MobileNumber",
                table: "admins");

            migrationBuilder.DropIndex(
                name: "IX_admins_SchoolId",
                table: "admins");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "admins");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "admins");

            migrationBuilder.DropColumn(
                name: "FullName",
                table: "admins");

            migrationBuilder.DropColumn(
                name: "IsEmailVerified",
                table: "admins");

            migrationBuilder.DropColumn(
                name: "IsMobileVerified",
                table: "admins");

            migrationBuilder.DropColumn(
                name: "MobileNumber",
                table: "admins");

            migrationBuilder.DropColumn(
                name: "PasswordHash",
                table: "admins");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "admins");

            migrationBuilder.RenameTable(
                name: "admins",
                newName: "Admin");

            migrationBuilder.RenameColumn(
                name: "section_letter",
                table: "class_sections",
                newName: "SectionName");

            migrationBuilder.RenameIndex(
                name: "IX_class_sections_class_id_section_letter",
                table: "class_sections",
                newName: "IX_class_sections_class_id_SectionName");

            migrationBuilder.RenameColumn(
                name: "AdminId",
                table: "Admin",
                newName: "TempId1");

            migrationBuilder.AlterColumn<string>(
                name: "name",
                table: "classes",
                type: "longtext",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(100)",
                oldMaxLength: 100)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "SectionName",
                table: "class_sections",
                type: "varchar(255)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(50)",
                oldMaxLength: 50)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<int>(
                name: "TempId1",
                table: "Admin",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .OldAnnotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn);

            migrationBuilder.AddColumn<int>(
                name: "TempId",
                table: "Admin",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddUniqueConstraint(
                name: "AK_Admin_TempId",
                table: "Admin",
                column: "TempId");

            migrationBuilder.AddUniqueConstraint(
                name: "AK_Admin_TempId1",
                table: "Admin",
                column: "TempId1");

            migrationBuilder.CreateIndex(
                name: "IX_classes_name_campus_location_academic_year",
                table: "classes",
                columns: new[] { "name", "campus_location", "academic_year" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Admin_schools_SchoolId",
                table: "Admin",
                column: "SchoolId",
                principalTable: "schools",
                principalColumn: "SchoolId");

            migrationBuilder.AddForeignKey(
                name: "FK_admin_roles_junction_Admin_AdminId",
                table: "admin_roles_junction",
                column: "AdminId",
                principalTable: "Admin",
                principalColumn: "TempId1",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_otp_verifications_Admin_AdminId",
                table: "otp_verifications",
                column: "AdminId",
                principalTable: "Admin",
                principalColumn: "TempId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
