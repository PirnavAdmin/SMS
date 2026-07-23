using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAcademicClassManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "academic_class_grades",
                columns: table => new
                {
                    class_grade_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    class_grade_name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    display_order = table.Column<int>(type: "int", nullable: false),
                    status = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    is_deleted = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_academic_class_grades", x => x.class_grade_id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "academic_class_subjects",
                columns: table => new
                {
                    class_subject_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    class_grade_id = table.Column<long>(type: "bigint", nullable: false),
                    subject_id = table.Column<long>(type: "bigint", nullable: false),
                    is_deleted = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_academic_class_subjects", x => x.class_subject_id);
                    table.ForeignKey(
                        name: "FK_academic_class_subjects_academic_class_grades_class_grade_id",
                        column: x => x.class_grade_id,
                        principalTable: "academic_class_grades",
                        principalColumn: "class_grade_id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "academic_sections",
                columns: table => new
                {
                    section_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    class_grade_id = table.Column<long>(type: "bigint", nullable: false),
                    section_name = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    class_teacher_id = table.Column<long>(type: "bigint", nullable: false),
                    display_order = table.Column<int>(type: "int", nullable: false),
                    status = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    is_deleted = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_academic_sections", x => x.section_id);
                    table.ForeignKey(
                        name: "FK_academic_sections_academic_class_grades_class_grade_id",
                        column: x => x.class_grade_id,
                        principalTable: "academic_class_grades",
                        principalColumn: "class_grade_id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_academic_class_subjects_class_grade_id",
                table: "academic_class_subjects",
                column: "class_grade_id");

            migrationBuilder.CreateIndex(
                name: "IX_academic_sections_class_grade_id",
                table: "academic_sections",
                column: "class_grade_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "academic_class_subjects");

            migrationBuilder.DropTable(
                name: "academic_sections");

            migrationBuilder.DropTable(
                name: "academic_class_grades");
        }
    }
}
