using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAcademicManagementModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // migrationBuilder.DropForeignKey(
            //     name: "FK_class_sections_classes_AcademicClassId",
            //     table: "class_sections");

            // migrationBuilder.DropForeignKey(
            //     name: "FK_class_sections_staff_ClassTeacherId",
            //     table: "class_sections");

            // migrationBuilder.DropTable(
            //     name: "class_curriculum_subjects");

            // migrationBuilder.DropIndex(
            //     name: "IX_class_sections_ClassTeacherId",
            //     table: "class_sections");

            // migrationBuilder.DropColumn(
            //     name: "ClassTeacherId",
            //     table: "class_sections");

            // migrationBuilder.RenameColumn(
            //     name: "ClassName",
            //     table: "classes",
            //     newName: "name");

            // migrationBuilder.RenameColumn(
            //     name: "ClassId",
            //     table: "classes",
            //     newName: "id");

            // migrationBuilder.RenameColumn(
            //     name: "SectionName",
            //     table: "class_sections",
            //     newName: "section_letter");

            // migrationBuilder.RenameColumn(
            //     name: "AcademicClassId",
            //     table: "class_sections",
            //     newName: "class_id");

            // migrationBuilder.RenameColumn(
            //     name: "SectionId",
            //     table: "class_sections",
            //     newName: "id");

            // migrationBuilder.RenameIndex(
            //     name: "IX_class_sections_AcademicClassId_SectionName",
            //     table: "class_sections",
            //     newName: "IX_class_sections_class_id_section_letter");

            // migrationBuilder.AlterColumn<int>(
            //     name: "class_id",
            //     table: "students",
            //     type: "int",
            //     nullable: true,
            //     oldClrType: typeof(long),
            //     oldType: "bigint");

            // migrationBuilder.AddColumn<string>(
            //     name: "roll_no",
            //     table: "students",
            //     type: "longtext",
            //     nullable: true)
            //     .Annotation("MySql:CharSet", "utf8mb4");

            // migrationBuilder.AddColumn<string>(
            //     name: "section_letter",
            //     table: "students",
            //     type: "longtext",
            //     nullable: true)
            //     .Annotation("MySql:CharSet", "utf8mb4");

            // migrationBuilder.AddColumn<int>(
            //     name: "CasualLeaveBalance",
            //     table: "staff",
            //     type: "int",
            //     nullable: false,
            //     defaultValue: 0);

            // migrationBuilder.AddColumn<int>(
            //     name: "EarnedLeaveBalance",
            //     table: "staff",
            //     type: "int",
            //     nullable: false,
            //     defaultValue: 0);

            // migrationBuilder.AddColumn<decimal>(
            //     name: "GrossSalary",
            //     table: "staff",
            //     type: "decimal(65,30)",
            //     nullable: true);

            // migrationBuilder.AddColumn<decimal>(
            //     name: "NetSalary",
            //     table: "staff",
            //     type: "decimal(65,30)",
            //     nullable: true);

            // migrationBuilder.AddColumn<DateTime>(
            //     name: "SalaryStructureEffectiveDate",
            //     table: "staff",
            //     type: "datetime(6)",
            //     nullable: true);

            // migrationBuilder.AddColumn<int>(
            //     name: "SalaryStructureId",
            //     table: "staff",
            //     type: "int",
            //     nullable: true);

            // migrationBuilder.AddColumn<string>(
            //     name: "SalaryStructureName",
            //     table: "staff",
            //     type: "longtext",
            //     nullable: true)
            //     .Annotation("MySql:CharSet", "utf8mb4");

            // migrationBuilder.AddColumn<int>(
            //     name: "SickLeaveBalance",
            //     table: "staff",
            //     type: "int",
            //     nullable: false,
            //     defaultValue: 0);

            // migrationBuilder.AddColumn<bool>(
            //     name: "EsiApplicable",
            //     table: "salary_structures",
            //     type: "tinyint(1)",
            //     nullable: false,
            //     defaultValue: false);

            // migrationBuilder.AddColumn<decimal>(
            //     name: "EsiPercentage",
            //     table: "salary_structures",
            //     type: "decimal(65,30)",
            //     nullable: false,
            //     defaultValue: 0m);

            // migrationBuilder.AddColumn<string>(
            //     name: "PayrollFrequency",
            //     table: "salary_structures",
            //     type: "longtext",
            //     nullable: false)
            //     .Annotation("MySql:CharSet", "utf8mb4");

            // migrationBuilder.AddColumn<bool>(
            //     name: "PfApplicable",
            //     table: "salary_structures",
            //     type: "tinyint(1)",
            //     nullable: false,
            //     defaultValue: false);

            // migrationBuilder.AddColumn<decimal>(
            //     name: "PfPercentage",
            //     table: "salary_structures",
            //     type: "decimal(65,30)",
            //     nullable: false,
            //     defaultValue: 0m);

            // migrationBuilder.AddColumn<decimal>(
            //     name: "ProfessionalTaxAmount",
            //     table: "salary_structures",
            //     type: "decimal(65,30)",
            //     nullable: false,
            //     defaultValue: 0m);

            // migrationBuilder.AddColumn<bool>(
            //     name: "ProfessionalTaxApplicable",
            //     table: "salary_structures",
            //     type: "tinyint(1)",
            //     nullable: false,
            //     defaultValue: false);

            // migrationBuilder.AddColumn<string>(
            //     name: "RoundOffRule",
            //     table: "salary_structures",
            //     type: "longtext",
            //     nullable: false)
            //     .Annotation("MySql:CharSet", "utf8mb4");

            // migrationBuilder.AddColumn<string>(
            //     name: "SalaryPaymentDay",
            //     table: "salary_structures",
            //     type: "longtext",
            //     nullable: false)
            //     .Annotation("MySql:CharSet", "utf8mb4");

            // migrationBuilder.AlterColumn<int>(
            //     name: "UserId",
            //     table: "otp_verifications",
            //     type: "int",
            //     nullable: true,
            //     oldClrType: typeof(int),
            //     oldType: "int");

            // migrationBuilder.AddColumn<int>(
            //     name: "AdminId",
            //     table: "otp_verifications",
            //     type: "int",
            //     nullable: true);

            migrationBuilder.UpdateData(
                table: "classes",
                keyColumn: "name",
                keyValue: null,
                column: "name",
                value: "");

            // migrationBuilder.AlterColumn<string>(
            //     name: "name",
            //     table: "classes",
            //     type: "varchar(100)",
            //     maxLength: 100,
            //     nullable: false,
            //     oldClrType: typeof(string),
            //     oldType: "longtext",
            //     oldNullable: true)
            //     .Annotation("MySql:CharSet", "utf8mb4")
            //     .OldAnnotation("MySql:CharSet", "utf8mb4");

            // migrationBuilder.AddColumn<string>(
            //     name: "academic_year",
            //     table: "classes",
            //     type: "varchar(50)",
            //     maxLength: 50,
            //     nullable: false,
            //     defaultValue: "")
            //     .Annotation("MySql:CharSet", "utf8mb4");

            // migrationBuilder.AddColumn<string>(
            //     name: "campus_location",
            //     table: "classes",
            //     type: "varchar(150)",
            //     maxLength: 150,
            //     nullable: false,
            //     defaultValue: "")
            //     .Annotation("MySql:CharSet", "utf8mb4");

            // migrationBuilder.AddColumn<DateTime>(
            //     name: "created_at",
            //     table: "classes",
            //     type: "datetime(6)",
            //     nullable: false,
            //     defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            // migrationBuilder.AddColumn<int>(
            //     name: "display_order",
            //     table: "classes",
            //     type: "int",
            //     nullable: true);

            // migrationBuilder.AddColumn<string>(
            //     name: "remarks",
            //     table: "classes",
            //     type: "longtext",
            //     nullable: true)
            //     .Annotation("MySql:CharSet", "utf8mb4");

            // migrationBuilder.AddColumn<string>(
            //     name: "status",
            //     table: "classes",
            //     type: "varchar(20)",
            //     maxLength: 20,
            //     nullable: false,
            //     defaultValue: "Active")
            //     .Annotation("MySql:CharSet", "utf8mb4");

            // migrationBuilder.AddColumn<DateTime>(
            //     name: "updated_at",
            //     table: "classes",
            //     type: "datetime(6)",
            //     nullable: true);

            // migrationBuilder.AlterColumn<string>(
            //     name: "section_letter",
            //     table: "class_sections",
            //     type: "varchar(50)",
            //     maxLength: 50,
            //     nullable: false,
            //     oldClrType: typeof(string),
            //     oldType: "varchar(255)")
            //     .Annotation("MySql:CharSet", "utf8mb4")
            //     .OldAnnotation("MySql:CharSet", "utf8mb4");

            // migrationBuilder.AddColumn<int>(
            //     name: "capacity",
            //     table: "class_sections",
            //     type: "int",
            //     nullable: false,
            //     defaultValue: 40);

            // migrationBuilder.AddColumn<string>(
            //     name: "remarks",
            //     table: "class_sections",
            //     type: "longtext",
            //     nullable: true)
            //     .Annotation("MySql:CharSet", "utf8mb4");

            // migrationBuilder.AddColumn<string>(
            //     name: "status",
            //     table: "class_sections",
            //     type: "varchar(20)",
            //     maxLength: 20,
            //     nullable: false,
            //     defaultValue: "Active")
            //     .Annotation("MySql:CharSet", "utf8mb4");

            // migrationBuilder.CreateTable(
            //     name: "admins",
            //     columns: table => new
            //     {
            //         AdminId = table.Column<int>(type: "int", nullable: false)
            //             .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
            //         FullName = table.Column<string>(type: "longtext", nullable: false)
            //             .Annotation("MySql:CharSet", "utf8mb4"),
            //         Email = table.Column<string>(type: "longtext", nullable: true)
            //             .Annotation("MySql:CharSet", "utf8mb4"),
            //         MobileNumber = table.Column<string>(type: "varchar(255)", nullable: false)
            //             .Annotation("MySql:CharSet", "utf8mb4"),
            //         PasswordHash = table.Column<string>(type: "longtext", nullable: false)
            //             .Annotation("MySql:CharSet", "utf8mb4"),
            //         Role = table.Column<string>(type: "longtext", nullable: false)
            //             .Annotation("MySql:CharSet", "utf8mb4"),
            //         IsEmailVerified = table.Column<bool>(type: "tinyint(1)", nullable: false),
            //         IsMobileVerified = table.Column<bool>(type: "tinyint(1)", nullable: false),
            //         CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
            //         SchoolId = table.Column<int>(type: "int", nullable: true)
            //     },
            //     constraints: table =>
            //     {
            //         table.PrimaryKey("PK_admins", x => x.AdminId);
            //         table.ForeignKey(
            //             name: "FK_admins_schools_SchoolId",
            //             column: x => x.SchoolId,
            //             principalTable: "schools",
            //             principalColumn: "SchoolId");
            //     })
            //     .Annotation("MySql:CharSet", "utf8mb4");

            // migrationBuilder.CreateTable(
            //     name: "class_subject_mappings",
            //     columns: table => new
            //     {
            //         id = table.Column<int>(type: "int", nullable: false)
            //             .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
            //         class_id = table.Column<int>(type: "int", nullable: false),
            //         subject_id = table.Column<int>(type: "int", nullable: false),
            //         weekly_periods = table.Column<int>(type: "int", nullable: false, defaultValue: 5)
            //     },
            //     constraints: table =>
            //     {
            //         table.PrimaryKey("PK_class_subject_mappings", x => x.id);
            //         table.ForeignKey(
            //             name: "FK_class_subject_mappings_classes_class_id",
            //             column: x => x.class_id,
            //             principalTable: "classes",
            //             principalColumn: "id",
            //             onDelete: ReferentialAction.Cascade);
            //         table.ForeignKey(
            //             name: "FK_class_subject_mappings_subjects_subject_id",
            //             column: x => x.subject_id,
            //             principalTable: "subjects",
            //             principalColumn: "SubjectId",
            //             onDelete: ReferentialAction.Restrict);
            //     })
            //     .Annotation("MySql:CharSet", "utf8mb4");

            // migrationBuilder.CreateTable(
            //     name: "employee_salary_assignments",
            //     columns: table => new
            //     {
            //         AssignmentId = table.Column<int>(type: "int", nullable: false)
            //             .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
            //         StaffId = table.Column<int>(type: "int", nullable: false),
            //         StructureId = table.Column<int>(type: "int", nullable: false),
            //         Status = table.Column<string>(type: "longtext", nullable: false)
            //             .Annotation("MySql:CharSet", "utf8mb4"),
            //         EffectiveDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
            //         AssignedDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
            //         Reason = table.Column<string>(type: "longtext", nullable: true)
            //             .Annotation("MySql:CharSet", "utf8mb4"),
            //         SalaryOverride = table.Column<bool>(type: "tinyint(1)", nullable: false),
            //         OverrideBasicSalary = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
            //         OverrideAllowances = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
            //         OverrideDeductions = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
            //         OverrideNetSalary = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
            //         UpdatedBy = table.Column<string>(type: "longtext", nullable: true)
            //             .Annotation("MySql:CharSet", "utf8mb4"),
            //         UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
            //     },
            //     constraints: table =>
            //     {
            //         table.PrimaryKey("PK_employee_salary_assignments", x => x.AssignmentId);
            //         table.ForeignKey(
            //             name: "FK_employee_salary_assignments_salary_structures_StructureId",
            //             column: x => x.StructureId,
            //             principalTable: "salary_structures",
            //             principalColumn: "StructureId",
            //             onDelete: ReferentialAction.Cascade);
            //         table.ForeignKey(
            //             name: "FK_employee_salary_assignments_staff_StaffId",
            //             column: x => x.StaffId,
            //             principalTable: "staff",
            //             principalColumn: "StaffId",
            //             onDelete: ReferentialAction.Cascade);
            //     })
            //     .Annotation("MySql:CharSet", "utf8mb4");

            // migrationBuilder.CreateTable(
            //     name: "teacher_assignments",
            //     columns: table => new
            //     {
            //         id = table.Column<int>(type: "int", nullable: false)
            //             .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
            //         class_id = table.Column<int>(type: "int", nullable: false),
            //         section_letter = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
            //             .Annotation("MySql:CharSet", "utf8mb4"),
            //         subject_id = table.Column<int>(type: "int", nullable: false),
            //         teacher_id = table.Column<int>(type: "int", nullable: false),
            //         role = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
            //             .Annotation("MySql:CharSet", "utf8mb4"),
            //         status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, defaultValue: "Active")
            //             .Annotation("MySql:CharSet", "utf8mb4")
            //     },
            //     constraints: table =>
            //     {
            //         table.PrimaryKey("PK_teacher_assignments", x => x.id);
            //         table.ForeignKey(
            //             name: "FK_teacher_assignments_classes_class_id",
            //             column: x => x.class_id,
            //             principalTable: "classes",
            //             principalColumn: "id",
            //             onDelete: ReferentialAction.Cascade);
            //         table.ForeignKey(
            //             name: "FK_teacher_assignments_staff_teacher_id",
            //             column: x => x.teacher_id,
            //             principalTable: "staff",
            //             principalColumn: "StaffId",
            //             onDelete: ReferentialAction.Restrict);
            //         table.ForeignKey(
            //             name: "FK_teacher_assignments_subjects_subject_id",
            //             column: x => x.subject_id,
            //             principalTable: "subjects",
            //             principalColumn: "SubjectId",
            //             onDelete: ReferentialAction.Cascade);
            //     })
            //     .Annotation("MySql:CharSet", "utf8mb4");

            // migrationBuilder.CreateTable(
            //     name: "admin_roles_junction",
            //     columns: table => new
            //     {
            //         AdminId = table.Column<int>(type: "int", nullable: false),
            //         RoleId = table.Column<int>(type: "int", nullable: false)
            //     },
            //     constraints: table =>
            //     {
            //         table.PrimaryKey("PK_admin_roles_junction", x => new { x.AdminId, x.RoleId });
            //         table.ForeignKey(
            //             name: "FK_admin_roles_junction_admins_AdminId",
            //             column: x => x.AdminId,
            //             principalTable: "admins",
            //             principalColumn: "AdminId",
            //             onDelete: ReferentialAction.Cascade);
            //         table.ForeignKey(
            //             name: "FK_admin_roles_junction_roles_RoleId",
            //             column: x => x.RoleId,
            //             principalTable: "roles",
            //             principalColumn: "RoleId",
            //             onDelete: ReferentialAction.Cascade);
            //     })
            //     .Annotation("MySql:CharSet", "utf8mb4");

            // migrationBuilder.CreateIndex(
            //     name: "IX_students_class_id",
            //     table: "students",
            //     column: "class_id");

            // migrationBuilder.CreateIndex(
            //     name: "IX_otp_verifications_AdminId",
            //     table: "otp_verifications",
            //     column: "AdminId");

            // migrationBuilder.CreateIndex(
            //     name: "IX_classes_name_campus_location_academic_year",
            //     table: "classes",
            //     columns: new[] { "name", "campus_location", "academic_year" },
            //     unique: true);

            // migrationBuilder.CreateIndex(
            //     name: "IX_admin_roles_junction_RoleId",
            //     table: "admin_roles_junction",
            //     column: "RoleId");

            // migrationBuilder.CreateIndex(
            //     name: "IX_admins_MobileNumber",
            //     table: "admins",
            //     column: "MobileNumber",
            //     unique: true);

            // migrationBuilder.CreateIndex(
            //     name: "IX_admins_SchoolId",
            //     table: "admins",
            //     column: "SchoolId");

            migrationBuilder.CreateIndex(
                name: "IX_class_subject_mappings_class_id_subject_id",
                table: "class_subject_mappings",
                columns: new[] { "class_id", "subject_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_class_subject_mappings_subject_id",
                table: "class_subject_mappings",
                column: "subject_id");

            // migrationBuilder.CreateIndex(
            //     name: "IX_employee_salary_assignments_StaffId",
            //     table: "employee_salary_assignments",
            //     column: "StaffId");

            // migrationBuilder.CreateIndex(
            //     name: "IX_employee_salary_assignments_StructureId",
            //     table: "employee_salary_assignments",
            //     column: "StructureId");

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

            migrationBuilder.AddForeignKey(
                name: "FK_class_sections_classes_class_id",
                table: "class_sections",
                column: "class_id",
                principalTable: "classes",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            // migrationBuilder.AddForeignKey(
            //     name: "FK_otp_verifications_admins_AdminId",
            //     table: "otp_verifications",
            //     column: "AdminId",
            //     principalTable: "admins",
            //     principalColumn: "AdminId",
            //     onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_students_classes_class_id",
                table: "students",
                column: "class_id",
                principalTable: "classes",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_class_sections_classes_class_id",
                table: "class_sections");

            migrationBuilder.DropForeignKey(
                name: "FK_otp_verifications_admins_AdminId",
                table: "otp_verifications");

            migrationBuilder.DropForeignKey(
                name: "FK_students_classes_class_id",
                table: "students");

            migrationBuilder.DropTable(
                name: "admin_roles_junction");

            migrationBuilder.DropTable(
                name: "class_subject_mappings");

            migrationBuilder.DropTable(
                name: "employee_salary_assignments");

            migrationBuilder.DropTable(
                name: "teacher_assignments");

            migrationBuilder.DropTable(
                name: "admins");

            migrationBuilder.DropIndex(
                name: "IX_students_class_id",
                table: "students");

            migrationBuilder.DropIndex(
                name: "IX_otp_verifications_AdminId",
                table: "otp_verifications");

            migrationBuilder.DropIndex(
                name: "IX_classes_name_campus_location_academic_year",
                table: "classes");

            migrationBuilder.DropColumn(
                name: "roll_no",
                table: "students");

            migrationBuilder.DropColumn(
                name: "section_letter",
                table: "students");

            migrationBuilder.DropColumn(
                name: "CasualLeaveBalance",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "EarnedLeaveBalance",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "GrossSalary",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "NetSalary",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "SalaryStructureEffectiveDate",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "SalaryStructureId",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "SalaryStructureName",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "SickLeaveBalance",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "EsiApplicable",
                table: "salary_structures");

            migrationBuilder.DropColumn(
                name: "EsiPercentage",
                table: "salary_structures");

            migrationBuilder.DropColumn(
                name: "PayrollFrequency",
                table: "salary_structures");

            migrationBuilder.DropColumn(
                name: "PfApplicable",
                table: "salary_structures");

            migrationBuilder.DropColumn(
                name: "PfPercentage",
                table: "salary_structures");

            migrationBuilder.DropColumn(
                name: "ProfessionalTaxAmount",
                table: "salary_structures");

            migrationBuilder.DropColumn(
                name: "ProfessionalTaxApplicable",
                table: "salary_structures");

            migrationBuilder.DropColumn(
                name: "RoundOffRule",
                table: "salary_structures");

            migrationBuilder.DropColumn(
                name: "SalaryPaymentDay",
                table: "salary_structures");

            migrationBuilder.DropColumn(
                name: "AdminId",
                table: "otp_verifications");

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
                name: "capacity",
                table: "class_sections");

            migrationBuilder.DropColumn(
                name: "remarks",
                table: "class_sections");

            migrationBuilder.DropColumn(
                name: "status",
                table: "class_sections");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "classes",
                newName: "ClassName");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "classes",
                newName: "ClassId");

            migrationBuilder.RenameColumn(
                name: "section_letter",
                table: "class_sections",
                newName: "SectionName");

            migrationBuilder.RenameColumn(
                name: "class_id",
                table: "class_sections",
                newName: "AcademicClassId");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "class_sections",
                newName: "SectionId");

            migrationBuilder.RenameIndex(
                name: "IX_class_sections_class_id_section_letter",
                table: "class_sections",
                newName: "IX_class_sections_AcademicClassId_SectionName");

            migrationBuilder.AlterColumn<long>(
                name: "class_id",
                table: "students",
                type: "bigint",
                nullable: false,
                defaultValue: 0L,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "otp_verifications",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ClassName",
                table: "classes",
                type: "longtext",
                nullable: true,
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

            migrationBuilder.AddColumn<int>(
                name: "ClassTeacherId",
                table: "class_sections",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "class_curriculum_subjects",
                columns: table => new
                {
                    ClassId = table.Column<int>(type: "int", nullable: false),
                    SubjectId = table.Column<int>(type: "int", nullable: false),
                    ClassGradeClassId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_class_curriculum_subjects", x => new { x.ClassId, x.SubjectId });
                    table.ForeignKey(
                        name: "FK_class_curriculum_subjects_classes_ClassGradeClassId",
                        column: x => x.ClassGradeClassId,
                        principalTable: "classes",
                        principalColumn: "ClassId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_class_curriculum_subjects_subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "subjects",
                        principalColumn: "SubjectId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_class_sections_ClassTeacherId",
                table: "class_sections",
                column: "ClassTeacherId");

            migrationBuilder.CreateIndex(
                name: "IX_class_curriculum_subjects_ClassGradeClassId",
                table: "class_curriculum_subjects",
                column: "ClassGradeClassId");

            migrationBuilder.CreateIndex(
                name: "IX_class_curriculum_subjects_SubjectId",
                table: "class_curriculum_subjects",
                column: "SubjectId");

            migrationBuilder.AddForeignKey(
                name: "FK_class_sections_classes_AcademicClassId",
                table: "class_sections",
                column: "AcademicClassId",
                principalTable: "classes",
                principalColumn: "ClassId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_class_sections_staff_ClassTeacherId",
                table: "class_sections",
                column: "ClassTeacherId",
                principalTable: "staff",
                principalColumn: "StaffId",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
