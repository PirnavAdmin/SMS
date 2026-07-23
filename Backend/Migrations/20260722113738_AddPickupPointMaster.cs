using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddPickupPointMaster : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "transport_pickup_points",
                columns: table => new
                {
                    pickup_point_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    route_id = table.Column<long>(type: "bigint", nullable: false),
                    pickup_point_name = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    landmark = table.Column<string>(type: "varchar(250)", maxLength: 250, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    sequence_no = table.Column<int>(type: "int", nullable: false),
                    pickup_time = table.Column<TimeSpan>(type: "time(6)", nullable: false),
                    distance_from_start = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    status = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    is_deleted = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transport_pickup_points", x => x.pickup_point_id);
                    table.ForeignKey(
                        name: "FK_transport_pickup_points_transport_routes_route_id",
                        column: x => x.route_id,
                        principalTable: "transport_routes",
                        principalColumn: "route_id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_transport_pickup_points_route_id_pickup_point_name",
                table: "transport_pickup_points",
                columns: new[] { "route_id", "pickup_point_name" });

            migrationBuilder.CreateIndex(
                name: "IX_transport_pickup_points_route_id_sequence_no",
                table: "transport_pickup_points",
                columns: new[] { "route_id", "sequence_no" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "transport_pickup_points");
        }
    }
}
