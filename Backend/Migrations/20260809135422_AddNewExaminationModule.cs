using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddNewExaminationModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Admin_schools_SchoolId",
                table: "Admin");

            migrationBuilder.DropForeignKey(
                name: "FK_admin_roles_junction_Admin_AdminId",
                table: "admin_roles_junction");

            migrationBuilder.DropForeignKey(
                name: "FK_otp_verifications_Admin_AdminId",
                table: "otp_verifications");

            migrationBuilder.DropForeignKey(
                name: "FK_students_AcademicYear_academic_year_id",
                table: "students");

            migrationBuilder.DropIndex(
                name: "IX_classes_name_campus_location_academic_year",
                table: "classes");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_Admin_TempId",
                table: "Admin");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_Admin_TempId1",
                table: "Admin");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_AcademicYear_TempId",
                table: "AcademicYear");

            migrationBuilder.DropColumn(
                name: "academic_year",
                table: "classes");

            migrationBuilder.DropColumn(
                name: "campus_location",
                table: "classes");

            migrationBuilder.DropColumn(
                name: "created_at",
                table: "classes");

            migrationBuilder.DropColumn(
                name: "display_order",
                table: "classes");

            migrationBuilder.DropColumn(
                name: "remarks",
                table: "classes");

            migrationBuilder.DropColumn(
                name: "status",
                table: "classes");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "classes");

            migrationBuilder.DropColumn(
                name: "TempId",
                table: "Admin");

            migrationBuilder.RenameTable(
                name: "Admin",
                newName: "admins");

            migrationBuilder.RenameTable(
                name: "AcademicYear",
                newName: "academic_years");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "classes",
                newName: "ClassName");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "classes",
                newName: "ClassId");

            migrationBuilder.RenameColumn(
                name: "SectionName",
                table: "class_sections",
                newName: "section_letter");

            migrationBuilder.RenameIndex(
                name: "IX_class_sections_class_id_SectionName",
                table: "class_sections",
                newName: "IX_class_sections_class_id_section_letter");

            migrationBuilder.RenameColumn(
                name: "TempId1",
                table: "admins",
                newName: "AdminId");

            migrationBuilder.RenameColumn(
                name: "TempId",
                table: "academic_years",
                newName: "academic_year_id");

            migrationBuilder.AlterColumn<string>(
                name: "ClassName",
                table: "classes",
                type: "varchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldMaxLength: 100)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "section_letter",
                table: "class_sections",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "ClassTeacherEmpId",
                table: "class_sections",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "admission_type",
                table: "admissions",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "blood_group",
                table: "admissions",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "caste",
                table: "admissions",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<long>(
                name: "created_by",
                table: "admissions",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "created_date",
                table: "admissions",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "dob",
                table: "admissions",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "father_mobile",
                table: "admissions",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "father_name",
                table: "admissions",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "gender",
                table: "admissions",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<long>(
                name: "modified_by",
                table: "admissions",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "modified_date",
                table: "admissions",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "roll_no",
                table: "admissions",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "section_letter",
                table: "admissions",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<int>(
                name: "AdminId",
                table: "admins",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "admins",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "admins",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "FullName",
                table: "admins",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<bool>(
                name: "IsEmailVerified",
                table: "admins",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsMobileVerified",
                table: "admins",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MobileNumber",
                table: "admins",
                type: "varchar(255)",
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                table: "admins",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "admins",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<int>(
                name: "academic_year_id",
                table: "academic_years",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn);

            migrationBuilder.AddColumn<string>(
                name: "academic_year_name",
                table: "academic_years",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "created_at",
                table: "academic_years",
                type: "datetime",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AddColumn<DateTime>(
                name: "end_date",
                table: "academic_years",
                type: "date",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                table: "academic_years",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_current",
                table: "academic_years",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "academic_years",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "start_date",
                table: "academic_years",
                type: "date",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "updated_at",
                table: "academic_years",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_admins",
                table: "admins",
                column: "AdminId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_academic_years",
                table: "academic_years",
                column: "academic_year_id");

            migrationBuilder.CreateTable(
                name: "teacher_assignments",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    class_id = table.Column<int>(type: "int", nullable: false),
                    section_letter = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    subject_id = table.Column<int>(type: "int", nullable: false),
                    teacher_id = table.Column<int>(type: "int", nullable: false),
                    role = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, defaultValue: "Active")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_teacher_assignments", x => x.id);
                    table.ForeignKey(
                        name: "FK_teacher_assignments_classes_class_id",
                        column: x => x.class_id,
                        principalTable: "classes",
                        principalColumn: "ClassId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_teacher_assignments_staff_teacher_id",
                        column: x => x.teacher_id,
                        principalTable: "staff",
                        principalColumn: "StaffId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_teacher_assignments_subjects_subject_id",
                        column: x => x.subject_id,
                        principalTable: "subjects",
                        principalColumn: "SubjectId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "teacher_attendance_corrections",
                columns: table => new
                {
                    CorrectionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    StaffId = table.Column<int>(type: "int", nullable: false),
                    AttendanceDate = table.Column<DateTime>(type: "date", nullable: false),
                    CurrentInTime = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CurrentOutTime = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RequestedInTime = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RequestedOutTime = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Reason = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, defaultValue: "Pending")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ApprovedRemarks = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ApprovedBy = table.Column<int>(type: "int", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_teacher_attendance_corrections", x => x.CorrectionId);
                    table.ForeignKey(
                        name: "FK_teacher_attendance_corrections_staff_StaffId",
                        column: x => x.StaffId,
                        principalTable: "staff",
                        principalColumn: "StaffId",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_class_sections_ClassTeacherEmpId",
                table: "class_sections",
                column: "ClassTeacherEmpId");

            migrationBuilder.CreateIndex(
                name: "IX_admissions_class_id",
                table: "admissions",
                column: "class_id");

            migrationBuilder.CreateIndex(
                name: "IX_admins_MobileNumber",
                table: "admins",
                column: "MobileNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_admins_SchoolId",
                table: "admins",
                column: "SchoolId");

            migrationBuilder.CreateIndex(
                name: "IX_academic_years_academic_year_name",
                table: "academic_years",
                column: "academic_year_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_teacher_assignments_subject_id",
                table: "teacher_assignments",
                column: "subject_id");

            migrationBuilder.CreateIndex(
                name: "IX_teacher_assignments_teacher_id",
                table: "teacher_assignments",
                column: "teacher_id");

            migrationBuilder.CreateIndex(
                name: "ux_teacher_assignments_class_sec_role",
                table: "teacher_assignments",
                columns: new[] { "class_id", "section_letter", "role" });

            migrationBuilder.CreateIndex(
                name: "ix_teacher_attendance_corrections_staff_date",
                table: "teacher_attendance_corrections",
                columns: new[] { "StaffId", "AttendanceDate" });

            migrationBuilder.AddForeignKey(
                name: "FK_admin_roles_junction_admins_AdminId",
                table: "admin_roles_junction",
                column: "AdminId",
                principalTable: "admins",
                principalColumn: "AdminId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_admins_schools_SchoolId",
                table: "admins",
                column: "SchoolId",
                principalTable: "schools",
                principalColumn: "SchoolId");

            migrationBuilder.AddForeignKey(
                name: "FK_class_sections_staff_ClassTeacherEmpId",
                table: "class_sections",
                column: "ClassTeacherEmpId",
                principalTable: "staff",
                principalColumn: "StaffId");

            migrationBuilder.AddForeignKey(
                name: "FK_otp_verifications_admins_AdminId",
                table: "otp_verifications",
                column: "AdminId",
                principalTable: "admins",
                principalColumn: "AdminId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_student_attendances_students_StudentId",
                table: "student_attendances",
                column: "StudentId",
                principalTable: "students",
                principalColumn: "student_id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_students_academic_years_academic_year_id",
                table: "students",
                column: "academic_year_id",
                principalTable: "academic_years",
                principalColumn: "academic_year_id",
                onDelete: ReferentialAction.Restrict);
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
                name: "FK_class_sections_staff_ClassTeacherEmpId",
                table: "class_sections");

            migrationBuilder.DropForeignKey(
                name: "FK_otp_verifications_admins_AdminId",
                table: "otp_verifications");

            migrationBuilder.DropForeignKey(
                name: "FK_student_attendances_students_StudentId",
                table: "student_attendances");

            migrationBuilder.DropForeignKey(
                name: "FK_students_academic_years_academic_year_id",
                table: "students");

            migrationBuilder.DropTable(
                name: "teacher_assignments");

            migrationBuilder.DropTable(
                name: "teacher_attendance_corrections");

            migrationBuilder.DropIndex(
                name: "IX_class_sections_ClassTeacherEmpId",
                table: "class_sections");

            migrationBuilder.DropIndex(
                name: "IX_admissions_class_id",
                table: "admissions");

            migrationBuilder.DropPrimaryKey(
                name: "PK_admins",
                table: "admins");

            migrationBuilder.DropIndex(
                name: "IX_admins_MobileNumber",
                table: "admins");

            migrationBuilder.DropIndex(
                name: "IX_admins_SchoolId",
                table: "admins");

            migrationBuilder.DropPrimaryKey(
                name: "PK_academic_years",
                table: "academic_years");

            migrationBuilder.DropIndex(
                name: "IX_academic_years_academic_year_name",
                table: "academic_years");

            migrationBuilder.DropColumn(
                name: "ClassTeacherEmpId",
                table: "class_sections");

            migrationBuilder.DropColumn(
                name: "admission_type",
                table: "admissions");

            migrationBuilder.DropColumn(
                name: "blood_group",
                table: "admissions");

            migrationBuilder.DropColumn(
                name: "caste",
                table: "admissions");

            migrationBuilder.DropColumn(
                name: "created_by",
                table: "admissions");

            migrationBuilder.DropColumn(
                name: "created_date",
                table: "admissions");

            migrationBuilder.DropColumn(
                name: "dob",
                table: "admissions");

            migrationBuilder.DropColumn(
                name: "father_mobile",
                table: "admissions");

            migrationBuilder.DropColumn(
                name: "father_name",
                table: "admissions");

            migrationBuilder.DropColumn(
                name: "gender",
                table: "admissions");

            migrationBuilder.DropColumn(
                name: "modified_by",
                table: "admissions");

            migrationBuilder.DropColumn(
                name: "modified_date",
                table: "admissions");

            migrationBuilder.DropColumn(
                name: "roll_no",
                table: "admissions");

            migrationBuilder.DropColumn(
                name: "section_letter",
                table: "admissions");

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

            migrationBuilder.DropColumn(
                name: "academic_year_name",
                table: "academic_years");

            migrationBuilder.DropColumn(
                name: "created_at",
                table: "academic_years");

            migrationBuilder.DropColumn(
                name: "end_date",
                table: "academic_years");

            migrationBuilder.DropColumn(
                name: "is_active",
                table: "academic_years");

            migrationBuilder.DropColumn(
                name: "is_current",
                table: "academic_years");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "academic_years");

            migrationBuilder.DropColumn(
                name: "start_date",
                table: "academic_years");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "academic_years");

            migrationBuilder.RenameTable(
                name: "admins",
                newName: "Admin");

            migrationBuilder.RenameTable(
                name: "academic_years",
                newName: "AcademicYear");

            migrationBuilder.RenameColumn(
                name: "ClassName",
                table: "classes",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "ClassId",
                table: "classes",
                newName: "id");

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

            migrationBuilder.RenameColumn(
                name: "academic_year_id",
                table: "AcademicYear",
                newName: "TempId");

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

            migrationBuilder.AddColumn<string>(
                name: "academic_year",
                table: "classes",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "campus_location",
                table: "classes",
                type: "varchar(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "created_at",
                table: "classes",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "display_order",
                table: "classes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "remarks",
                table: "classes",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "status",
                table: "classes",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Active")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "updated_at",
                table: "classes",
                type: "datetime(6)",
                nullable: true);

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

            migrationBuilder.AlterColumn<int>(
                name: "TempId",
                table: "AcademicYear",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .OldAnnotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn);

            migrationBuilder.AddUniqueConstraint(
                name: "AK_Admin_TempId",
                table: "Admin",
                column: "TempId");

            migrationBuilder.AddUniqueConstraint(
                name: "AK_Admin_TempId1",
                table: "Admin",
                column: "TempId1");

            migrationBuilder.AddUniqueConstraint(
                name: "AK_AcademicYear_TempId",
                table: "AcademicYear",
                column: "TempId");

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

            migrationBuilder.AddForeignKey(
                name: "FK_students_AcademicYear_academic_year_id",
                table: "students",
                column: "academic_year_id",
                principalTable: "AcademicYear",
                principalColumn: "TempId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
