using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddStaffFormDetails : Migration
    {
        private static void SafeAddColumn(MigrationBuilder migrationBuilder, string table, string column, string typeDefinition)
        {
            migrationBuilder.Sql($@"
                SET @dbname = DATABASE();
                SET @tablename = '{table}';
                SET @columnname = '{column}';
                SET @preparedStatement = (SELECT IF(
                    (
                        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = @dbname
                          AND TABLE_NAME = @tablename
                          AND COLUMN_NAME = @columnname
                    ) > 0,
                    'SELECT 1',
                    'ALTER TABLE `{table}` ADD `{column}` {typeDefinition};'
                ));
                PREPARE alterIfNotExists FROM @preparedStatement;
                EXECUTE alterIfNotExists;
                DEALLOCATE PREPARE alterIfNotExists;
            ");
        }

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            SafeAddColumn(migrationBuilder, "staff", "AadhaarNumber", "longtext CHARACTER SET utf8mb4 NULL");
            SafeAddColumn(migrationBuilder, "staff", "AcademicYear", "longtext CHARACTER SET utf8mb4 NULL");
            SafeAddColumn(migrationBuilder, "staff", "AlternateMobile", "longtext CHARACTER SET utf8mb4 NULL");
            SafeAddColumn(migrationBuilder, "staff", "BloodGroup", "longtext CHARACTER SET utf8mb4 NULL");
            SafeAddColumn(migrationBuilder, "staff", "City", "longtext CHARACTER SET utf8mb4 NULL");
            SafeAddColumn(migrationBuilder, "staff", "EmploymentType", "longtext CHARACTER SET utf8mb4 NULL");
            SafeAddColumn(migrationBuilder, "staff", "IsClassTeacherEligible", "tinyint(1) NOT NULL DEFAULT 0");
            SafeAddColumn(migrationBuilder, "staff", "MiddleName", "longtext CHARACTER SET utf8mb4 NULL");
            SafeAddColumn(migrationBuilder, "staff", "PanNumber", "longtext CHARACTER SET utf8mb4 NULL");
            SafeAddColumn(migrationBuilder, "staff", "PermanentAddress", "longtext CHARACTER SET utf8mb4 NULL");
            SafeAddColumn(migrationBuilder, "staff", "PinCode", "longtext CHARACTER SET utf8mb4 NULL");
            SafeAddColumn(migrationBuilder, "staff", "PresentAddress", "longtext CHARACTER SET utf8mb4 NULL");
            SafeAddColumn(migrationBuilder, "staff", "ReportingManager", "longtext CHARACTER SET utf8mb4 NULL");
            SafeAddColumn(migrationBuilder, "staff", "State", "longtext CHARACTER SET utf8mb4 NULL");

            migrationBuilder.Sql(@"CREATE TABLE IF NOT EXISTS `staff_experiences` (
                `Id` int NOT NULL AUTO_INCREMENT,
                `StaffId` int NOT NULL,
                `PreviousOrganization` varchar(200) CHARACTER SET utf8mb4 NULL,
                `DesignationHeld` varchar(150) CHARACTER SET utf8mb4 NULL,
                `FromDate` datetime(6) NULL,
                `ToDate` datetime(6) NULL,
                `TotalExperience` varchar(50) CHARACTER SET utf8mb4 NULL,
                `ReasonForLeaving` varchar(300) CHARACTER SET utf8mb4 NULL,
                PRIMARY KEY (`Id`),
                CONSTRAINT `FK_staff_experiences_staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

            migrationBuilder.Sql(@"CREATE TABLE IF NOT EXISTS `staff_qualifications` (
                `Id` int NOT NULL AUTO_INCREMENT,
                `StaffId` int NOT NULL,
                `QualificationDegree` varchar(150) CHARACTER SET utf8mb4 NULL,
                `SpecializationSubject` varchar(150) CHARACTER SET utf8mb4 NULL,
                `InstitutionCollege` varchar(200) CHARACTER SET utf8mb4 NULL,
                `BoardUniversity` varchar(200) CHARACTER SET utf8mb4 NULL,
                `PassingYear` varchar(10) CHARACTER SET utf8mb4 NULL,
                `PercentageCgpa` varchar(20) CHARACTER SET utf8mb4 NULL,
                PRIMARY KEY (`Id`),
                CONSTRAINT `FK_staff_qualifications_staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "staff_experiences");

            migrationBuilder.DropTable(
                name: "staff_qualifications");

            migrationBuilder.DropColumn(
                name: "AadhaarNumber",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "AcademicYear",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "AlternateMobile",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "BloodGroup",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "City",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "EmploymentType",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "IsClassTeacherEligible",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "MiddleName",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "PanNumber",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "PermanentAddress",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "PinCode",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "PresentAddress",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "ReportingManager",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "State",
                table: "staff");
        }
    }
}
