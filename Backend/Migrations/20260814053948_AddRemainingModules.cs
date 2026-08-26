using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddRemainingModules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // migrationBuilder.RenameColumn(
            //     name: "UpdatedAt",
            //     table: "classes",
            //     newName: "updated_at");

            // migrationBuilder.RenameColumn(
            //     name: "ClassId",
            //     table: "classes",
            //     newName: "id");

            migrationBuilder.Sql(@"
                SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff' AND COLUMN_NAME = 'Country');
                SET @query = IF(@exist = 0, 'ALTER TABLE `staff` ADD `Country` longtext CHARACTER SET utf8mb4 NULL', 'SELECT 1');
                PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff' AND COLUMN_NAME = 'District');
                SET @query = IF(@exist = 0, 'ALTER TABLE `staff` ADD `District` longtext CHARACTER SET utf8mb4 NULL', 'SELECT 1');
                PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff' AND COLUMN_NAME = 'FatherName');
                SET @query = IF(@exist = 0, 'ALTER TABLE `staff` ADD `FatherName` longtext CHARACTER SET utf8mb4 NULL', 'SELECT 1');
                PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff' AND COLUMN_NAME = 'MaritalStatus');
                SET @query = IF(@exist = 0, 'ALTER TABLE `staff` ADD `MaritalStatus` longtext CHARACTER SET utf8mb4 NULL', 'SELECT 1');
                PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff' AND COLUMN_NAME = 'MotherName');
                SET @query = IF(@exist = 0, 'ALTER TABLE `staff` ADD `MotherName` longtext CHARACTER SET utf8mb4 NULL', 'SELECT 1');
                PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff' AND COLUMN_NAME = 'Nationality');
                SET @query = IF(@exist = 0, 'ALTER TABLE `staff` ADD `Nationality` longtext CHARACTER SET utf8mb4 NULL', 'SELECT 1');
                PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff' AND COLUMN_NAME = 'Religion');
                SET @query = IF(@exist = 0, 'ALTER TABLE `staff` ADD `Religion` longtext CHARACTER SET utf8mb4 NULL', 'SELECT 1');
                PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'departments' AND COLUMN_NAME = 'HeadOfDepartment');
                SET @query = IF(@exist = 0, 'ALTER TABLE `departments` ADD `HeadOfDepartment` varchar(150) CHARACTER SET utf8mb4 NULL', 'SELECT 1');
                PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'classes' AND COLUMN_NAME = 'Capacity');
                SET @query = IF(@exist = 0, 'ALTER TABLE `classes` ADD `Capacity` int NULL', 'SELECT 1');
                PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'classes' AND COLUMN_NAME = 'ClassTeacher');
                SET @query = IF(@exist = 0, 'ALTER TABLE `classes` ADD `ClassTeacher` longtext CHARACTER SET utf8mb4 NULL', 'SELECT 1');
                PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;
            ");

            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS `DynamicFeeStructures` (
                    `Id` int NOT NULL AUTO_INCREMENT,
                    `Name` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `Description` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `TargetAudience` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `AcademicYear` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `Branch` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `ClassName` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `Section` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `StudentCategory` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `TotalAmount` decimal(65,30) NOT NULL,
                    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
                    CONSTRAINT `PK_DynamicFeeStructures` PRIMARY KEY (`Id`)
                ) CHARACTER SET=utf8mb4;

                CREATE TABLE IF NOT EXISTS `FeeHeads` (
                    `Id` int NOT NULL AUTO_INCREMENT,
                    `Name` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `Description` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `Frequency` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `DefaultAmount` decimal(65,30) NOT NULL,
                    `IsRefundable` tinyint(1) NOT NULL,
                    `IsTaxable` tinyint(1) NOT NULL,
                    `Category` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
                    CONSTRAINT `PK_FeeHeads` PRIMARY KEY (`Id`)
                ) CHARACTER SET=utf8mb4;

                CREATE TABLE IF NOT EXISTS `FeePayments` (
                    `Id` int NOT NULL AUTO_INCREMENT,
                    `ReceiptNo` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `StudentId` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `Amount` decimal(65,30) NOT NULL,
                    `DiscountAmount` decimal(65,30) NOT NULL,
                    `FineAmount` decimal(65,30) NOT NULL,
                    `TransportFee` decimal(65,30) NOT NULL,
                    `TransactionId` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `PaymentDate` datetime(6) NOT NULL,
                    `PaymentMethod` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
                    CONSTRAINT `PK_FeePayments` PRIMARY KEY (`Id`)
                ) CHARACTER SET=utf8mb4;

                CREATE TABLE IF NOT EXISTS `StudentFeeAssignments` (
                    `Id` int NOT NULL AUTO_INCREMENT,
                    `StudentId` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `DynamicFeeStructureId` int NULL,
                    `TotalAmount` decimal(65,30) NOT NULL,
                    `PaidAmount` decimal(65,30) NOT NULL,
                    `DueAmount` decimal(65,30) NOT NULL,
                    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `FeePolicy` longtext CHARACTER SET utf8mb4 NOT NULL,
                    CONSTRAINT `PK_StudentFeeAssignments` PRIMARY KEY (`Id`)
                ) CHARACTER SET=utf8mb4;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DynamicFeeStructures");

            migrationBuilder.DropTable(
                name: "FeeHeads");

            migrationBuilder.DropTable(
                name: "FeePayments");

            migrationBuilder.DropTable(
                name: "StudentFeeAssignments");

            migrationBuilder.DropColumn(
                name: "Country",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "District",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "FatherName",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "MaritalStatus",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "MotherName",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "Nationality",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "Religion",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "HeadOfDepartment",
                table: "departments");

            migrationBuilder.DropColumn(
                name: "Capacity",
                table: "classes");

            migrationBuilder.DropColumn(
                name: "ClassTeacher",
                table: "classes");

            // migrationBuilder.RenameColumn(
            //     name: "updated_at",
            //     table: "classes",
            //     newName: "UpdatedAt");

            // migrationBuilder.RenameColumn(
            //     name: "id",
            //     table: "classes",
            //     newName: "ClassId");
        }
    }
}
