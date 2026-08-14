using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddLeaveApprovalFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                name: "avatar",
                table: "students",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ApprovedBy",
                table: "leave_applications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ApproverRemarks",
                table: "leave_applications",
                type: "longtext",
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
                name: "student_images",
                columns: table => new
                {
                    file_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    student_id = table.Column<int>(type: "int", nullable: false),
                    file_name = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    stored_file_name = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    content_type = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    file_path = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    file_size = table.Column<long>(type: "bigint", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_images", x => x.file_id);
                    table.ForeignKey(
                        name: "FK_student_images_students_student_id",
                        column: x => x.student_id,
                        principalTable: "students",
                        principalColumn: "student_id",
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
                name: "IX_admin_roles_junction_RoleId",
                table: "admin_roles_junction",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_student_images_student_id",
                table: "student_images",
                column: "student_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_roles_UserId",
                table: "user_roles",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "admin_roles_junction");

            migrationBuilder.DropTable(
                name: "student_images");

            migrationBuilder.DropTable(
                name: "user_roles");

            migrationBuilder.DropColumn(
                name: "avatar",
                table: "students");

            migrationBuilder.DropColumn(
                name: "ApprovedBy",
                table: "leave_applications");

            migrationBuilder.DropColumn(
                name: "ApproverRemarks",
                table: "leave_applications");

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
        }
    }
}
