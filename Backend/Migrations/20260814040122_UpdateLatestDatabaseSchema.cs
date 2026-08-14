using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateLatestDatabaseSchema : Migration
    {
        private static void SafeDropForeignKey(MigrationBuilder migrationBuilder, string table, string fkName)
        {
            migrationBuilder.Sql($@"
                SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{table}' AND CONSTRAINT_NAME = '{fkName}');
                SET @query = IF(@exist > 0, 'ALTER TABLE `{table}` DROP FOREIGN KEY `{fkName}`', 'SELECT 1');
                PREPARE stmt FROM @query;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            ");
        }

        private static void SafeDropIndex(MigrationBuilder migrationBuilder, string table, string indexName)
        {
            migrationBuilder.Sql($@"
                SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{table}' AND INDEX_NAME = '{indexName}');
                SET @query = IF(@exist > 0, 'ALTER TABLE `{table}` DROP INDEX `{indexName}`', 'SELECT 1');
                PREPARE stmt FROM @query;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            ");
        }

        private static void SafeDropColumn(MigrationBuilder migrationBuilder, string table, string column)
        {
            migrationBuilder.Sql($@"
                SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{table}' AND COLUMN_NAME = '{column}');
                SET @query = IF(@exist > 0, 'ALTER TABLE `{table}` DROP COLUMN `{column}`', 'SELECT 1');
                PREPARE stmt FROM @query;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            ");
        }

        private static void SafeAddColumn(MigrationBuilder migrationBuilder, string table, string column, string typeDefinition)
        {
            migrationBuilder.Sql($@"
                SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{table}' AND COLUMN_NAME = '{column}');
                SET @query = IF(@exist = 0, 'ALTER TABLE `{table}` ADD `{column}` {typeDefinition}', 'SELECT 1');
                PREPARE stmt FROM @query;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            ");
        }

        private static void SafeRenameColumn(MigrationBuilder migrationBuilder, string table, string oldName, string newName)
        {
            migrationBuilder.Sql($@"
                SET @exist_old = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{table}' AND COLUMN_NAME = '{oldName}');
                SET @exist_new = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{table}' AND COLUMN_NAME = '{newName}');
                SET @query = IF(@exist_old > 0 AND @exist_new = 0, 'ALTER TABLE `{table}` RENAME COLUMN `{oldName}` TO `{newName}`', 'SELECT 1');
                PREPARE stmt FROM @query;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            ");
        }

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                SET @fk = (SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transport_vehicle_assignments' AND COLUMN_NAME = 'AttendantId' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1);
                SET @query = IF(@fk IS NOT NULL, CONCAT('ALTER TABLE `transport_vehicle_assignments` DROP FOREIGN KEY `', @fk, '`'), 'SELECT 1');
                PREPARE stmt FROM @query;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            ");

            SafeDropColumn(migrationBuilder, "transport_vehicle_assignments", "AcademicYear");
            SafeDropColumn(migrationBuilder, "transport_vehicle_assignments", "AttendantId");
            SafeDropColumn(migrationBuilder, "transport_vehicle_assignments", "BranchName");
            SafeDropColumn(migrationBuilder, "transport_vehicle_assignments", "EveningTripTime");
            SafeDropColumn(migrationBuilder, "transport_vehicle_assignments", "MorningTripTime");

            SafeDropColumn(migrationBuilder, "hostel_wardens", "BlockName");
            SafeDropColumn(migrationBuilder, "hostel_wardens", "EffectiveDate");
            SafeDropColumn(migrationBuilder, "hostel_wardens", "FloorLevel");

            SafeRenameColumn(migrationBuilder, "classes", "Status", "status");
            SafeRenameColumn(migrationBuilder, "classes", "Remarks", "remarks");
            SafeRenameColumn(migrationBuilder, "classes", "UpdatedAt", "updated_at");
            SafeRenameColumn(migrationBuilder, "classes", "ClassId", "id");

            SafeAddColumn(migrationBuilder, "transport_vehicle_assignments", "Shift", "varchar(20) CHARACTER SET utf8mb4 NULL");
            SafeAddColumn(migrationBuilder, "hostel_wardens", "Designation", "varchar(50) CHARACTER SET utf8mb4 NOT NULL DEFAULT ''''");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Shift",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropColumn(
                name: "Designation",
                table: "hostel_wardens");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "classes",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "remarks",
                table: "classes",
                newName: "Remarks");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "classes",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "classes",
                newName: "ClassId");

            migrationBuilder.AddColumn<string>(
                name: "AcademicYear",
                table: "transport_vehicle_assignments",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<long>(
                name: "AttendantId",
                table: "transport_vehicle_assignments",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BranchName",
                table: "transport_vehicle_assignments",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "EveningTripTime",
                table: "transport_vehicle_assignments",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "MorningTripTime",
                table: "transport_vehicle_assignments",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "BlockName",
                table: "hostel_wardens",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "EffectiveDate",
                table: "hostel_wardens",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FloorLevel",
                table: "hostel_wardens",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_transport_vehicle_assignments_AttendantId",
                table: "transport_vehicle_assignments",
                column: "AttendantId");

            migrationBuilder.AddForeignKey(
                name: "FK_transport_vehicle_assignments_TransportAttendants_AttendantId",
                table: "transport_vehicle_assignments",
                column: "AttendantId",
                principalTable: "TransportAttendants",
                principalColumn: "AttendantId");
        }
    }
}
