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

            // 1. Rename remaining snake_case columns on 'classes' table
            migrationBuilder.RenameColumn(
                name: "display_order",
                table: "classes",
                newName: "DisplayOrder");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "classes",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "campus_location",
                table: "classes",
                newName: "CampusLocation");

            migrationBuilder.RenameColumn(
                name: "academic_year",
                table: "classes",
                newName: "AcademicYear");

            // 2. Add BorrowerIdCode to LibraryIssueRecords (the only missing column)
            migrationBuilder.AddColumn<string>(
                name: "BorrowerIdCode",
                table: "LibraryIssueRecords",
                type: "longtext",
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            // 3. Make StudentId nullable in student_attendances
            migrationBuilder.AlterColumn<int>(
                name: "StudentId",
                table: "student_attendances",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            // 4. Make subject_id nullable in teacher_assignments
            migrationBuilder.AlterColumn<int>(
                name: "subject_id",
                table: "teacher_assignments",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            // 5. Alter column types / defaults on 'classes'
            migrationBuilder.AlterColumn<string>(
                name: "ClassName",
                table: "classes",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(100)",
                oldMaxLength: 100)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "classes",
                type: "datetime(6)",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP(6)",
                oldClrType: typeof(DateTime),
                oldType: "datetime");

            migrationBuilder.AlterColumn<string>(
                name: "CampusLocation",
                table: "classes",
                type: "varchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "Main Campus",
                oldClrType: typeof(string),
                oldType: "varchar(150)",
                oldMaxLength: 150)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "AcademicYear",
                table: "classes",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "2026-2027",
                oldClrType: typeof(string),
                oldType: "varchar(50)",
                oldMaxLength: 50)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            // 6. Create the three examination result / grading tables that were NOT yet created
            migrationBuilder.CreateTable(
                name: "new_grading_scale_rules",
                columns: table => new
                {
                    rule_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    exam_type = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, defaultValue: "All")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    grade = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    min_marks = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    max_marks = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    gpa = table.Column<decimal>(type: "decimal(4,2)", precision: 4, scale: 2, nullable: false),
                    pass_fail = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: false, defaultValue: "PASS")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    remarks = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    updated_at = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_new_grading_scale_rules", x => x.rule_id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "new_student_exam_results",
                columns: table => new
                {
                    result_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    exam_id = table.Column<int>(type: "int", nullable: false),
                    class_name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    section_name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    student_id = table.Column<int>(type: "int", nullable: false),
                    roll_no = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    student_name = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    admission_no = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    total_marks_obtained = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    total_max_marks = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    percentage = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: false),
                    grade = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    rank = table.Column<int>(type: "int", nullable: false),
                    result_status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    calculated_at = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_new_student_exam_results", x => x.result_id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "new_student_marks_entries",
                columns: table => new
                {
                    entry_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    exam_id = table.Column<int>(type: "int", nullable: false),
                    class_name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    section_name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    subject_code = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    subject_name = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    roll_no = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    student_name = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    admission_no = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    attendance_status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, defaultValue: "Present")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    marks_obtained = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    max_marks = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    grade = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    evaluator_remarks = table.Column<string>(type: "varchar(300)", maxLength: 300, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, defaultValue: "Draft")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    updated_at = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_new_student_marks_entries", x => x.entry_id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            // 7. Re-create the unique index that was dropped in the partial run
            migrationBuilder.CreateIndex(
                name: "ux_teacher_assignments_class_sec_role",
                table: "teacher_assignments",
                columns: new[] { "class_id", "section_letter", "role" },
                unique: true);

            // 8. Re-add the student_attendances FK (now nullable, no cascade)
            migrationBuilder.AddForeignKey(
                name: "FK_student_attendances_students_StudentId",
                table: "student_attendances",
                column: "StudentId",
                principalTable: "students",
                principalColumn: "student_id");

            // 9. Add FK for transport_vehicle_assignments → transport_attendants
            migrationBuilder.AddForeignKey(
                name: "FK_transport_vehicle_assignments_TransportAttendants_AttendantId",
                table: "transport_vehicle_assignments",
                column: "AttendantId",
                principalTable: "transport_attendants",
                principalColumn: "AttendantId");
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
