using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class FixAdmissionApplicationClassGradeForeignKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AdmissionApplications_AcademicClass_AppliedClassId",
                table: "AdmissionApplications");

            migrationBuilder.DropForeignKey(
                name: "FK_AdmissionApplications_Classes_ClassGradeClassId",
                table: "AdmissionApplications");

            migrationBuilder.DropIndex(
                name: "IX_AdmissionApplications_ClassGradeClassId",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "ClassGradeClassId",
                table: "AdmissionApplications");

            migrationBuilder.AddForeignKey(
                name: "FK_AdmissionApplications_Classes_AppliedClassId",
                table: "AdmissionApplications",
                column: "AppliedClassId",
                principalTable: "Classes",
                principalColumn: "ClassId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AdmissionApplications_Classes_AppliedClassId",
                table: "AdmissionApplications");

            migrationBuilder.AddColumn<int>(
                name: "ClassGradeClassId",
                table: "AdmissionApplications",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AdmissionApplications_ClassGradeClassId",
                table: "AdmissionApplications",
                column: "ClassGradeClassId");

            migrationBuilder.AddForeignKey(
                name: "FK_AdmissionApplications_AcademicClass_AppliedClassId",
                table: "AdmissionApplications",
                column: "AppliedClassId",
                principalTable: "AcademicClass",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AdmissionApplications_Classes_ClassGradeClassId",
                table: "AdmissionApplications",
                column: "ClassGradeClassId",
                principalTable: "Classes",
                principalColumn: "ClassId");
        }
    }
}
