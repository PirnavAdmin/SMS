using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddTeacherStudentAttendanceSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {

            // The earlier failed update already renamed the existing table and
            // removed its obsolete display columns. Continue from that state.

            migrationBuilder.Sql(@"
DROP PROCEDURE IF EXISTS RenameAttendanceTable;
CREATE PROCEDURE RenameAttendanceTable()
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE LOWER(TABLE_SCHEMA) = LOWER(DATABASE()) AND LOWER(TABLE_NAME) = 'studentattendances') THEN
        RENAME TABLE StudentAttendances TO student_attendances;
    END IF;
END;
CALL RenameAttendanceTable();
DROP PROCEDURE IF EXISTS RenameAttendanceTable;
");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "student_attendances",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "Remarks",
                table: "student_attendances",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "student_attendances",
                type: "datetime(6)",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP(6)",
                oldClrType: typeof(DateTime),
                oldType: "datetime(6)");

            migrationBuilder.AddColumn<int>(
                name: "AttendanceSessionId",
                table: "student_attendances",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "student_attendances",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "student_attendance_sessions",
                columns: table => new
                {
                    AttendanceSessionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    AttendanceDate = table.Column<DateTime>(type: "date", nullable: false),
                    BranchId = table.Column<int>(type: "int", nullable: false),
                    AcademicYearId = table.Column<int>(type: "int", nullable: false),
                    ClassId = table.Column<int>(type: "int", nullable: false),
                    SectionId = table.Column<int>(type: "int", nullable: false),
                    SubjectId = table.Column<int>(type: "int", nullable: false),
                    PeriodId = table.Column<int>(type: "int", nullable: false),
                    TimetableSlotId = table.Column<int>(type: "int", nullable: true),
                    MarkedByStaffId = table.Column<int>(type: "int", nullable: false),
                    IsLocked = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    LockedByStaffId = table.Column<int>(type: "int", nullable: true),
                    LockedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP(6)"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_attendance_sessions", x => x.AttendanceSessionId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_student_attendances_StudentId",
                table: "student_attendances",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "UX_StudentAttendance_SessionStudent",
                table: "student_attendances",
                columns: new[] { "AttendanceSessionId", "StudentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_student_attendance_sessions_AcademicYearId",
                table: "student_attendance_sessions",
                column: "AcademicYearId");

            migrationBuilder.CreateIndex(
                name: "IX_student_attendance_sessions_BranchId",
                table: "student_attendance_sessions",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_student_attendance_sessions_ClassId",
                table: "student_attendance_sessions",
                column: "ClassId");

            migrationBuilder.CreateIndex(
                name: "IX_student_attendance_sessions_MarkedByStaffId",
                table: "student_attendance_sessions",
                column: "MarkedByStaffId");

            migrationBuilder.CreateIndex(
                name: "IX_student_attendance_sessions_PeriodId",
                table: "student_attendance_sessions",
                column: "PeriodId");

            migrationBuilder.CreateIndex(
                name: "IX_student_attendance_sessions_SectionId",
                table: "student_attendance_sessions",
                column: "SectionId");

            migrationBuilder.CreateIndex(
                name: "IX_student_attendance_sessions_SubjectId",
                table: "student_attendance_sessions",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "UX_StudentAttendanceSession_Sheet",
                table: "student_attendance_sessions",
                columns: new[] { "AttendanceDate", "BranchId", "AcademicYearId", "ClassId", "SectionId", "SubjectId", "PeriodId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_student_attendances_student_attendance_sessions_AttendanceSe~",
                table: "student_attendances",
                column: "AttendanceSessionId",
                principalTable: "student_attendance_sessions",
                principalColumn: "AttendanceSessionId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_student_attendances_student_attendance_sessions_AttendanceSe~",
                table: "student_attendances");

            migrationBuilder.DropTable(
                name: "student_attendance_sessions");

            migrationBuilder.DropIndex(
                name: "IX_student_attendances_StudentId",
                table: "student_attendances");

            migrationBuilder.DropIndex(
                name: "UX_StudentAttendance_SessionStudent",
                table: "student_attendances");

            migrationBuilder.DropColumn(
                name: "AttendanceSessionId",
                table: "student_attendances");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "student_attendances");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "student_attendances",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(20)",
                oldMaxLength: 20)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "Remarks",
                table: "student_attendances",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(500)",
                oldMaxLength: 500,
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<DateTime>(
                 name: "CreatedAt",
                 table: "student_attendances",
                  type: "datetime(6)",
                  nullable: false,
                  defaultValueSql: "CURRENT_TIMESTAMP(6)",
                  oldClrType: typeof(DateTime),
                  oldType: "datetime(6)");
        }
    }
}