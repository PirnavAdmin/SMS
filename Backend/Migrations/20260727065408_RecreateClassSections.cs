using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    public partial class RecreateClassSections : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Existing database already contains the "section" table.
            // No database operation is required here.
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Nothing to reverse.
        }
    }
}