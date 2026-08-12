using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // migrationBuilder.DropForeignKey(
            //     name: "FK_transport_vehicle_assignments_TransportAttendants_AttendantId",
            //     table: "transport_vehicle_assignments");

            migrationBuilder.DropTable(
                name: "admin_roles_junction");

            migrationBuilder.DropTable(
                name: "user_roles");

            // migrationBuilder.DropIndex(
            //     name: "IX_transport_vehicle_assignments_AttendantId",
            //     table: "transport_vehicle_assignments");

            // migrationBuilder.DropColumn(
            //     name: "AcademicYear",
            //     table: "transport_vehicle_assignments");

            // migrationBuilder.DropColumn(
            //     name: "AttendantId",
            //     table: "transport_vehicle_assignments");

            // migrationBuilder.DropColumn(
            //     name: "BranchName",
            //     table: "transport_vehicle_assignments");

            // migrationBuilder.DropColumn(
            //     name: "EveningTripTime",
            //     table: "transport_vehicle_assignments");

            // migrationBuilder.DropColumn(
            //     name: "MorningTripTime",
            //     table: "transport_vehicle_assignments");

            // migrationBuilder.DropColumn(
            //     name: "BlockName",
            //     table: "hostel_wardens");

            // migrationBuilder.DropColumn(
            //     name: "EffectiveDate",
            //     table: "hostel_wardens");

            // migrationBuilder.DropColumn(
            //     name: "FloorLevel",
            //     table: "hostel_wardens");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "classes",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Remarks",
                table: "classes",
                newName: "remarks");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "classes",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "ClassId",
                table: "classes",
                newName: "id");

            migrationBuilder.AddColumn<string>(
                name: "Shift",
                table: "transport_vehicle_assignments",
                type: "varchar(20)",
                maxLength: 20,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Designation",
                table: "hostel_wardens",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "room_no",
                table: "class_sections",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "employee_competency_assessments",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    assessment_name = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    assessment_type = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    assessment_category = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    total_marks = table.Column<int>(type: "int", nullable: false),
                    passing_marks = table.Column<int>(type: "int", nullable: false),
                    grading_scheme = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    description = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    assessment_instructions = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    employee_type_filter = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    branch_filter = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    department_filter = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    designation_filter = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    scheduled_date = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    start_time = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    end_time = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    assessment_mode = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    venue = table.Column<string>(type: "varchar(250)", maxLength: 250, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    main_evaluator = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    co_evaluator = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    notify_participants = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    auto_certificates = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    add_to_calendar = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    publish_immediately = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    candidates_count = table.Column<int>(type: "int", nullable: false),
                    status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_employee_competency_assessments", x => x.id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "faculty_workshops",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    title = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    description = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    trainer_name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    organization = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    venue = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    start_date = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    end_date = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    start_time = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    end_time = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    category = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    target_role_type = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    branch = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_faculty_workshops", x => x.id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "employee_assessment_candidates",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    assessment_id = table.Column<int>(type: "int", nullable: false),
                    staff_id = table.Column<int>(type: "int", nullable: false),
                    status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    score = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    grade = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    remarks = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    certificate_issued = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    certificate_number = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    issued_date = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_employee_assessment_candidates", x => x.id);
                    table.ForeignKey(
                        name: "FK_employee_assessment_candidates_employee_competency_assessmen~",
                        column: x => x.assessment_id,
                        principalTable: "employee_competency_assessments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_employee_assessment_candidates_staff_staff_id",
                        column: x => x.staff_id,
                        principalTable: "staff",
                        principalColumn: "StaffId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "faculty_training_participations",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    workshop_id = table.Column<int>(type: "int", nullable: false),
                    staff_id = table.Column<int>(type: "int", nullable: false),
                    registration_status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    assessment_score = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    certificate_issued = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    certificate_number = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    issued_date = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_faculty_training_participations", x => x.id);
                    table.ForeignKey(
                        name: "FK_faculty_training_participations_faculty_workshops_workshop_id",
                        column: x => x.workshop_id,
                        principalTable: "faculty_workshops",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_faculty_training_participations_staff_staff_id",
                        column: x => x.staff_id,
                        principalTable: "staff",
                        principalColumn: "StaffId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_employee_assessment_candidates_assessment_id",
                table: "employee_assessment_candidates",
                column: "assessment_id");

            migrationBuilder.CreateIndex(
                name: "IX_employee_assessment_candidates_staff_id",
                table: "employee_assessment_candidates",
                column: "staff_id");

            migrationBuilder.CreateIndex(
                name: "IX_faculty_training_participations_staff_id",
                table: "faculty_training_participations",
                column: "staff_id");

            migrationBuilder.CreateIndex(
                name: "IX_faculty_training_participations_workshop_id",
                table: "faculty_training_participations",
                column: "workshop_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "employee_assessment_candidates");

            migrationBuilder.DropTable(
                name: "faculty_training_participations");

            migrationBuilder.DropTable(
                name: "employee_competency_assessments");

            migrationBuilder.DropTable(
                name: "faculty_workshops");

            migrationBuilder.DropColumn(
                name: "Shift",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropColumn(
                name: "Designation",
                table: "hostel_wardens");

            migrationBuilder.DropColumn(
                name: "room_no",
                table: "class_sections");

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
                nullable: true);

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

            migrationBuilder.CreateTable(
                name: "admin_roles_junction",
                columns: table => new
                {
                    AdminId = table.Column<int>(type: "int", nullable: false),
                    RoleId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_admin_roles_junction", x => new { x.AdminId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_admin_roles_junction_admins_AdminId",
                        column: x => x.AdminId,
                        principalTable: "admins",
                        principalColumn: "AdminId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_admin_roles_junction_roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "roles",
                        principalColumn: "RoleId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "user_roles",
                columns: table => new
                {
                    RoleId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_roles", x => new { x.RoleId, x.UserId });
                    table.ForeignKey(
                        name: "FK_user_roles_roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "roles",
                        principalColumn: "RoleId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_user_roles_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_transport_vehicle_assignments_AttendantId",
                table: "transport_vehicle_assignments",
                column: "AttendantId");

            migrationBuilder.CreateIndex(
                name: "IX_admin_roles_junction_RoleId",
                table: "admin_roles_junction",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_user_roles_UserId",
                table: "user_roles",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_transport_vehicle_assignments_TransportAttendants_AttendantId",
                table: "transport_vehicle_assignments",
                column: "AttendantId",
                principalTable: "TransportAttendants",
                principalColumn: "AttendantId");
        }
    }
}
