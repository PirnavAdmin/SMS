using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    public partial class FixSectionTableMapping : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The existing database already uses the "section" table.
            // No schema operation is required.
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No rollback operation required.
        }
    }
}