using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddVehicleMaintenance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "transport_vehicle_maintenance",
                columns: table => new
                {
                    maintenance_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    vehicle_id = table.Column<long>(type: "bigint", nullable: false),
                    service_type = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    service_date = table.Column<DateTime>(type: "date", nullable: false),
                    cost = table.Column<decimal>(type: "decimal(12,2)", precision: 12, scale: 2, nullable: false, defaultValue: 0m),
                    vendor_center = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    next_service_due = table.Column<DateTime>(type: "date", nullable: true),
                    remarks = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    status = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    is_deleted = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transport_vehicle_maintenance", x => x.maintenance_id);
                    table.ForeignKey(
                        name: "FK_transport_vehicle_maintenance_transport_vehicles_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "transport_vehicles",
                        principalColumn: "vehicle_id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_transport_vehicle_maintenance_vehicle_id",
                table: "transport_vehicle_maintenance",
                column: "vehicle_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "transport_vehicle_maintenance");
        }
    }
}
