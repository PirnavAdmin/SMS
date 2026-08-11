using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddClassGradeExtraColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ---------------------------------------------------------------
            // NOTE: The following operations were already performed by a
            // partial run of this migration (before it crashed) and are
            // therefore intentionally omitted here:
            //   - DropForeignKey  FK_student_attendances_students_StudentId
            //   - DropTable       exam_classes / exam_invigilator_assignments /
            //                     exam_marks / exam_results / grade_configurations /
            //                     question_papers / exam_masters / exam_schedules
            //   - DropIndex       ux_teacher_assignments_class_sec_role
            //   - RenameColumn    status→Status, remarks→Remarks,
            //                     updated_at→UpdatedAt  on 'classes'
            //   - AddColumn       (all transport/hostel/homework columns)
            //   - CreateTable     (inventory_items, uniform_*, new_exam_*,
            //                     transport_attendants, student_uniform_distributions)
            // ---------------------------------------------------------------

            // 1. Rename remaining snake_case columns on 'classes' table conditionally
            migrationBuilder.Sql(@"
                SET @exist1 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'classes' AND COLUMN_NAME = 'display_order');
                SET @query1 = IF(@exist1 > 0, 'ALTER TABLE `classes` RENAME COLUMN `display_order` TO `DisplayOrder`', 'SELECT 1');
                PREPARE stmt1 FROM @query1;
                EXECUTE stmt1;
                DEALLOCATE PREPARE stmt1;
            ");

            migrationBuilder.Sql(@"
                SET @exist2 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'classes' AND COLUMN_NAME = 'created_at');
                SET @query2 = IF(@exist2 > 0, 'ALTER TABLE `classes` RENAME COLUMN `created_at` TO `CreatedAt`', 'SELECT 1');
                PREPARE stmt2 FROM @query2;
                EXECUTE stmt2;
                DEALLOCATE PREPARE stmt2;
            ");

            migrationBuilder.Sql(@"
                SET @exist3 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'classes' AND COLUMN_NAME = 'campus_location');
                SET @query3 = IF(@exist3 > 0, 'ALTER TABLE `classes` RENAME COLUMN `campus_location` TO `CampusLocation`', 'SELECT 1');
                PREPARE stmt3 FROM @query3;
                EXECUTE stmt3;
                DEALLOCATE PREPARE stmt3;
            ");

            migrationBuilder.Sql(@"
                SET @exist4 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'classes' AND COLUMN_NAME = 'academic_year');
                SET @query4 = IF(@exist4 > 0, 'ALTER TABLE `classes` RENAME COLUMN `academic_year` TO `AcademicYear`', 'SELECT 1');
                PREPARE stmt4 FROM @query4;
                EXECUTE stmt4;
                DEALLOCATE PREPARE stmt4;
            ");

            // 2. Add BorrowerIdCode to LibraryIssueRecords (the only missing column) conditionally
            migrationBuilder.Sql(@"
                SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'LibraryIssueRecords' AND COLUMN_NAME = 'BorrowerIdCode');
                SET @query = IF(@exist = 0, 'ALTER TABLE `LibraryIssueRecords` ADD `BorrowerIdCode` longtext CHARACTER SET utf8mb4 NOT NULL DEFAULT (\'\')', 'SELECT 1');
                PREPARE stmt FROM @query;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            ");

            // 3. Make StudentId nullable in student_attendances and subject_id nullable in teacher_assignments
            migrationBuilder.Sql("ALTER TABLE `student_attendances` MODIFY COLUMN `StudentId` int NULL;");
            migrationBuilder.Sql("ALTER TABLE `teacher_assignments` MODIFY COLUMN `subject_id` int NULL;");

            // Rename name to ClassName on classes table conditionally
            migrationBuilder.Sql(@"
                SET @exist5 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'classes' AND COLUMN_NAME = 'name');
                SET @query5 = IF(@exist5 > 0, 'ALTER TABLE `classes` RENAME COLUMN `name` TO `ClassName`', 'SELECT 1');
                PREPARE stmt5 FROM @query5;
                EXECUTE stmt5;
                DEALLOCATE PREPARE stmt5;
            ");

            // 5. Alter column types / defaults on 'classes'
            migrationBuilder.Sql("ALTER TABLE `classes` MODIFY COLUMN `ClassName` varchar(100) CHARACTER SET utf8mb4 NULL;");
            migrationBuilder.Sql("ALTER TABLE `classes` MODIFY COLUMN `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);");
            migrationBuilder.Sql("ALTER TABLE `classes` MODIFY COLUMN `CampusLocation` varchar(100) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Main Campus';");
            migrationBuilder.Sql("ALTER TABLE `classes` MODIFY COLUMN `AcademicYear` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT '2026-2027';");

            // 6. Create the three examination result / grading tables that were NOT yet created
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS `new_grading_scale_rules` (
                    `rule_id` int NOT NULL AUTO_INCREMENT,
                    `exam_type` varchar(100) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'All',
                    `grade` varchar(10) CHARACTER SET utf8mb4 NOT NULL,
                    `min_marks` decimal(10,2) NOT NULL,
                    `max_marks` decimal(10,2) NOT NULL,
                    `gpa` decimal(4,2) NOT NULL,
                    `pass_fail` varchar(10) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'PASS',
                    `remarks` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
                    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT `PK_new_grading_scale_rules` PRIMARY KEY (`rule_id`)
                ) CHARACTER SET=utf8mb4;
            ");

            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS `new_student_exam_results` (
                    `result_id` int NOT NULL AUTO_INCREMENT,
                    `exam_id` int NOT NULL,
                    `class_name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
                    `section_name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
                    `student_id` int NOT NULL,
                    `roll_no` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
                    `student_name` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
                    `admission_no` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
                    `total_marks_obtained` decimal(10,2) NOT NULL,
                    `total_max_marks` decimal(10,2) NOT NULL,
                    `percentage` decimal(6,2) NOT NULL,
                    `grade` varchar(10) CHARACTER SET utf8mb4 NOT NULL,
                    `rank` int NOT NULL,
                    `result_status` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
                    `calculated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT `PK_new_student_exam_results` PRIMARY KEY (`result_id`)
                ) CHARACTER SET=utf8mb4;
            ");

            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS `new_student_marks_entries` (
                    `entry_id` int NOT NULL AUTO_INCREMENT,
                    `exam_id` int NOT NULL,
                    `class_name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
                    `section_name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
                    `subject_code` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
                    `subject_name` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
                    `roll_no` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
                    `student_name` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
                    `admission_no` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
                    `attendance_status` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Present',
                    `marks_obtained` decimal(10,2) NOT NULL,
                    `max_marks` decimal(10,2) NOT NULL,
                    `grade` varchar(10) CHARACTER SET utf8mb4 NOT NULL,
                    `evaluator_remarks` varchar(300) CHARACTER SET utf8mb4 NOT NULL,
                    `status` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Draft',
                    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT `PK_new_student_marks_entries` PRIMARY KEY (`entry_id`)
                ) CHARACTER SET=utf8mb4;
            ");

            // 7. Re-create the unique index that was dropped in the partial run conditionally
            migrationBuilder.Sql(@"
                SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teacher_assignments' AND INDEX_NAME = 'ux_teacher_assignments_class_sec_role');
                SET @query = IF(@exist = 0, 'CREATE UNIQUE INDEX `ux_teacher_assignments_class_sec_role` ON `teacher_assignments` (`class_id`, `section_letter`, `role`)', 'SELECT 1');
                PREPARE stmt FROM @query;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            ");

            // 8. Re-add the student_attendances FK (now nullable, no cascade) conditionally
            migrationBuilder.Sql(@"
                SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student_attendances' AND CONSTRAINT_NAME = 'FK_student_attendances_students_StudentId');
                SET @query = IF(@exist = 0, 'ALTER TABLE `student_attendances` ADD CONSTRAINT `FK_student_attendances_students_StudentId` FOREIGN KEY (`StudentId`) REFERENCES `students` (`student_id`)', 'SELECT 1');
                PREPARE stmt FROM @query;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            ");

            // 9. Add FK for transport_vehicle_assignments → transport_attendants conditionally
            migrationBuilder.Sql(@"
                SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transport_vehicle_assignments' AND CONSTRAINT_NAME = 'FK_transport_vehicle_assignments_TransportAttendants_AttendantId');
                SET @query = IF(@exist = 0, 'ALTER TABLE `transport_vehicle_assignments` ADD CONSTRAINT `FK_transport_vehicle_assignments_TransportAttendants_AttendantId` FOREIGN KEY (`AttendantId`) REFERENCES `transport_attendants` (`AttendantId`)', 'SELECT 1');
                PREPARE stmt FROM @query;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_student_attendances_students_StudentId",
                table: "student_attendances");

            migrationBuilder.DropForeignKey(
                name: "FK_transport_vehicle_assignments_TransportAttendants_AttendantId",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropTable(name: "new_grading_scale_rules");
            migrationBuilder.DropTable(name: "new_student_exam_results");
            migrationBuilder.DropTable(name: "new_student_marks_entries");

            migrationBuilder.DropIndex(
                name: "ux_teacher_assignments_class_sec_role",
                table: "teacher_assignments");

            migrationBuilder.DropColumn(
                name: "BorrowerIdCode",
                table: "LibraryIssueRecords");

            migrationBuilder.AlterColumn<int>(
                name: "subject_id",
                table: "teacher_assignments",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "StudentId",
                table: "student_attendances",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ClassName",
                table: "classes",
                type: "varchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "varchar(100)",
                oldMaxLength: 100,
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "classes",
                type: "datetime",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime(6)",
                oldDefaultValueSql: "CURRENT_TIMESTAMP(6)");

            migrationBuilder.AlterColumn<string>(
                name: "CampusLocation",
                table: "classes",
                type: "varchar(150)",
                maxLength: 150,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(100)",
                oldMaxLength: 100,
                oldDefaultValue: "Main Campus")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "AcademicYear",
                table: "classes",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(20)",
                oldMaxLength: 20,
                oldDefaultValue: "2026-2027")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.RenameColumn(
                name: "DisplayOrder",
                table: "classes",
                newName: "display_order");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "classes",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "CampusLocation",
                table: "classes",
                newName: "campus_location");

            migrationBuilder.RenameColumn(
                name: "AcademicYear",
                table: "classes",
                newName: "academic_year");

            migrationBuilder.AddForeignKey(
                name: "FK_student_attendances_students_StudentId",
                table: "student_attendances",
                column: "StudentId",
                principalTable: "students",
                principalColumn: "student_id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
